"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  EXPERIENCE_CONTENT,
  EXPERIENCE_STOPS,
  type ExperienceStop,
} from "@/data/portfolio-content";
import { buildCurvedFlightSvgPath } from "@/lib/journey-path";
import { computeExperienceCameraState } from "@/lib/camera-system";
import { wrapIndex } from "@/lib/carousel";
import {
  CameraProgressRule,
  useIsDesktop,
  usePrefersReducedMotion,
} from "@/components/portfolio/camera-primitives";
import {
  ChapterHeading,
  PlaceholderVisual,
} from "@/components/portfolio/editorial-primitives";

gsap.registerPlugin(ScrollTrigger);

/**
 * CHAPTER 05 — EXPERIENCE & JOURNEY (Ivory #F3E9DE / Burgundy #792B33)
 *
 * Camera-follows-the-journey curved SVG route:
 * - Desktop (>= 1024px, normal motion): Scroll drives a lightweight SVG airplane along
 *   a smooth curved Catmull-Rom path across 4 editable company milestones. The visible
 *   route composition pans modestly sideways and gently diagonally to follow the airplane,
 *   while the minimal cartographic grid layer glides on a slower background parallax plane.
 * - At each milestone, waypoint dwell settles both airplane and camera while the stable
 *   HTML company details panel stays stationary and crisp to read.
 * - Direct milestone navigation (01..04 tabs, Prev/Next, or clicking any SVG node) works
 *   cleanly in both directions.
 * - Reduced Motion: Accessible static vertical timeline with all 4 milestones readable.
 * - Mobile (< 1024px): Simplified touch-friendly route strip without scroll traps.
 */
