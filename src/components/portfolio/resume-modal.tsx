"use client";

import { useEffect, useRef } from "react";
import { Download, Printer, X } from "lucide-react";
import { CAREER_STOPS, IDENTITY, RESUME_SUMMARY, STACK_CATEGORIES } from "@/data/portfolio";

interface ResumeModalProps {
  open: boolean;
  onClose: () => void;
}

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

  const handleDownloadTxt = () => {
    const lines = [
      RESUME_SUMMARY.headline,
      `${IDENTITY.location} | ${IDENTITY.email}`,
      "",
      "SUMMARY",
      ...RESUME_SUMMARY.highlights.map((h) => `- ${h}`),
      "",
      "EXPERIENCE",
      ...CAREER_STOPS.flatMap((stop) => [
        `${stop.company} — ${stop.role} (${stop.period}, ${stop.city})`,
        stop.summary,
        ...stop.highlights.map((hl) => `  * ${hl}`),
        "",
      ]),
      "TECHNICAL STACK",
      ...STACK_CATEGORIES.map((c) => `${c.name}: ${c.items.join(", ")}`),
      "",
      "EDUCATION",
      RESUME_SUMMARY.education,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Ranjan_Vernekar_Resume.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-dialog-title"
      data-testid="resume-modal"
    >
      <div
        className="fixed inset-0 bg-[#0A0A0C]/85"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[6px] border border-white/[0.12] bg-[#121216] p-6 sm:p-10 text-[#F4F1EA]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.1] pb-5">
          <div>
            <p className="type-tech-label text-[#C4B0DC]">Curriculum Vitae</p>
            <h2 id="resume-dialog-title" className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
              {IDENTITY.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="btn-secondary"
              aria-label="Download plain text resume"
            >
              <Download size={15} strokeWidth={1.6} aria-hidden="true" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary"
              aria-label="Print or save resume as PDF"
            >
              <Printer size={15} strokeWidth={1.6} aria-hidden="true" />
              <span>Print PDF</span>
            </button>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] border border-white/[0.12] bg-[#1B1A20] text-[#F4F1EA] hover:border-[#C4B0DC]"
              aria-label="Close resume dialog"
            >
              <X size={18} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-7 text-sm sm:text-base">
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-[#A19D97]">
            <span>{IDENTITY.email}</span>
            <span aria-hidden="true">·</span>
            <span>{IDENTITY.location}</span>
            <span aria-hidden="true">·</span>
            <span>{RESUME_SUMMARY.education}</span>
          </div>

          <div>
            <h3 className="type-tech-label text-[#C4B0DC] mb-3">Engineering Profile</h3>
            <ul className="space-y-2 text-[#A19D97] list-none p-0 m-0">
              {RESUME_SUMMARY.highlights.map((h, i) => (
                <li key={i} className="grid grid-cols-[18px_1fr] gap-2">
                  <span className="font-mono text-xs text-[#6C6863] pt-1">—</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="type-tech-label text-[#C4B0DC] mb-3">Career Chronology</h3>
            <div className="border-t border-white/[0.1]">
              {CAREER_STOPS.slice()
                .reverse()
                .map((stop) => (
                  <div
                    key={stop.id}
                    className="border-b border-white/[0.08] py-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-[#F4F1EA]">
                        {stop.company} · {stop.role}
                      </span>
                      <span className="font-mono text-xs text-[#6C6863] tabular-nums">
                        {stop.period}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-[#A19D97]">{stop.summary}</p>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h3 className="type-tech-label text-[#C4B0DC] mb-3">Systems & Stack</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {STACK_CATEGORIES.map((cat) => (
                <div key={cat.name} className="border-t border-white/[0.1] pt-3">
                  <div className="font-medium text-[#F4F1EA]">{cat.name}</div>
                  <div className="mt-1 text-xs font-mono text-[#A19D97]">
                    {cat.items.join(" · ")}
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
