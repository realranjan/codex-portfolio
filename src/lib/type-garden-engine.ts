/**
 * Pure Type Garden Botanical Typography Engine
 *
 * Faithful procedural port of Akshat Agarwal's Type Garden drawing & growth math:
 * - Organic curved stems (`vine`, `curl`, `cubicBezier`) weaving behind (`layer 0`)
 *   and in front (`layer 1`) of bold Playfair Display letterforms.
 * - Pointed veined leaves (`leaf`) with spring bloom physics.
 * - Multi-petal spiraled roses (`rose`) with interactive cursor lean & face-turn.
 * - Hand-drawn stop-motion frame boil (`jitter`).
 * - Wide, monumental centered typography layout with custom letter spacing.
 */

export type Vec2 = [number, number];

export interface WeaveSegment {
  u0: number;
  u1: number;
  layer: 0 | 1;
}

export interface ThornSpec {
  u: number;
  s: -1 | 1;
}

export interface GardenStemEl {
  t: "stem";
  id: number;
  pts: Vec2[];
  segs: WeaveSegment[];
  d0: number;
  dur: number;
  w: number;
  thorns: ThornSpec[];
}

export interface GardenLeafEl {
  t: "leaf";
  id: number;
  x: number;
  y: number;
  a: number;
  L: number;
  bend: number;
  layer: 0 | 1;
  d0: number;
}

export interface GardenRoseEl {
  t: "rose";
  id: number;
  x: number;
  y: number;
  R: number;
  rot: number;
  ph1: number;
  ph2: number;
  turns: number;
  layer: 0 | 1;
  d0: number;
}

export type GardenElement = GardenStemEl | GardenLeafEl | GardenRoseEl;

export interface GardenLetter {
  ch: string;
  id: number;
  ws: number;
  wi: number;
  /** Letter center X in canvas CSS px */
  x: number;
  /** Alphabetic baseline Y in canvas CSS px */
  y: number;
  /** Advance width (including optical stretch) in px */
  tw: number;
  /** Staggered birth offset in ms relative to phrase start */
  birthOffsetMs: number;
  /** Botanical elements grown from this letter */
  els: GardenElement[];
  /** Interactive cursor-lean vector [lx, ly] */
  lean: [number, number];
}

export interface WideCenteredLayoutResult {
  fontSize: number;
  baselineY: number;
  totalWidth: number;
  stretchX: number;
  letters: Array<{
    ch: string;
    x: number;
    y: number;
    tw: number;
    unitWidth: number;
  }>;
}

export interface WideLayoutOptions {
  /** Additional tracking between glyphs in em units (e.g. 0.32 for CURIOSITY) */
  letterSpacingEm: number;
  /** Extra space multiplier for whitespace characters */
  wordSpaceEm?: number;
  /** Horizontal optical stretch factor so Playfair Display reads wider & monumental */
  stretchX?: number;
  /** Target max width fraction of viewport width (default 0.90) */
  maxWidthRatio?: number;
  /** Cap font size in px */
  maxFontPx?: number;
  /** Floor font size in px */
  minFontPx?: number;
  /** Vertical center ratio (0.5 = exact vertical center) */
  centerYRatio?: number;
}

export function hash01(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

export function springEase(t: number, k = 7, w = 16): number {
  if (t <= 0) return 0;
  return 1 - Math.exp(-t * k) * Math.cos(t * w);
}

export function easeOutCubic(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(1 - t, 3);
}

export function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cubicBezier(a: Vec2, b: Vec2, c: Vec2, d: Vec2, n: number): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push([
      u * u * u * a[0] +
        3 * u * u * t * b[0] +
        3 * u * t * t * c[0] +
        t * t * t * d[0],
      u * u * u * a[1] +
        3 * u * u * t * b[1] +
        3 * u * t * t * c[1] +
        t * t * t * d[1],
    ]);
  }
  return pts;
}

export function samplePathAt(pts: readonly Vec2[], u: number): [Vec2, number] {
  const n = pts.length;
  const i = Math.min(n - 2, Math.max(1, Math.round(u * (n - 1))));
  const ang = Math.atan2(pts[i + 1][1] - pts[i - 1][1], pts[i + 1][0] - pts[i - 1][0]);
  return [pts[i], ang];
}

