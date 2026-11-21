"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ABOUT_CONTENT } from "@/data/portfolio-content";
import { computeWordRevealState } from "@/lib/story-scroll-camera";
import koiCutout from "@/assets/illustrations/koi-cutout.png";

gsap.registerPlugin(ScrollTrigger);

interface RevealSegment {
  id: string;
  words: string[];
  kind: "lead" | "body" | "closing";
}

/**
 * CHAPTER 01 — ABOUT & PHILOSOPHY (Single Focused Editorial Page · Burgundy #792B33)
 *
 * - Strictly ONE composed chapter (no multi-page bloat).
 * - Background-free transparent Japanese Koi cutout floating directly on Burgundy
 *   with zero rectangular frame/card, drifting gently with scroll parallax.
 * - Scroll-scrubbed word-by-word typography text reveal animation paired with a
 *   fine vertical ivory ink thread.
 */
export function ChapterAbout() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealBlockRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const inkRuleRef = useRef<HTMLDivElement>(null);
  const koiDriftRef = useRef<HTMLDivElement>(null);

  const segments = useMemo<RevealSegment[]>(() => {
    return [
      {
        id: "lead",
        kind: "lead",
        words: ABOUT_CONTENT.mainStatement.split(/\s+/),
      },
      ...ABOUT_CONTENT.philosophyParagraphs.map((paragraph, idx) => ({
        id: `p-${idx}`,
        kind: (idx === ABOUT_CONTENT.philosophyParagraphs.length - 1
          ? "closing"
          : "body") as RevealSegment["kind"],
        words: paragraph.split(/\s+/),
      })),
    ];
  }, []);

  const totalWords = useMemo(
    () => segments.reduce((sum, seg) => sum + seg.words.length, 0),
    [segments]
  );

  // 1. Scroll-scrubbed word-by-word ink typography reveal
  useEffect(() => {
    const section = sectionRef.current;
    const revealBlock = revealBlockRef.current;
    if (!section || !revealBlock) return;

    const words = wordRefs.current.filter(
      (el): el is HTMLSpanElement => el !== null
    );
    if (words.length === 0) return;

    const applyProgress = (progress: number) => {
      revealBlock.dataset.revealProgress = progress.toFixed(2);
      if (inkRuleRef.current) {
        inkRuleRef.current.style.transform = `scaleY(${Math.max(0.06, progress).toFixed(3)})`;
      }
      for (let i = 0; i < words.length; i++) {
        const st = computeWordRevealState(progress, i, words.length);
        const node = words[i];
        node.style.opacity = String(st.opacity);
        node.style.transform =
          st.yPx > 0 ? `translate3d(0, ${st.yPx}px, 0)` : "";
      }
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      applyProgress(1);
      return;
    }

    // Paint deterministic initial frame based on current viewport position
    const rect = revealBlock.getBoundingClientRect();
    const vh = Math.max(1, window.innerHeight);
    const startPx = vh * 0.84;
    const endPx = vh * 0.3;
    const initialProgress = Math.min(
      1,
      Math.max(0, (startPx - rect.top) / Math.max(1, startPx - endPx + rect.height * 0.55))
    );
    applyProgress(initialProgress);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: revealBlock,
        start: "top 84%",
        end: "bottom 42%",
        scrub: true,
        onUpdate: (self) => {
          applyProgress(self.progress);
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [totalWords]);

  // 2. Background-free Koi cutout gentle upward glide & swim rotation
  useEffect(() => {
    const section = sectionRef.current;
    const koi = koiDriftRef.current;
    if (!section || !koi) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(koi, { y: 0, rotation: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        koi,
        { y: 34, rotation: -4, scale: 0.96 },
        {
          y: -38,
          rotation: 3.5,
          scale: 1.03,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  let runningWordIdx = 0;

  return (
    <section
      ref={sectionRef}
      id="about"
      aria-labelledby="about-heading"
      data-chapter-surface="burgundy"
      data-testid="about-chapter"
      className="relative bg-[#792B33] text-[#F3E9DE] pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 overflow-x-clip"
    >
      <div className="page-container relative">
        {/* Chapter Header Bar */}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#F3E9DE]/22 pb-4">
          <div>
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.22em] text-[#F3E9DE]/68">
              <span>{ABOUT_CONTENT.chapterLabel}</span>
            </div>
            <h2
              id="about-heading"
              className="mt-1.5 m-0 font-normal uppercase leading-[0.9] tracking-[-0.03em] text-[#F3E9DE]"
              style={{
                fontFamily: "var(--font-anton), Impact, sans-serif",
                fontSize: "clamp(38px, 4.8vw, 72px)",
              }}
            >
              {ABOUT_CONTENT.heading}
            </h2>
          </div>

          <div className="flex items-baseline gap-3 text-right">
            <span
              aria-hidden="true"
              className="font-serif italic text-xl sm:text-2xl text-[#F3E9DE]/60"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              好奇心
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#F3E9DE]/65">
              Curiosity In Motion
            </span>
          </div>
        </header>

        {/* Single-Page Editorial Spread: Scroll Text Reveal (Left) + BG-Free Koi Cutout (Right) */}
        <div className="mt-7 sm:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column: Typography Reveal Narrative */}
          <div className="lg:col-span-7 relative z-10">
            <p
              className="m-0 font-serif italic text-2xl sm:text-3xl text-[#F3E9DE]/82"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              {ABOUT_CONTENT.headlineLead}{" "}
              <span className="text-[#F3E9DE]">{ABOUT_CONTENT.headlineItalic}</span>
            </p>

            {/* Scroll-scrubbed word-by-word ink reveal block */}
            <div
              ref={revealBlockRef}
              data-testid="about-text-reveal"
              data-reveal-progress="0.00"
              className="relative mt-6 pl-5 sm:pl-7 space-y-5"
            >
              {/* Vertical ink progress rail tracking reading progress */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-1 left-0 top-1 w-[2px] bg-[#F3E9DE]/16"
              >
                <div
                  ref={inkRuleRef}
                  className="h-full w-full origin-top bg-[#F3E9DE]/85 will-change-transform"
                  style={{ transform: "scaleY(0.06)" }}
                />
              </div>

              {segments.map((seg) => {
                const isLead = seg.kind === "lead";
                const isClosing = seg.kind === "closing";

                return (
                  <p
                    key={seg.id}
                    className={
                      isLead
                        ? "m-0 text-2xl sm:text-[30px] lg:text-[34px] leading-[1.24] tracking-[-0.015em] text-[#F3E9DE] font-normal"
                        : isClosing
                          ? "m-0 font-serif italic text-xl sm:text-2xl leading-[1.42] text-[#F3E9DE]"
                          : "m-0 text-base sm:text-lg lg:text-[19px] leading-[1.68] text-[#F3E9DE]/95 max-w-[54ch]"
                    }
                    style={
                      isLead || isClosing
                        ? { fontFamily: "var(--font-cormorant), Georgia, serif" }
                        : undefined
                    }
                  >
                    {seg.words.map((word, wIdx) => {
                      const globalIdx = runningWordIdx++;
                      return (
                        <span
                          key={`${seg.id}-${wIdx}`}
                          ref={(el) => {
                            wordRefs.current[globalIdx] = el;
                          }}
                          className="inline-block will-change-[opacity,transform]"
                          style={{ opacity: 0.2 }}
                        >
                          {word}
                          {wIdx < seg.words.length - 1 ? "\u00A0" : ""}
                        </span>
                      );
                    })}
                  </p>
                );
              })}
            </div>

            {/* Compact 4-Trait Editorial Index */}
            <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 border-t border-[#F3E9DE]/20 pt-6">
              {ABOUT_CONTENT.storyStatements.map((item) => (
                <div key={item.index} className="flex items-baseline gap-3">
                  <span aria-hidden="true" className="font-mono text-xs text-[#F3E9DE]/55 shrink-0">
                    —
                  </span>
                  <span className="text-sm sm:text-[15px] leading-snug text-[#F3E9DE]/88">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-6 m-0 font-mono text-xs tracking-[0.06em] text-[#F3E9DE]/68">
              {ABOUT_CONTENT.supportingStatement}
            </p>
          </div>

          {/* Right Column: Background-Free Transparent Koi Cutout Floating on Burgundy */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
            <div
              ref={koiDriftRef}
              data-testid="about-koi-illustration"
              className="pointer-events-none select-none relative w-[min(320px,78vw)] sm:w-[360px] lg:w-[min(430px,36vw)] will-change-transform"
              style={{
                filter: "drop-shadow(0 24px 36px rgba(24, 6, 9, 0.42))",
              }}
            >
              <Image
                src={koiCutout}
                alt="Traditional Japanese hand-painted vermilion and gold twin koi gliding freely"
                priority
                referrerPolicy="no-referrer"
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
