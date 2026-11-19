export interface AboutStatementMotion {
  /** 0..1 visibility opacity inside the masked statement viewport */
  opacity: number;
  /** Vertical offset in pixels (+26 entering from below, 0 resting, -26 exiting upward) */
  translateY: number;
  /** Whether this statement is currently active/readable */
  isActive: boolean;
}

export interface AboutStoryState {
  /** Clamped normalized scroll progress [0, 1] */
  progress: number;
  /** Current narrative scene (1..5) */
  scene: 1 | 2 | 3 | 4 | 5;
  /** Active progression marker index (0..3 -> 01..04) */
  activeStatementIndex: 0 | 1 | 2 | 3;
  /** Scene 01 primary headline vertical mask reveal [0..1] */
  headlineMainReveal: number;
  /** Scene 01 italic "who..." vertical mask reveal [0..1] */
  headlineItalicReveal: number;
  /** 4 masked statement states (01..04) */
  statements: [
    AboutStatementMotion,
    AboutStatementMotion,
    AboutStatementMotion,
    AboutStatementMotion,
  ];
  /** Scene 05 settled Philosophy paragraphs reveal [0..1] */
  philosophyReveal: number;
  /** Scene 05 Philosophy subtle upward rise in px (22 -> 0) */
  philosophyTranslateY: number;
  /** Subtle backdrop circular sun vertical parallax in px (0 -> -6) */
  sunShiftY: number;
  /** Middle layer distant mountains vertical parallax in px (0 -> -14, within 10-15px) */
  mountainShiftY: number;
  /** Foreground Japanese pine vertical parallax in px (0 -> -30, within 20-35px) */
  pineShiftY: number;
  /** Subtle pine horizontal depth drift relative to mountains in px (0 -> -10) */
  pineShiftX: number;
  /** Subtle ink painting overall presence (0.82 -> 1.00) */
  artworkPresence: number;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t: number): number {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

function easeInCubic(t: number): number {
  const c = clamp01(t);
  return c * c * c;
}

/**
 * Computes a single masked statement's upward enter -> hold -> upward exit motion.
 * Uses a restrained ~26px vertical travel so typography glides cleanly inside its mask.
 */
function computeWindowedStatement(
  p: number,
  enterStart: number,
  enterEnd: number,
  exitStart: number,
  exitEnd: number,
  stayVisible = false
): AboutStatementMotion {
  const MAX_TRAVEL_PX = 26;

  if (p <= enterStart) {
    return { opacity: 0, translateY: MAX_TRAVEL_PX, isActive: false };
  }

  if (p < enterEnd) {
    const t = easeOutCubic((p - enterStart) / (enterEnd - enterStart));
    return {
      opacity: t,
      translateY: MAX_TRAVEL_PX * (1 - t),
      isActive: t > 0.35,
    };
  }

  if (stayVisible || p <= exitStart) {
    return { opacity: 1, translateY: 0, isActive: true };
  }

  if (p < exitEnd) {
    const t = easeInCubic((p - exitStart) / (exitEnd - exitStart));
    return {
      opacity: 1 - t,
      translateY: -MAX_TRAVEL_PX * t,
      isActive: t < 0.5,
    };
  }

  return { opacity: 0, translateY: -MAX_TRAVEL_PX, isActive: false };
}

/**
 * Target scroll progress anchors for clicking progression markers 01..04 directly.
 */
export const ABOUT_STATEMENT_TARGET_PROGRESS = [0.24, 0.45, 0.65, 0.9] as const;

/**
 * Deterministic 5-scene scroll choreography for Chapter 01 — About & Philosophy.
 *
 * Scene timeline across normalized scroll progress [0, 1]:
 * - Scene 01 (0.00 - 0.14): Intro headline mask ("I'm the kind of person" -> "who...")
 * - Scene 02 (0.14 - 0.35): Statement 01 ("can't leave a question unanswered.")
 * - Scene 03 (0.35 - 0.56): Statement 02 ("builds things to understand how they work.")
 * - Scene 04 (0.56 - 0.76): Statement 03 ("turns ideas into working systems.")
 * - Scene 05 (0.76 - 1.00): Statement 04 ("gets lost in the details.") + settled Philosophy
 *
 * Fully reversible, zero spring physics, and strictly bounded 3-layer parallax:
 * - Mountains (middle layer): 0 -> -14px (within 10-15px specification)
 * - Japanese pine (foreground): 0 -> -30px (within 20-35px specification)
 */
export function computeAboutStoryState(rawProgress: number): AboutStoryState {
  const p = clamp01(rawProgress);

  // Scene 01: Primary headline settles crisp immediately while "who..." completes its restrained mask glide
  const headlineMainReveal = 0.55 + 0.45 * smoothstep(0.0, 0.06, p);
  const headlineItalicReveal = 0.25 + 0.75 * smoothstep(0.02, 0.12, p);

  // Statements 01 -> 04 (strictly non-overlapping peaks, masked ~26px upward transitions)
  const s0 = computeWindowedStatement(p, 0.13, 0.21, 0.3, 0.36, false);
  const s1 = computeWindowedStatement(p, 0.35, 0.43, 0.51, 0.57, false);
  const s2 = computeWindowedStatement(p, 0.56, 0.63, 0.71, 0.76, false);
  const s3 = computeWindowedStatement(p, 0.75, 0.82, 1.0, 1.0, true);

  // Scene 05 settled Philosophy paragraphs (reveals cleanly and holds calm through 0.90 -> 1.00)
  const philosophyReveal = smoothstep(0.8, 0.9, p);
  const philosophyTranslateY = 22 * (1 - philosophyReveal);

  // Current scene (1..5)
  let scene: 1 | 2 | 3 | 4 | 5 = 1;
  if (p >= 0.76) {
    scene = 5;
  } else if (p >= 0.56) {
    scene = 4;
  } else if (p >= 0.35) {
    scene = 3;
  } else if (p >= 0.14) {
    scene = 2;
  }

  // Active progression marker (0..3 -> 01..04)
  let activeStatementIndex: 0 | 1 | 2 | 3 = 0;
  if (p >= 0.75) {
    activeStatementIndex = 3;
  } else if (p >= 0.56) {
    activeStatementIndex = 2;
  } else if (p >= 0.35) {
    activeStatementIndex = 1;
  }

  // 3-layer restrained parallax (monotonic, smooth, strictly bounded)
  const parallaxCurve = smoothstep(0, 1, p);
  const sunShiftY = -6 * parallaxCurve || 0;
  const mountainShiftY = -14 * parallaxCurve || 0; // 14px (within 10-15px target)
  const pineShiftY = -30 * parallaxCurve || 0; // 30px (within 20-35px target)
  const pineShiftX = -10 * parallaxCurve || 0; // subtle relative depth shift against mountains
  const artworkPresence = 0.84 + 0.16 * smoothstep(0.0, 0.18, p);

  return {
    progress: p,
    scene,
    activeStatementIndex,
    headlineMainReveal,
    headlineItalicReveal,
    statements: [s0, s1, s2, s3],
    philosophyReveal,
    philosophyTranslateY,
    sunShiftY,
    mountainShiftY,
    pineShiftY,
    pineShiftX,
    artworkPresence,
  };
}

/**
 * Computes subtle bounded pointer parallax target for the foreground pine tree.
 * Returns at most +-8px X and +-5px Y so the pine responds gently without drifting.
 */
export function computePinePointerTarget(
  normalizedX: number,
  normalizedY: number
): { x: number; y: number } {
  const nx = Math.max(-1, Math.min(1, Number.isFinite(normalizedX) ? normalizedX : 0));
  const ny = Math.max(-1, Math.min(1, Number.isFinite(normalizedY) ? normalizedY : 0));
  return {
    x: nx * 7,
    y: ny * 5,
  };
}
