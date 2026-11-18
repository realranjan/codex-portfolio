"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type MutableRefObject,
  type RefObject,
} from "react";
import Image from "next/image";
import { Layers, MoveUpRight } from "lucide-react";
import {
  computeGalleryCardTransform,
  computeStickyScrollRotation,
  getFrontGalleryIndex,
} from "@/lib/motion";

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

export interface GalleryItem {
  common: string;
  binomial: string;
  photo: {
    url: string;
    text: string;
    pos?: string;
    by: string;
  };
  id?: string;
  index?: string;
  accent?: string;
  metricLabel?: string;
  metricValue?: string;
}

export interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  /** Controls how far the items are from the center on desktop viewports. */
  radius?: number;
  /** Orbital plane pitch tilt in degrees (negative dips the front arc slightly down). */
  tiltDeg?: number;
  /** Controls the speed of auto-rotation in degrees per frame when not scrolling. */
  autoRotateSpeed?: number;
  /** Optional sticky runway container used to drive 0..360deg rotation across the section. */
  scrollTargetRef?: RefObject<HTMLElement | null>;
  /** Optional 0..1 ref controlling O-shape orbital track drawing around the model. */
  ringDrawMixRef?: MutableRefObject<number>;
  /** Optional 0..1 ref controlling carousel cards bloom along the O-shape line. */
  carouselMixRef?: MutableRefObject<number>;
  /** Optional external rotational offset (e.g. from Next/Previous buttons). */
  manualOffsetDeg?: number;
  /** Callback when a card is activated (ignores pointer drag gestures). */
  onSelectItem?: (item: GalleryItem, index: number) => void;
  /** Callback when the front-most card index changes. */
  onActiveIndexChange?: (index: number) => void;
  /** Currently selected item id (highlights border while flyout is open). */
  selectedItemId?: string | null;
  /** Pauses continuous auto-rotation when true. */
  paused?: boolean;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  (
    {
      items,
      className,
      radius = 510,
      tiltDeg = -9,
      autoRotateSpeed = 0.2,
      scrollTargetRef,
      ringDrawMixRef,
      carouselMixRef,
      manualOffsetDeg = 0,
      onSelectItem,
      onActiveIndexChange,
      selectedItemId = null,
      paused = false,
      ...props
    },
    forwardedRef
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const backStageRef = useRef<HTMLDivElement | null>(null);
    const frontStageRef = useRef<HTMLDivElement | null>(null);
    const backRingRef = useRef<HTMLDivElement | null>(null);
    const frontRingRef = useRef<HTMLDivElement | null>(null);
    const backArcPathRef = useRef<SVGPathElement | null>(null);
    const frontArcPathRef = useRef<SVGPathElement | null>(null);
    const backArcWrapRef = useRef<HTMLDivElement | null>(null);
    const frontArcWrapRef = useRef<HTMLDivElement | null>(null);
    const backCardRefs = useRef<Array<HTMLDivElement | null>>([]);
    const frontCardRefs = useRef<Array<HTMLDivElement | null>>([]);
    const frontFaceRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const [stageWidth, setStageWidth] = useState(1200);
    const [frontIndex, setFrontIndex] = useState(0);
    const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

    // Imperative rotation & mix refs so rAF runs at 60fps with zero React churn
    const autoRotRef = useRef(0);
    const scrollRotRef = useRef(0);
    const dragOffsetRef = useRef(0);
    const manualOffsetRef = useRef(manualOffsetDeg);
    const currentRotRef = useRef(manualOffsetDeg);
    const isDraggingRef = useRef(false);
    const pausedRef = useRef(paused);
    const autoSpeedRef = useRef(autoRotateSpeed);
    const tiltDegRef = useRef(tiltDeg);
    const itemsLenRef = useRef(items.length);

    const dragStartXRef = useRef(0);
    const dragBaseOffsetRef = useRef(0);
    const dragDistanceRef = useRef(0);
    const lastReportedFrontRef = useRef(0);
    const onActiveIndexChangeRef = useRef(onActiveIndexChange);

    useEffect(() => {
      manualOffsetRef.current = manualOffsetDeg;
    }, [manualOffsetDeg]);

    useEffect(() => {
      pausedRef.current = paused;
    }, [paused]);

    useEffect(() => {
      autoSpeedRef.current = autoRotateSpeed;
    }, [autoRotateSpeed]);

    useEffect(() => {
      tiltDegRef.current = tiltDeg;
    }, [tiltDeg]);

    useEffect(() => {
      itemsLenRef.current = items.length;
    }, [items.length]);

    useEffect(() => {
      onActiveIndexChangeRef.current = onActiveIndexChange;
    }, [onActiveIndexChange]);

    const { cardWidth, cardHeight, effectiveRadius } = useMemo(() => {
      if (stageWidth < 640) {
        return {
          cardWidth: 178,
          cardHeight: 232,
          effectiveRadius: Math.min(radius, Math.max(180, Math.round(stageWidth * 0.49))),
        };
      }
      if (stageWidth < 1024) {
        return {
          cardWidth: 222,
          cardHeight: 286,
          effectiveRadius: Math.min(radius, Math.max(305, Math.round(stageWidth * 0.4))),
        };
      }
      return {
        cardWidth: 244,
        cardHeight: 312,
        effectiveRadius: Math.min(radius, Math.max(430, Math.round(stageWidth * 0.35))),
      };
    }, [stageWidth, radius]);

    const semiArcLenRef = useRef(Math.PI * effectiveRadius);
    useEffect(() => {
      semiArcLenRef.current = Math.PI * effectiveRadius;
    }, [effectiveRadius]);

    const assignRefs = (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    // Track stage width for responsive 3D orbit radius and card dimensions
    useEffect(() => {
      const node = containerRef.current;
      if (!node) return;

      const updateSize = () => {
        setStageWidth(node.clientWidth || window.innerWidth);
      };
      updateSize();

      if (typeof ResizeObserver === "undefined") {
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
      }

      const observer = new ResizeObserver(updateSize);
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    // Scroll-driven rotation across the Projects orbit runway
    useEffect(() => {
      const updateScrollRotation = () => {
        const targetEl = scrollTargetRef?.current;
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          scrollRotRef.current = computeStickyScrollRotation(
            rect.top,
            targetEl.offsetHeight,
            window.innerHeight
          );
        } else {
          const scrollableHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          const scrollProgress =
            scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
          scrollRotRef.current = scrollProgress * 360;
        }
      };

      updateScrollRotation();
      window.addEventListener("scroll", updateScrollRotation, { passive: true });
      window.addEventListener("resize", updateScrollRotation);
      return () => {
        window.removeEventListener("scroll", updateScrollRotation);
        window.removeEventListener("resize", updateScrollRotation);
      };
    }, [scrollTargetRef]);

    // Continuous 60fps loop synchronizing the O-shape track + front/back card hemispheres around the bust
    useEffect(() => {
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let rafId = 0;
      let lastTime = performance.now();

      const applyRotationToDOM = (deg: number, ringMix: number, cardMix: number) => {
        const clampedRing = Math.min(1, Math.max(0, ringMix));
        const clampedCards = Math.min(1, Math.max(0, cardMix));
        const stageVisible = clampedRing > 0.01 || clampedCards > 0.01;
        const interactive = clampedCards >= 0.35;
        const cardScale = 0.9 + 0.1 * clampedCards;
        const ringTransform = `rotateX(${tiltDegRef.current}deg) rotateY(${deg.toFixed(3)}deg) scale(${cardScale.toFixed(4)})`;

        if (backRingRef.current) {
          backRingRef.current.style.transform = ringTransform;
        }
        if (frontRingRef.current) {
          frontRingRef.current.style.transform = ringTransform;
        }

        // Sweep circular O-shape line smoothly (0 -> 0.5 draws rear arc; 0.5 -> 1 closes front arc)
        const arcLen = semiArcLenRef.current;
        const backDraw = Math.min(1, Math.max(0, clampedRing * 2));
        const frontDraw = Math.min(1, Math.max(0, (clampedRing - 0.5) * 2));
        if (backArcPathRef.current) {
          backArcPathRef.current.style.strokeDasharray = `${arcLen.toFixed(1)}`;
          backArcPathRef.current.style.strokeDashoffset = `${((1 - backDraw) * arcLen).toFixed(1)}`;
        }
        if (frontArcPathRef.current) {
          frontArcPathRef.current.style.strokeDasharray = `${arcLen.toFixed(1)}`;
          frontArcPathRef.current.style.strokeDashoffset = `${((1 - frontDraw) * arcLen).toFixed(1)}`;
        }
        const trackOpacity = clampedRing > 0.01 ? (0.45 + 0.55 * clampedRing).toFixed(3) : "0";
        if (backArcWrapRef.current) {
          backArcWrapRef.current.style.opacity = trackOpacity;
        }
        if (frontArcWrapRef.current) {
          frontArcWrapRef.current.style.opacity = trackOpacity;
        }

        if (backStageRef.current) {
          backStageRef.current.style.opacity = stageVisible ? "1" : "0";
          backStageRef.current.style.visibility = stageVisible ? "visible" : "hidden";
        }
        if (frontStageRef.current) {
          frontStageRef.current.style.opacity = stageVisible ? "1" : "0";
          frontStageRef.current.style.visibility = stageVisible ? "visible" : "hidden";
          frontStageRef.current.style.pointerEvents = interactive ? "auto" : "none";
        }

        if (containerRef.current) {
          containerRef.current.dataset.rotation = deg.toFixed(1);
          containerRef.current.dataset.ringMix = clampedRing.toFixed(2);
          containerRef.current.dataset.carouselMix = clampedCards.toFixed(2);
        }

        const total = itemsLenRef.current;
        for (let i = 0; i < total; i++) {
          const { opacity, normalizedAngle } = computeGalleryCardTransform(i, total, deg);
          const isBackHemisphere = normalizedAngle > 90;

          const backEl = backCardRefs.current[i];
          if (backEl) {
            backEl.style.visibility =
              isBackHemisphere && clampedCards > 0.01 ? "visible" : "hidden";
            backEl.style.opacity = (opacity * 0.56 * clampedCards).toFixed(3);
          }

          const frontEl = frontCardRefs.current[i];
          if (frontEl) {
            frontEl.style.visibility =
              !isBackHemisphere && clampedCards > 0.01 ? "visible" : "hidden";
            frontEl.style.opacity = (opacity * clampedCards).toFixed(3);
          }

          const frontBtn = frontFaceRefs.current[i];
          if (frontBtn) {
            frontBtn.style.pointerEvents =
              !isBackHemisphere && interactive ? "auto" : "none";
          }
        }

        const nextFront = getFrontGalleryIndex(total, deg);
        if (lastReportedFrontRef.current !== nextFront) {
          lastReportedFrontRef.current = nextFront;
          setFrontIndex(nextFront);
          onActiveIndexChangeRef.current?.(nextFront);
        }
      };

      const initialRingMix = ringDrawMixRef ? ringDrawMixRef.current : 1;
      const initialCardMix = carouselMixRef ? carouselMixRef.current : 1;
      currentRotRef.current =
        scrollRotRef.current +
        autoRotRef.current +
        dragOffsetRef.current +
        manualOffsetRef.current;
      applyRotationToDOM(currentRotRef.current, initialRingMix, initialCardMix);

      const step = (now: number) => {
        const dt = Math.min(64, Math.max(0, now - lastTime));
        lastTime = now;

        const ringMix = ringDrawMixRef ? ringDrawMixRef.current : 1;
        const cardMix = carouselMixRef ? carouselMixRef.current : 1;
        if (!reduced && cardMix > 0.08 && !pausedRef.current && !isDraggingRef.current) {
          autoRotRef.current += autoSpeedRef.current * (dt / 16.667);
        }

        const target =
          scrollRotRef.current +
          autoRotRef.current +
          dragOffsetRef.current +
          manualOffsetRef.current;

        if (reduced || isDraggingRef.current) {
          currentRotRef.current = target;
        } else {
          const alpha = 1 - Math.exp(-dt * 0.014);
          currentRotRef.current += (target - currentRotRef.current) * alpha;
        }

        applyRotationToDOM(currentRotRef.current, ringMix, cardMix);
        rafId = requestAnimationFrame(step);
      };

      rafId = requestAnimationFrame(step);
      return () => {
        cancelAnimationFrame(rafId);
      };
    }, [ringDrawMixRef, carouselMixRef, items.length]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if (carouselMixRef && carouselMixRef.current < 0.35) return;
      isDraggingRef.current = true;
      dragStartXRef.current = e.clientX;
      dragBaseOffsetRef.current = dragOffsetRef.current;
      dragDistanceRef.current = 0;
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartXRef.current;
      dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(dx));
      dragOffsetRef.current = dragBaseOffsetRef.current + dx * 0.32;
    };

    const handlePointerEnd = () => {
      isDraggingRef.current = false;
    };

    const orbitDiameter = effectiveRadius * 2;
    const planeTilt = tiltDeg + 90;

    return (
      /* Intentionally NO z-index, transform, opacity, or perspective on root so back (z-2) & front (z-12) stages interleave around ParticlePortrait (z-5) */
      <div
        ref={assignRefs}
        role="region"
        aria-label="Circular 3D Project Gallery"
        className={cn("absolute inset-0 pointer-events-none select-none", className)}
        {...props}
      >
        {/* BACK HEMISPHERE STAGE (z-[2]): far arc of the O-shape track + rear cards strictly behind the bust */}
        <div
          ref={backStageRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center overflow-hidden"
          style={{ perspective: "2200px", opacity: 0, visibility: "hidden" }}
        >
          {/* Back half of the O-shape circular track passing behind the bust */}
          <div
            ref={backArcWrapRef}
            className="pointer-events-none absolute"
            style={{
              width: `${orbitDiameter}px`,
              height: `${orbitDiameter}px`,
              left: "50%",
              top: "53.5%",
              marginLeft: `-${effectiveRadius}px`,
              marginTop: `-${effectiveRadius}px`,
              transform: `rotateX(${planeTilt}deg)`,
              transformStyle: "preserve-3d",
              opacity: 0,
            }}
          >
            <svg
              width={orbitDiameter}
              height={orbitDiameter}
              viewBox={`-6 -6 ${orbitDiameter + 12} ${orbitDiameter + 12}`}
              className="overflow-visible"
            >
              <path
                d={`M 0 ${effectiveRadius} A ${effectiveRadius} ${effectiveRadius} 0 0 1 ${orbitDiameter} ${effectiveRadius}`}
                fill="none"
                stroke="rgba(244, 241, 234, 0.14)"
                strokeWidth="2"
                strokeDasharray="4 10"
              />
              <path
                ref={backArcPathRef}
                d={`M 0 ${effectiveRadius} A ${effectiveRadius} ${effectiveRadius} 0 0 1 ${orbitDiameter} ${effectiveRadius}`}
                fill="none"
                stroke="rgba(196, 176, 220, 0.72)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div
            ref={backRingRef}
            className="relative h-full w-full will-change-transform"
            style={{
              transform: `rotateX(${tiltDeg}deg) rotateY(0deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {items.map((item, i) => {
              const { itemAngle } = computeGalleryCardTransform(i, items.length, 0);
              return (
                <div
                  key={`back-${item.id ?? item.photo.url}`}
                  ref={(el) => {
                    backCardRefs.current[i] = el;
                  }}
                  style={{
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    transform: `rotateY(${itemAngle}deg) translateZ(${effectiveRadius}px)`,
                    transformStyle: "preserve-3d",
                    left: "50%",
                    top: "53.5%",
                    marginLeft: `-${cardWidth / 2}px`,
                    marginTop: `-${cardHeight / 2}px`,
                  }}
                  className="absolute"
                >
                  <div
                    className="absolute inset-0 flex flex-col justify-between rounded-[6px] border border-white/[0.08] bg-[#0E0E13] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.65)]"
                    style={{
                      transform: "rotateY(180deg) translateZ(1px)",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-[#6C6863] tabular-nums">
                      <span>{item.index ?? String(i + 1).padStart(2, "0")}</span>
                      <span>{item.binomial}</span>
                    </div>
                    <div className="border-t border-white/[0.06] pt-3 font-mono text-[11px] text-[#6C6863]">
                      {item.common}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FRONT HEMISPHERE STAGE (z-[12]): near arc of the O-shape track + front cards orbiting cleanly */}
        <div
          ref={frontStageRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          className="absolute inset-0 z-[12] flex items-center justify-center overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing"
          style={{ perspective: "2200px", opacity: 0, visibility: "hidden", pointerEvents: "none" }}
        >
          {/* Front half of the O-shape circular track passing behind/between front cards */}
          <div
            ref={frontArcWrapRef}
            aria-hidden="true"
            className="pointer-events-none absolute z-[1]"
            style={{
              width: `${orbitDiameter}px`,
              height: `${orbitDiameter}px`,
              left: "50%",
              top: "53.5%",
              marginLeft: `-${effectiveRadius}px`,
              marginTop: `-${effectiveRadius}px`,
              transform: `rotateX(${planeTilt}deg)`,
              transformStyle: "preserve-3d",
              opacity: 0,
            }}
          >
            <svg
              width={orbitDiameter}
              height={orbitDiameter}
              viewBox={`-6 -6 ${orbitDiameter + 12} ${orbitDiameter + 12}`}
              className="overflow-visible"
            >
              <path
                d={`M ${orbitDiameter} ${effectiveRadius} A ${effectiveRadius} ${effectiveRadius} 0 0 1 0 ${effectiveRadius}`}
                fill="none"
                stroke="rgba(244, 241, 234, 0.14)"
                strokeWidth="2"
                strokeDasharray="4 10"
              />
              <path
                ref={frontArcPathRef}
                d={`M ${orbitDiameter} ${effectiveRadius} A ${effectiveRadius} ${effectiveRadius} 0 0 1 0 ${effectiveRadius}`}
                fill="none"
                stroke="rgba(196, 176, 220, 0.85)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div
            ref={frontRingRef}
            className="relative z-[2] h-full w-full will-change-transform"
            style={{
              transform: `rotateX(${tiltDeg}deg) rotateY(0deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {items.map((item, i) => {
              const { itemAngle } = computeGalleryCardTransform(i, items.length, 0);
              const isFront = i === frontIndex;
              const isSelected = selectedItemId !== null && item.id === selectedItemId;
              const hasFailed = Boolean(failedUrls[item.photo.url]);

              return (
                <div
                  key={item.id ?? item.photo.url}
                  ref={(el) => {
                    frontCardRefs.current[i] = el;
                  }}
                  role="group"
                  aria-label={item.common}
                  style={{
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    transform: `rotateY(${itemAngle}deg) translateZ(${effectiveRadius}px)`,
                    transformStyle: "preserve-3d",
                    left: "50%",
                    top: "53.5%",
                    marginLeft: `-${cardWidth / 2}px`,
                    marginTop: `-${cardHeight / 2}px`,
                  }}
                  className="absolute"
                >
                  <button
                    ref={(el) => {
                      frontFaceRefs.current[i] = el;
                    }}
                    id={item.id ? `project-trigger-${item.id}` : undefined}
                    type="button"
                    onClick={() => {
                      if (dragDistanceRef.current >= 8) return;
                      onSelectItem?.(item, i);
                    }}
                    aria-label={`Inspect ${item.common} case study`}
                    aria-current={isFront ? "true" : undefined}
                    className={cn(
                      "group relative block w-full h-full text-left rounded-[6px] overflow-hidden border bg-[#101014] transition-[border-color,box-shadow] duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C4B0DC] focus-visible:outline-offset-4",
                      isSelected || isFront
                        ? "border-[#C4B0DC]/75 shadow-[0_24px_64px_rgba(0,0,0,0.78)]"
                        : "border-white/[0.1] shadow-[0_18px_40px_rgba(0,0,0,0.6)] hover:border-white/25"
                    )}
                  >
                    {hasFailed ? (
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
                        style={{
                          background:
                            "radial-gradient(circle at 50% 35%, rgba(196,176,220,0.12), #121216 72%)",
                        }}
                      >
                        <Layers size={28} strokeWidth={1.5} className="text-[#C4B0DC]" />
                        <span className="font-mono text-xs tracking-[0.04em] text-[#A19D97]">
                          {item.common}
                        </span>
                      </div>
                    ) : (
                      <Image
                        src={item.photo.url}
                        alt={item.photo.text}
                        fill
                        sizes="(max-width: 640px) 178px, 244px"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedUrls((prev) => ({ ...prev, [item.photo.url]: true }))
                        }
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        style={{ objectPosition: item.photo.pos || "center" }}
                      />
                    )}

                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/55 to-transparent"
                    />

                    <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between gap-2 text-[11px] font-mono tracking-[0.04em] text-[#A19D97]">
                      <span className="tabular-nums text-[#C4B0DC]">
                        {item.index ?? String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#F4F1EA]/85 transition-colors group-hover:text-[#C4B0DC]">
                        <span>Inspect</span>
                        <MoveUpRight size={13} strokeWidth={1.6} aria-hidden="true" />
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-[#F4F1EA]">
                      <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.03em] text-[#A19D97]">
                        {item.binomial}
                      </div>
                      <h3 className="mt-1 text-lg sm:text-xl font-semibold tracking-[-0.025em] leading-tight text-[#F4F1EA]">
                        {item.common}{" "}
                        {item.accent ? (
                          <em className="type-serif-accent font-normal">{item.accent}</em>
                        ) : null}
                      </h3>
                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/[0.1] pt-2 text-[10px] sm:text-[11px] font-mono text-[#A19D97] tabular-nums">
                        <span className="truncate">{item.photo.by}</span>
                        {item.metricValue ? (
                          <span className="text-[#F4F1EA] shrink-0">{item.metricValue}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = "CircularGallery";

export { CircularGallery };
