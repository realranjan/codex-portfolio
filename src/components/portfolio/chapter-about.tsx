"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ABOUT_CONTENT } from "@/data/portfolio-content";
import {
  ABOUT_STATEMENT_TARGET_PROGRESS,
  computeAboutStoryState,
  computePinePointerTarget,
} from "@/lib/about-story";

gsap.registerPlugin(ScrollTrigger);

/**
 * Ultra-fine static monochrome paper grain data URI (composited once, zero runtime filter lag).
 */
const WASHI_PAPER_GRAIN_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

/**
 * CHAPTER 01 — ABOUT & PHILOSOPHY
 *
 * Art direction: Japanese Sumi-e × Contemporary Editorial Typography × Cinematic Scroll Storytelling.
 * Strict palette lock: Burgundy (#792B33) ground & Warm Ivory (#F3E9DE) typography.
 *
 * 3-Layer Ink Composition (right 45–50%, never obstructing left typography):
 * 1. Backdrop: Static #792B33 + fine washi grain + very subtle circular warm-ivory sun behind pine.
 * 2. Middle: Faint distant sumi-e ink-wash mountain silhouettes along the lower edge (10–15px parallax).
 * 3. Foreground: Asymmetrical Japanese black pine entering from right edge (20–35px scroll parallax
 *    + bounded smooth pointer interpolation on mouse movement only).
 *
 * 5-Scene Reversible Scroll Sequence (desktop pinned ScrollTrigger, scrub: true):
 * - Scene 01: Masked reveal of "I'm the kind of person" followed by italic "who..."
 * - Scene 02: 01 — "can't leave a question unanswered."
 * - Scene 03: 02 — "builds things to understand how they work."
 * - Scene 04: 03 — "turns ideas into working systems."
 * - Scene 05: 04 — "gets lost in the details." + settled readable Philosophy paragraphs
 *
 * Ends flush on #792B33 so the burgundy section & ink painting move upward cleanly into the
 * TornPaperPeel transition exposing the Ivory Projects chapter below.
 */
