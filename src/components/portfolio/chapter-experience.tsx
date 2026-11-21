"use client";

import { JourneyScene } from "@/components/portfolio/journey/journey-scene";

/**
 * CHAPTER 05 — EXPERIENCE & JOURNEY (Ivory #F3E9DE / Burgundy #792B33)
 *
 * Interactive 2.5D Japanese Mountain Passage:
 * - Layered transparent sumi-e ink-wash scenery with genuine ridge occlusion
 * - Scroll-controlled 8-frame animated Japanese traveler cat (idle / walk / reverse)
 * - Three physically grounded stone milestones (01 iMerit, 02 Haegl Tech, 03 RYVO)
 * - Borderless editorial company typography revealed on marker hover, focus, or click
 * - Restrained vertical transition into Chapter 06 (Education) without paper-tear
 */
export function ChapterExperience() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      data-chapter-surface="ivory"
      className="relative bg-[#F3E9DE] text-[#792B33] overflow-x-clip"
    >
      {/* Top Ivory breathing clearance underneath Chapter 04's attached overhanging torn paper edge */}
      <div
        aria-hidden="true"
        className="h-[118px] sm:h-[146px] lg:h-[170px] w-full bg-[#F3E9DE]"
      />

      <JourneyScene />

      {/* Restrained transition into Chapter 06 (Education · Burgundy #792B33) */}
      <div aria-hidden="true" className="relative w-full">
        <div className="flex flex-col items-center bg-[#F3E9DE] pt-2">
          <div className="h-9 w-px bg-[#792B33]/55" />
        </div>
        <div className="flex flex-col items-center bg-[#792B33] pb-2">
          <div className="h-7 w-px bg-[#F3E9DE]/55" />
          <span className="mt-1.5 h-1.5 w-1.5 rotate-45 border border-[#F3E9DE]" />
        </div>
      </div>
    </section>
  );
}
