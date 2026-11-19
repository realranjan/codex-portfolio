/**
 * Pure spatial carousel and layered gallery math for:
 * - Chapter 02: Selected Projects horizontal spatial gallery
 * - Chapter 07: Achievements & Certifications staggered layered showcase
 */

export interface SpatialSlideTransform {
  /** Signed distance from active slide (0 = active, -1 = left neighbor, +1 = right neighbor) */
  offset: number;
  /** Whether this slide is the focal active item */
  isActive: boolean;
  /** Visual scale (1.0 when active, steps down for peripheral slides) */
  scale: number;
  /** Subtle 3D Y-axis rotation in degrees */
  rotateYDeg: number;
  /** Horizontal pixel/percent shift weight */
  translateXPct: number;
  /** Subtle vertical offset for exhibition asymmetry */
  translateYPx: number;
  /** Opacity emphasizing active item while keeping neighbors visible */
  opacity: number;
  /** Stacking z-index */
  zIndex: number;
}

/**
 * Wraps an arbitrary index cleanly into [0, count - 1].
 */
export function wrapIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

/**
 * Computes shortest signed circular offset from `activeIndex` to `itemIndex`.
 */
export function signedCircularOffset(
  itemIndex: number,
  activeIndex: number,
  count: number
): number {
  if (count <= 0) return 0;
  const raw = wrapIndex(itemIndex, count) - wrapIndex(activeIndex, count);
  const half = count / 2;
  if (raw > half) return raw - count;
  if (raw < -half) return raw + count;
  return raw;
}

/**
 * Computes deterministic spatial depth styling for a horizontal exhibition slide.
 */
export function computeSpatialSlideState(
  itemIndex: number,
  activeIndex: number,
  count: number
): SpatialSlideTransform {
  const rawOffset = signedCircularOffset(itemIndex, activeIndex, count);
  const offset = rawOffset === 0 ? 0 : rawOffset;
  const abs = Math.abs(offset);
  const isActive = abs < 0.001;

  const scale = isActive ? 1 : Math.max(0.76, 1 - abs * 0.12);
  const rotateYDeg = isActive ? 0 : Math.max(-22, Math.min(22, -offset * 11));
  const translateXPct = isActive ? 0 : offset * 78;
  const translateYPx = isActive ? 0 : Math.min(34, abs * 18);
  const opacity = isActive ? 1 : Math.max(0.22, 1 - abs * 0.44);
  const zIndex = Math.max(1, 20 - Math.round(abs * 5));

  return {
    offset,
    isActive,
    scale,
    rotateYDeg,
    translateXPct,
    translateYPx,
    opacity,
    zIndex,
  };
}

/**
 * Resolves a horizontal drag delta (px) into a slide step (-1, 0, +1).
 */
export function resolveDragStep(deltaX: number, thresholdPx = 56): -1 | 0 | 1 {
  if (!Number.isFinite(deltaX)) return 0;
  if (deltaX <= -thresholdPx) return 1; // dragged left -> advance to next
  if (deltaX >= thresholdPx) return -1; // dragged right -> go to previous
  return 0;
}
