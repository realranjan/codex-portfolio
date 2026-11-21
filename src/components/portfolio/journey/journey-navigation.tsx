"use client";

import type { RefObject } from "react";
import type { JourneyMilestone } from "@/data/experience-journey";

export interface JourneyNavigationProps {
  milestones: readonly JourneyMilestone[];
  activeIndex: number;
  selectedId: string | null;
  progressBarRef?: RefObject<HTMLDivElement | null>;
  onSelectStop: (index: number) => void;
}

/**
 * Restrained bottom-edge editorial navigation for the 2.5D Mountain Journey.
 * - Thin 1px burgundy progress hairline
 * - Direct clickable milestone buttons (iMerit, Haegl Tech, RYVO)
 */
export function JourneyNavigation({
  milestones,
  activeIndex,
  selectedId,
  progressBarRef,
  onSelectStop,
}: JourneyNavigationProps) {
  return (
    <div
      data-testid="journey-navigation"
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 pb-5 pt-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(243,233,222,0) 0%, rgba(243,233,222,0.72) 55%, rgba(243,233,222,0.95) 100%)",
      }}
    >
      <div className="page-container flex flex-wrap items-center justify-between gap-4">
        {/* Thin hairline scroll progress rule */}
        <div className="flex items-center shrink-0">
          <div
            aria-hidden="true"
            className="relative h-px w-24 sm:w-32 bg-[#792B33]/22 overflow-hidden"
          >
            <div
              ref={progressBarRef}
              style={{ transform: "scaleX(0)" }}
              className="absolute inset-0 origin-left bg-[#792B33] will-change-transform"
            />
          </div>
        </div>

        {/* Direct milestone jumps (company names only, zero numbers) */}
        <nav
          aria-label="Journey milestones"
          className="flex items-center gap-6 sm:gap-8"
        >
          {milestones.map((milestone, idx) => {
            const isCurrent = idx === activeIndex;
            const isInspected = selectedId === milestone.id;
            return (
              <button
                key={milestone.id}
                type="button"
                data-testid={`journey-nav-${milestone.id}`}
                aria-current={isCurrent ? "step" : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStop(idx);
                }}
                className={`group relative inline-flex min-h-[40px] items-center font-mono text-[11px] uppercase tracking-[0.16em] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isCurrent || isInspected
                    ? "text-[#792B33] font-medium"
                    : "text-[#792B33]/55 hover:text-[#792B33]"
                }`}
              >
                <span>{milestone.companyName}</span>
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 bottom-1.5 h-px bg-[#792B33] transition-transform duration-200 origin-left ${
                    isCurrent ? "scale-x-100" : "scale-x-0 group-hover:scale-x-75"
                  }`}
                />
              </button>
            );
          })}
        </nav>

        <div aria-hidden="true" className="hidden sm:block w-24 sm:w-32" />
      </div>
    </div>
  );
}
