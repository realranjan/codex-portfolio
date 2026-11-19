/**
 * Pure deterministic scroll choreography for the Cinematic Japanese Samurai Cat Footer ("THE TOUCH").
 *
 * Inspired by Michelangelo's "The Creation of Adam":
 * - Both cat bodies remain anchored/mostly stationary at the outer viewport edges.
 * - Independent reaching paws extend from their shoulder pivots across 4 deliberate scroll phases:
 *   - Phase A (0.00 - 0.25): Entrance — visible gap between extended paws.
 *   - Phase B (0.25 - 0.60): Approach — restrained, intentional reach toward center + subtle head lean.
 *   - Phase C (0.60 - 0.85): Almost touching — slow anticipation crawl across the final gap; scenery still.
 *   - Phase D (0.85 - 1.00): Contact — fingertips meet at center; ink ripple, sumi-e brushstroke, plum blossom, CTA emphasis.
 */

export type FooterTouchPhase = "entrance" | "approach" | "anticipation" | "contact";

export interface FooterTouchState {
  /** Clamped normalized scroll progress in [0, 1] */
  progress: number;
  /** Current narrative phase */
  phase: FooterTouchPhase;
  /** Normalized remaining gap between paws (1 = wide initial gap, 0 = touching) */
  gapRatio: number;

  /** Left realistic cat body micro-lean (kept minimal so body stays anchored) */
  leftBodyShiftPx: number;
  leftHeadRotateDeg: number;
  /** Right woodblock cat body micro-lean (kept minimal so body stays anchored) */
  rightBodyShiftPx: number;
  rightHeadRotateDeg: number;

  /**
   * Left paw horizontal offset in % of its own width:
   * negative pulls it back toward the left body; 0 reaches exact center touch point.
   */
  leftPawTranslateXPct: number;
  /** Left paw subtle vertical lift in px */
  leftPawTranslateYPx: number;
  /** Left paw shoulder-pivot rotation in degrees (+ tilts slightly down, 0 levels horizontally) */
  leftPawRotateDeg: number;

  /**
   * Right woodblock paw horizontal offset in % of its own width:
   * positive pulls it back toward the right body; 0 reaches exact center touch point.
   */
  rightPawTranslateXPct: number;
  /** Right paw subtle vertical lift in px */
  rightPawTranslateYPx: number;
  /** Right paw shoulder-pivot rotation in degrees (- tilts slightly down, 0 levels horizontally) */
  rightPawRotateDeg: number;

