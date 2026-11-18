"use client";

import { forwardRef, useEffect, useRef } from "react";

interface AsciiBackgroundProps {
  className?: string;
}

const ASCII_SCALE = " .:-=+*#%@";

/**
 * Renders a static, zero-loop procedural monospace contour field onto a 2D canvas
 * so there is subtle architectural texture behind the 3D sculpture with zero missing image requests.
 */
const AsciiBackground = forwardRef<HTMLDivElement, AsciiBackgroundProps>(
  function AsciiBackground({ className = "" }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const draw = () => {
        const w = Math.max(320, Math.round(canvas.clientWidth || window.innerWidth));
        const h = Math.max(240, Math.round(canvas.clientHeight || window.innerHeight));
        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);

        const cellW = 14;
        const cellH = 18;
        const cols = Math.ceil(w / cellW);
        const rows = Math.ceil(h / cellH);

        ctx.font = "400 11px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const cx = cols * 0.66;
        const cy = rows * 0.48;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const dx = (c - cx) / (cols * 0.28);
            const dy = (r - cy) / (rows * 0.36);
            const dist = Math.hypot(dx, dy);
            const contour =
              Math.exp(-dist * dist * 1.45) *
              (0.55 + 0.45 * Math.cos(dist * 7.5 + c * 0.14 - r * 0.11));

            if (contour < 0.08) continue;

            const idx = Math.min(
              ASCII_SCALE.length - 1,
              Math.floor(contour * (ASCII_SCALE.length - 1))
            );
            const ch = ASCII_SCALE[idx];
            if (ch === " ") continue;

            ctx.fillStyle = `rgba(196, 176, 220, ${(0.04 + contour * 0.14).toFixed(3)})`;
            ctx.fillText(ch, c * cellW + cellW * 0.5, r * cellH + cellH * 0.5);
          }
        }
      };

      draw();
      window.addEventListener("resize", draw);
      return () => window.removeEventListener("resize", draw);
    }, []);

    return (
      <div
        className={`ascii-backdrop pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <div
          ref={ref}
          className="ascii-backdrop-layer absolute -inset-[6%] will-change-transform"
          style={{ opacity: 0.48, transform: "translate3d(0%, 0%, 0) scale(1.06)" }}
        >
          <canvas ref={canvasRef} className="h-full w-full block" />
        </div>
      </div>
    );
  }
);

export default AsciiBackground;
