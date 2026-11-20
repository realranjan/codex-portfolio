import type { JourneyMilestone } from "../data/experience-journey";
import {
  applyJourneyMilestoneDwell,
  classifyJourneyScenePhase,
  getReachedMilestoneId,
  type JourneyScenePhase,
} from "./mountain-journey";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURE 3D JAPANESE MOUNTAIN WORLD & FOLLOW-CAMERA KINEMATICS ENGINE
 * -------------------------------------------------------------------------------
 * Zero DOM or Three.js dependencies so all 3D trail math, terrain heightfields,
 * follow-behind camera geometry, and scroll-driven character walk strides can be
 * deterministically unit-tested with node:test.
 *
 * Coordinate System (Right-Handed Three.js):
 *   -X / +X : lateral mountain pass width
 *   +Y      : elevation upward
 *   +Z -> -Z: forward travel deeper into the Japanese mountain valley
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Trail3DSample {
  readonly position: Vec3;
  readonly tangent: Vec3;
  readonly right: Vec3;
  readonly yawRad: number;
  readonly pitchRad: number;
}

export interface Landmark3DPlacement {
  readonly id: string;
  readonly number: "01" | "02" | "03";
  readonly trailStop: number;
  readonly position: Vec3;
  readonly facingYawRad: number;
}

export interface MountainPeakSpec {
  readonly x: number;
  readonly z: number;
  readonly radiusX: number;
  readonly radiusZ: number;
  readonly height: number;
  readonly ridgeAngle: number;
  readonly sharpness: number;
}

export interface Mountain3DCameraPose {
  readonly rawProgress: number;
  readonly trailT: number;
  readonly scenePhase: JourneyScenePhase;
  readonly introOpacity: number;
  readonly introTranslateYPx: number;
  readonly activeMilestoneIndex: number;
  readonly activeMilestoneId: string;
  readonly reachedMilestoneId: string | null;
  readonly catPosition: Vec3;
  readonly catYawRad: number;
  readonly catPitchRad: number;
  readonly cameraPosition: Vec3;
  readonly cameraLookAt: Vec3;
  readonly cameraFov: number;
}

export interface Traveler3DWalkInput {
  readonly prevProgress: number;
  readonly nextProgress: number;
  readonly prevStridePhase: number;
  readonly prevTravelDir: 1 | -1;
}

export interface Traveler3DWalkOutput {
  readonly stridePhase: number;
  readonly travelDir: 1 | -1;
  readonly isMoving: boolean;
  readonly speed: number;
}

/**
 * Winding 3D Japanese mountain trail climbing gently from Z = +28 to Z = -64,
 * curving gracefully around three sculpted rocky formations so future stops
 * emerge naturally around bends instead of sitting exposed in a straight line.
 */
export const TRAIL_3D_WAYPOINTS: readonly Vec3[] = [
  { x: -1.5, y: 0.0, z: 28.0 }, // Scene 01: Trailhead quiet arrival
  { x: 1.8, y: 0.38, z: 16.5 }, // Gentle curve right toward Stop 01
  { x: 4.8, y: 0.92, z: 4.5 }, // Stop 01 — iMerit (around ~t=0.24)
  { x: 1.2, y: 1.38, z: -8.5 }, // Bend left behind central mountain ridge
  { x: -6.2, y: 2.05, z: -22.5 }, // Stop 02 — Haegl Tech (around ~t=0.54)
  { x: -3.4, y: 2.68, z: -36.0 }, // Rising mountain pass weaving right
  { x: 3.6, y: 3.42, z: -48.5 }, // Stop 03 — RYVO (around ~t=0.81)
  { x: 1.2, y: 3.92, z: -63.0 }, // Scene 06: Trail continues into misty horizon
] as const;

/**
 * Sculpted Japanese mountain formations flanking the trail plus distant layered
 * silhouettes. Proportioned with editorial restraint—clear sculptural peaks that
 * frame the pass and conceal upcoming bends while keeping the upper sky open.
 */
