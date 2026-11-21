"use client";

import { forwardRef, type RefObject } from "react";
import type { HeroStoryScrollState } from "@/lib/motion";
import { HeroTypeGarden } from "@/components/portfolio/hero-type-garden";

export const KILLED_LINE_WORDS = ["KILLED", "THE", "CAT."] as const;

export interface HeroStoryDomRefs {
  stageRef: RefObject<HTMLDivElement | null>;
  punchlineSlotRef: RefObject<HTMLDivElement | null>;
  punchlineTextRef: RefObject<HTMLParagraphElement | null>;
  brushWashRef: RefObject<HTMLDivElement | null>;
  brushUnderlineRef: RefObject<HTMLDivElement | null>;
  scrollCueRef?: RefObject<HTMLAnchorElement | null>;
}

/**
 * Imperatively applies the scroll-scrubbed 3-beat hero typography & brushstroke state to DOM nodes
 * at 60fps with zero React re-renders. Ensures strict mutual exclusivity between consecutive lines.
 */
export function applyHeroStoryToDom(
  state: HeroStoryScrollState,
  refs: HeroStoryDomRefs
): void {
  const stageEl = refs.stageRef.current;
  if (stageEl) {
    stageEl.setAttribute("data-active-beat", state.activeBeat);
    const anyBackTextVisible = state.curiosity.visible || state.killed.visible;
    stageEl.style.visibility = anyBackTextVisible ? "visible" : "hidden";
  }

  // Beat 3: "Not this one." + Sweeping Crimson SVG Brushstroke
  const punchlineSlot = refs.punchlineSlotRef.current;
  if (punchlineSlot) {
    punchlineSlot.style.opacity = state.punchline.opacity.toFixed(4);
    punchlineSlot.style.transform = `translate3d(0, ${state.punchline.y.toFixed(1)}px, 0)`;
    punchlineSlot.style.visibility = state.punchline.visible ? "visible" : "hidden";
  }

  const rightClipPct = ((1 - state.punchline.reveal) * 100).toFixed(2);
  const punchlineText = refs.punchlineTextRef.current;
  if (punchlineText) {
    punchlineText.style.clipPath =
      state.punchline.reveal >= 0.999
        ? "none"
        : `inset(-14% ${rightClipPct}% -24% 0%)`;
  }

  const brushUnderline = refs.brushUnderlineRef.current;
  if (brushUnderline) {
    brushUnderline.style.clipPath =
      state.punchline.reveal >= 0.999
        ? "none"
        : `inset(0% ${rightClipPct}% 0% 0%)`;
  }

  const brushWash = refs.brushWashRef.current;
  if (brushWash) {
    const headRightPct = ((1 - state.punchline.washHead) * 100).toFixed(2);
    const tailLeftPct = (state.punchline.washTail * 100).toFixed(2);
    const washActive =
      state.punchline.visible &&
      state.punchline.washHead > 0.005 &&
      state.punchline.washTail < 0.995;
    brushWash.style.clipPath = `inset(0% ${headRightPct}% 0% ${tailLeftPct}%)`;
    brushWash.style.opacity = washActive ? "0.94" : "0";
  }

  // Optional scroll-down cue if provided
  const scrollCue = refs.scrollCueRef?.current;
  if (scrollCue) {
    scrollCue.style.opacity = state.scrollCueOpacity.toFixed(4);
    scrollCue.style.visibility = state.scrollCueOpacity > 0.02 ? "visible" : "hidden";
    scrollCue.style.pointerEvents = state.scrollCueOpacity > 0.2 ? "auto" : "none";
  }
}

interface HeroCuriosityTypographyProps {
  storyRef: RefObject<HeroStoryScrollState>;
  className?: string;
}

/**
 * Scroll-driven behind-cat Type Garden typography stage (z-[3], strictly behind the 3D samurai cat
 * at z-[5] and in front of the crimson rising sun at z-[1]).
 * Renders monumental wide-tracked Playfair Display Bold ("CURIOSITY" -> "KILLED THE CAT.")
 * with living botanical stems, veined leaves, and spiraled roses weaving around the letterforms.
 */
export const HeroCuriosityTypography = forwardRef<
  HTMLDivElement,
  HeroCuriosityTypographyProps
>(function HeroCuriosityTypography({ storyRef, className = "" }, ref) {
  return (
    <div
      ref={ref}
      data-testid="hero-curiosity-layer"
      data-active-beat="curiosity"
      className={`pointer-events-none absolute inset-0 z-[3] flex items-center justify-center overflow-hidden select-none ${className}`}
    >
      <h1 id="hero-heading" className="sr-only">
        Curiosity killed the cat.
      </h1>

      <HeroTypeGarden storyRef={storyRef} />
    </div>
  );
});

