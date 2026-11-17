"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrambleTextAtProgress } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

interface AsciiScrambleProps {
  text: string;
  className?: string;
  trigger?: "mount" | "scroll";
  duration?: number;
  seed?: number;
}

export function AsciiScramble({
  text,
  className = "",
  trigger = "scroll",
  duration = 0.42,
  seed = 1,
}: AsciiScrambleProps) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const state = { progress: 0 };
    const ctx = gsap.context(() => {
      const tweenConfig: gsap.TweenVars = {
        progress: 1,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          setDisplayText(scrambleTextAtProgress(text, state.progress, seed));
        },
        onComplete: () => {
          setDisplayText(text);
        },
      };

      if (trigger === "scroll") {
        tweenConfig.scrollTrigger = {
          trigger: el,
          start: "top 96%",
          once: true,
        };
      }

      gsap.to(state, tweenConfig);
    }, el);

    return () => ctx.revert();
  }, [text, trigger, duration, seed]);

  return (
    <span ref={hostRef} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{displayText}</span>
    </span>
  );
}
