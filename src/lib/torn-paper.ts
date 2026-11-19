/**
 * Deterministic multi-octave procedural Japanese handmade torn-paper edge generator
 * and 4-phase scroll-peel motion math.
 *
 * Pure TypeScript (no DOM dependencies) so SVG paths are 100% deterministic across
 * SSR and client hydration, and every scroll phase is unit-testable.
 */

export interface TornPaperPathSet {
  viewBoxWidth: number;
  viewBoxHeight: number;
  /** Primary filled dark paper silhouette closing along top edge (y=0) */
  sheetPath: string;
  /** Thin pale raw-pulp deckle fiber fringe peeking 2–5px beneath the torn edge */
  fiberFringePath: string;
  /** Offset contact-shadow silhouette cast downward onto the warm ivory paper below */
  shadowPath: string;
  /** Inner curl highlight ribbon running just above the torn edge */
  curlHighlightPath: string;
  /** Sampled boundary points along the tear edge for verification */
  samplePoints: ReadonlyArray<{ x: number; y: number }>;
}

/** Deterministic hash in [0, 1) for integer lattice coordinates */
function hash1D(n: number, seed: number): number {
  const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/** Smooth 1D value noise in [-1, 1] */
function valueNoise1D(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash1D(i, seed) * 2 - 1;
  const b = hash1D(i + 1, seed) * 2 - 1;
  return a + (b - a) * u;
}

/** Piecewise-linear irregular macro profile matching organic handmade paper tear */
const MACRO_ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [0.0, 0.42],
  [0.055, 0.46],
  [0.105, 0.44],
  [0.155, 0.49],
  [0.195, 0.56],
  [0.23, 0.41],
  [0.275, 0.31], // high torn peak on left-center
  [0.315, 0.39],
  [0.335, 0.64], // steep tear drop into hanging flap
  [0.365, 0.78], // deep hanging torn paper flap
  [0.388, 0.72],
  [0.412, 0.52],
  [0.44, 0.42], // concave arch
  [0.485, 0.49],
  [0.535, 0.59],
  [0.585, 0.56],
  [0.64, 0.48],
  [0.685, 0.43],
  [0.715, 0.38], // sharp jagged right-center peak
  [0.745, 0.53],
  [0.79, 0.61], // right trough
  [0.835, 0.45],
  [0.885, 0.4],
  [0.935, 0.54],
  [0.975, 0.57],
  [1.0, 0.51],
];

function sampleMacroProfile(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  for (let i = 0; i < MACRO_ANCHORS.length - 1; i++) {
    const [x0, y0] = MACRO_ANCHORS[i];
    const [x1, y1] = MACRO_ANCHORS[i + 1];
    if (clamped >= x0 && clamped <= x1) {
      const local = (clamped - x0) / Math.max(1e-6, x1 - x0);
      // Slight ease without losing crisp tear corners
      const blend = local * 0.55 + local * local * (3 - 2 * local) * 0.45;
      return y0 + (y1 - y0) * blend;
    }
  }
  return MACRO_ANCHORS[MACRO_ANCHORS.length - 1][1];
}

/**
 * Generates high-resolution, organically torn handmade Japanese paper edge SVG paths
 * with 720 micro-fiber vertices across a 1600px width (zero smooth waves or uniform zigzags).
 */
