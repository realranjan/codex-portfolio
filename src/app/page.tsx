"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { MotionConfig } from "motion/react";
import {
  computeHeroStoryScrollState,
  type HeroStoryScrollState,
} from "@/lib/motion";
import type { SpatialControlValues } from "@/components/particle-portrait";
import {
  applyHeroStoryToDom,
  HeroCuriosityTypography,
  HeroPunchlineBrushReveal,
} from "@/components/portfolio/hero-curiosity-typography";
import {
  HeroJapaneseBackdrop,
  HeroJapaneseForeground,
} from "@/components/portfolio/hero-japanese-backdrop";
import { SiteNav } from "@/components/portfolio/site-nav";
import { ResumeModal } from "@/components/portfolio/resume-modal";
import { StoryScrollChapter } from "@/components/ui/story-scroll";
import { ChapterAbout } from "@/components/portfolio/chapter-about";
import { ChapterProjects } from "@/components/portfolio/chapter-projects";
import { ChapterPlayground } from "@/components/portfolio/chapter-playground";
import { ChapterSkills } from "@/components/portfolio/chapter-skills";
import { ChapterExperience } from "@/components/portfolio/chapter-experience";
import { ChapterEducation } from "@/components/portfolio/chapter-education";
import { ChapterAchievements } from "@/components/portfolio/chapter-achievements";
import { ChapterContact } from "@/components/portfolio/chapter-contact";

gsap.registerPlugin(ScrollTrigger);

const ParticlePortrait = dynamic(() => import("@/components/particle-portrait"), {
  ssr: false,
});

const DEFAULT_SPATIAL_CONTROLS: SpatialControlValues = {
  layerMode: "reveal",
  lightAzimuth: 0,
};

