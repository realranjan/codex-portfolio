"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

interface DirectionalMediaRevealProps {
  children: ReactNode;
  direction?: "up" | "left" | "right";
  className?: string;
  aspectClassName?: string;
  delay?: number;
}

export function DirectionalMediaReveal({
  children,
  direction = "up",
  className = "",
  aspectClassName = "aspect-[4/3]",
  delay = 0,
}: DirectionalMediaRevealProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(inner, { clipPath: "inset(0% 0% 0% 0%)", scale: 1 });
      return;
    }

    const fromClip =
      direction === "left"
        ? "inset(0% 100% 0% 0%)"
        : direction === "right"
          ? "inset(0% 0% 0% 100%)"
          : "inset(100% 0% 0% 0%)";

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: frame,
          start: "top 86%",
          once: true,
        },
      });

      tl.fromTo(
        inner,
        { clipPath: fromClip, scale: 1.07 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1,
          duration: MOTION_DURATION.editorial,
          delay,
          ease: MOTION_EASE.editorial,
          clearProps: "transform,clipPath",
        }
      );

      const coordinated = frame.parentElement?.querySelectorAll<HTMLElement>(
        "[data-media-coord]"
      );
      if (coordinated && coordinated.length > 0) {
        tl.fromTo(
          coordinated,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: MOTION_DURATION.standard,
            stagger: 0.06,
            ease: MOTION_EASE.editorial,
            clearProps: "transform,opacity",
          },
          "-=0.65"
        );
      }
    }, frame);

    return () => ctx.revert();
  }, [direction, delay]);

  return (
    <div ref={frameRef} className={`media-reveal-frame ${aspectClassName} ${className}`}>
      <div ref={innerRef} className="media-reveal-inner relative">
        {children}
      </div>
    </div>
  );
}
