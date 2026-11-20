import type { JourneyMilestone, MountainPoint } from "../data/experience-journey";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURE 2.5D MOUNTAIN JOURNEY KINEMATICS & VIRTUAL CAMERA ENGINE
 * -------------------------------------------------------------------------------
 * Zero DOM or React dependencies. Given a single normalized scroll progress
 * [0..1], computes:
 *  - Smooth monotonic dwell-eased trail parameter across 3 milestones
 *  - Catmull-Rom world coordinates & slope tangent for the walking traveler cat
 *  - 6-scene narrative phase classification (Beginning -> Stops -> Pullback)
 *  - Virtual camera pan (X, Y) and controlled zoom/pullback scale
 *  - Independent 7-layer parallax offsets (0.14x distant peaks -> 1.38x fg pines)
 *  - Ridge-occlusion reveal progress for milestones emerging behind mountain bends
 *  - Scroll-coupled 8-frame walk-cycle stepping & facing direction
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type JourneyScenePhase =
  | "beginning"
  | "stop-01"
  | "mountain-bend"
  | "stop-02"
  | "stop-03"
  | "ending";

export interface LayerTransformPose {
  /** Horizontal offset in px */
  readonly xPx: number;
  /** Vertical offset in px */
  readonly yPx: number;
  /** Subtle depth scale */
  readonly scale: number;
}

export interface MountainJourneyPose {
  readonly rawProgress: number;
  readonly trailT: number;
  readonly scenePhase: JourneyScenePhase;
  /** Opacity [0..1] for the Scene 01 opening headline before the journey climbs */
  readonly introOpacity: number;
  /** Subtle vertical lift in px as the opening headline clears */
  readonly introTranslateYPx: number;
  /** Index of the nearest milestone (0..2) */
  readonly activeMilestoneIndex: number;
  /** ID of the nearest milestone */
  readonly activeMilestoneId: string;
  /** ID of the milestone the traveler has currently arrived at, or null between stops */
  readonly reachedMilestoneId: string | null;
  /** Proximity [0..1] to the active milestone (1 = settled directly beside marker) */
  readonly milestoneSettle: number;
  /** Traveler cat world coordinates in 3000 x 900 space */
  readonly catWorld: MountainPoint;
  /** Trail slope angle in degrees (clamped gently for natural uphill/downhill lean) */
  readonly catSlopeDeg: number;
  /** Subtle perspective scale for the cat based on trail elevation */
  readonly catDepthScale: number;
  /** Virtual camera center in world coordinates */
  readonly cameraFocusWorld: MountainPoint;
  /** Virtual camera controlled scale (1.00 start -> ~1.06 pass -> 0.90 scenic pullback) */
  readonly cameraScale: number;
  /** Primary trail plane horizontal translation in px relative to viewport */
  readonly worldPanXPx: number;
  /** Primary trail plane vertical translation in px relative to viewport */
  readonly worldPanYPx: number;
  /** Independent 2.5D depth-plane transforms */
  readonly layers: {
    readonly farMountains: LayerTransformPose;
    readonly mistBand: LayerTransformPose;
    readonly midRidges: LayerTransformPose;
    readonly trailWorld: LayerTransformPose;
    readonly occludingRidge: LayerTransformPose;
    readonly fgPines: LayerTransformPose;
  };
  /** Per-milestone reveal factor [0..1] accounting for ridge occlusion */
  readonly milestoneReveal: readonly number[];
}

export interface TravelerAnimationInput {
  readonly prevProgress: number;
  readonly nextProgress: number;
  readonly prevAccumulatedDistance: number;
  readonly prevFacing: "forward" | "backward";
  /** Approximate total trail distance in world units (used to convert progress delta into strides) */
  readonly totalTrailUnits?: number;
  /** World units per walk frame step */
  readonly unitsPerFrame?: number;
  /** Total number of walk cycle frames */
  readonly frameCount?: number;
}

export interface TravelerAnimationOutput {
  readonly accumulatedDistance: number;
  readonly facing: "forward" | "backward";
  readonly walkFrame: number;
  readonly isMoving: boolean;
  readonly deltaProgress: number;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Evaluates a Catmull-Rom spline through arbitrary 2D points at global parameter t in [0..1].
 */
export function evaluateMountainSpline(
  points: readonly MountainPoint[],
  t: number
): MountainPoint {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0 };
  if (n === 1) return { x: points[0].x, y: points[0].y };

