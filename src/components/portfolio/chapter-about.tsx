"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ABOUT_CONTENT } from "@/data/portfolio-content";
import { PlaceholderVisual } from "@/components/portfolio/editorial-primitives";

gsap.registerPlugin(ScrollTrigger);

/**
 * CHAPTER 01 — ABOUT & PHILOSOPHY (Burgundy #792B33 / Ivory #F3E9DE)
 *
 * Structure:
 * 1. Pinned scroll-controlled typographic mask sequence on desktop (`MORE THAN MEETS THE EYE.`
 *    -> 4-beat statement cadence: "I'm the kind of person who..." -> "can't leave a" ->
 *    "question unanswered." -> "Sometimes it becomes a project. Sometimes an experiment.
 *    Sometimes a very long night."). On mobile, presents clean readable staggered editorial typography.
 * 2. Settled experimental editorial Philosophy layout + designated pointer-parallax
 *    "3D CHARACTER / COMING SOON" container for the future unmasked cat GLB/Spline asset.
 */
export function ChapterAbout() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinStageRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  const beat0Ref = useRef<HTMLDivElement>(null);
  const beat1Ref = useRef<HTMLDivElement>(null);
  const beat2Ref = useRef<HTMLDivElement>(null);
  const beat3Ref = useRef<HTMLDivElement>(null);
  const beat3LineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const beat2UnderlineRef = useRef<HTMLDivElement>(null);

  const characterBoxRef = useRef<HTMLDivElement>(null);
  const characterInnerRef = useRef<HTMLDivElement>(null);

  // 1. Pinned desktop scroll-controlled manifesto sequence (cleanly reverses, zero lag)
  useEffect(() => {
    const pinEl = pinStageRef.current;
    if (!pinEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (reduced || !isDesktop) return;

    const beats = [beat0Ref.current, beat1Ref.current, beat2Ref.current, beat3Ref.current];
    if (beats.some((b) => !b)) return;

    const ctx = gsap.context(() => {
      // Set initial states cleanly
      gsap.set(beat0Ref.current, { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set([beat1Ref.current, beat2Ref.current, beat3Ref.current], {
        opacity: 0,
        y: 36,
        pointerEvents: "none",
      });
      if (beat2UnderlineRef.current) {
        gsap.set(beat2UnderlineRef.current, { scaleX: 0, transformOrigin: "left center" });
      }
      const lineEls = beat3LineRefs.current.filter((el): el is HTMLSpanElement => el !== null);
      if (lineEls.length) {
        gsap.set(lineEls, { yPercent: 112 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinEl,
          start: "top top",
          end: "+=210%",
          pin: true,
          scrub: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (progressBarRef.current) {
              progressBarRef.current.style.transform = `scaleX(${self.progress.toFixed(4)})`;
            }
            if (counterRef.current) {
              const step =
                self.progress < 0.25
                  ? "01 / 04"
                  : self.progress < 0.5
                    ? "02 / 04"
                    : self.progress < 0.75
                      ? "03 / 04"
                      : "04 / 04";
              if (counterRef.current.textContent !== step) {
                counterRef.current.textContent = step;
              }
            }
          },
        },
      });

      // Quarter 1 (0 -> 0.25): Hold Beat 1, then exit upward via clip-mask
      tl.to(beat0Ref.current, { y: -12, duration: 0.14, ease: "none" }, 0)
        .to(
          beat0Ref.current,
          { opacity: 0, y: -54, clipPath: "inset(100% 0% 0% 0%)", duration: 0.1, ease: "power2.in" },
          0.14
        );

      // Quarter 2 (0.25 -> 0.50): Reveal Beat 2 ("CAN'T LEAVE A"), hold, exit cleanly
      tl.fromTo(
        beat1Ref.current,
        { opacity: 0, y: 48, clipPath: "inset(0% 0% 100% 0%)" },
        { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 0.1, ease: "power3.out" },
        0.25
      )
        .to(beat1Ref.current, { y: -8, duration: 0.08, ease: "none" }, 0.35)
        .to(
          beat1Ref.current,
          { opacity: 0, y: -52, clipPath: "inset(100% 0% 0% 0%)", duration: 0.07, ease: "power2.in" },
          0.43
        );

      // Quarter 3 (0.50 -> 0.75): Reveal Beat 3 ("QUESTION unanswered.") + hairline sweep, exit cleanly
      tl.fromTo(
        beat2Ref.current,
        { opacity: 0, y: 44, clipPath: "inset(0% 0% 100% 0%)" },
        { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 0.1, ease: "power3.out" },
        0.51
      );
      if (beat2UnderlineRef.current) {
        tl.to(beat2UnderlineRef.current, { scaleX: 1, duration: 0.09, ease: "power2.out" }, 0.56);
      }
      tl.to(
        beat2Ref.current,
        { opacity: 0, y: -50, clipPath: "inset(100% 0% 0% 0%)", duration: 0.07, ease: "power2.in" },
        0.68
      );

      // Quarter 4 (0.75 -> 1.00): Staggered 3-line reveal and settle comfortably for reading
      tl.to(beat3Ref.current, { opacity: 1, y: 0, duration: 0.06, ease: "power2.out" }, 0.75);
      if (lineEls.length) {
        tl.to(
          lineEls,
          { yPercent: 0, stagger: 0.045, duration: 0.12, ease: "power3.out" },
          0.76
        );
      }
      tl.to({}, { duration: 0.1 }, 0.9);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // 2. Subtle pointer parallax on the Future 3D Character container (zero random motion)
  useEffect(() => {
    const box = characterBoxRef.current;
    const inner = characterInnerRef.current;
    if (!box || !inner) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const handleMove = (e: PointerEvent) => {
      const rect = box.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      inner.style.transform = `translate3d(${(nx * 10).toFixed(1)}px, ${(ny * 8).toFixed(1)}px, 0) rotateX(${(-ny * 2.4).toFixed(2)}deg) rotateY(${(nx * 3.2).toFixed(2)}deg)`;
    };

    const handleLeave = () => {
      inner.style.transform = "translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)";
    };

    box.addEventListener("pointermove", handleMove, { passive: true });
    box.addEventListener("pointerleave", handleLeave, { passive: true });
    return () => {
      box.removeEventListener("pointermove", handleMove);
      box.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      aria-labelledby="about-heading"
      data-chapter-surface="burgundy"
      className="relative bg-[#792B33] text-[#F3E9DE]"
    >
      {/* ── PART A: PINNED SCROLL-CONTROLLED STATEMENT SEQUENCE (Desktop) ── */}
      <div
        ref={pinStageRef}
        data-testid="about-manifesto-stage"
        className="relative hidden md:flex min-h-[100svh] w-full flex-col justify-between overflow-hidden px-6 pt-24 pb-10"
      >
        {/* Top chapter strip */}
        <div className="page-container flex items-center justify-between border-b border-[#F3E9DE]/18 pb-4 text-xs font-mono uppercase tracking-[0.2em] text-[#F3E9DE]/72 tabular-nums">
          <span>
            Chapter {ABOUT_CONTENT.chapterNumber} · {ABOUT_CONTENT.chapterLabel}
          </span>
          <span ref={counterRef} className="text-[#F3E9DE]">
            01 / 04
          </span>
        </div>

        {/* Center stacked typographic mask stage */}
        <div className="page-container relative my-auto flex min-h-[54svh] items-center justify-center">
          {/* Beat 1 (0-25%) */}
          <div
            ref={beat0Ref}
            data-testid="about-beat-1"
            className="absolute inset-0 flex flex-col items-center justify-center text-center will-change-[transform,opacity,clip-path]"
          >
            <p className="mb-4 text-xs font-mono uppercase tracking-[0.22em] text-[#F3E9DE]/65">
              {ABOUT_CONTENT.heading}
            </p>
            <p
              className="m-0 max-w-[18ch] font-medium leading-[1.06] tracking-[-0.03em] text-[#F3E9DE]"
              style={{ fontSize: "clamp(38px, 5.2vw, 76px)" }}
            >
              I&apos;m the kind of person{" "}
              <em
                className="font-serif italic font-semibold text-[#F3E9DE]/92"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                who...
              </em>
            </p>
          </div>

          {/* Beat 2 (25-50%) */}
          <div
            ref={beat1Ref}
            data-testid="about-beat-2"
            className="absolute inset-0 flex flex-col items-center justify-center text-center will-change-[transform,opacity,clip-path]"
          >
            <p
              className="m-0 uppercase leading-[0.86] tracking-[-0.035em] text-[#F3E9DE]"
              style={{
                fontFamily: "var(--font-anton), Impact, sans-serif",
                fontSize: "clamp(72px, 13.5vw, 198px)",
              }}
            >
              CAN&apos;T LEAVE A
            </p>
          </div>

          {/* Beat 3 (50-75%) */}
          <div
            ref={beat2Ref}
            data-testid="about-beat-3"
            className="absolute inset-0 flex flex-col items-center justify-center text-center will-change-[transform,opacity,clip-path]"
          >
            <p
              className="m-0 uppercase leading-[0.88] tracking-[-0.03em] text-[#F3E9DE]"
              style={{
                fontFamily: "var(--font-anton), Impact, sans-serif",
                fontSize: "clamp(58px, 9.4vw, 144px)",
              }}
            >
              QUESTION
            </p>
            <div className="relative mt-2 inline-flex flex-col items-center">
              <span
                className="font-serif italic font-semibold leading-[1.02] text-[#F3E9DE]"
                style={{
                  fontFamily: "var(--font-cormorant), Georgia, serif",
                  fontSize: "clamp(48px, 7.2vw, 112px)",
                }}
              >
                unanswered.
              </span>
              <div
                ref={beat2UnderlineRef}
                aria-hidden="true"
                className="mt-2 h-[2px] w-full bg-[#F3E9DE]/75"
              />
            </div>
          </div>

          {/* Beat 4 (75-100%) */}
          <div
            ref={beat3Ref}
            data-testid="about-beat-4"
            className="absolute inset-0 flex flex-col items-center justify-center text-center will-change-[transform,opacity]"
          >
            <div className="space-y-2 sm:space-y-3">
              {ABOUT_CONTENT.manifestoBeats[3].lines.map((line, idx) => (
                <div key={line.emphasis} className="overflow-hidden py-1">
                  <span
                    ref={(el) => {
                      beat3LineRefs.current[idx] = el;
                    }}
                    className="block leading-[1.12] tracking-[-0.025em] text-[#F3E9DE] will-change-transform"
                    style={{ fontSize: "clamp(28px, 4.1vw, 60px)" }}
                  >
                    <span className="font-normal text-[#F3E9DE]/82">{line.prefix}</span>
                    <em
                      className="font-serif italic font-semibold text-[#F3E9DE]"
                      style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                    >
                      {line.emphasis}
                    </em>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom hairline scroll progress */}
        <div className="page-container space-y-3">
          <div className="h-[1.5px] w-full bg-[#F3E9DE]/18 overflow-hidden">
            <div
              ref={progressBarRef}
              className="h-full w-full origin-left bg-[#F3E9DE]"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.18em] text-[#F3E9DE]/60">
            <span>Scroll to unfold</span>
            <span>Curiosity &amp; Craft</span>
          </div>
        </div>
      </div>

      {/* ── MOBILE STATEMENT SEQUENCE (Zero heavy pinning, crisp editorial cadence) ── */}
      <div className="md:hidden px-5 pt-24 pb-12 border-b border-[#F3E9DE]/18">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#F3E9DE]/68">
          Chapter {ABOUT_CONTENT.chapterNumber} · {ABOUT_CONTENT.chapterLabel}
        </p>
        <p className="mt-6 text-2xl font-medium leading-snug text-[#F3E9DE]">
          {ABOUT_CONTENT.mainStatement}
        </p>
        <p
          className="mt-4 font-serif italic text-2xl leading-snug text-[#F3E9DE]/86"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          {ABOUT_CONTENT.supportingStatement}
        </p>
      </div>

      {/* ── PART B: SETTLED EDITORIAL PHILOSOPHY + FUTURE 3D UNMASKED CAT SLOT ── */}
      <div className="page-container pt-16 sm:pt-24 pb-20 sm:pb-28">
        {/* Monumental section title */}
        <div className="border-t border-[#F3E9DE]/20 pt-10 pb-12 sm:pb-16">
          <p className="mb-4 text-xs font-mono uppercase tracking-[0.2em] text-[#F3E9DE]/68">
            Philosophy · 01
          </p>
          <h2
            id="about-heading"
            className="m-0 font-normal uppercase leading-[0.87] tracking-[-0.03em] text-[#F3E9DE]"
            style={{
              fontFamily: "var(--font-anton), Impact, sans-serif",
              fontSize: "clamp(54px, 9.2vw, 148px)",
              textWrap: "balance",
            }}
          >
            {ABOUT_CONTENT.heading}
          </h2>
        </div>

        {/* Asymmetrical editorial grid: Offset Philosophy statements + Pointer-Parallax 3D Asset Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start">
          {/* Left-offset editorial statement & readable philosophy paragraphs */}
          <div className="lg:col-span-7 space-y-10">
            <blockquote className="m-0 border-b border-[#F3E9DE]/20 pb-8">
              <p
                className="m-0 font-serif italic leading-[1.22] text-[#F3E9DE]"
                style={{
                  fontFamily: "var(--font-cormorant), Georgia, serif",
                  fontSize: "clamp(28px, 3vw, 44px)",
                }}
              >
                &ldquo;{ABOUT_CONTENT.mainStatement}&rdquo;
              </p>
              <p className="mt-4 text-base sm:text-lg text-[#F3E9DE]/78">
                {ABOUT_CONTENT.supportingStatement}
              </p>
            </blockquote>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-8">
              <div className="sm:col-span-3">
                <span className="text-xs font-mono uppercase tracking-[0.18em] text-[#F3E9DE]/62">
                  How I Think
                </span>
              </div>
              <div className="sm:col-span-9 space-y-5 text-base sm:text-[17px] leading-[1.72] text-[#F3E9DE]/88 max-w-[54ch]">
                {ABOUT_CONTENT.philosophyParagraphs.map((paragraph, i) => (
                  <p key={i} className="m-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Designated Future 3D Unmasked Cat Container with subtle pointer parallax */}
          <div className="lg:col-span-5 lg:pt-6">
            <div
              ref={characterBoxRef}
              className="relative"
              style={{ perspective: "900px" }}
            >
              <div
                ref={characterInnerRef}
                className="transition-transform duration-300 ease-out will-change-transform"
              >
                <PlaceholderVisual
                  surface="burgundy"
                  number="01"
                  label={ABOUT_CONTENT.characterSlot.label}
                  sublabel={ABOUT_CONTENT.characterSlot.sublabel}
                  aspectClass="aspect-[4/5]"
                  slotId={ABOUT_CONTENT.characterSlot.slotId}
                  imageUrl={ABOUT_CONTENT.characterSlot.assetUrl}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.16em] text-[#F3E9DE]/62">
              <span>Interactive Container · Pointer Parallax</span>
              <span>GLB / Spline Slot</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
