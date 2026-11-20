"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  JOURNEY_ARTWORK,
  JOURNEY_INTRO,
  JOURNEY_MILESTONES,
  type JourneyMilestone,
} from "@/data/experience-journey";
import { computeMountain3DCameraPose } from "@/lib/mountain-3d-world";
import {
  useIsDesktop,
  usePrefersReducedMotion,
} from "@/components/portfolio/camera-primitives";
import { ChapterHeading } from "@/components/portfolio/editorial-primitives";
import {
  Journey3DCanvas,
  type Journey3DCanvasHandle,
} from "@/components/portfolio/journey/journey-3d-canvas";
import { TravelerSprite } from "@/components/portfolio/journey/traveler-sprite";
import { ExperienceTypography } from "@/components/portfolio/journey/experience-typography";
import { JourneyNavigation } from "@/components/portfolio/journey/journey-navigation";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const INITIAL_MOBILE_PROGRESS = JOURNEY_MILESTONES[0]?.trailStop ?? 0.24;

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * JOURNEY SCENE — INTERACTIVE 3D JAPANESE MOUNTAIN PASSAGE
 * -------------------------------------------------------------------------------
 * Desktop (>= 1024px, normal motion):
 *   - Real-time Three.js 3D mountain pass with carved footpath, stylized pines,
 *     sculpted ridges, warm ivory horizon fog, articulated walking traveler cat,
 *     and three carved stone trail steles (01 iMerit, 02 Haegl Tech, 03 RYVO).
 *   - Permanent GSAP ScrollTrigger pin host (React 19 safe) driving camera & cat
 *     progress smoothly along the winding 3D trail with zero per-frame setState.
 *   - Borderless HTML editorial typography reveals automatically when the cat
 *     reaches each checkpoint OR on direct click (never on hover!).
 *
 * Mobile (< 1024px):
 *   - Interactive 3D mountain viewport gliding smoothly between milestones with
 *     tap-friendly stone landmarks, Prev/Next step controls, and inline
 *     borderless typography below the scene.
 *
 * Reduced Motion:
 *   - Quiet static sumi-e mountain panorama header + accessible 3-stop list.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export function JourneyScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  const desktopStageRef = useRef<HTMLDivElement>(null);
  const desktopCanvasRef = useRef<Journey3DCanvasHandle>(null);
  const mobileCanvasRef = useRef<Journey3DCanvasHandle>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  // Direct DOM refs for 60fps overlay fades without React re-renders
  const introRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Tracking refs for arrival & click-dismiss state
  const prevReachedIdRef = useRef<string | null>(null);
  const clickedStopProgressRef = useRef<number | null>(null);

  // Discrete React state (updated only on meaningful state transitions)
  const [activeIndex, setActiveIndex] = useState(0);
  const [reachedId, setReachedId] = useState<string | null>(null);
  const [clickedId, setClickedId] = useState<string | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  // Mobile state: starts at Stop 01 and glides smoothly along the 3D trail on step change
  const [mobileStopIdx, setMobileStopIdx] = useState(0);
  const [mobileInspectedId, setMobileInspectedId] = useState<string | null>(
    JOURNEY_MILESTONES[0]?.id ?? null
  );

  const reducedMotion = usePrefersReducedMotion();
  const isDesktop = useIsDesktop(1024);
  const showPinnedDesktop = isDesktop && !reducedMotion;

  // Display when clicked OR automatically when the traveler reaches the checkpoint (never on hover)
  const activeDisplayedId =
    clickedId ?? (reachedId && reachedId !== dismissedId ? reachedId : null);
  const activeDisplayedMilestone = useMemo(
    () => JOURNEY_MILESTONES.find((m) => m.id === activeDisplayedId) ?? null,
    [activeDisplayedId]
  );
  const activeMilestoneId = JOURNEY_MILESTONES[activeIndex]?.id ?? null;

  const mobileActiveMilestone =
    JOURNEY_MILESTONES[mobileStopIdx] ?? JOURNEY_MILESTONES[0];
  const mobileInspectedMilestone = useMemo(
    () => JOURNEY_MILESTONES.find((m) => m.id === mobileInspectedId) ?? null,
    [mobileInspectedId]
  );

  // Sync mobile stop selection smoothly into the compact 3D canvas
  useEffect(() => {
    if (showPinnedDesktop || reducedMotion) return;
    const stop = JOURNEY_MILESTONES[mobileStopIdx];
    if (!stop) return;
    mobileCanvasRef.current?.setScrollProgress(stop.trailStop, true);
  }, [mobileStopIdx, showPinnedDesktop, reducedMotion]);

  // Escape key dismisses currently displayed borderless typography
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPinnedDesktop) {
          clickedStopProgressRef.current = null;
          setClickedId(null);
          setDismissedId(prevReachedIdRef.current);
        } else {
          setMobileInspectedId(null);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPinnedDesktop]);

  /**
   * Single-source-of-truth pose applicator driven by ScrollTrigger progress [0..1].
   */
  const applyJourneyProgress = useCallback(
    (rawProgress: number, isUserScroll: boolean) => {
      const pose = computeMountain3DCameraPose(rawProgress, JOURNEY_MILESTONES);

      // Push scroll progress directly to Three.js canvas (zero React re-renders!)
      desktopCanvasRef.current?.setScrollProgress(rawProgress, isUserScroll);

      const stageEl = desktopStageRef.current;
      if (stageEl) {
        stageEl.dataset.scenePhase = pose.scenePhase;
        stageEl.dataset.journeyProgress = pose.rawProgress.toFixed(3);
        stageEl.dataset.activeStop = String(pose.activeMilestoneIndex + 1);
      }

      // Scene 01 Opening Headline reveal & graceful exit
      if (introRef.current) {
        introRef.current.style.opacity = String(pose.introOpacity);
        introRef.current.style.transform = `translate3d(0, ${pose.introTranslateYPx}px, 0)`;
      }

      // Compact bottom navigation hairline progress rule
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${pose.rawProgress.toFixed(4)})`;
      }

      setActiveIndex((prev) =>
        prev === pose.activeMilestoneIndex ? prev : pose.activeMilestoneIndex
      );

      // Automatic checkpoint arrival reveal & clean handoff when scrolling away from a clicked stop
      if (prevReachedIdRef.current !== pose.reachedMilestoneId) {
        prevReachedIdRef.current = pose.reachedMilestoneId;
        setReachedId(pose.reachedMilestoneId);
        setDismissedId(null);
      }

      if (
        isUserScroll &&
        clickedStopProgressRef.current !== null &&
        Math.abs(rawProgress - clickedStopProgressRef.current) > 0.085
      ) {
        clickedStopProgressRef.current = null;
        setClickedId(null);
      }
    },
    []
  );

  // Mount GSAP ScrollTrigger inside permanent pin host (React 19 safe)
  useIsomorphicLayoutEffect(() => {
    const stageEl = desktopStageRef.current;
    if (!stageEl || !showPinnedDesktop) return;

    applyJourneyProgress(0, false);

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: stageEl,
        start: "top top",
        end: "+=280%",
        pin: true,
        scrub: 0.55,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          applyJourneyProgress(self.progress, true);
        },
        onRefresh: (self) => {
          applyJourneyProgress(self.progress, false);
        },
      });
      triggerRef.current = st;
    }, rootRef);

    return () => {
      triggerRef.current = null;
      ctx.revert();
    };
  }, [applyJourneyProgress, showPinnedDesktop]);

  // Smoothly scroll virtual 3D camera to a specific milestone index and display it
  const scrollToMilestone = useCallback(
    (index: number) => {
      const safeIdx = Math.max(0, Math.min(JOURNEY_MILESTONES.length - 1, index));
      const target = JOURNEY_MILESTONES[safeIdx];
      if (!target) return;

      clickedStopProgressRef.current = target.trailStop;
      setDismissedId(null);
      setClickedId(target.id);

      const st = triggerRef.current;
      if (st && showPinnedDesktop) {
        const targetScrollY = st.start + (st.end - st.start) * target.trailStop;
        window.scrollTo({ top: targetScrollY, behavior: "smooth" });
      }
      applyJourneyProgress(target.trailStop, false);
      setActiveIndex(safeIdx);
    },
    [applyJourneyProgress, showPinnedDesktop]
  );

  // Click-only stone landmark handler (zero hover triggering)
  const handleMarkerClick = useCallback(
    (milestone: JourneyMilestone) => {
      const isAlreadyDisplayed = activeDisplayedId === milestone.id;
      if (isAlreadyDisplayed) {
        clickedStopProgressRef.current = null;
        setClickedId(null);
        setDismissedId(milestone.id);
        return;
      }

      const idx = JOURNEY_MILESTONES.findIndex((m) => m.id === milestone.id);
      if (idx >= 0) {
        scrollToMilestone(idx);
      } else {
        setDismissedId(null);
        setClickedId(milestone.id);
      }
    },
    [activeDisplayedId, scrollToMilestone]
  );

  const handleDismissTypography = useCallback(() => {
    clickedStopProgressRef.current = null;
    setClickedId(null);
    setDismissedId(prevReachedIdRef.current);
  }, []);

  const handleMobileSelectMilestone = useCallback((milestone: JourneyMilestone) => {
    const idx = JOURNEY_MILESTONES.findIndex((m) => m.id === milestone.id);
    if (idx >= 0) {
      setMobileStopIdx(idx);
    }
    setMobileInspectedId((prev) => (prev === milestone.id ? null : milestone.id));
  }, []);

  const handleMobileStep = useCallback((delta: -1 | 1) => {
    setMobileStopIdx((prev) => {
      const next = Math.max(0, Math.min(JOURNEY_MILESTONES.length - 1, prev + delta));
      const nextMilestone = JOURNEY_MILESTONES[next];
      if (nextMilestone) setMobileInspectedId(nextMilestone.id);
      return next;
    });
  }, []);

  return (
    <div ref={rootRef} className="relative w-full">
      {/* ═══════════════════════════════════════════════════════════════════════════
          DESKTOP 3D CINEMATIC MOUNTAIN JOURNEY (PERMANENT PIN HOST FOR REACT 19)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className={showPinnedDesktop ? "block" : "hidden"}>
        <div
          ref={desktopStageRef}
          data-testid={showPinnedDesktop ? "mountain-journey-stage" : undefined}
          data-scene-phase="beginning"
          data-journey-progress="0.000"
          data-active-stop="1"
          data-webgl-ready="false"
          className={
            showPinnedDesktop
              ? "relative h-[100svh] min-h-[680px] w-full overflow-hidden bg-[#F3E9DE] select-none"
              : ""
          }
        >
          {showPinnedDesktop && (
            <>
              {/* Interactive Three.js 3D Japanese Mountain Environment */}
              <Journey3DCanvas
                ref={desktopCanvasRef}
                milestones={JOURNEY_MILESTONES}
                initialProgress={0}
                activeMilestoneId={activeMilestoneId}
                displayedMilestoneId={activeDisplayedId}
                onSelectMilestone={handleMarkerClick}
                onDismiss={handleDismissTypography}
                stageDatasetRef={desktopStageRef}
              />

              {/* Scene 01 Opening Headline (settles quietly in open upper-left sky before walking begins) */}
              <div
                ref={introRef}
                data-testid="journey-intro-headline"
                style={{ zIndex: 25 }}
                className="pointer-events-none absolute left-[max(40px,5vw)] top-[96px] max-w-[540px] will-change-transform"
              >
                <p className="m-0 font-mono text-[11px] uppercase tracking-[0.22em] text-[#792B33]/72 tabular-nums">
                  Chapter {JOURNEY_INTRO.chapterNumber} · {JOURNEY_INTRO.chapterLabel}
                </p>
                <h2
                  id="experience-heading"
                  className="mt-2 m-0 font-normal uppercase leading-[0.9] tracking-[-0.03em] text-[#792B33]"
                  style={{
                    fontFamily: "var(--font-anton), Impact, sans-serif",
                    fontSize: "clamp(42px, 4.4vw, 66px)",
                    textWrap: "balance",
                  }}
                >
                  {JOURNEY_INTRO.heading}
                </h2>
                <p className="mt-3 m-0 text-[15px] leading-relaxed text-[#522429]/84 max-w-[44ch]">
                  {JOURNEY_INTRO.supportingText}
                </p>
              </div>

              {/* Borderless Editorial Company Typography (displays automatically on checkpoint arrival or click) */}
              <ExperienceTypography
                milestone={activeDisplayedMilestone}
                isManuallySelected={clickedId !== null}
                onDismiss={handleDismissTypography}
                variant="overlay"
              />

              {/* Compact 01 / 03 Journey Navigation */}
              <JourneyNavigation
                milestones={JOURNEY_MILESTONES}
                activeIndex={activeIndex}
                selectedId={activeDisplayedId}
                progressBarRef={progressBarRef}
                onSelectStop={scrollToMilestone}
                onStepStop={(delta) => scrollToMilestone(activeIndex + delta)}
              />
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          REDUCED-MOTION ACCESSIBLE VIEW (STATIC PANORAMA + READABLE 3-STOP LIST)
          ═══════════════════════════════════════════════════════════════════════════ */}
      {!showPinnedDesktop && reducedMotion && (
        <div
          data-testid="experience-accessible-timeline"
          className="page-container pt-12 pb-14 space-y-10"
        >
          <ChapterHeading
            id="experience-heading"
            number={JOURNEY_INTRO.chapterNumber}
            label={JOURNEY_INTRO.chapterLabel}
            heading={JOURNEY_INTRO.heading}
            supportingText={JOURNEY_INTRO.supportingText}
            surface="ivory"
          />

          {/* Quiet static sumi-e mountain panorama header */}
          <div className="relative h-44 sm:h-56 w-full overflow-hidden border-y border-[#792B33]/20 bg-[#F3E9DE]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={JOURNEY_ARTWORK.farMountains}
              alt="Japanese sumi-e ink-wash mountain horizon"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover object-bottom opacity-80"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={JOURNEY_ARTWORK.midRidges}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover object-bottom opacity-75"
            />
            <div className="absolute bottom-3 left-6">
              <TravelerSprite
                walkFrame={0}
                isWalking={false}
                facing="forward"
                sizePx={70}
              />
            </div>
          </div>

          {/* Borderless editorial list of all 3 chronological stops */}
          <ol className="m-0 list-none space-y-10 p-0">
            {JOURNEY_MILESTONES.map((milestone) => (
              <li
                key={milestone.id}
                className="border-t border-[#792B33]/22 pt-6 first:border-t-0 first:pt-0"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  <div className="md:col-span-5">
                    <p className="m-0 font-mono text-xs uppercase tracking-[0.22em] text-[#792B33]/72 tabular-nums">
                      {milestone.number} · {milestone.period}
                    </p>
                    <h3
                      className="mt-1.5 m-0 font-normal uppercase leading-[0.9] tracking-[-0.02em] text-[#792B33]"
                      style={{
                        fontFamily: "var(--font-anton), Impact, sans-serif",
                        fontSize: "clamp(34px, 4vw, 52px)",
                      }}
                    >
                      {milestone.companyName}
                    </h3>
                    <p className="mt-2 m-0 text-sm font-semibold text-[#4E1D23]">
                      {milestone.role}
                    </p>
                    <p className="mt-0.5 m-0 font-mono text-xs text-[#792B33]/72">
                      {milestone.location}
                    </p>
                  </div>
                  <div className="md:col-span-7 space-y-3">
                    <ul className="m-0 list-none space-y-2 p-0 text-sm leading-relaxed text-[#462126]">
                      {milestone.achievements.map((item, idx) => (
                        <li key={idx} className="flex gap-2.5">
                          <span aria-hidden="true" className="text-[#792B33]/65">
                            —
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="m-0 pt-2 font-mono text-xs text-[#792B33]/78">
                      {milestone.technologies.join(" · ")}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MOBILE INTERACTIVE 3D JOURNEY (< 1024px, NO PINNING, TAP-FRIENDLY CONTROLS)
          ═══════════════════════════════════════════════════════════════════════════ */}
      {!showPinnedDesktop && !reducedMotion && (
        <div
          data-testid="experience-mobile-journey"
          className="page-container pt-20 pb-12 space-y-6"
        >
          <ChapterHeading
            id="experience-heading"
            number={JOURNEY_INTRO.chapterNumber}
            label={JOURNEY_INTRO.chapterLabel}
            heading={JOURNEY_INTRO.heading}
            supportingText={JOURNEY_INTRO.supportingText}
            surface="ivory"
          />

          {/* Compact interactive Three.js 3D mountain window */}
          <div className="relative h-[300px] sm:h-[340px] w-full overflow-hidden border-y border-[#792B33]/20 bg-[#F3E9DE]">
            <Journey3DCanvas
              ref={mobileCanvasRef}
              milestones={JOURNEY_MILESTONES}
              initialProgress={INITIAL_MOBILE_PROGRESS}
              activeMilestoneId={mobileActiveMilestone.id}
              displayedMilestoneId={mobileInspectedId}
              onSelectMilestone={handleMobileSelectMilestone}
              onDismiss={() => setMobileInspectedId(null)}
              compact
            />
          </div>

          {/* Mobile step controls (01 / 03 + Prev / Next + direct stop selection) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#792B33]/18 pb-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#792B33] tabular-nums">
              {String(mobileStopIdx + 1).padStart(2, "0")} /{" "}
              {String(JOURNEY_MILESTONES.length).padStart(2, "0")}
            </span>

            <div className="flex items-center gap-3">
              {JOURNEY_MILESTONES.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMobileStopIdx(idx);
                    setMobileInspectedId(m.id);
                  }}
                  className={`min-h-[40px] px-1 font-mono text-[11px] uppercase tracking-[0.14em] whitespace-nowrap cursor-pointer transition-colors ${
                    idx === mobileStopIdx
                      ? "text-[#792B33] font-semibold underline underline-offset-4"
                      : "text-[#792B33]/55 hover:text-[#792B33]"
                  }`}
                >
                  {m.number} {m.companyName}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous milestone"
                disabled={mobileStopIdx <= 0}
                onClick={() => handleMobileStep(-1)}
                className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/30 text-[#792B33] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next milestone"
                disabled={mobileStopIdx >= JOURNEY_MILESTONES.length - 1}
                onClick={() => handleMobileStep(1)}
                className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/30 text-[#792B33] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Inline borderless company typography beneath the 3D mountain window */}
          <ExperienceTypography
            milestone={mobileInspectedMilestone}
            isManuallySelected={mobileInspectedId !== null}
            onDismiss={() => setMobileInspectedId(null)}
            variant="inline"
          />
        </div>
      )}
    </div>
  );
}