export function generateTornPaperPaths(
  viewBoxWidth = 1600,
  viewBoxHeight = 190,
  segments = 720,
  seed = 42
): TornPaperPathSet {
  const count = Math.max(120, Math.floor(segments));
  const points: Array<{ x: number; y: number }> = [];
  const fiberPoints: Array<{ x: number; y: number }> = [];
  const shadowPoints: Array<{ x: number; y: number }> = [];
  const curlUpperPoints: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = t * viewBoxWidth;

    const macro = sampleMacroProfile(t) * viewBoxHeight;

    // Multi-octave organic paper tear displacements
    const mediumTears = valueNoise1D(t * 28, seed + 1.3) * 11.5;
    const coarseNotches = valueNoise1D(t * 74, seed + 4.7) * 5.2;
    const fineFibers = valueNoise1D(t * 210, seed + 9.1) * 2.7;

    // Tiny asymmetric paper pulp whiskers & deckled micro-teeth
    const toothRand = hash1D(i, seed + 17.5);
    const whisker =
      toothRand > 0.84
        ? (toothRand - 0.84) * 26 // fine protruding paper fiber tuft
        : toothRand < 0.14
          ? -(0.14 - toothRand) * 19 // sharp micro tear notch
          : (toothRand - 0.5) * 2.4;

    const rawY = macro + mediumTears + coarseNotches + fineFibers + whisker;
    const y = Math.min(viewBoxHeight - 14, Math.max(18, rawY));

    points.push({ x, y });

    // Exposed raw-kozo deckle pulp fringe peeking slightly beneath the dyed umber edge
    const fringeRand = hash1D(i, seed + 31.2);
    const fringeOffset = 1.8 + fringeRand * 4.4 + (fringeRand > 0.82 ? 3.2 : 0);
    fiberPoints.push({ x, y: Math.min(viewBoxHeight - 4, y + fringeOffset) });

    // Contact shadow follows the macro/medium contour slightly softer & lower
    const shadowY = Math.min(
      viewBoxHeight - 2,
      y + 5.5 + valueNoise1D(t * 42, seed + 53.1) * 1.4
    );
    shadowPoints.push({ x, y: shadowY });

    // Subtle edge-curl light catch band ~16-24px above the tear line
    const curlY = Math.max(4, y - (18 + valueNoise1D(t * 18, seed + 71.4) * 5));
    curlUpperPoints.push({ x, y: curlY });
  }

  const fmt = (n: number) => n.toFixed(1);

  const edgeSegments = points
    .map((pt, idx) => `${idx === 0 ? "M" : "L"}${fmt(pt.x)},${fmt(pt.y)}`)
    .join(" ");

  const sheetPath = `${edgeSegments} L${fmt(viewBoxWidth)},0 L0,0 Z`;

  // Thin deckled kozo fiber fringe ribbon tracing between main edge and slightly lower fiber tips
  const fiberForward = fiberPoints
    .map((pt, idx) => `${idx === 0 ? "M" : "L"}${fmt(pt.x)},${fmt(pt.y)}`)
    .join(" ");
  const edgeReverse = [...points]
    .reverse()
    .map((pt) => `L${fmt(pt.x)},${fmt(Math.max(2, pt.y - 2.2))}`)
    .join(" ");
  const fiberFringePath = `${fiberForward} ${edgeReverse} Z`;

  // Contact shadow polygon extending from tear top down to offset shadow boundary
  const shadowEdge = shadowPoints
    .map((pt, idx) => `${idx === 0 ? "M" : "L"}${fmt(pt.x)},${fmt(pt.y)}`)
    .join(" ");
  const shadowPath = `${shadowEdge} L${fmt(viewBoxWidth)},0 L0,0 Z`;

  // Delicate paper-edge curl sheen strip immediately above the torn edge
  const curlForward = curlUpperPoints
    .map((pt, idx) => `${idx === 0 ? "M" : "L"}${fmt(pt.x)},${fmt(pt.y)}`)
    .join(" ");
  const curlReverse = [...points]
    .reverse()
    .map((pt) => `L${fmt(pt.x)},${fmt(pt.y)}`)
    .join(" ");
  const curlHighlightPath = `${curlForward} ${curlReverse} Z`;

  return {
    viewBoxWidth,
    viewBoxHeight,
    sheetPath,
    fiberFringePath,
    shadowPath,
    curlHighlightPath,
    samplePoints: points,
  };
}

export type TornPaperPhase = "before" | "peeling" | "reveal" | "complete";