export default function Home() {
  const pageRef = useRef<HTMLElement>(null);
  const unifiedRunwayRef = useRef<HTMLDivElement>(null);
  const heroBandRef = useRef<HTMLDivElement>(null);

  const heroWordRef = useRef<HTMLDivElement>(null);
  const heroPunchlineSlotRef = useRef<HTMLDivElement>(null);
  const heroSublineRef = useRef<HTMLParagraphElement>(null);
  const heroBrushWashRef = useRef<HTMLDivElement>(null);
  const heroBrushUnderlineRef = useRef<HTMLDivElement>(null);
  const heroBackdropDecorRef = useRef<HTMLDivElement>(null);
  const heroSunRef = useRef<HTMLDivElement>(null);
  const heroForegroundRef = useRef<HTMLDivElement>(null);
  const heroForegroundDecorRef = useRef<HTMLDivElement>(null);

  const heroStoryRef = useRef<HeroStoryScrollState>(computeHeroStoryScrollState(0));
  const spatialProgressRef = useRef<number>(0);
  const projectsProgressRef = useRef<number>(0);
  const centerMixRef = useRef<number>(0);
  const spatialControlsRef = useRef<SpatialControlValues>(DEFAULT_SPATIAL_CONTROLS);

  const [resumeOpen, setResumeOpen] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cachedHeroHeight = Math.max(
      1,
      heroBandRef.current?.offsetHeight ?? window.innerHeight * 2.5
    );
    let wasPastHero = false;

    const measureHero = () => {
      cachedHeroHeight = Math.max(
        1,
        heroBandRef.current?.offsetHeight ?? window.innerHeight * 2.5
      );
    };

    const applyHeroFromScroll = () => {
      const y = window.scrollY;
      // Skip all Hero DOM mutations once scrolled well past the Hero runway
      const isPastHero = y > cachedHeroHeight + 160;
      if (isPastHero && wasPastHero) return;
      wasPastHero = isPastHero;

      const pinnedDistance = Math.max(1, cachedHeroHeight - window.innerHeight);
      const rawHero = Math.min(1, Math.max(0, y / pinnedDistance));
      const story = computeHeroStoryScrollState(rawHero);

      heroStoryRef.current = story;
      spatialProgressRef.current = story.carouselStageProgress * 0.35;
      projectsProgressRef.current = 0;
      centerMixRef.current = 0;

      applyHeroStoryToDom(story, {
        stageRef: heroWordRef,
        punchlineSlotRef: heroPunchlineSlotRef,
        punchlineTextRef: heroSublineRef,
        brushWashRef: heroBrushWashRef,
        brushUnderlineRef: heroBrushUnderlineRef,
      });

      if (heroBackdropDecorRef.current) {
        heroBackdropDecorRef.current.style.opacity = story.decorOpacity.toFixed(4);
        heroBackdropDecorRef.current.style.transform = `translate3d(0, ${story.backdropParallaxY.toFixed(1)}px, 0)`;
        heroBackdropDecorRef.current.style.visibility =
          story.decorOpacity > 0.01 ? "visible" : "hidden";
      }
      if (heroForegroundDecorRef.current) {
        heroForegroundDecorRef.current.style.opacity = story.decorOpacity.toFixed(4);
        heroForegroundDecorRef.current.style.transform = `translate3d(0, ${story.foregroundParallaxY.toFixed(1)}px, 0)`;
        heroForegroundDecorRef.current.style.visibility =
          story.decorOpacity > 0.01 ? "visible" : "hidden";
      }
      if (heroForegroundRef.current) {
        heroForegroundRef.current.style.opacity = story.mistOpacity.toFixed(3);
      }
      if (heroSunRef.current) {
        const sunOpacity = 0.28 + 0.72 * story.decorOpacity;
        heroSunRef.current.style.opacity = sunOpacity.toFixed(3);
        heroSunRef.current.style.transform = `translate3d(0, ${story.sunParallaxY.toFixed(1)}px, 0) scale(${story.sunScale.toFixed(3)})`;
      }
    };

    const handleResize = () => {
      measureHero();
      wasPastHero = false;
      applyHeroFromScroll();
      ScrollTrigger.refresh();
    };

    measureHero();
    applyHeroFromScroll();
    window.addEventListener("resize", handleResize);

    if (reduced) {
      window.addEventListener("scroll", applyHeroFromScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", applyHeroFromScroll);
        window.removeEventListener("resize", handleResize);
      };
    }

    // Single smooth-scroll loop via Lenis (zero duplicate window scroll listener overhead)
    const lenis = new Lenis({
      autoRaf: true,
      anchors: false,
      lerp: 0.11,
    });
    const syncScroll = () => {
      applyHeroFromScroll();
      ScrollTrigger.update();
    };
    lenis.on("scroll", syncScroll);

    // Refresh ScrollTrigger once dynamic hero & fonts settle
    const refreshTimer = window.setTimeout(() => {
      measureHero();
      ScrollTrigger.refresh();
    }, 280);

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("resize", handleResize);
      lenis.off("scroll", syncScroll);
      lenis.destroy();
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <SiteNav onOpenResume={() => setResumeOpen(true)} />

      <main ref={pageRef} id="main-content">
        {/* ═══════════════════════════════════════════════════════════════════════
            00 / HERO SECTION — 3D SAMURAI CAT + LIVING TYPE GARDEN BOTANICAL TYPOGRAPHY
           ═══════════════════════════════════════════════════════════════════════ */}
        <div ref={unifiedRunwayRef} className="hero-runway relative z-[5]" id="top">
          <div
            className="hero-section cursor-grab active:cursor-grabbing"
            role="region"
            aria-label="Interactive 3D samurai cat sculpture hero"
          >
            <HeroJapaneseBackdrop
              decorRef={heroBackdropDecorRef}
              sunRef={heroSunRef}
            />

            <HeroCuriosityTypography
              ref={heroWordRef}
              storyRef={heroStoryRef}
            />

            <ParticlePortrait
              spatialProgressRef={spatialProgressRef}
              projectsProgressRef={projectsProgressRef}
              centerMixRef={centerMixRef}
              controlsRef={spatialControlsRef}
            />

            <HeroJapaneseForeground
              ref={heroForegroundRef}
              decorRef={heroForegroundDecorRef}
            />

            <div className="pointer-events-none absolute inset-0 z-[25] flex flex-col justify-end pb-8 sm:pb-11">
              <div className="page-container pointer-events-none relative flex min-h-[84px] items-center justify-center">
                <HeroPunchlineBrushReveal
                  punchlineSlotRef={heroPunchlineSlotRef}
                  punchlineTextRef={heroSublineRef}
                  brushWashRef={heroBrushWashRef}
                  brushUnderlineRef={heroBrushUnderlineRef}
                />
              </div>
            </div>
          </div>

          {/* Scroll Band for the 3-Beat Hero Story (CURIOSITY -> KILLED THE CAT. -> Not this one.) */}
          <div
            ref={heroBandRef}
            aria-hidden="true"
            className="h-[270svh] md:h-[300svh] pointer-events-none"
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            POST-HERO NARRATIVE CHAPTERS (STRICT #792B33 BURGUNDY & #F3E9DE IVORY)
            Non-conflicting adjacent z-index stack so every Story Scroll sheet rises
            with bold shadow while attached torn-paper lips overhang cleanly below.
           ═══════════════════════════════════════════════════════════════════════ */}

        {/* CHAPTER 01 — ABOUT & PHILOSOPHY (Burgundy · Rises over Hero [25 > 5], torn bottom overhangs Projects [25 > 20]) */}
        <StoryScrollChapter
          testId="story-hinge-about"
          hinge="left"
          maxDeg={9}
          backdropColor="#F3E9DE"
          surfaceTone="burgundy"
          zIndex={25}
          overlapPrev
          tornBottom={{
            variant: "burgundy-to-ivory",
            testId: "torn-paper-about-to-projects",
            phaseOffset: 0,
          }}
        >
          <ChapterAbout />
        </StoryScrollChapter>

        {/* CHAPTER 02 — SELECTED PROJECTS (Ivory · Tucked cleanly under About's torn bottom [20 < 25]) */}
        <div className="relative z-[20]">
          <ChapterProjects />
        </div>

        {/* CHAPTER 03 — THE PLAYGROUND (Ivory · Rises over Projects with deep shadow [40 > 20], torn bottom overhangs Skills [40 > 35]) */}
        <StoryScrollChapter
          testId="story-hinge-playground"
          hinge="right"
          maxDeg={8.5}
          backdropColor="#F3E9DE"
          surfaceTone="ivory"
          zIndex={40}
          overlapPrev
          tornBottom={{
            variant: "ivory-to-burgundy",
            testId: "torn-paper-playground-to-skills",
            phaseOffset: 2.3,
          }}
        >
          <ChapterPlayground />
        </StoryScrollChapter>

        {/* CHAPTER 04 — SKILLS & TECHNOLOGY (Burgundy · Tucked under Playground's torn bottom [35 < 40], torn bottom overhangs Experience [35 > 30]) */}
        <StoryScrollChapter
          testId="story-hinge-skills"
          hinge="left"
          maxDeg={7.5}
          backdropColor="#5E1E25"
          surfaceTone="burgundy"
          zIndex={35}
          tornBottom={{
            variant: "burgundy-to-ivory",
            testId: "torn-paper-skills-to-experience",
            phaseOffset: 6.1,
          }}
        >
          <ChapterSkills />
        </StoryScrollChapter>

        {/* CHAPTER 05 — EXPERIENCE & JOURNEY (Ivory · Tucked under Skills' torn bottom [30 < 35]) */}
        <div className="relative z-[30]">
          <ChapterExperience />
        </div>

        {/* CHAPTER 06 — EDUCATION (Burgundy · Rises over Experience [50 > 30], recedes beneath Achievements [50 < 60]) */}
        <StoryScrollChapter
          testId="story-hinge-education"
          hinge="left"
          maxDeg={8.5}
          backdropColor="#792B33"
          surfaceTone="burgundy"
          zIndex={50}
          overlapPrev
        >
          <ChapterEducation />
        </StoryScrollChapter>

        {/* CHAPTER 07 — ACHIEVEMENTS & CERTIFICATIONS (Burgundy · Rises over Education with deep shadow [60 > 50], torn bottom overhangs Contact [60 > 55]) */}
        <StoryScrollChapter
          testId="story-hinge-achievements"
          hinge="right"
          maxDeg={8}
          backdropColor="#5E1E25"
          surfaceTone="burgundy"
          zIndex={60}
          overlapPrev
          tornBottom={{
            variant: "burgundy-to-ivory",
            testId: "torn-paper-achievements-to-contact",
            phaseOffset: 4.6,
          }}
        >
          <ChapterAchievements />
        </StoryScrollChapter>

        {/* 09 / CONTACT — CINEMATIC JAPANESE SAMURAI CAT FOOTER (Ivory · Tucked under Achievements' torn bottom [55 < 60]) */}
        <div className="relative z-[55]">
          <ChapterContact onOpenResume={() => setResumeOpen(true)} />
        </div>
      </main>

      <ResumeModal open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </MotionConfig>
  );
}
