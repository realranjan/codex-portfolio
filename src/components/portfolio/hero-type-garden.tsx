"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { HeroStoryScrollState } from "@/lib/motion";
import {
  computeWideCenteredLayout,
  easeOutCubic,
  generateGardenPhrase,
  jitter,
  samplePathAt,
  springEase,
  type GardenLetter,
  type Vec2,
  type WideCenteredLayoutResult,
} from "@/lib/type-garden-engine";

interface HeroTypeGardenProps {
  storyRef: RefObject<HeroStoryScrollState>;
}

interface GardenPhraseInstance {
  phrase: string;
  layout: WideCenteredLayoutResult;
  letters: GardenLetter[];
  /** Word index per character for Beat 2 word-by-word rise */
  wordIndices: number[];
}

interface Butterfly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t0: number;
  life: number;
  ph: number;
  size: number;
}

/**
 * Harmonized Japanese Ukiyo-e x Type Garden "Paper" palette:
 * - Warm Ivory page ground (#F3E9DE)
 * - Deep Burgundy bold Playfair Display letterforms (#792B33)
 * - Indigo ink weaving stems & veined leaves (#223A78)
 * - Vermilion-crimson spiraled roses (#D92A21) with soft blush spiral highlights (#FFD4C8)
 */
const GARDEN_PALETTE = {
  text: "#792B33",
  stem: "#223A78",
  vein: "#F3E9DE",
  rose: "#D92A21",
  line: "#FFD4C8",
  butterflyWing: "#D92A21",
  butterflyAccent: "#FFD4C8",
  butterflyBody: "#223A78",
} as const;

function mapWordIndices(phrase: string): number[] {
  let wordIdx = 0;
  let inWord = false;
  return Array.from(phrase).map((ch) => {
    if (ch === " ") {
      if (inWord) {
        wordIdx++;
        inWord = false;
      }
      return wordIdx;
    }
    inWord = true;
    return wordIdx;
  });
}

function drawSmoothPath(ctx: CanvasRenderingContext2D, pts: readonly Vec2[]): void {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    ctx.quadraticCurveTo(
      pts[i][0],
      pts[i][1],
      (pts[i][0] + pts[i + 1][0]) * 0.5,
      (pts[i][1] + pts[i + 1][1]) * 0.5
    );
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], last[1]);
}

