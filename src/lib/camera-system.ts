import {
  sampleCurvedFlightPath,
  type CurvedFlightSample,
  type CurvedWaypoint,
} from "./journey-path";

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Reusable scroll-driven parallax displacement helper.
 * Produces zero continuous motion when scroll is stationary.
 */
export function computeParallaxOffsetPx(
  rawProgress: number,
  maxShiftPx: number,
  direction: -1 | 1 = -1
): number {
  const p = smoothstep(0, 1, clamp01(rawProgress));
  const value = direction * maxShiftPx * p;
  return value === 0 ? 0 : value;
}

/**
 * Applies smooth monotonic dwell plateaus around evenly spaced camera stops
 * (0, 1/(n-1), ..., 1) so the camera naturally settles while viewing each stop
 * without ever stalling forward or reverse scroll.
 */
export function applyCameraStopDwell(rawProgress: number, stopCount: number): number {
  const p = clamp01(rawProgress);
  if (stopCount <= 1) return p;
  const segments = stopCount - 1;
  // Gentle dwell coefficient strictly < 1 so derivative stays positive everywhere
  const dwellStrength = 0.42;
  const eased = p - (dwellStrength / (2 * Math.PI * segments)) * Math.sin(2 * Math.PI * segments * p);
  return clamp01(eased);
}

export interface ProjectPanelCameraPose {
  index: number;
  /** Signed distance from camera focal center in panel units (-3 .. +3) */
  relativeOffset: number;
  /** Horizontal translation in % of panel width */
  translateXPct: number;
  /** Subtle depth translation in px (negative recedes into exhibition hall) */
  translateZPx: number;
  /** Subtle vertical settle offset in px */
  translateYPx: number;
  /** Restrained perspective rotation strictly bounded within [-3.5deg, +3.5deg] */
  rotateYDeg: number;
  /** Modest editorial scale (1.0 when active, receding gently to 0.86) */
  scale: number;
  /** Panel opacity (1.0 active, secondary panels partially visible at 0.56..0.24) */
  opacity: number;
  /** Stacking z-index */
  zIndex: number;
  /** True when this project is the settled active focus */
  isActive: boolean;
}

export interface ProjectsCameraState {
  /** Clamped raw scroll progress [0..1] */
  rawProgress: number;
  /** Camera position in continuous panel coordinates [0 .. count - 1] */
  cameraPosition: number;
  /** Index of the currently active project [0 .. count - 1] */
  activeIndex: number;
  /** Focus settle strength [0..1] (1 when centered on a project) */
  settleStrength: number;
  /** Subtle background architectural grid sideways shift in px */
  backdropShiftXPx: number;
  /** Per-panel 2.5D perspective poses */
  panels: ProjectPanelCameraPose[];
}

/**
 * Exact normalized scroll progress anchor [0..1] for jumping directly to project `index`.
 */
export function getProjectCameraAnchorProgress(index: number, count: number): number {
  if (count <= 1) return 0;
  const safe = clamp(Math.round(index), 0, count - 1);
  return safe / (count - 1);
}

/**
 * Pure 2.5D exhibition camera math for Chapter 02 — Selected Projects.
 *
 * - Vertical scroll progress [0..1] moves the viewpoint horizontally across `count` panels.
 * - Camera settles softly at each project stop (`applyCameraStopDwell`) for crisp reading.
 * - Rotations stay strictly below 4 degrees (capped at +-3.5deg) and scaling stays modest
 *   (0.86..1.00) so text remains crystal-clear and motion feels guided and comfortable.
 */
