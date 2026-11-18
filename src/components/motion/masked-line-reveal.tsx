"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

interface MaskedLineRevealProps {
  lines: readonly ReactNode[];
  as?: "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  id?: string;
  trigger?: "mount" | "scroll";
  delay?: number;
  stagger?: number;
  duration?: number;
}

export function MaskedLineReveal({
  lines,
  as: Tag = "h2",
  className = "",
  id,
  trigger = "scroll",
  delay = 0,
  stagger = MOTION_STAGGER.tight,
  duration = MOTION_DURATION.standard,
}: MaskedLineRevealProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const lineNodes = el.querySelectorAll<HTMLElement>("[data-masked-line]");
    if (lineNodes.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(lineNodes, { yPercent: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      if (trigger === "mount") {
        gsap.fromTo(
          lineNodes,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration,
            delay,
            stagger,
            ease: MOTION_EASE.editorial,
            clearProps: "transform",
          }
        );
      } else {
        gsap.fromTo(
          lineNodes,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration,
            delay,
            stagger,
            ease: MOTION_EASE.editorial,
            clearProps: "transform",
            scrollTrigger: {
              trigger: el,
              start: "top 96%",
              once: true,
            },
          }
        );
      }
    }, el);

    return () => ctx.revert();
  }, [trigger, delay, stagger, duration, lines.length]);

  const Component = Tag as React.ElementType;

  return (
    <Component ref={containerRef} id={id} className={className}>
      {lines.map((line, index) => (
        <span key={index} className="masked-line-wrap">
          <span className="masked-line-inner" data-masked-line>
            {line}
          </span>
        </span>
      ))}
    </Component>
  );
}