export function jitter(id: number, frame: number, amp: number): [number, number, number] {
  if (!amp) return [0, 0, 0];
  return [
    (hash01(id * 1.37 + frame * 7.13) * 2 - 1) * amp,
    (hash01(id * 2.71 + frame * 3.11) * 2 - 1) * amp,
    (hash01(id * 5.3 + frame * 1.7) * 2 - 1) * 0.035,
  ];
}

export function generateVine(
  base: Vec2,
  dir: number,
  len: number,
  amp: number,
  waves: number,
  ph: number,
  bend: number,
  n = 40
): Vec2[] {
  const pts: Vec2[] = [[base[0], base[1]]];
  const step = len / n;
  let x = base[0];
  let y = base[1];
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const a = dir + bend * u + amp * Math.sin(u * Math.PI * waves + ph) * Math.min(1, u * 3);
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
    pts.push([x, y]);
  }
  return pts;
}

export function appendCurl(pts: Vec2[], sign: -1 | 1, rad: number): Vec2[] {
  const n = pts.length;
  const end = pts[n - 1];
  const prev = pts[n - 2];
  const a = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
  const cx = end[0] - Math.sin(a) * sign * rad;
  const cy = end[1] + Math.cos(a) * sign * rad;
  const a0 = Math.atan2(end[1] - cy, end[0] - cx);
  for (let i = 1; i <= 14; i++) {
    const u = i / 14;
    const t = a0 + sign * u * Math.PI * 1.6;
    const rr = rad * (1 - 0.5 * u);
    pts.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]);
  }
  return pts;
}

export function buildWeaveSegments(r: () => number, startLayer: 0 | 1): WeaveSegment[] {
  const cuts: number[] = [];
  const nc = 1 + Math.floor(r() * 3);
  for (let i = 0; i < nc; i++) {
    cuts.push(0.15 + r() * 0.7);
  }
  cuts.sort((a, b) => a - b);

  const segs: WeaveSegment[] = [];
  let u0 = 0;
  let layer: 0 | 1 = startLayer;

  for (const c of cuts) {
    if (c <= u0) continue;
    segs.push({ u0, u1: c, layer });
    if (r() < 0.3) {
      const gap = 0.02 + r() * 0.03;
      u0 = Math.min(0.98, c + gap);
    } else {
      u0 = c;
    }
    layer = layer === 0 ? 1 : 0;
  }

  segs.push({ u0, u1: 1, layer });
  return segs;
}

export function layerAt(segs: readonly WeaveSegment[], u: number): 0 | 1 {
  for (const s of segs) {
    if (u >= s.u0 && u <= s.u1) return s.layer;
  }
  return segs[segs.length - 1]?.layer ?? 1;
}

/**
 * Computes monumental, widened, wide-tracked, centered letter positions
 * fitting strictly inside `canvasW * maxWidthRatio` with zero horizontal clipping.
 */
export function computeWideCenteredLayout(
  phrase: string,
  unitWidths: readonly number[],
  canvasW: number,
  canvasH: number,
  options: WideLayoutOptions
): WideCenteredLayoutResult {
  const chars = Array.from(phrase);
  const stretchX = options.stretchX ?? 1.1;
  const maxWidthRatio = options.maxWidthRatio ?? 0.9;
  const maxFontPx = options.maxFontPx ?? 186;
  const minFontPx = options.minFontPx ?? 24;
  const centerYRatio = options.centerYRatio ?? 0.505;
  const wordSpaceEm = options.wordSpaceEm ?? 0.42;

  // Compute total unit width at fontSize = 1
  const advances: number[] = [];
  let totalUnit = 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const baseUnit = unitWidths[i] ?? (ch === " " ? 0.32 : 0.68);
    const glyphW = ch === " " ? Math.max(baseUnit, wordSpaceEm) : baseUnit * stretchX;
    advances.push(glyphW);
    totalUnit += glyphW;
    if (i < chars.length - 1) {
      // Generous wide letter spacing between visible letters
      const nextCh = chars[i + 1];
      const gap =
        ch === " " || nextCh === " "
          ? options.letterSpacingEm * 0.55
          : options.letterSpacingEm;
      totalUnit += gap;
    }
  }

  const maxW = Math.max(120, canvasW * maxWidthRatio);
  const idealByWidth = totalUnit > 0 ? maxW / totalUnit : maxFontPx;
  const idealByHeight = canvasH * 0.25;
  const fontSize = Math.max(
    minFontPx,
    Math.min(maxFontPx, idealByWidth, idealByHeight)
  );

  const totalWidth = totalUnit * fontSize;
  let cursorX = (canvasW - totalWidth) / 2;
  const baselineY = canvasH * centerYRatio + fontSize * 0.34;

  const letters: WideCenteredLayoutResult["letters"] = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const tw = advances[i] * fontSize;
    letters.push({
      ch,
      x: cursorX + tw / 2,
      y: baselineY,
      tw,
      unitWidth: advances[i],
    });
    cursorX += tw;
    if (i < chars.length - 1) {
      const nextCh = chars[i + 1];
      const gap =
        ch === " " || nextCh === " "
          ? options.letterSpacingEm * 0.55
          : options.letterSpacingEm;
      cursorX += gap * fontSize;
    }
  }

  return {
    fontSize,
    baselineY,
    totalWidth,
    stretchX,
    letters,
  };
}

