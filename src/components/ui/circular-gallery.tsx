"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
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
  /** Controls the speed of auto-rotation in degrees per frame when not scrolling. */
  autoRotateSpeed?: number;
  /** Optional sticky runway container used to drive 0..360deg rotation across the section. */
  scrollTargetRef?: RefObject<HTMLElement | null>;
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
      radius = 500,
      autoRotateSpeed = 0.22,
      scrollTargetRef,
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
    const ringRef = useRef<HTMLDivElement | null>(null);
    const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
    const [inView, setInView] = useState(true);
    const [stageWidth, setStageWidth] = useState(1200);
    const [frontIndex, setFrontIndex] = useState(0);
    const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

    // Imperative rotation refs so rAF runs at 60fps with zero React churn or fighting CSS transitions
    const autoRotRef = useRef(0);
    const scrollRotRef = useRef(0);
    const dragOffsetRef = useRef(0);
    const manualOffsetRef = useRef(manualOffsetDeg);
    const currentRotRef = useRef(manualOffsetDeg);
    const isDraggingRef = useRef(false);
    const pausedRef = useRef(paused);
    const autoSpeedRef = useRef(autoRotateSpeed);
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
      itemsLenRef.current = items.length;
    }, [items.length]);

    useEffect(() => {
      onActiveIndexChangeRef.current = onActiveIndexChange;
    }, [onActiveIndexChange]);

    const assignRefs = (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    // Track stage width for responsive 3D radius and card dimensions
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

    // Track visibility in viewport
    useEffect(() => {
      const node = containerRef.current;
      if (!node || typeof IntersectionObserver === "undefined") return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          setInView(entry.isIntersecting);
        },
        { threshold: 0.02 }
      );
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    // Handle scroll-driven rotation cleanly on Lenis / native scroll
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
      return () => {
        window.removeEventListener("scroll", updateScrollRotation);
      };
    }, [scrollTargetRef]);

    // Continuous 60fps rAF loop for smooth auto-rotation + eased step/scroll interpolation
    useEffect(() => {
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let rafId = 0;
      let lastTime = performance.now();

      const applyRotationToDOM = (deg: number) => {
        if (ringRef.current) {
          ringRef.current.style.transform = `rotateY(${deg.toFixed(3)}deg)`;
        }
        if (containerRef.current) {
          containerRef.current.dataset.rotation = deg.toFixed(1);
        }

        const total = itemsLenRef.current;
        for (let i = 0; i < total; i++) {
          const cardEl = cardRefs.current[i];
          if (!cardEl) continue;
          const { opacity } = computeGalleryCardTransform(i, total, deg);
          cardEl.style.opacity = opacity.toFixed(3);
        }

        const nextFront = getFrontGalleryIndex(total, deg);
        if (lastReportedFrontRef.current !== nextFront) {
          lastReportedFrontRef.current = nextFront;
          setFrontIndex(nextFront);
          onActiveIndexChangeRef.current?.(nextFront);
        }
      };

      // Apply immediate initial transform before first rAF tick
      const initialTarget =
        scrollRotRef.current +
        autoRotRef.current +
        dragOffsetRef.current +
        manualOffsetRef.current;
      currentRotRef.current = initialTarget;
      applyRotationToDOM(currentRotRef.current);

      const step = (now: number) => {
        const dt = Math.min(64, Math.max(0, now - lastTime));
        lastTime = now;

        if (!reduced && inView && !pausedRef.current && !isDraggingRef.current) {
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

        applyRotationToDOM(currentRotRef.current);
        rafId = requestAnimationFrame(step);
      };

      rafId = requestAnimationFrame(step);
      return () => {
        cancelAnimationFrame(rafId);
      };
    }, [inView, items.length]);

    const { cardWidth, cardHeight, effectiveRadius } = useMemo(() => {
      if (stageWidth < 640) {
        return {
          cardWidth: 224,
          cardHeight: 304,
          effectiveRadius: Math.min(radius, Math.max(195, Math.round(stageWidth * 0.54))),
        };
      }
      if (stageWidth < 1024) {
        return {
          cardWidth: 264,
          cardHeight: 356,
          effectiveRadius: Math.min(radius, Math.max(290, Math.round(stageWidth * 0.42))),
        };
      }
      return {
        cardWidth: 296,
        cardHeight: 396,
        effectiveRadius: Math.min(radius, Math.max(380, Math.round(stageWidth * 0.36))),
      };
    }, [stageWidth, radius]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
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

    return (
      <div
        ref={assignRefs}
        role="region"
        aria-label="Circular 3D Gallery"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        className={cn(
          "relative w-full h-full flex items-center justify-center overflow-hidden select-none touch-pan-y cursor-grab active:cursor-grabbing",
          className
        )}
        style={{ perspective: "2000px" }}
        {...props}
      >
        <div
          ref={ringRef}
          className="relative w-full h-full will-change-transform"
          style={{
            transform: "rotateY(0deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {items.map((item, i) => {
            const { itemAngle, opacity } = computeGalleryCardTransform(i, items.length, 0);
            const isFront = i === frontIndex;
            const isSelected = selectedItemId !== null && item.id === selectedItemId;
            const hasFailed = Boolean(failedUrls[item.photo.url]);

            return (
              <div
                key={item.id ?? item.photo.url}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                role="group"
                aria-label={item.common}
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  transform: `rotateY(${itemAngle}deg) translateZ(${effectiveRadius}px)`,
                  left: "50%",
                  top: "50%",
                  marginLeft: `-${cardWidth / 2}px`,
                  marginTop: `-${cardHeight / 2}px`,
                  opacity,
                }}
                className="absolute"
              >
                <button
                  id={item.id ? `project-trigger-${item.id}` : undefined}
                  type="button"
                  onClick={() => {
                    if (dragDistanceRef.current >= 8) return;
                    onSelectItem?.(item, i);
                  }}
                  aria-label={`Inspect ${item.common} case study`}
                  aria-current={isFront ? "true" : undefined}
                  className={cn(
                    "group relative block w-full h-full text-left rounded-[16px] overflow-hidden border bg-card transition-[border-color,box-shadow] duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#BCA5D4] focus-visible:outline-offset-4",
                    isSelected || isFront
                      ? "border-[#BCA5D4]/80 shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
                      : "border-border shadow-[0_18px_40px_rgba(0,0,0,0.5)] hover:border-[#BCA5D4]/60"
                  )}
                >
                  {hasFailed ? (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 35%, rgba(188,165,212,0.16), #17131F 72%)",
                      }}
                    >
                      <Layers size={28} strokeWidth={1.5} className="text-[#BCA5D4]" />
                      <span className="font-mono text-xs uppercase tracking-[0.08em] text-[#ADA4B8]">
                        {item.common}
                      </span>
                    </div>
                  ) : (
                    <Image
                      src={item.photo.url}
                      alt={item.photo.text}
                      fill
                      sizes="(max-width: 640px) 224px, 300px"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedUrls((prev) => ({ ...prev, [item.photo.url]: true }))
                      }
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
                      style={{ objectPosition: item.photo.pos || "center" }}
                    />
                  )}

                  {/* Measured contrast scrim */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#0D0B12] via-[#0D0B12]/55 to-transparent"
                  />

                  {/* Top subtle index & action */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-[0.08em] text-[#ADA4B8]">
                    <span className="tabular-nums text-[#BCA5D4]">
                      {item.index ?? String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#F3EEF8]/85 transition-colors group-hover:text-[#BCA5D4]">
                      <span>Inspect</span>
                      <MoveUpRight size={13} strokeWidth={1.6} aria-hidden="true" />
                    </span>
                  </div>

                  {/* Bottom editorial caption */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-[#F3EEF8]">
                    <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#ADA4B8]">
                      {item.binomial}
                    </div>
                    <h3 className="mt-1.5 text-xl sm:text-2xl font-semibold tracking-[-0.03em] leading-tight text-[#F3EEF8]">
                      {item.common}{" "}
                      {item.accent ? (
                        <em className="type-serif-accent font-normal">{item.accent}</em>
                      ) : null}
                    </h3>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#393143]/80 pt-2.5 text-[11px] font-mono text-[#ADA4B8] tabular-nums">
                      <span>{item.photo.by}</span>
                      {item.metricValue ? (
                        <span className="text-[#BCA5D4]">{item.metricValue}</span>
                      ) : null}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = "CircularGallery";

export { CircularGallery };
