"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EDUCATION_CONTENT, EDUCATION_ENTRIES } from "@/data/portfolio-content";
import { ChapterHeading } from "@/components/portfolio/editorial-primitives";

gsap.registerPlugin(ScrollTrigger);

/**
 * CHAPTER 06 — EDUCATION (Burgundy #792B33 / Ivory #F3E9DE)
 *
 * Short, elegant, typography-focused chapter:
 * - Oversized Anton years revealed through CSS clip masks on scroll
 * - Staggered supporting institution details & architectural connecting rule
 * - Interactive entry focus indicator (01 / 02, 02 / 02)
 * - No bloated multi-screen pinning or decorative academic icons
 */
export function ChapterEducation() {
  const sectionRef = useRef<HTMLElement>(null);
  const yearRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const years = yearRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    if (years.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      years.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.48,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="education"
      aria-labelledby="education-heading"
      data-chapter-surface="burgundy"
      className="relative bg-[#792B33] text-[#F3E9DE] pt-8 sm:pt-12 pb-12 sm:pb-16 overflow-x-clip"
    >
      <div className="page-container">
        <ChapterHeading
          id="education-heading"
          number={EDUCATION_CONTENT.chapterNumber}
          label={EDUCATION_CONTENT.chapterLabel}
          heading={EDUCATION_CONTENT.heading}
          surface="burgundy"
          action={
            <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
              {EDUCATION_ENTRIES.map((entry, idx) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  aria-pressed={activeIdx === idx}
                  className={`h-8 px-2.5 transition-colors cursor-pointer ${
                    activeIdx === idx
                      ? "bg-[#F3E9DE] text-[#792B33]"
                      : "border border-[#F3E9DE]/30 text-[#F3E9DE]/75 hover:border-[#F3E9DE]"
                  }`}
                >
                  {entry.index}
                </button>
              ))}
            </div>
          }
        />

        {/* Restrained Oversized Year Editorial Entries (Visual Rest) */}
        <div className="mt-8 sm:mt-10 space-y-8 sm:space-y-10">
          {EDUCATION_ENTRIES.map((entry, idx) => {
            const isFocused = idx === activeIdx;
            return (
              <article
                key={entry.id}
                onMouseEnter={() => setActiveIdx(idx)}
                data-testid={`education-entry-${entry.index}`}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start border-b pb-8 transition-colors duration-300 ${
                  isFocused ? "border-[#F3E9DE]/38" : "border-[#F3E9DE]/18"
                }`}
              >
                {/* Oversized Masked Years Column */}
                <div className="lg:col-span-5 space-y-2">
                  <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-[#F3E9DE]/65 tabular-nums">
                    <span>Entry {entry.index} / 0{EDUCATION_ENTRIES.length}</span>
                    <span aria-hidden="true">·</span>
                    <span>{entry.location}</span>
                  </div>

                  <div className="overflow-hidden py-1">
                    <span
                      ref={(el) => {
                        yearRefs.current[idx] = el;
                      }}
                      className="block leading-[0.88] tracking-[-0.03em] text-[#F3E9DE] tabular-nums will-change-transform"
                      style={{
                        fontFamily: "var(--font-anton), Impact, sans-serif",
                        fontSize: "clamp(48px, 5.8vw, 92px)",
                      }}
                    >
                      {entry.startYear} — {entry.graduationYear}
                    </span>
                  </div>
                </div>

                {/* Institution & Details Column */}
                <div className="lg:col-span-7 space-y-3.5 lg:border-l lg:border-[#F3E9DE]/18 lg:pl-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3
                        className="m-0 font-normal uppercase leading-[0.98] tracking-[-0.02em] text-[#F3E9DE]"
                        style={{
                          fontFamily: "var(--font-anton), Impact, sans-serif",
                          fontSize: "clamp(28px, 3vw, 44px)",
                        }}
                      >
                        {entry.institution}
                      </h3>
                      <p
                        className="mt-2 m-0 font-serif italic text-xl sm:text-2xl text-[#F3E9DE]/90"
                        style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                      >
                        {entry.degree}
                      </p>
                      <p className="mt-1 m-0 font-mono text-xs uppercase tracking-[0.14em] text-[#F3E9DE]/68">
                        {entry.specialization}
                      </p>
                    </div>

                    <div className="flex h-14 w-24 shrink-0 items-center justify-center border border-[#F3E9DE]/28 bg-[#F3E9DE]/[0.05] px-2 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-[#F3E9DE]/75">
                      INSTITUTION LOGO
                    </div>
                  </div>

                  <p className="m-0 max-w-[54ch] text-base leading-relaxed text-[#F3E9DE]/82">
                    {entry.description}
                  </p>

                  {entry.achievements.length > 0 && (
                    <ul className="m-0 list-none space-y-1.5 border-t border-[#F3E9DE]/15 pt-4 p-0 font-mono text-xs text-[#F3E9DE]/72">
                      {entry.achievements.map((item, i) => (
                        <li key={i}>— {item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
