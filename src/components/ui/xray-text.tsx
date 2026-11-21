"use client";

import React, { useCallback, useRef } from "react";
import { computeXrayPointerLocal } from "@/lib/hero-portal";

export interface XrayTextProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Primary visible text at rest. */
  text: string;
  /** Hidden second message revealed through the pointer-following round x-ray lens. */
  secret: string;
  /** Radius of the round x-ray hole in pixels. Defaults to `1.5em` so it scales with the text. */
  radius?: number;
  /** CSS colour of the revealed secret layer (or override via `--xray-text-color`). */
  revealColor?: string;
  /** Additional classes merged onto the root span. */
  className?: string;
}

/**
 * XrayText — Dual-stacked radial-gradient mask text reveal.
 *
 * Where the pointer glides over the headline, a soft-rimmed round hole opens
 * in the primary copy and exposes the hidden `secret` line underneath in its
 * own colour (`revealColor` / `--xray-text-color`). Driven purely by registered
 * CSS `@property` custom properties (`--xray-text-x`, `--xray-text-y`,
 * `--xray-text-open`) with zero animation library overhead.
 *
 * Accessibility:
 * - Screen readers read `text`, then `secret` once via `.sr-only`.
 * - Keyboard focus on an enclosing `<a>` reveals the whole secret.
 * - Touch opens the hole under the finger and closes cleanly on release.
 * - `prefers-reduced-motion: reduce` opens and follows immediately without glide.
 */
export function XrayText({
  text,
  secret,
  radius,
  revealColor,
  className = "",
  style,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  ...rest
}: XrayTextProps) {
  const hostRef = useRef<HTMLSpanElement>(null);

  const writePointer = useCallback((clientX: number, clientY: number) => {
    const el = hostRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const { x, y } = computeXrayPointerLocal(clientX, clientY, rect);
    el.style.setProperty("--xray-text-x", `${x}px`);
    el.style.setProperty("--xray-text-y", `${y}px`);
  }, []);

  const setOpen = useCallback((open: boolean) => {
    const el = hostRef.current;
    if (!el) return;
    el.style.setProperty("--xray-text-open", open ? "1" : "0");
    el.dataset.xrayOpen = open ? "true" : "false";
  }, []);

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      if (e.pointerType !== "touch") {
        writePointer(e.clientX, e.clientY);
        setOpen(true);
      }
      onPointerEnter?.(e);
    },
    [writePointer, setOpen, onPointerEnter]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      writePointer(e.clientX, e.clientY);
      if (e.pointerType !== "touch") {
        setOpen(true);
      }
      onPointerMove?.(e);
    },
    [writePointer, setOpen, onPointerMove]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      setOpen(false);
      onPointerLeave?.(e);
    },
    [setOpen, onPointerLeave]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      writePointer(e.clientX, e.clientY);
      setOpen(true);
      onPointerDown?.(e);
    },
    [writePointer, setOpen, onPointerDown]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      if (e.pointerType === "touch") {
        setOpen(false);
      }
      onPointerUp?.(e);
    },
    [setOpen, onPointerUp]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      setOpen(false);
      onPointerCancel?.(e);
    },
    [setOpen, onPointerCancel]
  );

  const customVars: React.CSSProperties = {
    ...(radius !== undefined
      ? ({ "--xray-text-radius": `${radius}px` } as React.CSSProperties)
      : {}),
    ...(revealColor
      ? ({ "--xray-text-color": revealColor } as React.CSSProperties)
      : {}),
    ...style,
  };

  return (
    <span
      ref={hostRef}
      data-slot="xray-text"
      data-xray-open="false"
      className={`xray-text ${className}`.trim()}
      style={customVars}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      {...rest}
    >
      {/* Accessible single-pass screen reader copy */}
      <span className="sr-only">
        {text} {secret}
      </span>

      {/* Primary visible text (masked clear inside the x-ray circle, solid outside) */}
      <span aria-hidden="true" className="xray-text-front">
        {text}
      </span>

      {/* Secret layer underneath (masked solid inside the x-ray circle, clear outside) */}
      <span aria-hidden="true" className="xray-text-secret">
        {secret}
      </span>
    </span>
  );
}

export default XrayText;
