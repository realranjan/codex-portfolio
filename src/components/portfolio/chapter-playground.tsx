"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, X } from "lucide-react";
import {
  EXPERIMENTS,
  PLAYGROUND_CONTENT,
  type PlaygroundExperiment,
} from "@/data/portfolio-content";
import {
  ChapterHeading,
  PlaceholderVisual,
} from "@/components/portfolio/editorial-primitives";

gsap.registerPlugin(ScrollTrigger);

/**
 * CHAPTER 03 — THE PLAYGROUND / EXPERIMENTS (Ivory #F3E9DE / Burgundy #792B33)
 *
 * Distinct from Selected Projects:
 * - Curated asymmetric 6-tile exhibition composition with varied aspect ratios,
 *   deliberate spatial offsets, and subtle resting rotations that straighten on hover.
 * - Clicking any tile opens a clean side detail flyout panel.
 * - Ends with a scroll-scrubbed converging architectural line & geometric masked
 *   Burgundy aperture transition into Chapter 04 (Skills & Technology).
 */
export function ChapterPlayground() {
  const [selected, setSelected] = useState<PlaygroundExperiment | null>(null);
  const transitionRef = useRef<HTMLDivElement>(null);
  const leftLineRef = useRef<HTMLDivElement>(null);
  const rightLineRef = useRef<HTMLDivElement>(null);
  const maskBoxRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selected) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // Transition -> Tech Stack: converging lines + masked Ivory -> Burgundy aperture reveal
  useEffect(() => {
    const root = transitionRef.current;
    const leftLine = leftLineRef.current;
    const rightLine = rightLineRef.current;
    const maskBox = maskBoxRef.current;
    if (!root || !leftLine || !rightLine || !maskBox) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(maskBox, { clipPath: "inset(0% 0% 0% 0%)" });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 85%",
          end: "bottom 35%",
          scrub: true,
        },
      });

      tl.fromTo(leftLine, { xPercent: -48 }, { xPercent: 0, ease: "none" }, 0)
        .fromTo(rightLine, { xPercent: 48 }, { xPercent: 0, ease: "none" }, 0)
        .fromTo(
          maskBox,
          { clipPath: "inset(18% 36% 0% 36%)" },
          { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut" },
          0.12
        );
    }, transitionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="playground"
      aria-labelledby="playground-heading"
      data-chapter-surface="ivory"
      className="relative bg-[#F3E9DE] text-[#792B33] pt-16 sm:pt-24 overflow-x-clip"
    >
      <div className="page-container pb-20 sm:pb-28">
        <ChapterHeading
          id="playground-heading"
          number={PLAYGROUND_CONTENT.chapterNumber}
          label={PLAYGROUND_CONTENT.chapterLabel}
          heading={PLAYGROUND_CONTENT.heading}
          supportingText={PLAYGROUND_CONTENT.supportingText}
          surface="ivory"
          action={
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/72">
              06 Experiments · Select Any Tile
            </span>
          }
        />

        {/* Curated Asymmetric Exhibition Gallery */}
        <div
          data-testid="playground-asymmetric-grid"
          className="mt-14 sm:mt-20 grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 items-start"
        >
          {EXPERIMENTS.map((exp) => {
            const isSelected = selected?.id === exp.id;
            return (
              <div
                key={exp.id}
                className={`${exp.layout.colSpanClass} ${exp.layout.offsetYClass}`}
              >
                <button
                  type="button"
                  onClick={() => setSelected(exp)}
                  aria-expanded={isSelected}
                  data-testid={`playground-tile-${exp.code}`}
                  className="group block w-full text-left cursor-pointer transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-[6px] focus-visible:outline-2 focus-visible:outline-[#792B33] focus-visible:outline-offset-4"
                >
                  <div
                    className={`border p-4 sm:p-5 transition-[border-color,background-color,color,box-shadow] duration-300 ${
                      isSelected
                        ? "border-[#792B33] bg-[#792B33] text-[#F3E9DE] shadow-[0_14px_30px_rgba(121,43,51,0.16)]"
                        : "border-[#792B33]/26 bg-[#F3E9DE] text-[#792B33] group-hover:border-[#792B33] group-hover:shadow-[0_14px_28px_rgba(121,43,51,0.10)]"
                    }`}
                  >
                    <PlaceholderVisual
                      surface={isSelected ? "burgundy" : "ivory"}
                      number={exp.code}
                      label={
                        exp.mediaKind === "3d"
                          ? "3D ASSET COMING SOON"
                          : "IMAGE COMING SOON"
                      }
                      sublabel={exp.category}
                      aspectClass={exp.layout.aspectClass}
                      imageUrl={exp.mediaUrl}
                      imageAlt={exp.title}
                    />

                    <div className="mt-4 flex items-baseline justify-between gap-3">
                      <div>
                        <span
                          className={`block font-mono text-[11px] uppercase tracking-[0.16em] ${
                            isSelected ? "text-[#F3E9DE]/72" : "text-[#792B33]/65"
                          }`}
                        >
                          {exp.code} · {exp.status}
                        </span>
                        <h3
                          className="mt-1 m-0 text-2xl sm:text-3xl font-normal uppercase leading-none tracking-[-0.02em]"
                          style={{ fontFamily: "var(--font-anton), Impact, sans-serif" }}
                        >
                          {exp.title}
                        </h3>
                      </div>

                      <span
                        aria-hidden="true"
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center border transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                          isSelected
                            ? "border-[#F3E9DE]/45 text-[#F3E9DE]"
                            : "border-[#792B33]/30 text-[#792B33]"
                        }`}
                      >
                        <ArrowUpRight size={15} strokeWidth={1.7} />
                      </span>
                    </div>

                    <p
                      className={`mt-2.5 m-0 text-sm leading-relaxed ${
                        isSelected ? "text-[#F3E9DE]/82" : "text-[#792B33]/78"
                      }`}
                    >
                      {exp.shortDescription}
                    </p>

                    <p
                      className={`mt-3 m-0 font-mono text-[11px] ${
                        isSelected ? "text-[#F3E9DE]/68" : "text-[#792B33]/60"
                      }`}
                    >
                      {exp.technologies.join(" · ")}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TRANSITION TO CHAPTER 04 (TECH STACK): CONVERGING LINES + MASKED BURGUNDY APERTURE ── */}
      <div
        ref={transitionRef}
        aria-hidden="true"
        className="relative h-[220px] sm:h-[260px] w-full overflow-hidden bg-[#F3E9DE]"
      >
        {/* Converging architectural guidelines pulling toward screen center */}
        <div className="pointer-events-none absolute inset-x-0 top-10 z-[2] flex items-center justify-center gap-6 px-6">
          <div
            ref={leftLineRef}
            className="flex flex-1 items-center justify-end gap-4 will-change-transform"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#792B33]/70 whitespace-nowrap">
              Curiosity
            </span>
            <span className="h-px w-full max-w-[320px] bg-[#792B33]/45" />
          </div>
          <span className="h-2.5 w-2.5 shrink-0 rotate-45 border border-[#792B33]" />
          <div
            ref={rightLineRef}
            className="flex flex-1 items-center justify-start gap-4 will-change-transform"
          >
            <span className="h-px w-full max-w-[320px] bg-[#792B33]/45" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#792B33]/70 whitespace-nowrap">
              Instrument
            </span>
          </div>
        </div>

        {/* Masked geometric Burgundy reveal rising cleanly into Chapter 04 */}
        <div
          ref={maskBoxRef}
          className="absolute inset-x-0 bottom-0 top-16 z-[3] flex items-end justify-center bg-[#792B33] pb-6 will-change-[clip-path]"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#F3E9DE]/75">
            Next · The Art of Making Things
          </span>
        </div>
      </div>

      {/* ── EXPERIMENT DETAIL FLYOUT PANEL ── */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="experiment-flyout-title"
          data-testid="playground-flyout"
          className="fixed inset-0 z-[75] flex justify-end bg-[#792B33]/35"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="relative h-full w-full max-w-xl overflow-y-auto border-l border-[#792B33]/25 bg-[#F3E9DE] p-6 sm:p-10 text-[#792B33]">
            <div className="flex items-center justify-between border-b border-[#792B33]/20 pb-4">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/72">
                Playground · {selected.code}
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close experiment panel"
                className="inline-flex h-10 items-center gap-1.5 border border-[#792B33]/35 px-3.5 text-xs font-mono uppercase tracking-[0.14em] text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
              >
                <span>Close</span>
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#792B33]/68">
                  {selected.category} · {selected.status}
                </p>
                <h3
                  id="experiment-flyout-title"
                  className="mt-2 m-0 text-4xl sm:text-5xl font-normal uppercase leading-none tracking-[-0.025em]"
                  style={{ fontFamily: "var(--font-anton), Impact, sans-serif" }}
                >
                  {selected.title}
                </h3>
              </div>

              <PlaceholderVisual
                surface="ivory"
                number={selected.code}
                label={
                  selected.mediaKind === "3d"
                    ? "3D ASSET COMING SOON"
                    : "IMAGE COMING SOON"
                }
                sublabel={selected.category}
                aspectClass="aspect-[16/10]"
                imageUrl={selected.mediaUrl}
              />

              <div className="space-y-2">
                <h4 className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/68">
                  Notes &amp; Explanation
                </h4>
                <p className="m-0 text-base leading-relaxed text-[#792B33]/88">
                  {selected.expandedExplanation}
                </p>
              </div>

              <div className="border-t border-[#792B33]/18 pt-5 space-y-2">
                <h4 className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/68">
                  Technologies
                </h4>
                <p className="m-0 font-mono text-sm text-[#792B33]">
                  {selected.technologies.join(" · ")}
                </p>
              </div>

              <div className="border-t border-[#792B33]/18 pt-5">
                {selected.externalUrl ? (
                  <a
                    href={selected.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-2 bg-[#792B33] px-5 py-2.5 text-xs font-mono uppercase tracking-[0.14em] text-[#F3E9DE] no-underline"
                  >
                    <span>Open Experiment</span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                ) : (
                  <span className="inline-flex min-h-[44px] items-center border border-dashed border-[#792B33]/35 px-4 py-2 text-xs font-mono uppercase tracking-[0.14em] text-[#792B33]/65">
                    External Link · Not configured
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
