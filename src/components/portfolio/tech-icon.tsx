"use client";

import type { ChapterSurface } from "@/data/portfolio-content";
import type { TechIconEntry } from "@/data/tech-icons-manifest";

export interface TechIconProps {
  icon: TechIconEntry;
  /** Surrounding portfolio surface: Burgundy (#792B33) or Warm Ivory (#F3E9DE) */
  surface: ChapterSurface;
  /** Rendered visual size in pixels (square container) */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<TechIconProps["size"]>, { box: string; img: string }> = {
  sm: { box: "h-8 w-8 p-1.5", img: "h-5 w-5" },
  md: { box: "h-11 w-11 p-2", img: "h-7 w-7" },
  lg: { box: "h-14 w-14 p-2.5", img: "h-9 w-9" },
};

/**
 * Reusable, contrast-safe brand SVG icon renderer locked to the portfolio's
 * Burgundy (#792B33) and Warm Ivory (#F3E9DE) surfaces.
 *
 * - Never distorts aspect ratio or recolors multi-color official brand marks.
 * - Dark or burgundy-adjacent marks automatically receive a Warm Ivory plate
 *   when placed over Burgundy (#792B33) for razor-sharp visual legibility.
 * - Light marks automatically receive a Burgundy plate over Warm Ivory (#F3E9DE).
 */
export function TechIcon({
  icon,
  surface,
  size = "md",
  className = "",
}: TechIconProps) {
  const dims = SIZE_CLASSES[size];
  const plate = surface === "burgundy" ? icon.burgundyPlate : icon.ivoryPlate;

  const plateClasses =
    plate === "ivory-plate"
      ? "bg-[#F3E9DE] border border-[#F3E9DE]/90 shadow-[0_2px_10px_rgba(32,10,13,0.18)]"
      : plate === "burgundy-plate"
        ? "bg-[#792B33] border border-[#792B33]/85"
        : surface === "burgundy"
          ? "bg-[#F3E9DE]/[0.08] border border-[#F3E9DE]/18"
          : "bg-[#792B33]/[0.04] border border-[#792B33]/14";

  if (!icon.verified) {
    return (
      <span
        aria-label={`${icon.name} (unverified logo)`}
        className={`inline-flex shrink-0 items-center justify-center rounded-sm font-mono text-[10px] font-semibold uppercase tracking-tight ${dims.box} ${plateClasses} ${
          plate === "ivory-plate" || surface === "ivory"
            ? "text-[#792B33]"
            : "text-[#F3E9DE]"
        } ${className}`}
      >
        {icon.name.slice(0, 2)}
      </span>
    );
  }

  return (
    <span
      data-icon-slug={icon.slug}
      data-icon-plate={plate}
      className={`inline-flex shrink-0 items-center justify-center rounded-sm transition-transform duration-200 ${dims.box} ${plateClasses} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon.iconFile}
        alt={`${icon.name} logo`}
        width={64}
        height={64}
        loading="lazy"
        decoding="async"
        draggable={false}
        referrerPolicy="no-referrer"
        className={`${dims.img} object-contain select-none`}
      />
    </span>
  );
}
