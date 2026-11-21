"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { motion } from "motion/react";
import {
  computeHeroPortalGeometry,
  shouldBypassHeroPortal,
  stepPortalFromTouchDelta,
  stepPortalFromWheel,
  type HeroPortalGeometry,
} from "@/lib/hero-portal";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface ScrollExpandMediaProps {
  /** Standard media mode ('image' | 'video') or live interactive portal ('portal'). */
  mediaType?: "video" | "image" | "portal";
  /** Optional media source when using image/video mode. */
  mediaSrc?: string;
  /** Optional video poster when using video mode. */
  posterSrc?: string;
  /** Atmospheric outer backdrop surrounding the expanding Japanese portal frame. */
  bgImageSrc: string | StaticImageData;
  /** Optional alt text for the outer architectural backdrop. */
  bgImageAlt?: string;
  /** Two-part editorial display title that glides left & right as the portal opens. */
  title?: string;
  /** Optional subtitle displayed cleanly above the split display title. */
  subtitle?: string;
  /** Whether the live content inside the portal (e.g. 3D WebGL cat) has painted its first frame. */
  mediaReady?: boolean;
  /** External override to force the portal open (e.g. when a user clicks a chapter anchor). */
  forceExpanded?: boolean;
  /** Fires whenever discrete expanded state flips (used to pause/resume Lenis cleanly). */
  onExpandedChange?: (expanded: boolean) => void;
  /** High-frequency 60fps geometry callback for direct DOM syncing without React re-renders. */
  onGeometryFrame?: (geometry: HeroPortalGeometry) => void;
  /** Live content rendered directly inside the expanding Japanese portal window. */
  children?: React.ReactNode;
}

/**
 * ScrollExpandMedia — Immersive Japanese Architectural Scroll-Expansion Portal.
 *
 * Adapted for shadcn `/components/ui` architecture with Tailwind CSS, TypeScript,
 * and `motion/react`. Frames a live interactive stage (the 3D Samurai Cat Hero)
 * inside a traditional dark hinoki timber & shoji lattice portal surrounded by
 * a lantern-lit Kyoto sanctuary corridor.
 *
 * As the visitor scrolls (wheel, touch swipe, or keyboard), the sliding shoji
 * side-screens glide open, split editorial typography parts left & right, the
 * outer sanctuary corridor pulls forward and dissolves, and the wooden frame
 * expands seamlessly to 100% fullscreen — handing off at 1:1 scale with zero
 * duplicate WebGL canvas and zero scroll trap.
 */