export function ChapterAbout() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinStageRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  // Typography DOM refs for zero-re-render 60fps scrub updates
  const headlineLine1Ref = useRef<HTMLSpanElement>(null);
  const headlinePersonRef = useRef<HTMLSpanElement>(null);
  const headlineItalicRef = useRef<HTMLSpanElement>(null);
  const statementRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const philosophyRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // 3-layer ink painting refs
  const artworkWrapRef = useRef<HTMLDivElement>(null);
  const sunLayerRef = useRef<HTMLDivElement>(null);
  const mountainsLayerRef = useRef<HTMLDivElement>(null);
  const pineScrollLayerRef = useRef<HTMLDivElement>(null);
  const pinePointerLayerRef = useRef<HTMLDivElement>(null);

  // Lightweight state only for discrete active marker & scene telemetry (updates at most 4 times)
  const [activeIndex, setActiveIndex] = useState<0 | 1 | 2 | 3>(0);
  const [activeScene, setActiveScene] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [reducedMotion, setReducedMotion] = useState(false);

  const lastActiveIndexRef = useRef<0 | 1 | 2 | 3>(0);
  const lastActiveSceneRef = useRef<1 | 2 | 3 | 4 | 5>(1);

  // 1. Desktop pinned 5-scene reversible scroll choreography
  useEffect(() => {
    const pinEl = pinStageRef.current;
    if (!pinEl) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(prefersReduced);

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (prefersReduced || !isDesktop) return;

    const applyStoryToDom = (progress: number) => {
      const state = computeAboutStoryState(progress);

      if (pinStageRef.current) {
        pinStageRef.current.dataset.aboutScene = String(state.scene);
        pinStageRef.current.dataset.aboutProgress = state.progress.toFixed(3);
      }

      const mainLiftY = (1 - state.headlineMainReveal) * 26;
      const mainTransform = `translate3d(0, ${mainLiftY.toFixed(2)}px, 0)`;
      const mainOpacity = state.headlineMainReveal.toFixed(3);

      if (headlineLine1Ref.current) {
        headlineLine1Ref.current.style.transform = mainTransform;
        headlineLine1Ref.current.style.opacity = mainOpacity;
      }
      if (headlinePersonRef.current) {
        headlinePersonRef.current.style.transform = mainTransform;
        headlinePersonRef.current.style.opacity = mainOpacity;
      }

      if (headlineItalicRef.current) {
        const liftY = (1 - state.headlineItalicReveal) * 28;
        headlineItalicRef.current.style.transform = `translate3d(0, ${liftY.toFixed(2)}px, 0)`;
        headlineItalicRef.current.style.opacity = state.headlineItalicReveal.toFixed(3);
      }

      for (let i = 0; i < 4; i++) {
        const el = statementRefs.current[i];
        const st = state.statements[i];
        if (!el || !st) continue;
        el.style.opacity = st.opacity.toFixed(3);
        el.style.transform = `translate3d(0, ${st.translateY.toFixed(2)}px, 0)`;
        el.style.visibility = st.opacity > 0.005 ? "visible" : "hidden";
      }

      if (philosophyRef.current) {
        philosophyRef.current.style.opacity = state.philosophyReveal.toFixed(3);
        philosophyRef.current.style.transform = `translate3d(0, ${state.philosophyTranslateY.toFixed(2)}px, 0)`;
        philosophyRef.current.style.visibility = state.philosophyReveal > 0.005 ? "visible" : "hidden";
      }

      if (artworkWrapRef.current) {
        artworkWrapRef.current.style.opacity = state.artworkPresence.toFixed(3);
      }
      if (sunLayerRef.current) {
        sunLayerRef.current.style.transform = `translate3d(0, ${state.sunShiftY.toFixed(2)}px, 0)`;
      }
      if (mountainsLayerRef.current) {
        mountainsLayerRef.current.style.transform = `translate3d(0, ${state.mountainShiftY.toFixed(2)}px, 0)`;
      }
      if (pineScrollLayerRef.current) {
        pineScrollLayerRef.current.style.transform = `translate3d(${state.pineShiftX.toFixed(2)}px, ${state.pineShiftY.toFixed(2)}px, 0)`;
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${state.progress.toFixed(4)})`;
      }

      if (lastActiveIndexRef.current !== state.activeStatementIndex) {
        lastActiveIndexRef.current = state.activeStatementIndex;
        setActiveIndex(state.activeStatementIndex);
      }
      if (lastActiveSceneRef.current !== state.scene) {
        lastActiveSceneRef.current = state.scene;
        setActiveScene(state.scene);
      }
    };

    const ctx = gsap.context(() => {
      // Paint deterministic initial Scene 01 state before first scroll event
      applyStoryToDom(0);

      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: pinEl,
        start: "top top",
        end: "+=340%",
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          applyStoryToDom(self.progress);
        },
      });
    }, sectionRef);

    return () => {
      scrollTriggerRef.current = null;
      ctx.revert();
    };
  }, []);

  // 2. Bounded smooth pointer parallax for foreground pine (active only while pointer moves; zero idle drift)
  useEffect(() => {
    const stage = pinStageRef.current;
    const pineInner = pinePointerLayerRef.current;
    if (!stage || !pineInner) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (prefersReduced || !finePointer) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId: number | null = null;

    const tick = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (Math.abs(targetX - currentX) < 0.05 && Math.abs(targetY - currentY) < 0.05) {
        currentX = targetX;
        currentY = targetY;
        pineInner.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
        rafId = null;
        return;
      }

      pineInner.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      rafId = window.requestAnimationFrame(tick);
    };

    const scheduleTick = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      const next = computePinePointerTarget(nx, ny);
      targetX = next.x;
      targetY = next.y;
      scheduleTick();
    };

    const handlePointerLeave = () => {
      targetX = 0;
      targetY = 0;
      scheduleTick();
    };

    stage.addEventListener("pointermove", handlePointerMove, { passive: true });
    stage.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      stage.removeEventListener("pointermove", handlePointerMove);
      stage.removeEventListener("pointerleave", handlePointerLeave);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const handleJumpToStatement = (index: 0 | 1 | 2 | 3) => {
    const st = scrollTriggerRef.current;
    if (!st) return;
    const targetProgress = ABOUT_STATEMENT_TARGET_PROGRESS[index];
    const targetScrollY = st.start + (st.end - st.start) * targetProgress;
    window.scrollTo({ top: targetScrollY, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="about"
      aria-labelledby="about-heading"
      data-chapter-surface="burgundy"
      className="relative bg-[#792B33] text-[#F3E9DE]"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP & TABLET PINNED CINEMATIC SUMI-E STORYTELLING STAGE
          (Automatically switches to static readable editorial layout when reduced motion is enabled)
         ═══════════════════════════════════════════════════════════════════════ */}
      {!reducedMotion ? (
        <div
          ref={pinStageRef}
          data-testid="about-sumie-stage"
          data-about-scene={String(activeScene)}
          data-about-progress="0.000"
          className="relative hidden md:flex min-h-[100svh] w-full flex-col justify-between overflow-hidden bg-[#792B33]"
        >
          {/* Layer 0: Extremely fine static washi paper grain */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] opacity-[0.048] mix-blend-soft-light"
            style={{ backgroundImage: WASHI_PAPER_GRAIN_BG, backgroundRepeat: "repeat" }}
          />

          {/* 3-Layer Layered Japanese Sumi-e Ink-Wash Composition (Right 45-50% focus) */}
          <div
            ref={artworkWrapRef}
            aria-hidden="true"
            data-testid="about-sumie-artwork"
            className="pointer-events-none absolute inset-0 z-[2] overflow-hidden will-change-[opacity]"
          >
            {/* Backdrop Layer: Very subtle, softly diffused circular warm-ivory sun behind the pine */}
            <div
              ref={sunLayerRef}
              data-testid="about-sumie-sun"
              className="absolute right-[7%] lg:right-[10.5%] top-[13%] lg:top-[14%] h-[270px] w-[270px] lg:h-[360px] lg:w-[360px] rounded-full blur-[1px] will-change-transform"
              style={{
                background:
                  "radial-gradient(circle at 48% 48%, rgba(243, 233, 222, 0.13) 0%, rgba(243, 233, 222, 0.095) 52%, rgba(243, 233, 222, 0.038) 67%, rgba(243, 233, 222, 0) 74%)",
              }}
            />

            {/* Middle Layer: Faint distant ink-wash mountains along the lower edge (10-15px parallax) */}
            <div
              ref={mountainsLayerRef}
              data-testid="about-sumie-mountains"
              className="absolute inset-x-0 -bottom-6 h-[32vh] lg:h-[38vh] will-change-transform"
            >
              <div className="relative ml-auto h-full w-[92%] lg:w-[86%]">
                <Image
                  src={ABOUT_CONTENT.sumieArtwork.mountainsSrc}
                  alt={ABOUT_CONTENT.sumieArtwork.mountainsAlt}
                  fill
                  sizes="90vw"
                  referrerPolicy="no-referrer"
                  className="object-contain object-right-bottom opacity-[0.72] select-none"
                />
              </div>
            </div>

            {/* Foreground Artwork: Asymmetrical Japanese black pine entering from right edge (20-35px scroll + gentle pointer) */}
            <div
              ref={pineScrollLayerRef}
              data-testid="about-sumie-pine"
              className="absolute -right-[2%] lg:right-0 top-[9%] lg:top-[6%] w-[44vw] max-w-[650px] min-w-[340px] will-change-transform"
            >
              <div ref={pinePointerLayerRef} className="will-change-transform">
                <Image
                  src={ABOUT_CONTENT.sumieArtwork.pineSrc}
                  alt={ABOUT_CONTENT.sumieArtwork.pineAlt}
                  width={876}
                  height={896}
                  sizes="(max-width: 1024px) 46vw, 650px"
                  referrerPolicy="no-referrer"
                  className="h-auto w-full opacity-[0.88] select-none"
                />
              </div>
            </div>
          </div>

          {/* Left 50-55% Editorial Typography & Scroll Storytelling Column */}
          <div className="page-container relative z-10 flex flex-1 flex-col justify-center pt-24 pb-8">
            <div className="w-full md:w-[56%] lg:w-[54%] max-w-[700px]">
              {/* Small uppercase intro label */}
              <p
                className="m-0 mb-5 text-[11px] lg:text-[12px] font-medium uppercase tracking-[0.22em] text-[#F3E9DE]/76"
                style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}
              >
                {ABOUT_CONTENT.heading}
              </p>

              {/* Main 2-Line Editorial Headline — Manrope 500 + Cormorant Garamond Italic */}
              <h2
                id="about-heading"
                className="m-0 text-left text-[#F3E9DE]"
                style={{
                  fontFamily: "var(--font-manrope), system-ui, sans-serif",
                  fontSize: "clamp(3.3rem, 5.7vw, 6.5rem)",
                  fontWeight: 500,
                  lineHeight: 1.05,
                  letterSpacing: "-0.032em",
                }}
              >
                <span className="block overflow-hidden pb-[0.06em]">
                  <span
                    ref={headlineLine1Ref}
                    className="block will-change-[transform,opacity]"
                  >
                    I&apos;m the kind of
                  </span>
                </span>
                <span className="block overflow-hidden pb-[0.12em]">
                  <span className="inline-flex flex-wrap items-baseline gap-x-[0.24em]">
                    <span
                      ref={headlinePersonRef}
                      className="inline-block will-change-[transform,opacity]"
                    >
                      person
                    </span>
                    <em
                      ref={headlineItalicRef}
                      className="inline-block italic font-medium text-[#F3E9DE]/95 will-change-[transform,opacity]"
                      style={{
                        fontFamily: "var(--font-cormorant), Georgia, serif",
                        fontSize: "1.1em",
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {ABOUT_CONTENT.headlineItalic}
                    </em>
                  </span>
                </span>
              </h2>

              {/* Minimal typographic progression markers (01 .. 04) */}
              <div
                role="tablist"
                aria-label="About storytelling moments"
                className="mt-8 lg:mt-9 flex items-center gap-5"
              >
                {ABOUT_CONTENT.storyStatements.map((item, idx) => {
                  const isActive = activeIndex === idx;
                  const typedIdx = idx as 0 | 1 | 2 | 3;
                  return (
                    <button
                      key={item.index}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Jump to statement ${item.index}: ${item.text}`}
                      onClick={() => handleJumpToStatement(typedIdx)}
                      className="group inline-flex items-center gap-2 py-1 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F3E9DE]/80 cursor-pointer"
                    >
                      <span
                        className={`font-mono text-[11px] tracking-[0.18em] tabular-nums transition-colors duration-300 ${
                          isActive
                            ? "text-[#F3E9DE]"
                            : "text-[#F3E9DE]/42 group-hover:text-[#F3E9DE]/75"
                        }`}
                      >
                        {item.index}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`block h-[1px] transition-all duration-300 ${
                          isActive
                            ? "w-7 bg-[#F3E9DE]/88"
                            : "w-2.5 bg-[#F3E9DE]/24 group-hover:bg-[#F3E9DE]/48"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Masked Statement Viewport (Zero cards, pure editorial typography) */}
              <div
                data-testid="about-statement-viewport"
                className="relative mt-3 min-h-[4.2rem] lg:min-h-[4.8rem] overflow-hidden"
              >
                {ABOUT_CONTENT.storyStatements.map((statement, idx) => (
                  <p
                    key={statement.index}
                    ref={(el) => {
                      statementRefs.current[idx] = el;
                    }}
                    data-testid={`about-statement-${statement.index}`}
                    aria-hidden={activeIndex !== idx}
                    className="m-0 absolute inset-x-0 top-0 max-w-[26ch] font-normal leading-[1.24] tracking-[-0.02em] text-[#F3E9DE] will-change-[transform,opacity]"
                    style={{
                      fontFamily: "var(--font-manrope), system-ui, sans-serif",
                      fontSize: "clamp(1.38rem, 2.25vw, 2.05rem)",
                      opacity: 0,
                      visibility: "hidden",
                    }}
                  >
                    <span
                      className="mr-2.5 italic font-normal text-[#F3E9DE]/55"
                      style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                    >
                      —
                    </span>
                    {statement.text}
                  </p>
                ))}
              </div>

              {/* Scene 05 Settled Philosophy Paragraphs */}
              <div
                ref={philosophyRef}
                data-testid="about-philosophy-block"
                className="mt-5 lg:mt-6 max-w-[52ch] will-change-[transform,opacity]"
                style={{ opacity: 0, visibility: "hidden" }}
              >
                <div aria-hidden="true" className="mb-5 h-[1px] w-12 bg-[#F3E9DE]/28" />
                <div
                  className="space-y-4 text-[15px] lg:text-[16px] leading-[1.72] text-[#F3E9DE]/86"
                  style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}
                >
                  {ABOUT_CONTENT.philosophyParagraphs.map((paragraph, i) => (
                    <p key={i} className="m-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quiet Editorial Footer Strip & Hairline Progress Rule */}
          <div className="page-container relative z-10 pb-6">
            <div className="flex items-center justify-between gap-6 border-t border-[#F3E9DE]/14 pt-3.5 text-[11px] font-mono uppercase tracking-[0.2em] text-[#F3E9DE]/56 tabular-nums">
              <span>
                {ABOUT_CONTENT.chapterNumber} / {ABOUT_CONTENT.chapterLabel}
              </span>
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-24 lg:w-32 bg-[#F3E9DE]/18 overflow-hidden">
                  <div
                    ref={progressBarRef}
                    className="h-full w-full origin-left bg-[#F3E9DE]/82"
                    style={{ transform: "scaleX(0)" }}
                  />
                </div>
                <span className="text-[#F3E9DE]/76">
                  {ABOUT_CONTENT.storyStatements[activeIndex]?.index ?? "01"} / 04
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE LAYOUT (< 768px) & REDUCED-MOTION FALLBACK
          Clean non-pinned editorial presentation with 100% readable typography
         ═══════════════════════════════════════════════════════════════════════ */}
      <div
        data-testid="about-static-stage"
        className={`${
          reducedMotion ? "block" : "md:hidden"
        } relative overflow-hidden bg-[#792B33] pt-24 pb-20 sm:pt-28 sm:pb-24`}
      >
        {/* Ultra-fine static paper grain */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.045] mix-blend-soft-light"
          style={{ backgroundImage: WASHI_PAPER_GRAIN_BG, backgroundRepeat: "repeat" }}
        />

        {/* Reduced-prominence ink painting anchored toward the right/lower background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
        >
          <div
            className="absolute -right-12 top-12 h-[180px] w-[180px] md:right-[10.5%] md:top-[14%] md:h-[340px] md:w-[340px] rounded-full blur-[1px]"
            style={{
              background:
                "radial-gradient(circle, rgba(243,233,222,0.1) 0%, rgba(243,233,222,0.045) 56%, rgba(243,233,222,0) 74%)",
            }}
          />
          <div className="absolute -right-14 top-4 w-[58vw] max-w-[270px] md:right-0 md:top-[6%] md:w-[44vw] md:max-w-[620px] opacity-[0.3] md:opacity-[0.82]">
            <Image
              src={ABOUT_CONTENT.sumieArtwork.pineSrc}
              alt={ABOUT_CONTENT.sumieArtwork.pineAlt}
              width={876}
              height={896}
              sizes="(max-width: 767px) 58vw, 44vw"
              referrerPolicy="no-referrer"
              className="h-auto w-full select-none"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[150px] md:h-[34vh] opacity-[0.52] md:opacity-[0.7]">
            <Image
              src={ABOUT_CONTENT.sumieArtwork.mountainsSrc}
              alt={ABOUT_CONTENT.sumieArtwork.mountainsAlt}
              fill
              sizes="100vw"
              referrerPolicy="no-referrer"
              className="object-contain object-right-bottom select-none"
            />
          </div>
        </div>

        <div className="page-container relative z-10">
          <div className="w-full md:w-[55%] max-w-[660px]">
            <p
              className="m-0 mb-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-[#F3E9DE]/76"
              style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}
            >
              {ABOUT_CONTENT.heading}
            </p>

            <h2
              id={reducedMotion ? "about-heading" : undefined}
              className="m-0 text-left text-[#F3E9DE]"
              style={{
                fontFamily: "var(--font-manrope), system-ui, sans-serif",
                fontSize: "clamp(2.35rem, 9.2vw, 4.8rem)",
                fontWeight: 500,
                lineHeight: 1.06,
                letterSpacing: "-0.03em",
              }}
            >
              <span className="block">I&apos;m the kind of</span>
              <span className="inline-flex flex-wrap items-baseline gap-x-[0.22em]">
                <span>person</span>
                <em
                  className="italic font-medium text-[#F3E9DE]/95"
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "1.1em",
                    letterSpacing: "-0.015em",
                  }}
                >
                  {ABOUT_CONTENT.headlineItalic}
                </em>
              </span>
            </h2>

            {/* Clean numbered editorial list (zero cards) */}
            <ol className="m-0 mt-8 list-none divide-y divide-[#F3E9DE]/14 border-y border-[#F3E9DE]/14 p-0">
              {ABOUT_CONTENT.storyStatements.map((statement) => (
                <li
                  key={statement.index}
                  className="flex items-baseline gap-4 py-3.5"
                >
                  <span className="font-mono text-[11px] tracking-[0.18em] text-[#F3E9DE]/56 tabular-nums shrink-0">
                    {statement.index}
                  </span>
                  <span
                    className="text-[1.08rem] sm:text-[1.22rem] leading-[1.35] tracking-[-0.015em] text-[#F3E9DE]"
                    style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}
                  >
                    {statement.text}
                  </span>
                </li>
              ))}
            </ol>

            {/* Philosophy paragraphs */}
            <div
              className="mt-8 space-y-4 text-[15px] leading-[1.74] text-[#F3E9DE]/88 max-w-[52ch]"
              style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}
            >
              {ABOUT_CONTENT.philosophyParagraphs.map((paragraph, i) => (
                <p key={i} className="m-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
