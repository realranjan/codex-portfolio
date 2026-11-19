/**
 * Pure mathematics for the Chapter 05 curved SVG airplane journey.
 *
 * Uses piecewise cubic Hermite / Catmull-Rom splines across the 4 experience
 * milestones with smooth waypoint dwell easing so the plane visibly slows as
 * it arrives at each company stop, rotates cleanly along the true curve
 * tangent, and retraces deterministically in reverse.
 */

export interface CurvedWaypoint {
  id: string;
  /** Target scroll progress [0..1] where this milestone sits */
  stop: number;
  /** X coordinate in SVG viewBox [0..1200] */
  x: number;
  /** Y coordinate in SVG viewBox [0..640] */
  y: number;
}

export interface CurvedFlightSample {
  /** Normalized raw input progress [0..1] */
  rawProgress: number;
  /** Curve parameter after waypoint dwell easing [0..1] */
  easedProgress: number;
  /** Current plane X in SVG viewBox */
  x: number;
  /** Current plane Y in SVG viewBox */
  y: number;
  /** Heading angle in degrees (0 = pointing right/+X) */
  angleDeg: number;
  /** Index of the currently active milestone */
  activeIndex: number;
  /** ID of the currently active milestone */
  activeId: string;
  /** Proximity [0..1] to the active milestone (1 right at stop) */
  dwellStrength: number;
  /** All milestone IDs reached at or before current progress */
  reachedIds: string[];
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

/**
 * Applies gentle plateau dwell around evenly spaced stops so the aircraft
 * visually pauses/slows at each milestone without ever stopping backward motion.
 * Strictly monotonic: f(0) = 0, f(1) = 1, f'(t) > 0 everywhere.
 */
export function applyWaypointDwell(rawProgress: number, stopCount: number): number {
  const p = clamp01(rawProgress);
  if (stopCount <= 1) return p;
  const intervals = stopCount - 1;
  // Blend linear progress with a gentle sinusoidal dwell around each integer stop
  const dwellAmp = 0.24 / (2 * Math.PI * intervals);
  const adjusted = p - dwellAmp * Math.sin(2 * Math.PI * intervals * p);
  return clamp01(adjusted);
}

/**
 * Evaluates a Catmull-Rom spline point at global parameter t in [0..1].
 */
function evalCatmullRom(
  points: readonly CurvedWaypoint[],
  t: number
): { x: number; y: number } {
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
 * Generates an SVG `<path d="...">` string tracing the exact Catmull-Rom curve
 * sampled by `sampleCurvedFlightPath`.
 */
export function buildCurvedFlightSvgPath(
  waypoints: readonly CurvedWaypoint[],
  subdivisions = 72
): string {
  if (waypoints.length === 0) return "";
  if (waypoints.length === 1) {
    return `M ${waypoints[0].x.toFixed(1)} ${waypoints[0].y.toFixed(1)}`;
  }

  const steps = Math.max(12, Math.floor(subdivisions));
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const pt = evalCatmullRom(waypoints, i / steps);
    parts.push(`${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
  }
  return parts.join(" ");
}

/**
 * Samples the aircraft's position, tangent heading angle, active milestone, and
 * dwell strength along the curved Experience flight route.
 */
export function sampleCurvedFlightPath(
  waypoints: readonly CurvedWaypoint[],
  rawProgress: number
): CurvedFlightSample {
  if (waypoints.length === 0) {
    return {
      rawProgress: 0,
      easedProgress: 0,
      x: 0,
      y: 0,
      angleDeg: 0,
      activeIndex: 0,
      activeId: "",
      dwellStrength: 0,
      reachedIds: [],
    };
  }

  const raw = clamp01(rawProgress);
  const eased = applyWaypointDwell(raw, waypoints.length);

  const pos = evalCatmullRom(waypoints, eased);
  const eps = 0.004;
  const before = evalCatmullRom(waypoints, Math.max(0, eased - eps));
  const after = evalCatmullRom(waypoints, Math.min(1, eased + eps));
  const angleDeg = (Math.atan2(after.y - before.y, after.x - before.x) * 180) / Math.PI;

  // Determine nearest milestone and dwell proximity
  let bestIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < waypoints.length; i++) {
    const dist = Math.abs(raw - waypoints[i].stop);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }

  const halfSpan = waypoints.length > 1 ? 0.5 / (waypoints.length - 1) : 0.5;
  const dwellStrength = clamp01(1 - bestDist / Math.max(0.06, halfSpan * 0.92));

  const reachedIds = waypoints
    .filter((w) => raw >= w.stop - 0.03)
    .map((w) => w.id);

  if (reachedIds.length === 0) {
    reachedIds.push(waypoints[0].id);
  }

  return {
    rawProgress: raw,
    easedProgress: eased,
    x: pos.x,
    y: pos.y,
    angleDeg,
    activeIndex: bestIndex,
    activeId: waypoints[bestIndex].id,
    dwellStrength,
    reachedIds,
  };
}
