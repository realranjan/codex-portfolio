"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
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
import { resolveDragStep, wrapIndex } from "@/lib/carousel";
import {
  computeProjectsCameraState,
  getProjectCameraAnchorProgress,
} from "@/lib/camera-system";
import {
  CameraProgressRule,
  CameraStage,
  ParallaxLayer,
  usePrefersReducedMotion,
} from "@/components/portfolio/camera-primitives";
import {
  ChapterHeading,
  PlaceholderVisual,
} from "@/components/portfolio/editorial-primitives";

gsap.registerPlugin(ScrollTrigger);

/**
 * CHAPTER 02 — SELECTED PROJECTS (Ivory #F3E9DE / Burgundy #792B33)
 *
 * PRIMARY cinematic camera interaction:
 * - Desktop (>= 1024px, normal motion): Pinned ScrollTrigger exhibition stage where
 *   vertical scroll glides the viewpoint sideways across 4 large real-HTML project
 *   panels arranged in restrained 2.5D perspective (rotations strictly <= 3.5deg,
 *   modest depth scale 0.85..1.00, smooth dwell settle at each active project).
 * - Controls: Vertical scroll, Prev/Next buttons, direct 01..04 buttons, keyboard
 *   arrows, clicking side panels to focus, clicking active panel for Case Study Overlay,
 *   Escape to close overlay.
 * - Mobile (< 1024px): Unpinned touch-swipeable project exhibition carousel.
 * - Reduced Motion: Static readable 2-column gallery grid with full Case Study Overlay.
 */
