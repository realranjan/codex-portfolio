"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  EXPERIENCE_CONTENT,
  EXPERIENCE_RECORDS,
  type ExperienceRecord,
} from "@/data/portfolio-content";
import {
  buildJourneyRouteGeometry,
  computeJourneyCameraState,
  getJourneyMilestoneAnchorProgress,
  type JourneyViewportTier,
} from "@/lib/journey-camera";
import {
  useIsDesktop,
  usePrefersReducedMotion,
} from "@/components/portfolio/camera-primitives";
import { ChapterHeading } from "@/components/portfolio/editorial-primitives";
import { ExperienceExhibitPanel } from "@/components/portfolio/experience-exhibit-panel";
import { ExperienceExhibitModal } from "@/components/portfolio/experience-exhibit-modal";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const INITIAL_ROUTE = buildJourneyRouteGeometry(
  EXPERIENCE_RECORDS.length,
  0,
  0,
  0.14
);

/**
 * CHAPTER 05 — THE JOURNEY / EXPERIENCE (Warm Ivory #F3E9DE / Burgundy #792B33)
 *
 * Art-directed spatial exhibition driven by a single scrubbed GSAP ScrollTrigger camera:
 * - Desktop (>= 1024px): Full CSS 3D perspective spatial corridor where a shared
 *   camera world glides horizontally between company exhibits (iMerit, Haegl Tech,
 *   RYVO). Each milestone settles into a zero-drift reading plateau; during travel
 *   the passed exhibit shifts toward the foreground left edge (partially cropped)
 *   while the next exhibit emerges forward from behind it. A thin curved Burgundy
 *   path extends milestone-to-milestone and straightens into a clean horizontal
 *   line in Stage F before handing off to Chapter 06 (Education).
 * - Tablet (768px..1023px): Reduced depth, smaller camera travel, wider readable region.
 * - Mobile (< 768px): Natural vertical scrolling with a swipeable & step-based gallery.
 * - Reduced Motion: Static accessible exhibition displaying all milestones cleanly.
 */
