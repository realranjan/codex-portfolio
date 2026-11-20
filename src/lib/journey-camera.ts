/**
 * Pure spatial camera & path choreography for Chapter 05 — The Journey / Experience.
 *
 * Models an N-company architectural exhibition stage driven deterministically by
 * scrubbed scroll progress [0..1]:
 *   - Stage A (Enter): Headline text mask reveal + thin curved Burgundy path enters.
 *   - Stage B / D / E (Milestones): Zero-drift reading plateaus where the active
 *     exhibit sits completely front-facing (rotateY = 0, scale = 1, Z = 0).
 *   - Stage C (Camera Travel): Shared camera-world horizontal pan. The passed
 *     exhibit sweeps toward the foreground left edge (partially cropped), while
 *     the upcoming exhibit emerges forward from behind it into sharp focus.
 *   - Stage F (Leave): Camera gently pulls back and the curved Burgundy path
 *     straightens smoothly into a calm horizontal line leading into Education.
 */

export type JourneyViewportTier = "desktop" | "tablet";

export type JourneyStagePhase =
  | "enter"
  | "milestone"
  | "travel"
  | "leave";

export interface JourneyExhibitPose {
  index: number;
  /** Signed distance from camera focal coordinate (i - cameraFocus) */
  relativeOffset: number;
  /** Base horizontal coordinate in the shared exhibition world (px) */
  worldXPx: number;
  /** Secondary horizontal depth parallax offset (px) for behind-emergence & edge-crop */
  localOffsetXPx: number;
  /** Subtle architectural vertical offset (px) */
  localYPx: number;
  /** Restrained Z-axis depth (px): 0 active, +foreground passed, -recessed upcoming */
  localZPx: number;
  /** Restrained Y rotation strictly bounded within [-3.2deg, +3.2deg]; 0 when active */
  rotateYDeg: number;
  /** Modest scale: 1.0 active, slight foreground scale on passed, recessed on upcoming */
  scale: number;
  /** Visibility opacity (1.0 active, secondary exhibits remain partially visible) */
  opacity: number;
  /** Stacking order so active dominates and passed moves cleanly to foreground edge */
  zIndex: number;
  /** True when this exhibit is the current active company */
  isActive: boolean;
  /** True when the camera is settled inside this exhibit's reading plateau */
  isSettled: boolean;
}

export interface JourneyPathNode {
  index: number;
  /** X in SVG viewBox [0..viewBoxWidth] */
  x: number;
  /** Y in SVG viewBox [0..viewBoxHeight] after current Stage F straightening */
  y: number;
  /** Whether the drawn Burgundy path has reached this milestone */
  isReached: boolean;
  /** Whether this milestone is currently active */
  isActive: boolean;
}

export interface JourneyCameraState {
  rawProgress: number;
  tier: JourneyViewportTier;
  phase: JourneyStagePhase;
  /** Continuous camera focal coordinate across [0 .. count - 1] */
  cameraFocus: number;
  /** Nearest / currently active milestone index [0 .. count - 1] */
  activeIndex: number;
  /** 1.0 when settled inside a quiet reading plateau, 0.0 mid-travel */
  settleStrength: number;
  /** Stage A headline reveal mask progress [0..1] (0 = hidden below mask, 1 = revealed) */
  headlineReveal: number;
  /** Shared world container horizontal translation (px) */
  cameraTranslateXPx: number;
  /** Shared world container vertical compensation + gentle pullback (px) */
  cameraTranslateYPx: number;
  /** Shared world container Z pullback (px, negative during Stage A entry & Stage F exit) */
  cameraTranslateZPx: number;
  /** Subtle shared world container scale (1.0 during tour, gentle pullback in Stage F) */
  cameraScale: number;
  /** Normalized length of the thin Burgundy journey path drawn [0..1] */
  pathDrawProgress: number;
  /** Stage F path straightening factor [0 = curved, 1 = clean horizontal line] */
  pathFlattenProgress: number;
  /** Stage F exit progress [0..1] */
  exitProgress: number;
  /** World-space horizontal stride between adjacent company exhibits (px) */
  stridePx: number;
  /** Perspective distance for the stage container (px) */
  perspectivePx: number;
  /** Per-exhibit spatial poses inside the shared camera world */
  exhibits: JourneyExhibitPose[];
}

export interface JourneySegmentSchedule {
  enterEnd: number;
  exitStart: number;
  plateaus: Array<{ index: number; start: number; end: number; midpoint: number }>;
  travels: Array<{ fromIndex: number; toIndex: number; start: number; end: number }>;
}