interface HeroPunchlineBrushRevealProps {
  punchlineSlotRef: RefObject<HTMLDivElement | null>;
  punchlineTextRef: RefObject<HTMLParagraphElement | null>;
  brushWashRef: RefObject<HTMLDivElement | null>;
  brushUnderlineRef: RefObject<HTMLDivElement | null>;
}

/**
 * Beat 3 Punchline ("Not this one.") in Cormorant Garamond Bold Italic (#792B33), anchored
 * cleanly down in the lower mist clearing (z-[25]) with a soft borderless ivory halo so the
 * viewer can focus unmistakably on the punchline below the 3D samurai cat.
 */
export function HeroPunchlineBrushReveal({
  punchlineSlotRef,
  punchlineTextRef,
  brushWashRef,
  brushUnderlineRef,
}: HeroPunchlineBrushRevealProps) {
  return (
    <div
      ref={punchlineSlotRef}
      data-testid="hero-punchline-wrap"
      className="relative inline-flex flex-col items-center px-10 pb-2.5 pt-2 select-none opacity-0 invisible will-change-[transform,opacity]"
    >
      {/* Borderless soft washi-ivory atmospheric clearing so punchline stands out cleanly at bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-10 -inset-y-4 z-[0]"
        style={{
          background:
            "radial-gradient(ellipse 68% 72% at 50% 52%, rgba(244, 234, 223, 0.94) 0%, rgba(244, 234, 223, 0.72) 48%, rgba(244, 234, 223, 0) 100%)",
        }}
      />

      {/* Real HTML Punchline Text */}
      <p
        ref={punchlineTextRef}
        data-testid="hero-subline"
        className="relative z-[2] m-0 font-serif font-bold italic text-[#792B33] text-center tracking-[0.02em] leading-[1.06] whitespace-nowrap will-change-[clip-path]"
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: "clamp(36px, 4.3vw, 56px)",
          textShadow: "0 2px 22px rgba(244, 234, 223, 0.96)",
          clipPath: "inset(-14% 100% -24% 0%)",
        }}
      >
        Not this one.
      </p>

      {/* Kinetic Sweeping Crimson Brushstroke Wash (sweeps L->R across text on scroll) */}
      <div
        ref={brushWashRef}
        aria-hidden="true"
        data-testid="hero-brush-wash"
        className="pointer-events-none absolute inset-x-4 inset-y-1 z-[3] flex items-center opacity-0 will-change-[clip-path,opacity]"
        style={{ clipPath: "inset(0% 100% 0% 0%)" }}
      >
        <svg
          viewBox="0 0 340 68"
          fill="none"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <path
            d="M4 38 C36 22, 88 18, 152 24 C214 30, 276 22, 326 16 C334 15, 338 22, 330 27 C286 38, 224 48, 156 49 C92 50, 38 52, 8 47 C2 46, 0 41, 4 38 Z"
            fill="#AA3440"
            fillOpacity="0.88"
          />
          <path
            d="M12 36 C56 27, 118 25, 184 30 C244 34, 294 28, 334 21 C322 31, 266 40, 190 42 C118 44, 54 44, 10 41 Z"
            fill="#88212C"
            fillOpacity="0.68"
          />
          <path
            d="M28 21 C88 14, 174 15, 256 17 C292 18, 318 14, 338 11"
            stroke="#AA3440"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeOpacity="0.72"
          />
          <path
            d="M18 51 C82 54, 176 55, 262 46 C294 42, 316 37, 332 33"
            stroke="#C44653"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />
        </svg>
      </div>

      {/* Persistent Tapered Sumi-Crimson Calligraphic Underline Brushstroke */}
      <div
        ref={brushUnderlineRef}
        aria-hidden="true"
        data-testid="hero-brush-underline"
        className="pointer-events-none relative z-[1] -mt-0.5 h-[14px] w-[114%] will-change-[clip-path]"
        style={{ clipPath: "inset(0% 100% 0% 0%)" }}
      >
        <svg
          viewBox="0 0 320 22"
          fill="none"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <path
            d="M4 13.5 C46 7.5, 112 5.2, 184 6.8 C238 8.0, 282 7.2, 311 4.4 C315.5 4.0, 317.5 6.4, 312.5 7.9 C276 12.6, 224 14.5, 166 13.8 C104 13.0, 48 14.8, 10 17.2 C4.5 17.6, 0.8 14.8, 4 13.5 Z"
            fill="#AA3440"
            fillOpacity="0.86"
          />
          <path
            d="M168 14.6 C224 15.8, 274 13.4, 317 9.6"
            stroke="#AA3440"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.58"
          />
          <path
            d="M22 9.4 C82 5.8, 152 4.6, 232 6.0"
            stroke="#88212C"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeOpacity="0.48"
          />
        </svg>
      </div>
    </div>
  );
}