export interface TornPaperPeelState {
  progress: number;
  phase: TornPaperPhase;
  /** Vertical transform percentage for the dark paper sheet + attached torn edge (0 -> -126%) */
  sheetYPercent: number;
  /** Subtle upward parallax offset (px) for editorial copy printed on the dark sheet */
  darkContentY: number;
  /** Contact shadow opacity along the torn boundary (0.2 -> 1 -> 0 once exited) */
  shadowOpacity: number;
  /** Contact shadow vertical spread in px (increases slightly as paper lifts) */
  shadowOffsetY: number;
  /** Subtle edge-curl highlight intensity (0 -> 0.9 -> 0) */
  curlOpacity: number;
  /** Phase 4 (85-100%) restrained upward masked-text reveal progress [0..1] for ivory headline */
  headlineReveal: number;
  /** Ivory headline Y percentage inside its overflow-hidden mask (108 -> 0) */
  headlineYPercent: number;
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Pure 4-phase scroll curve for the pinned Japanese torn-paper peel transition:
 * - Phase 1 (0.00 -> 0.20): Dark sheet fills viewport; torn edge rests just below viewport.
 * - Phase 2 (0.20 -> 0.45): Controlled slower-than-scroll peel begins; torn edge & contact shadow enter.
 * - Phase 3 (0.45 -> 0.85): Main reveal; irregular torn edge travels upward through viewport exposing fixed ivory layer.
 * - Phase 4 (0.85 -> 1.00): Torn edge clears top of viewport; ivory headline reveals via upward mask before unpinning.
 */
export function computeTornPaperPeelState(rawProgress: number): TornPaperPeelState {
  const p = clamp01(rawProgress);

  let phase: TornPaperPhase = "complete";
  if (p < 0.2) {
    phase = "before";
  } else if (p < 0.45) {
    phase = "peeling";
  } else if (p < 0.85) {
    phase = "reveal";
  }

  // Piece-wise continuous vertical peel curve (C1-smooth across phases, always moving via transform)
  let sheetYPercent: number;
  if (p <= 0.2) {
    // Phase 1: gentle paper tension before torn edge enters viewport
    const t = p / 0.2;
    sheetYPercent = -2.5 * (t * t);
  } else if (p <= 0.45) {
    // Phase 2: controlled parallax peel as torn edge rises into lower third
    const t = (p - 0.2) / 0.25;
    const eased = t * 0.45 + smoothstep(0, 1, t) * 0.55;
    sheetYPercent = -2.5 - 32.5 * eased; // -2.5% -> -35%
  } else if (p < 0.85) {
    // Phase 3: main reveal sweeping torn edge cleanly out the top of the viewport
    const t = (p - 0.45) / 0.4;
    const eased = t * 0.65 + smoothstep(0, 1, t) * 0.35;
    sheetYPercent = -35 - 91 * eased; // -35% -> -126% (fully clears 100svh + ~190px torn skirt)
  } else {
    // Phase 4: sheet & deepest hanging torn flap remain completely above viewport
    sheetYPercent = -126;
  }

  // Dark sheet inner copy moves away physically with the sheet (+ restrained subtle inner parallax)
  const darkContentY = -96 * smoothstep(0.05, 0.82, p);

  // Narrow soft contact shadow strengthens during peel and clears smoothly as tear exits top
  const shadowEnter = smoothstep(0.18, 0.34, p);
  const shadowExit = 1 - smoothstep(0.8, 0.87, p);
  const shadowOpacity = shadowEnter * shadowExit;
  const shadowOffsetY = 4 + 10 * smoothstep(0.2, 0.65, p);

  // Subtle paper-edge curl sheen peaks during mid-peel (Phase 2 & 3)
  const curlOpacity = smoothstep(0.2, 0.42, p) * (1 - smoothstep(0.76, 0.86, p)) * 0.92;

  // Phase 4 (85-100%): Restrained upward masked-text reveal of the ivory section's headline
  const headlineReveal = smoothstep(0.85, 0.985, p);
  const headlineYPercent = (1 - headlineReveal) * 108;

  return {
    progress: p,
    phase,
    sheetYPercent: sheetYPercent === 0 ? 0 : sheetYPercent,
    darkContentY: darkContentY === 0 ? 0 : darkContentY,
    shadowOpacity,
    shadowOffsetY,
    curlOpacity,
    headlineReveal,
    headlineYPercent,
  };
}
