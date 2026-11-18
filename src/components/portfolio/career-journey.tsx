"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CAREER_STOPS } from "@/data/portfolio";
import { sampleFlightPath } from "@/lib/motion";
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

  const railWaypoints = useMemo(
    () =>
      CAREER_STOPS.map((stop, idx) => ({
        id: stop.id,
        stop: stop.waypoint.stop,
        x: 50,
        y: 110 + idx * 260,
      })),
    []
  );

  const flight = useMemo(
    () => sampleFlightPath(railWaypoints, effectiveProgress),
    [railWaypoints, effectiveProgress]
  );

  const routePathD = useMemo(
    () => railWaypoints.map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" "),
    [railWaypoints]
  );

  const activeRoutePathD = useMemo(() => {
    const passed = railWaypoints.filter((pt) => pt.stop <= effectiveProgress + 1e-4);
    const segments = passed.map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`);
    if (segments.length === 0 && railWaypoints.length > 0) {
      segments.push(`M ${railWaypoints[0].x} ${railWaypoints[0].y}`);
    }
    segments.push(`L ${flight.x.toFixed(2)} ${flight.y.toFixed(2)}`);
    return segments.join(" ");
  }, [railWaypoints, effectiveProgress, flight.x, flight.y]);

  return (
    <section
      ref={sectionRef}
      id="experience"
      aria-labelledby="experience-heading"
      className="section-band section-band--elevated"
    >
      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-14 items-end">
          <div className="lg:col-span-2">
            <span className="type-tech-label">03. Experience</span>
          </div>
          <div className="lg:col-span-7">
            <MaskedLineReveal
              as="h2"
              id="experience-heading"
              className="type-h2 text-[#F4F1EA]"
              lines={[
                "Six years across",
                <>
                  production <em className="type-serif-accent font-medium">systems.</em>
                </>,
              ]}
            />
          </div>
          <div className="lg:col-span-3 flex flex-col gap-3">
            <p className="text-sm text-[#A19D97] leading-relaxed">
              Select a milestone or scroll to trace roles from data pipelines to inference routing.
            </p>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Career milestones">
              {CAREER_STOPS.map((stop) => {
                const isActive = flight.activeWaypointId === stop.id;
                return (
                  <button
                    key={stop.id}
                    type="button"
                    onClick={() => setSelectedStopId(stop.id)}
                    className={`px-2.5 py-1.5 rounded-[4px] font-mono text-xs tabular-nums transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? "bg-[#C4B0DC] text-[#0A0A0C] font-medium"
                        : "border border-white/[0.1] bg-[#121216] text-[#A19D97] hover:border-[#C4B0DC] hover:text-[#F4F1EA]"
                    }`}
                    aria-pressed={isActive}
                  >
                    {stop.period.slice(0, 4)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Clean Unboxed Architectural Chronology with Continuous Scroll Rule */}
        <div ref={trackRef} className="relative" data-testid="career-journey-track">
          {/* Desktop Scroll Rail in Left Gutter (lg:col-start-2) */}
          <div
            className="hidden lg:block pointer-events-none absolute top-0 bottom-0 left-[calc(16.666%-16px)] w-8"
            aria-hidden="true"
          >
            <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="h-full w-full">
              <path
                d={routePathD}
                fill="none"
                stroke="rgba(244,241,234,0.12)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={activeRoutePathD}
                fill="none"
                stroke="#C4B0DC"
                strokeWidth="1.75"
                vectorEffect="non-scaling-stroke"
              />
              {railWaypoints.map((pt) => {
                const reached = flight.reachedIds.includes(pt.id);
                return (
                  <circle
                    key={pt.id}
                    cx={pt.x}
                    cy={pt.y}
                    r={reached ? 4.5 : 3}
                    fill={reached ? "#C4B0DC" : "#0A0A0C"}
                    stroke="#C4B0DC"
                    strokeWidth="1.2"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>
          </div>

          <ol className="relative lg:ml-[16.666%] lg:pl-8 border-t border-white/[0.1] list-none p-0 m-0">
            {CAREER_STOPS.map((stop) => {
              const isActive = flight.activeWaypointId === stop.id;
              return (
                <li
                  key={stop.id}
                  className="border-b border-white/[0.1] py-8 sm:py-10 transition-opacity duration-300"
                  style={{ opacity: isActive ? 1 : 0.78 }}
                >
                  <article className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
                    <div className="lg:col-span-4 space-y-1.5">
                      <div className="font-mono text-xs text-[#C4B0DC] tabular-nums">
                        {stop.period}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.025em] text-[#F4F1EA]">
                        {stop.company}
                      </h3>
                      <p className="font-serif italic text-lg text-[#C4B0DC]">{stop.role}</p>
                      <p className="font-mono text-xs text-[#6C6863]">{stop.city}</p>
                    </div>

                    <div className="lg:col-span-8 space-y-4">
                      <p className="text-base leading-relaxed text-[#A19D97] prose-measure">
                        {stop.summary}
                      </p>
                      <ul className="space-y-2 list-none p-0 m-0">
                        {stop.highlights.map((item, hIdx) => (
                          <li
                            key={hIdx}
                            className="grid grid-cols-[18px_1fr] gap-2 text-sm text-[#A19D97]"
                          >
                            <span className="font-mono text-xs text-[#6C6863] pt-0.5">—</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
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
