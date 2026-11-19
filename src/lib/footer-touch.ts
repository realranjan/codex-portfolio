/**
 * Pure deterministic scroll choreography for the Cinematic Japanese Samurai Cat Footer ("THE TOUCH").
 *
 * Michelangelo "Creation of Adam" whole-figure composition:
 * - Each samurai cat (body + proportionate reaching arm bonded together as ONE unified figure)
 *   glides smoothly inward as a whole from the outer edges toward the center burgundy sun.
 * - Zero detached/sliding limbs: both cats move with sculptural weight across 4 scroll phases:
 *   - Phase A (0.00 - 0.25): Entrance — both whole cats poised back with a wide, dramatic gap.
 *   - Phase B (0.25 - 0.60): Approach — both entire cats glide smoothly inward & level slightly.
 *   - Phase C (0.60 - 0.85): Anticipation — slow, breathless crawl across the final narrow gap; scenery still.
 *   - Phase D (0.85 - 1.00): Contact — paws touch gently dead-center over the textured sun; ink ripple,
 *     sumi-e brushstroke, delicate plum blossom, and calm CTA emphasis.
 */

export type FooterTouchPhase = "entrance" | "approach" | "anticipation" | "contact";

export interface FooterTouchState {
  /** Clamped normalized scroll progress in [0, 1] */
  progress: number;
  /** Current narrative phase */
  phase: FooterTouchPhase;
  /** Normalized remaining gap between the two reaching paws (1 = wide initial gap, 0 = touching) */
  gapRatio: number;

  /**
   * Entire Left Realistic Samurai Cat unit horizontal offset in % of its own unit width:
   * negative pulls the entire cat outward toward the left edge; 0 places its fingertip at exact center.
   */
  leftCatTranslateXPct: number;
  /** Subtle vertical rise as the left cat reaches upward into contact (px) */
  leftCatTranslateYPx: number;
  /** Gentle whole-figure sculptural tilt as the left cat leans into the touch (deg) */
  leftCatRotateDeg: number;

  /**
   * Entire Right Woodblock Samurai Cat unit horizontal offset in % of its own unit width:
   * positive pulls the entire cat outward toward the right edge; 0 places its fingertip at exact center.
   */
  rightCatTranslateXPct: number;
  /** Subtle vertical rise as the right cat reaches upward into contact (px) */
  rightCatTranslateYPx: number;
  /** Gentle whole-figure sculptural tilt as the right cat leans into the touch (deg) */
  rightCatRotateDeg: number;

  /** Contact moment strength in [0, 1] (strictly 0 before 0.85) */
  contactStrength: number;
  /** Subtle ink-like concentric ripple scale & opacity */
  rippleScale: number;
  rippleOpacity: number;
  /** Restrained horizontal burgundy sumi-e brushstroke progress [0, 1] */
  brushstrokeProgress: number;
  /** Delicate plum blossom reveal at touching point */
  blossomScale: number;
  blossomOpacity: number;
  blossomRotateDeg: number;
  /** Primary "Get in touch" CTA emphasis [0, 1] */
  ctaEmphasis: number;
  /** True during Phase C & D when background scenery remains completely still */
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
 * Computes synchronized whole-cat transforms & contact overlays for normalized scroll progress in [0, 1].
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

  // Gap ratio across the 4 deliberate scroll phases:
  // - 0.00 -> 0.25 (Entrance): holds poised initial wide gap with subtle settle (1.00 -> 0.92)
  // - 0.25 -> 0.60 (Approach): smooth, weightful whole-cat inward glide (0.92 -> 0.20)
  // - 0.60 -> 0.85 (Anticipation): slow breathless crawl across the final gap (0.20 -> 0.05)
  // - 0.85 -> 1.00 (Contact): final millimeter kiss at center (0.05 -> 0.00)
  let gapRatio: number;
  if (p <= 0.25) {
    const t = smoothstep(p / 0.25);
    gapRatio = 1.0 - t * 0.08;
  } else if (p <= 0.6) {
    const t = easeInOutSine((p - 0.25) / 0.35);
    gapRatio = 0.92 - t * 0.72;
  } else if (p <= 0.85) {
    const t = smoothstep((p - 0.6) / 0.25);
    gapRatio = 0.2 - t * 0.15;
  } else {
    const t = easeOutCubic((p - 0.85) / 0.15);
    gapRatio = 0.05 * (1 - t);
  }

  const reachProgress = 1 - gapRatio;

  // Both entire cat figures glide inward symmetrically from outer edges toward center.
  // Max outward pull is 24% of each cat unit's width — creates dramatic Michelangelo framing
  // while keeping both cats partially visible and gliding buttery-smoothly to exact contact.
  const maxOutwardPct = 24;
  const leftCatTranslateXPct = normalizeZero(-gapRatio * maxOutwardPct);
  const rightCatTranslateXPct = normalizeZero(gapRatio * maxOutwardPct);

  // Gentle vertical lift (14px -> 0px) as both cats rise softly into the touch
  const leftCatTranslateYPx = normalizeZero(gapRatio * 14);
  const rightCatTranslateYPx = normalizeZero(gapRatio * 14);

  // Subtle sculptural incline (-2.4deg -> 0deg on left, +2.4deg -> 0deg on right)
  const leftCatRotateDeg = normalizeZero(-gapRatio * 2.4);
  const rightCatRotateDeg = normalizeZero(gapRatio * 2.4);

  // Phase D — Contact (0.85 -> 1.00)
  const contactRaw = p <= 0.85 ? 0 : clamp01((p - 0.85) / 0.15);
  const contactStrength = normalizeZero(easeOutCubic(contactRaw));

  // Restrained ink-like ripple expanding softly without bright flashes or bounce
  const rippleScale = normalizeZero(0.28 + contactStrength * 1.05);
  const rippleOpacity =
    contactRaw <= 0
      ? 0
      : normalizeZero(Math.sin(Math.min(1, contactRaw) * Math.PI * 0.76) * 0.48);

  // Subtle horizontal burgundy brushstroke expanding calmly from touch point
  const brushstrokeProgress = normalizeZero(smoothstep(contactRaw));

  // Delicate five-petal plum blossom blooming quietly above the touching fingertips
  const blossomT = smoothstep((contactRaw - 0.12) / 0.88);
  const blossomScale = normalizeZero(0.35 + blossomT * 0.65);
  const blossomOpacity = normalizeZero(blossomT * 0.92);
  const blossomRotateDeg = normalizeZero(-14 * (1 - blossomT));

  // Contact CTA becomes calmly emphasized as the two cats complete their gesture
  const ctaEmphasis = normalizeZero(
    clamp01(reachProgress * 0.35 + contactStrength * 0.65)
  );

  return {
    progress: normalizeZero(p),
    phase,
    gapRatio: normalizeZero(gapRatio),
    leftCatTranslateXPct,
    leftCatTranslateYPx,
    leftCatRotateDeg,
    rightCatTranslateXPct,
    rightCatTranslateYPx,
    rightCatRotateDeg,
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
