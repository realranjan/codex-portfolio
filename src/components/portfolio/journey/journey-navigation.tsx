"use client";

import type { RefObject } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { JourneyMilestone } from "@/data/experience-journey";

export interface JourneyNavigationProps {
  milestones: readonly JourneyMilestone[];
  activeIndex: number;
  selectedId: string | null;
  progressBarRef?: RefObject<HTMLDivElement | null>;
  onSelectStop: (index: number) => void;
  onStepStop: (delta: -1 | 1) => void;
}

/**
 * Restrained bottom-edge editorial navigation for the 2.5D Mountain Journey.
 * - Tabular progress counter (01 / 03) + thin 1px burgundy hairline
 * - Direct clickable milestone buttons (iMerit, Haegl Tech, RYVO)
 * - Previous / Next controls with single-line labels and >= 40px touch targets
 */
export function JourneyNavigation({
  milestones,
  activeIndex,
  selectedId,
  progressBarRef,
  onSelectStop,
  onStepStop,
}: JourneyNavigationProps) {
  const total = milestones.length;
  const activeNumber = String(activeIndex + 1).padStart(2, "0");
  const totalNumber = String(total).padStart(2, "0");

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
        {/* Compact tabular 01 / 03 counter & thin progress rule */}
        <div className="flex items-center gap-3.5 shrink-0">
          <span
            data-testid="journey-progress-counter"
            className="font-mono text-xs tracking-[0.2em] text-[#792B33] tabular-nums whitespace-nowrap"
          >
            {activeNumber} / {totalNumber}
          </span>
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

        {/* Direct milestone jumps */}
        <nav
          aria-label="Journey milestones"
          className="flex items-center gap-5 sm:gap-7"
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
                className={`group relative inline-flex min-h-[40px] items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isCurrent || isInspected
                    ? "text-[#792B33] font-medium"
                    : "text-[#792B33]/55 hover:text-[#792B33]"
                }`}
              >
                <span className="tabular-nums">{milestone.number}</span>
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

        {/* Previous / Next milestone step buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="journey-prev-btn"
            onClick={(e) => {
              e.stopPropagation();
              onStepStop(-1);
            }}
            disabled={activeIndex <= 0}
            aria-label="Previous milestone"
            className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/30 text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#792B33] cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            data-testid="journey-next-btn"
            onClick={(e) => {
              e.stopPropagation();
              onStepStop(1);
            }}
            disabled={activeIndex >= total - 1}
            aria-label="Next milestone"
            className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/30 text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#792B33] cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