export function ChapterProjects() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinStageRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  // Direct DOM refs for 60fps zero-re-render camera scrub
  const panelRefs = useRef<Array<HTMLElement | null>>([]);
  const backdropGridRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [openProjectIndex, setOpenProjectIndex] = useState<number | null>(null);
  const [gallerySlideIdx, setGallerySlideIdx] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  const lastActiveIdxRef = useRef(0);
  const dragStartXRef = useRef<number | null>(null);
  const dragDeltaXRef = useRef<number>(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  const count = PROJECTS.length;
  const activeProject = PROJECTS[activeIndex] ?? PROJECTS[0];
  const openProject: PortfolioProject | null =
    openProjectIndex !== null ? (PROJECTS[openProjectIndex] ?? null) : null;

  const applyCameraToDom = useCallback(
    (rawProgress: number) => {
      const camera = computeProjectsCameraState(rawProgress, count);

      if (pinStageRef.current) {
        pinStageRef.current.dataset.cameraProgress = camera.rawProgress.toFixed(3);
        pinStageRef.current.dataset.activeProject = String(camera.activeIndex + 1);
      }

      if (backdropGridRef.current) {
        backdropGridRef.current.style.transform = `translate3d(${camera.backdropShiftXPx.toFixed(2)}px, 0, 0)`;
      }

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${camera.rawProgress.toFixed(4)})`;
      }

      for (let i = 0; i < camera.panels.length; i++) {
        const el = panelRefs.current[i];
        const pose = camera.panels[i];
        if (!el || !pose) continue;

        el.style.zIndex = String(pose.zIndex);
        el.style.opacity = pose.opacity.toFixed(4);
        el.style.transform = `translate3d(calc(-50% + ${pose.translateXPct.toFixed(3)}%), ${pose.translateYPx.toFixed(2)}px, ${pose.translateZPx.toFixed(2)}px) scale(${pose.scale.toFixed(4)}) rotateY(${pose.rotateYDeg.toFixed(3)}deg)`;
        el.style.pointerEvents = pose.opacity > 0.2 ? "auto" : "none";
        el.dataset.active = pose.isActive ? "true" : "false";
      }

      if (lastActiveIdxRef.current !== camera.activeIndex) {
        lastActiveIdxRef.current = camera.activeIndex;
        setActiveIndex(camera.activeIndex);
      }
    },
    [count]
  );

  // Pinned desktop sideways camera journey (useLayoutEffect ensures GSAP unwraps pin-spacer before React commits)
  useIsomorphicLayoutEffect(() => {
    const pinEl = pinStageRef.current;
    if (!pinEl || reducedMotion) return;

    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) return;

    const ctx = gsap.context(() => {
      applyCameraToDom(0);

      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: pinEl,
        start: "top top",
        end: "+=270%",
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          applyCameraToDom(self.progress);
        },
      });
    }, sectionRef);

    return () => {
      scrollTriggerRef.current = null;
      ctx.revert();
    };
  }, [applyCameraToDom, reducedMotion]);

  const navigateToProject = useCallback(
    (targetIdx: number) => {
      const clampedIdx = Math.max(0, Math.min(count - 1, targetIdx));
      const st = scrollTriggerRef.current;

      if (st && window.matchMedia("(min-width: 1024px)").matches && !reducedMotion) {
        const anchor = getProjectCameraAnchorProgress(clampedIdx, count);
        const targetScrollY = st.start + (st.end - st.start) * anchor;
        window.scrollTo({ top: targetScrollY, behavior: "smooth" });
        applyCameraToDom(anchor);
      } else {
        lastActiveIdxRef.current = clampedIdx;
        setActiveIndex(clampedIdx);
      }
    },
    [count, reducedMotion, applyCameraToDom]
  );

  const stepProject = useCallback(
    (delta: number) => {
      const st = scrollTriggerRef.current;
      if (st && window.matchMedia("(min-width: 1024px)").matches && !reducedMotion) {
        const nextIdx = Math.max(0, Math.min(count - 1, activeIndex + delta));
        navigateToProject(nextIdx);
      } else {
        setActiveIndex((prev) => wrapIndex(prev + delta, count));
      }
    },
    [activeIndex, count, navigateToProject, reducedMotion]
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

  // Touch swipe handlers for mobile & tablet exhibition carousel
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest("button, a")) return;
    dragStartXRef.current = e.clientX;
    dragDeltaXRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current === null) return;
    dragDeltaXRef.current = e.clientX - dragStartXRef.current;
  };

  const handlePointerEnd = () => {
    if (dragStartXRef.current === null) return;
    const step = resolveDragStep(dragDeltaXRef.current, 48);
    if (step !== 0) {
      stepProject(step);
    }
    dragStartXRef.current = null;
    dragDeltaXRef.current = 0;
  };

  const handleStageKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      stepProject(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepProject(-1);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="projects"
      aria-labelledby="projects-heading"
      data-chapter-surface="ivory"
      className="relative bg-[#F3E9DE] text-[#792B33] overflow-x-clip"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP PINNED CINEMATIC SIDEWAYS CAMERA EXHIBITION (>= 1024px)
          Vertical scroll translates viewpoint horizontally through 4 perspective panels
         ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className={reducedMotion ? "hidden" : "hidden lg:block"}
        aria-hidden={reducedMotion || undefined}
      >
        <div
          ref={pinStageRef}
          tabIndex={0}
          role="region"
          aria-roledescription="exhibition camera gallery"
          aria-label="Selected Projects cinematic camera gallery"
          onKeyDown={handleStageKeyDown}
          data-testid="projects-camera-stage"
          data-camera-progress="0.000"
          data-active-project="1"
          className="relative flex min-h-[100svh] w-full flex-col justify-between bg-[#F3E9DE] pt-[86px] pb-6 focus-visible:outline-none"
        >
          {/* Compact Exhibition Header Strip */}
          <div className="page-container relative z-10 flex items-end justify-between gap-6 border-b border-[#792B33]/18 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#792B33]/68 tabular-nums">
                <span>Chapter {PROJECTS_CONTENT.chapterNumber}</span>
                <span aria-hidden="true">·</span>
                <span>{PROJECTS_CONTENT.chapterLabel}</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-6">
                <h2
                  id="projects-heading"
                  className="m-0 font-normal uppercase leading-[0.9] tracking-[-0.03em] text-[#792B33]"
                  style={{
                    fontFamily: "var(--font-anton), Impact, sans-serif",
                    fontSize: "clamp(38px, 4vw, 58px)",
                  }}
                >
                  {PROJECTS_CONTENT.heading}
                </h2>
                <p className="m-0 hidden xl:block text-sm text-[#792B33]/72 max-w-[38ch]">
                  {PROJECTS_CONTENT.supportingText}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-[#792B33] tabular-nums">
                <span data-testid="projects-camera-counter">
                  {activeProject.number} / 0{count}
                </span>
                <span aria-hidden="true" className="text-[#792B33]/30">
                  ·
                </span>
                <span className="text-[#792B33]/68">{activeProject.category}</span>
              </div>
              <CameraProgressRule
                barRef={progressBarRef}
                surface="ivory"
                className="w-40"
              />
            </div>
          </div>

          {/* 2.5D Perspective Exhibition Hall Stage */}
          <CameraStage
            perspectivePx={1800}
            testId="projects-spatial-carousel"
            className="relative flex-1 w-full flex items-center justify-center my-2 min-h-[470px]"
          >
            {/* Subtle Architectural Depth Grid Parallax Backdrop (Pure hairlines, zero clutter) */}
            <ParallaxLayer
              layerRef={backdropGridRef}
              testId="projects-camera-backdrop"
              className="pointer-events-none absolute inset-y-6 -inset-x-24 z-0"
            >
              <div className="relative h-full w-full">
                <div className="absolute inset-x-0 top-1/2 h-px bg-[#792B33]/10" />
                <div className="absolute inset-x-0 top-[22%] h-px bg-[#792B33]/[0.06]" />
                <div className="absolute inset-x-0 bottom-[22%] h-px bg-[#792B33]/[0.06]" />
                <div className="grid h-full grid-cols-8">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-full border-r border-[#792B33]/[0.06]"
                    />
                  ))}
                </div>
              </div>
            </ParallaxLayer>

            {/* 4 Real-HTML Exhibition Project Panels */}
            <div className="relative h-[460px] xl:h-[500px] w-full">
              {PROJECTS.map((project, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <article
                    key={project.id}
                    ref={(el) => {
                      panelRefs.current[idx] = el;
                    }}
                    data-testid={`project-slide-${project.number}`}
                    data-active={isActive ? "true" : "false"}
                    className="absolute left-1/2 top-1/2 -mt-[225px] xl:-mt-[245px] w-[min(860px,68vw)] will-change-[transform,opacity]"
                    style={{
                      zIndex: isActive ? 30 : 20 - idx,
                    }}
                  >
                    <div
                      className={`border transition-colors duration-300 ${
                        isActive
                          ? "border-[#792B33]/50 bg-[#F3E9DE] shadow-[0_24px_56px_rgba(121,43,51,0.13)]"
                          : "border-[#792B33]/22 bg-[#F3E9DE]"
                      }`}
                    >
                      <div className="grid grid-cols-12">
                        {/* Left column: Oversized number + stationary crisp HTML editorial copy */}
                        <div className="col-span-5 flex flex-col justify-between border-r border-[#792B33]/18 p-6 xl:p-7">
                          <div>
                            <div className="flex items-baseline justify-between gap-2">
                              <span
                                className="leading-none tracking-[-0.04em] text-[#792B33]"
                                style={{
                                  fontFamily: "var(--font-anton), Impact, sans-serif",
                                  fontSize: "clamp(54px, 5.2vw, 84px)",
                                }}
                              >
                                {project.number}
                              </span>
                              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#792B33]/68 text-right">
                                {project.category}
                              </span>
                            </div>

                            <h3
                              className="mt-5 m-0 font-normal uppercase leading-[0.94] tracking-[-0.025em] text-[#792B33]"
                              style={{
                                fontFamily: "var(--font-anton), Impact, sans-serif",
                                fontSize: "clamp(30px, 2.8vw, 44px)",
                              }}
                            >
                              {project.title}
                            </h3>

                            <p className="mt-3.5 m-0 text-sm xl:text-[15px] leading-relaxed text-[#792B33]/80">
                              {project.shortDescription}
                            </p>
                          </div>

                          <div className="space-y-4 pt-5 border-t border-[#792B33]/16">
                            <p className="m-0 font-mono text-[11px] leading-relaxed text-[#792B33]/68">
                              {project.technologies.join(" · ")}
                            </p>

                            <div className="flex items-center justify-between gap-3">
                              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#792B33]/56">
                                {isActive ? "Active Focus" : "Click to Focus"}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  if (isActive) {
                                    openCaseStudy(idx, e.currentTarget);
                                  } else {
                                    navigateToProject(idx);
                                  }
                                }}
                                aria-label={
                                  isActive
                                    ? `Open case study for ${project.title}`
                                    : `Focus ${project.title}`
                                }
                                className="inline-flex items-center gap-2 border border-[#792B33] bg-[#792B33] px-4 py-2 text-xs font-mono uppercase tracking-[0.14em] text-[#F3E9DE] transition-colors hover:bg-[#F3E9DE] hover:text-[#792B33] cursor-pointer whitespace-nowrap"
                              >
                                <span>{isActive ? "Open Case" : "Focus"}</span>
                                <ArrowUpRight size={14} strokeWidth={1.7} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Right column: Large preview plate */}
                        <div className="col-span-7 p-5 xl:p-6 flex flex-col justify-between">
                          <button
                            type="button"
                            onClick={(e) => {
                              if (isActive) {
                                openCaseStudy(idx, e.currentTarget);
                              } else {
                                navigateToProject(idx);
                              }
                            }}
                            aria-label={
                              isActive
                                ? `Inspect ${project.title} case study`
                                : `Focus ${project.title}`
                            }
                            className="block w-full text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-[#792B33]"
                          >
                            <div className="transition-transform duration-300 ease-out group-hover:scale-[1.012]">
                              <PlaceholderVisual
                                surface="ivory"
                                number={project.number}
                                label={project.previewLabel}
                                sublabel={project.category}
                                aspectClass="aspect-[16/11]"
                                imageUrl={project.heroImageUrl}
                                imageAlt={`${project.title} preview`}
                              />
                            </div>
                          </button>

                          <div className="mt-3.5 flex items-center justify-between gap-4 text-[11px] font-mono uppercase tracking-[0.14em] text-[#792B33]/65">
                            <span className="truncate">
                              Exhibition Plate {project.number} / 0{count}
                            </span>
                            <span className="shrink-0">
                              {isActive ? "Click to open case study" : "Select to move camera"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </CameraStage>

          {/* Bottom Exhibition Camera Controls Bar */}
          <div className="page-container relative z-10 flex items-center justify-between gap-4 border-t border-[#792B33]/18 pt-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33] tabular-nums">
                {activeProject.number} / 0{count}
              </span>
              <span aria-hidden="true" className="text-[#792B33]/32">
                /
              </span>
              <span className="text-sm font-medium text-[#792B33] truncate">
                {activeProject.title}
              </span>
              <span className="hidden xl:inline font-mono text-[11px] uppercase tracking-[0.14em] text-[#792B33]/58">
                · Scroll sideways · Arrows · Click active
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 mr-2" role="group" aria-label="Select project">
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
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          REDUCED-MOTION STATIC GALLERY (Desktop & Mobile)
         ═══════════════════════════════════════════════════════════════════════ */}
      {reducedMotion ? (
        <div
          data-testid="projects-static-gallery"
          className="page-container pt-24 pb-24 space-y-12"
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
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE & TABLET SWIPEABLE PROJECT CAROUSEL (< 1024px, Zero Pinning)
         ═══════════════════════════════════════════════════════════════════════ */}
      {!reducedMotion ? (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          data-testid="projects-mobile-carousel"
          className="lg:hidden page-container pt-20 pb-20 select-none"
        >
          <ChapterHeading
            id="projects-heading-mobile"
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

          <article className="mt-10 border border-[#792B33]/35 bg-[#F3E9DE] p-5 sm:p-6 space-y-5">
            <div className="flex items-baseline justify-between gap-3">
              <span
                className="text-5xl leading-none text-[#792B33]"
                style={{ fontFamily: "var(--font-anton), Impact, sans-serif" }}
              >
                {activeProject.number}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#792B33]/72">
                {activeProject.category}
              </span>
            </div>

            <PlaceholderVisual
              surface="ivory"
              number={activeProject.number}
              label={activeProject.previewLabel}
              sublabel={activeProject.category}
              aspectClass="aspect-[4/3]"
              imageUrl={activeProject.heroImageUrl}
            />

            <div>
              <h3
                className="m-0 text-3xl uppercase leading-none text-[#792B33]"
                style={{ fontFamily: "var(--font-anton), Impact, sans-serif" }}
              >
                {activeProject.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#792B33]/80">
                {activeProject.shortDescription}
              </p>
              <p className="mt-3 font-mono text-[11px] text-[#792B33]/65">
                {activeProject.technologies.join(" · ")}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => openCaseStudy(activeIndex, e.currentTarget)}
              className="w-full inline-flex min-h-[44px] items-center justify-center gap-2 bg-[#792B33] px-5 py-3 text-xs font-mono uppercase tracking-[0.16em] text-[#F3E9DE] cursor-pointer"
            >
              <span>Open Project Case Study</span>
              <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
            </button>
          </article>

          {/* Touch Controls Bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#792B33]/20 pt-5">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#792B33] tabular-nums">
              {activeProject.number} / 0{count}
            </span>

            <div className="flex items-center gap-1.5">
              {PROJECTS.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
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
                aria-label="Previous project"
                className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/32 text-[#792B33]"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                type="button"
                onClick={() => stepProject(1)}
                aria-label="Next project"
                className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/32 text-[#792B33]"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
