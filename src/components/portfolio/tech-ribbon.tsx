"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChapterSurface } from "@/data/portfolio-content";
import {
  TECH_ICONS_MANIFEST,
  type TechIconEntry,
} from "@/data/tech-icons-manifest";
import {
  buildSeamlessTrackItems,
  DEFAULT_RIBBON_LANES,
  partitionIconsIntoLanes,
  stepRibbonKinematics,
  wrapRibbonOffset,
  type RibbonKinematicState,
  type RibbonLaneData,
} from "@/lib/ribbon-physics";
import { TechIcon } from "@/components/portfolio/tech-icon";
import { usePrefersReducedMotion } from "@/components/portfolio/camera-primitives";

export interface TechStackRibbonProps {
  /** Surrounding portfolio surface (#792B33 Burgundy or #F3E9DE Ivory) */
  surface?: ChapterSurface;
}

interface RibbonLaneRowProps {
  lane: RibbonLaneData;
  surface: ChapterSurface;
  isReducedMotion: boolean;
}

function RibbonLaneRow({
  lane,
  surface,
  isReducedMotion,
}: RibbonLaneRowProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstCopyRef = useRef<HTMLDivElement>(null);

  const [isDraggingUI, setIsDraggingUI] = useState(false);

  const loopItems = useMemo(
    () => buildSeamlessTrackItems(lane.items, 14),
    [lane.items]
  );

  // Refs for 60fps compositor-only motion without React re-renders
  const reducedMotionRef = useRef(isReducedMotion);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const draggingRef = useRef(false);
  const periodRef = useRef(0);
  const isVisibleRef = useRef(true);

  const dragMetaRef = useRef({
    pointerId: -1,
    lastX: 0,
    lastTimeMs: 0,
    velocityPxPerSec: 0,
  });

  const kinematicRef = useRef<RibbonKinematicState>({
    offsetPx: 0,
    velocityPxPerSec: 0,
    impulsePxPerSec: 0,
  });

  useEffect(() => {
    reducedMotionRef.current = isReducedMotion;
  }, [isReducedMotion]);

  // Measure single-copy width & run seamless requestAnimationFrame physics loop
  useEffect(() => {
    const viewportEl = viewportRef.current;
    const trackEl = trackRef.current;
    const firstCopyEl = firstCopyRef.current;
    if (!viewportEl || !trackEl || !firstCopyEl) return;

    const measure = () => {
      const w = firstCopyEl.getBoundingClientRect().width;
      if (w > 1) {
        periodRef.current = w;
        kinematicRef.current.offsetPx = wrapRibbonOffset(
          kinematicRef.current.offsetPx,
          w
        );
        trackEl.style.transform = `translate3d(${kinematicRef.current.offsetPx.toFixed(2)}px, 0, 0)`;
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(firstCopyEl);

    const io = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = entries[0]?.isIntersecting ?? true;
      },
      { rootMargin: "160px 0px" }
    );
    io.observe(viewportEl);

    // Subtle scroll-velocity kinetic drift
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      if (
        !isVisibleRef.current ||
        reducedMotionRef.current ||
        draggingRef.current ||
        hoveredRef.current
      ) {
        lastScrollY = window.scrollY;
        return;
      }
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      if (Math.abs(dy) < 0.5) return;
      const nudge =
        Math.max(-200, Math.min(200, dy * 2)) * lane.spec.baseDirection;
      kinematicRef.current.impulsePxPerSec = Math.max(
        -340,
        Math.min(340, kinematicRef.current.impulsePxPerSec + nudge * 0.22)
      );
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      rafId = window.requestAnimationFrame(tick);
      const dtSec = (now - lastTs) / 1000;
      lastTs = now;

      const period = periodRef.current;
      if (!isVisibleRef.current || period <= 0) return;

      const next = stepRibbonKinematics(kinematicRef.current, {
        periodPx: period,
        baseSpeedPxPerSec: lane.spec.baseSpeedPxPerSec,
        direction: lane.spec.baseDirection,
        speedMultiplier: 1,
        isPaused: reducedMotionRef.current,
        isHoveredOrFocused: hoveredRef.current || focusedRef.current,
        isDragging: draggingRef.current,
        dtSec,
      });

      kinematicRef.current = next;
      trackEl.style.transform = `translate3d(${next.offsetPx.toFixed(2)}px, 0, 0)`;
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      io.disconnect();
    };
  }, [lane.spec.baseDirection, lane.spec.baseSpeedPxPerSec]);

  // Direct pointer drag & fling (mouse + touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    draggingRef.current = true;
    setIsDraggingUI(true);

    dragMetaRef.current = {
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastTimeMs: performance.now(),
      velocityPxPerSec: 0,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic events without active pointer
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || e.pointerId !== dragMetaRef.current.pointerId) {
      return;
    }

    const now = performance.now();
    const dx = e.clientX - dragMetaRef.current.lastX;
    const dtMs = Math.max(4, now - dragMetaRef.current.lastTimeMs);

    dragMetaRef.current.lastX = e.clientX;
    dragMetaRef.current.lastTimeMs = now;

    const instantVel = (dx / dtMs) * 1000;
    dragMetaRef.current.velocityPxPerSec =
      dragMetaRef.current.velocityPxPerSec * 0.6 + instantVel * 0.4;

    const period = periodRef.current;
    if (period > 0 && trackRef.current) {
      kinematicRef.current.offsetPx = wrapRibbonOffset(
        kinematicRef.current.offsetPx + dx,
        period
      );
      trackRef.current.style.transform = `translate3d(${kinematicRef.current.offsetPx.toFixed(2)}px, 0, 0)`;
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || e.pointerId !== dragMetaRef.current.pointerId) {
      return;
    }

    draggingRef.current = false;
    setIsDraggingUI(false);

    kinematicRef.current.impulsePxPerSec = Math.max(
      -900,
      Math.min(900, dragMetaRef.current.velocityPxPerSec * 0.7)
    );

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already ended
    }
  };

  const isIvory = surface === "ivory";
  const borderClass = isIvory ? "border-[#792B33]/16" : "border-[#F3E9DE]/16";
  const dotClass = isIvory ? "bg-[#792B33]/35" : "bg-[#F3E9DE]/38";

  const renderCopy = (isClone: boolean) => (
    <div
      ref={isClone ? undefined : firstCopyRef}
      aria-hidden={isClone ? "true" : undefined}
      className="flex shrink-0 items-center"
    >
      {loopItems.map((icon: TechIconEntry, index: number) => (
        <div
          key={`${isClone ? "clone" : "primary"}-${lane.spec.id}-${icon.slug}-${index}`}
          className="flex shrink-0 items-center"
        >
          <div
            tabIndex={isClone ? -1 : 0}
            data-testid={isClone ? undefined : `ribbon-item-${icon.slug}`}
            data-ribbon-slug={icon.slug}
            onFocus={() => {
              focusedRef.current = true;
            }}
            onBlur={() => {
              focusedRef.current = false;
            }}
            className="group relative inline-flex items-center gap-3.5 px-5 sm:px-6 py-4 sm:py-5 whitespace-nowrap select-none focus-visible:outline-none"
          >
            <TechIcon
              icon={icon}
              surface={surface}
              size="md"
              className="transition-transform duration-200 group-hover:scale-110 group-focus-visible:scale-110"
            />

            <span
              className={`text-sm sm:text-[15.5px] font-medium tracking-[-0.01em] transition-colors duration-200 ${
                isIvory
                  ? "text-[#792B33]/82 group-hover:text-[#792B33] group-focus-visible:text-[#792B33]"
                  : "text-[#F3E9DE]/84 group-hover:text-[#F3E9DE] group-focus-visible:text-[#F3E9DE]"
              }`}
              style={{
                fontFamily: "var(--font-nav), var(--font-jakarta), sans-serif",
              }}
            >
              {icon.name}
            </span>

            {/* Subtle brand-colored underline accent on hover / focus */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-5 right-5 sm:left-6 sm:right-6 bottom-2 h-[2px] origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100 group-focus-visible:scale-x-100"
              style={{ backgroundColor: icon.brandColor }}
            />
          </div>

          {/* Clean geometric dot separator */}
          <span
            aria-hidden="true"
            data-ribbon-separator="dot"
            className={`mx-1.5 sm:mx-2.5 inline-block h-[4px] w-[4px] shrink-0 rounded-full ${dotClass}`}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={viewportRef}
      data-testid={`tech-ribbon-${lane.spec.id}`}
      data-hovered="false"
      onMouseEnter={(e) => {
        hoveredRef.current = true;
        e.currentTarget.dataset.hovered = "true";
      }}
      onMouseLeave={(e) => {
        hoveredRef.current = false;
        e.currentTarget.dataset.hovered = "false";
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`relative w-full overflow-hidden border-b ${borderClass} touch-pan-y ${
        isDraggingUI ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      <div
        ref={trackRef}
        data-testid={`tech-ribbon-track-${lane.spec.id}`}
        className="flex w-max items-center will-change-transform"
      >
        {renderCopy(false)}
        {renderCopy(true)}
      </div>
    </div>
  );
}

/**
 * Pure, full-bleed 3-lane interactive Infinite Tech Stack SVG Ribbon.
 *
 * - Showcases all 102 brand-accurate colored SVGs with geometric dot separators.
 * - Hovering any lane smoothly pauses it; leaving resumes seamlessly.
 * - Supports direct pointer drag/fling and subtle scroll drift with zero UI chrome.
 */
export function TechStackRibbon({ surface = "burgundy" }: TechStackRibbonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const lanes = useMemo(
    () => partitionIconsIntoLanes(TECH_ICONS_MANIFEST, DEFAULT_RIBBON_LANES),
    []
  );

  const isIvory = surface === "ivory";

  return (
    <div
      data-testid="tech-stack-ribbon"
      aria-label="Interactive technology stack ribbon"
      className={`relative mt-8 sm:mt-10 w-full border-t ${
        isIvory
          ? "border-[#792B33]/16 bg-[#F3E9DE] text-[#792B33]"
          : "border-[#F3E9DE]/16 bg-[#792B33] text-[#F3E9DE]"
      }`}
    >
      <div className="relative w-full">
        {lanes.map((lane) => (
          <RibbonLaneRow
            key={lane.spec.id}
            lane={lane}
            surface={surface}
            isReducedMotion={prefersReducedMotion}
          />
        ))}

        {/* Surface-matched left & right edge fade masks */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 sm:w-24 lg:w-32"
          style={{
            background: isIvory
              ? "linear-gradient(90deg, #F3E9DE 0%, rgba(243,233,222,0) 100%)"
              : "linear-gradient(90deg, #792B33 0%, rgba(121,43,51,0) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 sm:w-24 lg:w-32"
          style={{
            background: isIvory
              ? "linear-gradient(270deg, #F3E9DE 0%, rgba(243,233,222,0) 100%)"
              : "linear-gradient(270deg, #792B33 0%, rgba(121,43,51,0) 100%)",
          }}
        />
      </div>
    </div>
  );
}
