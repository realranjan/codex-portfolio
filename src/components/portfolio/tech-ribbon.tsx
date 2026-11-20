"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, Pause, Play } from "lucide-react";
import type { ChapterSurface } from "@/data/portfolio-content";
import {
  TECH_ICON_CATEGORIES,
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

type RibbonSpeedMultiplier = 0.5 | 1 | 1.75;

const SPEED_OPTIONS: readonly { label: string; value: RibbonSpeedMultiplier }[] = [
  { label: "0.5×", value: 0.5 },
  { label: "1×", value: 1 },
  { label: "1.75×", value: 1.75 },
];

export interface TechStackRibbonProps {
  /** Current surface theme (#792B33 Burgundy or #F3E9DE Ivory) */
  surface: ChapterSurface;
  /** Currently inspected/selected technology icon */
  activeIcon: TechIconEntry;
  /** Current search filter text to spotlight matching marks */
  searchQuery: string;
  /** Called when the user clicks an icon on any ribbon */
  onSelectIcon: (icon: TechIconEntry) => void;
  /** Called when the user hovers/focuses an icon on any ribbon */
  onPreviewIcon?: (icon: TechIconEntry) => void;
}

interface RibbonLaneRowProps {
  lane: RibbonLaneData;
  surface: ChapterSurface;
  isPlaying: boolean;
  isReversed: boolean;
  speedMultiplier: RibbonSpeedMultiplier;
  activeIconSlug: string;
  normalizedQuery: string;
  onSelectIcon: (icon: TechIconEntry) => void;
  onHoverIcon: (icon: TechIconEntry | null) => void;
}

function RibbonLaneRow({
  lane,
  surface,
  isPlaying,
  isReversed,
  speedMultiplier,
  activeIconSlug,
  normalizedQuery,
  onSelectIcon,
  onHoverIcon,
}: RibbonLaneRowProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstCopyRef = useRef<HTMLDivElement>(null);

  const [isDraggingUI, setIsDraggingUI] = useState(false);

  const loopItems = useMemo(
    () => buildSeamlessTrackItems(lane.items, 14),
    [lane.items]
  );

  // Refs for 60fps compositor-only animation without React re-renders
  const isPlayingRef = useRef(isPlaying);
  const directionRef = useRef<1 | -1>(
    isReversed ? (lane.spec.baseDirection === 1 ? -1 : 1) : lane.spec.baseDirection
  );
  const speedRef = useRef<RibbonSpeedMultiplier>(speedMultiplier);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const draggingRef = useRef(false);
  const periodRef = useRef(0);
  const isVisibleRef = useRef(true);

  const dragMetaRef = useRef({
    pointerId: -1,
    startX: 0,
    lastX: 0,
    lastTimeMs: 0,
    totalMovedPx: 0,
    velocityPxPerSec: 0,
    suppressNextClick: false,
  });

  const kinematicRef = useRef<RibbonKinematicState>({
    offsetPx: 0,
    velocityPxPerSec: 0,
    impulsePxPerSec: 0,
  });

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    directionRef.current = isReversed
      ? lane.spec.baseDirection === 1
        ? -1
        : 1
      : lane.spec.baseDirection;
  }, [isReversed, lane.spec.baseDirection]);

  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  // Measure single-copy width + drive seamless requestAnimationFrame physics loop
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

    // Pause RAF work when scrolled completely off-screen
    const io = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = entries[0]?.isIntersecting ?? true;
      },
      { rootMargin: "160px 0px" }
    );
    io.observe(viewportEl);

    // Subtle scroll-velocity kinetic nudge (strictly clamped & smooth)
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      if (!isVisibleRef.current || !isPlayingRef.current || draggingRef.current) {
        lastScrollY = window.scrollY;
        return;
      }
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      if (Math.abs(dy) < 0.5) return;
      const nudge = Math.max(-220, Math.min(220, dy * 2.2)) * directionRef.current;
      kinematicRef.current.impulsePxPerSec = Math.max(
        -380,
        Math.min(380, kinematicRef.current.impulsePxPerSec + nudge * 0.25)
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
        direction: directionRef.current,
        speedMultiplier: speedRef.current,
        isPaused: !isPlayingRef.current,
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
  }, [lane.spec.baseSpeedPxPerSec]);

  // Pointer drag + fling handlers (mouse & touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    draggingRef.current = true;
    setIsDraggingUI(true);

    dragMetaRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      lastX: e.clientX,
      lastTimeMs: performance.now(),
      totalMovedPx: 0,
      velocityPxPerSec: 0,
      suppressNextClick: false,
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
    dragMetaRef.current.totalMovedPx += Math.abs(dx);

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

    if (dragMetaRef.current.totalMovedPx >= 6) {
      dragMetaRef.current.suppressNextClick = true;
      window.setTimeout(() => {
        dragMetaRef.current.suppressNextClick = false;
      }, 60);
    }

    // Apply smooth clamped fling impulse
    kinematicRef.current.impulsePxPerSec = Math.max(
      -950,
      Math.min(950, dragMetaRef.current.velocityPxPerSec * 0.72)
    );

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already ended
    }
  };

  const isIvory = surface === "ivory";
  const borderClass = isIvory ? "border-[#792B33]/15" : "border-[#F3E9DE]/15";
  const dotClass = isIvory ? "bg-[#792B33]/35" : "bg-[#F3E9DE]/38";

  const isItemHighlighted = (icon: TechIconEntry) => {
    if (!normalizedQuery) return true;
    return (
      icon.name.toLowerCase().includes(normalizedQuery) ||
      icon.slug.toLowerCase().includes(normalizedQuery) ||
      icon.category.toLowerCase().includes(normalizedQuery) ||
      icon.source.toLowerCase().includes(normalizedQuery)
    );
  };

  const renderCopy = (isClone: boolean) => (
    <div
      ref={isClone ? undefined : firstCopyRef}
      aria-hidden={isClone ? "true" : undefined}
      className="flex shrink-0 items-center"
    >
      {loopItems.map((icon, index) => {
        const isSelected = activeIconSlug === icon.slug;
        const matchesFilter = isItemHighlighted(icon);
        const categoryMeta = TECH_ICON_CATEGORIES.find(
          (cat) => cat.id === icon.category
        );

        return (
          <div
            key={`${isClone ? "clone" : "primary"}-${lane.spec.id}-${icon.slug}-${index}`}
            className="flex shrink-0 items-center"
          >
            <button
              type="button"
              tabIndex={isClone ? -1 : 0}
              data-testid={
                isClone ? undefined : `ribbon-item-${icon.slug}`
              }
              data-ribbon-slug={icon.slug}
              aria-pressed={isClone ? undefined : isSelected}
              aria-label={
                isClone
                  ? undefined
                  : `Inspect ${icon.name} (${categoryMeta?.shortTitle ?? icon.category})`
              }
              onClick={() => {
                if (dragMetaRef.current.suppressNextClick) return;
                onSelectIcon(icon);
              }}
              onMouseEnter={() => onHoverIcon(icon)}
              onFocus={() => {
                focusedRef.current = true;
                onHoverIcon(icon);
              }}
              onBlur={() => {
                focusedRef.current = false;
              }}
              className={`group relative inline-flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left transition-opacity duration-200 cursor-pointer whitespace-nowrap select-none focus-visible:outline-none ${
                matchesFilter ? "opacity-100" : "opacity-35 hover:opacity-95"
              }`}
            >
              <TechIcon
                icon={icon}
                surface={surface}
                size="sm"
                className={`transition-transform duration-200 ${
                  isSelected
                    ? "scale-110 ring-1 ring-current/45"
                    : "group-hover:scale-110"
                }`}
              />

              <span
                className={`text-sm sm:text-[15px] tracking-[-0.01em] transition-colors duration-200 ${
                  isSelected
                    ? isIvory
                      ? "font-semibold text-[#792B33]"
                      : "font-semibold text-[#F3E9DE]"
                    : isIvory
                      ? "font-medium text-[#792B33]/82 group-hover:text-[#792B33]"
                      : "font-medium text-[#F3E9DE]/84 group-hover:text-[#F3E9DE]"
                }`}
                style={{ fontFamily: "var(--font-nav), var(--font-jakarta), sans-serif" }}
              >
                {icon.name}
              </span>

              {/* Brand-colored bottom hairline accent on hover or active selection */}
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute left-4 right-4 sm:left-5 sm:right-5 bottom-1.5 h-[2px] origin-left transition-transform duration-200 ${
                  isSelected
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-100"
                }`}
                style={{ backgroundColor: icon.brandColor }}
              />
            </button>

            {/* Clean geometric dot separator between every technology emblem */}
            <span
              aria-hidden="true"
              data-ribbon-separator="dot"
              className={`mx-1.5 sm:mx-2.5 inline-block h-[4px] w-[4px] shrink-0 rounded-full ${dotClass}`}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      ref={viewportRef}
      data-testid={`tech-ribbon-${lane.spec.id}`}
      data-lane-direction={
        isReversed
          ? lane.spec.baseDirection === 1
            ? "-1"
            : "1"
          : String(lane.spec.baseDirection)
      }
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
        onHoverIcon(null);
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
 * Full-bleed, multi-lane interactive Infinite Tech Stack SVG Ribbon.
 *
 * - Showcases all 102 brand-accurate colored SVGs across 3 opposing horizontal lanes.
 * - Clean centered geometric dot separators (•) between items (zero pill boxes).
 * - Smooth requestAnimationFrame physics: hover gently eases to a stop, pointer
 *   drag scrubs & flings with momentum, scroll velocity subtly nudges lanes,
 *   and clicking any SVG inspects & synchronizes with the domain explorer below.
 */
export function TechStackRibbon({
  surface,
  activeIcon,
  searchQuery,
  onSelectIcon,
  onPreviewIcon,
}: TechStackRibbonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [playOverride, setPlayOverride] = useState<boolean | null>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<RibbonSpeedMultiplier>(1);
  const [hoveredIcon, setHoveredIcon] = useState<TechIconEntry | null>(null);

  const isPlaying = playOverride ?? !prefersReducedMotion;

  const lanes = useMemo(
    () => partitionIconsIntoLanes(TECH_ICONS_MANIFEST, DEFAULT_RIBBON_LANES),
    []
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const focusIcon = hoveredIcon ?? activeIcon;
  const focusCategory = useMemo(
    () => TECH_ICON_CATEGORIES.find((cat) => cat.id === focusIcon.category),
    [focusIcon.category]
  );

  const isIvory = surface === "ivory";

  const handleHoverIcon = (icon: TechIconEntry | null) => {
    setHoveredIcon(icon);
    if (icon && onPreviewIcon) {
      onPreviewIcon(icon);
    }
  };

  return (
    <div
      data-testid="tech-stack-ribbon"
      data-playing={String(isPlaying)}
      data-reversed={String(isReversed)}
      data-speed={String(speedMultiplier)}
      data-surface={surface}
      className={`relative w-full transition-colors duration-300 ${
        isIvory ? "mt-5 bg-[#F3E9DE] text-[#792B33]" : "bg-[#792B33] text-[#F3E9DE]"
      }`}
    >
      {/* Editorial Ribbon Control Bar (aligned to .page-container) */}
      <div
        className={`border-b ${
          isIvory ? "border-t border-[#792B33]/18" : "border-[#F3E9DE]/18"
        }`}
      >
        <div className="page-container flex flex-wrap items-center justify-between gap-3 py-3">
          {/* Live Hovered / Selected Readout */}
          <div
            data-testid="ribbon-focus-readout"
            className="flex min-w-0 items-center gap-3 text-xs"
          >
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-current/25"
              style={{ backgroundColor: focusIcon.brandColor }}
              aria-hidden="true"
            />
            <span className="font-semibold tracking-tight whitespace-nowrap">
              {focusIcon.name}
            </span>
            <span
              aria-hidden="true"
              className={isIvory ? "text-[#792B33]/35" : "text-[#F3E9DE]/35"}
            >
              ·
            </span>
            <span
              className={`truncate font-mono text-[11px] uppercase tracking-[0.14em] ${
                isIvory ? "text-[#792B33]/68" : "text-[#F3E9DE]/68"
              }`}
            >
              {focusCategory?.shortTitle ?? focusIcon.category}
            </span>
            <span
              aria-hidden="true"
              className={`hidden md:inline ${
                isIvory ? "text-[#792B33]/35" : "text-[#F3E9DE]/35"
              }`}
            >
              ·
            </span>
            <span
              className={`hidden md:inline font-mono text-[10px] uppercase tracking-[0.14em] ${
                isIvory ? "text-[#792B33]/55" : "text-[#F3E9DE]/55"
              }`}
            >
              {hoveredIcon
                ? "Click to lock & open domain"
                : "Drag to scrub · Hover to slow · Click any mark"}
            </span>
          </div>

          {/* Interactive Ribbon Controls: Play/Pause, Reverse, Speed */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPlayOverride(!isPlaying)}
              aria-pressed={!isPlaying}
              data-testid="ribbon-play-toggle"
              className={`inline-flex h-8 items-center gap-1.5 border px-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors cursor-pointer whitespace-nowrap ${
                isIvory
                  ? "border-[#792B33]/28 text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE]"
                  : "border-[#F3E9DE]/28 text-[#F3E9DE] hover:bg-[#F3E9DE] hover:text-[#792B33]"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause size={11} aria-hidden="true" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={11} aria-hidden="true" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsReversed((prev) => !prev)}
              aria-pressed={isReversed}
              data-testid="ribbon-reverse-toggle"
              className={`inline-flex h-8 items-center gap-1.5 border px-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors cursor-pointer whitespace-nowrap ${
                isReversed
                  ? isIvory
                    ? "border-[#792B33] bg-[#792B33] text-[#F3E9DE]"
                    : "border-[#F3E9DE] bg-[#F3E9DE] text-[#792B33]"
                  : isIvory
                    ? "border-[#792B33]/28 text-[#792B33] hover:border-[#792B33]"
                    : "border-[#F3E9DE]/28 text-[#F3E9DE] hover:border-[#F3E9DE]"
              }`}
            >
              <ArrowLeftRight size={11} aria-hidden="true" />
              <span>Reverse</span>
            </button>

            <div
              role="group"
              aria-label="Ribbon scroll speed"
              className={`inline-flex border p-0.5 ${
                isIvory ? "border-[#792B33]/28" : "border-[#F3E9DE]/28"
              }`}
            >
              {SPEED_OPTIONS.map((option) => {
                const active = speedMultiplier === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSpeedMultiplier(option.value)}
                    aria-pressed={active}
                    data-testid={`ribbon-speed-${option.value}`}
                    className={`h-7 px-2.5 font-mono text-[10px] tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? isIvory
                          ? "bg-[#792B33] text-[#F3E9DE] font-medium"
                          : "bg-[#F3E9DE] text-[#792B33] font-medium"
                        : isIvory
                          ? "text-[#792B33]/72 hover:text-[#792B33]"
                          : "text-[#F3E9DE]/72 hover:text-[#F3E9DE]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Full-Bleed 3-Lane Opposing Infinite SVG Ribbons with Edge Vignette Masks */}
      <div className="relative w-full">
        {lanes.map((lane) => (
          <RibbonLaneRow
            key={lane.spec.id}
            lane={lane}
            surface={surface}
            isPlaying={isPlaying}
            isReversed={isReversed}
            speedMultiplier={speedMultiplier}
            activeIconSlug={activeIcon.slug}
            normalizedQuery={normalizedQuery}
            onSelectIcon={onSelectIcon}
            onHoverIcon={handleHoverIcon}
          />
        ))}

        {/* Seamless Left & Right Surface-Matched Fade Masks */}
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

      {/* Subtle Footer Legend aligned to .page-container */}
      <div className="page-container flex flex-wrap items-center justify-between gap-2 py-2.5 text-[10px] font-mono uppercase tracking-[0.16em]">
        <span
          className={
            isIvory ? "text-[#792B33]/65" : "text-[#F3E9DE]/65"
          }
        >
          {TECH_ICONS_MANIFEST.length} Brand-Accurate SVGs · 3 Opposing Kinetic Lanes
        </span>
        <span
          className={`tabular-nums ${
            isIvory ? "text-[#792B33]/58" : "text-[#F3E9DE]/58"
          }`}
        >
          {focusIcon.brandColor} · {focusIcon.source}
        </span>
      </div>
    </div>
  );
}