export const MOUNTAIN_PEAKS_3D: readonly MountainPeakSpec[] = [
  // Primary flanking mountain formations — clear, compact Japanese pass ridges
  // 1. Left trailhead massif (kept tucked outward so Scene 01 upper-left sky stays open)
  { x: -21.0, z: 12.0, radiusX: 10.5, radiusZ: 11.5, height: 5.8, ridgeAngle: 0.4, sharpness: 1.5 },
  { x: -27.0, z: 1.0, radiusX: 12.5, radiusZ: 13.0, height: 8.8, ridgeAngle: -0.25, sharpness: 1.45 },
  // 2. Sculpted ridge framing Stop 01 (iMerit) & occluding Stop 02 around the bend
  { x: 19.5, z: 2.5, radiusX: 11.0, radiusZ: 12.0, height: 7.4, ridgeAngle: -0.45, sharpness: 1.55 },
  { x: 18.0, z: -12.0, radiusX: 11.2, radiusZ: 12.5, height: 8.8, ridgeAngle: -0.5, sharpness: 1.55 },
  { x: -9.5, z: -8.5, radiusX: 5.8, radiusZ: 6.2, height: 4.2, ridgeAngle: 0.35, sharpness: 1.55 },
  // 3. Mid-valley ridges flanking Stop 02 (Haegl Tech) with clear sky above left typography
  { x: -26.5, z: -26.0, radiusX: 12.0, radiusZ: 12.5, height: 8.4, ridgeAngle: 0.25, sharpness: 1.5 },
  { x: 13.5, z: -28.5, radiusX: 9.5, radiusZ: 10.2, height: 7.2, ridgeAngle: -0.35, sharpness: 1.55 },
  // 4. Upper overlook ridges flanking Stop 03 (RYVO) opening toward the misty valley pass
  { x: 24.5, z: -47.0, radiusX: 12.0, radiusZ: 13.0, height: 8.8, ridgeAngle: 0.55, sharpness: 1.5 },
  { x: -20.5, z: -51.5, radiusX: 11.5, radiusZ: 12.0, height: 7.8, ridgeAngle: -0.2, sharpness: 1.5 },

  // Distant atmospheric silhouette peaks set far beyond the trail exit (z <= -96)
  // so Scene 06 ending opens onto a serene misty Japanese horizon vista
  { x: -38.0, z: -84.0, radiusX: 18.0, radiusZ: 17.0, height: 13.8, ridgeAngle: 0.2, sharpness: 1.38 },
  { x: 36.0, z: -88.0, radiusX: 18.0, radiusZ: 17.0, height: 13.2, ridgeAngle: 0.45, sharpness: 1.38 },
  { x: -16.0, z: -102.0, radiusX: 19.0, radiusZ: 16.0, height: 12.8, ridgeAngle: -0.25, sharpness: 1.35 },
  { x: 18.0, z: -104.0, radiusX: 19.0, radiusZ: 16.0, height: 12.2, ridgeAngle: 0.18, sharpness: 1.35 },
] as const;

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function clamp01(v: number): number {
  return clamp(v, 0, 1);
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
 * Evaluates a smooth 3D Catmull-Rom point along TRAIL_3D_WAYPOINTS for t in [0..1].
 */
export function evaluateCatmullRom3D(
  points: readonly Vec3[],
  t: number
): Vec3 {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0, z: 0 };
  if (n === 1) return points[0];

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

  const catmull = (a: number, b: number, c: number, d: number) =>
    0.5 *
    (2 * b +
      (-a + c) * u +
      (2 * a - 5 * b + 4 * c - d) * u2 +
      (-a + 3 * b - 3 * c + d) * u3);

  return {
    x: catmull(p0.x, p1.x, p2.x, p3.x),
    y: catmull(p0.y, p1.y, p2.y, p3.y),
    z: catmull(p0.z, p1.z, p2.z, p3.z),
  };
}

/**
 * Samples full position, normalized tangent, right vector, and yaw/pitch along the 3D trail.
 */
export function sampleTrail3D(t: number): Trail3DSample {
  const p = clamp01(t);
  const pos = evaluateCatmullRom3D(TRAIL_3D_WAYPOINTS, p);
  const eps = 0.004;
  const prev = evaluateCatmullRom3D(TRAIL_3D_WAYPOINTS, Math.max(0, p - eps));
  const next = evaluateCatmullRom3D(TRAIL_3D_WAYPOINTS, Math.min(1, p + eps));

  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const dz = next.z - prev.z;
  const len = Math.hypot(dx, dy, dz) || 1;

  const tx = dx / len;
  const ty = dy / len;
  const tz = dz / len;

  // Right vector = cross(tangent, worldUp(0,1,0)) normalized
  const rxRaw = -tz;
  const rzRaw = tx;
  const rLen = Math.hypot(rxRaw, rzRaw) || 1;
  const right: Vec3 = { x: rxRaw / rLen, y: 0, z: rzRaw / rLen };

  // In Three.js, local +Z faces yaw=0; yaw = atan2(tx, tz) aligns local +Z with forward tangent
  const yawRad = Math.atan2(tx, tz);
  const horiz = Math.hypot(tx, tz) || 1;
  const pitchRad = Math.atan2(ty, horiz);

  return {
    position: pos,
    tangent: { x: tx, y: ty, z: tz },
    right,
    yawRad,
    pitchRad,
  };
}

