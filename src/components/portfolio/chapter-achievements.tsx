"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_CONTENT,
  CERTIFICATIONS,
} from "@/data/portfolio-content";
import { computeSpatialSlideState, wrapIndex } from "@/lib/carousel";
import {
  ChapterHeading,
  PlaceholderVisual,
} from "@/components/portfolio/editorial-primitives";
import { SpotIllustration } from "@/components/portfolio/spot-illustration";
import mapleCutout from "@/assets/illustrations/maple-cutout.png";

type TabKind = "achievements" | "certifications";

/**
 * CHAPTER 07 — ACHIEVEMENTS & CERTIFICATIONS (Burgundy #792B33 / Ivory #F3E9DE)
 *
 * Interactive layered editorial showcase with segmented tabs for:
 * - Achievements (Achievement 001..003)
 * - Certifications (Certificate 001..003)
 *
 * Active item appears prominently in front while neighboring items remain partially
 * visible at depth. Zero fake award IDs or broken verification URLs.
 */
export function ChapterAchievements() {
  const [activeTab, setActiveTab] = useState<TabKind>("achievements");
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryIdxByItem, setGalleryIdxByItem] = useState<Record<string, number>>({});

  const items = activeTab === "achievements" ? ACHIEVEMENTS : CERTIFICATIONS;
  const count = items.length;
  const safeIndex = wrapIndex(activeIndex, count);
  const activeItem = items[safeIndex] ?? items[0];

  const handleSwitchTab = (nextTab: TabKind) => {
    setActiveTab(nextTab);
    setActiveIndex(0);
  };

  const stepGallery = (delta: number) => {
    setActiveIndex((prev) => wrapIndex(prev + delta, count));
  };

  const activeMediaIdx = galleryIdxByItem[activeItem.id] ?? 0;
  const activeMedia = activeItem.gallery[activeMediaIdx] ?? activeItem.gallery[0];

  return (
    <section
      id="achievements"
      aria-labelledby="achievements-heading"
      data-chapter-surface="burgundy"
      className="relative bg-[#792B33] text-[#F3E9DE] pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 overflow-x-clip"
    >
      {/* Quiet mirrored Japanese maple accent along lower-left breathing space */}
      <SpotIllustration
        src={mapleCutout}
        alt="Japanese autumn maple sprig accent"
        surface="burgundy"
        flipX
        parallaxY={18}
        baseRotate={14}
        rotateDelta={2.2}
        testId="achievements-maple-spot"
        className="hidden xl:block absolute bottom-10 left-[2vw] z-[2] w-[118px] opacity-90"
      />

      <div className="page-container relative z-10">
        <ChapterHeading
          id="achievements-heading"
          number={ACHIEVEMENTS_CONTENT.chapterNumber}
          label={ACHIEVEMENTS_CONTENT.chapterLabel}
          heading={ACHIEVEMENTS_CONTENT.heading}
          surface="burgundy"
          action={
            /* Segmented interactive tab bar (Achievements | Certifications) */
            <div
              role="tablist"
              aria-label="Filter recognition type"
              className="inline-flex border border-[#F3E9DE]/32 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "achievements"}
                onClick={() => handleSwitchTab("achievements")}
                data-testid="tab-achievements"
                className={`min-h-[38px] px-4 font-mono text-xs uppercase tracking-[0.14em] transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "achievements"
                    ? "bg-[#F3E9DE] text-[#792B33] font-medium"
                    : "text-[#F3E9DE]/78 hover:text-[#F3E9DE]"
                }`}
              >
                Achievements · 0{ACHIEVEMENTS.length}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "certifications"}
                onClick={() => handleSwitchTab("certifications")}
                data-testid="tab-certifications"
                className={`min-h-[38px] px-4 font-mono text-xs uppercase tracking-[0.14em] transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "certifications"
                    ? "bg-[#F3E9DE] text-[#792B33] font-medium"
                    : "text-[#F3E9DE]/78 hover:text-[#F3E9DE]"
                }`}
              >
                Certifications · 0{CERTIFICATIONS.length}
              </button>
            </div>
          }
        />

        {/* Desktop Restful Layered Showcase (Flat 2D, Zero 3D Rotation) */}
        <div
          data-testid="achievements-layered-gallery"
          className="relative mt-8 sm:mt-10"
        >
          <div className="relative hidden md:block h-[410px] lg:h-[430px] w-full overflow-visible">
            {items.map((item, idx) => {
              const state = computeSpatialSlideState(idx, safeIndex, count);
              const mediaIdx = galleryIdxByItem[item.id] ?? 0;
              const currentSlide = item.gallery[mediaIdx] ?? item.gallery[0];

              return (
                <article
                  key={item.id}
                  data-testid={`recognition-card-${item.id}`}
                  data-active={state.isActive ? "true" : "false"}
                  onClick={() => {
                    if (!state.isActive) setActiveIndex(idx);
                  }}
                  className={`absolute left-1/2 top-0 w-[min(780px,72vw)] transition-[transform,opacity] duration-300 ease-out will-change-transform ${
                    state.isActive ? "" : "cursor-pointer"
                  }`}
                  style={{
                    zIndex: state.zIndex,
                    opacity: state.opacity,
                    transform: `translate3d(calc(-50% + ${state.translateXPct * 0.84}%), ${state.translateYPx * 0.5}px, 0) scale(${state.isActive ? 1 : 0.94})`,
                  }}
                >
                  <div
                    className={`grid grid-cols-12 border bg-[#792B33] transition-colors duration-300 ${
                      state.isActive
                        ? "border-[#F3E9DE]/55 shadow-[0_24px_60px_rgba(30,8,10,0.32)]"
                        : "border-[#F3E9DE]/22"
                    }`}
                  >
                    {/* Left: Oversized Number + Certificate/Achievement Preview */}
                    <div className="col-span-6 border-r border-[#F3E9DE]/18 p-6 flex flex-col justify-between gap-4">
                      <PlaceholderVisual
                        surface="burgundy"
                        number={item.number}
                        label={currentSlide?.label ?? item.previewLabel}
                        sublabel={item.category}
                        aspectClass="aspect-[4/3]"
                        imageUrl={currentSlide?.imageUrl ?? null}
                      />

                      {item.gallery.length > 1 && state.isActive && (
                        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-[#F3E9DE]/68">
                          <span>
                            Preview 0{mediaIdx + 1} / 0{item.gallery.length}
                          </span>
                          <div className="flex gap-1">
                            {item.gallery.map((g, gIdx) => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGalleryIdxByItem((prev) => ({
                                    ...prev,
                                    [item.id]: gIdx,
                                  }));
                                }}
                                aria-label={`Show preview ${gIdx + 1} for ${item.title}`}
                                className={`h-7 px-2 font-mono text-[11px] cursor-pointer ${
                                  gIdx === mediaIdx
                                    ? "bg-[#F3E9DE] text-[#792B33]"
                                    : "border border-[#F3E9DE]/28 text-[#F3E9DE]"
                                }`}
                              >
                                0{gIdx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Editorial Details */}
                    <div className="col-span-6 p-6 lg:p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex items-baseline justify-between gap-3">
                          <span
                            className="leading-none tracking-[-0.04em] text-[#F3E9DE]"
                            style={{
                              fontFamily: "var(--font-anton), Impact, sans-serif",
                              fontSize: "clamp(48px, 5vw, 76px)",
                            }}
                          >
                            {item.number}
                          </span>
                          <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#F3E9DE]/72 tabular-nums">
                            {item.year}
                          </span>
                        </div>

                        <h3
                          className="mt-5 m-0 font-normal uppercase leading-[0.96] tracking-[-0.02em] text-[#F3E9DE]"
                          style={{
                            fontFamily: "var(--font-anton), Impact, sans-serif",
                            fontSize: "clamp(28px, 2.8vw, 42px)",
                          }}
                        >
                          {item.title}
                        </h3>

                        <p className="mt-2 m-0 font-mono text-xs uppercase tracking-[0.14em] text-[#F3E9DE]/70">
                          {item.issuer}
                        </p>

                        <p className="mt-4 m-0 text-sm sm:text-[15px] leading-relaxed text-[#F3E9DE]/82">
                          {item.description}
                        </p>
                      </div>

                      <div className="border-t border-[#F3E9DE]/18 pt-4 flex items-center justify-between gap-3">
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#F3E9DE]/60">
                          {item.category}
                        </span>

                        {item.verificationUrl ? (
                          <a
                            href={item.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[#F3E9DE] no-underline hover:underline"
                          >
                            <span>Verify</span>
                            <ArrowUpRight size={13} />
                          </a>
                        ) : (
                          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#F3E9DE]/55 shrink-0">
                            Verification · Not configured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Mobile Accessible Single-Focus Card */}
          <div className="md:hidden border border-[#F3E9DE]/32 p-5 space-y-5">
            <div className="flex items-baseline justify-between">
              <span
                className="text-5xl leading-none text-[#F3E9DE]"
                style={{ fontFamily: "var(--font-anton), Impact, sans-serif" }}
              >
                {activeItem.number}
              </span>
              <span className="font-mono text-xs text-[#F3E9DE]/72 tabular-nums">
                {activeItem.year}
              </span>
            </div>

            <PlaceholderVisual
              surface="burgundy"
              number={activeItem.number}
              label={activeMedia?.label ?? activeItem.previewLabel}
              sublabel={activeItem.category}
              aspectClass="aspect-[4/3]"
              imageUrl={activeMedia?.imageUrl ?? null}
            />

            <div>
              <h3
                className="m-0 text-3xl uppercase leading-none text-[#F3E9DE]"
                style={{ fontFamily: "var(--font-anton), Impact, sans-serif" }}
              >
                {activeItem.title}
              </h3>
              <p className="mt-1.5 m-0 font-mono text-xs text-[#F3E9DE]/70">
                {activeItem.issuer}
              </p>
              <p className="mt-3 m-0 text-sm leading-relaxed text-[#F3E9DE]/82">
                {activeItem.description}
              </p>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#F3E9DE]/20 pt-4">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-[#F3E9DE]/78 tabular-nums">
              <span>
                {activeItem.number} / 00{count}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeItem.title}</span>
            </div>

            <div className="flex items-center gap-2">
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Focus ${item.title}`}
                  aria-pressed={idx === safeIndex}
                  className={`h-10 min-w-[44px] px-2 font-mono text-xs tabular-nums transition-colors cursor-pointer ${
                    idx === safeIndex
                      ? "bg-[#F3E9DE] text-[#792B33]"
                      : "border border-[#F3E9DE]/30 text-[#F3E9DE] hover:border-[#F3E9DE]"
                  }`}
                >
                  {item.number}
                </button>
              ))}
              <button
                type="button"
                onClick={() => stepGallery(-1)}
                aria-label="Previous item"
                className="inline-flex h-10 w-10 items-center justify-center border border-[#F3E9DE]/32 text-[#F3E9DE] hover:bg-[#F3E9DE] hover:text-[#792B33] cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => stepGallery(1)}
                aria-label="Next item"
                className="inline-flex h-10 w-10 items-center justify-center border border-[#F3E9DE]/32 text-[#F3E9DE] hover:bg-[#F3E9DE] hover:text-[#792B33] cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
