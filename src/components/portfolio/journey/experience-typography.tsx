"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, X } from "lucide-react";
import type { JourneyMilestone } from "@/data/experience-journey";

export interface ExperienceTypographyProps {
  milestone: JourneyMilestone | null;
  isManuallySelected: boolean;
  onDismiss: () => void;
  /** Desktop edge overlay vs. inline flow beneath mobile scene */
  variant?: "overlay" | "inline";
}

/**
 * Framed Japanese editorial dossier box for active journey company checkpoints.
 *
 * Designed as an unmistakable visual focal card (high-contrast burgundy header band,
 * vermilion-to-gold top ribbon, double archival border, deep elevation shadow, and
 * spring arrival motion) so the visitor's eye locks immediately onto company details
 * the moment the traveler arrives at each checkpoint during scroll.
 */
export function ExperienceTypography({
  milestone,
  isManuallySelected,
  onDismiss,
  variant = "overlay",
}: ExperienceTypographyProps) {
  if (variant === "inline") {
    if (!milestone) return null;

    return (
      <article
        data-testid="experience-typography-inline"
        aria-live="polite"
        className="relative w-full overflow-hidden border-2 border-[#792B33] bg-[#F7EFE6] text-[#792B33] shadow-[0_18px_42px_rgba(44,15,20,0.18)]"
      >
        {/* Vermilion-to-gold lacquer accent bar */}
        <div
          aria-hidden="true"
          className="h-[4px] w-full bg-gradient-to-r from-[#C8372D] via-[#792B33] to-[#D4963B]"
        />

        {/* High-contrast burgundy header band */}
        <div className="flex items-center justify-between gap-3 bg-[#792B33] px-4 py-2.5 text-[#F3E9DE]">
          <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.2em] tabular-nums">
            <span className="text-[#F3E9DE]/92">{milestone.period}</span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={`Close ${milestone.companyName} details`}
            className="inline-flex h-8 w-8 items-center justify-center text-[#F3E9DE]/80 hover:bg-[#F3E9DE]/15 hover:text-[#F3E9DE] transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5">
          <h3
            className="m-0 font-normal uppercase leading-[0.94] tracking-[0.02em] text-[#792B33]"
            style={{
              fontFamily: "var(--font-display-bold), 'Arial Black', sans-serif",
              fontSize: "clamp(28px, 8.5vw, 42px)",
              textWrap: "balance",
            }}
          >
            {milestone.companyName}
          </h3>

          <p className="mt-2 m-0 text-[15px] font-semibold text-[#4B1A20]">
            {milestone.role}
          </p>
          <p className="mt-0.5 m-0 font-mono text-xs text-[#792B33]/78">
            {milestone.location}
          </p>

          <div className="my-4 h-px w-full bg-[#792B33]/20" aria-hidden="true" />

          <ul className="m-0 list-none space-y-2.5 p-0 text-sm leading-relaxed text-[#3B1A1F]">
            {milestone.achievements.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-[#C8372D]"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-3 border-t border-[#792B33]/20 flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 font-mono text-[11px] leading-relaxed text-[#792B33]/85">
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
        </div>
      </article>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {milestone && (
        <motion.aside
          key={milestone.id}
          initial={{ opacity: 0, y: 26, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.96 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          data-testid="experience-typography-overlay"
          data-company-id={milestone.id}
          data-selection-mode={isManuallySelected ? "clicked" : "reached"}
          aria-label={`${milestone.companyName} experience details`}
          onClick={(e) => e.stopPropagation()}
          className={`pointer-events-auto absolute top-[104px] lg:top-[114px] z-40 w-[min(450px,38vw)] overflow-hidden border-2 border-[#792B33] bg-[#F7EFE6]/[0.96] backdrop-blur-md text-left shadow-[0_28px_68px_rgba(36,12,16,0.32),0_0_0_1px_rgba(243,233,222,0.85)] ${
            milestone.sideEdge === "right"
              ? "right-[max(36px,4.5vw)]"
              : "left-[max(36px,4.5vw)]"
          }`}
        >
          {/* Vibrant vermilion-to-gold lacquer top bar acting as an instant visual magnet */}
          <div
            aria-hidden="true"
            className="h-[4px] w-full bg-gradient-to-r from-[#C8372D] via-[#792B33] to-[#D4963B]"
          />

          {/* High-contrast Deep Burgundy header strip */}
          <div className="flex items-center justify-between gap-4 bg-[#792B33] px-5 py-3 text-[#F3E9DE]">
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] tabular-nums">
              <span className="text-[#F3E9DE]/92">{milestone.period}</span>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              aria-label={`Dismiss ${milestone.companyName} details`}
              className="inline-flex h-7 w-7 items-center justify-center text-[#F3E9DE]/80 hover:bg-[#F3E9DE]/16 hover:text-[#F3E9DE] transition-colors cursor-pointer shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          {/* Framed archival ivory interior */}
          <div className="relative px-6 py-5">
            {/* Subtle corner registration brackets inside the frame */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-2.5 h-2.5 w-2.5 border-l border-t border-[#792B33]/35"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 top-2.5 h-2.5 w-2.5 border-r border-t border-[#792B33]/35"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 bottom-2.5 h-2.5 w-2.5 border-l border-b border-[#792B33]/35"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 bottom-2.5 h-2.5 w-2.5 border-r border-b border-[#792B33]/35"
            />

            {/* Bold Monumental Company Name */}
            <h3
              className="m-0 font-normal uppercase leading-[0.92] tracking-[0.02em] text-[#792B33]"
              style={{
                fontFamily: "var(--font-display-bold), 'Arial Black', sans-serif",
                fontSize: "clamp(32px, 3.2vw, 50px)",
                textWrap: "balance",
              }}
            >
              {milestone.companyName}
            </h3>

            {/* Role & Location */}
            <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2">
              <p className="m-0 text-[15px] font-semibold leading-snug text-[#4B1A20]">
                {milestone.role}
              </p>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#792B33]/74">
                {milestone.location}
              </span>
            </div>

            {/* Accent divider */}
            <div className="my-4 h-px w-full bg-[#792B33]/20" aria-hidden="true" />

            {/* Structured Achievements with vermilion diamond markers */}
            <ul className="m-0 list-none space-y-2.5 p-0 text-[13.5px] leading-[1.58] text-[#391B1F]">
              {milestone.achievements.map((achievement, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-[#C8372D]"
                  />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>

            {/* Structured Technology Footer Strip */}
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#792B33]/20 pt-3.5">
              <p className="m-0 font-mono text-[11px] leading-relaxed tracking-[0.05em] text-[#792B33]/88">
                {milestone.technologies.join(" · ")}
              </p>
              {milestone.link && (
                <a
                  href={milestone.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 border border-[#792B33]/35 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#792B33] no-underline transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] shrink-0"
                >
                  <span>Site</span>
                  <ArrowUpRight size={11} />
                </a>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
