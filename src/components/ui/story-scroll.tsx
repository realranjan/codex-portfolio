"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  computeChapterParallaxLayerState,
  computeContinuousStrokeState,
  computeStoryCardCamera,
} from "@/lib/story-scroll-camera";
import {
  TornPaperPeel,
  type TornPaperVariant,
} from "@/components/portfolio/torn-paper-peel";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function cx(...parts: Array<string | undefined | false | null>): string {
  return parts.filter(Boolean).join(" ");
}

export interface FlowSectionProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  "aria-label"?: string;
  /** Optional chapter label shown beside the continuous side stroke node */
  strokeLabel?: string;
  /** Optional surface hint so the continuous side ink stroke keeps optimal contrast */
  strokeTone?: "light" | "dark";
}

export const FlowSection: React.FC<FlowSectionProps> = ({
  className,
  style = {},
  children,
  "aria-label": ariaLabel,
  strokeLabel,
  strokeTone = "light",
}) => (
  <section
    data-flow-section
    data-stroke-label={strokeLabel}
    data-stroke-tone={strokeTone}
    aria-label={ariaLabel}
    className={cx("relative min-h-screen w-full overflow-hidden", className)}
    style={{ perspective: "1400px" }}
  >
    <div
      data-flow-inner
      className={cx(
        "flow-art-container relative flex min-h-screen w-full flex-col justify-between gap-4 px-[5vw] sm:pl-[clamp(5.2rem,8.4vw,7.4rem)] sm:pr-[5vw] pt-[clamp(5.4rem,9.2vh,6.3rem)] pb-[clamp(1.6rem,3vh,2.4rem)]",
        "will-change-transform shadow-[0_-24px_60px_rgba(12,8,10,0.22)]"
      )}
      style={{
        transformOrigin: "bottom left",
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      {/* Subtle architectural ink edge carried along each rotating sheet */}
      <span
        aria-hidden="true"
        className={cx(
          "pointer-events-none absolute inset-y-0 left-0 w-[2px] opacity-35",
          strokeTone === "dark" ? "bg-[#792B33]" : "bg-[#F3E9DE]"
        )}
      />

      {/* Receding camera atmospheric veil (driven imperatively by GSAP ScrollTrigger) */}
      <div
        data-flow-veil
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 bg-[#120B0D] opacity-0 will-change-[opacity]"
      />

      {children}
    </div>
  </section>
);

export interface FlowArtSectionMeta {
  index: string;
  label: string;
  tone?: "light" | "dark";
}

export interface FlowArtProps {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
  /** Semantic wrapper element ("div" when nested inside an existing <main>, "main" when standalone) */
  as?: "main" | "div";
  /** Render the continuous calligraphic vertical stroke rail along the left edge across all sheets */
  showSideStroke?: boolean;
  /** Optional metadata for interactive tick markers on the continuous side stroke */
  sectionMeta?: readonly FlowArtSectionMeta[];
}

const childCount = (children: React.ReactNode) => React.Children.count(children);

const STROKE_PATH_LENGTH = 520;

const FlowArt: React.FC<FlowArtProps> = ({
  children,
  className,
  "aria-label": ariaLabel = "Story scroll",
  as = "div",
  showSideStroke = true,
  sectionMeta,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const strokePathRef = useRef<SVGPathElement>(null);
  const strokeGlowRef = useRef<SVGPathElement>(null);
  const strokeDotRef = useRef<SVGCircleElement>(null);
  const sectionRefs = useRef<HTMLElement[]>([]);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const lastActiveRef = useRef(0);

  const count = Math.max(1, childCount(children));

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const sections = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>("[data-flow-section]")
      );
      sectionRefs.current = sections;
      if (sections.length === 0) return;

      const updateSideStroke = (progress: number) => {
        const strokeState = computeContinuousStrokeState(progress, sections.length);
        const offset = STROKE_PATH_LENGTH * (1 - strokeState.strokeProgress);

        if (strokePathRef.current) {
          strokePathRef.current.style.strokeDashoffset = offset.toFixed(2);
        }
        if (strokeGlowRef.current) {
          strokeGlowRef.current.style.strokeDashoffset = offset.toFixed(2);
        }
        if (strokeDotRef.current) {
          const cy = 18 + strokeState.strokeProgress * 484;
          strokeDotRef.current.setAttribute("cy", cy.toFixed(1));
        }

        if (lastActiveRef.current !== strokeState.activeIndex) {
          lastActiveRef.current = strokeState.activeIndex;
          setActiveIndex(strokeState.activeIndex);
        }
      };

      if (reducedMotion) {
        updateSideStroke(1);
        return;
      }

      const triggers: ScrollTrigger[] = [];

      // Master continuous stroke rail progress spanning the entire FlowArt sequence
      triggers.push(
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            updateSideStroke(self.progress);
          },
        })
      );

      sections.forEach((section, i) => {
        gsap.set(section, { zIndex: i + 1 });

        const inner = section.querySelector<HTMLElement>(".flow-art-container");
        if (!inner) return;

        const veil = section.querySelector<HTMLElement>("[data-flow-veil]");
        const artworkNodes = Array.from(
          section.querySelectorAll<HTMLElement>("[data-flow-parallax='artwork']")
        );
        const headlineNodes = Array.from(
          section.querySelectorAll<HTMLElement>("[data-flow-parallax='headline']")
        );
        const detailNodes = Array.from(
          section.querySelectorAll<HTMLElement>("[data-flow-parallax='detail']")
        );

        let enterProgress = i === 0 ? 1 : 0;
        let exitProgress = 0;
        let transitProgress = 0.5;

        const applyFrame = () => {
          const cam = computeStoryCardCamera(
            i,
            enterProgress,
            exitProgress,
            transitProgress
          );

          inner.style.transform = `translate3d(0, ${cam.cameraY.toFixed(2)}px, 0) rotate(${cam.rotationDeg.toFixed(2)}deg) rotateX(${cam.cameraRotateX.toFixed(2)}deg) scale(${cam.cameraScale.toFixed(4)})`;

          if (veil) {
            veil.style.opacity = cam.recedeVeilOpacity.toFixed(3);
          }

          for (const el of artworkNodes) {
            el.style.transform = `translate3d(0, ${cam.artworkParallaxY.toFixed(2)}px, 0) scale(${cam.artworkScale.toFixed(4)})`;
          }
          for (const el of headlineNodes) {
            el.style.transform = `translate3d(0, ${cam.headlineParallaxY.toFixed(2)}px, 0)`;
          }
          for (const el of detailNodes) {
            el.style.transform = `translate3d(0, ${cam.detailParallaxY.toFixed(2)}px, 0)`;
          }
        };

        // Paint deterministic initial frame before first scroll event
        applyFrame();

        // 1. Signature FlowArt bottom-left hinged rotation (30deg -> 0deg)
        if (i > 0) {
          triggers.push(
            ScrollTrigger.create({
              trigger: section,
              start: "top bottom",
              end: "top 22%",
              scrub: true,
              onUpdate: (self) => {
                enterProgress = self.progress;
                applyFrame();
              },
            })
          );
        }

        // 2. Multi-plane inner parallax while section moves through viewport
        triggers.push(
          ScrollTrigger.create({
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              transitProgress = self.progress;
              applyFrame();
            },
          })
        );

        // 3. Pinning stack + 3D camera recession as the next rotating sheet overlaps
        if (i < sections.length - 1) {
          triggers.push(
            ScrollTrigger.create({
              trigger: section,
              start: "bottom bottom",
              end: "bottom top",
              pin: true,
              pinSpacing: false,
              onUpdate: (self) => {
                exitProgress = self.progress;
                applyFrame();
              },
            })
          );
        }
      });

      updateSideStroke(0);
      ScrollTrigger.refresh();

      return () => {
        triggers.forEach((t) => t.kill());
      };
    },
    { scope: containerRef, dependencies: [count, reducedMotion] }
  );

  const handleJumpToPanel = (index: number) => {
    const target = sectionRefs.current[index];
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
  };

  const activeTone = sectionMeta?.[activeIndex]?.tone ?? "light";
  const isLightInk = activeTone === "light";

  const WrapperTag = as;

  return (
    <WrapperTag
      ref={containerRef as React.RefObject<HTMLDivElement>}
      aria-label={ariaLabel}
      data-testid="story-scroll-root"
      data-active-panel={String(activeIndex + 1).padStart(2, "0")}
      className={cx("relative w-full overflow-x-clip", className)}
    >
      {/* Continuous Japanese Calligraphic Side Stroke Rail (stays unbroken across all stacked sheets) */}
      {showSideStroke && (
        <div
          aria-label="Story chapter stroke rail"
          data-flow-stroke-rail
          data-testid="story-scroll-side-stroke"
          className="pointer-events-none absolute inset-y-0 left-0 z-40 hidden sm:block w-14 md:w-16"
        >
          <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center py-24">
            <div className="relative flex h-[62vh] max-h-[540px] w-10 flex-col items-center justify-between">
              {/* Continuous brush-tapered SVG stroke drawn progressively across scroll */}
              <svg
                viewBox="0 0 36 520"
                fill="none"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Quiet background track guide */}
                <path
                  d="M18 18 C15 110, 21 190, 18 264 C15 344, 21 428, 18 502"
                  stroke={isLightInk ? "rgba(243,233,222,0.22)" : "rgba(121,43,51,0.22)"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* Soft crimson/gold brush aura */}
                <path
                  ref={strokeGlowRef}
                  d="M18 18 C15 110, 21 190, 18 264 C15 344, 21 428, 18 502"
                  stroke={isLightInk ? "rgba(218,166,112,0.42)" : "rgba(184,48,58,0.28)"}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={STROKE_PATH_LENGTH}
                  strokeDashoffset={reducedMotion ? 0 : STROKE_PATH_LENGTH}
                />
                {/* Primary continuous dry-brush ink stroke */}
                <path
                  ref={strokePathRef}
                  d="M18 18 C15 110, 21 190, 18 264 C15 344, 21 428, 18 502"
                  stroke={isLightInk ? "#F3E9DE" : "#792B33"}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeDasharray={STROKE_PATH_LENGTH}
                  strokeDashoffset={reducedMotion ? 0 : STROKE_PATH_LENGTH}
                />
                {/* Traveling vermilion brush tip bead */}
                <circle
                  ref={strokeDotRef}
                  cx="18"
                  cy={reducedMotion ? "502" : "18"}
                  r="4.2"
                  fill="#C7383E"
                  stroke={isLightInk ? "#F3E9DE" : "#241A1C"}
                  strokeWidth="1.4"
                />
              </svg>

              {/* Interactive chapter markers along the continuous stroke */}
              {(sectionMeta ?? Array.from({ length: count }, (_, idx) => ({
                index: String(idx + 1).padStart(2, "0"),
                label: `Panel ${idx + 1}`,
              }))).map((item, idx) => {
                const isCurrent = idx === activeIndex;
                const isPassed = idx < activeIndex;
                return (
                  <button
                    key={item.index}
                    type="button"
                    onClick={() => handleJumpToPanel(idx)}
                    aria-label={`Jump to ${item.index}: ${item.label}`}
                    aria-current={isCurrent ? "step" : undefined}
                    className="pointer-events-auto group relative z-10 flex h-8 w-8 items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
                  >
                    <span
                      className={cx(
                        "block transition-all duration-300",
                        isCurrent
                          ? "h-2.5 w-2.5 rotate-45 bg-[#C7383E] ring-2 ring-[#F3E9DE]/80"
                          : isPassed
                            ? isLightInk
                              ? "h-1.5 w-1.5 rounded-full bg-[#F3E9DE]/90"
                              : "h-1.5 w-1.5 rounded-full bg-[#792B33]/90"
                            : isLightInk
                              ? "h-1.5 w-1.5 rounded-full bg-[#F3E9DE]/35 group-hover:bg-[#F3E9DE]/80"
                              : "h-1.5 w-1.5 rounded-full bg-[#792B33]/35 group-hover:bg-[#792B33]/80"
                      )}
                    />
                    <span
                      className={cx(
                        "pointer-events-none absolute left-8 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums transition-opacity duration-200",
                        isCurrent
                          ? isLightInk
                            ? "opacity-95 text-[#F3E9DE]"
                            : "opacity-95 text-[#792B33]"
                          : isLightInk
                            ? "opacity-0 group-hover:opacity-85 text-[#F3E9DE]"
                            : "opacity-0 group-hover:opacity-85 text-[#792B33]"
                      )}
                    >
                      {item.index}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {children}
    </WrapperTag>
  );
};

export interface StoryScrollTornBottomConfig {
  variant: TornPaperVariant;
  phaseOffset?: number;
  testId?: string;
}

export interface StoryScrollChapterProps {
  children: React.ReactNode;
  /** Corner pivot for the tactile Story-Scroll hinged swing */
  hinge?: "left" | "right";
  /** Maximum entrance rotation in degrees (gentle editorial tilt) */
  maxDeg?: number;
  /** Surface color exposed behind the swinging sheet corner */
  backdropColor?: string;
  /** Ascending stacking order so incoming chapters physically rise over previous chapters */
  zIndex?: number;
  /** Overlap slightly onto the bottom edge of the previous chapter for a rising curtain feel */
  overlapPrev?: boolean;
  /** Surface tone of this sheet so its top edge highlight & cast shadow maximize contrast */
  surfaceTone?: "burgundy" | "ivory";
  /**
   * Optional attached jagged torn-paper edge fused directly onto the bottom of this sheet.
   * When present, the chapter and its torn edge transform as ONE seamless piece of handmade
   * paper overhanging the next chapter with zero seam or side-edge gap.
   */
  tornBottom?: StoryScrollTornBottomConfig;
  /** Optional test ID for automated verification */
  testId?: string;
  className?: string;
}

function buildSheetShadow(
  dynamicStrength: number,
  persistent: boolean,
  isTornBottom: boolean
): string {
  // Always give overlapping Story Scroll sheets a grounded upper shadow so adjacent same-color
  // sheets (Ivory-on-Ivory or Burgundy-on-Burgundy) stay unmistakably layered & legible.
  const base = persistent ? 0.28 : 0;
  const strength = Math.max(base, dynamicStrength);
  if (strength <= 0.005) return "";

  const ambientAlpha = Math.min(0.46, strength * 0.8).toFixed(3);
  const deepAlpha = Math.min(0.68, strength * 1.15).toFixed(3);
  const midAlpha = Math.min(0.48, strength * 0.82).toFixed(3);
  const contactAlpha = Math.min(0.36, strength * 0.62).toFixed(3);

  // If the bottom is a transparent WebGL torn-paper lip, avoid casting a rectangular box-shadow
  // at the bottom edge (top negative Y-offset keeps the shadow strictly above the sheet lip).
  const spread = isTornBottom ? "-6px" : "0px";
  return [
    `0 -48px 110px ${spread} rgba(14, 3, 6, ${ambientAlpha})`,
    `0 -28px 68px ${spread} rgba(18, 5, 8, ${deepAlpha})`,
    `0 -10px 26px ${spread} rgba(24, 7, 11, ${midAlpha})`,
    `0 -2px 7px 0px rgba(18, 5, 8, ${contactAlpha})`,
  ].join(", ");
}

/**
 * Portfolio-wide Story Scroll chapter wrapper with overlapping depth parallax,
 * distinct multi-layer sheet shadows, and optional fused torn-paper bottom edges.
 * - Entrance: rises UP over the previous chapter from a higher z-index with hinged corner
 *   swing, accelerated upward lift, crisp top hairline highlight, and bold cast shadow.
 * - Exit: lags gently downward while scaling softly back under a recessed atmospheric veil
 *   (disabled on `tornBottom` sheets so the overhanging torn edge never pulls back from the sides).
 */
export const StoryScrollChapter: React.FC<StoryScrollChapterProps> = ({
  children,
  hinge = "left",
  maxDeg = 9.5,
  backdropColor = "#F3E9DE",
  zIndex = 10,
  overlapPrev = false,
  surfaceTone = "burgundy",
  tornBottom,
  testId,
  className,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const sheetSurfaceRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const hasTornBottom = Boolean(tornBottom);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useGSAP(
    () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      const sheetSurface = sheetSurfaceRef.current;
      const veil = veilRef.current;
      if (!outer || !inner || !sheetSurface) return;

      const settledShadow = buildSheetShadow(0, overlapPrev, hasTornBottom);

      if (reducedMotion) {
        inner.style.transform = "";
        sheetSurface.style.boxShadow = settledShadow;
        if (veil) veil.style.opacity = "0";
        outer.dataset.storyHingeProgress = "1.00";
        outer.dataset.storyRecedeProgress = "0.00";
        return;
      }

      let enterProgress = 0;
      let exitProgress = 0;

      const applyParallaxFrame = () => {
        const st = computeChapterParallaxLayerState(
          enterProgress,
          exitProgress,
          maxDeg,
          hinge,
          104,
          128,
          !hasTornBottom
        );
        outer.dataset.storyHingeProgress = enterProgress.toFixed(2);
        outer.dataset.storyRecedeProgress = exitProgress.toFixed(2);

        if (st.isNeutral) {
          inner.style.transform = "";
          sheetSurface.style.boxShadow = settledShadow;
          if (veil) veil.style.opacity = "0";
        } else {
          inner.style.transform = `translate3d(0, ${st.translateYPx}px, 0) rotate(${st.rotationDeg}deg) scale(${st.scale})`;
          sheetSurface.style.boxShadow = buildSheetShadow(
            st.shadowOpacity,
            overlapPrev,
            hasTornBottom
          );
          if (veil) {
            veil.style.opacity = st.recedeVeilOpacity.toFixed(3);
          }
        }
      };

      // Deterministic initial progress from current viewport position
      const rect = outer.getBoundingClientRect();
      const vh = Math.max(1, window.innerHeight);
      const startY = vh;
      const endY = vh * 0.2;
      enterProgress = Math.min(
        1,
        Math.max(0, (startY - rect.top) / Math.max(1, startY - endY))
      );
      exitProgress = Math.min(
        1,
        Math.max(0, (vh - rect.bottom) / Math.max(1, vh))
      );
      applyParallaxFrame();

      const enterTrigger = ScrollTrigger.create({
        trigger: outer,
        start: "top bottom",
        end: "top 20%",
        scrub: true,
        onUpdate: (self) => {
          enterProgress = self.progress;
          applyParallaxFrame();
        },
      });

      const exitTrigger = !hasTornBottom
        ? ScrollTrigger.create({
            trigger: outer,
            start: "bottom bottom",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              exitProgress = self.progress;
              applyParallaxFrame();
            },
          })
        : null;

      return () => {
        enterTrigger.kill();
        exitTrigger?.kill();
        inner.style.transform = "";
        sheetSurface.style.boxShadow = "";
        if (veil) veil.style.opacity = "0";
      };
    },
    {
      scope: outerRef,
      dependencies: [hinge, maxDeg, overlapPrev, hasTornBottom, reducedMotion],
    }
  );

  return (
    <div
      ref={outerRef}
      data-testid={testId}
      data-story-hinge={hinge}
      data-story-hinge-progress="0.00"
      data-story-recede-progress="0.00"
      data-story-has-torn={hasTornBottom ? "true" : "false"}
      className={cx(
        "relative w-full overflow-x-clip",
        overlapPrev && "-mt-8 sm:-mt-14",
        hasTornBottom && "-mb-[116px] sm:-mb-[144px] lg:-mb-[168px]",
        className
      )}
      style={{
        backgroundColor: overlapPrev || hasTornBottom ? "transparent" : backdropColor,
        perspective: "1400px",
        zIndex,
      }}
    >
      {/* Lower recessed backdrop (below top overlap zone) so receding sheets never expose a light body gap at the side margin */}
      {overlapPrev && !hasTornBottom && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 top-32 -z-10"
          style={{ backgroundColor: backdropColor }}
        />
      )}

      <div
        ref={innerRef}
        className="relative w-full will-change-transform"
        style={{
          transformOrigin: hinge === "left" ? "bottom left" : "bottom right",
        }}
      >
        {/* Main elevated sheet surface with multi-layer drop shadow & crisp top-edge bevel highlight */}
        <div
          ref={sheetSurfaceRef}
          data-story-sheet-surface
          className="relative w-full"
        >
          {/* Crisp top-edge architectural paper highlight so same-color Story Scroll sheets read clearly */}
          {overlapPrev && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[1.5px]"
              style={{
                background:
                  surfaceTone === "ivory"
                    ? "linear-gradient(90deg, rgba(121,43,51,0.16) 0%, rgba(121,43,51,0.34) 50%, rgba(121,43,51,0.16) 100%)"
                    : "linear-gradient(90deg, rgba(243,233,222,0.14) 0%, rgba(243,233,222,0.36) 50%, rgba(243,233,222,0.14) 100%)",
              }}
            />
          )}

          {children}

          {/* Atmospheric depth veil dimming outgoing chapter as the next sheet rises over it */}
          <div
            ref={veilRef}
            aria-hidden="true"
            data-story-recede-veil
            className="pointer-events-none absolute inset-0 z-30 bg-[#140508] opacity-0 will-change-[opacity]"
          />
        </div>

        {/* Seamless attached torn-paper lip welded directly to the transforming sheet */}
        {tornBottom && (
          <TornPaperPeel
            attached
            variant={tornBottom.variant}
            phaseOffset={tornBottom.phaseOffset}
            testId={tornBottom.testId}
          />
        )}
      </div>
    </div>
  );
};

export default FlowArt;