interface WordGrowthParams {
  roseP: number;
  leafy: number;
  dens: number;
  lean: number;
  big: number;
  curvy: number;
  bridgeP: number;
  w: number;
}

interface GrowBranchOptions {
  base?: Vec2;
  dir?: number;
  len?: number;
  pts?: Vec2[];
  d0: number;
  tip?: "rose" | "fan" | "leaf" | "curl" | null;
  depth?: number;
  layer0?: 0 | 1;
}

function createWordParams(ws: number, density: number): WordGrowthParams {
  const r = createRng(ws * 7 + 13);
  return {
    roseP: 0.34 + r() * 0.28,
    leafy: (0.65 + r() * 0.75) * density,
    dens: density,
    lean: (r() - 0.5) * 0.55,
    big: 0.88 + r() * 0.42,
    curvy: 0.8 + r() * 0.55,
    bridgeP: Math.min(0.92, (0.42 + r() * 0.32) * density),
    w: 0.65,
  };
}

function growBranch(
  r: () => number,
  elements: GardenElement[],
  nextId: () => number,
  p: WordGrowthParams,
  o: GrowBranchOptions
): Vec2[] {
  const tip =
    o.tip ??
    (r() < p.roseP ? "rose" : r() < 0.48 ? "fan" : r() < 0.64 ? "leaf" : "curl");

  let pts =
    o.pts ??
    generateVine(
      o.base ?? [0, 0],
      o.dir ?? -Math.PI / 2,
      o.len ?? 0.75,
      (0.34 + r() * 0.42) * p.curvy,
      1 + r() * 1.5,
      r() * 6.283,
      (r() - 0.5) * 1.15,
      40
    );

  if (tip === "curl") {
    pts = appendCurl(pts, r() < 0.5 ? -1 : 1, 0.05 + r() * 0.05);
  }

  const segs = buildWeaveSegments(r, o.layer0 != null ? o.layer0 : r() < 0.5 ? 0 : 1);
  const dur = Math.max(320, (o.len ?? 0.8) * 620);

  const thorns: ThornSpec[] = [];
  const nt = Math.floor(r() * 2.5);
  for (let i = 0; i < nt; i++) {
    thorns.push({ u: 0.15 + r() * 0.65, s: r() < 0.5 ? -1 : 1 });
  }

  elements.push({
    t: "stem",
    id: nextId(),
    pts,
    segs,
    d0: o.d0,
    dur,
    w: o.depth ? 0.82 : 1,
    thorns,
  });

  const nl = Math.floor(r() * 2.8 * p.leafy);
  let sd: -1 | 1 = r() < 0.5 ? -1 : 1;
  for (let i = 0; i < nl; i++) {
    const u = 0.25 + r() * 0.6;
    const [q, a] = samplePathAt(pts, u);
    sd = sd === 1 ? -1 : 1;
    elements.push({
      t: "leaf",
      id: nextId(),
      x: q[0],
      y: q[1],
      a: a + sd * (0.55 + r() * 0.5),
      L: (0.14 + r() * 0.2) * (o.depth ? 0.8 : 1),
      bend: (r() - 0.5) * 1.2,
      layer: layerAt(segs, u),
      d0: o.d0 + dur * u,
    });
  }

  const [tp, ta] = samplePathAt(pts, 1);
  const td = o.d0 + dur * 0.78;
  const tl = layerAt(segs, 1);

  if (tip === "rose") {
    const R = (0.13 + r() * 0.15) * p.big * (o.depth ? 0.76 : 1);
    // Keep bold letterforms legible: roses sitting over letter body tuck mostly behind
    const over = tp[1] > -0.78 && tp[1] < 0.06 && Math.abs(tp[0]) < p.w * 0.5;
    const layer: 0 | 1 = over ? (r() < 0.22 ? 1 : 0) : r() < 0.6 ? 1 : tl;

    elements.push({
      t: "rose",
      id: nextId(),
      x: tp[0],
      y: tp[1],
      R,
      rot: (r() - 0.5) * 1.0,
      ph1: r() * 6.283,
      ph2: r() * 6.283,
      turns: 1.8 + r() * 1.0,
      layer,
      d0: td,
    });

    if (r() < 0.22) {
      const oo = ta + (r() < 0.5 ? 1 : -1) * 1.3;
      elements.push({
        t: "rose",
        id: nextId(),
        x: tp[0] + Math.cos(oo) * R * 1.38,
        y: tp[1] + Math.sin(oo) * R * 1.38,
        R: R * (0.6 + r() * 0.3),
        rot: (r() - 0.5) * 1.2,
        ph1: r() * 6.283,
        ph2: r() * 6.283,
        turns: 1.8 + r(),
        layer,
        d0: td + 120,
      });
    }
  } else if (tip === "fan") {
    const spread = 0.6 + r() * 0.3;
    for (let j = 0; j < 2; j++) {
      elements.push({
        t: "leaf",
        id: nextId(),
        x: tp[0],
        y: tp[1],
        a: ta + (j - 0.5) * spread,
        L: 0.2 + r() * 0.18,
        bend: (j - 0.5) * 0.8,
        layer: tl,
        d0: td + j * 60,
      });
    }
  } else if (tip === "leaf") {
    elements.push({
      t: "leaf",
      id: nextId(),
      x: tp[0],
      y: tp[1],
      a: ta + (r() - 0.5) * 0.3,
      L: 0.16 + r() * 0.16,
      bend: r() - 0.5,
      layer: tl,
      d0: td,
    });
  }

  if (!o.depth && r() < 0.32) {
    const u = 0.35 + r() * 0.35;
    const [q, a] = samplePathAt(pts, u);
    growBranch(r, elements, nextId, p, {
      base: q,
      dir: a + (r() < 0.5 ? -1 : 1) * (0.7 + r() * 0.4),
      len: (o.len ?? 0.8) * (0.35 + r() * 0.2),
      d0: o.d0 + dur * u,
      depth: 1,
      layer0: layerAt(segs, u),
    });
  }

  return pts;
}

