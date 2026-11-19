/**
 * Pure scroll-scrubbed 4-beat state machine for the pre-projects editorial manifesto:
 * - SCROLL  0–25% : "I'm the kind of person who..."
 * - SCROLL 25–50% : "can't leave a"
 * - SCROLL 50–75% : "question unanswered."
 * - SCROLL 75–100%: "Sometimes it becomes a project. Sometimes an experiment. Sometimes a very long night."
 *
 * Guarantees strict mutual exclusivity across beats (no two beats overlap at any scroll offset)
 * and coordinates a seamless handoff from the Hero parallax exit into the #projects 3D gallery.
 */

export type ManifestoBeatId = "person" | "cant-leave" | "unanswered" | "sometimes";

export interface ManifestoBeatMotion {
  opacity: number;
  y: number;
  visible: boolean;
}

export interface ManifestoScrollState {
  /** Clamped 0..1 progress across the manifesto scroll band */
  progress: number;
  /** Currently active beat index (0..3) */
  activeIndex: 0 | 1 | 2 | 3;
  /** Active semantic beat identifier */
  activeBeat: ManifestoBeatId;
  /** Master overlay curtain opacity (fades in at end of hero, parts cleanly before #projects) */
  stageOpacity: number;
  /** Vertical curtain lift (px) during exit handoff into #projects */
  stageLiftY: number;
  /** True whenever the manifesto overlay should be rendered visible */
  stageVisible: boolean;
  /** Beat 1 (0–25%): "I'm the kind of person who..." */
  beat1: ManifestoBeatMotion & {
    lineYPercent: [number, number];
    driftX: number;
  };
  /** Beat 2 (25–50%): "can't leave a" */
  beat2: ManifestoBeatMotion & {
    wordYPercent: [number, number, number];
    scale: number;
  };
  /** Beat 3 (50–75%): "question unanswered." */
  beat3: ManifestoBeatMotion & {
    questionYPercent: number;
    unansweredReveal: number;
    underlineReveal: number;
  };
  /** Beat 4 (75–100%): 3 staggered sentences */
  beat4: ManifestoBeatMotion & {
    lineOpacities: [number, number, number];
    lineY: [number, number, number];
    underlineReveal: number;
    nextCueOpacity: number;
  };
  /** Normalized 0..1 driver passed to computeHeroToCarouselState for the #projects entrance */
  carouselDriver: number;
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function computeManifestoScrollState(
  rawManifestoProgress: number,
  rawHeroProgress = 1
): ManifestoScrollState {
  const p = clamp01(rawManifestoProgress);
  const hero = clamp01(rawHeroProgress);

  // Curtain fades smoothly in during the final 22% of the hero exit, holds opaque across beats 1..4,
  // and parts cleanly across 94% -> 100% to reveal the orbiting #projects 3D gallery.
  const curtainEnter = smoothstep(0.76, 0.96, hero);
  const curtainExit = 1 - smoothstep(0.935, 0.995, p);
  const stageOpacity = curtainEnter * curtainExit;
  const stageLiftY = -44 * smoothstep(0.935, 1.0, p);
  const stageVisible = stageOpacity > 0.005;

  // ── BEAT 1 (0–25%): "I'm the kind of person who..." ────────────────────────
  // Enters right at the hero-to-manifesto handoff (hero 0.88..1.0 OR p 0.00..0.06),
  // holds crisp through 0.19, and clears strictly before 0.248.
  const b1Enter = Math.max(
    smoothstep(0.88, 0.995, hero) * (p === 0 ? 1 : 1),
    smoothstep(0.0, 0.06, p)
  );
  const b1Exit = smoothstep(0.19, 0.246, p);
  const b1Opacity = p >= 0.246 ? 0 : b1Enter * (1 - b1Exit);
  const b1Line0In = p > 0 ? smoothstep(0.0, 0.055, p) : smoothstep(0.88, 0.995, hero);
  const b1Line1In = p > 0 ? smoothstep(0.018, 0.078, p) : smoothstep(0.92, 1.0, hero);
  const b1LineYPercent: [number, number] = [
    (1 - b1Line0In) * 108 - b1Exit * 108,
    (1 - b1Line1In) * 108 - b1Exit * 108,
  ];
  const b1Y = 14 * (1 - b1Enter) - 34 * b1Exit;
  const b1DriftX = (p / 0.25 - 0.5) * -18;

  // ── BEAT 2 (25–50%): "can't leave a" ───────────────────────────────────────
  // Strictly silent until 0.252, enters word-by-word across 0.252..0.34,
  // holds monumental through 0.435, exits cleanly before 0.496.
  const b2WordWindows: ReadonlyArray<readonly [number, number]> = [
    [0.254, 0.312],
    [0.274, 0.332],
    [0.294, 0.352],
  ];
  const b2WordExitWindows: ReadonlyArray<readonly [number, number]> = [
    [0.435, 0.482],
    [0.446, 0.49],
    [0.456, 0.496],
  ];
  const b2WordYPercent = b2WordWindows.map(([inStart, inEnd], idx) => {
    const [outStart, outEnd] = b2WordExitWindows[idx];
    if (p <= inStart) return 114;
    if (p >= outEnd) return -114;
    const enterT = smoothstep(inStart, inEnd, p);
    const exitT = smoothstep(outStart, outEnd, p);
    return (1 - enterT) * 114 - exitT * 114;
  }) as [number, number, number];

  const b2Enter = smoothstep(0.252, 0.28, p);
  const b2Exit = smoothstep(0.45, 0.496, p);
  const b2Opacity = p < 0.252 || p >= 0.496 ? 0 : b2Enter * (1 - b2Exit);
  const b2SpanT = clamp01((p - 0.252) / 0.244);
  const b2Y = 18 - 38 * b2SpanT;
  const b2Scale = 0.96 + 0.05 * smoothstep(0.255, 0.44, p);

  // ── BEAT 3 (50–75%): "question unanswered." ────────────────────────────────
  // Strictly silent until 0.502, "QUESTION" rises from mask while "unanswered."
  // sweeps left-to-right with a crimson calligraphic underline; clears strictly before 0.746.
  const b3Enter = smoothstep(0.502, 0.535, p);
  const b3Exit = smoothstep(0.692, 0.746, p);
  const b3Opacity = p < 0.502 || p >= 0.746 ? 0 : b3Enter * (1 - b3Exit);
  const b3QuestionIn = smoothstep(0.505, 0.575, p);
  const b3QuestionYPercent = (1 - b3QuestionIn) * 112 - b3Exit * 112;
  const b3UnansweredReveal = smoothstep(0.535, 0.62, p);
  const b3UnderlineReveal = smoothstep(0.565, 0.645, p);
  const b3Y = 14 * (1 - b3Enter) - 34 * b3Exit;

  // ── BEAT 4 (75–100%): 3 Staggered Sentences ────────────────────────────────
  // "Sometimes it becomes a project." -> "Sometimes an experiment." -> "Sometimes a very long night."
  // Strictly silent until 0.752; exits cleanly as the curtain opens onto #projects at 0.94..0.995.
  const b4Enter = smoothstep(0.752, 0.778, p);
  const b4Exit = smoothstep(0.935, 0.992, p);
  const b4Opacity = p < 0.752 || p >= 0.992 ? 0 : b4Enter * (1 - b4Exit);

  const line0In = smoothstep(0.755, 0.812, p);
  const line1In = smoothstep(0.802, 0.858, p);
  const line2In = smoothstep(0.848, 0.905, p);

  const lineOpacities: [number, number, number] = [line0In, line1In, line2In];
  const lineY: [number, number, number] = [
    (1 - line0In) * 34,
    (1 - line1In) * 34,
    (1 - line2In) * 34,
  ];
  const b4UnderlineReveal = smoothstep(0.875, 0.925, p);
  const b4NextCueOpacity = smoothstep(0.895, 0.932, p) * (1 - b4Exit);
  const b4Y = -28 * b4Exit;

  // Drive the #projects 3D circular gallery entrance smoothly across the final 20% of the manifesto
  // so O-ring + orbiting cards lock into place the instant the curtain lifts at rawManifesto = 1.0.
  const carouselDriver = p >= 1 ? 1 : p <= 0.8 ? 0 : clamp01((p - 0.8) / 0.2);

  let activeIndex: 0 | 1 | 2 | 3 = 0;
  let activeBeat: ManifestoBeatId = "person";
  if (p >= 0.75) {
    activeIndex = 3;
    activeBeat = "sometimes";
  } else if (p >= 0.5) {
    activeIndex = 2;
    activeBeat = "unanswered";
  } else if (p >= 0.25) {
    activeIndex = 1;
    activeBeat = "cant-leave";
  }

  return {
    progress: p,
    activeIndex,
    activeBeat,
    stageOpacity,
    stageLiftY,
    stageVisible,
    beat1: {
      opacity: b1Opacity,
      y: b1Y,
      visible: b1Opacity > 0.005,
      lineYPercent: b1LineYPercent,
      driftX: b1DriftX,
    },
    beat2: {
      opacity: b2Opacity,
      y: b2Y,
      visible: b2Opacity > 0.005,
      wordYPercent: b2WordYPercent,
      scale: b2Scale,
    },
    beat3: {
      opacity: b3Opacity,
      y: b3Y,
      visible: b3Opacity > 0.005,
      questionYPercent: b3QuestionYPercent,
      unansweredReveal: b3UnansweredReveal,
      underlineReveal: b3UnderlineReveal,
    },
    beat4: {
      opacity: b4Opacity,
      y: b4Y,
      visible: b4Opacity > 0.005,
      lineOpacities,
      lineY,
      underlineReveal: b4UnderlineReveal,
      nextCueOpacity: b4NextCueOpacity,
    },
    carouselDriver,
  };
}
