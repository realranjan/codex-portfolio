"use client";

import { forwardRef, useEffect, type RefObject } from "react";
import gsap from "gsap";
import type { HeroStoryScrollState } from "@/lib/motion";

export const KILLED_LINE_WORDS = ["KILLED", "THE", "CAT."] as const;

export interface HeroStoryDomRefs {
  stageRef: RefObject<HTMLDivElement | null>;
  curiositySlotRef: RefObject<HTMLDivElement | null>;
  curiosityTextRef: RefObject<HTMLSpanElement | null>;
  killedSlotRef: RefObject<HTMLDivElement | null>;
  killedWordRefs: RefObject<Array<HTMLSpanElement | null>>;
  punchlineSlotRef: RefObject<HTMLDivElement | null>;
  punchlineTextRef: RefObject<HTMLParagraphElement | null>;
  brushWashRef: RefObject<HTMLDivElement | null>;
  brushUnderlineRef: RefObject<HTMLDivElement | null>;
  scrollCueRef?: RefObject<HTMLAnchorElement | null>;
}

/**
 * Plays the crisp initial Beat 1 entrance for "CURIOSITY" on mount (L->R clip-mask + 30px upward rise,
 * 1.2s power3.out), then keeps it completely stationary until the user scrolls.
 * Beats 2 ("KILLED THE CAT.") and 3 ("Not this one.") remain hidden until driven by scroll.
 */
export function useHeroCuriosityEntrance(
  curiosityTextRef: RefObject<HTMLSpanElement | null>,
  stageRef: RefObject<HTMLDivElement | null>
): void {
  useEffect(() => {
    const textEl = curiosityTextRef.current;
    const stageEl = stageRef.current;
    if (!textEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(textEl, { clipPath: "inset(0% 0% 0% 0%)", y: 0 });
      stageEl?.setAttribute("data-entrance-state", "complete");
      return;
    }

    stageEl?.setAttribute("data-entrance-state", "playing");

    const tween = gsap.fromTo(
      textEl,
      {
        clipPath: "inset(0% 100% 0% 0%)",
        y: 30,
      },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        y: 0,
        duration: 1.2,
        delay: 0.12,
        ease: "power3.out",
        clearProps: "clipPath",
        onComplete: () => {
          stageEl?.setAttribute("data-entrance-state", "complete");
        },
      }
    );

    return () => {
      tween.kill();
    };
  }, [curiosityTextRef, stageRef]);
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

  // Beat 1: CURIOSITY
  const curiositySlot = refs.curiositySlotRef.current;
  if (curiositySlot) {
    curiositySlot.style.opacity = state.curiosity.opacity.toFixed(4);
    curiositySlot.style.transform = `translate3d(0, ${state.curiosity.y.toFixed(1)}px, 0)`;
    curiositySlot.style.clipPath =
      state.curiosity.clipTopPct > 0.05
        ? `inset(${state.curiosity.clipTopPct.toFixed(2)}% 0% 0% 0%)`
        : "none";
    curiositySlot.style.visibility = state.curiosity.visible ? "visible" : "hidden";
  }

  // Beat 2: KILLED THE CAT. (word-by-word bottom-to-top overflow mask)
  const killedSlot = refs.killedSlotRef.current;
  if (killedSlot) {
    killedSlot.style.opacity = state.killed.opacity.toFixed(4);
    killedSlot.style.transform = `translate3d(0, ${state.killed.y.toFixed(1)}px, 0)`;
    killedSlot.style.visibility = state.killed.visible ? "visible" : "hidden";
  }
  const wordEls = refs.killedWordRefs.current ?? [];
  for (let i = 0; i < KILLED_LINE_WORDS.length; i++) {
    const wordEl = wordEls[i];
    if (!wordEl) continue;
    const yPct = state.killed.wordYPercent[i] ?? 115;
    wordEl.style.transform = `translate3d(0, ${yPct.toFixed(2)}%, 0)`;
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
  curiositySlotRef: RefObject<HTMLDivElement | null>;
  curiosityTextRef: RefObject<HTMLSpanElement | null>;
  killedSlotRef: RefObject<HTMLDivElement | null>;
  killedWordRefs: RefObject<Array<HTMLSpanElement | null>>;
  className?: string;
}