  /** Contact moment strength in [0, 1] (strictly 0 before 0.85) */
  contactStrength: number;
  /** Ink-like concentric ripple scale & opacity */
  rippleScale: number;
  rippleOpacity: number;
  /** Expanding subtle burgundy sumi-e brushstroke progress [0, 1] */
  brushstrokeProgress: number;
  /** Delicate plum blossom reveal at touching point */
  blossomScale: number;
  blossomOpacity: number;
  blossomRotateDeg: number;
  /** Primary "Get in touch" CTA emphasis [0, 1] */
  ctaEmphasis: number;
  /** True during Phase C & D when background scenery must stay completely still */
  backgroundStill: boolean;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeZero(value: number): number {
  return Object.is(value, -0) || Math.abs(value) < 1e-9 ? 0 : value;
}

function smoothstep(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

function easeOutCubic(t: number): number {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

function easeInOutSine(t: number): number {
  const c = clamp01(t);
  return -(Math.cos(Math.PI * c) - 1) / 2;
}

/**
 * Computes all synchronized transform & contact values for a given scroll progress in [0, 1].
 * 100% pure and reversible for GSAP ScrollTrigger `scrub: true`.
 */
export function computeFooterTouchState(rawProgress: number): FooterTouchState {
  const p = clamp01(rawProgress);

  let phase: FooterTouchPhase;
  if (p < 0.25) {
    phase = "entrance";
  } else if (p < 0.6) {
    phase = "approach";
  } else if (p < 0.85) {
    phase = "anticipation";
  } else {
    phase = "contact";
  }

  // Gap ratio across the 4 phases:
  // - 0.00 -> 0.25 (Entrance): holds wide gap with gentle poised settle (1.00 -> 0.92)
  // - 0.25 -> 0.60 (Approach): deliberate smooth reach closing most of the gap (0.92 -> 0.22)
  // - 0.60 -> 0.85 (Anticipation): slow breathless crawl across tiny remaining gap (0.22 -> 0.06)
  // - 0.85 -> 1.00 (Contact): final millimeter touch (0.06 -> 0.00)
  let gapRatio: number;
  if (p <= 0.25) {
    const t = smoothstep(p / 0.25);
    gapRatio = 1.0 - t * 0.08;
  } else if (p <= 0.6) {
    const t = easeInOutSine((p - 0.25) / 0.35);
    gapRatio = 0.92 - t * 0.7;
  } else if (p <= 0.85) {
    const t = smoothstep((p - 0.6) / 0.25);
    gapRatio = 0.22 - t * 0.16;
  } else {
    const t = easeOutCubic((p - 0.85) / 0.15);
    gapRatio = 0.06 * (1 - t);
  }

  const reachProgress = 1 - gapRatio;

  // Bodies remain mostly stationary (max 6px subtle lean over entire scroll)
  const bodyLeanT = smoothstep((p - 0.15) / 0.55);
  const leftBodyShiftPx = normalizeZero(bodyLeanT * 6);
  const rightBodyShiftPx = normalizeZero(-bodyLeanT * 6);

  // Subtle independent head incline during approach, holding steady during anticipation & contact
  const headT = easeInOutSine(clamp01((p - 0.22) / 0.45));
  const leftHeadRotateDeg = normalizeZero(headT * 2.2);
  const rightHeadRotateDeg = normalizeZero(-headT * 2.2);

  // Reaching paws travel independently from their shoulder pivots toward the center contact axis.
  // Max retraction is 28% of paw width so paws remain solidly joined to each shoulder armor sleeve.
  const maxRetractPct = 28;
  const leftPawTranslateXPct = normalizeZero(-gapRatio * maxRetractPct);
  const rightPawTranslateXPct = normalizeZero(gapRatio * maxRetractPct);

  // Gentle vertical lift as paws rise to meet horizontally
  const leftPawTranslateYPx = normalizeZero(gapRatio * 10);
  const rightPawTranslateYPx = normalizeZero(gapRatio * 10);

  // Subtle shoulder pivot leveling (+5.2deg -> 0deg on left, -5.2deg -> 0deg on right)
  const leftPawRotateDeg = normalizeZero(gapRatio * 5.2);
  const rightPawRotateDeg = normalizeZero(-gapRatio * 5.2);

  // Phase D — Contact (0.85 -> 1.00)
  const contactRaw = p <= 0.85 ? 0 : clamp01((p - 0.85) / 0.15);
  const contactStrength = normalizeZero(easeOutCubic(contactRaw));

  // Subtle ink-like ripple expanding gently without bright flashes or bounce
  const rippleScale = normalizeZero(0.28 + contactStrength * 1.12);
  const rippleOpacity =
    contactRaw <= 0
      ? 0
      : normalizeZero(Math.sin(Math.min(1, contactRaw) * Math.PI * 0.78) * 0.56);

  // Restrained horizontal burgundy brushstroke expanding outward from touch point
  const brushstrokeProgress = normalizeZero(smoothstep(contactRaw));

  // Delicate small plum blossom blooming quietly at the contact point
  const blossomT = smoothstep((contactRaw - 0.12) / 0.88);
  const blossomScale = normalizeZero(0.35 + blossomT * 0.65);
  const blossomOpacity = normalizeZero(blossomT * 0.94);
  const blossomRotateDeg = normalizeZero(-16 * (1 - blossomT));

  // Contact CTA becomes calmly emphasized as the paws complete their gesture
  const ctaEmphasis = normalizeZero(
    clamp01(reachProgress * 0.35 + contactStrength * 0.65)
  );

  return {
    progress: normalizeZero(p),
    phase,
    gapRatio: normalizeZero(gapRatio),
    leftBodyShiftPx,
    leftHeadRotateDeg,
    rightBodyShiftPx,
    rightHeadRotateDeg,
    leftPawTranslateXPct,
    leftPawTranslateYPx,
    leftPawRotateDeg,
    rightPawTranslateXPct,
    rightPawTranslateYPx,
    rightPawRotateDeg,
    contactStrength,
    rippleScale,
    rippleOpacity,
    brushstrokeProgress,
    blossomScale,
    blossomOpacity,
    blossomRotateDeg,
    ctaEmphasis,
    backgroundStill: p >= 0.6,
  };
}
