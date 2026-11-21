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

export interface WordRevealState {
  /** Smoothly interpolated ink opacity [0.2 .. 1.0] */
  opacity: number;
  /** Gentle upward settle displacement in px [6 .. 0] */
  yPx: number;
  /** True once word has crossed 60% of its illumination window */
  isLit: boolean;
}

/**
 * Pure word-by-word scroll-scrubbed typography reveal math.
 * Each word transitions smoothly across an overlapping staggered window so
 * reading feels like ink illuminating line by line without sudden pops.
 */
export function computeWordRevealState(
  rawProgress: number,
  wordIndex: number,
  totalWords: number
): WordRevealState {
  const progress = clamp01(rawProgress);
  const count = Math.max(1, Math.floor(totalWords));
  const idx = Math.min(count - 1, Math.max(0, Math.floor(wordIndex)));

  const span = count === 1 ? 0 : 0.72;
  const windowWidth = count === 1 ? 1 : 0.28;
  const start = count === 1 ? 0 : (idx / (count - 1)) * span;
  const end = start + windowWidth;
  const local = smoothstep(start, end, progress);

  const opacity = Number((0.2 + 0.8 * local).toFixed(4));
  const yPx = Number(((1 - local) * 6).toFixed(2)) || 0;

  return {
    opacity,
    yPx,
    isLit: local >= 0.6,
  };
}

export interface ChapterHingeTransformState {
  /** Subtle bottom-corner sheet hinge rotation in degrees (e.g. +11deg or -11deg -> 0deg) */
  rotationDeg: number;
  /** Gentle vertical rise in px (34 -> 0) */
  translateYPx: number;
  /** Subtle perspective scale-in (0.975 -> 1.0) */
  scale: number;
  /** Soft edge cast shadow opacity while hinged (0.28 -> 0) */
  shadowOpacity: number;
  /** True when the sheet is fully flat and CSS transform can be cleared to none */
  isSettled: boolean;
}

/**
 * Pure scroll-scrubbed StoryScrollChapter hinged sheet entrance math.
 * Used across portfolio chapters to give each entering page a tactile
 * Story-Scroll corner swing without clipping content or locking sticky ancestors.
 */
export function computeChapterHingeTransform(
  rawEnterProgress: number,
  maxDeg = 11,
  hinge: "left" | "right" = "left"
): ChapterHingeTransformState {
  const t = clamp01(rawEnterProgress);
  const eased = 1 - Math.pow(1 - t, 2.35);
  const remaining = 1 - eased;
  const sign = hinge === "left" ? 1 : -1;

  const isSettled = t >= 0.995;
  const rotationDeg = isSettled ? 0 : Number((sign * maxDeg * remaining).toFixed(3)) || 0;
  const translateYPx = isSettled ? 0 : Number((34 * remaining).toFixed(2)) || 0;
  const scale = isSettled ? 1 : Number((1 - 0.025 * remaining).toFixed(4));
  const shadowOpacity = isSettled ? 0 : Number((0.26 * remaining).toFixed(3)) || 0;

  return {
    rotationDeg,
    translateYPx,
    scale,
    shadowOpacity,
    isSettled,
  };
}

export interface ChapterParallaxLayerState {
  /** Combined vertical parallax offset in px (entering upward surge + outgoing downward lag) */
  translateYPx: number;
  /** Bottom-corner hinge tilt in degrees while rising onto previous chapter */
  rotationDeg: number;
  /** Depth scale: enters 0.968 -> 1.0, recedes 1.0 -> 0.945 behind next rising chapter */
  scale: number;
  /** Upper cast shadow opacity while rising over the previous chapter */
  shadowOpacity: number;
  /** Atmospheric darkening veil opacity as the next chapter slides up over this one */
  recedeVeilOpacity: number;
  /** True when neither entering nor receding so transform can clear cleanly */
  isNeutral: boolean;
}

/**
 * Pure two-phase Story Scroll parallax math so every chapter visibly rises UP
 * over the previous chapter (accelerated upward surge + hinge + cast shadow)
 * while the outgoing chapter lags downward with subtle depth recession & veil.
 */
export function computeChapterParallaxLayerState(
  rawEnterProgress: number,
  rawExitProgress: number,
  maxDeg = 9,
  hinge: "left" | "right" = "left",
  parallaxLiftPx = 92,
  recedeLagPx = 128
): ChapterParallaxLayerState {
  const enterT = clamp01(rawEnterProgress);
  const exitT = clamp01(rawExitProgress);

  const enterEased = 1 - Math.pow(1 - enterT, 2.4);
  const enterRem = 1 - enterEased;
  const exitEased = smoothstep(0, 1, exitT);

  const entering = enterT < 0.995;
  const receding = exitT > 0.005;
  const isNeutral = !entering && !receding;

  if (isNeutral) {
    return {
      translateYPx: 0,
      rotationDeg: 0,
      scale: 1,
      shadowOpacity: 0,
      recedeVeilOpacity: 0,
      isNeutral: true,
    };
  }

  const sign = hinge === "left" ? 1 : -1;
  const rotationDeg = entering ? Number((sign * maxDeg * enterRem).toFixed(3)) || 0 : 0;

  // Entering starts +parallaxLiftPx lower and surges briskly UP onto the previous sheet;
  // Receding counter-drags +recedeLagPx downward so it lags behind the incoming rising sheet.
  const enterY = entering ? parallaxLiftPx * enterRem : 0;
  const exitY = receding ? recedeLagPx * exitEased : 0;
  const translateYPx = Number((enterY + exitY).toFixed(2)) || 0;

  const enterScale = entering ? 1 - 0.032 * enterRem : 1;
  const exitScale = receding ? 1 - 0.055 * exitEased : 1;
  const scale = Number((enterScale * exitScale).toFixed(4));

  const shadowOpacity = entering ? Number((0.34 * enterRem).toFixed(3)) || 0 : 0;
  const recedeVeilOpacity = receding ? Number((0.28 * exitEased).toFixed(3)) || 0 : 0;

  return {
    translateYPx,
    rotationDeg,
    scale,
    shadowOpacity,
    recedeVeilOpacity,
    isNeutral: false,
  };
}