// Pre-sampled dense lookup table of the trail centerline for fast, exact terrain carving
const TRAIL_LUT_STEPS = 140;
const TRAIL_LUT: readonly Vec3[] = Array.from({ length: TRAIL_LUT_STEPS + 1 }, (_, i) =>
  evaluateCatmullRom3D(TRAIL_3D_WAYPOINTS, i / TRAIL_LUT_STEPS)
);

/**
 * Finds the closest distance in XZ and matching elevation along the winding 3D trail.
 */
export function getNearestTrailMetrics(x: number, z: number): {
  readonly dist: number;
  readonly trailY: number;
  readonly t: number;
} {
  let bestDistSq = Infinity;
  let bestIdx = 0;

  for (let i = 0; i < TRAIL_LUT.length; i++) {
    const pt = TRAIL_LUT[i];
    const dx = x - pt.x;
    const dz = z - pt.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      bestIdx = i;
    }
  }

  // Refine slightly between neighbors for ultra-smooth footpath bed carving
  const pBest = TRAIL_LUT[bestIdx];
  const prevIdx = Math.max(0, bestIdx - 1);
  const nextIdx = Math.min(TRAIL_LUT.length - 1, bestIdx + 1);
  const pPrev = TRAIL_LUT[prevIdx];
  const pNext = TRAIL_LUT[nextIdx];

  const refineSegment = (a: Vec3, b: Vec3, tA: number, tB: number) => {
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const abLenSq = abx * abx + abz * abz;
    if (abLenSq < 1e-6) {
      return {
        distSq: (x - a.x) ** 2 + (z - a.z) ** 2,
        y: a.y,
        t: tA,
      };
    }
    const u = clamp01(((x - a.x) * abx + (z - a.z) * abz) / abLenSq);
    const px = a.x + abx * u;
    const pz = a.z + abz * u;
    return {
      distSq: (x - px) ** 2 + (z - pz) ** 2,
      y: lerp(a.y, b.y, u),
      t: lerp(tA, tB, u),
    };
  };

  const s1 = refineSegment(pPrev, pBest, prevIdx / TRAIL_LUT_STEPS, bestIdx / TRAIL_LUT_STEPS);
  const s2 = refineSegment(pBest, pNext, bestIdx / TRAIL_LUT_STEPS, nextIdx / TRAIL_LUT_STEPS);
  const winner = s1.distSq <= s2.distSq ? s1 : s2;

  return {
    dist: Math.sqrt(winner.distSq),
    trailY: winner.y,
    t: winner.t,
  };
}

/**
 * Deterministic multi-octave rocky ridge surface detail for sculptural Japanese peaks.
 */
function mountainNoise(x: number, z: number): number {
  const n1 = Math.sin(x * 0.17 + z * 0.13) * Math.cos(x * 0.11 - z * 0.19);
  const n2 = Math.sin(x * 0.41 - z * 0.37 + 1.4) * 0.42;
  const n3 = Math.cos(x * 0.83 + z * 0.71 - 0.8) * 0.18;
  return n1 + n2 + n3;
}

/**
 * Continuous 3D Japanese mountain terrain heightfield.
 * - Guarantees the winding footpath corridor sits flush at exact trail elevation
 *   (zero floating path or buried traveler cat!).
 * - Smoothly rises into sculpted rocky ridges flanking the pass and gentle
 *   layered peaks receding into the soft ivory horizon fog.
 */
