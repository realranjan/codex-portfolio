"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  PROJECTS,
  PROJECTS_CONTENT,
  type PortfolioProject,
} from "@/data/portfolio-content";
import { wrapIndex } from "@/lib/carousel";
import {
  computeTumbleScrollPosition,
  getTumbleProjectAnchorProgress,
} from "@/lib/tumble-deck";
import {
  CameraProgressRule,
  useIsDesktop,
  usePrefersReducedMotion,
} from "@/components/portfolio/camera-primitives";
import {
  ChapterHeading,
  PlaceholderVisual,
} from "@/components/portfolio/editorial-primitives";
import TumbleDeckShowcase, {
  type TumbleDeckHandle,
} from "@/components/ui/tumble-deck-showcase";
import { SpotIllustration } from "@/components/portfolio/spot-illustration";
import craneCutout from "@/assets/illustrations/crane-cutout.png";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Editorial folio plate rendered inside each 3D tumbling deck card.
 * Designed so both the peeking top index header (visible in the receding stack)
 * and the upright full spread (visible at the front) remain crisp in strict
 * Warm Ivory (#F3E9DE) & Burgundy (#792B33).
 */
function ProjectTumblePlate({
  project,
  isActive,
  compact = false,
}: {
  project: PortfolioProject;
  isActive: boolean;
  compact?: boolean;
}) {
  const hasImage = Boolean(project.heroImageUrl);

  return (
    <div
      data-testid={compact ? undefined : `project-slide-${project.number}`}
      data-active={isActive ? "true" : "false"}
      className="relative flex h-full w-full flex-col bg-[#F3E9DE] text-[#792B33]"
    >
      {/* Top Archival Folio Tab Bar — receding cards show title on peeking tab; active plate avoids repeating its display heading */}
      <div
        className={`flex shrink-0 items-center justify-between gap-3 border-b border-[#792B33]/22 ${
          compact ? "h-7 px-3" : "h-9 px-4"
        } ${isActive ? "bg-[#792B33] text-[#F3E9DE]" : "bg-[#EADCCF] text-[#792B33]"} transition-colors duration-200`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`font-mono font-semibold tabular-nums tracking-[0.14em] ${
              compact ? "text-[10px]" : "text-[11px]"
            }`}
          >
            {project.number}
          </span>
          {(!isActive || hasImage) && (
            <>
              <span
                aria-hidden="true"
                className={isActive ? "text-[#F3E9DE]/40" : "text-[#792B33]/35"}
              >
                ·
              </span>
              <span
                className={`truncate font-mono uppercase tracking-[0.14em] ${
                  compact ? "text-[9px]" : "text-[11px]"
                } ${isActive ? "text-[#F3E9DE]" : "text-[#792B33]/88"}`}
              >
                {project.title}
              </span>
            </>
          )}
        </div>

        <span
          className={`shrink-0 truncate font-mono uppercase tracking-[0.14em] ${
            compact ? "text-[8.5px]" : "text-[10px]"
          } ${isActive ? "text-[#F3E9DE]/86" : "text-[#792B33]/68"}`}
        >
          {project.category}
        </span>
      </div>

      {/* Main Card Spread */}
      {hasImage ? (
        <div className="relative flex-1 overflow-hidden bg-[#EFE3D5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.heroImageUrl ?? ""}
            alt={`${project.title} preview`}
            draggable={false}
            className="h-full w-full object-cover object-top pointer-events-none"
          />
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-12 overflow-hidden">
          {/* Left Editorial Column */}
          <div
            className={`${compact ? "col-span-7 p-3" : "col-span-5 p-5"} flex flex-col justify-between border-r border-[#792B33]/18`}
          >
            <div className="min-w-0">
              <h3
                className="m-0 font-normal uppercase leading-[0.94] tracking-[-0.02em] text-[#792B33]"
                style={{
                  fontFamily: "var(--font-anton), Impact, sans-serif",
                  fontSize: compact ? "clamp(18px, 4.8vw, 24px)" : "clamp(26px, 2.5vw, 38px)",
                }}
              >
                {project.title}
              </h3>

              <p
                className={`m-0 text-[#792B33]/82 ${
                  compact
                    ? "mt-1.5 text-[11px] leading-snug"
                    : "mt-3 line-clamp-3 text-[13px] leading-relaxed"
                }`}
              >
                {project.shortDescription}
              </p>
            </div>

            <div className="border-t border-[#792B33]/16 pt-2">
              <p
                className={`m-0 font-mono text-[#792B33]/72 ${
                  compact ? "text-[8.5px] leading-[1.35]" : "text-[10px] leading-relaxed"
                }`}
              >
                {project.technologies.join(" · ")}
              </p>
            </div>
          </div>

          {/* Right Architectural Preview Plate */}
          <div
            className={`${compact ? "col-span-5 p-2.5" : "col-span-7 p-5"} relative flex items-center justify-center overflow-hidden bg-[#EFE3D5]`}
          >
            {/* Fine architectural hairline grid */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #792B33 1px, transparent 1px), linear-gradient(to bottom, #792B33 1px, transparent 1px)",
                backgroundSize: compact ? "20px 20px" : "30px 30px",
              }}
            />

            <div
              className={`relative z-10 flex w-full max-w-[86%] items-center justify-center border border-[#792B33]/28 bg-[#F3E9DE]/90 text-center ${
                compact ? "px-2.5 py-3.5" : "px-4 py-5"
              }`}
            >
              <span
                className={`font-mono uppercase tracking-[0.16em] text-[#792B33]/85 ${
                  compact ? "text-[8.5px]" : "text-[11px]"
                }`}
              >
                {project.previewLabel}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * CHAPTER 02 — SELECTED PROJECTS (Ivory #F3E9DE / Burgundy #792B33)
 *
 * Interactive 3D Tumble Deck showcase:
 * - Desktop (>= 1024px, normal motion): Pinned GSAP ScrollTrigger drives the
 *   3D bottom-hinged tumbling deck through all 4 project plates (`01 -> 04`)
 *   and releases cleanly into Chapter 03 with zero scroll trap.
 * - Controls: Vertical scroll, Prev/Next buttons, direct `01..04` buttons,
 *   keyboard arrows, clicking stacked cards behind to focus, clicking the front
 *   card or `Open Case` to launch the fullscreen Case Study Overlay (`Escape` closes).
 * - Mobile (< 1024px): Unpinned, horizontal-swipe + button-controlled 3D Tumble Deck
 *   with zero vertical scroll trap and zero horizontal overflow.
 * - Reduced Motion: Static readable 2-column gallery grid with full Case Study Overlay.
 */
export function ChapterProjects() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinStageRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const desktopDeckRef = useRef<TumbleDeckHandle>(null);
  const mobileDeckRef = useRef<TumbleDeckHandle>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [openProjectIndex, setOpenProjectIndex] = useState<number | null>(null);
  const [gallerySlideIdx, setGallerySlideIdx] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const isDesktop = useIsDesktop(1024);
  const showPinnedDesktop = isDesktop && !reducedMotion;

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  const count = PROJECTS.length;
  const activeProject = PROJECTS[activeIndex] ?? PROJECTS[0];
  const openProject: PortfolioProject | null =
    openProjectIndex !== null ? (PROJECTS[openProjectIndex] ?? null) : null;

  const applyScrollProgress = useCallback(
    (rawProgress: number) => {
      const pos = computeTumbleScrollPosition(rawProgress, count);
      desktopDeckRef.current?.setPosition(pos);
      mobileDeckRef.current?.setPosition(pos);

      if (pinStageRef.current) {
        pinStageRef.current.dataset.cameraProgress = rawProgress.toFixed(3);
        pinStageRef.current.dataset.deckPos = pos.toFixed(3);
      }

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${Math.max(0, Math.min(1, rawProgress)).toFixed(4)})`;
      }
    },
    [count]
  );

  // Pinned desktop 3D Tumble Deck scroll journey (mounts/unmounts cleanly across breakpoints)
  useIsomorphicLayoutEffect(() => {
    const pinEl = pinStageRef.current;
    if (!pinEl || !showPinnedDesktop) return;

    const ctx = gsap.context(() => {
      applyScrollProgress(0);

      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: pinEl,
        start: "top top",
        end: "+=175%",
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          applyScrollProgress(self.progress);
        },
      });
    }, sectionRef);

    return () => {
      scrollTriggerRef.current = null;
      ctx.revert();
    };
  }, [applyScrollProgress, showPinnedDesktop]);

  const navigateToProject = useCallback(
    (targetIdx: number) => {
      const clampedIdx = Math.max(0, Math.min(count - 1, targetIdx));
      const st = scrollTriggerRef.current;

      if (st && window.matchMedia("(min-width: 1024px)").matches && !reducedMotion) {
        const anchor = getTumbleProjectAnchorProgress(clampedIdx, count);
        const targetScrollY = st.start + (st.end - st.start) * anchor;
        window.scrollTo({ top: targetScrollY, behavior: "smooth" });
        applyScrollProgress(anchor);
      } else {
        mobileDeckRef.current?.animateTo(clampedIdx);
        setActiveIndex(clampedIdx);
      }
    },
    [count, reducedMotion, applyScrollProgress]
  );

  const stepProject = useCallback(
    (delta: number) => {
      const nextIdx = Math.max(0, Math.min(count - 1, activeIndex + delta));
      navigateToProject(nextIdx);
    },
    [activeIndex, count, navigateToProject]
  );

  const openCaseStudy = useCallback((idx: number, triggerEl?: HTMLElement | null) => {
    lastTriggerRef.current = triggerEl ?? null;
    setGallerySlideIdx(0);
    setOpenProjectIndex(idx);
  }, []);

  const closeCaseStudy = useCallback(() => {
    setOpenProjectIndex(null);
    window.requestAnimationFrame(() => {
      lastTriggerRef.current?.focus();
    });
  }, []);

  // Keyboard navigation inside Case Study Overlay (Escape, Left/Right)
  useEffect(() => {
    if (openProjectIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCaseStudy();
      } else if (e.key === "ArrowRight") {
        setGallerySlideIdx(0);
        setOpenProjectIndex((prev) => (prev === null ? null : wrapIndex(prev + 1, count)));
      } else if (e.key === "ArrowLeft") {
        setGallerySlideIdx(0);
        setOpenProjectIndex((prev) => (prev === null ? null : wrapIndex(prev - 1, count)));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openProjectIndex, closeCaseStudy, count]);

  const handleStageKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      stepProject(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepProject(-1);
    }
  };

  const renderDesktopCard = useCallback(
    (project: PortfolioProject, _idx: number, isActive: boolean) => (
      <ProjectTumblePlate project={project} isActive={isActive} />
    ),
    []
  );

  const renderMobileCard = useCallback(
    (project: PortfolioProject, _idx: number, isActive: boolean) => (
      <ProjectTumblePlate project={project} isActive={isActive} compact />
    ),
    []
  );

  return (
    <section
      ref={sectionRef}
      id="projects"
      aria-labelledby="projects-heading"
      data-chapter-surface="ivory"
      className="relative bg-[#F3E9DE] text-[#792B33] overflow-x-clip"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP PINNED 3D TUMBLE DECK SHOWCASE (>= 1024px)
          Vertical scroll tips each project card forward on its bottom floor hinge
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className={showPinnedDesktop ? "block" : "hidden"}>
        <div
          ref={pinStageRef}
          tabIndex={showPinnedDesktop ? 0 : -1}
          role={showPinnedDesktop ? "region" : undefined}
          aria-roledescription={showPinnedDesktop ? "3D tumbling project deck" : undefined}
          aria-label={showPinnedDesktop ? "Selected Projects 3D tumble deck" : undefined}
          onKeyDown={showPinnedDesktop ? handleStageKeyDown : undefined}
          data-testid={showPinnedDesktop ? "projects-camera-stage" : undefined}
          data-camera-progress="0.000"
          data-deck-pos="0.000"
          data-active-project={String(activeIndex + 1)}
          className={
            showPinnedDesktop
              ? "relative flex h-[100svh] min-h-[640px] w-full flex-col justify-between bg-[#F3E9DE] pt-[76px] pb-4 focus-visible:outline-none"
              : ""
          }
        >
          {showPinnedDesktop && (
            <>
          {/* Compact Editorial Header Strip */}
          <div className="page-container relative z-10 flex items-end justify-between gap-6 border-b border-[#792B33]/18 pb-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#792B33]/68 tabular-nums">
                <span>Chapter {PROJECTS_CONTENT.chapterNumber}</span>
                <span aria-hidden="true">·</span>
                <span>{PROJECTS_CONTENT.chapterLabel}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-6">
                <h2
                  id="projects-heading"
                  className="m-0 font-normal uppercase leading-[0.9] tracking-[-0.03em] text-[#792B33]"
                  style={{
                    fontFamily: "var(--font-anton), Impact, sans-serif",
                    fontSize: "clamp(36px, 3.8vw, 54px)",
                  }}
                >
                  {PROJECTS_CONTENT.heading}
                </h2>
                <p className="m-0 hidden xl:block text-sm text-[#792B33]/72 max-w-[38ch]">
                  {PROJECTS_CONTENT.supportingText}
                </p>
              </div>
            </div>

            <div className="relative flex items-end gap-5 shrink-0">
              {/* Subtle Kigo-style background-free gliding crane accent */}
              <SpotIllustration
                src={craneCutout}
                alt="Gliding red-crowned Japanese crane illustration"
                surface="ivory"
                parallaxY={14}
                baseRotate={-4}
                rotateDelta={2.5}
                testId="projects-crane-spot"
                className="hidden lg:block w-[108px] xl:w-[126px] -my-6 -mr-1 opacity-95"
              />
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span
                  data-testid="projects-camera-counter"
                  className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33] tabular-nums"
                >
                  {activeProject.number} / 0{count}
                </span>
                <CameraProgressRule
                  barRef={progressBarRef}
                  surface="ivory"
                  className="w-36"
                />
              </div>
            </div>
          </div>

          {/* 3D Bottom-Hinged Tumble Deck Stage */}
          <div className="relative flex-1 min-h-[420px] w-full">
            <TumbleDeckShowcase
              cards={PROJECTS}
              deckRef={desktopDeckRef}
              scrollMode="external"
              loop={false}
              depth={4}
              aspect={1.96}
              height="100%"
              heightRatio={0.51}
              background="#F3E9DE"
              shadeColor="#792B33"
              showFloorLine
              testId="projects-tumble-deck"
              ariaLabel="Selected Projects 3D Tumble Deck"
              onActiveIndexChange={setActiveIndex}
              onCardClick={(idx, el) => openCaseStudy(idx, el)}
              onSelectCard={(idx) => navigateToProject(idx)}
              renderCard={renderDesktopCard}
            />
          </div>

          {/* Bottom Deck Controls Bar (Single primary CTA + project index) */}
          <div className="page-container relative z-10 flex items-center justify-between gap-4 border-t border-[#792B33]/18 pt-3.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#792B33]/60 truncate">
              Scroll to flip · Click front plate to open case study
            </span>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => openCaseStudy(activeIndex, e.currentTarget)}
                aria-label={`Open case study for ${activeProject.title}`}
                className="mr-2 inline-flex h-9 items-center gap-1.5 border border-[#792B33] bg-[#792B33] px-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#F3E9DE] transition-colors hover:bg-[#F3E9DE] hover:text-[#792B33] cursor-pointer whitespace-nowrap"
              >
                <span>Open Case</span>
                <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" />
              </button>

              <div className="flex items-center gap-1 mr-1.5" role="group" aria-label="Select project">
                {PROJECTS.map((p, idx) => {
                  const isCurrent = idx === activeIndex;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => navigateToProject(idx)}
                      aria-label={`Show ${p.title}`}
                      aria-pressed={isCurrent}
                      className={`h-9 min-w-[38px] px-2.5 font-mono text-xs tabular-nums transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-[#792B33] text-[#F3E9DE]"
                          : "border border-[#792B33]/28 text-[#792B33] hover:border-[#792B33]"
                      }`}
                    >
                      {p.number}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => stepProject(-1)}
                disabled={activeIndex === 0}
                aria-label="Previous project"
                className="inline-flex h-9 w-9 items-center justify-center border border-[#792B33]/32 text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft size={17} strokeWidth={1.7} />
              </button>

              <button
                type="button"
                onClick={() => stepProject(1)}
                disabled={activeIndex === count - 1}
                aria-label="Next project"
                className="inline-flex h-9 w-9 items-center justify-center border border-[#792B33]/32 text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight size={17} strokeWidth={1.7} />
              </button>
            </div>
          </div>
            </>
          )}
        </div>
      </div>

      {!showPinnedDesktop && (reducedMotion ? (
        <div
          data-testid="projects-static-gallery"
          className="page-container pt-12 pb-14 space-y-8"
        >
          <ChapterHeading
            id="projects-heading"
            number={PROJECTS_CONTENT.chapterNumber}
            label={PROJECTS_CONTENT.chapterLabel}
            heading={PROJECTS_CONTENT.heading}
            supportingText={PROJECTS_CONTENT.supportingText}
            surface="ivory"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PROJECTS.map((project, idx) => (
              <article
                key={project.id}
                className="border border-[#792B33]/30 bg-[#F3E9DE] p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className="text-5xl leading-none text-[#792B33]"
                      style={{ fontFamily: "var(--font-anton), Impact, sans-serif" }}
                    >
                      {project.number}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#792B33]/70">
                      {project.category}
                    </span>
                  </div>

                  <PlaceholderVisual
                    surface="ivory"
                    number={project.number}
                    label={project.previewLabel}
                    sublabel={project.category}
                    aspectClass="aspect-[16/10]"
                    imageUrl={project.heroImageUrl}
                  />

                  <h3
                    className="m-0 text-3xl uppercase leading-none text-[#792B33]"
                    style={{ fontFamily: "var(--font-anton), Impact, sans-serif" }}
                  >
                    {project.title}
                  </h3>
                  <p className="m-0 text-sm leading-relaxed text-[#792B33]/80">
                    {project.shortDescription}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => openCaseStudy(idx, e.currentTarget)}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 bg-[#792B33] px-4 py-2 text-xs font-mono uppercase tracking-[0.14em] text-[#F3E9DE] cursor-pointer"
                >
                  <span>Open Case Study</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div
          data-testid="projects-mobile-carousel"
          className="page-container pt-10 pb-12"
        >
          <ChapterHeading
            id="projects-heading"
            number={PROJECTS_CONTENT.chapterNumber}
            label={PROJECTS_CONTENT.chapterLabel}
            heading={PROJECTS_CONTENT.heading}
            supportingText={PROJECTS_CONTENT.supportingText}
            surface="ivory"
            action={
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#792B33]/72">
                Swipe or Select
              </span>
            }
          />

          {/* Compact Mobile 3D Tumble Deck (horizontal swipe + buttons, vertical scroll stays native) */}
          <div className="mt-5 -mx-2 sm:mx-0">
            <TumbleDeckShowcase
              cards={PROJECTS}
              deckRef={mobileDeckRef}
              scrollMode="external"
              swipeAxis="x"
              loop={false}
              depth={3}
              aspect={1.58}
              height="clamp(275px, 39vh, 350px)"
              heightRatio={0.54}
              background="#F3E9DE"
              shadeColor="#792B33"
              showFloorLine
              testId="projects-mobile-tumble-deck"
              ariaLabel="Selected Projects mobile 3D tumble deck"
              onActiveIndexChange={setActiveIndex}
              onCardClick={(idx, el) => openCaseStudy(idx, el)}
              onSelectCard={(idx) => navigateToProject(idx)}
              renderCard={renderMobileCard}
            />
          </div>

          {/* Primary Action + Compact Controls Bar (Zero duplicated card copy) */}
          <div className="mt-3 space-y-4">
            <button
              type="button"
              onClick={(e) => openCaseStudy(activeIndex, e.currentTarget)}
              className="w-full inline-flex min-h-[44px] items-center justify-center gap-2 bg-[#792B33] px-5 py-3 text-xs font-mono uppercase tracking-[0.16em] text-[#F3E9DE] cursor-pointer"
            >
              <span>Open Case Study · {activeProject.title}</span>
              <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#792B33]/20 pt-4">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#792B33] tabular-nums">
                {activeProject.number} / 0{count}
              </span>

              <div className="flex items-center gap-1.5">
                {PROJECTS.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigateToProject(idx)}
                    aria-label={`Show ${p.title}`}
                    aria-pressed={idx === activeIndex}
                    className={`h-10 min-w-[40px] px-2 font-mono text-xs tabular-nums ${
                      idx === activeIndex
                        ? "bg-[#792B33] text-[#F3E9DE]"
                        : "border border-[#792B33]/28 text-[#792B33]"
                    }`}
                  >
                    {p.number}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => stepProject(-1)}
                  disabled={activeIndex === 0}
                  aria-label="Previous project"
                  className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/32 text-[#792B33] disabled:opacity-35"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => stepProject(1)}
                  disabled={activeIndex === count - 1}
                  aria-label="Next project"
                  className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/32 text-[#792B33] disabled:opacity-35"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ── FULLSCREEN EDITORIAL PROJECT CASE STUDY OVERLAY ── */}
      {openProject && openProjectIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-overlay-title"
          data-testid="project-case-overlay"
          className="fixed inset-0 z-[80] flex flex-col bg-[#F3E9DE] text-[#792B33] overflow-y-auto"
        >
          {/* Sticky top bar inside overlay */}
          <div className="sticky top-0 z-10 border-b border-[#792B33]/20 bg-[#F3E9DE]/95">
            <div className="page-container flex h-16 items-center justify-between gap-4">
              <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] tabular-nums">
                <span>
                  Project {openProject.number} / 0{count}
                </span>
                <span aria-hidden="true">·</span>
                <span className="hidden sm:inline text-[#792B33]/70">
                  {openProject.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGallerySlideIdx(0);
                    setOpenProjectIndex(wrapIndex(openProjectIndex - 1, count));
                  }}
                  aria-label="Previous project case study"
                  className="inline-flex h-10 items-center gap-1.5 border border-[#792B33]/28 px-3 text-xs font-mono uppercase tracking-[0.12em] text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGallerySlideIdx(0);
                    setOpenProjectIndex(wrapIndex(openProjectIndex + 1, count));
                  }}
                  aria-label="Next project case study"
                  className="inline-flex h-10 items-center gap-1.5 border border-[#792B33]/28 px-3 text-xs font-mono uppercase tracking-[0.12em] text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeCaseStudy}
                  aria-label="Close project details"
                  className="inline-flex h-10 items-center gap-1.5 bg-[#792B33] px-4 text-xs font-mono uppercase tracking-[0.14em] text-[#F3E9DE] hover:bg-[#792B33]/88 cursor-pointer"
                >
                  <span>Close</span>
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Overlay Editorial Body */}
          <div className="page-container py-10 sm:py-16 space-y-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#792B33]/68">
                  Case Study {openProject.number} · {openProject.category}
                </p>
                <h2
                  id="project-overlay-title"
                  className="mt-3 m-0 font-normal uppercase leading-[0.88] tracking-[-0.03em] text-[#792B33]"
                  style={{
                    fontFamily: "var(--font-anton), Impact, sans-serif",
                    fontSize: "clamp(48px, 7.2vw, 112px)",
                  }}
                >
                  {openProject.title}
                </h2>
              </div>

              <div className="lg:col-span-5 flex flex-wrap gap-3 lg:justify-end">
                {openProject.demoUrl ? (
                  <a
                    href={openProject.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-2 bg-[#792B33] px-5 py-2.5 text-xs font-mono uppercase tracking-[0.14em] text-[#F3E9DE] no-underline"
                  >
                    <span>Live Demo</span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                ) : (
                  <span className="inline-flex min-h-[44px] items-center border border-dashed border-[#792B33]/38 px-4 py-2 text-xs font-mono uppercase tracking-[0.12em] text-[#792B33]/62">
                    Demo Link · Not configured
                  </span>
                )}

                {openProject.githubUrl ? (
                  <a
                    href={openProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-2 border border-[#792B33] px-5 py-2.5 text-xs font-mono uppercase tracking-[0.14em] text-[#792B33] no-underline"
                  >
                    <span>GitHub</span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                ) : (
                  <span className="inline-flex min-h-[44px] items-center border border-dashed border-[#792B33]/38 px-4 py-2 text-xs font-mono uppercase tracking-[0.12em] text-[#792B33]/62">
                    GitHub · Not configured
                  </span>
                )}
              </div>
            </div>

            <PlaceholderVisual
              surface="ivory"
              number={openProject.number}
              label={`HERO SCREENSHOT · ${openProject.title.toUpperCase()}`}
              sublabel="Hero Media Placeholder"
              aspectClass="aspect-[16/8]"
              imageUrl={openProject.heroImageUrl}
              imageAlt={`${openProject.title} hero`}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-[#792B33]/20 pt-10">
              <div className="space-y-3">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#792B33]/68">
                  01. Overview
                </h3>
                <p className="m-0 text-base leading-relaxed text-[#792B33]/88">
                  {openProject.caseStudy.overview}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#792B33]/68">
                  02. Problem
                </h3>
                <p className="m-0 text-base leading-relaxed text-[#792B33]/88">
                  {openProject.caseStudy.problem}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#792B33]/68">
                  03. Approach
                </h3>
                <p className="m-0 text-base leading-relaxed text-[#792B33]/88">
                  {openProject.caseStudy.approach}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#792B33]/68">
                  04. Solution
                </h3>
                <p className="m-0 text-base leading-relaxed text-[#792B33]/88">
                  {openProject.caseStudy.solution}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 border-t border-[#792B33]/20 pt-10">
              <div className="lg:col-span-7 space-y-4">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#792B33]/68">
                  05. Technical Architecture
                </h3>
                <ol className="m-0 list-none space-y-3 p-0">
                  {openProject.caseStudy.technicalArchitecture.map((item, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[36px_1fr] gap-3 border-b border-[#792B33]/14 pb-3 text-sm sm:text-base text-[#792B33]/86"
                    >
                      <span className="font-mono text-xs text-[#792B33]/60 tabular-nums pt-1">
                        0{i + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-3">
                  <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#792B33]/68">
                    06. Technology Stack
                  </h3>
                  <p className="m-0 font-mono text-sm leading-loose text-[#792B33]">
                    {openProject.technologies.join(" · ")}
                  </p>
                </div>

                <div className="space-y-3 border-t border-[#792B33]/16 pt-6">
                  <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#792B33]/68">
                    07. Challenges &amp; Lessons Learned
                  </h3>
                  <ul className="m-0 list-none space-y-3 p-0 text-sm sm:text-base text-[#792B33]/86">
                    {openProject.caseStudy.challengesAndLessons.map((lesson, i) => (
                      <li key={i} className="leading-relaxed">
                        — {lesson}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-[#792B33]/20 pt-10 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#792B33]/68">
                  08. Gallery · {String(gallerySlideIdx + 1).padStart(2, "0")} /{" "}
                  {String(openProject.caseStudy.gallery.length).padStart(2, "0")}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setGallerySlideIdx((prev) =>
                        wrapIndex(prev - 1, openProject.caseStudy.gallery.length)
                      )
                    }
                    aria-label="Previous gallery screenshot"
                    className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/32 text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGallerySlideIdx((prev) =>
                        wrapIndex(prev + 1, openProject.caseStudy.gallery.length)
                      )
                    }
                    aria-label="Next gallery screenshot"
                    className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/32 text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {(() => {
                const slide =
                  openProject.caseStudy.gallery[gallerySlideIdx] ??
                  openProject.caseStudy.gallery[0];
                if (!slide) return null;
                return (
                  <div className="space-y-3">
                    <PlaceholderVisual
                      surface="ivory"
                      number={`0${gallerySlideIdx + 1}`}
                      label={slide.label}
                      sublabel={openProject.title}
                      aspectClass="aspect-[16/9]"
                      imageUrl={slide.imageUrl}
                      imageAlt={slide.caption}
                    />
                    <p className="m-0 font-mono text-xs text-[#792B33]/72">
                      {slide.caption}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
