"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  computeSpatialSlideState,
  resolveDragStep,
  wrapIndex,
} from "@/lib/carousel";
import {
  ChapterHeading,
  PlaceholderVisual,
} from "@/components/portfolio/editorial-primitives";

/**
 * CHAPTER 02 — SELECTED PROJECTS (Ivory #F3E9DE / Burgundy #792B33)
 *
 * Replaces the previous 3D ring gallery with a bespoke, exhibition-grade
 * horizontal spatial gallery featuring:
 * - Oversized Anton numbering, asymmetrical panel compositions, subtle 3D depth
 * - Active project visually emphasized while neighboring slides stay partially visible
 * - Drag/swipe, keyboard arrows, prev/next buttons, and direct project index controls
 * - Full interactive Case Study Overlay with internal screenshot gallery, architecture,
 *   challenges/lessons, unconfigured-aware links, next/prev navigation, and Escape close
 */
export function ChapterProjects() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openProjectIndex, setOpenProjectIndex] = useState<number | null>(null);
  const [gallerySlideIdx, setGallerySlideIdx] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragDeltaXRef = useRef<number>(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  const count = PROJECTS.length;
  const activeProject = PROJECTS[activeIndex] ?? PROJECTS[0];
  const openProject: PortfolioProject | null =
    openProjectIndex !== null ? (PROJECTS[openProjectIndex] ?? null) : null;

  const stepCarousel = useCallback(
    (delta: number) => {
      setActiveIndex((prev) => wrapIndex(prev + delta, count));
    },
    [count]
  );

  const openCaseStudy = useCallback((idx: number, triggerEl?: HTMLElement | null) => {
    lastTriggerRef.current = triggerEl ?? null;
    setGallerySlideIdx(0);
    setOpenProjectIndex(idx);
    setActiveIndex(idx);
  }, []);

  const closeCaseStudy = useCallback(() => {
    setOpenProjectIndex(null);
    window.requestAnimationFrame(() => {
      lastTriggerRef.current?.focus();
    });
  }, []);

  // Keyboard navigation for overlay (Escape, Left/Right) and focused carousel stage
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

  // Drag / swipe pointer handlers on spatial exhibition track
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
    const step = resolveDragStep(dragDeltaXRef.current, 52);
    if (step !== 0) {
      stepCarousel(step);
    }
    dragStartXRef.current = null;
    dragDeltaXRef.current = 0;
  };

  const handleStageKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      stepCarousel(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepCarousel(-1);
    }
  };

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      data-chapter-surface="ivory"
      className="relative bg-[#F3E9DE] text-[#792B33] pt-24 sm:pt-28 pb-24 sm:pb-32 overflow-x-clip"
    >
      <div className="page-container">
        <ChapterHeading
          id="projects-heading"
          number={PROJECTS_CONTENT.chapterNumber}
          label={PROJECTS_CONTENT.chapterLabel}
          heading={PROJECTS_CONTENT.heading}
          supportingText={PROJECTS_CONTENT.supportingText}
          surface="ivory"
          action={
            <span className="hidden sm:inline font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/72">
              Drag · Arrow Keys · Select to Inspect
            </span>
          }
        />

        {/* ── DESKTOP / TABLET SPATIAL EXHIBITION CAROUSEL ── */}
        <div
          ref={stageRef}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Selected Projects exhibition gallery"
          onKeyDown={handleStageKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          data-testid="projects-spatial-carousel"
          className="relative mt-12 sm:mt-16 select-none cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-[#792B33] focus-visible:outline-offset-4"
        >
          {/* Spatial 3D stage (Desktop/Tablet) */}
          <div
            className="relative hidden md:block h-[540px] lg:h-[580px] w-full overflow-visible"
            style={{ perspective: "1600px" }}
          >
            {PROJECTS.map((project, idx) => {
              const state = computeSpatialSlideState(idx, activeIndex, count);
              const isOppositeBack = Math.abs(state.offset) >= 2;
              return (
                <article
                  key={project.id}
                  data-testid={`project-slide-${project.number}`}
                  data-active={state.isActive ? "true" : "false"}
                  className="absolute left-1/2 top-0 w-[min(820px,74vw)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
                  style={{
                    zIndex: state.zIndex,
                    opacity: isOppositeBack ? 0 : state.opacity,
                    pointerEvents: isOppositeBack ? "none" : "auto",
                    transform: `translate3d(calc(-50% + ${state.translateXPct}%), ${state.translateYPx}px, 0) scale(${state.scale}) rotateY(${state.rotateYDeg}deg)`,
                  }}
                >
                  <div
                    className={`border transition-colors duration-300 ${
                      state.isActive
                        ? "border-[#792B33]/45 bg-[#F3E9DE] shadow-[0_24px_60px_rgba(121,43,51,0.14)]"
                        : "border-[#792B33]/22 bg-[#F3E9DE]"
                    }`}
                  >
                    {/* Asymmetric 12-column exhibition panel */}
                    <div className="grid grid-cols-12">
                      {/* Left column: Oversized numbering + editorial typography */}
                      <div className="col-span-5 flex flex-col justify-between border-r border-[#792B33]/18 p-6 lg:p-8">
                        <div>
                          <div className="flex items-baseline justify-between gap-2">
                            <span
                              className="leading-none tracking-[-0.04em] text-[#792B33]"
                              style={{
                                fontFamily: "var(--font-anton), Impact, sans-serif",
                                fontSize: "clamp(58px, 6vw, 94px)",
                              }}
                            >
                              {project.number}
                            </span>
                            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#792B33]/68 text-right">
                              {project.category}
                            </span>
                          </div>

                          <h3
                            className="mt-6 m-0 font-normal uppercase leading-[0.94] tracking-[-0.025em] text-[#792B33]"
                            style={{
                              fontFamily: "var(--font-anton), Impact, sans-serif",
                              fontSize: "clamp(32px, 3.2vw, 48px)",
                            }}
                          >
                            {project.title}
                          </h3>

                          <p className="mt-4 text-sm sm:text-[15px] leading-relaxed text-[#792B33]/78">
                            {project.shortDescription}
                          </p>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-[#792B33]/16">
                          <p className="m-0 font-mono text-[11px] leading-relaxed text-[#792B33]/68">
                            {project.technologies.join(" · ")}
                          </p>

                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#792B33]/55">
                              Links: Not configured
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                if (state.isActive) {
                                  openCaseStudy(idx, e.currentTarget);
                                } else {
                                  setActiveIndex(idx);
                                }
                              }}
                              aria-label={
                                state.isActive
                                  ? `Open case study for ${project.title}`
                                  : `Focus ${project.title}`
                              }
                              className="inline-flex items-center gap-2 border border-[#792B33] bg-[#792B33] px-4 py-2 text-xs font-mono uppercase tracking-[0.14em] text-[#F3E9DE] transition-colors hover:bg-[#F3E9DE] hover:text-[#792B33] cursor-pointer whitespace-nowrap"
                            >
                              <span>{state.isActive ? "Open Case" : "Focus"}</span>
                              <ArrowUpRight size={14} strokeWidth={1.7} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right column: Large preview plate (clickable to inspect) */}
                      <div className="col-span-7 p-5 lg:p-7 flex flex-col justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            if (state.isActive) {
                              openCaseStudy(idx, e.currentTarget);
                            } else {
                              setActiveIndex(idx);
                            }
                          }}
                          aria-label={`Inspect ${project.title} preview`}
                          className="block w-full text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-[#792B33]"
                        >
                          <div className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015]">
                            <PlaceholderVisual
                              surface="ivory"
                              number={project.number}
                              label={project.previewLabel}
                              sublabel={project.category}
                              aspectClass="aspect-[4/3]"
                              imageUrl={project.heroImageUrl}
                              imageAlt={`${project.title} preview`}
                            />
                          </div>
                        </button>

                        <div className="mt-4 flex items-center justify-between gap-4 text-[11px] font-mono uppercase tracking-[0.14em] text-[#792B33]/65">
                          <span className="truncate">Plate {project.number} / 0{count}</span>
                          <span className="shrink-0">Click to inspect</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Accessible Mobile Exhibition Card + Touch Swipe */}
          <div className="md:hidden">
            <article className="border border-[#792B33]/35 bg-[#F3E9DE] p-5 space-y-5">
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
                className="w-full inline-flex min-h-[44px] items-center justify-center gap-2 bg-[#792B33] px-5 py-3 text-xs font-mono uppercase tracking-[0.16em] text-[#F3E9DE]"
              >
                <span>Open Project Case Study</span>
                <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
              </button>
            </article>
          </div>

          {/* Unified Carousel Navigation Controls Bar */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#792B33]/20 pt-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33] tabular-nums">
                {activeProject.number} / 0{count}
              </span>
              <span aria-hidden="true" className="text-[#792B33]/35">
                /
              </span>
              <span className="text-sm font-medium text-[#792B33]">
                {activeProject.title}
              </span>
              <span className="hidden sm:inline font-mono text-xs text-[#792B33]/65">
                · {activeProject.category}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-2" role="group" aria-label="Select project">
                {PROJECTS.map((p, idx) => {
                  const isCurrent = idx === activeIndex;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`Show ${p.title}`}
                      aria-pressed={isCurrent}
                      className={`h-10 min-w-[40px] px-2.5 font-mono text-xs tabular-nums transition-colors cursor-pointer ${
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
                onClick={() => stepCarousel(-1)}
                aria-label="Previous project"
                className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/32 text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
              >
                <ChevronLeft size={18} strokeWidth={1.7} />
              </button>

              <button
                type="button"
                onClick={() => stepCarousel(1)}
                aria-label="Next project"
                className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/32 text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
              >
                <ChevronRight size={18} strokeWidth={1.7} />
              </button>
            </div>
          </div>
        </div>
      </div>

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
                <span>Project {openProject.number} / 0{count}</span>
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
            {/* Title + Hero Preview */}
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

            {/* Overview / Problem / Approach / Solution */}
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

            {/* Technical Architecture + Technology Stack */}
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

            {/* Interactive Screenshot Gallery Carousel */}
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