/**
 * Scroll-driven behind-cat typography stage (z-[3], strictly behind the 3D samurai cat at z-[5]
 * and in front of the crimson rising sun at z-[1]).
 * Displays Beat 1 ("CURIOSITY") initially, then replaces it cleanly with Beat 2 ("KILLED THE CAT.")
 * on scroll without keeping previous text on screen.
 */
export const HeroCuriosityTypography = forwardRef<
  HTMLDivElement,
  HeroCuriosityTypographyProps
>(function HeroCuriosityTypography(
  {
    curiositySlotRef,
    curiosityTextRef,
    killedSlotRef,
    killedWordRefs,
    className = "",
  },
  ref
) {
  return (
    <div
      ref={ref}
      data-testid="hero-curiosity-layer"
      data-active-beat="curiosity"
      className={`pointer-events-none absolute inset-0 z-[3] flex items-center justify-center overflow-hidden select-none ${className}`}
    >
      <h1
        id="hero-heading"
        aria-label="Curiosity killed the cat."
        className="relative m-0 flex h-full w-full items-center justify-center font-black uppercase text-[#792B33]"
        style={{ fontFamily: "var(--font-display-bold), 'Arial Black', sans-serif" }}
      >
        {/* Beat 1 Slot: CURIOSITY — Single unified centered monumental bold headline with wide letter-spacing */}
        <div
          ref={curiositySlotRef}
          data-testid="hero-slot-curiosity"
          className="absolute inset-0 flex items-center justify-center px-3 sm:px-6 text-center will-change-[transform,opacity,clip-path]"
        >
          <span
            ref={curiosityTextRef}
            data-testid="hero-line-curiosity"
            className="font-hero-display block whitespace-nowrap leading-[0.88] tracking-[0.14em] sm:tracking-[0.2em] lg:tracking-[0.25em] pl-[0.14em] sm:pl-[0.2em] lg:pl-[0.25em] will-change-[clip-path,transform]"
            style={{
              fontFamily: "var(--font-display-bold), 'Arial Black', sans-serif",
              fontSize: "clamp(34px, 9.6vw, 158px)",
            }}
          >
            CURIOSITY
          </span>
        </div>

        {/* Beat 2 Slot: KILLED THE CAT. — Single unified centered monumental bold headline with generous letter & word spacing */}
        <div
          ref={killedSlotRef}
          data-testid="hero-slot-killed"
          className="absolute inset-0 flex items-center justify-center px-3 sm:px-6 text-center opacity-0 invisible will-change-[transform,opacity]"
        >
          <span
            data-testid="hero-line-killed"
            className="font-hero-display flex flex-nowrap items-end justify-center gap-x-[0.38em] sm:gap-x-[0.52em] lg:gap-x-[0.64em] leading-[0.88] tracking-[0.1em] sm:tracking-[0.15em] lg:tracking-[0.2em] pl-[0.1em] sm:pl-[0.15em] lg:pl-[0.2em] origin-center"
            style={{
              fontFamily: "var(--font-display-bold), 'Arial Black', sans-serif",
              fontSize: "clamp(22px, 6.4vw, 108px)",
            }}
          >
            {KILLED_LINE_WORDS.map((word, index) => (
              <span
                key={word}
                className="inline-block overflow-hidden align-bottom pt-[0.04em] pb-[0.06em]"
              >
                <span
                  ref={(el) => {
                    killedWordRefs.current[index] = el;
                  }}
                  data-testid={`hero-word-${index}`}
                  className="inline-block whitespace-nowrap will-change-transform"
                  style={{ transform: "translate3d(0, 115%, 0)" }}
                >
                  {word}
                </span>
              </span>
            ))}
          </span>
        </div>
      </h1>
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
