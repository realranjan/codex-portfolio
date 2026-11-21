"use client";

import { SKILLS_CONTENT } from "@/data/portfolio-content";
import { ChapterHeading } from "@/components/portfolio/editorial-primitives";
import { TechStackRibbon } from "@/components/portfolio/tech-ribbon";
import { SpotIllustration } from "@/components/portfolio/spot-illustration";
import pineCutout from "@/assets/illustrations/pine-cutout.png";

/**
 * CHAPTER 04 — SKILLS & TECHNOLOGY (Burgundy #792B33)
 *
 * Clean, chrome-free editorial showcase featuring the full-bleed 3-lane
 * interactive infinite SVG tech stack ribbon with geometric dot separators,
 * smooth hover-to-pause motion, and a subtle background-free Japanese black
 * pine bough emerging along the upper-right margin.
 */
export function ChapterSkills() {
  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      data-chapter-surface="burgundy"
      className="relative bg-[#792B33] text-[#F3E9DE] pt-36 sm:pt-44 lg:pt-48 pb-14 sm:pb-20 overflow-x-clip"
    >
      {/* Subtle Kigo-style background-free gnarled black pine bough */}
      <SpotIllustration
        src={pineCutout}
        alt="Japanese woodblock-style black pine bough illustration"
        surface="burgundy"
        parallaxY={22}
        baseRotate={3}
        rotateDelta={2.4}
        testId="skills-pine-spot"
        className="hidden md:block absolute top-32 sm:top-40 right-[3vw] lg:right-[4vw] z-[2] w-[152px] lg:w-[192px] opacity-95"
      />

      <div className="page-container relative z-10">
        <ChapterHeading
          id="skills-heading"
          number={SKILLS_CONTENT.chapterNumber}
          label={SKILLS_CONTENT.chapterLabel}
          heading={SKILLS_CONTENT.heading}
          supportingText={SKILLS_CONTENT.supportingText}
          surface="burgundy"
        />
      </div>

      {/* Full-Bleed 3-Lane Interactive Infinite Tech Stack SVG Ribbon */}
      <div className="relative z-10">
        <TechStackRibbon surface="burgundy" />
      </div>
    </section>
  );
}