export function ChapterExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const desktopStageRef = useRef<HTMLDivElement>(null);
  const bgGridGroupRef = useRef<SVGGElement>(null);
  const routeCameraGroupRef = useRef<SVGGElement>(null);
  const planeGroupRef = useRef<SVGGElement>(null);
  const trailPathRef = useRef<SVGPathElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [mediaSlideByStop, setMediaSlideByStop] = useState<Record<string, number>>({});
  const [reachedSet, setReachedSet] = useState<string[]>([EXPERIENCE_STOPS[0].id]);
  const reducedMotion = usePrefersReducedMotion();
  const isDesktop = useIsDesktop(1024);
  const showPinnedDesktop = isDesktop && !reducedMotion;

  const waypoints = useMemo(
    () => EXPERIENCE_STOPS.map((stop) => stop.waypoint),
    []
  );
  const routePathD = useMemo(() => buildCurvedFlightSvgPath(waypoints, 84), [waypoints]);

  const applyCameraSample = useCallback(
    (progress: number) => {
      const camera = computeExperienceCameraState(waypoints, progress);
      const { flight } = camera;

      if (desktopStageRef.current) {
        desktopStageRef.current.dataset.cameraPanX = camera.cameraPanX.toFixed(1);
        desktopStageRef.current.dataset.cameraPanY = camera.cameraPanY.toFixed(1);
        desktopStageRef.current.dataset.activeStop = String(flight.activeIndex + 1);
      }

      // Slower background architectural coordinate grid parallax (zero scenery clutter)
      if (bgGridGroupRef.current) {
        bgGridGroupRef.current.setAttribute(
          "transform",
          `translate(${camera.bgParallaxX.toFixed(1)}, ${camera.bgParallaxY.toFixed(1)})`
        );
      }

      // Route composition pans sideways and gently diagonally to follow the airplane
      if (routeCameraGroupRef.current) {
        routeCameraGroupRef.current.setAttribute(
          "transform",
          `translate(${camera.cameraPanX.toFixed(1)}, ${camera.cameraPanY.toFixed(1)})`
        );
      }

      if (planeGroupRef.current) {
        planeGroupRef.current.setAttribute(
          "transform",
          `translate(${flight.x.toFixed(1)}, ${flight.y.toFixed(1)}) rotate(${flight.angleDeg.toFixed(1)})`
        );
      }

      if (trailPathRef.current) {
        const len = trailPathRef.current.getTotalLength();
        trailPathRef.current.style.strokeDasharray = `${len}`;
        trailPathRef.current.style.strokeDashoffset = `${(len * (1 - flight.easedProgress)).toFixed(1)}`;
      }

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${flight.rawProgress.toFixed(4)})`;
      }

      setActiveIndex((prev) => (prev === flight.activeIndex ? prev : flight.activeIndex));
      setReachedSet((prev) =>
        prev.length === flight.reachedIds.length ? prev : flight.reachedIds
      );
    },
    [waypoints]
  );

  useIsomorphicLayoutEffect(() => {
    const stageEl = desktopStageRef.current;
    if (!stageEl || !showPinnedDesktop) return;

    applyCameraSample(0);

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: stageEl,
        start: "top top",
        end: "+=165%",
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          applyCameraSample(self.progress);
        },
      });
      triggerRef.current = st;
    }, sectionRef);

    return () => {
      triggerRef.current = null;
      ctx.revert();
    };
  }, [applyCameraSample, showPinnedDesktop]);

  const handleSelectStop = useCallback(
    (idx: number) => {
      const targetIdx = wrapIndex(idx, EXPERIENCE_STOPS.length);
      const targetStop = EXPERIENCE_STOPS[targetIdx];
      if (!targetStop) return;

      const st = triggerRef.current;
      if (st && window.matchMedia("(min-width: 1024px)").matches && !reducedMotion) {
        const targetScroll = st.start + (st.end - st.start) * targetStop.waypoint.stop;
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
      applyCameraSample(targetStop.waypoint.stop);
      setActiveIndex(targetIdx);
    },
    [applyCameraSample, reducedMotion]
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
      className="relative bg-[#F3E9DE] text-[#792B33] overflow-x-clip"
    >
      <div className={showPinnedDesktop ? "block" : "hidden"}>
        <div
          ref={desktopStageRef}
          data-testid={showPinnedDesktop ? "experience-airplane-stage" : undefined}
          data-camera-pan-x="0"
          data-camera-pan-y="0"
          data-active-stop="1"
          className={
            showPinnedDesktop
              ? "flex h-[100svh] min-h-[680px] w-full flex-col justify-between bg-[#F3E9DE] pt-[76px] pb-4"
              : ""
          }
        >
          {showPinnedDesktop && (
            <>
          {/* Compact Integrated Editorial Header + Direct Milestone Navigator */}
          <div className="page-container space-y-3 border-b border-[#792B33]/18 pb-3">
            <div className="flex items-end justify-between gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#792B33]/68 tabular-nums">
                  <span>Chapter {EXPERIENCE_CONTENT.chapterNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span>{EXPERIENCE_CONTENT.chapterLabel}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-5">
                  <h2
                    id="experience-heading"
                    className="m-0 font-normal uppercase leading-[0.9] tracking-[-0.03em] text-[#792B33]"
                    style={{
                      fontFamily: "var(--font-anton), Impact, sans-serif",
                      fontSize: "clamp(32px, 3.4vw, 48px)",
                    }}
                  >
                    {EXPERIENCE_CONTENT.heading}
                  </h2>
                  <p className="m-0 hidden xl:block text-sm text-[#792B33]/72 max-w-[42ch] truncate">
                    {EXPERIENCE_CONTENT.supportingText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <CameraProgressRule
                  barRef={progressBarRef}
                  surface="ivory"
                  className="w-28 xl:w-36"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectStop(activeIndex - 1)}
                    aria-label="Previous company stop"
                    className="inline-flex h-9 w-9 items-center justify-center border border-[#792B33]/28 text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectStop(activeIndex + 1)}
                    aria-label="Next company stop"
                    className="inline-flex h-9 w-9 items-center justify-center border border-[#792B33]/28 text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

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
                    className={`inline-flex h-8 items-center gap-2 px-3 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors cursor-pointer ${
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
          </div>

          {/* Center split: Camera-Tracked Curved SVG Route (7 cols) + Stationary HTML Details Panel (5 cols) */}
          <div className="page-container my-auto grid grid-cols-12 gap-6 items-center py-2">
            {/* Left: Camera Viewport tracking the airplane sideways & slightly diagonally */}
            <div className="col-span-7 relative overflow-hidden border border-[#792B33]/20 bg-[#F3E9DE] p-4">
              <svg
                viewBox="0 0 1200 600"
                className="block h-auto w-full overflow-hidden"
                role="img"
                aria-label={`Flight route currently at ${activeStop.companyName}`}
              >
                {/* Layer 1: Slower background architectural cartographic grid (subtle parallax, zero scenery) */}
                <g
                  ref={bgGridGroupRef}
                  stroke="#792B33"
                  strokeOpacity="0.09"
                  strokeWidth="1"
                >
                  <line x1="-180" y1="120" x2="1380" y2="120" />
                  <line x1="-180" y1="240" x2="1380" y2="240" />
                  <line x1="-180" y1="360" x2="1380" y2="360" />
                  <line x1="-180" y1="480" x2="1380" y2="480" />
                  <line x1="120" y1="-80" x2="120" y2="680" />
                  <line x1="360" y1="-80" x2="360" y2="680" />
                  <line x1="600" y1="-80" x2="600" y2="680" />
                  <line x1="840" y1="-80" x2="840" y2="680" />
                  <line x1="1080" y1="-80" x2="1080" y2="680" />
                  {/* Subtle crosshairs at coordinate intersections */}
                  <g strokeOpacity="0.18">
                    <path d="M 355 240 L 365 240 M 360 235 L 360 245" />
                    <path d="M 595 360 L 605 360 M 600 355 L 600 365" />
                    <path d="M 835 240 L 845 240 M 840 235 L 840 245" />
                  </g>
                </g>

                {/* Layer 2: Camera-tracked curved route, waypoints, and airplane */}
                <g ref={routeCameraGroupRef} data-testid="experience-camera-route-group">
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

                  {/* Numbered Waypoints + Company Labels */}
                  {EXPERIENCE_STOPS.map((stop, idx) => {
                    const isActive = idx === activeIndex;
                    const isReached = reachedSet.includes(stop.id);
                    const labelAbove = idx % 2 === 1;
                    const labelY = labelAbove ? stop.waypoint.y - 38 : stop.waypoint.y + 44;

                    const labelAnchor =
                      idx === 0
                        ? "start"
                        : idx === EXPERIENCE_STOPS.length - 1
                          ? "end"
                          : "middle";
                    const labelX =
                      idx === 0
                        ? stop.waypoint.x - 16
                        : idx === EXPERIENCE_STOPS.length - 1
                          ? stop.waypoint.x + 16
                          : stop.waypoint.x;

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
                          x={labelX}
                          y={labelY}
                          textAnchor={labelAnchor}
                          fill="#792B33"
                          fillOpacity={isActive ? 1 : 0.58}
                          style={{
                            fontFamily: "var(--font-anton), Impact, sans-serif",
                            fontSize: isActive ? "24px" : "18px",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {stop.number} · {stop.companyName.toUpperCase()}
                        </text>
                      </g>
                    );
                  })}

                  {/* Lightweight SVG Airplane oriented cleanly along route tangent */}
                  <g
                    ref={planeGroupRef}
                    data-testid="experience-airplane-glyph"
                    transform={`translate(${waypoints[0].x}, ${waypoints[0].y}) rotate(-32)`}
                  >
                    <path
                      d="M 24 0 L 4 -4 L -10 -20 L -16 -20 L -8 -4 L -20 -3 L -25 -10 L -29 -10 L -26 0 L -29 10 L -25 10 L -20 3 L -8 4 L -16 20 L -10 20 L 4 4 Z"
                      fill="#792B33"
                      stroke="#F3E9DE"
                      strokeWidth="1.5"
                    />
                  </g>
                </g>
              </svg>

              <div className="mt-2 flex items-center justify-between px-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#792B33]/64 tabular-nums">
                <span>
                  Milestone · {activeStop.number} / 0{EXPERIENCE_STOPS.length}
                </span>
                <span>Camera tracks route forward &amp; reverse</span>
              </div>
            </div>

            {/* Right: Stationary, Stable HTML Company Details Panel */}
            <article
              data-testid="experience-active-panel"
              className="col-span-5 border border-[#792B33]/32 bg-[#F3E9DE] p-5 space-y-3.5"
            >
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
            </>
          )}
        </div>
      </div>

      {!showPinnedDesktop && (reducedMotion ? (
        <div
          data-testid="experience-accessible-timeline"
          className="page-container pt-10 pb-12 space-y-8"
        >
          <ChapterHeading
            id="experience-heading"
            number={EXPERIENCE_CONTENT.chapterNumber}
            label={EXPERIENCE_CONTENT.chapterLabel}
            heading={EXPERIENCE_CONTENT.heading}
            supportingText={EXPERIENCE_CONTENT.supportingText}
            surface="ivory"
            action={
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/72">
                Accessible Timeline
              </span>
            }
          />
          <ol className="m-0 list-none border-l border-[#792B33]/30 pl-6 sm:pl-8 space-y-8 p-0">
            {EXPERIENCE_STOPS.map((stop) => (
              <li key={stop.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[31px] sm:-left-[39px] top-1.5 h-3 w-3 rounded-full bg-[#792B33]"
                />
                <article className="border border-[#792B33]/26 bg-[#F3E9DE] p-5 space-y-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/68 tabular-nums">
                      Stop {stop.number} · {stop.dates}
                    </span>
                    <span className="font-mono text-xs text-[#792B33]/65">
                      {stop.location}
                    </span>
                  </div>
                  <h3
                    className="m-0 text-3xl uppercase leading-none text-[#792B33]"
                    style={{ fontFamily: "var(--font-anton), Impact, sans-serif" }}
                  >
                    {stop.companyName}
                  </h3>
                  <p className="m-0 text-sm font-medium text-[#792B33]/85">
                    {stop.roleTitle}
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-[#792B33]/85 max-w-[65ch]">
                    {stop.overview}
                  </p>
                  <ul className="m-0 list-none space-y-1.5 border-t border-[#792B33]/16 pt-3 p-0 text-sm text-[#792B33]/84">
                    {stop.responsibilities.map((r, i) => (
                      <li key={i}>— {r}</li>
                    ))}
                  </ul>
                  <p className="m-0 font-mono text-xs text-[#792B33]/68">
                    {stop.technologies.join(" · ")}
                  </p>
                </article>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div
          data-testid="experience-mobile-journey"
          className="page-container pt-10 pb-10 space-y-5"
        >
          <ChapterHeading
            id="experience-heading"
            number={EXPERIENCE_CONTENT.chapterNumber}
            label={EXPERIENCE_CONTENT.chapterLabel}
            heading={EXPERIENCE_CONTENT.heading}
            supportingText={EXPERIENCE_CONTENT.supportingText}
            surface="ivory"
          />
          <div className="border border-[#792B33]/22 p-4 space-y-3">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-[#792B33]/72">
              <span>
                Flight Stop {activeStop.number} / 0{EXPERIENCE_STOPS.length}
              </span>
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
      ))}

      {/* ── TRANSITION TO CHAPTER 06 (EDUCATION): ROUTE STRAIGHTENS INTO TYPOGRAPHIC LINE ── */}
      <div aria-hidden="true" className="relative w-full">
        <div className="flex flex-col items-center bg-[#F3E9DE] pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#792B33]/65">
            Route Settling · Roots
          </span>
          <div className="mt-2 h-8 w-px bg-[#792B33]/60" />
        </div>
        <div className="flex flex-col items-center bg-[#792B33] pb-2">
          <div className="h-7 w-px bg-[#F3E9DE]/55" />
          <span className="mt-1.5 h-1.5 w-1.5 rotate-45 border border-[#F3E9DE]" />
        </div>
      </div>
    </section>
  );
}
