"use client";

import React from "react";
import { TegakiRenderer } from "tegaki/react";
import kleeOne from "tegaki/fonts/klee-one";
import suezOne from "tegaki/fonts/suez-one";
import { selectJapaneseLoaderStage } from "@/lib/hero-portal";

/**
 * Next.js-safe Tegaki font bundles pointing explicitly to statically served
 * `/fonts/tegaki/*.ttf` assets so fonts load reliably across dev and production.
 */
const SUEZ_ONE_FONT = {
  ...suezOne,
  fontUrl: "/fonts/tegaki/suez-one.ttf",
  fullFontUrl: "/fonts/tegaki/suez-one.ttf",
  fontFaceCSS: `@font-face { font-family: '${suezOne.family}'; src: url('/fonts/tegaki/suez-one.ttf') format('truetype'); } @font-face { font-family: '${suezOne.fullFamily}'; src: url('/fonts/tegaki/suez-one.ttf') format('truetype'); }`,
};

const KLEE_ONE_FONT = {
  ...kleeOne,
  fontUrl: "/fonts/tegaki/klee-one-d192e144.ttf",
  fullFontUrl: "/fonts/tegaki/klee-one-d192e144.ttf",
  fontFaceCSS: `@font-face { font-family: '${kleeOne.family}'; src: url('/fonts/tegaki/klee-one-d192e144.ttf') format('truetype'); } @font-face { font-family: '${kleeOne.fullFamily}'; src: url('/fonts/tegaki/klee-one-d192e144.ttf') format('truetype'); }`,
};

// Module-level stable option objects so parent re-renders NEVER reset Tegaki timelines
const YIN_TIME = { mode: "uncontrolled" as const, speed: 1.45, delay: 0.08 };
const YANG_TIME = { mode: "uncontrolled" as const, speed: 1.45, delay: 0.24 };
const LOADER_TIME = { mode: "uncontrolled" as const, speed: 1.65, loop: false };
const SUEZ_QUALITY = { clipText: 1.35, smoothing: true };
const KLEE_QUALITY = { smoothing: true };

export interface TegakiYinYangLabelProps {
  word: "YIN" | "YANG";
  kanji: "陰" | "陽";
  align: "left" | "right";
}

/**
 * Flanking YIN / YANG calligraphic display mark powered by `tegaki` (`suez-one`).
 * Memoized so high-frequency progress updates never restart the stroke animation.
 */
export const TegakiYinYangLabel = React.memo(function TegakiYinYangLabel({
  word,
  kanji,
  align,
}: TegakiYinYangLabelProps) {
  return (
    <div
      className={`flex flex-col items-center ${
        align === "left" ? "md:items-end" : "md:items-start"
      }`}
    >
      <div
        className={`flex items-center gap-3.5 md:gap-4 ${
          align === "left" ? "flex-row" : "flex-row-reverse"
        }`}
      >
        <span
          aria-hidden="true"
          className="text-[clamp(1.35rem,2.2vw,2.1rem)] font-medium leading-none text-[#F5C45E]/90 select-none"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            textShadow: "0 4px 20px rgba(14, 3, 6, 0.88)",
          }}
        >
          {kanji}
        </span>

        <TegakiRenderer
          as="span"
          font={SUEZ_ONE_FONT}
          time={align === "left" ? YIN_TIME : YANG_TIME}
          reducedMotion="user"
          quality={SUEZ_QUALITY}
          className="inline-block whitespace-nowrap font-normal leading-none tracking-normal text-[#F3E9DE]"
          style={{
            fontSize: "clamp(2.45rem, 4.9vw, 4.75rem)",
            filter: "drop-shadow(0 6px 26px rgba(14, 3, 6, 0.94))",
          }}
        >
          {word}
        </TegakiRenderer>
      </div>
    </div>
  );
});

const TegakiJapaneseWord = React.memo(function TegakiJapaneseWord({
  word,
  accentHex,
  isReady,
}: {
  word: string;
  accentHex: string;
  isReady: boolean;
}) {
  return (
    <TegakiRenderer
      key={word}
      as="span"
      font={KLEE_ONE_FONT}
      time={LOADER_TIME}
      reducedMotion="user"
      quality={KLEE_QUALITY}
      className="inline-block whitespace-nowrap font-normal leading-none tracking-normal"
      style={{
        fontSize: "clamp(1.35rem, 2.2vw, 1.95rem)",
        color: accentHex,
        filter: `drop-shadow(0 0 18px ${isReady ? "rgba(245,196,94,0.45)" : "rgba(255,77,61,0.52)"})`,
      }}
    >
      {word}
    </TegakiRenderer>
  );
});

export interface TegakiJapaneseStatusLoaderProps {
  /** Real 0..100 download + parse progress from the 3D Samurai Cat stage. */
  percent: number;
  /** True once the live 3D Samurai Cat has painted its first frame. */
  ready: boolean;
  /** Pulses subtly when the visitor tries to scroll before loading completes. */
  holdPulse?: boolean;
}

/**
 * Bold exterior Japanese calligraphy + percentage loader positioned OUTSIDE the
 * Japanese timber portal frame so visitors immediately see live loading progress
 * in high-contrast vermilion / imperial gold before scrolling inside.
 */
export function TegakiJapaneseStatusLoader({
  percent,
  ready,
  holdPulse = false,
}: TegakiJapaneseStatusLoaderProps) {
  const stage = selectJapaneseLoaderStage(percent, ready);
  const formattedPct = `${String(stage.percent).padStart(2, "0")}%`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={stage.ariaStatus}
      data-testid="hero-japanese-loader"
      data-loader-ready={stage.isReady ? "true" : "false"}
      data-loader-percent={String(stage.percent)}
      className={`flex flex-col items-center gap-2.5 transition-transform duration-200 ${
        holdPulse ? "scale-105" : "scale-100"
      }`}
    >
      <div className="flex items-baseline gap-4 sm:gap-5">
        {/* Memoized Japanese calligraphy word drawn smoothly via Tegaki (`klee-one`) */}
        <TegakiJapaneseWord
          word={stage.japaneseWord}
          accentHex={stage.accentHex}
          isReady={stage.isReady}
        />

        {/* Bold high-contrast live percentage counter */}
        <span
          className="font-mono text-[clamp(1.35rem,2.35vw,2.05rem)] font-bold leading-none tracking-[0.06em] tabular-nums"
          style={{
            color: stage.isReady ? "#F5C45E" : "#FF5744",
            textShadow: stage.isReady
              ? "0 2px 22px rgba(245, 196, 94, 0.48), 0 2px 10px rgba(10, 2, 4, 0.9)"
              : "0 2px 22px rgba(255, 77, 61, 0.55), 0 2px 10px rgba(10, 2, 4, 0.9)",
          }}
        >
          {formattedPct}
        </span>
      </div>

      {/* Crisp lacquered vermilion-to-gold progress bar directly under the Japanese readout */}
      <div className="relative h-[3px] w-[min(64vw,240px)] overflow-hidden bg-[#F3E9DE]/16">
        <div
          className="h-full w-full origin-left transition-transform duration-150 ease-out"
          style={{
            transform: `scaleX(${(stage.percent / 100).toFixed(4)})`,
            background: stage.isReady
              ? "linear-gradient(90deg, #D4963B 0%, #F7D47A 100%)"
              : "linear-gradient(90deg, #C8372D 0%, #FF5E45 65%, #F5C45E 100%)",
            boxShadow: stage.isReady
              ? "0 0 14px rgba(245, 196, 94, 0.65)"
              : "0 0 14px rgba(255, 87, 68, 0.7)",
          }}
        />
      </div>
    </div>
  );
}
