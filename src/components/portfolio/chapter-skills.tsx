"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { SKILL_CATEGORIES, SKILLS_CONTENT } from "@/data/portfolio-content";
import { ChapterHeading } from "@/components/portfolio/editorial-primitives";

gsap.registerPlugin(ScrollTrigger);

/**
 * CHAPTER 04 — SKILLS & TECHNOLOGY (Burgundy #792B33 / Ivory #F3E9DE)
 *
 * Typography-driven interactive technical landscape:
 * - All 7 categories appear as oversized condensed Anton typography.
 * - Hovering or selecting a category brings it to full Ivory focal prominence
 *   while sibling categories recede cleanly, revealing its structured toolset.
 * - Ends with a single fine line emerging from the Burgundy composition and
 *   bending into the airplane flight path introducing Chapter 05 (Ivory).
 */
export function ChapterSkills() {
  const [activeId, setActiveId] = useState<string>(SKILL_CATEGORIES[0].id);
  const flightBridgeRef = useRef<HTMLDivElement>(null);
  const bridgePathRef = useRef<SVGPathElement>(null);

  const activeCategory =
    SKILL_CATEGORIES.find((cat) => cat.id === activeId) ?? SKILL_CATEGORIES[0];

  useEffect(() => {
    const bridge = flightBridgeRef.current;
    const path = bridgePathRef.current;
    if (!bridge || !path) return;

    const length = path.getTotalLength();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = "0";
      return;
    }

    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    const ctx = gsap.context(() => {
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: bridge,
          start: "top 82%",
          end: "bottom 42%",
          scrub: true,
        },
      });
    }, flightBridgeRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      data-chapter-surface="burgundy"
      className="relative bg-[#792B33] text-[#F3E9DE] pt-16 sm:pt-24 overflow-x-clip"
    >
      <div className="page-container pb-20 sm:pb-28">
        <ChapterHeading
          id="skills-heading"
          number={SKILLS_CONTENT.chapterNumber}
          label={SKILLS_CONTENT.chapterLabel}
          heading={SKILLS_CONTENT.heading}
          supportingText={SKILLS_CONTENT.supportingText}
          surface="burgundy"
          action={
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#F3E9DE]/68">
              07 Disciplines · Hover or Select
            </span>
          }
        />

        {/* Interactive Typography Explorer */}
        <div
          data-testid="skills-explorer"
          className="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start"
        >
          {/* Left / Main: Oversized Editorial Category Index */}
          <div
            className="lg:col-span-7 border-t border-[#F3E9DE]/20"
            role="tablist"
            aria-label="Technology categories"
          >
            {SKILL_CATEGORIES.map((category) => {
              const isSelected = category.id === activeCategory.id;
              return (
                <div
                  key={category.id}
                  className="border-b border-[#F3E9DE]/20"
                >
                  <button
                    type="button"
                    role="tab"
                    id={`skill-tab-${category.id}`}
                    aria-selected={isSelected}
                    aria-controls={`skill-panel-${category.id}`}
                    onClick={() => setActiveId(category.id)}
                    onMouseEnter={() => setActiveId(category.id)}
                    onFocus={() => setActiveId(category.id)}
                    className={`group flex w-full items-baseline justify-between gap-4 py-4 sm:py-5 text-left transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? "text-[#F3E9DE] translate-x-2"
                        : "text-[#F3E9DE]/38 hover:text-[#F3E9DE]/82"
                    }`}
                  >
                    <span className="flex items-baseline gap-4 sm:gap-6 min-w-0">
                      <span className="font-mono text-xs tracking-[0.18em] tabular-nums shrink-0">
                        {category.number}
                      </span>
                      <span
                        className="font-normal uppercase leading-[0.95] tracking-[-0.02em] break-words"
                        style={{
                          fontFamily: "var(--font-anton), Impact, sans-serif",
                          fontSize: "clamp(28px, 3.8vw, 56px)",
                        }}
                      >
                        {category.title}
                      </span>
                    </span>

                    <span className="flex items-center gap-3 shrink-0 font-mono text-xs tabular-nums">
                      <span className="hidden sm:inline">
                        {String(category.tools.length).padStart(2, "0")} tools
                      </span>
                      <ArrowRight
                        size={16}
                        strokeWidth={1.6}
                        aria-hidden="true"
                        className={`transition-transform duration-300 ${
                          isSelected ? "translate-x-1 opacity-100" : "opacity-40"
                        }`}
                      />
                    </span>
                  </button>

                  {/* Mobile inline accordion reveal for touch clarity */}
                  {isSelected && (
                    <div className="lg:hidden pb-6 pl-9 pr-2 space-y-4">
                      <p className="m-0 text-sm leading-relaxed text-[#F3E9DE]/78">
                        {category.summary}
                      </p>
                      <div className="space-y-2.5 border-t border-[#F3E9DE]/18 pt-4">
                        {category.tools.map((tool, idx) => (
                          <div
                            key={tool.name}
                            className="flex items-baseline justify-between gap-4 border-b border-[#F3E9DE]/12 pb-2"
                          >
                            <span className="text-sm font-medium text-[#F3E9DE]">
                              {tool.name}
                            </span>
                            <span className="font-mono text-[11px] text-[#F3E9DE]/64 text-right">
                              0{idx + 1} · {tool.note}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right (Desktop): Sticky Focused Category Toolset Arrangement */}
          <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-28">
            <div
              role="tabpanel"
              id={`skill-panel-${activeCategory.id}`}
              aria-labelledby={`skill-tab-${activeCategory.id}`}
              data-testid="skills-active-panel"
              className="border border-[#F3E9DE]/24 bg-[#F3E9DE]/[0.05] p-8 space-y-6"
            >
              <div className="flex items-baseline justify-between border-b border-[#F3E9DE]/18 pb-4">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#F3E9DE]/68 tabular-nums">
                  Category {activeCategory.number} / 0{SKILL_CATEGORIES.length}
                </span>
                <span
                  aria-hidden="true"
                  className="text-4xl leading-none text-[#F3E9DE]/22"
                  style={{ fontFamily: "var(--font-anton), Impact, sans-serif" }}
                >
                  {activeCategory.number}
                </span>
              </div>

              <div>
                <h3
                  className="m-0 font-normal uppercase leading-[0.96] tracking-[-0.02em] text-[#F3E9DE]"
                  style={{
                    fontFamily: "var(--font-anton), Impact, sans-serif",
                    fontSize: "clamp(32px, 2.8vw, 44px)",
                  }}
                >
                  {activeCategory.title}
                </h3>
                <p className="mt-3 m-0 text-sm leading-relaxed text-[#F3E9DE]/78">
                  {activeCategory.summary}
                </p>
              </div>

              <div className="border-t border-[#F3E9DE]/18 pt-4 space-y-3">
                {activeCategory.tools.map((tool, idx) => (
                  <div
                    key={tool.name}
                    className="grid grid-cols-[28px_1fr] gap-3 border-b border-[#F3E9DE]/14 pb-3 items-baseline"
                  >
                    <span className="font-mono text-[11px] text-[#F3E9DE]/55 tabular-nums">
                      0{idx + 1}
                    </span>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[15px] font-medium text-[#F3E9DE]">
                        {tool.name}
                      </span>
                      <span className="font-mono text-[11px] text-[#F3E9DE]/64 text-right">
                        {tool.note}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-[#F3E9DE]/52">
                Editable placeholders · src/data/portfolio-content.ts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRANSITION TO CHAPTER 05 (EXPERIENCE): SINGLE FINE LINE BENDING INTO FLIGHT PATH ── */}
      <div
        ref={flightBridgeRef}
        aria-hidden="true"
        className="relative w-full overflow-hidden"
      >
        {/* Split upper burgundy / lower ivory backdrop */}
        <div className="h-[115px] sm:h-[140px] w-full bg-[#792B33]" />
        <div className="h-[115px] sm:h-[140px] w-full bg-[#F3E9DE]" />

        {/* Single architectural vector line emerging vertically from Burgundy and bending into the Experience route */}
        <svg
          viewBox="0 0 1200 280"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Upper half stroke in Ivory on Burgundy */}
          <path
            d="M 600 0 L 600 140"
            fill="none"
            stroke="#F3E9DE"
            strokeWidth="1.5"
            strokeOpacity="0.65"
          />
          {/* Lower curved departure arc in Burgundy on Ivory */}
          <path
            ref={bridgePathRef}
            d="M 600 140 C 600 218, 340 205, 115 280"
            fill="none"
            stroke="#792B33"
            strokeWidth="1.75"
            strokeDasharray="6 6"
          />
          {/* Departure horizon node */}
          <circle cx="600" cy="140" r="5" fill="#F3E9DE" stroke="#792B33" strokeWidth="2" />
        </svg>
      </div>
    </section>
  );
}
