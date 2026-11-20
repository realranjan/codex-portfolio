"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SKILLS_CONTENT } from "@/data/portfolio-content";
import { ChapterHeading } from "@/components/portfolio/editorial-primitives";
import { TechStackRibbon } from "@/components/portfolio/tech-ribbon";

gsap.registerPlugin(ScrollTrigger);

/**
 * CHAPTER 04 — SKILLS & TECHNOLOGY (Burgundy #792B33)
 *
 * Clean, chrome-free editorial showcase featuring the full-bleed 3-lane
 * interactive infinite SVG tech stack ribbon with geometric dot separators
 * and smooth hover-to-pause motion.
 */
export function ChapterSkills() {
  const flightBridgeRef = useRef<HTMLDivElement>(null);
  const bridgePathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const bridge = flightBridgeRef.current;
    const path = bridgePathRef.current;
    if (!bridge || !path) return;

    const length = path.getTotalLength();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = "0";
      return;
    }

    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    const ctx = gsap.context(() => {
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: bridge,
          start: "top 88%",
          end: "bottom 42%",
          scrub: true,
        },
      });
    }, flightBridgeRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      data-chapter-surface="burgundy"
      className="relative bg-[#792B33] text-[#F3E9DE] pt-12 sm:pt-16 overflow-x-clip"
    >
      <div className="page-container">
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
      <div className="pb-12 sm:pb-16">
        <TechStackRibbon surface="burgundy" />
      </div>

      {/* ── COMPACT TRANSITION TO CHAPTER 05 (EXPERIENCE): SINGLE FINE LINE BENDING INTO FLIGHT PATH ── */}
      <div
        ref={flightBridgeRef}
        aria-hidden="true"
        className="relative w-full overflow-hidden"
      >
        <div className="h-[52px] sm:h-[64px] w-full bg-[#792B33]" />
        <div className="h-[52px] sm:h-[64px] w-full bg-[#F3E9DE]" />

        <svg
          viewBox="0 0 1200 140"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 600 0 L 600 70"
            fill="none"
            stroke="#F3E9DE"
            strokeWidth="1.5"
            strokeOpacity="0.65"
          />
          <path
            ref={bridgePathRef}
            d="M 600 70 C 600 109, 340 102, 115 140"
            fill="none"
            stroke="#792B33"
            strokeWidth="1.75"
            strokeDasharray="6 6"
          />
          <circle cx="600" cy="70" r="4.5" fill="#F3E9DE" stroke="#792B33" strokeWidth="2" />
        </svg>
      </div>
    </section>
  );
}
