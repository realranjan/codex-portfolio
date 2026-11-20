"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ExperienceRecord } from "@/data/portfolio-content";
import { PlaceholderVisual } from "@/components/portfolio/editorial-primitives";
import { wrapIndex } from "@/lib/carousel";

interface ExperienceExhibitModalProps {
  record: ExperienceRecord | null;
  indexNumber: string;
  totalCount: number;
  onClose: () => void;
}

/**
 * Spacious editorial exhibition detail overlay for an Experience milestone.
 * Displays full work narrative, all achievements & challenges, multi-frame
 * screenshot gallery slots, technology stack, and verified external link only
 * when configured (never renders fake clickable links).
 */
export function ExperienceExhibitModal({
  record,
  indexNumber,
  totalCount,
  onClose,
}: ExperienceExhibitModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [mediaIdx, setMediaIdx] = useState(0);

  const slides =
    record?.gallery && record.gallery.length > 0
      ? record.gallery
      : record
        ? [
            {
              id: `${record.id}-primary`,
              label: `${record.company.toUpperCase()} · SCREENSHOT PLACEHOLDER`,
              caption:
                "Replace with verified product screenshot or architectural visual in portfolio-content.ts.",
              imageUrl: record.screenshot,
            },
          ]
        : [];

  useEffect(() => {
    if (!record) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 30);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [record, onClose]);

  if (!record) return null;

  const safeMediaIdx = slides.length > 0 ? mediaIdx % slides.length : 0;
  const activeSlide = slides[safeMediaIdx];
  const formattedTotal = String(totalCount).padStart(2, "0");

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="experience-detail-title"
      data-testid="experience-detail-modal"
    >
      {/* Calm Burgundy wash backdrop */}
      <div
        className="fixed inset-0 bg-[#792B33]/52"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Archival Ivory exhibition monograph panel */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-[#792B33]/35 bg-[#F3E9DE] text-[#792B33]">
        {/* Header bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#792B33]/20 bg-[#F3E9DE] px-6 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#792B33]/70 tabular-nums">
            <span>
              Exhibit {indexNumber} / {formattedTotal}
            </span>
            <span aria-hidden="true">·</span>
            <span>{record.dates}</span>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={`Close ${record.company} exhibit details`}
            className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/30 text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
          >
            <X size={18} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-8 p-6 sm:p-8 lg:p-10">
          {/* Company title + logo slot */}
          <div className="flex flex-col justify-between gap-6 border-b border-[#792B33]/18 pb-6 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h3
                id="experience-detail-title"
                className="m-0 font-normal uppercase leading-[0.9] tracking-[-0.03em] text-[#792B33]"
                style={{
                  fontFamily: "var(--font-anton), Impact, sans-serif",
                  fontSize: "clamp(38px, 5vw, 64px)",
                }}
              >
                {record.company}
              </h3>
              <p
                className="mt-2.5 m-0 font-serif italic text-xl sm:text-2xl text-[#792B33]/88"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                {record.role}
              </p>
            </div>

            <div className="flex h-14 w-32 shrink-0 items-center justify-center border border-[#792B33]/25 bg-[#ECE0D2]/70 px-3">
              {record.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={record.logo}
                  alt={`${record.company} logo`}
                  referrerPolicy="no-referrer"
                  className="max-h-10 max-w-full object-contain"
                />
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#792B33]/68">
                  Logo · Placeholder
                </span>
              )}
            </div>
          </div>

          {/* Primary narrative */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-5">
              <h4 className="m-0 font-mono text-[11px] uppercase tracking-[0.18em] text-[#792B33]/64">
                Work &amp; Context
              </h4>
              <p className="m-0 text-base leading-relaxed text-[#792B33]/88">
                {record.description}
              </p>
            </div>

            <div className="space-y-3 border-t border-[#792B33]/16 pt-6 lg:col-span-7 lg:border-t-0 lg:border-l lg:border-[#792B33]/16 lg:pt-0 lg:pl-8">
              <h4 className="m-0 font-mono text-[11px] uppercase tracking-[0.18em] text-[#792B33]/64">
                Achievements &amp; Technical Challenges
              </h4>
              <ol className="m-0 list-none space-y-3.5 p-0">
                {record.achievements.map((item, idx) => (
                  <li
                    key={idx}
                    className="grid grid-cols-[28px_1fr] gap-2 text-sm leading-relaxed text-[#792B33]/86"
                  >
                    <span className="font-mono text-xs text-[#792B33]/58 tabular-nums">
                      0{idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Visual / Screenshot gallery bay */}
          {activeSlide && (
            <div className="space-y-3 border-t border-[#792B33]/18 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#792B33]/66 tabular-nums">
                  Exhibit Media · 0{safeMediaIdx + 1} / 0{slides.length}
                </span>

                {slides.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setMediaIdx((cur) => wrapIndex(cur - 1, slides.length))
                      }
                      aria-label={`Previous ${record.company} visual`}
                      className="inline-flex h-8 w-8 items-center justify-center border border-[#792B33]/28 text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
                    >
                      <ChevronLeft size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMediaIdx((cur) => wrapIndex(cur + 1, slides.length))
                      }
                      aria-label={`Next ${record.company} visual`}
                      className="inline-flex h-8 w-8 items-center justify-center border border-[#792B33]/28 text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
                    >
                      <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              <PlaceholderVisual
                surface="ivory"
                number={indexNumber}
                label={activeSlide.label}
                sublabel={record.company}
                aspectClass="aspect-[16/8]"
                imageUrl={activeSlide.imageUrl ?? record.screenshot}
                imageAlt={`${record.company} exhibit preview`}
              />

              <p className="m-0 font-mono text-xs text-[#792B33]/66">
                {activeSlide.caption}
              </p>
            </div>
          )}

          {/* Technologies & Verified External Link */}
          <div className="flex flex-col justify-between gap-4 border-t border-[#792B33]/18 pt-6 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#792B33]/60">
                Relevant Technologies
              </span>
              <p className="m-0 font-mono text-xs leading-relaxed text-[#792B33]/85">
                {record.techStack.join("  ·  ")}
              </p>
            </div>

            <div className="shrink-0">
              {record.externalLink ? (
                <a
                  href={record.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-1.5 border border-[#792B33] bg-[#792B33] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#F3E9DE] no-underline transition-opacity hover:opacity-90 whitespace-nowrap"
                >
                  <span>Visit {record.company}</span>
                  <ArrowUpRight size={13} aria-hidden="true" />
                </a>
              ) : (
                <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-[#792B33]/56">
                  External link · Not configured
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
