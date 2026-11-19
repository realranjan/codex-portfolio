"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  EXPERIENCE_CONTENT,
  EXPERIENCE_STOPS,
  type ExperienceStop,
} from "@/data/portfolio-content";
import {
  buildCurvedFlightSvgPath,
  sampleCurvedFlightPath,
} from "@/lib/journey-path";
import { wrapIndex } from "@/lib/carousel";
import {
  ChapterHeading,
  PlaceholderVisual,
} from "@/components/portfolio/editorial-primitives";

gsap.registerPlugin(ScrollTrigger);

/**
 * CHAPTER 05 — EXPERIENCE & JOURNEY (Ivory #F3E9DE / Burgundy #792B33)
 *
 * Signature cinematic airplane journey:
 * - Desktop: Scroll-controlled stylized airplane travelling along a smooth curved
 *   Catmull-Rom SVG route with true tangent rotation, parallax minimal landscape
 *   silhouettes, numbered waypoints (01..04), waypoint dwell easing, and an editorial
 *   company stop panel (with optional internal media carousel).
 * - Manual milestone navigation (01..04 + Prev/Next) works seamlessly both by jumping
 *   the pinned scroll position on desktop and direct selection on mobile.
 * - Mobile: Preserves the plane & route motif in a clean, touch-friendly journey.
 * - Ends as the curved route straightens into a crisp typographic line feeding
 *   directly into Chapter 06 (Education · Burgundy).
 */
