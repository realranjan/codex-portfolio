"use client";

import { useEffect, useRef } from "react";
import { Printer, X } from "lucide-react";
import {
  ABOUT_CONTENT,
  CONTACT_CONTENT,
  EDUCATION_ENTRIES,
  EXPERIENCE_STOPS,
  SKILL_CATEGORIES,
} from "@/data/portfolio-content";

interface ResumeModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Editorial Resume Summary overlay strictly using Primary Burgundy (#792B33)
 * and Warm Ivory (#F3E9DE), populated from the replaceable `portfolio-content.ts`
 * data registry with no invented metrics or fake links.
 */
export function ResumeModal({ open, onClose }: ResumeModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => closeBtnRef.current?.focus(), 40);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-dialog-title"
      data-testid="resume-modal"
    >
      <div
        className="fixed inset-0 bg-[#792B33]/48"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-[#792B33]/35 bg-[#F3E9DE] p-6 sm:p-10 text-[#792B33] shadow-[0_24px_64px_rgba(121,43,51,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#792B33]/20 pb-5">
          <div>
            <p className="m-0 font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/68">
              Curriculum Vitae · Placeholder Summary
            </p>
            <h2
              id="resume-dialog-title"
              className="mt-1 m-0 font-normal uppercase leading-none text-[#792B33]"
              style={{
                fontFamily: "var(--font-anton), Impact, sans-serif",
                fontSize: "clamp(32px, 3.6vw, 48px)",
              }}
            >
              {CONTACT_CONTENT.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-10 items-center gap-2 bg-[#792B33] px-4 font-mono text-xs uppercase tracking-[0.14em] text-[#F3E9DE] hover:opacity-90 cursor-pointer"
              aria-label="Print resume summary"
            >
              <Printer size={14} strokeWidth={1.6} aria-hidden="true" />
              <span>Print</span>
            </button>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/32 text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
              aria-label="Close resume dialog"
            >
              <X size={18} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-8 text-sm sm:text-base">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[#792B33]/75">
            <span>{CONTACT_CONTENT.email}</span>
            <span>
              PDF Link: {CONTACT_CONTENT.resumeUrl ? "Configured" : "Not configured"}
            </span>
          </div>

          <div>
            <h3 className="m-0 mb-2 font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/65">
              Statement
            </h3>
            <p className="m-0 leading-relaxed text-[#792B33]/88">
              {ABOUT_CONTENT.mainStatement} {ABOUT_CONTENT.supportingStatement}
            </p>
          </div>

          <div>
            <h3 className="m-0 mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/65">
              Experience Stops (Placeholders)
            </h3>
            <div className="border-t border-[#792B33]/18">
              {EXPERIENCE_STOPS.map((stop) => (
                <div
                  key={stop.id}
                  className="border-b border-[#792B33]/14 py-3.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-[#792B33]">
                      {stop.companyName} — {stop.roleTitle}
                    </span>
                    <span className="font-mono text-xs text-[#792B33]/65 tabular-nums">
                      {stop.dates}
                    </span>
                  </div>
                  <p className="mt-1 m-0 text-sm text-[#792B33]/80">{stop.overview}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="m-0 mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/65">
              Education (Placeholders)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EDUCATION_ENTRIES.map((edu) => (
                <div key={edu.id} className="border-t border-[#792B33]/18 pt-3">
                  <div className="font-semibold text-[#792B33]">{edu.institution}</div>
                  <div className="text-sm text-[#792B33]/82">{edu.degree}</div>
                  <div className="mt-1 font-mono text-xs text-[#792B33]/62 tabular-nums">
                    {edu.startYear} — {edu.graduationYear} · {edu.location}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="m-0 mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/65">
              Technology Landscape ({SKILL_CATEGORIES.length} Categories)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SKILL_CATEGORIES.map((cat) => (
                <div key={cat.id} className="border-t border-[#792B33]/18 pt-3">
                  <div className="font-medium text-[#792B33]">{cat.title}</div>
                  <div className="mt-1 font-mono text-xs text-[#792B33]/72">
                    {cat.tools.map((t) => t.name).join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
