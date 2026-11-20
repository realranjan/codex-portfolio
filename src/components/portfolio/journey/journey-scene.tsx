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
  JOURNEY_WORLD,
  MOUNTAIN_TRAIL_POINTS,
  type JourneyMilestone,
} from "@/data/experience-journey";
import {
  computeMountainJourneyPose,
  stepTravelerAnimation,
} from "@/lib/mountain-journey";
import {
  useIsDesktop,
  usePrefersReducedMotion,
} from "@/components/portfolio/camera-primitives";
import { ChapterHeading } from "@/components/portfolio/editorial-primitives";
import { ParallaxLayer } from "@/components/portfolio/journey/parallax-layer";
import { JourneyPath } from "@/components/portfolio/journey/journey-path";
import { TravelerSprite } from "@/components/portfolio/journey/traveler-sprite";
import { MilestoneMarker } from "@/components/portfolio/journey/milestone-marker";
import { ExperienceTypography } from "@/components/portfolio/journey/experience-typography";
import { JourneyNavigation } from "@/components/portfolio/journey/journey-navigation";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * JOURNEY SCENE — 7-LAYER 2.5D INTERACTIVE JAPANESE MOUNTAIN PASSAGE
 * -------------------------------------------------------------------------------
 * Desktop (>= 1024px, normal motion):
 *   1. Background sky & distant sumi-e mountain silhouettes (0.14x parallax)
 *   2. Soft atmospheric ink mist band (0.28x parallax)
 *   3. Middle-distance sculpted rocky mountain ridges & pines (0.54x parallax)
 *   4. Main winding stone/earth trail & embedded stone markers (1.00x world plane)
 *   5. Scroll-driven 8-frame animated Japanese traveler cat (1.00x trail anchor)
 *   6. Near occluding mountain crag ridge (1.24x) + foreground pines (1.42x)
 *   7. Accessible HTML editorial intro, borderless hover/click company typography,
 *      and compact 01 / 03 milestone navigation
 *
 * Mobile (< 1024px):
 *   Simplified 2.5D mountain viewport with tap-friendly stone markers, step
 *   navigation, and readable borderless typography positioned below the scene.
 *
 * Reduced Motion:
 *   Static sumi-e mountain panorama header + accessible 3-company editorial list.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export function JourneyScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  const desktopStageRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  // Direct DOM refs for 60fps compositor-only layer transforms (zero React setState on scroll frames)
  const farLayerRef = useRef<HTMLDivElement>(null);
  const mistLayerRef = useRef<HTMLDivElement>(null);
  const midLayerRef = useRef<HTMLDivElement>(null);
  const trailWorldRef = useRef<HTMLDivElement>(null);
  const occludingRidgeRef = useRef<HTMLDivElement>(null);
  const fgPinesRef = useRef<HTMLDivElement>(null);
  const catAnchorRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const traveledPathRef = useRef<SVGPathElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Scroll-coupled character kinematics refs
  const prevProgressRef = useRef(0);
  const accumulatedDistRef = useRef(0);
  const facingRef = useRef<"forward" | "backward">("forward");
  const idleTimerRef = useRef<number | null>(null);
  const prevReachedIdRef = useRef<string | null>(null);
  const clickedStopProgressRef = useRef<number | null>(null);

  // Discrete React state (updated only on meaningful state transitions)
  const [activeIndex, setActiveIndex] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [facing, setFacing] = useState<"forward" | "backward">("forward");
  const [catSlopeDeg, setCatSlopeDeg] = useState(0);
  const [milestoneReveal, setMilestoneReveal] = useState<readonly number[]>([
    0.4, 0, 0,
  ]);
  const [reachedId, setReachedId] = useState<string | null>(null);
  const [clickedId, setClickedId] = useState<string | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  // Mobile state (traveler starts at Stop 01 and displays its details automatically; tap marker or steps to inspect/switch)
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

  const mobileActiveMilestone =
    JOURNEY_MILESTONES[mobileStopIdx] ?? JOURNEY_MILESTONES[0];
  const mobileInspectedMilestone = useMemo(
    () => JOURNEY_MILESTONES.find((m) => m.id === mobileInspectedId) ?? null,
    [mobileInspectedId]
  );

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

  // Cleanup idle timer on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    };
  }, []);

  /**
   * Single-source-of-truth pose applicator driven by ScrollTrigger progress [0..1].
   */
  const applyJourneyProgress = useCallback((rawProgress: number, isUserScroll: boolean) => {
    const stageEl = desktopStageRef.current;
    const vw = stageEl?.clientWidth || 1440;
    const vh = stageEl?.clientHeight || 900;

    const pose = computeMountainJourneyPose(
      rawProgress,
      MOUNTAIN_TRAIL_POINTS,
      JOURNEY_MILESTONES,
      vw,
      vh,
      JOURNEY_WORLD.width,
      JOURNEY_WORLD.height
    );

    if (stageEl) {
      stageEl.dataset.scenePhase = pose.scenePhase;
      stageEl.dataset.journeyProgress = pose.rawProgress.toFixed(3);
      stageEl.dataset.activeStop = String(pose.activeMilestoneIndex + 1);
      stageEl.dataset.cameraScale = pose.cameraScale.toFixed(3);
      stageEl.dataset.farShiftX = pose.layers.farMountains.xPx.toFixed(1);
      stageEl.dataset.midShiftX = pose.layers.midRidges.xPx.toFixed(1);
      stageEl.dataset.fgShiftX = pose.layers.fgPines.xPx.toFixed(1);
    }

    // Layer 1: Distant sumi-e peaks
    if (farLayerRef.current) {
      const l = pose.layers.farMountains;
      farLayerRef.current.style.transform = `translate3d(${l.xPx}px, ${l.yPx}px, 0) scale(${l.scale})`;
    }

    // Layer 2: Soft atmospheric mist
    if (mistLayerRef.current) {
      const l = pose.layers.mistBand;
      mistLayerRef.current.style.transform = `translate3d(${l.xPx}px, ${l.yPx}px, 0) scale(${l.scale})`;
    }

    // Layer 3: Mid-ground rocky mountain ridges & pines
    if (midLayerRef.current) {
      const l = pose.layers.midRidges;
      midLayerRef.current.style.transform = `translate3d(${l.xPx}px, ${l.yPx}px, 0) scale(${l.scale})`;
    }

    // Layer 4 & 5: Panoramic 3000x900 trail world (footpath + stone markers + traveler cat)
    if (trailWorldRef.current) {
      const l = pose.layers.trailWorld;
      trailWorldRef.current.style.transform = `translate3d(${l.xPx}px, ${l.yPx}px, 0) scale(${l.scale})`;
    }

    // Traveler cat anchor inside trail world coordinates
    if (catAnchorRef.current) {
      catAnchorRef.current.style.transform = `translate3d(${pose.catWorld.x}px, ${pose.catWorld.y}px, 0) translate(-50%, -91%) scale(${pose.catDepthScale})`;
    }

    // Layer 6A: Near occluding rocky mountain ridge (sweeps across bends to hide/reveal milestones)
    if (occludingRidgeRef.current) {
      const l = pose.layers.occludingRidge;
      occludingRidgeRef.current.style.transform = `translate3d(${l.xPx}px, ${l.yPx}px, 0) scale(${l.scale})`;
    }

    // Layer 6B: Foreground Japanese pine boughs & grass blades
    if (fgPinesRef.current) {
      const l = pose.layers.fgPines;
      fgPinesRef.current.style.transform = `translate3d(${l.xPx}px, ${l.yPx}px, 0) scale(${l.scale})`;
    }

    // Scene 01 Opening Headline reveal & graceful exit
    if (introRef.current) {
      introRef.current.style.opacity = String(pose.introOpacity);
      introRef.current.style.transform = `translate3d(0, ${pose.introTranslateYPx}px, 0)`;
    }

    // Traveled burgundy footpath ink trace
    if (traveledPathRef.current) {
      const totalLen = traveledPathRef.current.getTotalLength();
      traveledPathRef.current.style.strokeDasharray = `${totalLen}`;
      traveledPathRef.current.style.strokeDashoffset = `${(totalLen * (1 - pose.trailT)).toFixed(1)}`;
    }

    // Compact bottom navigation hairline progress rule
    if (progressBarRef.current) {
      progressBarRef.current.style.transform = `scaleX(${pose.rawProgress.toFixed(4)})`;
    }

    // Scroll-coupled 8-frame traveler cat locomotion
    if (isUserScroll) {
      const step = stepTravelerAnimation({
        prevProgress: prevProgressRef.current,
        nextProgress: rawProgress,
        prevAccumulatedDistance: accumulatedDistRef.current,
        prevFacing: facingRef.current,
      });

      if (step.isMoving) {
        accumulatedDistRef.current = step.accumulatedDistance;
        facingRef.current = step.facing;
        setFacing((prev) => (prev === step.facing ? prev : step.facing));
        setWalkFrame((prev) => (prev === step.walkFrame ? prev : step.walkFrame));
        setIsWalking(true);

        if (idleTimerRef.current !== null) {
          window.clearTimeout(idleTimerRef.current);
        }
        // Smoothly settle back into idle 160ms after scrolling stops (no endless autoplay)
        idleTimerRef.current = window.setTimeout(() => {
          setIsWalking(false);
          idleTimerRef.current = null;
        }, 160);
      }
    }
    prevProgressRef.current = rawProgress;

    setCatSlopeDeg((prev) =>
      Math.abs(prev - pose.catSlopeDeg) > 0.6 ? pose.catSlopeDeg : prev
    );
    setActiveIndex((prev) =>
      prev === pose.activeMilestoneIndex ? prev : pose.activeMilestoneIndex
    );
    setMilestoneReveal((prev) => {
      const changed = pose.milestoneReveal.some(
        (v, idx) => Math.abs(v - (prev[idx] ?? 0)) > 0.04
      );
      return changed ? pose.milestoneReveal : prev;
    });

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
  }, []);

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

  // Smoothly scroll virtual camera to a specific milestone index and display it
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

  // Click-only stone marker handler (zero hover triggering)
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

  return (
    <div ref={rootRef} className="relative w-full">
      {/* ═══════════════════════════════════════════════════════════════════════════
          DESKTOP 2.5D CINEMATIC MOUNTAIN JOURNEY (PERMANENT PIN HOST FOR REACT 19)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className={showPinnedDesktop ? "block" : "hidden"}>
        <div
          ref={desktopStageRef}
          data-testid={showPinnedDesktop ? "mountain-journey-stage" : undefined}
          data-scene-phase="beginning"
          data-journey-progress="0.000"
          data-active-stop="1"
          data-camera-scale="1.000"
          onClick={handleDismissTypography}
          style={{ perspective: "1200px" }}
          className={
            showPinnedDesktop
              ? "relative h-[100svh] min-h-[680px] w-full overflow-hidden bg-[#F3E9DE] select-none"
              : ""
          }
        >
          {showPinnedDesktop && (
            <>
              {/* Soft warm-ivory atmospheric sky wash */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, #F3E9DE 0%, #F5ECE3 58%, #EDE2D5 100%)",
                }}
              />

              {/* LAYER 1: Distant sumi-e mountain silhouettes — compact, airy horizon scale (0.14x parallax) */}
              <ParallaxLayer
                layerRef={farLayerRef}
                zIndex={1}
                testId="journey-layer-far"
                className="flex items-end"
              >
                <div className="relative mb-[24vh] h-[44vh] max-h-[410px] w-max flex items-end -ml-[4vw]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={JOURNEY_ARTWORK.farMountains}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    style={{
                      WebkitMaskImage:
                        "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
                      WebkitMaskComposite: "source-in",
                      maskImage:
                        "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
                      maskComposite: "intersect",
                    }}
                    className="h-full w-auto aspect-[16/9] shrink-0 object-cover object-bottom opacity-70"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={JOURNEY_ARTWORK.farMountains}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    style={{
                      WebkitMaskImage:
                        "linear-gradient(90deg, transparent 0%, black 16%, black 88%, transparent 100%), linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
                      WebkitMaskComposite: "source-in",
                      maskImage:
                        "linear-gradient(90deg, transparent 0%, black 16%, black 88%, transparent 100%), linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
                      maskComposite: "intersect",
                    }}
                    className="-ml-[140px] h-full w-auto aspect-[16/9] shrink-0 object-cover object-bottom -scale-x-100 opacity-68"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={JOURNEY_ARTWORK.farMountains}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    style={{
                      WebkitMaskImage:
                        "linear-gradient(90deg, transparent 0%, black 16%, black 90%, transparent 100%), linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
                      WebkitMaskComposite: "source-in",
                      maskImage:
                        "linear-gradient(90deg, transparent 0%, black 16%, black 90%, transparent 100%), linear-gradient(180deg, black 0%, black 80%, transparent 100%)",
                      maskComposite: "intersect",
                    }}
                    className="-ml-[140px] h-full w-auto aspect-[16/9] shrink-0 object-cover object-bottom opacity-68"
                  />
                </div>
              </ParallaxLayer>

              {/* LAYER 2: Atmospheric soft ink-paper mist band separating far peaks from mid ridges (0.28x parallax) */}
              <ParallaxLayer
                layerRef={mistLayerRef}
                zIndex={2}
                testId="journey-layer-mist"
              >
                <svg
                  viewBox="0 0 2200 900"
                  preserveAspectRatio="xMidYMax slice"
                  className="h-full w-[145vw] -ml-[10vw] block"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="journeyMistFade" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#F3E9DE" stopOpacity="0" />
                      <stop offset="48%" stopColor="#F3E9DE" stopOpacity="0.72" />
                      <stop offset="100%" stopColor="#F3E9DE" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 530 Q 340 492, 720 536 T 1480 512 T 2200 540 L 2200 720 L 0 720 Z"
                    fill="url(#journeyMistFade)"
                  />
                  <ellipse
                    cx="720"
                    cy="595"
                    rx="460"
                    ry="48"
                    fill="#F3E9DE"
                    fillOpacity="0.54"
                  />
                  <ellipse
                    cx="1540"
                    cy="575"
                    rx="520"
                    ry="54"
                    fill="#F3E9DE"
                    fillOpacity="0.5"
                  />
                </svg>
              </ParallaxLayer>

              {/* LAYER 3: Smaller, crisp middle-distance rocky mountain peaks & miniature pines (0.54x)
                  Each span matches its exact 16:9 image bounds (w-auto aspect-[16/9]) so horizontal
                  feather masks align 1:1 with the artwork edges—zero vertical seams or sharp cuts. */}
              <ParallaxLayer
                layerRef={midLayerRef}
                zIndex={3}
                testId="journey-layer-mid"
                className="flex items-end"
              >
                <div className="relative mb-[25vh] h-[34vh] max-h-[320px] w-max flex items-end -ml-[40px]">
                  {[0, 1, 2, 3, 4].map((spanIdx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={spanIdx}
                      src={JOURNEY_ARTWORK.midRidges}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      style={{
                        WebkitMaskImage:
                          "linear-gradient(90deg, transparent 0%, black 18%, black 82%, transparent 100%), linear-gradient(180deg, black 0%, black 76%, transparent 100%)",
                        WebkitMaskComposite: "source-in",
                        maskImage:
                          "linear-gradient(90deg, transparent 0%, black 18%, black 82%, transparent 100%), linear-gradient(180deg, black 0%, black 76%, transparent 100%)",
                        maskComposite: "intersect",
                      }}
                      className={`${spanIdx === 0 ? "" : "-ml-[130px]"} h-full w-auto aspect-[16/9] shrink-0 object-cover object-bottom ${
                        spanIdx % 2 === 1 ? "-scale-x-100 opacity-[0.84]" : "opacity-[0.88]"
                      } contrast-[1.06]`}
                    />
                  ))}
                </div>
              </ParallaxLayer>

              {/* Soft valley mist veil melting the mountain foothills seamlessly into the footpath terrace */}
              <div
                aria-hidden="true"
                style={{ zIndex: 4 }}
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%]"
              >
                <div
                  className="h-full w-full"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(243,233,222,0) 0%, rgba(243,233,222,0.58) 38%, rgba(243,233,222,0.96) 76%, #F3E9DE 100%)",
                  }}
                />
              </div>

              {/* LAYERS 4 & 5: Panoramic 3000 x 900 Trail World (Blended Hillside Footpath + Stone Landmarks + Traveler Cat) */}
              <div
                ref={trailWorldRef}
                data-testid="journey-layer-trail"
                style={{
                  zIndex: 10,
                  width: `${JOURNEY_WORLD.width}px`,
                  height: `${JOURNEY_WORLD.height}px`,
                  transformOrigin: "center center",
                }}
                className="absolute left-0 top-0 will-change-transform pointer-events-none"
              >
                {/* Layer 4A: Blended sumi-e hillside & winding stone/earth trail SVG */}
                <JourneyPath traveledPathRef={traveledPathRef} />

                {/* Layer 4B: Three physically grounded stone milestone markers (click + arrival only) */}
                {JOURNEY_MILESTONES.map((milestone, idx) => (
                  <MilestoneMarker
                    key={milestone.id}
                    milestone={milestone}
                    isActiveStop={idx === activeIndex}
                    isDisplayed={activeDisplayedId === milestone.id}
                    revealStrength={milestoneReveal[idx] ?? 1}
                    onClick={handleMarkerClick}
                  />
                ))}

                {/* Layer 5: Scroll-controlled 8-frame Japanese traveler cat */}
                <div
                  ref={catAnchorRef}
                  style={{
                    left: 0,
                    top: 0,
                    transform: `translate3d(${MOUNTAIN_TRAIL_POINTS[0].x}px, ${MOUNTAIN_TRAIL_POINTS[0].y}px, 0) translate(-50%, -91%)`,
                  }}
                  className="absolute z-20 will-change-transform pointer-events-none"
                >
                  <TravelerSprite
                    walkFrame={walkFrame}
                    isWalking={isWalking}
                    facing={facing}
                    slopeDeg={catSlopeDeg}
                    sizePx={90}
                  />
                </div>
              </div>

              {/* LAYER 6A: Compact, low-profile foothill rock outcrops (1.24x parallax)
                  Scaled small and softly feathered along the lower slope edge so they add depth
                  without obstructing the road or creating giant dark clutter. */}
              <ParallaxLayer
                layerRef={occludingRidgeRef}
                zIndex={15}
                testId="journey-layer-occluding-ridge"
                className="pointer-events-none"
              >
                <div className="relative h-full w-[3600px]">
                  {/* Small rocky outcrop nestled below the bend between Stop 01 and Stop 02 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={JOURNEY_ARTWORK.nearCrag}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    style={{
                      left: "1240px",
                      bottom: "-72px",
                      width: "440px",
                      WebkitMaskImage:
                        "linear-gradient(90deg, transparent 0%, black 22%, black 78%, transparent 100%), linear-gradient(180deg, black 0%, black 68%, transparent 100%)",
                      WebkitMaskComposite: "source-in",
                      maskImage:
                        "linear-gradient(90deg, transparent 0%, black 22%, black 78%, transparent 100%), linear-gradient(180deg, black 0%, black 68%, transparent 100%)",
                      maskComposite: "intersect",
                    }}
                    className="absolute h-auto opacity-[0.62] select-none"
                  />
                  {/* Secondary compact foothill rock nestled below the pass toward Stop 03 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={JOURNEY_ARTWORK.nearCrag}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    style={{
                      left: "2280px",
                      bottom: "-86px",
                      width: "410px",
                      WebkitMaskImage:
                        "linear-gradient(90deg, transparent 0%, black 22%, black 78%, transparent 100%), linear-gradient(180deg, black 0%, black 68%, transparent 100%)",
                      WebkitMaskComposite: "source-in",
                      maskImage:
                        "linear-gradient(90deg, transparent 0%, black 22%, black 78%, transparent 100%), linear-gradient(180deg, black 0%, black 68%, transparent 100%)",
                      maskComposite: "intersect",
                    }}
                    className="absolute h-auto -scale-x-100 opacity-[0.58] select-none"
                  />
                </div>
              </ParallaxLayer>

              {/* LAYER 6B: Crisp, restrained sumi-e foreground grass reeds strictly along bottom edge (1.42x)
                  Zero cropped trunks or muddying foliage cutting across the road or sky. */}
              <ParallaxLayer
                layerRef={fgPinesRef}
                zIndex={20}
                testId="journey-layer-fg-pines"
                className="pointer-events-none flex items-end"
              >
                <svg
                  viewBox="0 0 3800 140"
                  preserveAspectRatio="none"
                  className="h-[118px] w-[3800px] shrink-0 block"
                  aria-hidden="true"
                >
                  <g fill="none" stroke="#362A28" strokeLinecap="round" opacity="0.34">
                    {[120, 560, 1080, 1680, 2240, 2860, 3420].map((xPos, idx) => (
                      <g
                        key={xPos}
                        transform={`translate(${xPos}, 140) scale(${idx % 2 === 0 ? 1 : -0.92}, 1)`}
                      >
                        <path d="M 0 0 Q -12 -38 -32 -66" strokeWidth="2.1" />
                        <path d="M 8 0 Q 4 -48 -10 -82" strokeWidth="2.3" />
                        <path d="M 18 0 Q 24 -42 42 -68" strokeWidth="1.9" />
                        <path d="M 28 0 Q 42 -28 62 -46" strokeWidth="1.5" />
                        <path d="M -14 0 Q -26 -24 -44 -38" strokeWidth="1.5" />
                      </g>
                    ))}
                  </g>
                </svg>
              </ParallaxLayer>

              {/* LAYER 7A: Scene 01 Opening Headline (settles quietly in clean upper-left sky before walking begins) */}
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

              {/* LAYER 7B: Borderless Editorial Company Typography (displays automatically on checkpoint arrival or click) */}
              <ExperienceTypography
                milestone={activeDisplayedMilestone}
                isManuallySelected={clickedId !== null}
                onDismiss={handleDismissTypography}
                variant="overlay"
              />

              {/* LAYER 7C: Compact 01 / 03 Journey Navigation */}
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
          MOBILE STEP-BASED 2.5D JOURNEY (< 1024px, TAP-FRIENDLY MARKERS, NO PINNING)
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

          {/* Simplified 2.5D mountain illustration window with compact clear peaks and blended hillside trail */}
          <div className="relative h-[280px] sm:h-[320px] w-full overflow-hidden border-y border-[#792B33]/20 bg-[#F3E9DE]">
            {/* Far mountain silhouette (seamless aspect-matched horizon) */}
            <div
              style={{
                transform: `translate3d(${-mobileStopIdx * 18}px, 0, 0)`,
              }}
              className="pointer-events-none absolute left-0 bottom-[62px] flex h-[156px] w-max transition-transform duration-500 ease-out"
            >
              {[0, 1].map((idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  src={JOURNEY_ARTWORK.farMountains}
                  alt={idx === 0 ? "Distant Japanese sumi-e mountains" : ""}
                  aria-hidden={idx === 0 ? undefined : true}
                  referrerPolicy="no-referrer"
                  style={{
                    WebkitMaskImage:
                      "linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)",
                    maskImage:
                      "linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)",
                  }}
                  className={`${idx === 0 ? "-ml-6" : "-ml-16 -scale-x-100"} h-full w-auto aspect-[16/9] shrink-0 object-cover object-bottom opacity-72`}
                />
              ))}
            </div>
            {/* Mid rocky ridge (compact, crisp, continuous feathered range behind the trail) */}
            <div
              style={{
                transform: `translate3d(${-mobileStopIdx * 48}px, 0, 0)`,
              }}
              className="pointer-events-none absolute left-0 bottom-[60px] flex h-[132px] w-max transition-transform duration-500 ease-out"
            >
              {[0, 1, 2].map((idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  src={JOURNEY_ARTWORK.midRidges}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  style={{
                    WebkitMaskImage:
                      "linear-gradient(90deg, transparent 0%, black 18%, black 82%, transparent 100%), linear-gradient(180deg, black 0%, black 75%, transparent 100%)",
                    WebkitMaskComposite: "source-in",
                    maskImage:
                      "linear-gradient(90deg, transparent 0%, black 18%, black 82%, transparent 100%), linear-gradient(180deg, black 0%, black 75%, transparent 100%)",
                    maskComposite: "intersect",
                  }}
                  className={`${idx === 0 ? "-ml-4" : "-ml-16"} ${idx % 2 === 1 ? "-scale-x-100" : ""} h-full w-auto aspect-[16/9] shrink-0 object-cover object-bottom opacity-86 contrast-[1.06]`}
                />
              ))}
            </div>

            {/* Soft blended hillside & organic footpath SVG */}
            <svg
              viewBox="0 0 360 128"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[116px] w-full"
              aria-hidden="true"
            >
              <defs>
                <filter id="mobileTrailSoft" x="-10%" y="-30%" width="120%" height="160%">
                  <feGaussianBlur stdDeviation="3.2" />
                </filter>
                <linearGradient id="mobileHillWash" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#E3D5C5" stopOpacity="0.82" />
                  <stop offset="48%" stopColor="#EFE4D7" stopOpacity="0.98" />
                  <stop offset="100%" stopColor="#F3E9DE" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path
                d="M -20 74 Q 95 54, 180 64 T 380 46 L 380 128 L -20 128 Z"
                fill="url(#mobileHillWash)"
              />
              <path
                d="M -20 82 Q 95 62, 180 72 T 380 54"
                fill="none"
                stroke="#CBB8A4"
                strokeOpacity="0.52"
                strokeWidth="22"
                filter="url(#mobileTrailSoft)"
              />
              <path
                d="M -20 82 Q 95 62, 180 72 T 380 54"
                fill="none"
                stroke="#EBE0D3"
                strokeOpacity="0.88"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M -20 82 Q 95 62, 180 72 T 380 54"
                fill="none"
                stroke="#792B33"
                strokeOpacity="0.45"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>

            {/* Traveler cat positioned near active stop */}
            <div
              style={{
                left: `${24 + mobileStopIdx * 22}%`,
              }}
              className="pointer-events-none absolute bottom-5 -translate-x-1/2 transition-all duration-500 ease-out"
            >
              <TravelerSprite
                walkFrame={mobileStopIdx * 2}
                isWalking={false}
                facing="forward"
                sizePx={72}
              />
            </div>

            {/* Tap-friendly stone marker button for current destination */}
            <button
              type="button"
              data-testid={`mobile-marker-${mobileActiveMilestone.id}`}
              aria-label={`Tap to inspect ${mobileActiveMilestone.companyName}`}
              aria-expanded={mobileInspectedId === mobileActiveMilestone.id}
              onClick={() =>
                setMobileInspectedId((prev) =>
                  prev === mobileActiveMilestone.id
                    ? null
                    : mobileActiveMilestone.id
                )
              }
              style={{
                left: `${56 + mobileStopIdx * 10}%`,
              }}
              className="absolute bottom-8 -translate-x-1/2 flex min-h-[44px] min-w-[44px] flex-col items-center cursor-pointer transition-all duration-500 ease-out"
            >
              <span
                style={{
                  textShadow:
                    "0 0 10px rgba(243,233,222,0.98), 0 0 4px rgba(243,233,222,0.96)",
                }}
                className="mb-1 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-[#792B33] font-semibold"
              >
                {mobileActiveMilestone.number} · {mobileActiveMilestone.companyName}
              </span>
              <svg width="44" height="64" viewBox="0 0 66 98" aria-hidden="true">
                <ellipse cx="33" cy="91" rx="22" ry="5" fill="#2A1F1E" fillOpacity="0.22" />
                <path
                  d="M 16 89 L 19 77 L 47 77 L 50 89 Z"
                  fill="#A6978C"
                  stroke="#3B2F2D"
                  strokeWidth="1.6"
                />
                <path
                  d="M 21 77 L 23 19 C 23 13, 28 9, 33 8 C 39 9, 43 13, 44 19 L 45 77 Z"
                  fill={
                    mobileInspectedId === mobileActiveMilestone.id
                      ? "#EFE2D3"
                      : "#CFC2B6"
                  }
                  stroke={
                    mobileInspectedId === mobileActiveMilestone.id
                      ? "#792B33"
                      : "#3B2F2D"
                  }
                  strokeWidth="2"
                />
                <rect x="30" y="14" width="6" height="6" rx="1" fill="#792B33" />
                <text
                  x="33"
                  y="46"
                  textAnchor="middle"
                  fill="#792B33"
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {mobileActiveMilestone.number}
                </text>
              </svg>
            </button>
          </div>

          {/* Mobile step controls: clean 2-row rhythm so 01 / 03 never wraps on 390px */}
          <div className="space-y-2 border-b border-[#792B33]/18 pb-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs tracking-[0.2em] text-[#792B33] tabular-nums whitespace-nowrap shrink-0">
                {mobileActiveMilestone.number} / 0{JOURNEY_MILESTONES.length}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  aria-label="Previous milestone"
                  disabled={mobileStopIdx <= 0}
                  onClick={() => {
                    const next = Math.max(0, mobileStopIdx - 1);
                    setMobileStopIdx(next);
                    setMobileInspectedId(JOURNEY_MILESTONES[next].id);
                  }}
                  className="inline-flex h-11 w-11 items-center justify-center border border-[#792B33]/30 text-[#792B33] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Next milestone"
                  disabled={mobileStopIdx >= JOURNEY_MILESTONES.length - 1}
                  onClick={() => {
                    const next = Math.min(
                      JOURNEY_MILESTONES.length - 1,
                      mobileStopIdx + 1
                    );
                    setMobileStopIdx(next);
                    setMobileInspectedId(JOURNEY_MILESTONES[next].id);
                  }}
                  className="inline-flex h-11 w-11 items-center justify-center border border-[#792B33]/30 text-[#792B33] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-5">
              {JOURNEY_MILESTONES.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMobileStopIdx(idx);
                    setMobileInspectedId(m.id);
                  }}
                  className={`min-h-[44px] font-mono text-[11px] uppercase tracking-[0.14em] whitespace-nowrap shrink-0 cursor-pointer ${
                    idx === mobileStopIdx
                      ? "text-[#792B33] font-semibold underline underline-offset-4"
                      : "text-[#792B33]/60"
                  }`}
                >
                  {m.number} {m.companyName}
                </button>
              ))}
            </div>
          </div>

          {/* Borderless mobile company typography shown for reached checkpoint / tapped marker */}
          {mobileInspectedMilestone ? (
            <ExperienceTypography
              milestone={mobileInspectedMilestone}
              isManuallySelected={false}
              onDismiss={() => setMobileInspectedId(null)}
              variant="inline"
            />
          ) : (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setMobileInspectedId(mobileActiveMilestone.id)}
                className="min-h-[44px] font-mono text-xs uppercase tracking-[0.18em] text-[#792B33] underline underline-offset-4 cursor-pointer"
              >
                Inspect {mobileActiveMilestone.companyName} details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
