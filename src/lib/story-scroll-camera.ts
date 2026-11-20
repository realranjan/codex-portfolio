export interface StoryCardCameraState {
  /** Sheet hinge rotation in degrees (30 -> 0 while entering for index > 0) */
  rotationDeg: number;
  /** Outgoing camera depth scale (1 -> 0.935 while receding behind next card) */
  cameraScale: number;
  /** Outgoing camera vertical lift in px (0 -> -28px) */
  cameraY: number;
  /** Subtle 3D perspective pitch on outgoing card in degrees (0 -> 2.4deg) */
  cameraRotateX: number;
  /** Subtle atmospheric veil opacity on receding card (0 -> 0.34) */
  recedeVeilOpacity: number;
  /** Slow background / illustration vertical parallax offset in px */
  artworkParallaxY: number;
  /** Illustration subtle camera zoom scale (1.06 -> 1.0 -> 1.04) */
  artworkScale: number;
  /** Medium-speed headline parallax offset in px */
  headlineParallaxY: number;
  /** Faster foreground detail parallax offset in px */
  detailParallaxY: number;
}

export interface ContinuousStrokeNodeState {
  index: number;
  progressAnchor: number;
  status: "passed" | "active" | "upcoming";
}

export interface ContinuousStrokeState {
  /** Normalized 0..1 fill progress for the continuous side ink stroke */
  strokeProgress: number;
  /** Active panel index [0 .. sectionCount - 1] */
  activeIndex: number;
  /** Per-panel status markers along the vertical rail */
  nodes: ContinuousStrokeNodeState[];
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Pure camera & parallax math for each FlowSection inside StoryScroll (FlowArt).
 *
 * - `enterProgress` (0..1): Section entering from below the fold until settled.
 * - `exitProgress` (0..1): Pinned section receding behind the next rotating sheet.
 * - `transitProgress` (0..1): Continuous viewport transit used for inner parallax planes.
 */
export function computeStoryCardCamera(
  sectionIndex: number,
  rawEnterProgress: number,
  rawExitProgress: number,
  rawTransitProgress: number
): StoryCardCameraState {
  const enter = clamp01(rawEnterProgress);
  const exit = clamp01(rawExitProgress);
  const transit = clamp01(rawTransitProgress);

  const rotationDeg = sectionIndex > 0 ? (1 - enter) * 30 : 0;

  const recede = smoothstep(0, 1, exit);
  const cameraScale = 1 - 0.065 * recede;
  const cameraY = -28 * recede || 0;
  const cameraRotateX = 2.4 * recede || 0;
  const recedeVeilOpacity = 0.34 * recede || 0;

  // Multi-plane parallax centered around transit = 0.5
  const centered = (transit - 0.5) * 2; // -1 .. +1
  const artworkParallaxY = centered * -34 || 0;
  const artworkScale = 1.05 - 0.04 * Math.sin(transit * Math.PI);
  const headlineParallaxY = centered * -16 || 0;
  const detailParallaxY = centered * -9 || 0;

  return {
    rotationDeg,
    cameraScale,
    cameraY,
    cameraRotateX,
    recedeVeilOpacity,
    artworkParallaxY,
    artworkScale,
    headlineParallaxY,
    detailParallaxY,
  };
}

/**
 * Computes continuous side-stroke draw progress and discrete node states
 * across `sectionCount` stacked FlowSections.
 */
export function computeContinuousStrokeState(
  rawProgress: number,
  sectionCount: number
): ContinuousStrokeState {
  const count = Math.max(1, Math.floor(sectionCount));
  const progress = clamp01(rawProgress);

  const maxIdx = count - 1;
  const rawIdx = Math.round(progress * maxIdx);
  const activeIndex = Math.min(maxIdx, Math.max(0, rawIdx));

  const nodes: ContinuousStrokeNodeState[] = [];
  for (let i = 0; i < count; i++) {
    const anchor = count === 1 ? 0 : i / maxIdx;
    const status: ContinuousStrokeNodeState["status"] =
      i < activeIndex ? "passed" : i === activeIndex ? "active" : "upcoming";
    nodes.push({
      index: i,
      progressAnchor: anchor,
      status,
    });
  }

  return {
    strokeProgress: progress,
    activeIndex,
    nodes,
  };
}