export function getMountainTerrainHeight(x: number, z: number): number {
  const trail = getNearestTrailMetrics(x, z);

  // Base gentle valley slope climbing softly as Z goes deeper (-Z)
  const valleyBase = clamp01((28 - z) / 95) * 3.85;

  // Sculpted peaks with subtle crag ridges
  let mountainSum = 0;
  for (let i = 0; i < MOUNTAIN_PEAKS_3D.length; i++) {
    const pk = MOUNTAIN_PEAKS_3D[i];
    const dx = x - pk.x;
    const dz = z - pk.z;
    const cosA = Math.cos(pk.ridgeAngle);
    const sinA = Math.sin(pk.ridgeAngle);
    const lx = (dx * cosA - dz * sinA) / pk.radiusX;
    const lz = (dx * sinA + dz * cosA) / pk.radiusZ;
    const r2 = lx * lx + lz * lz;
    if (r2 < 5.5) {
      // Sculptural faceted Japanese sumi-e peak profile
      const ridgeCrest = 1 / (1 + Math.pow(r2, pk.sharpness));
      const falloff = Math.exp(-r2 * 0.92);
      const cragMod = 1 + 0.16 * mountainNoise(x * 0.85, z * 0.85);
      mountainSum += pk.height * ridgeCrest * falloff * cragMod;
    }
  }

  // Rolling organic foothills everywhere outside the road
  const foothills =
    0.55 * Math.sin(x * 0.09 + 0.5) * Math.cos(z * 0.08 - 0.3) +
    0.28 * mountainNoise(x * 0.5, z * 0.5);

  const naturalElevation = valleyBase + mountainSum + foothills;

  // Carve the winding footpath cleanly into the hillside:
  // Within 1.55m of centerline -> exact trail elevation (flat comfortable stone path)
  // Between 1.55m and 7.2m -> smooth organic earth bank blending seamlessly into hillsides!
  const pathBlend = smoothstep(1.55, 7.2, trail.dist);
  return lerp(trail.trailY, naturalElevation, pathBlend);
}

/**
 * Computes exact grounded 3D placements for the 3 career stone landmarks
 * (iMerit, Haegl Tech, RYVO) tucked naturally onto the footpath shoulder.
 */
export function computeLandmark3DPlacements(
  milestones: readonly JourneyMilestone[]
): readonly Landmark3DPlacement[] {
  return milestones.map((m, idx) => {
    const sample = sampleTrail3D(m.trailStop);
    // Alternate shoulder placement for natural visual rhythm matching side typography edge
    // Stop 01 (right overlay -> stone on left shoulder); Stop 02 & 03 (left overlay -> stone on right shoulder)
    const sideSign = idx === 0 ? -1 : 1;
    const lateralOffset = 1.95 * sideSign;
    const lx = sample.position.x + sample.right.x * lateralOffset;
    const lz = sample.position.z + sample.right.z * lateralOffset;
    const ly = getMountainTerrainHeight(lx, lz);

    // Orient stone face slightly toward the approaching camera/traveler
    const facingYawRad = Math.atan2(
      sample.position.x - lx - sample.tangent.x * 3.5,
      sample.position.z - lz - sample.tangent.z * 3.5
    );

    return {
      id: m.id,
      number: m.number,
      trailStop: m.trailStop,
      position: {
        x: Number(lx.toFixed(3)),
        y: Number(ly.toFixed(3)),
        z: Number(lz.toFixed(3)),
      },
      facingYawRad: Number(facingYawRad.toFixed(4)),
    };
  });
}

/**
 * Computes the complete 3D traveler cat & follow-behind cinematic camera pose
 * from a single scroll progress value [0..1].
 */