const ENTER_END = 0.09;
const EXIT_START = 0.87;
const PLATEAU_WEIGHT = 1.0;
const TRAVEL_WEIGHT = 1.15;

/** Subtle architectural hanging height rhythm (in px) so exhibits feel curated, not identical */
const BAY_ELEVATION_PATTERN_PX = [0, -10, 8, -6, 6] as const;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Quintic smootherstep for especially calm, physically coherent camera departures & arrivals */
function smootherstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function cleanZero(n: number): number {
  return Object.is(n, -0) || Math.abs(n) < 1e-6 ? 0 : n;
}

/**
 * Computes the deterministic Stage A..F progress schedule for any N >= 1 companies.
 */
export function buildJourneySchedule(count: number): JourneySegmentSchedule {
  const safeCount = Math.max(1, Math.floor(count));
  const tourSpan = EXIT_START - ENTER_END;
  const totalUnits =
    safeCount * PLATEAU_WEIGHT + Math.max(0, safeCount - 1) * TRAVEL_WEIGHT;

  const plateauSpan = (PLATEAU_WEIGHT / totalUnits) * tourSpan;
  const travelSpan = (TRAVEL_WEIGHT / totalUnits) * tourSpan;

  const plateaus: JourneySegmentSchedule["plateaus"] = [];
  const travels: JourneySegmentSchedule["travels"] = [];

  let cursor = ENTER_END;
  for (let i = 0; i < safeCount; i++) {
    const start = cursor;
    const end = i === safeCount - 1 ? EXIT_START : cursor + plateauSpan;
    plateaus.push({
      index: i,
      start,
      end,
      midpoint: (start + end) * 0.5,
    });
    cursor = end;

    if (i < safeCount - 1) {
      const tStart = cursor;
      const tEnd = cursor + travelSpan;
      travels.push({
        fromIndex: i,
        toIndex: i + 1,
        start: tStart,
        end: tEnd,
      });
      cursor = tEnd;
    }
  }

  return {
    enterEnd: ENTER_END,
    exitStart: EXIT_START,
    plateaus,
    travels,
  };
}

/**
 * Exact normalized scroll progress [0..1] corresponding to the quiet reading center
 * of milestone `index`. Used by Prev/Next and direct milestone navigation buttons.
 */
export function getJourneyMilestoneAnchorProgress(
  index: number,
  count: number
): number {
  const safeCount = Math.max(1, Math.floor(count));
  const safeIndex = clamp(Math.round(index), 0, safeCount - 1);
  const schedule = buildJourneySchedule(safeCount);
  return Number((schedule.plateaus[safeIndex]?.midpoint ?? 0.5).toFixed(4));
}

/**
 * Computes the complete spatial camera & per-exhibit state for a given scroll progress.
 *
 * Works seamlessly for any number of companies (`count >= 1`) and both `desktop`
 * and `tablet` tiers (tablet applies smaller stride, reduced depth, and gentler rotation).
 */
