"use client";

import type { ReactNode, RefObject } from "react";

interface ParallaxLayerProps {
  layerRef?: RefObject<HTMLDivElement | null>;
  zIndex: number;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
  testId?: string;
}

/**
 * Reusable 2.5D parallax plane for the Japanese Mountain Journey stage.
 * Uses strictly GPU-composited transforms (driven by GSAP / ScrollTrigger)
 * with zero layout-property animation.
 */
export function ParallaxLayer({
  layerRef,
  zIndex,
  interactive = false,
  className = "",
  children,
  testId,
}: ParallaxLayerProps) {
  return (
    <div
      ref={layerRef}
      data-testid={testId}
      style={{ zIndex }}
      className={`absolute inset-0 will-change-transform ${
        interactive ? "pointer-events-auto" : "pointer-events-none"
      } ${className}`}
    >
      {children}
    </div>
  );
}
