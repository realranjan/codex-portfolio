"use client";

import { ArrowUpRight } from "lucide-react";
import type { ExperienceRecord } from "@/data/portfolio-content";

interface ExperienceExhibitPanelProps {
  record: ExperienceRecord;
  index: number;
  total: number;
  isActive: boolean;
  /** Compact mode for tablet & mobile readable regions */
  compact?: boolean;
  /** Called when clicking an inactive peeking exhibit to bring it into focus */
  onFocus?: () => void;
  /** Called when inspecting the active exhibit to open its detail overlay */
  onInspect: () => void;
}

/**
 * Architectural gallery exhibit plate for a single company milestone.
 *
 * Uses strict Burgundy (#792B33) and Warm Ivory (#F3E9DE) materiality, crisp
 * 1px hairlines, subtle asymmetric composition variants across milestones,
 * zero pill enclosures, zero glassmorphism, and sharp, flat HTML typography.
 */
export function ExperienceExhibitPanel({
  record,
  index,
  total,
  isActive,
  compact = false,
  onFocus,
  onInspect,
}: ExperienceExhibitPanelProps) {
  const number = String(index + 1).padStart(2, "0");
  const totalFormatted = String(total).padStart(2, "0");
  const variant = record.compositionVariant ?? "narrative-left";
  const plateOnLeft = !compact && variant === "plate-left";
  const primaryHighlight = record.achievements[0] ?? "";

  const narrativeColClass = compact
    ? "col-span-12"
    : variant === "asymmetric-wide"
      ? "col-span-7"
      : plateOnLeft
        ? "col-span-7 order-2"
        : "col-span-7";

  const visualColClass = compact
    ? "col-span-12"
    : variant === "asymmetric-wide"
      ? "col-span-5"
      : plateOnLeft
        ? "col-span-5 order-1"
        : "col-span-5";

  return (
    <article
      data-testid={`experience-exhibit-${record.id}`}
      data-active={isActive ? "true" : "false"}
      className={`relative w-full border text-[#792B33] transition-colors duration-300 ${
        isActive
          ? "border-[#792B33]/36 bg-[#F3E9DE]"
          : "border-[#792B33]/22 bg-[#EFE3D5]"
      }`}
    >
      {/* When an exhibit is secondary/peeking in the spatial gallery, clicking it focuses that company */}
      {!isActive && onFocus && (
        <button
          type="button"
          onClick={onFocus}
          aria-label={`Focus ${record.company} exhibit`}
          className="absolute inset-0 z-20 cursor-pointer bg-transparent focus-visible:outline-2 focus-visible:outline-[#792B33]"
        />
      )}

      {/* Inner content dims gently when secondary while archival paper backing stays opaque (zero SVG bleed-through) */}
      <div
        className={`transition-opacity duration-300 ${
          isActive ? "opacity-100" : "opacity-55"
        }`}
      >
        {/* Top exhibition catalog bar */}
        <div
          className={`flex items-center justify-between gap-3 border-b border-[#792B33]/18 px-4 py-3 sm:px-6 ${
            isActive ? "bg-[#ECE0D2]/55" : "bg-[#E7D8C7]/45"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] tabular-nums">
            <span className="shrink-0 whitespace-nowrap font-medium text-[#792B33]">
              {number} / {totalFormatted}
            </span>
            <span aria-hidden="true" className="shrink-0 text-[#792B33]/35">
              ·
            </span>
            <span className="min-w-0 truncate text-[#792B33]/72">
              {record.dates}
            </span>
          </div>

          {/* Company Logo Slot (renders optimized img when configured, honest placeholder otherwise) */}
          <div className="flex h-8 shrink-0 items-center justify-center border border-[#792B33]/24 bg-[#F3E9DE] px-2.5">
            {record.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={record.logo}
                alt={`${record.company} logo`}
                referrerPolicy="no-referrer"
                className="max-h-5 max-w-[84px] object-contain"
              />
            ) : (
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#792B33]/66 whitespace-nowrap">
                Logo · Placeholder
              </span>
            )}
          </div>
        </div>

        {/* Main asymmetric exhibit spread */}
        <div className={`grid grid-cols-12 ${compact ? "gap-5 p-5 sm:p-6" : "gap-0"}`}>
          {/* Narrative Column — strictly stationary sharp HTML text */}
          <div
            className={`${narrativeColClass} flex flex-col justify-between ${
              compact
                ? "space-y-4"
                : plateOnLeft
                  ? "border-l border-[#792B33]/16 p-6 lg:p-7 space-y-4"
                  : "border-r border-[#792B33]/16 p-6 lg:p-7 space-y-4"
            }`}
          >
            <div className="space-y-3">
              <div>
                <h3
                  className="m-0 font-normal uppercase leading-[0.9] tracking-[-0.03em] text-[#792B33]"
                  style={{
                    fontFamily: "var(--font-anton), Impact, sans-serif",
                    fontSize: compact
                      ? "clamp(34px, 7.5vw, 48px)"
                      : "clamp(38px, 3.6vw, 56px)",
                  }}
                >
                  {record.company}
                </h3>
                <p
                  className="mt-1.5 m-0 font-serif italic text-lg sm:text-xl text-[#792B33]/86"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  {record.role}
                </p>
              </div>

              <p className="m-0 max-w-[54ch] text-sm sm:text-[15px] leading-relaxed text-[#792B33]/86">
                {record.description}
              </p>
            </div>

            {/* Highlighted Achievement / Technical Challenge (clean hairline separation, zero border-l-4) */}
            {primaryHighlight && (
              <div className="border-t border-[#792B33]/16 pt-3.5 space-y-1">
                <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#792B33]/60">
                  Key Challenge / Milestone
                </span>
                <p className="m-0 text-xs sm:text-[13px] leading-relaxed text-[#792B33]/84">
                  {primaryHighlight}
                </p>
              </div>
            )}

            {/* Unboxed inline tech stack + Inspect exhibit action */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#792B33]/16 pt-3.5">
              <p className="m-0 min-w-0 font-mono text-[11px] text-[#792B33]/72">
                {record.techStack.join(" · ")}
              </p>

              <button
                type="button"
                onClick={onInspect}
                tabIndex={isActive ? 0 : -1}
                aria-label={`Inspect ${record.company} exhibit details`}
                className="inline-flex min-h-[38px] items-center gap-1.5 border border-[#792B33]/34 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Inspect exhibit</span>
                <ArrowUpRight size={13} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Visual / Screenshot Plate Column */}
          <div
            className={`${visualColClass} flex flex-col justify-between bg-[#ECE0D2]/48 ${
              compact ? "p-3.5 border border-[#792B33]/16" : "p-6 lg:p-7"
            }`}
          >
            <button
              type="button"
              onClick={onInspect}
              tabIndex={isActive ? 0 : -1}
              aria-label={`Open ${record.company} visual and full notes`}
              className="group block w-full text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#792B33]"
            >
              <div
                className={`relative w-full overflow-hidden border border-[#792B33]/24 bg-[#E9DCCB]/70 text-[#792B33] transition-colors duration-200 group-hover:border-[#792B33]/55 ${
                  compact ? "aspect-[16/9]" : "aspect-[4/3]"
                }`}
              >
                {record.screenshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={record.screenshot}
                    alt={`${record.company} project screenshot`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="relative flex h-full w-full flex-col justify-between p-4 select-none">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-[#792B33]/14"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-[#792B33]/14"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-2.5 top-2.5 h-2.5 w-2.5 border-l border-t border-[#792B33]/45"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute right-2.5 top-2.5 h-2.5 w-2.5 border-r border-t border-[#792B33]/45"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-2.5 left-2.5 h-2.5 w-2.5 border-b border-l border-[#792B33]/45"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-2.5 right-2.5 h-2.5 w-2.5 border-b border-r border-[#792B33]/45"
                    />

                    <div className="relative z-[1] flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.16em] tabular-nums text-[#792B33]/72">
                      <span className="truncate">{record.company}</span>
                      <span className="shrink-0 font-medium text-[#792B33]">{number}</span>
                    </div>

                    <div className="relative z-[1] my-auto flex flex-col items-center justify-center text-center">
                      <span
                        aria-hidden="true"
                        className="block leading-none tracking-[-0.04em] text-[#792B33]/[0.14]"
                        style={{
                          fontFamily: "var(--font-anton), Impact, sans-serif",
                          fontSize: "clamp(44px, 5.2vw, 76px)",
                        }}
                      >
                        {number}
                      </span>
                      <span className="mt-1 font-mono text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.18em] text-[#792B33]">
                        Screenshot · Placeholder
                      </span>
                    </div>

                    <div className="relative z-[1] flex items-center justify-between gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#792B33]/64">
                      <span>Exhibit Plate</span>
                      <span>Ready</span>
                    </div>
                  </div>
                )}
              </div>
            </button>

            <div className="mt-3 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#792B33]/62">
              <span>{record.achievements.length} Notes Archived</span>
              <span>
                {record.externalLink ? "Verified Link" : "Link Pending"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
