export type CatSegmentRole = "head" | "body";

export interface BoxBoundsLike {
  min: readonly [number, number, number];
  max: readonly [number, number, number];
}

export interface DualLayerAlignment {
  facingRotationY: number;
  targetHeight: number;
  cuteScale: number;
  samuraiScale: number;
  cuteCenterOffset: readonly [number, number, number];
  samuraiCenterOffset: readonly [number, number, number];
  neckPivotY: number;
}

export interface SegmentedLookAngles {
  headYaw: number;
  headPitch: number;
  bodyYaw: number;
  bodyPitch: number;
}

/**
 * Samurai cat exports 13 sub-meshes (`tripo_part_0`..`tripo_part_12`).
 * These 6 parts constitute the helmet, ears/horns, visor, and face/chin mask;
 * the remaining 7 parts (`tripo_part_1..3,5,7,11,12`) constitute the armored body and paws.
 */
export const SAMURAI_HELMET_PARTS: ReadonlySet<string> = new Set([
  "tripo_part_0",
  "tripo_part_4",
  "tripo_part_6",
  "tripo_part_8",
  "tripo_part_9",
  "tripo_part_10",
]);

export const CUTE_HEAD_PARTS: ReadonlySet<string> = new Set(["tripo_part_0"]);

export const CAT_MODEL_HEIGHT = 2.95;
export const CAT_FACING_ROTATION_Y = -Math.PI / 2;
export const RAW_NECK_PIVOT_Y = -0.175;
export const STAGE_CENTER_Y = -0.05;
/** Match Cute Cat 1:1 on height (Y axis) and proportions to Samurai Cat */
export const CUTE_INNER_SCALE_RATIO = 1.0;
export const CUTE_DEPTH_TUCK_RAW = -0.045;

export function classifyCuteSegment(name: string, centerY: number): CatSegmentRole {
  if (CUTE_HEAD_PARTS.has(name)) return "head";
  if (name === "tripo_part_1") return "body";
  return centerY >= -0.05 ? "head" : "body";
}

export function classifySamuraiSegment(name: string, centerY: number): CatSegmentRole {
  if (SAMURAI_HELMET_PARTS.has(name)) return "head";
  if (
    name === "tripo_part_1" ||
    name === "tripo_part_2" ||
    name === "tripo_part_3" ||
    name === "tripo_part_5" ||
    name === "tripo_part_7" ||
    name === "tripo_part_11" ||
    name === "tripo_part_12"
  ) {
    return "body";
  }
  return centerY >= -0.12 ? "head" : "body";
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(min, value));
}

/**
 * Registers both rotated bounding boxes cleanly onto the exact same front-facing
 * orientation, face plane, and shared neck pivot so Cute Cat nests cleanly inside Samurai Cat.
 */
export function computeDualLayerAlignment(
  cuteBounds: BoxBoundsLike,
  samuraiBounds: BoxBoundsLike,
  targetHeight = CAT_MODEL_HEIGHT
): DualLayerAlignment {
  const cuteSizeY = Math.max(0.001, cuteBounds.max[1] - cuteBounds.min[1]);
  const samuraiSizeY = Math.max(0.001, samuraiBounds.max[1] - samuraiBounds.min[1]);

  const samuraiScale = targetHeight / samuraiSizeY;
  const cuteScale = (targetHeight * CUTE_INNER_SCALE_RATIO) / cuteSizeY;

  const cuteCenter: readonly [number, number, number] = [
    (cuteBounds.min[0] + cuteBounds.max[0]) * 0.5,
    (cuteBounds.min[1] + cuteBounds.max[1]) * 0.5,
    (cuteBounds.min[2] + cuteBounds.max[2]) * 0.5,
  ];
  const samuraiCenter: readonly [number, number, number] = [
    (samuraiBounds.min[0] + samuraiBounds.max[0]) * 0.5,
    (samuraiBounds.min[1] + samuraiBounds.max[1]) * 0.5,
    (samuraiBounds.min[2] + samuraiBounds.max[2]) * 0.5,
  ];

  return {
    facingRotationY: CAT_FACING_ROTATION_Y,
    targetHeight,
    cuteScale,
    samuraiScale,
    cuteCenterOffset: [
      -cuteCenter[0] || 0,
      -cuteCenter[1] || 0,
      -cuteCenter[2] + CUTE_DEPTH_TUCK_RAW || 0,
    ],
    samuraiCenterOffset: [
      -samuraiCenter[0] || 0,
      -samuraiCenter[1] || 0,
      -samuraiCenter[2] || 0,
    ],
    neckPivotY: STAGE_CENTER_Y + RAW_NECK_PIVOT_Y * targetHeight,
  };
}

