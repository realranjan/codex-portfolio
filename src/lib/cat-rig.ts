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
export const RAW_NECK_PIVOT_Y = -0.185;
export const STAGE_CENTER_Y = -0.05;

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
 * target height, stage center, and shared neck pivot so layered hover reveals align.
 */
export function computeDualLayerAlignment(
  cuteBounds: BoxBoundsLike,
  samuraiBounds: BoxBoundsLike,
  targetHeight = CAT_MODEL_HEIGHT
): DualLayerAlignment {
  const cuteSizeY = Math.max(0.001, cuteBounds.max[1] - cuteBounds.min[1]);
  const samuraiSizeY = Math.max(0.001, samuraiBounds.max[1] - samuraiBounds.min[1]);

  const cuteScale = targetHeight / cuteSizeY;
  const samuraiScale = targetHeight / samuraiSizeY;

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
    cuteCenterOffset: [-cuteCenter[0] || 0, -cuteCenter[1] || 0, -cuteCenter[2] || 0],
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
 * toward the viewport pointer (`[-1..1]`), with natural anatomical yaw/pitch clamps.
 */
export function computeSegmentedLookAngles(params: {
  pointerX: number;
  pointerY: number;
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

  const heroYawBias = headBiasX * 0.38 * (1 - pullbackMix * 0.92);
  const heroPitchBias = headBiasY * 0.35 * (1 - pullbackMix * 0.9);
  const dragAttenuation = 1 - centerMix * 0.55;

  if (reducedMotion) {
    const yaw = clamp(heroYawBias + dragYaw * dragAttenuation, -0.78, 0.78);
    const pitch = clamp(-(heroPitchBias + dragPitch * dragAttenuation), -0.42, 0.42);
    return {
      headYaw: yaw,
      headPitch: pitch,
      bodyYaw: yaw * 0.14,
      bodyPitch: pitch * 0.08,
    };
  }

  const gazeSpanX = 0.62 + 0.18 * carouselMix;
  const gazeSpanY = 0.36 + 0.08 * carouselMix;

  // Even outside initial pointer move or idle, cursor position drives look continuously;
  // gentle ambient idle breath only mixes in slightly when pointer has not entered yet.
  const idleYaw = pointerActive ? 0 : 0.14 * Math.sin(0.55 * elapsed);
  const idlePitch = pointerActive ? 0 : 0.05 * Math.cos(0.42 * elapsed);

  const targetYaw = clamp(
    pointerX * gazeSpanX + idleYaw + heroYawBias + dragYaw * dragAttenuation,
    -0.82,
    0.82
  );
  // Three.js +X rotation tilts +Z downward, so looking UP (+pointerY) is negative rotation.x
  const targetPitch = clamp(
    -(pointerY * gazeSpanY + idlePitch + heroPitchBias + dragPitch * dragAttenuation),
    -0.46,
    0.46
  );

  return {
    headYaw: targetYaw,
    headPitch: targetPitch,
    bodyYaw: targetYaw * 0.14,
    bodyPitch: targetPitch * 0.08,
  };
}