export function ChapterExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const desktopStageRef = useRef<HTMLDivElement>(null);
  const planeGroupRef = useRef<SVGGElement>(null);
  const trailPathRef = useRef<SVGPathElement>(null);
  const parallaxFarRef = useRef<SVGGElement>(null);
  const parallaxNearRef = useRef<SVGGElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [mediaSlideByStop, setMediaSlideByStop] = useState<Record<string, number>>({});
  const [reachedSet, setReachedSet] = useState<string[]>([EXPERIENCE_STOPS[0].id]);

  const waypoints = useMemo(
    () => EXPERIENCE_STOPS.map((stop) => stop.waypoint),
    []
  );
  const routePathD = useMemo(() => buildCurvedFlightSvgPath(waypoints, 84), [waypoints]);

  const applyPlaneSample = useCallback(
    (progress: number) => {
      const sample = sampleCurvedFlightPath(waypoints, progress);

      if (planeGroupRef.current) {
        planeGroupRef.current.setAttribute(
          "transform",
          `translate(${sample.x.toFixed(1)}, ${sample.y.toFixed(1)}) rotate(${sample.angleDeg.toFixed(1)})`
        );
      }

      if (trailPathRef.current) {
        const len = trailPathRef.current.getTotalLength();
        trailPathRef.current.style.strokeDasharray = `${len}`;
        trailPathRef.current.style.strokeDashoffset = `${(len * (1 - sample.easedProgress)).toFixed(1)}`;
      }

      if (parallaxFarRef.current) {
        parallaxFarRef.current.setAttribute(
          "transform",
          `translate(${(-sample.easedProgress * 46).toFixed(1)}, 0)`
        );
      }
      if (parallaxNearRef.current) {
        parallaxNearRef.current.setAttribute(
          "transform",
          `translate(${(-sample.easedProgress * 92).toFixed(1)}, 0)`
        );
      }

      setActiveIndex((prev) => (prev === sample.activeIndex ? prev : sample.activeIndex));
      setReachedSet((prev) =>
        prev.length === sample.reachedIds.length ? prev : sample.reachedIds
      );
    },
    [waypoints]
  );

  useEffect(() => {
    const stageEl = desktopStageRef.current;
    if (!stageEl) return;

    applyPlaneSample(0);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (reduced || !isDesktop) return;

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: stageEl,
        start: "top top",
        end: "+=235%",
        pin: true,
        scrub: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          applyPlaneSample(self.progress);
        },
      });
      triggerRef.current = st;
    }, sectionRef);

    return () => {
      triggerRef.current = null;
      ctx.revert();
    };
  }, [applyPlaneSample]);

  const handleSelectStop = useCallback(
    (idx: number) => {
      const targetIdx = wrapIndex(idx, EXPERIENCE_STOPS.length);
      const targetStop = EXPERIENCE_STOPS[targetIdx];
      if (!targetStop) return;

      const st = triggerRef.current;
      if (st && window.matchMedia("(min-width: 1024px)").matches) {
        const targetScroll = st.start + (st.end - st.start) * targetStop.waypoint.stop;
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
      applyPlaneSample(targetStop.waypoint.stop);
      setActiveIndex(targetIdx);
    },
    [applyPlaneSample]
  );

  const activeStop: ExperienceStop = EXPERIENCE_STOPS[activeIndex] ?? EXPERIENCE_STOPS[0];
  const currentMediaIdx = mediaSlideByStop[activeStop.id] ?? 0;
  const activeMedia = activeStop.media[currentMediaIdx] ?? activeStop.media[0];

  const stepStopMedia = (stop: ExperienceStop, delta: number) => {
    setMediaSlideByStop((prev) => {
      const cur = prev[stop.id] ?? 0;
      return {
        ...prev,
        [stop.id]: wrapIndex(cur + delta, stop.media.length),
      };
    });
  };

  return (
    <section
      ref={sectionRef}
      id="experience"
      aria-labelledby="experience-heading"
      data-chapter-surface="ivory"
      className="relative bg-[#F3E9DE] text-[#792B33] pt-24 sm:pt-28 overflow-x-clip"
    >
      {/* Chapter Header */}
      <div className="page-container pb-10 sm:pb-14">
        <ChapterHeading
          id="experience-heading"
          number={EXPERIENCE_CONTENT.chapterNumber}
          label={EXPERIENCE_CONTENT.chapterLabel}
          heading={EXPERIENCE_CONTENT.heading}
          supportingText={EXPERIENCE_CONTENT.supportingText}
          surface="ivory"
          action={
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/72">
              Scroll Route or Jump to Any Stop
            </span>
          }
        />
      </div>

      {/* ── DESKTOP CINEMATIC PINNED AIRPLANE JOURNEY STAGE ── */}
      <div
        ref={desktopStageRef}
        data-testid="experience-airplane-stage"
        className="hidden lg:flex min-h-[100svh] w-full flex-col justify-between bg-[#F3E9DE] pt-20 pb-8"
      >
        {/* Top manual milestone navigator */}
        <div className="page-container flex items-center justify-between gap-4 border-b border-[#792B33]/18 pb-4">
          <div className="flex items-center gap-2" role="tablist" aria-label="Experience milestones">
            {EXPERIENCE_STOPS.map((stop, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <button
                  key={stop.id}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  onClick={() => handleSelectStop(idx)}
                  className={`inline-flex h-10 items-center gap-2 px-3.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-[#792B33] text-[#F3E9DE]"
                      : "border border-[#792B33]/25 text-[#792B33] hover:border-[#792B33]"
                  }`}
                >
                  <span className="tabular-nums">{stop.number}</span>
                  <span className="hidden xl:inline">{stop.companyName}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectStop(activeIndex - 1)}
              aria-label="Previous company stop"
              className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/28 text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleSelectStop(activeIndex + 1)}
              aria-label="Next company stop"
              className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/28 text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Center split: Minimalist Curved Flight Map (7 cols) + Active Editorial Company Panel (5 cols) */}
        <div className="page-container my-auto grid grid-cols-12 gap-8 items-center py-4">
          {/* Left: Curved SVG Flight Path & Minimalist Landscape Silhouettes */}
          <div className="col-span-7 relative overflow-hidden border border-[#792B33]/20 bg-[#F3E9DE] p-4">
            <svg
              viewBox="0 0 1200 600"
              className="block h-auto w-full overflow-hidden"
              role="img"
              aria-label={`Flight route currently at ${activeStop.companyName}`}
            >
              {/* Minimalist cartographic coordinate grid */}
              <g stroke="#792B33" strokeOpacity="0.09" strokeWidth="1">
                <line x1="0" y1="150" x2="1200" y2="150" />
                <line x1="0" y1="300" x2="1200" y2="300" />
                <line x1="0" y1="450" x2="1200" y2="450" />
                <line x1="300" y1="0" x2="300" y2="600" />
                <line x1="600" y1="0" x2="600" y2="600" />
                <line x1="900" y1="0" x2="900" y2="600" />
              </g>

              {/* Distant minimalist parallax ridge silhouettes */}
              <g ref={parallaxFarRef}>
                <path
                  d="M-60 560 L120 430 L260 490 L440 365 L610 465 L790 340 L990 455 L1160 360 L1320 560 Z"
                  fill="#792B33"
                  fillOpacity="0.055"
                />
              </g>
              <g ref={parallaxNearRef}>
                <path
                  d="M-80 580 L160 500 L340 538 L560 455 L740 520 L940 438 L1140 512 L1340 580 Z"
                  fill="#792B33"
                  fillOpacity="0.085"
                />
              </g>

              {/* Base dashed route line */}
              <path
                d={routePathD}
                fill="none"
                stroke="#792B33"
                strokeOpacity="0.28"
                strokeWidth="2"
                strokeDasharray="7 8"
              />

              {/* Active travelled Burgundy flight trail */}
              <path
                ref={trailPathRef}
                d={routePathD}
                fill="none"
                stroke="#792B33"
                strokeWidth="2.6"
                strokeLinecap="round"
              />

              {/* Numbered Waypoints + Large Company Labels */}
              {EXPERIENCE_STOPS.map((stop, idx) => {
                const isActive = idx === activeIndex;
                const isReached = reachedSet.includes(stop.id);
                const labelAbove = idx % 2 === 1;
                const labelY = labelAbove ? stop.waypoint.y - 38 : stop.waypoint.y + 44;

                return (
                  <g
                    key={stop.id}
                    className="cursor-pointer"
                    onClick={() => handleSelectStop(idx)}
                  >
                    <circle
                      cx={stop.waypoint.x}
                      cy={stop.waypoint.y}
                      r={isActive ? 14 : 8}
                      fill={isActive ? "#792B33" : "#F3E9DE"}
                      stroke="#792B33"
                      strokeWidth={isActive ? 2.5 : 1.75}
                      opacity={isReached || isActive ? 1 : 0.55}
                    />
                    {isActive && (
                      <circle
                        cx={stop.waypoint.x}
                        cy={stop.waypoint.y}
                        r="24"
                        fill="none"
                        stroke="#792B33"
                        strokeOpacity="0.32"
                        strokeWidth="1.2"
                      />
                    )}
                    <text
                      x={stop.waypoint.x}
                      y={labelY}
                      textAnchor="middle"
                      fill="#792B33"
                      fillOpacity={isActive ? 1 : 0.58}
                      style={{
                        fontFamily: "var(--font-anton), Impact, sans-serif",
                        fontSize: isActive ? "26px" : "20px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {stop.number} · {stop.companyName.toUpperCase()}
                    </text>
                  </g>
                );
              })}

              {/* Stylized Minimalist Burgundy Airplane (oriented cleanly along curve tangent) */}
              <g
                ref={planeGroupRef}
                data-testid="experience-airplane-glyph"
                transform={`translate(${waypoints[0].x}, ${waypoints[0].y}) rotate(-32)`}
              >
                {/* Crisp geometric silhouette pointing along +X */}
                <path
                  d="M 24 0 L 4 -4 L -10 -20 L -16 -20 L -8 -4 L -20 -3 L -25 -10 L -29 -10 L -26 0 L -29 10 L -25 10 L -20 3 L -8 4 L -16 20 L -10 20 L 4 4 Z"
                  fill="#792B33"
                  stroke="#F3E9DE"
                  strokeWidth="1.5"
                />
              </g>
            </svg>

            <div className="mt-2 flex items-center justify-between px-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#792B33]/64 tabular-nums">
              <span>Active Waypoint · {activeStop.number} / 0{EXPERIENCE_STOPS.length}</span>
              <span>Scroll forward / backward to fly route</span>
            </div>
          </div>

          {/* Right: Editorial Company Stop Panel */}
          <article
            data-testid="experience-active-panel"
            className="col-span-5 border border-[#792B33]/32 bg-[#F3E9DE] p-6 xl:p-7 space-y-5"
          >
            {/* Company Logo Placeholder + Metadata */}
            <div className="flex items-start justify-between gap-4 border-b border-[#792B33]/18 pb-4">
              <div className="min-w-0">
                <p className="m-0 font-mono text-[11px] uppercase tracking-[0.18em] text-[#792B33]/68 tabular-nums">
                  Stop {activeStop.number} · {activeStop.dates}
                </p>
                <h3
                  className="mt-1.5 m-0 font-normal uppercase leading-[0.94] tracking-[-0.02em] text-[#792B33]"
                  style={{
                    fontFamily: "var(--font-anton), Impact, sans-serif",
                    fontSize: "clamp(30px, 2.5vw, 42px)",
                  }}
                >
                  {activeStop.companyName}
                </h3>
                <p className="mt-1 m-0 text-sm font-medium text-[#792B33]/85">
                  {activeStop.roleTitle} · {activeStop.location}
                </p>
              </div>

              <div className="flex h-14 w-24 shrink-0 items-center justify-center border border-[#792B33]/28 bg-[#792B33]/[0.05] px-2 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-[#792B33]/75">
                COMPANY LOGO
              </div>
            </div>

            <p className="m-0 text-sm leading-relaxed text-[#792B33]/85">
              {activeStop.overview}
            </p>

            <div className="grid grid-cols-1 gap-3 border-t border-[#792B33]/16 pt-3 text-xs leading-relaxed text-[#792B33]/82">
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#792B33]/62 mb-1">
                  Responsibilities
                </span>
                <ul className="m-0 list-none space-y-1 p-0">
                  {activeStop.responsibilities.map((item, i) => (
                    <li key={i}>— {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#792B33]/62 mb-1">
                  Achievements
                </span>
                <ul className="m-0 list-none space-y-1 p-0">
                  {activeStop.achievements.map((item, i) => (
                    <li key={i}>— {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Optional Media / Artifact Mini-Carousel inside Stop */}
            {activeMedia && (
              <div className="border-t border-[#792B33]/16 pt-4 space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#792B33]/65">
                  <span>
                    Stop Media · 0{currentMediaIdx + 1} / 0{activeStop.media.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => stepStopMedia(activeStop, -1)}
                      aria-label={`Previous media for ${activeStop.companyName}`}
                      className="inline-flex h-7 w-7 items-center justify-center border border-[#792B33]/25 text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => stepStopMedia(activeStop, 1)}
                      aria-label={`Next media for ${activeStop.companyName}`}
                      className="inline-flex h-7 w-7 items-center justify-center border border-[#792B33]/25 text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
                <PlaceholderVisual
                  surface="ivory"
                  label={activeMedia.label}
                  sublabel={activeStop.companyName}
                  aspectClass="aspect-[16/7]"
                  imageUrl={activeMedia.imageUrl}
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-[#792B33]/16 pt-3">
              <span className="font-mono text-[11px] text-[#792B33]/68 truncate">
                {activeStop.technologies.join(" · ")}
              </span>
              {activeStop.companyUrl ? (
                <a
                  href={activeStop.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#792B33] no-underline hover:underline shrink-0"
                >
                  <span>Site</span>
                  <ArrowUpRight size={12} />
                </a>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#792B33]/52 shrink-0">
                  URL: Unconfigured
                </span>
              )}
            </div>
          </article>
        </div>
      </div>

      {/* ── MOBILE / TABLET TOUCH-FRIENDLY JOURNEY (Preserves Plane Motif Without Scroll Trap) ── */}
      <div className="lg:hidden page-container pb-16 space-y-6">
        {/* Compact plane progress indicator strip */}
        <div className="border border-[#792B33]/22 p-4 space-y-3">
          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-[#792B33]/72">
            <span>Flight Stop {activeStop.number} / 0{EXPERIENCE_STOPS.length}</span>
            <span>{activeStop.companyName}</span>
          </div>
          <div className="relative h-6 flex items-center">
            <div className="h-px w-full border-t border-dashed border-[#792B33]/40" />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300"
              style={{
                left: `${(activeIndex / Math.max(1, EXPERIENCE_STOPS.length - 1)) * 90 + 5}%`,
              }}
              aria-hidden="true"
            >
              <svg width="24" height="24" viewBox="-30 -24 60 48">
                <path
                  d="M 24 0 L 4 -4 L -10 -20 L -16 -20 L -8 -4 L -20 -3 L -25 -10 L -29 -10 L -26 0 L -29 10 L -25 10 L -20 3 L -8 4 L -16 20 L -10 20 L 4 4 Z"
                  fill="#792B33"
                />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5" role="tablist" aria-label="Select experience stop">
            {EXPERIENCE_STOPS.map((stop, idx) => (
              <button
                key={stop.id}
                type="button"
                role="tab"
                aria-selected={idx === activeIndex}
                onClick={() => handleSelectStop(idx)}
                className={`min-h-[44px] font-mono text-xs tabular-nums ${
                  idx === activeIndex
                    ? "bg-[#792B33] text-[#F3E9DE]"
                    : "border border-[#792B33]/28 text-[#792B33]"
                }`}
              >
                {stop.number}
              </button>
            ))}
          </div>
        </div>

        {/* Active Mobile Stop Card */}
        <article className="border border-[#792B33]/30 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-[#792B33]/68">
                {activeStop.dates} · {activeStop.location}
              </p>
              <h3
                className="mt-1 m-0 text-3xl uppercase leading-none text-[#792B33]"
                style={{ fontFamily: "var(--font-anton), Impact, sans-serif" }}
              >
                {activeStop.companyName}
              </h3>
              <p className="mt-1 m-0 text-sm font-medium text-[#792B33]/85">
                {activeStop.roleTitle}
              </p>
            </div>
            <div className="flex h-12 w-20 shrink-0 items-center justify-center border border-[#792B33]/28 font-mono text-[9px] uppercase text-[#792B33]/72 text-center">
              COMPANY LOGO
            </div>
          </div>

          <p className="m-0 text-sm leading-relaxed text-[#792B33]/85">
            {activeStop.overview}
          </p>

          <ul className="m-0 list-none space-y-1.5 border-t border-[#792B33]/16 pt-3 p-0 text-sm text-[#792B33]/84">
            {activeStop.responsibilities.map((r, i) => (
              <li key={i}>— {r}</li>
            ))}
          </ul>

          <p className="m-0 font-mono text-xs text-[#792B33]/68">
            {activeStop.technologies.join(" · ")}
          </p>
        </article>
      </div>

      {/* ── TRANSITION TO CHAPTER 06 (EDUCATION): ROUTE STRAIGHTENS INTO TYPOGRAPHIC LINE ── */}
      <div aria-hidden="true" className="relative w-full">
        <div className="flex flex-col items-center bg-[#F3E9DE] pt-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#792B33]/65">
            Route Settling · Roots
          </span>
          <div className="mt-4 h-20 w-px bg-[#792B33]/60" />
        </div>
        <div className="flex flex-col items-center bg-[#792B33] pb-4">
          <div className="h-16 w-px bg-[#F3E9DE]/55" />
          <span className="mt-2 h-2 w-2 rotate-45 border border-[#F3E9DE]" />
        </div>
      </div>
    </section>
  );
}
