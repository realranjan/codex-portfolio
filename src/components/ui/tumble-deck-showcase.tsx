"use client";

import * as React from "react";
import gsap from "gsap";
import {
  cardPose,
  clamp01,
  deckAdvance,
  fallAngle,
  resolveTumbleActiveIndex,
  wrap,
  type Pose,
} from "@/lib/tumble-deck";

export { cardPose, clamp01, deckAdvance, fallAngle, wrap, type Pose };

/*
 * Tumble Deck Showcase — a stack of cards standing on edge, one behind the
 * other. The front card tips forward on its bottom edge and lands flat on the
 * floor with a subtle bounce kick, the deck slides up to the line, and the next
 * one falls.
 *
 * Pure CSS 3D (one perspective, every card hinged on the same floor line) with
 * a single number driving it — the deck position `pos`. Supports both:
 *  - `scrollMode="internal"` (standalone): wheel, trackpad, drag, click, keys
 *    with optional endless looping.
 *  - `scrollMode="external"` (page-integrated): driven externally (e.g., GSAP
 *    ScrollTrigger) via imperative ref `setPosition(pos)` / `animateTo(pos)`
 *    with zero wheel-hijacking or scroll traps.
 */

export type TumbleCard = {
  src?: string | null;
  alt?: string;
  id?: string;
};

export type TumbleDeckHandle = {
  setPosition: (pos: number) => void;
  animateTo: (pos: number) => void;
  step: (dir: 1 | -1) => void;
  getPosition: () => number;
};