/**
 * Generates a deterministic Type Garden letter array with organic stems, leaves,
 * inter-letter bridges, curls, and multi-petal roses for a single-line Hero phrase.
 */
export function generateGardenPhrase(
  layout: WideCenteredLayoutResult,
  seed: number,
  density = 1.05,
  staggerMs = 78
): GardenLetter[] {
  const masterRng = createRng(seed * 7919 + 17);
  const result: GardenLetter[] = [];

  let wordSeed = Math.floor(masterRng() * 1e9);
  let wordIndex = 0;
  let prevLetter: GardenLetter | null = null;
  let idCounter = 1;

  for (let idx = 0; idx < layout.letters.length; idx++) {
    const item = layout.letters[idx];
    const id = idCounter++;

    if (item.ch === " ") {
      const spaceLetter: GardenLetter = {
        ch: " ",
        id,
        ws: 0,
        wi: 0,
        x: item.x,
        y: item.y,
        tw: item.tw,
        birthOffsetMs: idx * staggerMs,
        els: [],
        lean: [0, 0],
      };
      result.push(spaceLetter);
      prevLetter = spaceLetter;
      wordSeed = Math.floor(masterRng() * 1e9);
      wordIndex = 0;
      continue;
    }

    const sameWord = Boolean(prevLetter && prevLetter.ch !== " ");
    const ws = sameWord && prevLetter ? prevLetter.ws : wordSeed;
    const wi = sameWord && prevLetter ? prevLetter.wi + 1 : 0;

    const r = createRng(
      (ws ^ Math.imul(wi + 1, 2654435761)) + Math.floor(masterRng() * 1e6)
    );
    const params = createWordParams(ws, density);
    const elements: GardenElement[] = [];
    let elCounter = 0;
    const nextId = () => id * 100 + elCounter++;

    const w = item.unitWidth;
    params.w = w;
    const inX = () => (r() - 0.5) * w * 0.65;

    // 1. Primary upward stems (first & outer letters always get signature blooming roses)
    const isOuterLetter =
      idx === 0 ||
      idx === 1 ||
      idx === layout.letters.length - 1 ||
      idx === layout.letters.length - 2;
    const nUp = 1 + (r() < 0.48 * params.dens ? 1 : 0);
    for (let i = 0; i < nUp; i++) {
      growBranch(r, elements, nextId, params, {
        base: [inX(), -r() * 0.34],
        dir: -Math.PI / 2 + params.lean * 0.48 + (r() - 0.5) * 0.72,
        len: 0.58 + r() * 0.48,
        d0: 40 + i * 125,
        tip: (wi === 0 || isOuterLetter) && i === 0 ? "rose" : null,
      });
    }

    // 2. Occasional downward root / hanging stem
    if (r() < 0.42 * params.dens) {
      growBranch(r, elements, nextId, params, {
        base: [inX(), -0.08 - r() * 0.32],
        dir: Math.PI / 2 + (r() - 0.5) * 0.8,
        len: 0.34 + r() * 0.34,
        d0: 150,
      });
    }

    // 3. Bridging vine connecting adjacent letters within a word
    if (sameWord && prevLetter && r() < params.bridgeP) {
      const dxPx = prevLetter.x - item.x;
      const px = dxPx / Math.max(1, layout.fontSize);
      const a: Vec2 = [inX(), -0.06 - r() * 0.54];
      const b: Vec2 = [px + (r() - 0.5) * 0.22, -0.06 - r() * 0.54];
      const bulge = (r() < 0.55 ? -1 : 1) * (0.38 + r() * 0.38);
      const dx = b[0] - a[0];
      let bridgePts = cubicBezier(
        a,
        [a[0] + dx * 0.16, a[1] + bulge],
        [b[0] - dx * 0.16, b[1] + bulge * 0.9],
        b,
        40
      );
      if (r() < 0.42) {
        bridgePts = bridgePts.slice(0, Math.floor(bridgePts.length * (0.7 + r() * 0.2)));
      }
      growBranch(r, elements, nextId, params, {
        pts: bridgePts,
        len: Math.abs(dx) + Math.abs(bulge),
        d0: 95,
        tip: r() < 0.45 ? "curl" : r() < 0.5 ? "leaf" : "rose",
      });
    }

    // 4. Opening leftward-upward tendril curl on first letter of each word (stays inside viewport margin)
    if (wi === 0) {
      growBranch(r, elements, nextId, params, {
        base: [-w * 0.24, -0.22 - r() * 0.36],
        dir: -Math.PI * 0.72 + (r() - 0.5) * 0.45,
        len: 0.34 + r() * 0.18,
        d0: 115,
        tip: "curl",
      });
    }

    // 5. Closing rightward-upward bloom on last letter of phrase (stays inside viewport margin)
    if (idx === layout.letters.length - 1) {
      growBranch(r, elements, nextId, params, {
        base: [w * 0.22, -0.24 - r() * 0.34],
        dir: -Math.PI * 0.28 + (r() - 0.5) * 0.45,
        len: 0.34 + r() * 0.18,
        d0: 130,
        tip: "rose",
      });
    }

    const letter: GardenLetter = {
      ch: item.ch,
      id,
      ws,
      wi,
      x: item.x,
      y: item.y,
      tw: item.tw,
      birthOffsetMs: idx * staggerMs,
      els: elements,
      lean: [0, 0],
    };

    result.push(letter);
    prevLetter = letter;
    wordIndex = wi + 1;
  }

  void wordIndex;
  return result;
}
