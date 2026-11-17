"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollWordRevealProps {
  text: string;
  accentWords?: readonly string[];
  className?: string;
}

export function ScrollWordReveal({
  text,
  accentWords = [],
  className = "",
}: ScrollWordRevealProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);

  const tokens = useMemo(() => {
    const accentSet = new Set(accentWords.map((w) => w.toLowerCase()));
    return text.split(/\s+/).map((word) => {
      const stripped = word.replace(/[.,;:!?—]/g, "").toLowerCase();
      return {
        word,
        isAccent: accentSet.has(stripped),
      };
    });
  }, [text, accentWords]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const wordNodes = el.querySelectorAll<HTMLElement>("[data-word-reveal]");
    if (wordNodes.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wordNodes.forEach((node) => {
        const isAccent = node.dataset.accent === "true";
        node.style.color = isAccent ? "var(--accent-primary)" : "var(--text-primary)";
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(wordNodes, { color: "#766C83" });

      gsap.to(wordNodes, {
        color: (_index: number, target: HTMLElement) =>
          target.dataset.accent === "true" ? "#BCA5D4" : "#F3EEF8",
        stagger: 0.05,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 82%",
          end: "bottom 42%",
          scrub: 0.45,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [tokens]);

  return (
    <p ref={containerRef} className={className} aria-label={text}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {tokens.map((token, idx) => (
          <span key={idx}>
            <span
              data-word-reveal
              data-accent={token.isAccent ? "true" : "false"}
              className={
                token.isAccent
                  ? "type-serif-accent inline-block transition-none"
                  : "inline-block transition-none text-[#766C83]"
              }
            >
              {token.word}
            </span>
            {idx < tokens.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </p>
  );
}