/**
 * Computes synchronized head + subtle body rotation for both layered cat rigs
 * relative to the cat's projected screen position and camera sightline, so hovering
 * directly on the cat looks straight at the cursor and moving anywhere guides gaze accurately.
 */
export function computeSegmentedLookAngles(params: {
  pointerX: number;
  pointerY: number;
  modelScreenX?: number;
  modelScreenY?: number;
  cameraFacingYaw?: number;
  cameraFacingPitch?: number;
  pointerActive: boolean;
  elapsed: number;
  headBiasX: number;
  headBiasY: number;
  dragYaw: number;
  dragPitch: number;
  centerMix: number;
  carouselMix: number;
  pullbackMix: number;
  reducedMotion: boolean;
}): SegmentedLookAngles {
  const {
    pointerX,
    pointerY,
    modelScreenX = 0,
    modelScreenY = 0,
    cameraFacingYaw = 0,
    cameraFacingPitch = 0,
    pointerActive,
    elapsed,
    headBiasX,
    headBiasY,
    dragYaw,
    dragPitch,
    centerMix,
    carouselMix,
    pullbackMix,
    reducedMotion,
  } = params;

  const heroYawBias = headBiasX * 0.34 * (1 - pullbackMix * 0.92);
  const heroPitchBias = headBiasY * 0.3 * (1 - pullbackMix * 0.9);
  const dragAttenuation = 1 - centerMix * 0.55;

  if (reducedMotion) {
    const yaw = clamp(
      cameraFacingYaw + heroYawBias + dragYaw * dragAttenuation,
      -0.78,
      0.78
    );
    const pitch = clamp(
      cameraFacingPitch - (heroPitchBias + dragPitch * dragAttenuation),
      -0.42,
      0.42
    );
    return {
      headYaw: yaw,
      headPitch: pitch,
      bodyYaw: yaw * 0.14,
      bodyPitch: pitch * 0.08,
    };
  }

  // Offset pointer relative to the cat's current face screen position (`modelScreenX/Y`)
  const relX = clamp((pointerX - modelScreenX) / 1.05, -1.25, 1.25);
  const relY = clamp((pointerY - modelScreenY) / 0.95, -1.1, 1.1);

  const gazeSpanX = 0.56 + 0.16 * carouselMix;
  const gazeSpanY = 0.34 + 0.08 * carouselMix;

  const idleYaw = pointerActive ? 0 : 0.08 * Math.sin(0.55 * elapsed);
  const idlePitch = pointerActive ? 0 : 0.04 * Math.cos(0.42 * elapsed);

  const targetYaw = clamp(
    cameraFacingYaw +
      (pointerActive ? relX * gazeSpanX : 0) +
      idleYaw +
      heroYawBias +
      dragYaw * dragAttenuation,
    -0.84,
    0.84
  );
  const targetPitch = clamp(
    cameraFacingPitch -
      ((pointerActive ? relY * gazeSpanY : 0) +
        idlePitch +
        heroPitchBias +
        dragPitch * dragAttenuation),
    -0.46,
    0.46
  );

  return {
    headYaw: targetYaw,
    headPitch: targetPitch,
    bodyYaw: cameraFacingYaw * 0.35 + (targetYaw - cameraFacingYaw) * 0.14,
    bodyPitch: targetPitch * 0.08,
  };
}
