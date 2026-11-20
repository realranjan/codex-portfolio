"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { MotionConfig } from "motion/react";
import { ChevronDown } from "lucide-react";
import { computeHeroStoryScrollState } from "@/lib/motion";
import type { SpatialControlValues } from "@/components/particle-portrait";
import {
  applyHeroStoryToDom,
  HeroCuriosityTypography,
  HeroPunchlineBrushReveal,
  useHeroCuriosityEntrance,
} from "@/components/portfolio/hero-curiosity-typography";
import {
  HeroJapaneseBackdrop,
  HeroJapaneseForeground,
} from "@/components/portfolio/hero-japanese-backdrop";
import { SiteNav } from "@/components/portfolio/site-nav";
import { ResumeModal } from "@/components/portfolio/resume-modal";
import { TornPaperPeel } from "@/components/portfolio/torn-paper-peel";
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
  const heroCuriositySlotRef = useRef<HTMLDivElement>(null);
  const heroCuriosityTextRef = useRef<HTMLSpanElement>(null);
  const heroKilledSlotRef = useRef<HTMLDivElement>(null);
  const heroKilledWordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const heroPunchlineSlotRef = useRef<HTMLDivElement>(null);
  const heroSublineRef = useRef<HTMLParagraphElement>(null);
  const heroBrushWashRef = useRef<HTMLDivElement>(null);
  const heroBrushUnderlineRef = useRef<HTMLDivElement>(null);
  const heroScrollCueRef = useRef<HTMLAnchorElement>(null);
  const heroBackdropDecorRef = useRef<HTMLDivElement>(null);
  const heroSunRef = useRef<HTMLDivElement>(null);
  const heroForegroundRef = useRef<HTMLDivElement>(null);
  const heroForegroundDecorRef = useRef<HTMLDivElement>(null);

  const spatialProgressRef = useRef<number>(0);
  const projectsProgressRef = useRef<number>(0);
  const centerMixRef = useRef<number>(0);
  const spatialControlsRef = useRef<SpatialControlValues>(DEFAULT_SPATIAL_CONTROLS);

  const [resumeOpen, setResumeOpen] = useState(false);

  // Preserved existing Hero Beat 1 entrance animation ("CURIOSITY")
  useHeroCuriosityEntrance(heroCuriosityTextRef, heroWordRef);

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

      spatialProgressRef.current = story.carouselStageProgress * 0.35;
      projectsProgressRef.current = 0;
      centerMixRef.current = 0;

      applyHeroStoryToDom(story, {
        stageRef: heroWordRef,
        curiositySlotRef: heroCuriositySlotRef,
        curiosityTextRef: heroCuriosityTextRef,
        killedSlotRef: heroKilledSlotRef,
        killedWordRefs: heroKilledWordRefs,
        punchlineSlotRef: heroPunchlineSlotRef,
        punchlineTextRef: heroSublineRef,
        brushWashRef: heroBrushWashRef,
        brushUnderlineRef: heroBrushUnderlineRef,
        scrollCueRef: heroScrollCueRef,
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
            00 / PRESERVED HERO SECTION (UNMODIFIED VISUALS, 3D SAMURAI CAT & TYPOGRAPHY)
           ═══════════════════════════════════════════════════════════════════════ */}
        <div ref={unifiedRunwayRef} className="hero-runway relative" id="top">
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
              curiositySlotRef={heroCuriositySlotRef}
              curiosityTextRef={heroCuriosityTextRef}
              killedSlotRef={heroKilledSlotRef}
              killedWordRefs={heroKilledWordRefs}
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

                <a
                  ref={heroScrollCueRef}
                  href="#about"
                  aria-label="Scroll to About chapter"
                  className="pointer-events-auto absolute bottom-0 inline-flex flex-col items-center gap-1 text-[#2B231E]/80 transition-colors hover:text-[#792B33] will-change-[opacity]"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-[18px] items-start justify-center rounded-full border-[1.5px] border-current pt-1.5"
                  >
                    <span className="h-1.5 w-[2px] rounded-full bg-current" />
                  </span>
                  <ChevronDown size={13} strokeWidth={1.8} aria-hidden="true" />
                </a>
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
           ═══════════════════════════════════════════════════════════════════════ */}

        {/* CHAPTER 01 — ABOUT & PHILOSOPHY (Story Scroll Hinged Entrance · Single Focused Page) */}
        <StoryScrollChapter
          testId="story-hinge-about"
          hinge="left"
          maxDeg={9}
          backdropColor="#F3E9DE"
        >
          <ChapterAbout />
        </StoryScrollChapter>

        {/* TRANSITION 01 -> 02 — BURGUNDY TORN-PAPER PEEL REVEALING IVORY */}
        <TornPaperPeel
          variant="burgundy-to-ivory"
          testId="torn-paper-about-to-projects"
          upperCaption="01 / About → 02 / Projects"
          lowerHint="02 · Selected Projects"
          phaseOffset={0}
        />

        {/* CHAPTER 02 — SELECTED PROJECTS (Ivory · Preserved Sticky 3D Tumble Deck) */}
        <ChapterProjects />

        {/* CHAPTER 03 — THE PLAYGROUND (Story Scroll Hinged Entrance · Ivory) */}
        <StoryScrollChapter
          testId="story-hinge-playground"
          hinge="right"
          maxDeg={8.5}
          backdropColor="#F3E9DE"
        >
          <ChapterPlayground />
        </StoryScrollChapter>

        {/* TRANSITION 03 -> 04 — IVORY TORN-PAPER PEEL REVEALING BURGUNDY */}
        <TornPaperPeel
          variant="ivory-to-burgundy"
          testId="torn-paper-playground-to-skills"
          upperCaption="03 / Playground → 04 / Skills"
          lowerHint="04 · The Art of Making Things"
          phaseOffset={2.3}
        />

        {/* CHAPTER 04 — SKILLS & TECHNOLOGY (Story Scroll Hinged Entrance · Burgundy) */}
        <StoryScrollChapter
          testId="story-hinge-skills"
          hinge="left"
          maxDeg={8}
          backdropColor="#5E1E25"
        >
          <ChapterSkills />
        </StoryScrollChapter>

        {/* TRANSITION 04 -> 05 — BURGUNDY TORN-PAPER PEEL REVEALING 3D MOUNTAIN JOURNEY */}
        <TornPaperPeel
          variant="burgundy-to-ivory"
          testId="torn-paper-skills-to-experience"
          upperCaption="04 / Skills → 05 / Experience"
          lowerHint="05 · Mountain Journey"
          phaseOffset={6.1}
        />

        {/* CHAPTER 05 — EXPERIENCE & JOURNEY (Ivory · Preserved Sticky 3D Mountain Journey) */}
        <ChapterExperience />

        {/* CHAPTER 06 — EDUCATION (Story Scroll Hinged Entrance · Burgundy) */}
        <StoryScrollChapter
          testId="story-hinge-education"
          hinge="left"
          maxDeg={8.5}
          backdropColor="#F3E9DE"
        >
          <ChapterEducation />
        </StoryScrollChapter>

        {/* CHAPTER 07 — ACHIEVEMENTS & CERTIFICATIONS (Story Scroll Hinged Entrance · Burgundy) */}
        <StoryScrollChapter
          testId="story-hinge-achievements"
          hinge="right"
          maxDeg={8}
          backdropColor="#5E1E25"
        >
          <ChapterAchievements />
        </StoryScrollChapter>

        {/* TRANSITION 07 -> 09 — BURGUNDY TORN-PAPER PEEL REVEALING FINAL IVORY FOOTER */}
        <TornPaperPeel
          variant="burgundy-to-ivory"
          testId="torn-paper-achievements-to-contact"
          upperCaption="07 / Achievements → 09 / Contact"
          lowerHint="Epilogue"
          phaseOffset={4.6}
        />

        {/* 09 / CONTACT — CINEMATIC JAPANESE SAMURAI CAT FOOTER (Ivory #F3E9DE) */}
        <ChapterContact onOpenResume={() => setResumeOpen(true)} />
      </main>

      <ResumeModal open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </MotionConfig>
  );
}