export function ChapterExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinnedStageRef = useRef<HTMLDivElement>(null);
  const headlineMaskRef = useRef<HTMLSpanElement>(null);
  const cameraViewportRef = useRef<HTMLDivElement>(null);
  const cameraWorldRef = useRef<HTMLDivElement>(null);
  const exhibitRefs = useRef<Array<HTMLDivElement | null>>([]);
  const routeBasePathRef = useRef<SVGPathElement>(null);
  const routeActivePathRef = useRef<SVGPathElement>(null);
  const routeNodeRefs = useRef<Array<SVGGElement | null>>([]);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<{
    record: ExperienceRecord;
    index: number;
  } | null>(null);

  const reducedMotion = usePrefersReducedMotion();
  const isDesktop = useIsDesktop(1024);
  const isTabletOrUp = useIsDesktop(768);
  const showPinnedStage = isTabletOrUp && !reducedMotion;
  const viewportTier: JourneyViewportTier = isDesktop ? "desktop" : "tablet";

  const count = EXPERIENCE_RECORDS.length;

  const applyCameraProgress = useCallback(
    (rawProgress: number, tier: JourneyViewportTier) => {
      const state = computeJourneyCameraState(rawProgress, count, tier);
      const route = buildJourneyRouteGeometry(
        count,
        state.pathFlattenProgress,
        state.activeIndex,
        state.pathDrawProgress
      );

      const stage = pinnedStageRef.current;
      if (stage) {
        stage.dataset.stagePhase = state.phase;
        stage.dataset.activeMilestone = String(state.activeIndex + 1);
        stage.dataset.cameraX = String(state.cameraTranslateXPx);
        stage.dataset.pathFlatten = state.pathFlattenProgress.toFixed(2);
      }

      // Stage A: Clean upward text mask reveal for EVERY PATH LEAVES A MARK.
      if (headlineMaskRef.current) {
        const yPct = (1 - state.headlineReveal) * 100;
        headlineMaskRef.current.style.transform = `translate3d(0, ${yPct.toFixed(2)}%, 0)`;
        headlineMaskRef.current.style.opacity = (
          0.18 +
          0.82 * state.headlineReveal
        ).toFixed(3);
      }

      // Perspective depth tuned per viewport tier
      if (cameraViewportRef.current) {
        cameraViewportRef.current.style.perspective = `${state.perspectivePx}px`;
      }

      // Move the SINGLE shared camera world container horizontally + gentle Z pullback
      if (cameraWorldRef.current) {
        cameraWorldRef.current.style.transform = `translate3d(${state.cameraTranslateXPx}px, ${state.cameraTranslateYPx}px, ${state.cameraTranslateZPx}px) scale(${state.cameraScale})`;
      }

      // Position each company exhibit inside the shared spatial room
      for (const pose of state.exhibits) {
        const el = exhibitRefs.current[pose.index];
        if (!el) continue;

        const xTotal = pose.worldXPx + pose.localOffsetXPx;
        el.style.transform = `translate3d(${xTotal.toFixed(2)}px, ${pose.localYPx.toFixed(2)}px, ${pose.localZPx.toFixed(2)}px) rotateY(${pose.rotateYDeg}deg) scale(${pose.scale})`;
        // Keep adjacent exhibits solid archival board (prevents curved wall line bleeding through); fade only distant exhibits
        const outerOpacity =
          Math.abs(pose.relativeOffset) <= 1.25 ? 1 : pose.opacity;
        el.style.opacity = outerOpacity.toFixed(4);
        el.style.zIndex = String(pose.zIndex);
      }

      // Update thin curved Burgundy path + Stage F straightening into a clean horizontal line
      if (routeBasePathRef.current) {
        routeBasePathRef.current.setAttribute("d", route.pathD);
      }
      if (routeActivePathRef.current) {
        routeActivePathRef.current.setAttribute("d", route.pathD);
        const totalLength = routeActivePathRef.current.getTotalLength();
        routeActivePathRef.current.style.strokeDasharray = `${totalLength}`;
        routeActivePathRef.current.style.strokeDashoffset = `${(
          totalLength *
          (1 - state.pathDrawProgress)
        ).toFixed(2)}`;
      }
      for (const node of route.nodes) {
        const g = routeNodeRefs.current[node.index];
        if (!g) continue;
        g.setAttribute("transform", `translate(${node.x}, ${node.y})`);
        g.setAttribute("data-reached", node.isReached ? "true" : "false");
        g.setAttribute("data-active", node.isActive ? "true" : "false");
      }

      setActiveIndex((prev) =>
        prev === state.activeIndex ? prev : state.activeIndex
      );
    },
    [count]
  );

  // Mount scrubbed GSAP ScrollTrigger on Desktop & Tablet (with clean resize recalculation)
  useIsomorphicLayoutEffect(() => {
    const stageEl = pinnedStageRef.current;
    if (!stageEl || !showPinnedStage) return;

    // Seed resting initial composition at Milestone 01 before first scroll update
    applyCameraProgress(getJourneyMilestoneAnchorProgress(0, count), viewportTier);

    const scrollSpan =
      viewportTier === "desktop"
        ? `+=${Math.round(70 * count)}%`
        : `+=${Math.round(60 * count)}%`;

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: stageEl,
        start: "top top",
        end: scrollSpan,
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          applyCameraProgress(self.progress, viewportTier);
        },
      });
      triggerRef.current = st;
      // Sync immediately if page loaded scrolled past/into the trigger
      if (st.progress > 0) {
        applyCameraProgress(st.progress, viewportTier);
      } else {
        // Show headline cleanly if visitor is approaching Stage A
        applyCameraProgress(0.09, viewportTier);
      }
    }, sectionRef);

    let resizeFrame = 0;
    const onResize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", onResize);
      triggerRef.current = null;
      ctx.revert();
    };
  }, [applyCameraProgress, count, showPinnedStage, viewportTier]);

  const navigateToMilestone = useCallback(
    (targetIdx: number) => {
      const clampedIdx = Math.max(0, Math.min(count - 1, targetIdx));
      const anchorProgress = getJourneyMilestoneAnchorProgress(clampedIdx, count);
      const st = triggerRef.current;

      if (st && showPinnedStage) {
        const targetScrollY = st.start + (st.end - st.start) * anchorProgress;
        window.scrollTo({ top: targetScrollY, behavior: "smooth" });
        applyCameraProgress(anchorProgress, viewportTier);
      }
      setActiveIndex(clampedIdx);
    },
    [applyCameraProgress, count, showPinnedStage, viewportTier]
  );

  // Mobile swipe gesture handlers (touch-friendly gallery without horizontal page scroll)
  const handleMobileTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleMobileTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) >= 42) {
      if (deltaX < 0 && activeIndex < count - 1) {
        setActiveIndex((prev) => Math.min(count - 1, prev + 1));
      } else if (deltaX > 0 && activeIndex > 0) {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      }
    }
  };

  const formattedCurrent = String(activeIndex + 1).padStart(2, "0");
  const formattedTotal = String(count).padStart(2, "0");
  const mobileActiveRecord = EXPERIENCE_RECORDS[activeIndex] ?? EXPERIENCE_RECORDS[0];

  return (
    <section
      ref={sectionRef}
      id="experience"
      aria-labelledby="experience-heading"
      data-chapter-surface="ivory"
      className="relative bg-[#F3E9DE] text-[#792B33] overflow-x-clip"
    >
      {/* ── DESKTOP & TABLET: PINNED SPATIAL EXHIBITION CAMERA STAGE ──
          Host wrapper stays permanently mounted so GSAP's .pin-spacer never
          conflicts with React reconciliation across viewport resizes. */}
      <div className={showPinnedStage ? "block" : "hidden"}>
        <div
          ref={pinnedStageRef}
          data-testid={showPinnedStage ? "experience-camera-stage" : undefined}
          data-stage-phase="enter"
          data-active-milestone="1"
          data-camera-x="0"
          data-path-flatten="0"
          className={
            showPinnedStage
              ? "relative flex h-[100svh] min-h-[680px] w-full flex-col justify-between bg-[#F3E9DE] pt-[74px] pb-5"
              : ""
          }
        >
          {showPinnedStage && (
            <>
              {/* Editorial Header with Stage A Masked Headline + Compact Index */}
              <div className="page-container z-20 shrink-0 border-b border-[#792B33]/18 pb-3.5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#792B33]/68 tabular-nums">
                      <span>Chapter {EXPERIENCE_CONTENT.chapterNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>{EXPERIENCE_CONTENT.chapterLabel}</span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                      <h2
                        id="experience-heading"
                        className="m-0 overflow-hidden font-normal uppercase leading-[0.9] tracking-[-0.03em] text-[#792B33]"
                        style={{
                          fontFamily: "var(--font-anton), Impact, sans-serif",
                          fontSize: isDesktop
                            ? "clamp(34px, 3.6vw, 52px)"
                            : "clamp(28px, 4.2vw, 40px)",
                        }}
                      >
                        <span
                          ref={headlineMaskRef}
                          className="block will-change-transform"
                        >
                          {EXPERIENCE_CONTENT.heading}
                        </span>
                      </h2>

                      <p
                        className="m-0 font-serif italic text-[#792B33]/78"
                        style={{
                          fontFamily: "var(--font-cormorant), Georgia, serif",
                          fontSize: isDesktop ? "20px" : "17px",
                        }}
                      >
                        {EXPERIENCE_CONTENT.supportingText}
                      </p>
                    </div>
                  </div>

                  {/* Small Milestone Index (01 / 03) + Prev/Next Controls */}
                  <div className="flex items-center gap-4 shrink-0">
                    <span
                      data-testid="journey-index"
                      className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33] tabular-nums"
                    >
                      {formattedCurrent} / {formattedTotal}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigateToMilestone(activeIndex - 1)}
                        disabled={activeIndex === 0}
                        aria-label="Previous milestone"
                        className="inline-flex h-9 w-9 items-center justify-center border border-[#792B33]/30 text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#792B33] cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToMilestone(activeIndex + 1)}
                        disabled={activeIndex === count - 1}
                        aria-label="Next milestone"
                        className="inline-flex h-9 w-9 items-center justify-center border border-[#792B33]/30 text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#792B33] cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shared Spatial Camera Viewport — Exhibits + Curved Burgundy Journey Path */}
              <div
                ref={cameraViewportRef}
                data-testid="journey-spatial-viewport"
                className="relative flex flex-1 items-center justify-center overflow-hidden"
                style={{
                  perspective: isDesktop ? "1850px" : "1350px",
                  perspectiveOrigin: "50% 50%",
                }}
              >
                {/* Thin Curved Burgundy Path Behind Exhibits (morphs cleanly to horizontal line in Stage F) */}
                <svg
                  viewBox="0 0 1400 260"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  data-testid="journey-curved-path-svg"
                  className="pointer-events-none absolute inset-x-0 top-1/2 h-[220px] w-full -translate-y-1/2"
                >
                  {/* Quiet full-length architectural trace */}
                  <path
                    ref={routeBasePathRef}
                    d={INITIAL_ROUTE.pathD}
                    fill="none"
                    stroke="#792B33"
                    strokeOpacity="0.16"
                    strokeWidth="1.25"
                  />
                  {/* Scrubbed active Burgundy ink path */}
                  <path
                    ref={routeActivePathRef}
                    d={INITIAL_ROUTE.pathD}
                    fill="none"
                    stroke="#792B33"
                    strokeOpacity="0.72"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  {/* Restrained milestone markers along the path */}
                  {INITIAL_ROUTE.nodes.map((node) => {
                    const isNodeActive = node.index === activeIndex;
                    return (
                      <g
                        key={node.index}
                        ref={(el) => {
                          routeNodeRefs.current[node.index] = el;
                        }}
                        transform={`translate(${node.x}, ${node.y})`}
                      >
                        <circle
                          r={isNodeActive ? 6 : 4}
                          fill={isNodeActive ? "#792B33" : "#F3E9DE"}
                          stroke="#792B33"
                          strokeWidth="1.5"
                        />
                        {isNodeActive && (
                          <circle
                            r="13"
                            fill="none"
                            stroke="#792B33"
                            strokeOpacity="0.3"
                            strokeWidth="1"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Single Moving Shared Camera World Container */}
                <div
                  ref={cameraWorldRef}
                  data-testid="journey-camera-world"
                  className="relative flex h-full w-full items-center justify-center will-change-transform"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {EXPERIENCE_RECORDS.map((record, idx) => (
                    <div
                      key={record.id}
                      ref={(el) => {
                        exhibitRefs.current[idx] = el;
                      }}
                      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform ${
                        isDesktop
                          ? "w-[min(66vw,820px)]"
                          : "w-[min(82vw,680px)]"
                      }`}
                      style={{
                        transformStyle: "preserve-3d",
                        backfaceVisibility: "hidden",
                      }}
                    >
                      <ExperienceExhibitPanel
                        record={record}
                        index={idx}
                        total={count}
                        isActive={idx === activeIndex}
                        compact={!isDesktop}
                        onFocus={() => navigateToMilestone(idx)}
                        onInspect={() =>
                          setSelectedRecord({ record, index: idx })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Milestone Selector Footer Bar */}
              <div className="page-container z-20 shrink-0 border-t border-[#792B33]/18 pt-3">
                <div
                  role="tablist"
                  aria-label="Company milestones"
                  className="flex flex-wrap items-center gap-2"
                >
                  {EXPERIENCE_RECORDS.map((record, idx) => {
                    const isCurrent = idx === activeIndex;
                    const num = String(idx + 1).padStart(2, "0");
                    return (
                      <button
                        key={record.id}
                        type="button"
                        role="tab"
                        aria-selected={isCurrent}
                        onClick={() => navigateToMilestone(idx)}
                        className={`inline-flex h-9 items-center gap-2.5 px-3.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors cursor-pointer whitespace-nowrap ${
                          isCurrent
                            ? "bg-[#792B33] text-[#F3E9DE]"
                            : "border border-[#792B33]/26 text-[#792B33] hover:border-[#792B33]"
                        }`}
                      >
                        <span className="tabular-nums">{num}</span>
                        <span>{record.company}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── REDUCED MOTION: STATIC ACCESSIBLE EXHIBITION LAYOUT ── */}
      {!showPinnedStage && reducedMotion && (
        <div
          data-testid="experience-reduced-motion-layout"
          className="page-container pt-12 pb-14 space-y-10"
        >
          <ChapterHeading
            id="experience-heading"
            number={EXPERIENCE_CONTENT.chapterNumber}
            label={EXPERIENCE_CONTENT.chapterLabel}
            heading={EXPERIENCE_CONTENT.heading}
            supportingText={EXPERIENCE_CONTENT.supportingText}
            surface="ivory"
            action={
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/70 tabular-nums">
                01 — {formattedTotal}
              </span>
            }
          />

          <div className="h-px w-full bg-[#792B33]/25" aria-hidden="true" />

          <div className="space-y-8">
            {EXPERIENCE_RECORDS.map((record, idx) => (
              <ExperienceExhibitPanel
                key={record.id}
                record={record}
                index={idx}
                total={count}
                isActive={true}
                compact={!isDesktop}
                onInspect={() => setSelectedRecord({ record, index: idx })}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── MOBILE (< 768px): SWIPEABLE / STEP-BASED EXPERIENCE GALLERY ── */}
      {!showPinnedStage && !reducedMotion && (
        <div
          data-testid="experience-mobile-gallery"
          className="page-container pt-10 pb-12 space-y-6"
        >
          <ChapterHeading
            id="experience-heading"
            number={EXPERIENCE_CONTENT.chapterNumber}
            label={EXPERIENCE_CONTENT.chapterLabel}
            heading={EXPERIENCE_CONTENT.heading}
            supportingText={EXPERIENCE_CONTENT.supportingText}
            surface="ivory"
          />

          {/* Compact Mobile Route Strip + Milestone Index */}
          <div className="space-y-3 border-b border-[#792B33]/18 pb-4">
            <div className="flex items-center justify-between gap-3">
              <span
                data-testid="journey-index-mobile"
                className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33] tabular-nums"
              >
                {formattedCurrent} / {formattedTotal} · {mobileActiveRecord.company}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={activeIndex === 0}
                  aria-label="Previous milestone"
                  className="inline-flex h-11 w-11 items-center justify-center border border-[#792B33]/30 text-[#792B33] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) => Math.min(count - 1, prev + 1))
                  }
                  disabled={activeIndex === count - 1}
                  aria-label="Next milestone"
                  className="inline-flex h-11 w-11 items-center justify-center border border-[#792B33]/30 text-[#792B33] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Subtle horizontal Burgundy route trace */}
            <div
              className="relative h-1 w-full bg-[#792B33]/15"
              aria-hidden="true"
            >
              <div
                className="h-full bg-[#792B33] transition-all duration-300"
                style={{
                  width: `${((activeIndex + 1) / Math.max(1, count)) * 100}%`,
                }}
              />
            </div>

            {/* Direct milestone selector buttons */}
            <div
              role="tablist"
              aria-label="Company milestones"
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
              }}
            >
              {EXPERIENCE_RECORDS.map((record, idx) => {
                const isCurrent = idx === activeIndex;
                return (
                  <button
                    key={record.id}
                    type="button"
                    role="tab"
                    aria-selected={isCurrent}
                    onClick={() => setActiveIndex(idx)}
                    className={`min-h-[44px] px-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors cursor-pointer truncate ${
                      isCurrent
                        ? "bg-[#792B33] text-[#F3E9DE]"
                        : "border border-[#792B33]/26 text-[#792B33]"
                    }`}
                  >
                    {record.company}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Swipeable active exhibit */}
          <div
            onTouchStart={handleMobileTouchStart}
            onTouchEnd={handleMobileTouchEnd}
            className="touch-pan-y"
          >
            <ExperienceExhibitPanel
              record={mobileActiveRecord}
              index={activeIndex}
              total={count}
              isActive={true}
              compact={true}
              onInspect={() =>
                setSelectedRecord({
                  record: mobileActiveRecord,
                  index: activeIndex,
                })
              }
            />
          </div>
        </div>
      )}

      {/* ── STAGE F TRANSITION TO CHAPTER 06 (EDUCATION): CLEAN HORIZONTAL BURGUNDY LINE ── */}
      <div
        aria-hidden="true"
        data-testid="experience-to-education-transition"
        className="relative w-full"
      >
        <div className="bg-[#F3E9DE] pt-6">
          <div className="page-container">
            <div className="h-[1.5px] w-full bg-[#792B33]/75" />
          </div>
          <div className="flex justify-center">
            <div className="h-9 w-[1.5px] bg-[#792B33]/75" />
          </div>
        </div>
        <div className="flex justify-center bg-[#792B33] pb-1">
          <div className="h-8 w-[1.5px] bg-[#F3E9DE]/60" />
        </div>
      </div>

      {/* Expanded Exhibit Detail View Overlay */}
      <ExperienceExhibitModal
        key={selectedRecord?.record.id ?? "closed"}
        record={selectedRecord?.record ?? null}
        indexNumber={
          selectedRecord
            ? String(selectedRecord.index + 1).padStart(2, "0")
            : "01"
        }
        totalCount={count}
        onClose={() => setSelectedRecord(null)}
      />
    </section>
  );
}