export function computeProjectsCameraState(
  rawProgress: number,
  count: number
): ProjectsCameraState {
  const safeCount = Math.max(1, Math.floor(count));
  const raw = clamp01(rawProgress);
  const eased = applyCameraStopDwell(raw, safeCount);
  const cameraPosition = safeCount > 1 ? eased * (safeCount - 1) : 0;
  const activeIndex = clamp(Math.round(cameraPosition), 0, safeCount - 1);

  const distToNearest = Math.abs(cameraPosition - activeIndex);
  const settleStrength = clamp01(1 - distToNearest / 0.42);
  const backdropShiftXPx = computeParallaxOffsetPx(eased, 96, -1);

  const panels: ProjectPanelCameraPose[] = [];
  for (let i = 0; i < safeCount; i++) {
    const rel = i - cameraPosition;
    const absRel = Math.abs(rel);
    const sign = rel < 0 ? -1 : rel > 0 ? 1 : 0;

    // Spacing: active centered (0%), immediate neighbor peeks cleanly at +-78% of panel width
    const translateXPct = rel * 78;

    // Modest depth recession without dramatic zooming or aggressive skew
    const clampedDepth = Math.min(2, absRel);
    const scale = Number((1 - clampedDepth * 0.075).toFixed(4)); // 1.00 -> 0.925 -> 0.85
    const translateZPx = Number((-clampedDepth * 95).toFixed(2));
    const translateYPx = Number((Math.min(1.5, absRel) * 14).toFixed(2));

    // Strictly bounded rotation <= 3.5 degrees (well under the 4-degree visual comfort ceiling)
    const rotateYDeg = Number((clamp(-sign * Math.min(1, absRel) * 3.4, -3.5, 3.5) || 0).toFixed(3));

    // Keep neighboring projects partially visible at depth; fade panels more than 1.8 stops away
    let opacity = 1;
    if (absRel <= 1) {
      opacity = 1 - absRel * 0.46; // 1.0 -> 0.54
    } else if (absRel <= 2) {
      opacity = 0.54 - (absRel - 1) * 0.36; // 0.54 -> 0.18
    } else {
      opacity = Math.max(0, 0.18 - (absRel - 2) * 0.18);
    }

    const zIndex = Math.max(1, 30 - Math.round(absRel * 10));

    panels.push({
      index: i,
      relativeOffset: Number(rel.toFixed(4)),
      translateXPct: Number(translateXPct.toFixed(3)),
      translateZPx,
      translateYPx,
      rotateYDeg,
      scale,
      opacity: Number(opacity.toFixed(4)),
      zIndex,
      isActive: i === activeIndex,
    });
  }

  return {
    rawProgress: raw,
    cameraPosition: Number(cameraPosition.toFixed(4)),
    activeIndex,
    settleStrength: Number(settleStrength.toFixed(4)),
    backdropShiftXPx: Number(backdropShiftXPx.toFixed(2)),
    panels,
  };
}

export interface ExperienceCameraState {
  /** Underlying Catmull-Rom airplane sample (x, y, heading angle, active milestone, dwell) */
  flight: CurvedFlightSample;
  /** Modest sideways camera pan in SVG/stage units following the airplane */
  cameraPanX: number;
  /** Gentle diagonal vertical camera pan following route elevation */
  cameraPanY: number;
  /** Slower background coordinate layer sideways parallax */
  bgParallaxX: number;
  /** Slower background coordinate layer diagonal parallax */
  bgParallaxY: number;
}

/**
 * Pure camera-tracking choreography for Chapter 05 — Experience & Journey.
 *
 * The camera follows the airplane smoothly sideways and slightly diagonally along the
 * curved route, settling gently at each milestone while keeping the background grid on
 * a slower parallax plane (no aggressive aerial motion or 3D scenery).
 */
export function computeExperienceCameraState(
  waypoints: readonly CurvedWaypoint[],
  rawProgress: number
): ExperienceCameraState {
  const flight = sampleCurvedFlightPath(waypoints, rawProgress);

  if (waypoints.length === 0) {
    return {
      flight,
      cameraPanX: 0,
      cameraPanY: 0,
      bgParallaxX: 0,
      bgParallaxY: 0,
    };
  }

  // Normalize airplane coordinates around the route midpoint (viewBox 1200 x 600)
  const normX = clamp((flight.x - 600) / 500, -1, 1);
  const normY = clamp((flight.y - 310) / 220, -1, 1);

  // Modest sideways + gentle diagonal camera tracking (comfortable, zero whip, outer labels always framed)
  const cameraPanX = Number((-normX * 52).toFixed(2)) || 0;
  const cameraPanY = Number((-normY * 24).toFixed(2)) || 0;

  // Background coordinate plane shifts at ~42% of route speed for clean 2.5D depth
  const bgParallaxX = Number((cameraPanX * 0.42).toFixed(2)) || 0;
  const bgParallaxY = Number((cameraPanY * 0.42).toFixed(2)) || 0;

  return {
    flight,
    cameraPanX,
    cameraPanY,
    bgParallaxX,
    bgParallaxY,
  };
}
