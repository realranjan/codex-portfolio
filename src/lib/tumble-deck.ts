/**
 * Pure 3D Tumble Deck physics and scroll choreography math.
 *
 * Keeps all pose calculations, floor-hinge fall curves, bounce kicks,
 * deck advance easing, and bounded scroll-to-deck mappings decoupled from DOM/React
 * so they can be deterministically verified via node:test.
 */

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Euclidean modulo: card k of an endless deck shows item wrap(k, n). */
export const wrap = (k: number, n: number): number =>
  n ? ((k % n) + n) % n : 0;

/**
 * Hinge angle (deg, CSS rotateX) of a card `t` of the way through its fall.
 * 0 stands upright, -90 lies flat towards the viewer. Gravity eases in, then
 * the card kicks once off the floor and settles.
 */
export function fallAngle(t: number): number {
  const u = clamp01(t);
  if (u === 0) return 0;
  const land = 0.78;
  if (u <= land) {
    const k = u / land;
    return -90 * k * k * k;
  }
  const k = (u - land) / (1 - land);
  return -90 + 6 * Math.sin(Math.PI * k) * (1 - k);
}

/** How far the deck has slid forward, in card gaps, at deck position `pos`. */
export function deckAdvance(pos: number): number {
  const i = Math.floor(pos);
  const f = pos - i;
  const k = clamp01((f - 0.28) / 0.6);
  return i + k * k * (3 - 2 * k);
}

export type Pose = {
  angle: number;
  z: number;
  lift: number;
  opacity: number;
  flat: boolean;
};

/**
 * Pose of virtual card `k` when the deck is at `pos` (card k is at the front
 * when pos = k). Both may run past the number of cards, and below zero.
 *
 * When `loop` is false and `cardCount` is provided, virtual indices outside
 * `[0, cardCount - 1]` are hidden (`opacity: 0`) so finite decks never duplicate cards.
 */
export function cardPose(
  k: number,
  pos: number,
  depth: number,
  options?: { loop?: boolean; cardCount?: number }
): Pose {
  const loop = options?.loop ?? true;
  const cardCount = options?.cardCount;

  if (!loop && typeof cardCount === "number" && (k < 0 || k >= cardCount)) {
    return { angle: 0, z: 0, lift: 0, opacity: 0, flat: false };
  }

  const t = pos - k;
  // Floor cards lie a hair apart, the newest highest. Relative to the front
  // index so the pile doesn't creep upward as the loop runs on.
  const lift = (k - Math.floor(pos) + 3) * 0.6;

  if (t >= 1) {
    // On the floor. Only the two latest show.
    return { angle: -90, z: 0, lift, opacity: t < 3 ? 1 : 0, flat: true };
  }
  if (t > 0) {
    return { angle: fallAngle(t), z: 0, lift, opacity: 1, flat: false };
  }
  const rel = k - deckAdvance(pos);
  const opacity = clamp01(depth + 1 - rel);
  return { angle: 0, z: rel > 0 ? -rel : 0, lift: 0, opacity, flat: false };
}

const EDGE_DWELL = 0.05;
const CARD_HOLD_RATIO = 0.14;

/**
 * Maps normalized ScrollTrigger progress `[0..1]` onto a continuous deck position
 * `[0 .. count - 1]` with gentle upright dwell at each card so visitors can read
 * every project before it tips forward onto the floor.
 */
export function computeTumbleScrollPosition(
  rawProgress: number,
  count: number
): number {
  if (count <= 1) return 0;
  const p = clamp01(rawProgress);
  const segments = count - 1;

  if (p <= EDGE_DWELL) return 0;
  if (p >= 1 - EDGE_DWELL) return segments;

  const span = 1 - EDGE_DWELL * 2;
  const scaled = ((p - EDGE_DWELL) / span) * segments;
  const segIndex = Math.min(segments - 1, Math.floor(scaled));
  const local = scaled - segIndex;

  // Hold briefly upright at the start of each segment, then smoothly tumble 0 -> 1
  if (local <= CARD_HOLD_RATIO) {
    return segIndex;
  }
  const fallT = (local - CARD_HOLD_RATIO) / (1 - CARD_HOLD_RATIO);
  return segIndex + clamp01(fallT);
}

/**
 * Returns the exact ScrollTrigger progress `[0..1]` that places project `index`
 * cleanly upright at the front of the deck (`pos === index`).
 */
export function getTumbleProjectAnchorProgress(
  index: number,
  count: number
): number {
  if (count <= 1) return 0;
  const clamped = Math.max(0, Math.min(count - 1, index));
  const segments = count - 1;

  if (clamped === 0) return EDGE_DWELL * 0.5;
  if (clamped === segments) return 1 - EDGE_DWELL * 0.5;

  const span = 1 - EDGE_DWELL * 2;
  // Place anchor right inside the upright hold window for that card
  const segStart = clamped / segments;
  const holdMid = (CARD_HOLD_RATIO * 0.45) / segments;
  return EDGE_DWELL + (segStart + holdMid) * span;
}

/**
 * Resolves which card index `[0..count-1]` is considered the active front project
 * for a given continuous deck position `pos`. Switches once the front card passes
 * the tipping midpoint (`0.55`).
 */
export function resolveTumbleActiveIndex(
  pos: number,
  count: number,
  loop = false
): number {
  if (count <= 0) return 0;
  const idx = Math.floor(pos + 0.45);
  if (loop) return wrap(idx, count);
  return Math.max(0, Math.min(count - 1, idx));
}
