import type { TechCategoryId, TechIconEntry } from "@/data/tech-icons-manifest";

export interface RibbonLaneSpec {
  id: string;
  label: string;
  categories: readonly TechCategoryId[];
  /** +1 moves left-to-right, -1 moves right-to-left */
  baseDirection: 1 | -1;
  /** Base cruise speed in CSS pixels per second */
  baseSpeedPxPerSec: number;
}

export const DEFAULT_RIBBON_LANES: readonly RibbonLaneSpec[] = [
  {
    id: "lane-core",
    label: "Core & Web Engineering",
    categories: ["languages", "frontend", "backend"],
    baseDirection: -1,
    baseSpeedPxPerSec: 46,
  },
  {
    id: "lane-ai-cloud",
    label: "AI, Data & Cloud Systems",
    categories: ["ai-ml", "databases", "cloud", "apis"],
    baseDirection: 1,
    baseSpeedPxPerSec: 40,
  },
  {
    id: "lane-creative-tools",
    label: "Creative Tech, 3D & Tooling",
    categories: ["dev-tools", "desktop", "three-d", "design", "video"],
    baseDirection: -1,
    baseSpeedPxPerSec: 43,
  },
] as const;

export interface RibbonLaneData {
  spec: RibbonLaneSpec;
  items: TechIconEntry[];
}

/**
 * Deterministically partitions all technology icons into curated domain lanes
 * without dropping or duplicating any icon across lanes.
 */
export function partitionIconsIntoLanes(
  icons: readonly TechIconEntry[],
  specs: readonly RibbonLaneSpec[] = DEFAULT_RIBBON_LANES
): RibbonLaneData[] {
  const categoryToLaneIndex = new Map<TechCategoryId, number>();
  specs.forEach((spec, idx) => {
    for (const cat of spec.categories) {
      categoryToLaneIndex.set(cat, idx);
    }
  });

  const buckets: TechIconEntry[][] = specs.map(() => []);
  const seen = new Set<string>();

  icons.forEach((icon, fallbackIdx) => {
    if (seen.has(icon.slug)) return;
    seen.add(icon.slug);

    const targetIndex =
      categoryToLaneIndex.get(icon.category) ?? fallbackIdx % specs.length;
    buckets[targetIndex].push(icon);
  });

  return specs.map((spec, idx) => ({
    spec,
    items: buckets[idx],
  }));
}

/**
 * Repeats a small list of items enough times so a single seamless loop copy
 * always spans wider than ultra-wide viewports without leaving empty gaps.
 */
export function buildSeamlessTrackItems<T>(
  items: readonly T[],
  minItemsPerCopy = 12
): T[] {
  if (items.length === 0) return [];
  if (items.length >= minItemsPerCopy) return [...items];

  const repeatCount = Math.ceil(minItemsPerCopy / items.length);
  const expanded: T[] = [];
  for (let i = 0; i < repeatCount; i += 1) {
    expanded.push(...items);
  }
  return expanded;
}

/**
 * Modulo-wraps any ribbon offset (positive, negative, or multi-period)
 * strictly into `[-periodPx, 0)` so a 2-copy marquee loops with zero seam jump.
 */
export function wrapRibbonOffset(offsetPx: number, periodPx: number): number {
  if (!Number.isFinite(periodPx) || periodPx <= 0) return 0;
  if (!Number.isFinite(offsetPx)) return 0;

  let wrapped = offsetPx % periodPx;
  if (wrapped > 0) {
    wrapped -= periodPx;
  }
  // Normalize -0 to 0 and clamp exact -periodPx to 0
  if (wrapped === 0 || Math.abs(wrapped) < 1e-9 || wrapped <= -periodPx) {
    return 0;
  }
  return wrapped;
}

export interface RibbonKinematicState {
  /** Current horizontal translation in px, wrapped to [-periodPx, 0) */
  offsetPx: number;
  /** Current cruise velocity in px/s (smoothly eases toward target) */
  velocityPxPerSec: number;
  /** Transient impulse velocity from pointer fling or scroll nudge (decays to 0) */
  impulsePxPerSec: number;
}

export interface RibbonStepParams {
  periodPx: number;
  /** Base cruise speed magnitude (px/s) */
  baseSpeedPxPerSec: number;
  /** Effective travel direction: -1 (left) or +1 (right) */
  direction: 1 | -1;
  /** User speed multiplier (e.g. 0.5, 1, 1.75) */
  speedMultiplier: number;
  /** Global or reduced-motion pause */
  isPaused: boolean;
  /** Lane hovered or focused — eases cleanly to 0 for effortless clicking */
  isHoveredOrFocused: boolean;
  /** Pointer is actively dragging this lane */
  isDragging: boolean;
  /** Frame delta in seconds (clamped internally for stability) */
  dtSec: number;
}

/**
 * Advances one frame of frame-rate independent ribbon physics.
 * - Smoothly eases velocity toward 0 on hover/focus/pause (no abrupt CSS halt).
 * - Decays fling/scroll impulse exponentially and blends back into cruise speed.
 * - Keeps offset wrapped seamlessly inside `[-periodPx, 0)`.
 */
export function stepRibbonKinematics(
  state: RibbonKinematicState,
  params: RibbonStepParams
): RibbonKinematicState {
  const dt = Math.min(0.05, Math.max(0, params.dtSec));
  if (dt === 0 || params.periodPx <= 0) {
    return {
      ...state,
      offsetPx: wrapRibbonOffset(state.offsetPx, params.periodPx),
    };
  }

  if (params.isDragging) {
    return {
      offsetPx: wrapRibbonOffset(state.offsetPx, params.periodPx),
      velocityPxPerSec: 0,
      impulsePxPerSec: 0,
    };
  }

  if (params.isHoveredOrFocused) {
    return {
      offsetPx: wrapRibbonOffset(state.offsetPx, params.periodPx),
      velocityPxPerSec: 0,
      impulsePxPerSec: 0,
    };
  }

  const targetVelocity = params.isPaused
    ? 0
    : params.baseSpeedPxPerSec * params.direction * params.speedMultiplier;

  // Exponential smoothing (~180ms settle time) when accelerating back to cruise speed
  const easeAlpha = 1 - Math.exp(-9.5 * dt);
  let nextVelocity =
    state.velocityPxPerSec + (targetVelocity - state.velocityPxPerSec) * easeAlpha;
  if (Math.abs(nextVelocity - targetVelocity) < 0.05) {
    nextVelocity = targetVelocity;
  }

  // Smooth exponential decay on fling / scroll momentum
  const impulseDecay = Math.exp(-4.2 * dt);
  let nextImpulse = state.impulsePxPerSec * impulseDecay;
  if (Math.abs(nextImpulse) < 0.25) {
    nextImpulse = 0;
  }

  const totalVelocity = nextVelocity + nextImpulse;
  const nextOffset = wrapRibbonOffset(
    state.offsetPx + totalVelocity * dt,
    params.periodPx
  );

  return {
    offsetPx: nextOffset,
    velocityPxPerSec: nextVelocity,
    impulsePxPerSec: nextImpulse,
  };
}