export function computeMountain3DCameraPose(
  rawProgress: number,
  milestones: readonly JourneyMilestone[]
): Mountain3DCameraPose {
  const raw = clamp01(rawProgress);
  const stops = milestones.map((m) => m.trailStop);
  const trailT = applyJourneyMilestoneDwell(raw, stops);
  const scenePhase = classifyJourneyScenePhase(raw);

  // Scene 01 opening headline clears gracefully as the cat walks forward
  const introOpacity = Number((1 - smoothstep(0.05, 0.15, raw)).toFixed(4));
  const introTranslateYPx = Number((-22 * (1 - introOpacity)).toFixed(2));

  // Nearest milestone & automatic arrival checkpoint detection
  let activeMilestoneIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < milestones.length; i++) {
    const d = Math.abs(raw - milestones[i].trailStop);
    if (d < bestDist) {
      bestDist = d;
      activeMilestoneIndex = i;
    }
  }
  const activeMilestoneId = milestones[activeMilestoneIndex]?.id ?? "";
  const reachedMilestoneId = getReachedMilestoneId(raw, milestones, 0.085);

  // Traveler cat grounded cleanly on the 3D winding footpath
  const catSample = sampleTrail3D(trailT);
  const catGroundY = getMountainTerrainHeight(
    catSample.position.x,
    catSample.position.z
  );
  const catPosition: Vec3 = {
    x: Number(catSample.position.x.toFixed(3)),
    y: Number(catGroundY.toFixed(3)),
    z: Number(catSample.position.z.toFixed(3)),
  };

  // Cinematic follow-behind camera:
  // Trails smoothly behind the cat along the trail direction, slightly elevated,
  // with subtle lateral shift opposite the active typography edge so the cat,
  // stone landmark, and mountain pass compose cleanly against the open ivory sky.
  const endingPullback = smoothstep(0.87, 1.0, raw);
  const followBackDist = lerp(6.8, 10.6, endingPullback);
  const followHeight = lerp(2.85, 4.65, endingPullback);

  // Gentle lateral offset that shifts subtly around bends & keeps side typography clear
  const stop1Weight = smoothstep(0.14, 0.24, raw) * (1 - smoothstep(0.32, 0.42, raw));
  const stop23Weight = smoothstep(0.45, 0.54, raw) * (1 - smoothstep(0.87, 0.96, raw));
  const lateralBias = lerp(0.9, -1.15, stop1Weight) + stop23Weight * 1.1;

  // Sample slightly behind on the spline for smooth, whip-free cornering
  const behindSample = sampleTrail3D(Math.max(0, trailT - 0.055));
  const camX =
    catPosition.x -
    behindSample.tangent.x * followBackDist +
    behindSample.right.x * lateralBias;
  const camZ =
    catPosition.z -
    behindSample.tangent.z * followBackDist +
    behindSample.right.z * lateralBias;
  const terrainUnderCam = getMountainTerrainHeight(camX, camZ);
  const camY = Math.max(catPosition.y + followHeight, terrainUnderCam + 1.45);

  // Look smoothly ahead of the traveler cat down the winding mountain pass
  // with enough sky elevation that distant ridges & warm-ivory sky stay open above the horizon
  const lookAheadSample = sampleTrail3D(Math.min(1, trailT + 0.11));
  const lookAtX = lerp(lookAheadSample.position.x, catPosition.x, endingPullback * 0.35);
  const lookAtY =
    lerp(lookAheadSample.position.y + 1.9, catPosition.y + 2.65, endingPullback * 0.65);
  const lookAtZ = lerp(lookAheadSample.position.z, catPosition.z - 5.5, endingPullback * 0.45);

  // Restrained editorial telephoto-ish FOV (42deg -> 46deg at wide ending pullback)
  const cameraFov = Number(lerp(42, 46.5, endingPullback).toFixed(2));

  return {
    rawProgress: raw,
    trailT: Number(trailT.toFixed(5)),
    scenePhase,
    introOpacity,
    introTranslateYPx,
    activeMilestoneIndex,
    activeMilestoneId,
    reachedMilestoneId,
    catPosition,
    catYawRad: Number(catSample.yawRad.toFixed(4)),
    catPitchRad: Number(clamp(catSample.pitchRad * 0.4, -0.18, 0.18).toFixed(4)),
    cameraPosition: {
      x: Number(camX.toFixed(3)),
      y: Number(camY.toFixed(3)),
      z: Number(camZ.toFixed(3)),
    },
    cameraLookAt: {
      x: Number(lookAtX.toFixed(3)),
      y: Number(lookAtY.toFixed(3)),
      z: Number(lookAtZ.toFixed(3)),
    },
    cameraFov,
  };
}

/**
 * Pure scroll-coupled 3D walk stride stepper.
 * Advances continuous limb gait phase strictly proportional to scroll movement;
 * flips direction on backward scroll; never auto-walks when stationary.
 */
export function stepTraveler3DWalk(
  input: Traveler3DWalkInput
): Traveler3DWalkOutput {
  const delta = input.nextProgress - input.prevProgress;
  const absDelta = Math.abs(delta);

  if (absDelta < 0.00012) {
    return {
      stridePhase: input.prevStridePhase,
      travelDir: input.prevTravelDir,
      isMoving: false,
      speed: 0,
    };
  }

  const travelDir: 1 | -1 = delta > 0 ? 1 : -1;
  // ~18 full walk cycles across the entire mountain trail (~96m)
  const strideAdvance = absDelta * 18 * Math.PI * 2;
  return {
    stridePhase: input.prevStridePhase + strideAdvance,
    travelDir,
    isMoving: true,
    speed: clamp(absDelta * 65, 0.2, 1.5),
  };
}
