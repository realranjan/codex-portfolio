"use client";

import { useSyncExternalStore, type CSSProperties, type ReactNode, type RefObject } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/**
 * SSR-safe, live-updating prefers-reduced-motion media query hook.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

const DESKTOP_1024_QUERY = "(min-width: 1024px)";
const DESKTOP_768_QUERY = "(min-width: 768px)";

function createMediaQueryStore(query: string) {
  return {
    subscribe: (onStoreChange: () => void): (() => void) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    getSnapshot: (): boolean => {
      if (typeof window === "undefined") return true;
      return window.matchMedia(query).matches;
    },
    getServerSnapshot: (): boolean => true,
  };
}

const desktop1024Store = createMediaQueryStore(DESKTOP_1024_QUERY);
const desktop768Store = createMediaQueryStore(DESKTOP_768_QUERY);

/**
 * SSR-safe, live-updating viewport breakpoint hook so pinned desktop chapters
 * and mobile touch layouts never mount duplicate DOM trees simultaneously.
 */
export function useIsDesktop(breakpoint: 768 | 1024 = 1024): boolean {
  const store = breakpoint === 768 ? desktop768Store : desktop1024Store;
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
}

interface CameraStageProps {
  stageRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  perspectivePx?: number;
  testId?: string;
  children: ReactNode;
}

/**
 * Reusable 2.5D exhibition camera stage wrapper with clean horizontal clip
 * and configurable CSS perspective (avoids nested scrollbars or page overflow).
 */
export function CameraStage({
  stageRef,
  className = "",
  perspectivePx = 1800,
  testId,
  children,
}: CameraStageProps) {
  return (
    <div
      ref={stageRef}
      data-testid={testId}
      className={`relative overflow-hidden ${className}`}
      style={{ perspective: `${perspectivePx}px` }}
    >
      {children}
    </div>
  );
}

interface ParallaxLayerProps {
  layerRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  style?: CSSProperties;
  testId?: string;
  ariaHidden?: boolean;
  children: ReactNode;
}

/**
 * Transform-composited parallax layer wrapper driven externally by ScrollTrigger.
 */
export function ParallaxLayer({
  layerRef,
  className = "",
  style,
  testId,
  ariaHidden = true,
  children,
}: ParallaxLayerProps) {
  return (
    <div
      ref={layerRef}
      data-testid={testId}
      aria-hidden={ariaHidden}
      className={`will-change-transform ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

interface CameraProgressRuleProps {
  barRef?: RefObject<HTMLDivElement | null>;
  surface: "ivory" | "burgundy";
  className?: string;
}

/**
 * Minimal hairline camera travel progress rule locked to the Burgundy/Ivory palette.
 */
export function CameraProgressRule({
  barRef,
  surface,
  className = "",
}: CameraProgressRuleProps) {
  const track = surface === "ivory" ? "bg-[#792B33]/18" : "bg-[#F3E9DE]/18";
  const fill = surface === "ivory" ? "bg-[#792B33]" : "bg-[#F3E9DE]/82";

  return (
    <div className={`h-[1.5px] overflow-hidden ${track} ${className}`}>
      <div
        ref={barRef}
        className={`h-full w-full origin-left ${fill}`}
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