export function computeJourneyCameraState(
  rawProgress: number,
  count: number,
  tier: JourneyViewportTier = "desktop"
): JourneyCameraState {
  const safeCount = Math.max(1, Math.floor(count));
  const raw = clamp01(rawProgress);
  const schedule = buildJourneySchedule(safeCount);

  const isTablet = tier === "tablet";
  const perspectivePx = isTablet ? 1350 : 1850;
  const stridePx = isTablet ? 720 : 940;
  const recedeZPx = isTablet ? 76 : 148;
  const foregroundZPx = isTablet ? 16 : 34;
  const maxRotateYDeg = isTablet ? 1.8 : 3.0;
  const elevationScale = isTablet ? 0.5 : 1.0;
  const pullbackZMax = isTablet ? 44 : 76;
  const pullbackScaleDelta = isTablet ? 0.022 : 0.036;

  // Stage A (Enter) & Stage F (Leave)
  const enterProgress = smootherstep(0, schedule.enterEnd, raw);
  const exitProgress = smootherstep(schedule.exitStart, 1, raw);

  // Determine cameraFocus, phase, and settleStrength from the piecewise schedule
  let cameraFocus = 0;
  let phase: JourneyStagePhase = "milestone";
  let settleStrength = 1;

  if (raw < schedule.enterEnd) {
    phase = "enter";
    cameraFocus = 0;
    settleStrength = enterProgress;
  } else if (raw > schedule.exitStart) {
    phase = "leave";
    cameraFocus = safeCount - 1;
    settleStrength = 1 - exitProgress;
  } else {
    let matched = false;
    for (const p of schedule.plateaus) {
      if (raw >= p.start && raw <= p.end) {
        phase = "milestone";
        cameraFocus = p.index;
        settleStrength = 1;
        matched = true;
        break;
      }
    }
    if (!matched) {
      for (const t of schedule.travels) {
        if (raw >= t.start && raw <= t.end) {
          phase = "travel";
          const localT = smootherstep(t.start, t.end, raw);
          cameraFocus = t.fromIndex + localT;
          // Lowest settle right at midpoint of travel (0.5), rising smoothly near endpoints
          const edgeProximity = Math.abs(localT - 0.5) * 2;
          settleStrength = smoothstep(0.25, 1, edgeProximity);
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      cameraFocus = safeCount - 1;
      phase = "milestone";
      settleStrength = 1;
    }
  }

  const activeIndex = clamp(Math.round(cameraFocus), 0, safeCount - 1);

  // Smoothly interpolate vertical bay elevation so the active exhibit stays at ideal eye-level
  const floorIdx = Math.floor(cameraFocus);
  const ceilIdx = Math.min(safeCount - 1, floorIdx + 1);
  const frac = cameraFocus - floorIdx;
  const bayY = (idx: number) =>
    BAY_ELEVATION_PATTERN_PX[idx % BAY_ELEVATION_PATTERN_PX.length] * elevationScale;
  const focusedElevationY = lerp(bayY(floorIdx), bayY(ceilIdx), frac);

  // Shared camera world container transforms
  const entryShiftX = (1 - enterProgress) * (isTablet ? 36 : 56);
  const entryShiftZ = (1 - enterProgress) * (isTablet ? -22 : -36);

  const cameraTranslateXPx = cleanZero(
    Number((-cameraFocus * stridePx + entryShiftX).toFixed(2))
  );
  const cameraTranslateYPx = cleanZero(
    Number((-focusedElevationY - exitProgress * (isTablet ? 8 : 14)).toFixed(2))
  );
  const cameraTranslateZPx = cleanZero(
    Number((entryShiftZ - exitProgress * pullbackZMax).toFixed(2))
  );
  const cameraScale = Number((1 - exitProgress * pullbackScaleDelta).toFixed(4));

  // Headline text mask reveals cleanly across Stage A
  const headlineReveal = Number(smoothstep(0.0, schedule.enterEnd * 0.88, raw).toFixed(4));

  // Path drawing: enters in Stage A, extends milestone-to-milestone during tour, finishes in Stage F
  const firstNodePathFrac = 0.14;
  const lastNodePathFrac = 0.86;
  let pathDrawProgress: number;
  if (raw < schedule.enterEnd) {
    pathDrawProgress = lerp(0.03, firstNodePathFrac, enterProgress);
  } else if (raw > schedule.exitStart) {
    pathDrawProgress = lerp(lastNodePathFrac, 1.0, exitProgress);
  } else {
    const tourRatio = safeCount > 1 ? cameraFocus / (safeCount - 1) : 1;
    pathDrawProgress = lerp(firstNodePathFrac, lastNodePathFrac, tourRatio);
  }
  pathDrawProgress = Number(clamp01(pathDrawProgress).toFixed(4));

  const pathFlattenProgress = Number(exitProgress.toFixed(4));

  // Compute spatial pose for every exhibit inside the shared camera world
  const exhibits: JourneyExhibitPose[] = [];
  for (let i = 0; i < safeCount; i++) {
    const rel = i - cameraFocus;
    const absRel = Math.abs(rel);
    const worldXPx = i * stridePx;
    const localYPx = cleanZero(Number(bayY(i).toFixed(2)));

    let localOffsetXPx = 0;
    let localZPx = 0;
    let rotateYDeg = 0;
    let scale = 1;
    let opacity = 1;
    let zIndex = 30;

    if (rel < 0) {
      // Passed exhibit: sweeps cleanly to the left foreground edge (partially cropped by
      // viewport edge with zero overlap over the active exhibit's left margin)
      const passT = Math.min(1, absRel);
      const farPassT = clamp01(absRel - 1);
      localOffsetXPx = -passT * (isTablet ? 24 : 36) - farPassT * (isTablet ? 90 : 140);
      // Foreground pull engages smoothly once clearing horizontally so it never intersects active text
      localZPx = passT * foregroundZPx - farPassT * (foregroundZPx * 0.6);
      rotateYDeg = clamp(passT * (maxRotateYDeg * 0.85), -maxRotateYDeg, maxRotateYDeg);
      scale = 1 + passT * (isTablet ? 0.014 : 0.024) - farPassT * 0.03;
      opacity = absRel <= 1 ? lerp(1, 0.56, passT) : lerp(0.56, 0.14, farPassT);
      zIndex = absRel < 0.55 ? 28 : 22;
    } else if (rel > 0) {
      // Upcoming exhibit: recessed behind the active exhibit, emerging smoothly forward
      const nextT = Math.min(1, absRel);
      const farT = clamp01(absRel - 1);
      // Positioned slightly behind the active exhibit's right flank so it emerges from behind it
      localOffsetXPx = -nextT * (isTablet ? 104 : 156) - farT * (isTablet ? 90 : 135);
      localZPx = -nextT * recedeZPx - farT * (recedeZPx * 0.62);
      rotateYDeg = clamp(-nextT * maxRotateYDeg, -maxRotateYDeg, maxRotateYDeg);
      scale = 1 - nextT * (isTablet ? 0.06 : 0.095) - farT * 0.065;
      opacity =
        absRel <= 1
          ? lerp(1, 0.58, nextT)
          : absRel <= 2
            ? lerp(0.58, 0.22, farT)
            : Math.max(0.08, 0.22 - (absRel - 2) * 0.14);
      zIndex = Math.max(5, 26 - Math.round(absRel * 10));
    }

    exhibits.push({
      index: i,
      relativeOffset: cleanZero(Number(rel.toFixed(4))),
      worldXPx,
      localOffsetXPx: cleanZero(Number(localOffsetXPx.toFixed(2))),
      localYPx,
      localZPx: cleanZero(Number(localZPx.toFixed(2))),
      rotateYDeg: cleanZero(Number(rotateYDeg.toFixed(3))),
      scale: Number(scale.toFixed(4)),
      opacity: Number(clamp01(opacity).toFixed(4)),
      zIndex,
      isActive: i === activeIndex,
      isSettled: i === activeIndex && settleStrength >= 0.99,
    });
  }

  return {
    rawProgress: Number(raw.toFixed(4)),
    tier,
    phase,
    cameraFocus: Number(cameraFocus.toFixed(4)),
    activeIndex,
    settleStrength: Number(settleStrength.toFixed(4)),
    headlineReveal,
    cameraTranslateXPx,
    cameraTranslateYPx,
    cameraTranslateZPx,
    cameraScale,
    pathDrawProgress,
    pathFlattenProgress,
    exitProgress: Number(exitProgress.toFixed(4)),
    stridePx,
    perspectivePx,
    exhibits,
  };
}

/**
 * Generates the thin curved Burgundy journey path SVG `d` string & milestone anchor nodes
 * across a wide exhibition viewBox (`1400 x 260`).
 *
 * When `flattenProgress` transitions `0 -> 1` in Stage F, every point smoothly
 * interpolates toward `horizonY`, turning the curved journey line into a calm,
 * clean horizontal Burgundy line that leads directly into the Education chapter.
 */
export function buildJourneyRouteGeometry(
  count: number,
  flattenProgress: number,
  activeIndex: number,
  pathDrawProgress: number,
  viewBoxWidth = 1400,
  viewBoxHeight = 260
): {
  pathD: string;
  horizonY: number;
  nodes: JourneyPathNode[];
} {
  const safeCount = Math.max(1, Math.floor(count));
  const flatten = clamp01(flattenProgress);
  const horizonY = viewBoxHeight * 0.58;
  const marginX = viewBoxWidth * 0.14;
  const spanX = viewBoxWidth - marginX * 2;

  // Deterministic gentle architectural undulation (subtle, restrained, never roller-coaster)
  const amplitude = viewBoxHeight * 0.24 * (1 - flatten);
  const evalY = (u: number): number => {
    // u in [0..1] across full SVG width; fade curve smoothly toward ends so edges stay poised
    const edgeWindow = Math.sin(Math.PI * clamp01(u));
    const wave = Math.sin(u * Math.PI * (safeCount - 0.35) - 0.45);
    return horizonY - amplitude * edgeWindow * wave;
  };

  const samples = 64;
  const commands: string[] = [];
  for (let s = 0; s <= samples; s++) {
    const u = s / samples;
    const x = u * viewBoxWidth;
    const y = evalY(u);
    commands.push(`${s === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  const nodes: JourneyPathNode[] = [];
  for (let i = 0; i < safeCount; i++) {
    const nodeRatio = safeCount > 1 ? i / (safeCount - 1) : 0.5;
    const x = marginX + nodeRatio * spanX;
    const u = x / viewBoxWidth;
    const y = evalY(u);
    nodes.push({
      index: i,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      isReached: pathDrawProgress >= u - 0.025,
      isActive: i === activeIndex,
    });
  }

  return {
    pathD: commands.join(" "),
    horizonY: Number(horizonY.toFixed(1)),
    nodes,
  };
}