function strokeStemRange(
  ctx: CanvasRenderingContext2D,
  pts: readonly Vec2[],
  u0: number,
  u1: number,
  width: number,
  color: string
): void {
  const n = pts.length - 1;
  if (n < 1) return;
  const f0 = Math.max(0, u0) * n;
  const f1 = Math.min(1, u1) * n;
  if (f1 <= f0 + 1e-4) return;

  const i0 = Math.floor(f0);
  const i1 = Math.min(n - 1, Math.floor(f1));
  const lerpPt = (i: number, f: number): Vec2 => [
    pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f,
    pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f,
  ];

  const sub: Vec2[] = [lerpPt(i0, f0 - i0)];
  for (let i = i0 + 1; i <= i1; i++) {
    sub.push(pts[i]);
  }
  sub.push(lerpPt(i1, f1 - i1));

  drawSmoothPath(ctx, sub);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

function drawThorn(
  ctx: CanvasRenderingContext2D,
  pts: readonly Vec2[],
  u: number,
  side: -1 | 1,
  scale: number,
  color: string
): void {
  const [p, a] = samplePathAt(pts, u);
  const L = 7.5 * scale;
  const w = 3.2 * scale;
  const na = a + (side * Math.PI) / 2;
  ctx.beginPath();
  ctx.moveTo(p[0] - Math.cos(a) * w, p[1] - Math.sin(a) * w);
  ctx.quadraticCurveTo(
    p[0] + Math.cos(na) * L * 0.65,
    p[1] + Math.sin(na) * L * 0.65,
    p[0] + Math.cos(na) * L - Math.cos(a) * w * 0.45,
    p[1] + Math.sin(na) * L - Math.sin(a) * w * 0.45
  );
  ctx.lineTo(p[0] + Math.cos(a) * w, p[1] + Math.sin(a) * w);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  bend: number,
  scale: number,
  leafColor: string,
  veinColor: string
): void {
  if (scale <= 0.01) return;
  const L = length * scale;
  const W = L * 0.36;
  const tipY = bend * L * 0.24;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(L * 0.25, -W + tipY * 0.3, L * 0.72, -W * 0.78 + tipY * 0.7, L, tipY);
  ctx.bezierCurveTo(L * 0.72, W * 0.78 + tipY * 0.7, L * 0.25, W + tipY * 0.3, 0, 0);
  ctx.closePath();
  ctx.fillStyle = leafColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(L * 0.08, 0);
  ctx.quadraticCurveTo(L * 0.5, tipY * 0.5, L * 0.86, tipY * 0.9);
  ctx.strokeStyle = veinColor;
  ctx.globalAlpha *= 0.85;
  ctx.lineWidth = Math.max(0.85, L * 0.048);
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.restore();
}

function drawRose(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rot: number,
  ph1: number,
  ph2: number,
  turns: number,
  scale: number,
  face: Vec2,
  roseColor: string,
  lineColor: string
): void {
  const R = radius * scale;
  if (R < 0.8) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  // Outer multi-lobe rose silhouette (6-petal organic wave + secondary harmonic)
  const N = 64;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    const rad = R * (0.9 + 0.1 * Math.sin(6 * t + ph1) + 0.045 * Math.cos(3 * t + ph2));
    const px = Math.cos(t) * rad;
    const py = Math.sin(t) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = roseColor;
  ctx.fill();

  // Inner spiraled petals turning gently toward cursor (`face`)
  const fx = face[0] * R * 0.18;
  const fy = face[1] * R * 0.18;
  const S = 52;
  ctx.beginPath();
  for (let i = 0; i <= S; i++) {
    const u = i / S;
    const t = u * turns * Math.PI * 2;
    const rad = R * 0.72 * u * (1 + 0.08 * Math.sin(5 * t + ph1));
    const px = fx * (1 - u) + Math.cos(t) * rad;
    const py = fy * (1 - u) + Math.sin(t) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = Math.max(1.05, R * 0.068);
  ctx.lineCap = "round";
  ctx.stroke();

  // Delicate outer petal contour highlights
  for (let k = 0; k < 3; k++) {
    const a0 = k * 2.1 + ph2;
    const a1 = a0 + 1.05;
    ctx.beginPath();
    ctx.arc(fx * 0.35, fy * 0.35, R * 0.8, a0, a1);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = Math.max(0.85, R * 0.045);
    ctx.globalAlpha *= 0.65;
    ctx.stroke();
  }

  ctx.restore();
}

function drawButterfly(ctx: CanvasRenderingContext2D, b: Butterfly, now: number): void {
  const age = (now - b.t0) / b.life;
  if (age >= 1) return;
  const fade = age < 0.12 ? age / 0.12 : age > 0.82 ? (1 - age) / 0.18 : 1;
  const flap = 0.25 + 0.75 * Math.abs(Math.sin(now * 0.022 + b.ph));
  const heading = Math.atan2(b.vy, b.vx) + Math.PI / 2;
  const s = b.size;

  ctx.save();
  ctx.globalAlpha *= fade;
  ctx.translate(b.x, b.y);
  ctx.rotate(heading);

  for (const side of [-1, 1] as const) {
    ctx.save();
    ctx.scale(side * flap, 1);
    ctx.fillStyle = GARDEN_PALETTE.butterflyWing;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.1);
    ctx.bezierCurveTo(s * 0.7, -s * 0.9, s * 1.15, -s * 0.2, s * 0.4, s * 0.2);
    ctx.bezierCurveTo(s * 0.9, s * 0.55, s * 0.55, s * 1.0, 0, s * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = GARDEN_PALETTE.butterflyAccent;
    ctx.beginPath();
    ctx.arc(s * 0.46, -s * 0.22, s * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = GARDEN_PALETTE.butterflyBody;
  ctx.lineWidth = Math.max(1.2, s * 0.12);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.45);
  ctx.lineTo(0, s * 0.55);
  ctx.stroke();

  ctx.restore();
}

/**
 * Interactive Type Garden living botanical canvas for Hero Beat 1 ("CURIOSITY")
 * and Beat 2 ("KILLED THE CAT.") rendered strictly in bold Playfair Display (`700`)
 * behind the 3D samurai cat sculpture.
 */
export function HeroTypeGarden({ storyRef }: HeroTypeGardenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fontProbeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 1;
    let H = 1;
    let resolvedFontFamily = '"Playfair Display", Georgia, serif';
    let curiosityPhrase: GardenPhraseInstance | null = null;
    let killedPhrase: GardenPhraseInstance | null = null;
    let disposed = false;
    let rafId: number | null = null;

    const mountTime = performance.now();
    let killedBloomStart: number | null = null;
    let wasKilledVisible = false;

    const mouse = { x: -9999, y: -9999, active: false };
    const butterflies: Butterfly[] = [];

    const resolvePlayfairFamily = (): string => {
      const probe = fontProbeRef.current;
      if (probe) {
        const computed = window.getComputedStyle(probe).fontFamily;
        if (computed && computed.trim().length > 0) {
          return computed;
        }
      }
      return '"Playfair Display", Georgia, serif';
    };

    const measureUnitWidths = (phrase: string, fontFamily: string): number[] => {
      const probeSize = 100;
      ctx.save();
      ctx.font = `700 ${probeSize}px ${fontFamily}`;
      const widths = Array.from(phrase).map((ch) => {
        const w = ctx.measureText(ch).width / probeSize;
        return Number.isFinite(w) && w > 0 ? w : ch === " " ? 0.34 : 0.68;
      });
      ctx.restore();
      return widths;
    };

    const rebuildPhrases = () => {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(320, rect.width || window.innerWidth);
      H = Math.max(360, rect.height || window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      const targetW = Math.round(W * dpr);
      const targetH = Math.round(H * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const isCompact = W < 640;
      const isTablet = W >= 640 && W < 1024;

      // Beat 1: CURIOSITY — huge, widened, wide-tracked, dead center behind the 3D samurai cat
      // Keeps generous side breathing room (0.85 ratio) so outer roses & curls never clip at edges
      const curiosityText = "CURIOSITY";
      const curiosityUnits = measureUnitWidths(curiosityText, resolvedFontFamily);
      const curiosityLayout = computeWideCenteredLayout(curiosityText, curiosityUnits, W, H, {
        letterSpacingEm: isCompact ? 0.14 : isTablet ? 0.2 : 0.26,
        stretchX: isCompact ? 1.05 : 1.12,
        maxWidthRatio: isCompact ? 0.88 : isTablet ? 0.86 : 0.85,
        maxFontPx: isCompact ? 64 : 186,
        minFontPx: 28,
        centerYRatio: 0.505,
      });
      curiosityPhrase = {
        phrase: curiosityText,
        layout: curiosityLayout,
        letters: generateGardenPhrase(curiosityLayout, 4217, 1.06, 72),
        wordIndices: mapWordIndices(curiosityText),
      };

      // Beat 2: KILLED THE CAT. — huge, widened, wide-tracked, dead center behind the 3D samurai cat
      const killedText = "KILLED THE CAT.";
      const killedUnits = measureUnitWidths(killedText, resolvedFontFamily);
      const killedLayout = computeWideCenteredLayout(killedText, killedUnits, W, H, {
        letterSpacingEm: isCompact ? 0.08 : isTablet ? 0.13 : 0.17,
        wordSpaceEm: isCompact ? 0.38 : 0.54,
        stretchX: isCompact ? 1.03 : 1.07,
        maxWidthRatio: isCompact ? 0.88 : isTablet ? 0.86 : 0.86,
        maxFontPx: isCompact ? 40 : 120,
        minFontPx: 19,
        centerYRatio: 0.505,
      });
      killedPhrase = {
        phrase: killedText,
        layout: killedLayout,
        letters: generateGardenPhrase(killedLayout, 9183, 1.04, 52),
        wordIndices: mapWordIndices(killedText),
      };

      canvas.dataset.gardenFont = resolvedFontFamily;
      canvas.dataset.gardenSize = String(Math.round(curiosityLayout.fontSize));
      canvas.dataset.gardenKilledSize = String(Math.round(killedLayout.fontSize));
    };

    const warpPoint = (
      p: Vec2,
      lt: GardenLetter,
      fs: number,
      now: number,
      ageMs: number,
      yOffsetPx: number,
      swayAmp: number
    ): Vec2 => {
      const h = Math.max(0, -p[1]);
      const br = reducedMotion ? 0 : Math.sin(now * 0.0014 + lt.id * 1.1) * swayAmp * 1.25;
      const bth = reducedMotion
        ? 0
        : Math.exp(-ageMs / 650) * Math.sin(ageMs * 0.014 + lt.id) * 6.5;
      const lx = lt.lean[0] * (0.4 + h * 1.35);
      const ly = lt.lean[1] * (0.3 + h * 1.1);
      return [
        lt.x + p[0] * fs + (bth + br) * (0.25 + h) + lx,
        lt.y + yOffsetPx + p[1] * fs + ly,
      ];
    };

    const updateLetterLeans = (
      letters: readonly GardenLetter[],
      fs: number,
      dtSec: number
    ) => {
      const lerpFactor = Math.min(1, dtSec * 8);
      for (const lt of letters) {
        if (lt.ch === " ") continue;
        let tx = 0;
        let ty = 0;
        if (mouse.active && !reducedMotion) {
          const dx = mouse.x - lt.x;
          const dy = mouse.y - (lt.y - fs * 0.42);
          const dist = Math.hypot(dx, dy);
          const radius = fs * 2.4;
          if (dist < radius && dist > 1) {
            const pull = Math.pow(1 - dist / radius, 1.8) * fs * 0.16;
            tx = (dx / dist) * pull;
            ty = (dy / dist) * pull * 0.65;
          }
        }
        lt.lean[0] += (tx - lt.lean[0]) * lerpFactor;
        lt.lean[1] += (ty - lt.lean[1]) * lerpFactor;
      }
    };

    const renderPhrase = (
      inst: GardenPhraseInstance,
      now: number,
      elapsedBaseMs: number,
      opacity: number,
      slotOffsetY: number,
      clipTopPct: number,
      wordYPercent?: readonly number[]
    ) => {
      if (opacity <= 0.005) return;

      const { fontSize: fs, stretchX } = inst.layout;
      const frame = reducedMotion ? 0 : Math.floor(now / 120);
      const boilAmp = reducedMotion ? 0 : 0.72;
      const swayAmp = reducedMotion ? 0 : 1.05;
      const stemWidthBase = Math.max(1.85, fs * 0.025);

      ctx.save();
      ctx.globalAlpha = opacity;

      if (clipTopPct > 0.05) {
        const clipY = (clipTopPct / 100) * H;
        ctx.beginPath();
        ctx.rect(0, clipY, W, H - clipY);
        ctx.clip();
      }

      const getLetterOffsetY = (index: number): number => {
        if (!wordYPercent) return slotOffsetY;
        const wIdx = inst.wordIndices[index] ?? 0;
        const yPct = wordYPercent[wIdx] ?? 0;
        return slotOffsetY + (yPct / 100) * fs * 0.88;
      };

      const drawBotanicalLayer = (targetLayer: 0 | 1) => {
        for (let idx = 0; idx < inst.letters.length; idx++) {
          const lt = inst.letters[idx];
          if (lt.ch === " ") continue;

          const age = elapsedBaseMs - lt.birthOffsetMs;
          if (age < 0) continue;

          const yOff = getLetterOffsetY(idx);

          for (const el of lt.els) {
            const t = age - el.d0;
            if (t <= 0) continue;

            if (el.t === "stem") {
              const p = easeOutCubic(Math.min(1, t / el.dur));
              const wpts = el.pts.map((pt) => warpPoint(pt, lt, fs, now, age, yOff, swayAmp));

              for (const seg of el.segs) {
                if (seg.layer !== targetLayer) continue;
                const u1 = Math.min(p, seg.u1);
                if (u1 <= seg.u0) continue;
                const [jx, jy] = jitter(el.id + seg.u0 * 10, frame, boilAmp);
                ctx.save();
                ctx.translate(jx, jy);
                strokeStemRange(
                  ctx,
                  wpts,
                  seg.u0,
                  u1,
                  stemWidthBase * el.w,
                  GARDEN_PALETTE.stem
                );
                ctx.restore();
              }

              for (const th of el.thorns) {
                if (p < th.u) continue;
                let thLayer: 0 | 1 = 1;
                for (const seg of el.segs) {
                  if (th.u >= seg.u0 && th.u <= seg.u1) {
                    thLayer = seg.layer;
                    break;
                  }
                }
                if (thLayer !== targetLayer) continue;
                const ts = Math.min(1, (p - th.u) / 0.14);
                drawThorn(ctx, wpts, th.u, th.s, ts * (fs / 150), GARDEN_PALETTE.stem);
              }
            } else if (el.t === "leaf") {
              if (el.layer !== targetLayer) continue;
              const s = springEase(Math.min(1, t / 440), 7.5, 13);
              if (s <= 0.01) continue;
              const pt = warpPoint([el.x, el.y], lt, fs, now, age, yOff, swayAmp);
              const [jx, jy, jr] = jitter(el.id, frame, boilAmp);
              drawLeaf(
                ctx,
                pt[0] + jx,
                pt[1] + jy,
                el.a + jr,
                el.L * fs,
                el.bend,
                s,
                GARDEN_PALETTE.stem,
                GARDEN_PALETTE.vein
              );
            } else if (el.t === "rose") {
              if (el.layer !== targetLayer) continue;
              const s = springEase(Math.min(1, t / 600), 6.2, 14);
              if (s <= 0.01) continue;
              const pt = warpPoint([el.x, el.y], lt, fs, now, age, yOff, swayAmp);
              const [jx, jy, jr] = jitter(el.id, frame, boilAmp);
              const face: Vec2 = [0, 0];
              if (mouse.active && !reducedMotion) {
                const dx = mouse.x - pt[0];
                const dy = mouse.y - pt[1];
                const dist = Math.hypot(dx, dy);
                if (dist > 1 && dist < fs * 3.2) {
                  const strength = 1 - dist / (fs * 3.2);
                  face[0] = (dx / dist) * strength;
                  face[1] = (dy / dist) * strength;
                }
              }
              drawRose(
                ctx,
                pt[0] + jx,
                pt[1] + jy,
                el.R * fs,
                el.rot + jr,
                el.ph1,
                el.ph2,
                el.turns,
                s,
                face,
                GARDEN_PALETTE.rose,
                GARDEN_PALETTE.line
              );
            }
          }
        }
      };

      // Layer 0: Botanical stems, veined leaves & roses weaving BEHIND letters
      drawBotanicalLayer(0);

      // Middle Layer: Bold widened Playfair Display letterforms
      ctx.font = `700 ${fs}px ${resolvedFontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = GARDEN_PALETTE.text;

      for (let idx = 0; idx < inst.letters.length; idx++) {
        const lt = inst.letters[idx];
        if (lt.ch === " ") continue;

        const age = elapsedBaseMs - lt.birthOffsetMs;
        if (age < -40) continue;

        const yOff = getLetterOffsetY(idx);
        const letterFade = reducedMotion ? 1 : Math.min(1, Math.max(0, (age + 40) / 260));
        const letterRise = reducedMotion ? 0 : (1 - easeOutCubic(letterFade)) * 16;

        ctx.save();
        ctx.globalAlpha = opacity * letterFade;
        ctx.translate(lt.x, lt.y + yOff + letterRise);
        ctx.scale(stretchX, 1);
        ctx.fillText(lt.ch, 0, 0);
        ctx.restore();
      }

      // Layer 1: Botanical stems, veined leaves & roses weaving IN FRONT of letters
      drawBotanicalLayer(1);

      ctx.restore();
    };

    let lastTime = performance.now();

    const drawFrame = (now: number) => {
      rafId = null;
      if (disposed) return;

      const dtSec = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      // Pause automatically when scrolled well past the Hero runway or hidden tab
      const isOffscreen =
        document.hidden || window.scrollY > window.innerHeight * 3.6;
      if (isOffscreen) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const story = storyRef.current;
      canvas.dataset.gardenBeat = story.activeBeat;

      // Beat 1: CURIOSITY
      if (curiosityPhrase && story.curiosity.visible && story.curiosity.opacity > 0.005) {
        updateLetterLeans(curiosityPhrase.letters, curiosityPhrase.layout.fontSize, dtSec);
        const elapsedCuriosity = reducedMotion ? 3000 : now - mountTime + 120;
        renderPhrase(
          curiosityPhrase,
          now,
          elapsedCuriosity,
          story.curiosity.opacity,
          story.curiosity.y,
          story.curiosity.clipTopPct
        );
      }

      // Beat 2: KILLED THE CAT.
      const killedVisible = Boolean(
        killedPhrase && story.killed.visible && story.killed.opacity > 0.005
      );
      if (killedVisible && killedPhrase) {
        if (!wasKilledVisible) {
          killedBloomStart = now;
        }
        wasKilledVisible = true;

        updateLetterLeans(killedPhrase.letters, killedPhrase.layout.fontSize, dtSec);

        // Combine time-based spring growth with scroll reveal floor so both smooth scrolling
        // and instantaneous scrollbar jumps show blooming Type Garden stems and roses.
        const maxWordSettled =
          1 -
          Math.min(
            1,
            Math.max(0, (story.killed.wordYPercent[2] ?? 0) / 115)
          );
        const timeAge = killedBloomStart !== null ? now - killedBloomStart : 0;
        const scrollAgeFloor = maxWordSettled * 1850;
        const elapsedKilled = reducedMotion
          ? 3000
          : Math.max(timeAge + 140, scrollAgeFloor);

        renderPhrase(
          killedPhrase,
          now,
          elapsedKilled,
          story.killed.opacity,
          story.killed.y,
          0,
          story.killed.wordYPercent
        );
      } else {
        wasKilledVisible = false;
        killedBloomStart = null;
      }

      // Interactive fluttering butterflies (summoned on hero click)
      for (let i = butterflies.length - 1; i >= 0; i--) {
        const b = butterflies[i];
        if (now - b.t0 >= b.life) {
          butterflies.splice(i, 1);
          continue;
        }
        const tx = mouse.active ? mouse.x : W * 0.5 + Math.cos(now * 0.001 + b.ph) * 260;
        const ty = mouse.active ? mouse.y - 36 : H * 0.42 + Math.sin(now * 0.0013 + b.ph) * 110;
        b.vx += (tx - b.x) * 0.0022;
        b.vy += (ty - b.y) * 0.0022 - 0.025;
        b.vx *= 0.965;
        b.vy *= 0.965;
        b.x += b.vx;
        b.y += b.vy;
        drawButterfly(ctx, b, now);
      }

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    const startLoop = () => {
      if (disposed || rafId !== null) return;
      if (document.hidden || window.scrollY > window.innerHeight * 3.6) return;
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(drawFrame);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
      } else {
        mouse.active = false;
      }
    };

    const handlePointerLeave = () => {
      mouse.active = false;
    };

    const handleHeroClick = (e: MouseEvent) => {
      if (reducedMotion || window.scrollY > window.innerHeight * 2.2) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest("a, button, nav, [role='dialog']")) return;
      const rect = canvas.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;
      if (butterflies.length < 5) {
        butterflies.push({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          vx: (Math.random() - 0.5) * 3.2,
          vy: -1.6 - Math.random() * 1.4,
          t0: performance.now(),
          life: 6200,
          ph: Math.random() * Math.PI * 2,
          size: 9 + Math.random() * 4,
        });
      }
    };

    const handleScrollOrVisibility = () => {
      if (reducedMotion) {
        drawFrame(performance.now());
      } else {
        startLoop();
      }
    };

    const handleResize = () => {
      resolvedFontFamily = resolvePlayfairFamily();
      rebuildPhrases();
      drawFrame(performance.now());
    };

    // Initial font resolution + wait for Playfair Display Bold to be loaded in document.fonts
    resolvedFontFamily = resolvePlayfairFamily();
    rebuildPhrases();
    drawFrame(performance.now());
    if (!reducedMotion) {
      startLoop();
    }

    let fontReadyCancelled = false;
    if (typeof document !== "undefined" && "fonts" in document) {
      const primaryFamily = resolvedFontFamily.split(",")[0]?.trim() || '"Playfair Display"';
      Promise.allSettled([
        document.fonts.load(`700 120px ${primaryFamily}`),
        document.fonts.ready,
      ]).then(() => {
        if (fontReadyCancelled || disposed) return;
        resolvedFontFamily = resolvePlayfairFamily();
        rebuildPhrases();
        drawFrame(performance.now());
      });
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    window.addEventListener("click", handleHeroClick, { passive: true });
    window.addEventListener("scroll", handleScrollOrVisibility, { passive: true });
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleScrollOrVisibility);

    return () => {
      fontReadyCancelled = true;
      disposed = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("click", handleHeroClick);
      window.removeEventListener("scroll", handleScrollOrVisibility);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleScrollOrVisibility);
    };
  }, [storyRef]);

  return (
    <>
      {/* Hidden font-resolution probe so canvas ctx.font binds to Next.js loaded Playfair Display Bold */}
      <span
        ref={fontProbeRef}
        aria-hidden="true"
        className="sr-only"
        style={{
          fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
          fontWeight: 700,
        }}
      >
        CURIOSITY KILLED THE CAT.
      </span>

      <canvas
        ref={canvasRef}
        data-testid="hero-type-garden-canvas"
        aria-hidden="true"
        className="pointer-events-none block h-full w-full"
      />
    </>
  );
}
