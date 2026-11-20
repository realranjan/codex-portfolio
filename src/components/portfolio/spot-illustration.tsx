"use client";

import { useEffect, useRef } from "react";
import Image, { type StaticImageData } from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface SpotIllustrationProps {
  src: StaticImageData;
  alt: string;
  /** Tailwind positioning & sizing classes (e.g. "w-[140px] lg:w-[176px]") */
  className?: string;
  /** Vertical parallax amplitude in px across scroll transit (default 26) */
  parallaxY?: number;
  /** Gentle resting angle in degrees (default 0) */
  baseRotate?: number;
  /** Subtle scroll-linked rotation delta in degrees (default 2.8) */
  rotateDelta?: number;
  /** Horizontally mirror the artwork */
  flipX?: boolean;
  /** Visual surface beneath the cutout to tune subtle physical drop shadow */
  surface?: "burgundy" | "ivory";
  /** Optional priority loading for above/near-fold hero artwork */
  priority?: boolean;
  /** Optional test ID */
  testId?: string;
}

/**
 * Kigo-Studio-inspired background-free Japanese spot illustration.
 *
 * Floats directly over the Burgundy (#792B33) or Warm Ivory (#F3E9DE) page canvas
 * with ZERO bounding box, ZERO card chrome, and gentle scroll-coupled drift.
 */
export function SpotIllustration({
  src,
  alt,
  className = "",
  parallaxY = 26,
  baseRotate = 0,
  rotateDelta = 2.8,
  flipX = false,
  surface = "ivory",
  priority = false,
  testId,
}: SpotIllustrationProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const driftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const drift = driftRef.current;
    if (!wrap || !drift) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(drift, { y: 0, rotation: baseRotate, scaleX: flipX ? -1 : 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        drift,
        {
          y: parallaxY,
          rotation: baseRotate - rotateDelta,
          scaleX: flipX ? -1 : 1,
        },
        {
          y: -parallaxY,
          rotation: baseRotate + rotateDelta,
          scaleX: flipX ? -1 : 1,
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, wrapRef);

    return () => ctx.revert();
  }, [parallaxY, baseRotate, rotateDelta, flipX]);

  const shadowFilter =
    surface === "burgundy"
      ? "drop-shadow(0 16px 26px rgba(24, 7, 10, 0.34))"
      : "drop-shadow(0 12px 22px rgba(92, 34, 41, 0.16))";

  return (
    <div
      ref={wrapRef}
      data-testid={testId}
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <div
        ref={driftRef}
        className="w-full will-change-transform"
        style={{
          transform: `rotate(${baseRotate}deg) scaleX(${flipX ? -1 : 1})`,
          filter: shadowFilter,
        }}
      >
        <Image
          src={src}
          alt={alt}
          priority={priority}
          referrerPolicy="no-referrer"
          className="h-auto w-full object-contain"
        />
      </div>
    </div>
  );
}