export type TumbleDeckShowcaseProps<T extends TumbleCard = TumbleCard> = {
  cards: readonly T[];
  /** Any CSS length. Default 100svh. */
  height?: number | string;
  /** Card width ÷ height. Images are cropped to it from the top. */
  aspect?: number;
  /** Wheel / trackpad travel (px) that tips one card in internal scroll mode. */
  scrollPerCard?: number;
  /** How many upright cards show behind the front one. */
  depth?: number;
  /** Background CSS color. */
  background?: string;
  /** Shade overlay color applied as cards tip toward the floor. */
  shadeColor?: string;
  /** Maximum card height fraction relative to container height (default 0.42). */
  heightRatio?: number;
  /** Whether the deck loops infinitely (default true). Set false for finite portfolios. */
  loop?: boolean;
  /**
   * "internal" captures wheel/pointer events on the container (standalone mode).
   * "external" leaves native page wheel scroll untouched and lets a parent drive
   * `pos` via `deckRef.current.setPosition(pos)` or `animateTo(pos)`.
   */
  scrollMode?: "internal" | "external";
  /** Optional swipe gesture axis when `scrollMode="external"` (e.g. "x" on mobile). */
  swipeAxis?: "x" | "y" | "none";
  /** Optional custom card renderer for rich HTML/editorial plates alongside `src` images. */
  renderCard?: (card: T, index: number, isActive: boolean) => React.ReactNode;
  /** Show subtle architectural floor hinge line where cards land. */
  showFloorLine?: boolean;
  /** Fires when the active front card index changes. */
  onActiveIndexChange?: (index: number) => void;
  /** Fires when the active upright front card is clicked. */
  onCardClick?: (index: number, triggerEl: HTMLElement | null) => void;
  /** Fires when a non-active card behind the front card is clicked or swiped to. */
  onSelectCard?: (index: number) => void;
  /** Optional imperative handle ref. */
  deckRef?: React.Ref<TumbleDeckHandle>;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  testId?: string;
};

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export default function TumbleDeckShowcase<T extends TumbleCard = TumbleCard>({
  cards,
  height = "100svh",
  aspect = 2.06,
  scrollPerCard = 240,
  depth = 5,
  background = "var(--color-background)",
  shadeColor = "#000000",
  heightRatio = 0.42,
  loop = true,
  scrollMode = "internal",
  swipeAxis = "none",
  renderCard,
  showFloorLine = false,
  onActiveIndexChange,
  onCardClick,
  onSelectCard,
  deckRef,
  className,
  style,
  ariaLabel = "Website showcase",
  testId,
}: TumbleDeckShowcaseProps<T>) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const sceneRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = React.useRef<(HTMLImageElement | null)[]>([]);
  const slotK = React.useRef<number[]>([]);
  const state = React.useRef({ pos: 0, target: 0, running: false });
  const geo = React.useRef({ h: 200, gap: 44 });
  const lastActiveRef = React.useRef<number>(0);

  const onActiveIndexChangeRef = React.useRef(onActiveIndexChange);
  const onCardClickRef = React.useRef(onCardClick);
  const onSelectCardRef = React.useRef(onSelectCard);

  React.useEffect(() => {
    onActiveIndexChangeRef.current = onActiveIndexChange;
    onCardClickRef.current = onCardClick;
    onSelectCardRef.current = onSelectCard;
  }, [onActiveIndexChange, onCardClick, onSelectCard]);

  const n = cards.length;
  // For finite decks (loop=false) we mount one real element per card (k = j).
  // For infinite decks (loop=true) we recycle a compact pool of `depth + 5` slots.
  const pool = n === 0 ? 0 : loop ? depth + 5 : n;

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [slotCardIndices, setSlotCardIndices] = React.useState<number[]>(() =>
    Array.from({ length: pool }, (_, j) => wrap(j, n))
  );

  const paint = React.useCallback(() => {
    const { pos } = state.current;
    const { gap } = geo.current;
    const base = Math.floor(pos) - 2;
    let slotsChanged = false;
    const nextSlotIndices: number[] = [];

    for (let j = 0; j < pool; j++) {
      const el = cardRefs.current[j];
      if (!el) continue;

      const k = loop ? base + wrap(j - base, pool) : j;
      const cardIdx = wrap(k, n);

      if (slotK.current[j] !== k) {
        slotK.current[j] = k;
        const c = cards[cardIdx];
        const img = imgRefs.current[j];
        if (img && c && c.src) {
          img.src = c.src;
          img.alt = c.alt ?? "";
        }
        if (loop && renderCard) {
          slotsChanged = true;
        }
      }
      if (loop && renderCard) {
        nextSlotIndices[j] = cardIdx;
      }

      const p = cardPose(k, pos, depth, { loop, cardCount: n });
      el.style.transform = `translate3d(0, ${-p.lift}px, ${p.z * gap}px) rotateX(${p.angle}deg)`;
      el.style.opacity = String(p.opacity);
      el.style.visibility = p.opacity > 0.001 ? "visible" : "hidden";
      el.style.pointerEvents = p.opacity > 0.1 && !p.flat ? "auto" : "none";

      // Light falls from above: a card darkens a touch as it tips away from it,
      // and deeper cards in the upright stack pick up subtle atmospheric depth tint.
      const depthShade = p.angle === 0 && p.z < 0 ? Math.min(0.08, -p.z * 0.022) : 0;
      const tiltShade = p.flat ? 0.085 : (-p.angle / 90) * 0.085;
      const shade = Math.max(tiltShade, depthShade);
      el.style.setProperty("--td-shade", shade.toFixed(4));
      el.dataset.poseAngle = p.angle.toFixed(1);
      el.dataset.poseFlat = p.flat ? "true" : "false";
      el.dataset.cardIndex = String(cardIdx);
    }

    if (slotsChanged && loop && renderCard) {
      setSlotCardIndices(nextSlotIndices);
    }

    const nextActive = resolveTumbleActiveIndex(pos, n, loop);
    if (rootRef.current) {
      rootRef.current.dataset.deckPos = pos.toFixed(3);
      rootRef.current.dataset.activeIndex = String(nextActive);
    }
    if (nextActive !== lastActiveRef.current) {
      lastActiveRef.current = nextActive;
      setActiveIndex(nextActive);
      onActiveIndexChangeRef.current?.(nextActive);
    }
  }, [depth, pool, cards, n, loop, renderCard]);

  // Reset slot map if cards array identity changes
  useIsomorphicLayoutEffect(() => {
    slotK.current = [];
  }, [cards]);

  // Fit: the card, the deck receding above it, and the floor card below all
  // stay cleanly framed inside the root.
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    if (!root || !scene) return;

    const fit = () => {
      const W0 = root.clientWidth;
      const H0 = root.clientHeight;
      if (W0 === 0 || H0 === 0) return;

      const wFrac = W0 < 480 ? 0.84 : W0 < 900 ? 0.78 : 0.655;
      const h = Math.max(
        60,
        Math.min((W0 * wFrac) / aspect, H0 * heightRatio, 620)
      );
      const w = h * aspect;
      const top = H0 / 2 - 0.62 * h;
      geo.current = { h, gap: 0.24 * h };

      scene.style.perspective = `${6 * h}px`;
      scene.style.perspectiveOrigin = `50% ${top - 1.66 * h}px`;
      root.style.setProperty("--td-w", `${w}px`);
      root.style.setProperty("--td-h", `${h}px`);
      root.style.setProperty("--td-top", `${top}px`);
      paint();
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    return () => ro.disconnect();
  }, [aspect, heightRatio, paint]);

  // Smooth GSAP ticker easing helper shared by internal mode and imperative animateTo()
  const followRef = React.useRef<(() => void) | null>(null);

  const clampTarget = React.useCallback(
    (to: number) => {
      if (loop) return to;
      return Math.max(0, Math.min(Math.max(0, n - 1), to));
    },
    [loop, n]
  );

  const startFollow = React.useCallback(
    (to: number, immediate = false) => {
      const s = state.current;
      const bounded = clampTarget(to);
      s.target = bounded;

      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (immediate || reduce) {
        if (s.running && followRef.current) {
          gsap.ticker.remove(followRef.current);
          s.running = false;
        }
        s.pos = bounded;
        paint();
        return;
      }

      if (!s.running && followRef.current) {
        s.running = true;
        gsap.ticker.add(followRef.current);
      }
    },
    [clampTarget, paint]
  );

  React.useEffect(() => {
    const s = state.current;
    const follow = () => {
      const dt = gsap.ticker.deltaRatio(60) / 60;
      s.pos += (s.target - s.pos) * (1 - Math.exp(-dt * 9.5));
      if (Math.abs(s.target - s.pos) < 2e-3) {
        s.pos = s.target;
        gsap.ticker.remove(follow);
        s.running = false;
      }
      paint();
    };
    followRef.current = follow;
    return () => {
      gsap.ticker.remove(follow);
      s.running = false;
      followRef.current = null;
    };
  }, [paint]);

  // Expose imperative control API for external ScrollTrigger or parent buttons
  React.useImperativeHandle(
    deckRef,
    () => ({
      setPosition(pos: number) {
        const s = state.current;
        if (s.running && followRef.current) {
          gsap.ticker.remove(followRef.current);
          s.running = false;
        }
        const bounded = clampTarget(pos);
        s.pos = bounded;
        s.target = bounded;
        paint();
      },
      animateTo(pos: number) {
        startFollow(pos, false);
      },
      step(dir: 1 | -1) {
        startFollow(Math.round(state.current.target) + dir, false);
      },
      getPosition() {
        return state.current.pos;
      },
    }),
    [clampTarget, paint, startFollow]
  );

  // Internal wheel/drag mode OR external horizontal-swipe mode
  const dragged = React.useRef(false);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || n === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = state.current;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let acc = 0;

    const pushClamped = (to: number) => {
      const limited = Math.max(
        Math.round(s.pos) - 3,
        Math.min(Math.round(s.pos) + 3, to)
      );
      startFollow(limited, reduce);
    };

    const settle = (bias = 0) => {
      const next =
        bias > 0
          ? Math.floor(s.target + 0.7)
          : bias < 0
            ? Math.ceil(s.target - 0.7)
            : Math.round(s.target);
      startFollow(next, reduce);
    };

    const onWheel = (e: WheelEvent) => {
      if (scrollMode !== "internal") return;
      e.preventDefault();
      const scale =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? root.clientHeight : 1;
      const d =
        (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * scale;
      if (reduce) {
        acc += d;
        while (Math.abs(acc) >= scrollPerCard) {
          const dir = Math.sign(acc);
          acc -= dir * scrollPerCard;
          pushClamped(s.target + dir);
        }
        return;
      }
      pushClamped(s.target + d / scrollPerCard);
      clearTimeout(idle);
      idle = setTimeout(() => settle(Math.sign(d)), 140);
    };

    let drag: {
      id: number;
      x: number;
      y: number;
      startX: number;
      startY: number;
      travel: number;
      last: number;
    } | null = null;

    const activeAxis: "x" | "y" | "none" =
      scrollMode === "internal" ? "y" : swipeAxis;

    const onDown = (e: PointerEvent) => {
      if (activeAxis === "none" || e.button !== 0) return;
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest("button, a")) return;
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
        travel: 0,
        last: 0,
      };
      dragged.current = false;
      clearTimeout(idle);
    };

    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id || activeAxis === "none") return;
      const dx = drag.x - e.clientX;
      const dy = drag.y - e.clientY;
      drag.x = e.clientX;
      drag.y = e.clientY;

      const delta = activeAxis === "x" ? dx : dy;
      const totalPrimary =
        activeAxis === "x"
          ? Math.abs(e.clientX - drag.startX)
          : Math.abs(e.clientY - drag.startY);
      const totalCross =
        activeAxis === "x"
          ? Math.abs(e.clientY - drag.startY)
          : Math.abs(e.clientX - drag.startX);

      // In horizontal swipe mode (mobile), yield to vertical page scroll
      if (activeAxis === "x" && !dragged.current && totalCross > totalPrimary && totalCross > 10) {
        drag = null;
        return;
      }

      drag.travel += Math.abs(delta);
      if (delta) drag.last = Math.sign(delta);

      if (drag.travel > 8 && !dragged.current) {
        dragged.current = true;
        try {
          root.setPointerCapture(e.pointerId);
        } catch {
          // Pointer capture may fail if pointer already released
        }
      }

      if (dragged.current && !reduce) {
        const denom = activeAxis === "x" ? Math.max(160, root.clientWidth * 0.55) : geo.current.h * 1.1;
        pushClamped(s.target + delta / denom);
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (dragged.current) {
        if (reduce) {
          startFollow(Math.round(s.target) + (drag.last || 0), true);
        } else {
          settle(drag.last);
        }
      }
      drag = null;
    };

    if (scrollMode === "internal") {
      root.addEventListener("wheel", onWheel, { passive: false });
    }
    if (activeAxis !== "none") {
      root.addEventListener("pointerdown", onDown);
      root.addEventListener("pointermove", onMove);
      root.addEventListener("pointerup", onUp);
      root.addEventListener("pointercancel", onUp);
    }

    paint();

    return () => {
      clearTimeout(idle);
      if (scrollMode === "internal") {
        root.removeEventListener("wheel", onWheel);
      }
      if (activeAxis !== "none") {
        root.removeEventListener("pointerdown", onDown);
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerup", onUp);
        root.removeEventListener("pointercancel", onUp);
      }
    };
  }, [n, scrollPerCard, scrollMode, swipeAxis, paint, startFollow]);

  const onKey = (e: React.KeyboardEvent) => {
    if (scrollMode !== "internal") return;
    if (
      e.key === "ArrowRight" ||
      e.key === "ArrowDown" ||
      e.key === " " ||
      e.key === "Enter"
    ) {
      e.preventDefault();
      startFollow(Math.round(state.current.target) + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      startFollow(Math.round(state.current.target) - 1);
    }
  };

  const handleCardActivate = (
    cardIdx: number,
    el: HTMLElement | null,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (dragged.current) return;

    if (scrollMode === "internal" && !onCardClickRef.current) {
      startFollow(Math.round(state.current.target) + 1);
      return;
    }

    if (cardIdx === lastActiveRef.current) {
      onCardClickRef.current?.(cardIdx, el);
    } else if (onSelectCardRef.current) {
      onSelectCardRef.current(cardIdx);
    } else {
      startFollow(cardIdx);
    }
  };

  const touchClass =
    scrollMode === "internal"
      ? "touch-none"
      : swipeAxis === "x"
        ? "touch-pan-y"
        : "touch-auto";

  return (
    <div
      ref={rootRef}
      data-testid={testId}
      data-deck-pos="0.000"
      data-active-index="0"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={scrollMode === "internal" ? 0 : undefined}
      onKeyDown={onKey}
      onClick={() => {
        if (scrollMode === "internal" && !dragged.current && !onCardClickRef.current) {
          startFollow(Math.round(state.current.target) + 1);
        }
      }}
      className={[
        "td-root relative w-full overflow-hidden outline-none select-none",
        touchClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        height,
        background,
        ["--td-shade-color" as string]: shadeColor,
        ...style,
      }}
    >
      <style>{`
        .td-scene { position: absolute; inset: 0; transform-style: preserve-3d; }
        .td-floor-line {
          position: absolute;
          left: 50%;
          top: calc(var(--td-top) + var(--td-h));
          width: min(92%, calc(var(--td-w) * 1.24));
          transform: translateX(-50%);
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(121, 43, 51, 0.24) 18%, rgba(121, 43, 51, 0.34) 50%, rgba(121, 43, 51, 0.24) 82%, transparent 100%);
          pointer-events: none;
        }
        .td-card {
          position: absolute; left: 50%; top: var(--td-top);
          width: var(--td-w); height: var(--td-h); margin-left: calc(var(--td-w) / -2);
          transform-origin: 50% 100%; transform-style: preserve-3d;
          backface-visibility: visible; will-change: transform, opacity;
          border-radius: 3px; overflow: hidden; cursor: pointer;
          background: #F3E9DE;
          box-shadow: 0 0 0 1px rgba(121, 43, 51, 0.28), 0 16px 38px rgba(121, 43, 51, 0.08);
        }
        .td-card img.td-card-img {
          display: block; width: 100%; height: 100%; max-width: none;
          object-fit: cover; object-position: 50% 0%; pointer-events: none;
        }
        .td-card::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: var(--td-shade-color, #000000); opacity: var(--td-shade, 0);
        }
        .td-root:focus-visible { box-shadow: inset 0 0 0 2px var(--color-accent, #792B33); }
      `}</style>

      {showFloorLine ? <div className="td-floor-line" aria-hidden="true" /> : null}

      <div ref={sceneRef} className="td-scene">
        {Array.from({ length: pool }, (_, j) => {
          const cardIdx = loop ? (slotCardIndices[j] ?? wrap(j, n)) : j;
          const card = cards[cardIdx];
          const isCurrent = cardIdx === activeIndex;

          return (
            <div
              key={j}
              ref={(el) => {
                cardRefs.current[j] = el;
              }}
              data-testid={!loop && card?.id ? `tumble-card-${card.id}` : undefined}
              data-card-index={cardIdx}
              onClick={(e) => handleCardActivate(cardIdx, e.currentTarget, e)}
              className="td-card"
            >
              {renderCard && card ? (
                renderCard(card, cardIdx, isCurrent)
              ) : (
                /* src/alt are set in paint() as the slot moves along the deck. */
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={(el) => {
                    imgRefs.current[j] = el;
                  }}
                  className="td-card-img"
                  alt={card?.alt ?? ""}
                  width={720}
                  height={Math.round(720 / aspect)}
                  draggable={false}
                  decoding="async"
                />
              )}
            </div>
          );
        })}
      </div>

      <span className="sr-only" aria-live="polite">
        {n} projects.
      </span>
    </div>
  );
}
