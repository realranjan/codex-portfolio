"use client";

import type { ReactNode } from "react";
import type { ChapterSurface } from "@/data/portfolio-content";

interface ChapterHeadingProps {
  id: string;
  number: string;
  label: string;
  heading: string;
  supportingText?: string;
  surface: ChapterSurface;
  align?: "left" | "center";
  className?: string;
  action?: ReactNode;
}

/**
 * Editorial chapter header pairing monumental condensed Anton display headings
 * with Cormorant Garamond italic supporting statements strictly in #792B33 and #F3E9DE.
 */
export function ChapterHeading({
  id,
  number,
  label,
  heading,
  supportingText,
  surface,
  align = "left",
  className = "",
  action,
}: ChapterHeadingProps) {
  const isBurgundy = surface === "burgundy";
  const ink = isBurgundy ? "text-[#F3E9DE]" : "text-[#792B33]";
  const muted = isBurgundy ? "text-[#F3E9DE]/70" : "text-[#792B33]/72";
  const rule = isBurgundy ? "border-[#F3E9DE]/20" : "border-[#792B33]/20";

  return (
    <div
      className={`border-b ${rule} pb-5 sm:pb-6 ${
        align === "center" ? "text-center" : ""
      } ${className}`}
    >
      <div
        className={`mb-3 flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-[0.2em] tabular-nums ${muted} ${
          align === "center" ? "justify-center" : "justify-between"
        }`}
      >
        <span className="inline-flex items-center gap-3">
          <span className={`font-medium ${ink}`}>Chapter {number}</span>
          <span aria-hidden="true">·</span>
          <span>{label}</span>
        </span>
        {action && align !== "center" && <div>{action}</div>}
      </div>

      <h2
        id={id}
        className={`m-0 font-normal uppercase leading-[0.88] tracking-[-0.03em] ${ink}`}
        style={{
          fontFamily: "var(--font-anton), Impact, sans-serif",
          fontSize: "clamp(42px, 6.2vw, 96px)",
          textWrap: "balance",
        }}
      >
        {heading}
      </h2>

      {supportingText && (
        <p
          className={`mt-3 max-w-[46ch] font-serif italic leading-[1.26] ${muted} ${
            align === "center" ? "mx-auto" : ""
          }`}
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(20px, 2vw, 28px)",
          }}
        >
          {supportingText}
        </p>
      )}
    </div>
  );
}

interface PlaceholderVisualProps {
  /** Large oversized index or emblem number (e.g. "01", "001") */
  number?: string;
  /** Primary editorial placeholder stamp (e.g. "PROJECT PREVIEW", "IMAGE COMING SOON") */
  label: string;
  /** Secondary category or integration note */
  sublabel?: string;
  /** Surface context of the surrounding section */
  surface: ChapterSurface;
  /** Aspect ratio utility class (e.g. "aspect-[16/10]") */
  aspectClass?: string;
  /** Optional real image URL when configured later */
  imageUrl?: string | null;
  /** Image alt text when imageUrl is present */
  imageAlt?: string;
  /** Optional custom slot attribute for future 3D/media integration */
  slotId?: string;
  className?: string;
}

/**
 * Art-directed Burgundy/Ivory placeholder composition with architectural registration marks,
 * oversized Anton numbering, and zero broken-image risk. Automatically renders a real `<img>`
 * once `imageUrl` is supplied in `src/data/portfolio-content.ts`.
 */
export function PlaceholderVisual({
  number,
  label,
  sublabel,
  surface,
  aspectClass = "aspect-[16/10]",
  imageUrl,
  imageAlt,
  slotId,
  className = "",
}: PlaceholderVisualProps) {
  const isBurgundy = surface === "burgundy";

  const frameBg = isBurgundy
    ? "bg-[#F3E9DE]/[0.06] border-[#F3E9DE]/24 text-[#F3E9DE]"
    : "bg-[#792B33]/[0.06] border-[#792B33]/24 text-[#792B33]";

  const cornerStroke = isBurgundy ? "border-[#F3E9DE]/45" : "border-[#792B33]/45";
  const lineTint = isBurgundy ? "bg-[#F3E9DE]/16" : "bg-[#792B33]/16";
  const subInk = isBurgundy ? "text-[#F3E9DE]/68" : "text-[#792B33]/70";
  const numInk = isBurgundy ? "text-[#F3E9DE]/[0.14]" : "text-[#792B33]/[0.12]";

  return (
    <div
      data-asset-slot={slotId}
      className={`relative w-full overflow-hidden border ${frameBg} ${aspectClass} ${className}`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={imageAlt ?? label}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="relative flex h-full w-full flex-col justify-between p-4 sm:p-5 select-none">
          {/* Fine architectural registration grid lines */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 ${lineTint}`}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 ${lineTint}`}
          />

          {/* Registration corner brackets */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-2.5 top-2.5 h-2.5 w-2.5 border-l border-t ${cornerStroke}`}
          />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute right-2.5 top-2.5 h-2.5 w-2.5 border-r border-t ${cornerStroke}`}
          />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-2.5 left-2.5 h-2.5 w-2.5 border-b border-l ${cornerStroke}`}
          />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-2.5 right-2.5 h-2.5 w-2.5 border-b border-r ${cornerStroke}`}
          />

          {/* Top bar metadata */}
          <div className="relative z-[1] flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-[0.16em] tabular-nums">
            <span className={subInk}>{sublabel ?? "Placeholder Asset"}</span>
            {number && <span className="font-medium">{number}</span>}
          </div>

          {/* Center oversized typographic anchor */}
          <div className="relative z-[1] my-auto flex flex-col items-center justify-center text-center py-2">
            {number && (
              <span
                aria-hidden="true"
                className={`block leading-none tracking-[-0.04em] ${numInk}`}
                style={{
                  fontFamily: "var(--font-anton), Impact, sans-serif",
                  fontSize: "clamp(48px, 6.8vw, 96px)",
                }}
              >
                {number}
              </span>
            )}
            <span className="mt-1 font-mono text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em]">
              {label}
            </span>
          </div>

          {/* Bottom registration hairline */}
          <div className="relative z-[1] flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.15em]">
            <span className={subInk}>Replace in portfolio-content.ts</span>
            <span className={subInk}>Ready</span>
          </div>
        </div>
      )}
    </div>
  );
}
