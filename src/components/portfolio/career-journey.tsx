"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Plane } from "lucide-react";
import { CAREER_STOPS } from "@/data/portfolio";
import { sampleFlightPath } from "@/lib/motion";
import { AsciiScramble } from "@/components/motion/ascii-scramble";
import { MaskedLineReveal } from "@/components/motion/masked-line-reveal";

gsap.registerPlugin(ScrollTrigger);

export function CareerJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0.08);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const raf = window.requestAnimationFrame(() => setScrollProgress(1));
      return () => window.cancelAnimationFrame(raf);
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: "top 75%",
        end: "bottom 40%",
        scrub: 0.35,
        onUpdate: (self) => {
          setSelectedStopId(null);
          setScrollProgress(Math.max(0.08, self.progress));
        },
      });
    }, track);

    return () => ctx.revert();
  }, []);

  const effectiveProgress = useMemo(() => {
    if (selectedStopId) {
      const target = CAREER_STOPS.find((s) => s.id === selectedStopId);
      if (target) return target.waypoint.stop;
    }
    return scrollProgress;
  }, [selectedStopId, scrollProgress]);

  const corridorWaypoints = useMemo(
    () =>
      CAREER_STOPS.map((stop, idx) => ({
        id: stop.id,
        stop: stop.waypoint.stop,
        x: idx % 2 === 0 ? 485 : 515,
        y: 125 + idx * 250,
      })),
    []
  );

  const flight = useMemo(
    () => sampleFlightPath(corridorWaypoints, effectiveProgress),
    [corridorWaypoints, effectiveProgress]
  );

  // Build continuous SVG polyline path down the open center corridor (viewBox 0 0 1000 1000)
  const routePathD = useMemo(() => {
    return corridorWaypoints
      .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
      .join(" ");
  }, [corridorWaypoints]);

  // Build exact active path up to the current airplane coordinate (avoids SVG vectorEffect + pathLength dash bugs)
  const activeRoutePathD = useMemo(() => {
    const passed = corridorWaypoints.filter((pt) => pt.stop <= effectiveProgress + 1e-4);
    const segments = passed.map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`);
    if (segments.length === 0 && corridorWaypoints.length > 0) {
      segments.push(`M ${corridorWaypoints[0].x} ${corridorWaypoints[0].y}`);
    }
    segments.push(`L ${flight.x.toFixed(2)} ${flight.y.toFixed(2)}`);
    return segments.join(" ");
  }, [corridorWaypoints, effectiveProgress, flight.x, flight.y]);

  return (
    <section
      ref={sectionRef}
      id="experience"
      aria-labelledby="experience-heading"
      className="section-band section-band--elevated"
    >
      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-14 lg:mb-20 items-end">
          <div className="lg:col-span-2">
            <AsciiScramble text="04 / EXPERIENCE" className="type-tech-label" />
          </div>
          <div className="lg:col-span-7">
            <MaskedLineReveal
              as="h2"
              id="experience-heading"
              className="type-h2 text-[#F3EEF8]"
              lines={[
                "Flight path across",
                <>
                  production <em className="type-serif-accent font-medium">systems.</em>
                </>,
              ]}
            />
          </div>
          <div className="lg:col-span-3 flex flex-col gap-3">
            <p className="text-sm text-[#ADA4B8] leading-relaxed">
              Scroll or select any waypoint to trace engineering roles from data ingestion to
              frontier AI architecture.
            </p>
            <div className="flex items-center gap-2" role="group" aria-label="Career waypoints">
              {CAREER_STOPS.map((stop) => {
                const isActive = flight.activeWaypointId === stop.id;
                return (
                  <button
                    key={stop.id}
                    type="button"
                    onClick={() => setSelectedStopId(stop.id)}
                    className={`px-2.5 py-1.5 rounded-[8px] font-mono text-xs tracking-[0.08em] uppercase transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? "bg-[#BCA5D4] text-[#0D0B12] font-medium"
                        : "border border-[#393143] bg-[#17131F] text-[#ADA4B8] hover:border-[#BCA5D4] hover:text-[#F3EEF8]"
                    }`}
                    aria-pressed={isActive}
                  >
                    {stop.code}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Flight Path & Company Panels */}
        <div ref={trackRef} className="relative" data-testid="career-journey-track">
          {/* Desktop Spatial Vector Route in Open Center Corridor */}
          <div
            className="hidden lg:block pointer-events-none absolute inset-0 z-20 overflow-hidden"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              {/* Subtle reference flight path */}
              <path
                d={routePathD}
                fill="none"
                stroke="#393143"
                strokeWidth="1.5"
                strokeDasharray="5 7"
                vectorEffect="non-scaling-stroke"
              />
              {/* Active progress trace */}
              <path
                d={activeRoutePathD}
                fill="none"
                stroke="#BCA5D4"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {/* Waypoint markers & horizontal leader ticks */}
              {corridorWaypoints.map((pt, idx) => {
                const reached = flight.reachedIds.includes(pt.id);
                const tickEndX = idx % 2 === 0 ? 418 : 582;
                return (
                  <g key={pt.id}>
                    <line
                      x1={pt.x}
                      y1={pt.y}
                      x2={tickEndX}
                      y2={pt.y}
                      stroke={reached ? "#BCA5D4" : "#393143"}
                      strokeWidth="1"
                      strokeDasharray="3 4"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={reached ? 6 : 4}
                      fill={reached ? "#BCA5D4" : "#0D0B12"}
                      stroke="#BCA5D4"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Animated Airplane Marker positioned along open route */}
            <div
              className="absolute text-[#F3EEF8] transition-all duration-150"
              style={{
                left: `${(flight.x / 1000) * 100}%`,
                top: `${(flight.y / 1000) * 100}%`,
                transform: `translate(-50%, -50%) rotate(${flight.angleDeg + 45}deg)`,
              }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#BCA5D4] bg-[#0D0B12]">
                <Plane size={15} strokeWidth={1.6} className="text-[#D2BCE8]" />
              </div>
            </div>
          </div>

          {/* Mobile / Tablet Vertical Flight Line */}
          <div
            className="lg:hidden absolute left-[15px] top-4 bottom-4 w-[1px] bg-[#393143]"
            aria-hidden="true"
          >
            <div
              className="w-full bg-[#BCA5D4] transition-all duration-200"
              style={{ height: `${Math.round(effectiveProgress * 100)}%` }}
            />
          </div>

          {/* Company Panels */}
          <ol className="relative z-10 grid grid-cols-1 gap-10 lg:gap-12 list-none p-0 m-0">
            {CAREER_STOPS.map((stop, idx) => {
              const reached = flight.reachedIds.includes(stop.id);
              const isActive = flight.activeWaypointId === stop.id;
              const isRightAligned = idx % 2 === 1;

              return (
                <li
                  key={stop.id}
                  className="relative pl-10 lg:pl-0 lg:grid lg:grid-cols-12 lg:items-center"
                >
                  {/* Mobile node marker */}
                  <span
                    aria-hidden="true"
                    className={`lg:hidden absolute left-[10px] top-6 h-3 w-3 rounded-full border border-[#BCA5D4] transition-colors duration-300 ${
                      reached ? "bg-[#BCA5D4]" : "bg-[#0D0B12]"
                    }`}
                  />

                  <article
                    className={`lg:col-span-5 rounded-[16px] border p-6 sm:p-8 transition-all duration-500 ${
                      isRightAligned ? "lg:col-start-8" : "lg:col-start-1"
                    } ${
                      isActive
                        ? "border-[#BCA5D4]/75 bg-[#17131F]"
                        : reached
                          ? "border-[#393143] bg-[#17131F]/85"
                          : "border-[#393143]/70 bg-[#0D0B12]/95 opacity-75"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#393143]/80 pb-4">
                      <div className="flex items-center gap-2.5 type-tech-label">
                        <span className="text-[#BCA5D4] font-medium">{stop.code}</span>
                        <span aria-hidden="true">·</span>
                        <span>{stop.city}</span>
                        <span aria-hidden="true">·</span>
                        <span>{stop.coordinates}</span>
                      </div>
                      <span className="font-mono text-xs text-[#766C83] tabular-nums">
                        {stop.period}
                      </span>
                    </div>

                    <div className="mt-5">
                      <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.025em] text-[#F3EEF8]">
                        {stop.company}
                      </h3>
                      <p className="mt-1 font-serif italic text-lg text-[#BCA5D4]">{stop.role}</p>
                      <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#ADA4B8] prose-measure">
                        {stop.summary}
                      </p>
                    </div>

                    <ul className="mt-5 space-y-2 border-t border-[#393143]/60 pt-4 list-none p-0 m-0">
                      {stop.highlights.map((item, hIdx) => (
                        <li
                          key={hIdx}
                          className="grid grid-cols-[18px_1fr] gap-2 text-sm text-[#ADA4B8]"
                        >
                          <span className="font-mono text-xs text-[#766C83] pt-0.5">—</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
