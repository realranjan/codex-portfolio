"use client";

import { ArrowUpRight, X } from "lucide-react";
import type { JourneyMilestone } from "@/data/experience-journey";

export interface ExperienceTypographyProps {
  milestone: JourneyMilestone | null;
  isPinned: boolean;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onDismiss: () => void;
  /** Desktop edge overlay vs. inline flow beneath mobile scene */
  variant?: "overlay" | "inline";
}

/**
 * Strictly borderless editorial company readout.
 *
 * - ZERO cards, boxes, translucent panels, glassmorphism, or rectangular borders.
 * - Pure HTML typography directly over the open viewport margin, structured by
 *   scale, generous negative space, and thin 1px Burgundy (#792B33) rules.
 * - Uses only a feather-soft invisible radial ivory wash behind the text baseline
 *   so legibility stays >= 4.5:1 without ever creating a visible rectangle.
 */
export function ExperienceTypography({
  milestone,
  isPinned,
  onPointerEnter,
  onPointerLeave,
  onDismiss,
  variant = "overlay",
}: ExperienceTypographyProps) {
  if (!milestone) return null;

  if (variant === "inline") {
    return (
      <article
        data-testid="experience-typography-inline"
        aria-live="polite"
        className="w-full pt-5 pb-2 text-[#792B33]"
      >
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#792B33]/75 tabular-nums">
            {milestone.number} · {milestone.period}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={`Close ${milestone.companyName} details`}
            className="inline-flex min-h-[44px] items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#792B33]/75 hover:text-[#792B33] cursor-pointer"
          >
            <span>Close</span>
            <X size={13} />
          </button>
        </div>

        <h3
          className="mt-1 m-0 font-normal uppercase leading-[0.9] tracking-[-0.03em] text-[#792B33]"
          style={{
            fontFamily: "var(--font-anton), Impact, sans-serif",
            fontSize: "clamp(40px, 11vw, 56px)",
            textWrap: "balance",
          }}
        >
          {milestone.companyName}
        </h3>

        <p className="mt-2 m-0 text-sm font-semibold text-[#5B2027]">
          {milestone.role}
        </p>
        <p className="mt-0.5 m-0 font-mono text-xs text-[#792B33]/72">
          {milestone.location}
        </p>

        <div className="my-4 h-px w-14 bg-[#792B33]/45" aria-hidden="true" />

        <ul className="m-0 list-none space-y-2.5 p-0 text-sm leading-relaxed text-[#4C2227]">
          {milestone.achievements.map((item, idx) => (
            <li key={idx} className="flex gap-2.5">
              <span aria-hidden="true" className="text-[#792B33]/65 shrink-0">
                —
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 pt-3 border-t border-[#792B33]/20 flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 font-mono text-[11px] leading-relaxed text-[#792B33]/78">
            {milestone.technologies.join(" · ")}
          </p>
          {milestone.link && (
            <a
              href={milestone.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#792B33] no-underline hover:underline"
            >
              <span>Visit</span>
              <ArrowUpRight size={12} />
            </a>
          )}
        </div>
      </article>
    );
  }

  const isRight = milestone.sideEdge === "right";

  return (
    <aside
      data-testid="experience-typography-overlay"
      data-company-id={milestone.id}
      data-pinned={isPinned ? "true" : "false"}
      aria-label={`${milestone.companyName} experience details`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={(e) => e.stopPropagation()}
      className={`pointer-events-auto absolute top-[104px] z-40 w-[min(430px,36vw)] transition-all duration-300 ease-out ${
        isRight ? "right-[max(40px,4.8vw)] text-left" : "left-[max(40px,4.8vw)] text-left"
      }`}
    >
      {/* Feather-soft invisible radial ivory wash for contrast only (zero visible box or edge) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-20 -inset-y-16 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 76% 72% at 48% 48%, rgba(243,233,222,0.96) 0%, rgba(243,233,222,0.82) 52%, rgba(243,233,222,0) 82%)",
        }}
      />

      {/* Company Number + subtle pinned dismiss control */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.24em] text-[#792B33] tabular-nums">
          <span>{milestone.number}</span>
          <span aria-hidden="true" className="inline-block h-px w-8 bg-[#792B33]/55" />
          <span className="text-[#792B33]/70">
            {isPinned ? "Pinned" : "Milestone"}
          </span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dismiss ${milestone.companyName} details`}
          className="inline-flex h-8 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#792B33]/72 hover:text-[#792B33] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>Esc</span>
          <X size={13} />
        </button>
      </div>

      {/* LARGE COMPANY NAME — Editorial display typography */}
      <h3
        className="mt-2 m-0 font-normal uppercase leading-[0.88] tracking-[-0.03em] text-[#792B33]"
        style={{
          fontFamily: "var(--font-anton), Impact, sans-serif",
          fontSize: "clamp(46px, 4.6vw, 72px)",
          textWrap: "balance",
        }}
      >
        {milestone.companyName}
      </h3>

      {/* Job title & employment dates */}
      <p className="mt-3 m-0 text-[15px] font-semibold leading-snug text-[#4E1D23]">
        {milestone.role}
      </p>
      <p className="mt-1 m-0 font-mono text-[12px] tracking-[0.06em] text-[#792B33]/80 tabular-nums">
        <span>{milestone.period}</span>
        <span aria-hidden="true"> · </span>
        <span>{milestone.location}</span>
      </p>

      {/* Hairline divider */}
      <div className="my-4 h-px w-16 bg-[#792B33]/48" aria-hidden="true" />

      {/* Two concise accomplishments */}
      <ul className="m-0 list-none space-y-2.5 p-0 text-[14px] leading-[1.58] text-[#3F1F23] max-w-[44ch]">
        {milestone.achievements.map((achievement, idx) => (
          <li key={idx} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-[2px] font-mono text-xs text-[#792B33]/70 shrink-0"
            >
              —
            </span>
            <span>{achievement}</span>
          </li>
        ))}
      </ul>

      {/* Unboxed technologies (zero pills/chips) */}
      <div className="mt-5 pt-3 border-t border-[#792B33]/22 flex items-center justify-between gap-4">
        <p className="m-0 font-mono text-[11px] leading-relaxed tracking-[0.04em] text-[#792B33]/82">
          {milestone.technologies.join(" · ")}
        </p>
        {milestone.link && (
          <a
            href={milestone.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#792B33] no-underline hover:underline shrink-0"
          >
            <span>Site</span>
            <ArrowUpRight size={12} />
          </a>
        )}
      </div>
    </aside>
  );
}