export function ScrollExpandMedia({
  mediaType = "portal",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  bgImageAlt = "Japanese architectural sanctuary backdrop",
  title = "RANJAN VERNEKAR",
  subtitle,
  mediaReady = true,
  forceExpanded = false,
  onExpandedChange,
  onGeometryFrame,
  children,
}: ScrollExpandMediaProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const backdropWrapRef = useRef<HTMLDivElement>(null);
  const backdropMediaRef = useRef<HTMLDivElement>(null);
  const portalStageRef = useRef<HTMLDivElement>(null);
  const frameChromeRef = useRef<HTMLDivElement>(null);
  const shojiLeftRef = useRef<HTMLDivElement>(null);
  const shojiRightRef = useRef<HTMLDivElement>(null);
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const titleLeftRef = useRef<HTMLSpanElement>(null);
  const titleRightRef = useRef<HTMLSpanElement>(null);

  const onExpandedChangeRef = useRef(onExpandedChange);
  const onGeometryFrameRef = useRef(onGeometryFrame);
  useIsomorphicLayoutEffect(() => {
    onExpandedChangeRef.current = onExpandedChange;
    onGeometryFrameRef.current = onGeometryFrame;
  }, [onExpandedChange, onGeometryFrame]);

  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const expandedRef = useRef<boolean>(false);
  const expandCooldownUntilRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const words = title.trim().split(/\s+/).filter(Boolean);
  const firstWord = words[0] ?? "";
  const restOfTitle = words.slice(1).join(" ");

  // Apply exact compositor geometry synchronously to DOM nodes (zero React re-renders per wheel tick)
  const paintGeometry = (rawProgress: number) => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    const g = computeHeroPortalGeometry(rawProgress, vw, vh);

    if (rootRef.current) {
      rootRef.current.dataset.portalProgress = g.progress.toFixed(3);
      rootRef.current.dataset.portalExpanded = g.progress >= 0.995 ? "true" : "false";
    }

    // 1. Live Hero Stage inside the Japanese portal opening (`clip-path: inset(...)`)
    if (portalStageRef.current) {
      if (g.progress >= 0.999) {
        portalStageRef.current.style.clipPath = "none";
      } else {
        const y = g.insetY.toFixed(1);
        const x = g.insetX.toFixed(1);
        const r = g.borderRadius.toFixed(1);
        portalStageRef.current.style.clipPath = `inset(${y}px ${x}px ${y}px ${x}px round ${r}px)`;
      }
    }

    // 2. Outer Kyoto sanctuary corridor backdrop (pulls forward & dissolves)
    if (backdropWrapRef.current) {
      const visible = g.backdropOpacity > 0.005;
      backdropWrapRef.current.style.opacity = g.backdropOpacity.toFixed(4);
      backdropWrapRef.current.style.visibility = visible ? "visible" : "hidden";
    }
    if (backdropMediaRef.current) {
      backdropMediaRef.current.style.transform = `scale(${g.backdropScale.toFixed(4)}) translate3d(0, 0, 0)`;
    }

    // 3. Ornate Japanese hinoki wood + brass corner joinery frame hugging the portal opening
    if (frameChromeRef.current) {
      const visible = g.frameChromeOpacity > 0.005;
      frameChromeRef.current.style.opacity = g.frameChromeOpacity.toFixed(4);
      frameChromeRef.current.style.visibility = visible ? "visible" : "hidden";
      frameChromeRef.current.style.top = `${g.insetY.toFixed(1)}px`;
      frameChromeRef.current.style.bottom = `${g.insetY.toFixed(1)}px`;
      frameChromeRef.current.style.left = `${g.insetX.toFixed(1)}px`;
      frameChromeRef.current.style.right = `${g.insetX.toFixed(1)}px`;
      frameChromeRef.current.style.borderRadius = `${g.borderRadius.toFixed(1)}px`;
    }

    // 4. Inner sliding shoji kumiko lattice screens parting smoothly outward
    const shojiShiftPct = (g.shojiOpenProgress * 108).toFixed(2);
    const shojiOpacity = (1 - g.shojiOpenProgress * 0.92).toFixed(3);
    if (shojiLeftRef.current) {
      shojiLeftRef.current.style.transform = `translate3d(-${shojiShiftPct}%, 0, 0)`;
      shojiLeftRef.current.style.opacity = shojiOpacity;
      shojiLeftRef.current.style.visibility = g.shojiOpenProgress < 0.99 ? "visible" : "hidden";
    }
    if (shojiRightRef.current) {
      shojiRightRef.current.style.transform = `translate3d(${shojiShiftPct}%, 0, 0)`;
      shojiRightRef.current.style.opacity = shojiOpacity;
      shojiRightRef.current.style.visibility = g.shojiOpenProgress < 0.99 ? "visible" : "hidden";
    }

    // 5. Flanking split editorial typography gliding left & right
    if (titleWrapRef.current) {
      const visible = g.titleOpacity > 0.005;
      titleWrapRef.current.style.opacity = g.titleOpacity.toFixed(4);
      titleWrapRef.current.style.visibility = visible ? "visible" : "hidden";
    }
    if (titleLeftRef.current) {
      titleLeftRef.current.style.transform = `translate3d(-${g.titleShiftVw.toFixed(2)}vw, 0, 0)`;
    }
    if (titleRightRef.current) {
      titleRightRef.current.style.transform = `translate3d(${g.titleShiftVw.toFixed(2)}vw, 0, 0)`;
    }

    onGeometryFrameRef.current?.(g);
  };

  // Sync external forceExpanded prop (e.g. clicking a nav chapter jump)
  useEffect(() => {
    if (!forceExpanded) return;
    targetProgressRef.current = 1;
    currentProgressRef.current = 1;
    if (!expandedRef.current) {
      expandedRef.current = true;
      setIsExpanded(true);
      onExpandedChangeRef.current?.(true);
    }
    paintGeometry(1);
  }, [forceExpanded]);

  useIsomorphicLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bypass = shouldBypassHeroPortal({
      search: window.location.search,
      hash: window.location.hash,
      prefersReducedMotion: reduced,
    });

    const syncExpandedFlag = (nextExpanded: boolean) => {
      if (expandedRef.current !== nextExpanded) {
        expandedRef.current = nextExpanded;
        setIsExpanded(nextExpanded);
        onExpandedChangeRef.current?.(nextExpanded);
      }
    };

    const startAnimationLoop = () => {
      if (rafIdRef.current) return;
      const step = () => {
        const current = currentProgressRef.current;
        const target = targetProgressRef.current;
        const diff = target - current;

        if (Math.abs(diff) < 0.0012) {
          currentProgressRef.current = target;
          paintGeometry(target);
          rafIdRef.current = 0;
          if (target >= 0.995) {
            syncExpandedFlag(true);
          }
          return;
        }

        // Silky damped ease toward wheel/touch target
        const next = current + diff * 0.18;
        currentProgressRef.current = next;
        paintGeometry(next);
        rafIdRef.current = window.requestAnimationFrame(step);
      };
      rafIdRef.current = window.requestAnimationFrame(step);
    };

    if (bypass) {
      targetProgressRef.current = 1;
      currentProgressRef.current = 1;
      syncExpandedFlag(true);
      paintGeometry(1);
    } else {
      targetProgressRef.current = 0;
      currentProgressRef.current = 0;
      syncExpandedFlag(false);
      paintGeometry(0);
    }

    const handleWheel = (e: WheelEvent) => {
      // Allow modal/drawer scrolling cleanly without portal interception
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest("[role='dialog'], #chapters-index-drawer")) return;

      // Absorb leftover trackpad momentum briefly right after crossing into the Hero
      // so the visitor arrives cleanly on CURIOSITY instead of overshooting Beat 1.
      if (expandedRef.current && e.deltaY > 0 && performance.now() < expandCooldownUntilRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const step = stepPortalFromWheel({
        currentProgress: targetProgressRef.current,
        expanded: expandedRef.current,
        deltaY: e.deltaY,
        windowScrollY: window.scrollY,
      });

      if (!step.consumed) return;

      e.preventDefault();
      e.stopPropagation();
      targetProgressRef.current = step.nextProgress;

      // Immediately release or re-engage Lenis when crossing boundaries
      if (step.expanded) {
        if (!expandedRef.current) {
          expandCooldownUntilRef.current = performance.now() + 320;
        }
        syncExpandedFlag(true);
      } else if (expandedRef.current) {
        syncExpandedFlag(false);
      }
      startAnimationLoop();
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest("[role='dialog'], #chapters-index-drawer")) return;
      if (!touchStartYRef.current) return;

      const touchY = e.touches[0]?.clientY ?? 0;
      const touchDeltaY = touchStartYRef.current - touchY;
      touchStartYRef.current = touchY;

      const step = stepPortalFromTouchDelta({
        currentProgress: targetProgressRef.current,
        expanded: expandedRef.current,
        touchDeltaY,
        windowScrollY: window.scrollY,
      });

      if (!step.consumed) return;

      e.preventDefault();
      targetProgressRef.current = step.nextProgress;
      if (step.expanded) {
        syncExpandedFlag(true);
      } else if (expandedRef.current) {
        syncExpandedFlag(false);
      }
      startAnimationLoop();
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = 0;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (expandedRef.current) return;
      const activeTag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const increment = e.key === "PageDown" || e.key === "Enter" ? 1 : 0.34;
        const next = Math.min(1, targetProgressRef.current + increment);
        targetProgressRef.current = next >= 0.995 ? 1 : next;
        if (targetProgressRef.current >= 0.995) {
          syncExpandedFlag(true);
        }
        startAnimationLoop();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        targetProgressRef.current = Math.max(0, targetProgressRef.current - 0.34);
        startAnimationLoop();
      }
    };

    const handleResize = () => {
      paintGeometry(currentProgressRef.current);
    };

    const handleWindowScroll = () => {
      if (!expandedRef.current && window.scrollY > 2) {
        window.scrollTo(0, 0);
      }
    };

    // Capture phase ensures portal intercepts wheel cleanly before Lenis smooth-scroll
    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      if (rafIdRef.current) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleWindowScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-testid="hero-scroll-portal"
      data-portal-progress={isExpanded ? "1.000" : "0.000"}
      data-portal-expanded={isExpanded ? "true" : "false"}
      className="relative h-full w-full overflow-hidden"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          LAYER 1 — BESPOKE JAPANESE KYOTO SANCTUARY CORRIDOR BACKDROP
         ═══════════════════════════════════════════════════════════════════════ */}
      <div
        ref={backdropWrapRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden bg-[#240B0F] will-change-[opacity]"
      >
        <div
          ref={backdropMediaRef}
          className="relative h-full w-full will-change-transform"
        >
          <Image
            src={bgImageSrc}
            alt={bgImageAlt}
            fill
            priority
            sizes="100vw"
            referrerPolicy="no-referrer"
            className="object-cover object-center select-none"
          />
          {/* Subtle atmospheric oxblood vignette focusing light onto the central portal */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 68% 72% at 50% 50%, rgba(36, 11, 15, 0.14) 0%, rgba(28, 9, 13, 0.48) 72%, rgba(16, 5, 8, 0.72) 100%)",
            }}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          LAYER 2 — EXPANDING PORTAL STAGE (LIVE 3D SAMURAI CAT HERO INSIDE)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div
        ref={portalStageRef}
        data-testid="hero-portal-stage"
        className="relative z-[10] h-full w-full will-change-[clip-path]"
      >
        {mediaType === "portal" ? (
          children
        ) : mediaType === "video" && mediaSrc ? (
          <video
            src={mediaSrc}
            poster={posterSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
          />
        ) : mediaSrc ? (
          <Image
            src={mediaSrc}
            alt={title}
            fill
            sizes="100vw"
            referrerPolicy="no-referrer"
            className="object-cover"
          />
        ) : null}

        {/* Serene Zero-Spinner Japanese Washi Arrival Veil (fades out the instant the 3D Cat paints) */}
        <motion.div
          aria-hidden="true"
          data-testid="hero-portal-arrival-veil"
          initial={{ opacity: 1 }}
          animate={{ opacity: mediaReady ? 0 : 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-0 z-[28] flex items-center justify-center bg-[#F4EADF]"
          style={{ visibility: mediaReady ? "hidden" : "visible" }}
        >
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ scale: [0.95, 1.04, 0.95], opacity: [0.76, 0.96, 0.76] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="h-[min(46vw,220px)] w-[min(46vw,220px)] rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 48% 38%, #DE3033 0%, #B81C22 58%, #881016 100%)",
                boxShadow: "0 0 60px rgba(184, 28, 34, 0.24)",
              }}
            />
            <div
              className="absolute h-[1.5px] w-[min(54vw,260px)] opacity-55"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, #792B33 25%, #792B33 75%, transparent 100%)",
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          LAYER 3 — ORNATE JAPANESE HINOKI TIMBER & SHOJI LATTICE PORTAL FRAME
         ═══════════════════════════════════════════════════════════════════════ */}
      <div
        ref={frameChromeRef}
        aria-hidden="true"
        data-testid="hero-japanese-frame"
        className="pointer-events-none absolute z-[20] will-change-[opacity]"
        style={{
          boxShadow:
            "0 30px 90px rgba(10, 2, 4, 0.76), 0 0 0 1px rgba(212, 150, 59, 0.32), inset 0 0 0 8px #1D0B0E, inset 0 0 0 10px #4D2720, inset 0 0 0 11px rgba(212, 150, 59, 0.58)",
        }}
      >
        {/* Sliding Inner Shoji Kumiko Side-Screens (part outward like traditional fusuma/shoji doors) */}
        <div className="absolute inset-[10px] overflow-hidden">
          <div
            ref={shojiLeftRef}
            className="absolute inset-y-0 left-0 w-[9.5%] border-r border-[#3B1D19]/75 will-change-transform"
            style={{
              backgroundColor: "rgba(244, 234, 223, 0.56)",
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0, transparent 42px, rgba(59, 29, 25, 0.4) 42px, rgba(59, 29, 25, 0.4) 44px), repeating-linear-gradient(to right, transparent 0, transparent 19px, rgba(59, 29, 25, 0.32) 19px, rgba(59, 29, 25, 0.32) 20.5px)",
              boxShadow: "inset -6px 0 14px rgba(28, 10, 12, 0.2)",
            }}
          />
          <div
            ref={shojiRightRef}
            className="absolute inset-y-0 right-0 w-[9.5%] border-l border-[#3B1D19]/75 will-change-transform"
            style={{
              backgroundColor: "rgba(244, 234, 223, 0.56)",
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0, transparent 42px, rgba(59, 29, 25, 0.4) 42px, rgba(59, 29, 25, 0.4) 44px), repeating-linear-gradient(to left, transparent 0, transparent 19px, rgba(59, 29, 25, 0.32) 19px, rgba(59, 29, 25, 0.32) 20.5px)",
              boxShadow: "inset 6px 0 14px rgba(28, 10, 12, 0.2)",
            }}
          />
        </div>

        {/* Traditional Japanese Kamoi Top Timber Lintel Beam */}
        <div
          className="absolute -top-[10px] -left-[18px] -right-[18px] h-[11px] rounded-[2px] border border-[#D4963B]/45"
          style={{
            background:
              "linear-gradient(180deg, #3A1C19 0%, #1E0C0F 65%, #120608 100%)",
            boxShadow: "0 10px 26px rgba(8, 2, 4, 0.68)",
          }}
        >
          <div className="mx-3 mt-[2px] h-[1px] bg-[#D4963B]/40" />
        </div>

        {/* Traditional Japanese Shikii Bottom Timber Sill + Minimal Vermilion Hanko Seal Accent */}
        <div
          className="absolute -bottom-[10px] -left-[16px] -right-[16px] flex h-[11px] items-center justify-center rounded-[2px] border border-[#D4963B]/45"
          style={{
            background:
              "linear-gradient(180deg, #351816 0%, #1C0A0D 70%, #120608 100%)",
            boxShadow: "0 12px 28px rgba(8, 2, 4, 0.72)",
          }}
        >
          <span className="h-[5px] w-7 rounded-[1px] bg-[#C8372D] shadow-[0_0_12px_rgba(200,55,45,0.65)]" />
        </div>

        {/* Four Ornate Antique-Gold Kanagu Corner Brackets */}
        <span className="absolute -left-[2px] -top-[2px] h-7 w-7 border-l-2 border-t-2 border-[#D4963B]/90" />
        <span className="absolute -right-[2px] -top-[2px] h-7 w-7 border-r-2 border-t-2 border-[#D4963B]/90" />
        <span className="absolute -bottom-[2px] -left-[2px] h-7 w-7 border-b-2 border-l-2 border-[#D4963B]/90" />
        <span className="absolute -bottom-[2px] -right-[2px] h-7 w-7 border-b-2 border-r-2 border-[#D4963B]/90" />

        {/* Inner Double-Hairline Corner Accents */}
        <span className="absolute left-[13px] top-[13px] h-3.5 w-3.5 border-l border-t border-[#D4963B]/55" />
        <span className="absolute right-[13px] top-[13px] h-3.5 w-3.5 border-r border-t border-[#D4963B]/55" />
        <span className="absolute bottom-[13px] left-[13px] h-3.5 w-3.5 border-b border-l border-[#D4963B]/55" />
        <span className="absolute bottom-[13px] right-[13px] h-3.5 w-3.5 border-b border-r border-[#D4963B]/55" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          LAYER 4 — SPLIT KINETIC EDITORIAL TYPOGRAPHY (PARTS LEFT & RIGHT)
         ═══════════════════════════════════════════════════════════════════════ */}
      {(firstWord || restOfTitle) && (
        <div
          ref={titleWrapRef}
          aria-hidden="true"
          data-testid="hero-portal-split-title"
          className="pointer-events-none absolute inset-0 z-[25] flex flex-col justify-between px-6 py-12 md:grid md:grid-cols-[1fr_minmax(420px,510px)_1fr] md:items-center md:px-8 md:py-0 will-change-[opacity]"
        >
          {/* Left Word (Top on mobile, Left flanking corridor on desktop) */}
          <div className="flex flex-col items-center md:items-end md:pr-9">
            {subtitle && (
              <span className="mb-2 hidden font-mono text-[11px] uppercase tracking-[0.28em] text-[#E8CFA8]/80 md:block">
                {subtitle}
              </span>
            )}
            <span
              ref={titleLeftRef}
              className="block whitespace-nowrap text-[clamp(1.75rem,3.35vw,3.15rem)] font-bold uppercase leading-none tracking-[0.18em] text-[#F3E9DE] will-change-transform"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                textShadow:
                  "0 6px 32px rgba(14, 3, 6, 0.9), 0 1px 0 rgba(212, 150, 59, 0.32)",
              }}
            >
              {firstWord}
            </span>
          </div>

          {/* Central Portal Spacer Column (desktop only) */}
          <div className="hidden md:block" />

          {/* Right Word (Bottom on mobile, Right flanking corridor on desktop) */}
          <div className="flex flex-col items-center md:items-start md:pl-9">
            <span
              ref={titleRightRef}
              className="block whitespace-nowrap text-[clamp(1.75rem,3.35vw,3.15rem)] font-bold uppercase leading-none tracking-[0.18em] text-[#F3E9DE] will-change-transform"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                textShadow:
                  "0 6px 32px rgba(14, 3, 6, 0.9), 0 1px 0 rgba(212, 150, 59, 0.32)",
              }}
            >
              {restOfTitle}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScrollExpandMedia;