  const clamped = clamp01(t);
  const scaled = clamped * (n - 1);
  const seg = Math.min(n - 2, Math.floor(scaled));
  const u = scaled - seg;

  const p0 = points[Math.max(0, seg - 1)];
  const p1 = points[seg];
  const p2 = points[Math.min(n - 1, seg + 1)];
  const p3 = points[Math.min(n - 1, seg + 2)];

  const u2 = u * u;
  const u3 = u2 * u;

  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * u +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);

  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * u +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3);

  return { x, y };
}

/**
 * Builds an SVG `<path d="...">` string tracing the exact Catmull-Rom mountain footpath.
 */
export function buildMountainTrailSvgPath(
  points: readonly MountainPoint[],
  subdivisions = 120
): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  }

  const steps = Math.max(24, Math.floor(subdivisions));
  const commands: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const pt = evaluateMountainSpline(points, i / steps);
    commands.push(`${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
  }
  return commands.join(" ");
}

/**
 * Applies smooth monotonic dwell plateaus around the milestone stops so the
 * traveler visibly slows and settles when arriving at iMerit, Haegl Tech, and RYVO
 * while remaining strictly monotonic (100% reversible on backward scroll).
 */
export function applyJourneyMilestoneDwell(
  rawProgress: number,
  milestoneStops: readonly number[]
): number {
  const p = clamp01(rawProgress);
  if (milestoneStops.length === 0) return p;

  // Sum of gentle localized Gaussian-derivative slowdown bumps around each stop.
  // Kept bounded so d(eased)/dp > 0.25 everywhere (never reverses or locks scroll).
  const sigma = 0.055;
  const maxPull = 0.022;
  let offset = 0;

  for (const stop of milestoneStops) {
    const d = p - stop;
    const bell = Math.exp(-(d * d) / (2 * sigma * sigma));
    offset -= maxPull * (d / sigma) * bell;
  }

  // Keep endpoints pinned exactly at 0 and 1
  const edgeFade = smoothstep(0, 0.06, p) * (1 - smoothstep(0.94, 1, p));
  return clamp01(p + offset * edgeFade);
}

/**
 * Maps a raw scroll progress into one of the six choreographed story scenes.
 */
export function classifyJourneyScenePhase(rawProgress: number): JourneyScenePhase {
  const p = clamp01(rawProgress);
  if (p < 0.12) return "beginning";
  if (p < 0.34) return "stop-01";
  if (p < 0.45) return "mountain-bend";
  if (p < 0.67) return "stop-02";
  if (p < 0.89) return "stop-03";
  return "ending";
}

/**
 * Returns the ID of the checkpoint the traveler has currently reached along the
 * trail, or null while walking through the opening trailhead, open bends, or
 * ending pullback. Keeps Scene 01 intro headline and checkpoint readouts clean
 * and non-overlapping.
 */
export function getReachedMilestoneId(
  rawProgress: number,
  milestones: readonly JourneyMilestone[],
  arrivalRadius = 0.085
): string | null {
  const p = clamp01(rawProgress);
  let bestId: string | null = null;
  let bestDist = Infinity;

  for (const m of milestones) {
    const dist = Math.abs(p - m.trailStop);
    if (dist <= arrivalRadius && dist < bestDist) {
      bestDist = dist;
      bestId = m.id;
    }
  }
  return bestId;
}

/**
 * Computes the complete 2.5D virtual camera pose, cat world position, and 7-layer
 * parallax transforms from a single scroll progress value [0..1].
 */
export function computeMountainJourneyPose(
  rawProgress: number,
  trailPoints: readonly MountainPoint[],
  milestones: readonly JourneyMilestone[],
  viewportWidth = 1440,
  viewportHeight = 900,
  worldWidth = 3000,
  worldHeight = 900
): MountainJourneyPose {
  const raw = clamp01(rawProgress);
  const stops = milestones.map((m) => m.trailStop);
  const trailT = applyJourneyMilestoneDwell(raw, stops);
  const scenePhase = classifyJourneyScenePhase(raw);

  // Scene 01 intro headline settles cleanly at start, then fades away before Stop 01
  const introFade = 1 - smoothstep(0.05, 0.16, raw);
  const introTranslateYPx = Number((-24 * (1 - introFade)).toFixed(2));

  // Evaluate traveler cat position and gentle terrain slope on the mountain trail
  const catWorld = evaluateMountainSpline(trailPoints, trailT);
  const eps = 0.004;
  const before = evaluateMountainSpline(trailPoints, Math.max(0, trailT - eps));
  const after = evaluateMountainSpline(trailPoints, Math.min(1, trailT + eps));
  const rawSlopeDeg = (Math.atan2(after.y - before.y, after.x - before.x) * 180) / Math.PI;
  // Restrain cat tilt so the character always looks grounded, never tipped awkwardly
  const catSlopeDeg = Number(clamp(rawSlopeDeg * 0.45, -11, 11).toFixed(2));

  // Subtle depth scaling: slightly larger at lower foreground trailhead, slightly smaller higher up pass
  const elevationNorm = clamp01((catWorld.y - 440) / 260);
  const catDepthScale = Number(lerp(0.92, 1.06, elevationNorm).toFixed(4));

  // Active milestone & settle strength
  let activeMilestoneIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < milestones.length; i++) {
    const dist = Math.abs(raw - milestones[i].trailStop);
    if (dist < bestDist) {
      bestDist = dist;
      activeMilestoneIndex = i;
    }
  }
  const activeMilestoneId = milestones[activeMilestoneIndex]?.id ?? "";
  const reachedMilestoneId = getReachedMilestoneId(raw, milestones);
  const milestoneSettle = Number(clamp01(1 - bestDist / 0.11).toFixed(4));

  // Virtual camera framing:
  // Lead the traveler slightly ahead on the trail so upcoming bends & markers feel inviting,
  // and pull back gently during Scene 06 Ending (0.88..1.00) to reveal the route traveled.
  const endingPullback = smoothstep(0.87, 1.0, raw);
  const passPresence =
    smoothstep(0.12, 0.35, raw) * (1 - endingPullback * 0.85);

  // Restrained zoom: 1.00 at arrival -> ~1.045 through the mountain pass -> 0.93 at scenic ending
  const cameraScale = Number(
    (1.0 + passPresence * 0.045 - endingPullback * 0.07).toFixed(4)
  );

  // Lead camera slightly right of cat so upcoming terrain breathes ahead,
  // centering calmly during Scene 06 pullback
  const lookAheadX = lerp(175, -130, endingPullback);
  const targetFocusX = clamp(
    catWorld.x + lookAheadX,
    viewportWidth * 0.46,
    worldWidth - viewportWidth * 0.46
  );
  // Anchor camera vertically slightly above the footpath so the trail rests cleanly
  // in the lower ~35% of the viewport and the upper sky stays wide and calm
  const targetFocusY = clamp(
    lerp(catWorld.y - 165, worldHeight * 0.50, endingPullback * 0.45),
    worldHeight * 0.44,
    worldHeight * 0.58
  );

  // Pan of the 1.0x trail world relative to the viewport center
  const worldPanXPx = Number((viewportWidth * 0.5 - targetFocusX).toFixed(2));
  const worldPanYPx = Number((viewportHeight * 0.5 - targetFocusY).toFixed(2));

  // Relative pan delta from starting camera position so parallax layers start framed cleanly
  const startFocusX = clamp(
    (trailPoints[0]?.x ?? 210) + 175,
    viewportWidth * 0.46,
    worldWidth - viewportWidth * 0.46
  );
  const startFocusY = clamp(
    (trailPoints[0]?.y ?? 694) - 165,
    worldHeight * 0.44,
    worldHeight * 0.58
  );
  const travelDeltaX = startFocusX - targetFocusX; // negative as we travel right
  const travelDeltaY = startFocusY - targetFocusY; // positive as we climb upward

  // 7-Layer parallax depth planes (strictly monotonic parallax progression:
  // farMountains 0.14x < mistBand 0.28x < midRidges 0.54x < trailWorld 1.00x < occludingRidge 1.24x < fgPines 1.42x)
  const layers = {
    farMountains: {
      xPx: Number((travelDeltaX * 0.14).toFixed(2)),
      yPx: Number((travelDeltaY * 0.08).toFixed(2)),
      scale: Number((1 + (cameraScale - 1) * 0.25).toFixed(4)),
    },
    mistBand: {
      xPx: Number((travelDeltaX * 0.28).toFixed(2)),
      yPx: Number((travelDeltaY * 0.15).toFixed(2)),
      scale: Number((1 + (cameraScale - 1) * 0.42).toFixed(4)),
    },
    midRidges: {
      xPx: Number((travelDeltaX * 0.54).toFixed(2)),
      yPx: Number((travelDeltaY * 0.28).toFixed(2)),
      scale: Number((1 + (cameraScale - 1) * 0.68).toFixed(4)),
    },
    trailWorld: {
      xPx: worldPanXPx,
      yPx: worldPanYPx,
      scale: cameraScale,
    },
    occludingRidge: {
      xPx: Number((travelDeltaX * 1.24).toFixed(2)),
      yPx: Number((travelDeltaY * 0.48).toFixed(2)),
      scale: Number((1 + (cameraScale - 1) * 1.12).toFixed(4)),
    },
    fgPines: {
      xPx: Number((travelDeltaX * 1.42).toFixed(2)),
      yPx: Number((travelDeltaY * 0.62).toFixed(2)),
      scale: Number((1 + (cameraScale - 1) * 1.25).toFixed(4)),
    },
  } as const;

  // Per-milestone reveal factor: Stop 01 is gently visible as you begin walking;
  // Stop 02 emerges from behind the mountain bend ridge as you clear Stop 01;
  // Stop 03 emerges as the foreground pass parts after Stop 02.
  const milestoneReveal = milestones.map((m, idx) => {
    if (idx === 0) {
      return Number(smoothstep(0.02, 0.18, raw).toFixed(4));
    }
    const revealStart = m.trailStop - 0.17;
    const revealFull = m.trailStop - 0.03;
    return Number(smoothstep(revealStart, revealFull, raw).toFixed(4));
  });

  return {
    rawProgress: raw,
    trailT: Number(trailT.toFixed(5)),
    scenePhase,
    introOpacity: Number(introFade.toFixed(4)),
    introTranslateYPx,
    activeMilestoneIndex,
    activeMilestoneId,
    reachedMilestoneId,
    milestoneSettle,
    catWorld: {
      x: Number(catWorld.x.toFixed(2)),
      y: Number(catWorld.y.toFixed(2)),
    },
    catSlopeDeg,
    catDepthScale,
    cameraFocusWorld: {
      x: Number(targetFocusX.toFixed(2)),
      y: Number(targetFocusY.toFixed(2)),
    },
    cameraScale,
    worldPanXPx,
    worldPanYPx,
    layers,
    milestoneReveal,
  };
}

/**
 * Pure scroll-coupled walk cycle stepper for the 8-frame Japanese traveler cat.
 * Advances frames strictly proportional to scroll distance moved; flips facing
 * cleanly on reverse scroll; never runs on autoplay when scroll delta is zero.
 */
export function stepTravelerAnimation(
  input: TravelerAnimationInput
): TravelerAnimationOutput {
  const totalTrailUnits = input.totalTrailUnits ?? 2650;
  const unitsPerFrame = input.unitsPerFrame ?? 22;
  const frameCount = input.frameCount ?? 8;

  const deltaProgress = input.nextProgress - input.prevProgress;
  const absDelta = Math.abs(deltaProgress);

  if (absDelta < 0.00015) {
    const wrapped =
      ((Math.floor(input.prevAccumulatedDistance / unitsPerFrame) % frameCount) +
        frameCount) %
      frameCount;
    return {
      accumulatedDistance: input.prevAccumulatedDistance,
      facing: input.prevFacing,
      walkFrame: wrapped,
      isMoving: false,
      deltaProgress: 0,
    };
  }

  const facing: "forward" | "backward" = deltaProgress > 0 ? "forward" : "backward";
  const stepUnits = absDelta * totalTrailUnits;
  const accumulatedDistance = input.prevAccumulatedDistance + stepUnits;
  const walkFrame =
    ((Math.floor(accumulatedDistance / unitsPerFrame) % frameCount) + frameCount) %
    frameCount;

  return {
    accumulatedDistance,
    facing,
    walkFrame,
    isMoving: true,
    deltaProgress,
  };
}
