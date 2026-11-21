"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  generateTornPaperPaths,
  INITIAL_TORN_PAPER_DYNAMICS,
  stepTornPaperDynamics,
  type TornPaperDynamicsState,
} from "@/lib/torn-paper";
import {
  TORN_PAPER_FRAGMENT_SHADER,
  TORN_PAPER_VERTEX_SHADER,
} from "@/lib/torn-paper-shader";

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_TORN_GEOMETRY = generateTornPaperPaths(1600, 190, 720, 42);

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createTearProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, TORN_PAPER_VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, TORN_PAPER_FRAGMENT_SHADER);
  if (!vs || !fs) {
    if (vs) gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    return null;
  }
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return null;
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export type TornPaperVariant = "burgundy-to-ivory" | "ivory-to-burgundy";

const VARIANT_PALETTES: Record<
  TornPaperVariant,
  {
    upperHex: string;
    lowerHex: string;
    captionClass: string;
    paperRgb: [number, number, number];
    fiberRgb: [number, number, number];
    shadowRgb: [number, number, number];
    textureScale: number;
    svgShadowHex: string;
    svgFiberHex: string;
  }
> = {
  "burgundy-to-ivory": {
    upperHex: "#792B33",
    lowerHex: "#F3E9DE",
    captionClass: "text-[#F3E9DE]/58",
    paperRgb: [0.4745, 0.1686, 0.2],
    fiberRgb: [0.86, 0.78, 0.74],
    shadowRgb: [0.26, 0.09, 0.11],
    textureScale: 1.0,
    svgShadowHex: "#792B33",
    svgFiberHex: "#F3E9DE",
  },
  "ivory-to-burgundy": {
    upperHex: "#F3E9DE",
    lowerHex: "#792B33",
    captionClass: "text-[#792B33]/58",
    paperRgb: [0.9529, 0.9137, 0.8706],
    fiberRgb: [1.0, 0.985, 0.96],
    shadowRgb: [0.18, 0.05, 0.07],
    textureScale: 0.78,
    svgShadowHex: "#2E0F14",
    svgFiberHex: "#FFFDF9",
  },
};

export interface TornPaperPeelProps {
  /** Surface peel direction (default: burgundy-to-ivory) */
  variant?: TornPaperVariant;
  /** Small editorial note printed near the torn lip of the upper sheet (standalone mode only) */
  upperCaption?: string;
  /** Subtle destination hint revealed on the lip (standalone mode only) */
  lowerHint?: string;
  /** Unique test identifier for verification */
  testId?: string;
  /** Optional phase seed offset so multiple peel instances have distinct organic tear contours */
  phaseOffset?: number;
  /**
   * When true, renders as a transparent-backed torn paper edge fused directly onto
   * the bottom of a StoryScrollChapter sheet so chapter & tear move as ONE seamless piece.
   */
  attached?: boolean;
}

/**
 * Reusable physical torn-paper peel transition supporting both:
 * - Burgundy (#792B33) -> Warm Ivory (#F3E9DE)
 * - Warm Ivory (#F3E9DE) -> Burgundy (#792B33)
 *
 * In `attached` mode, mounts directly inside a StoryScrollChapter's transforming sheet
 * with premultiplied alpha transparency below the jagged fiber edge so there is never
 * a horizontal seam or right-edge alignment gap.
 */
export function TornPaperPeel({
  variant = "burgundy-to-ivory",
  upperCaption,
  lowerHint,
  testId = "torn-paper-peel",
  phaseOffset = 0,
  attached = false,
}: TornPaperPeelProps) {
  const palette = VARIANT_PALETTES[variant];
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const edgeWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useSvgFallback, setUseSvgFallback] = useState(false);

  // 1. Live Scroll-Morphing WebGL Torn-Paper Edge (pauses completely when offscreen)
  useEffect(() => {
    const rootEl = rootRef.current;
    const edgeEl = edgeWrapRef.current;
    const canvas = canvasRef.current;
    if (!rootEl || !edgeEl || !canvas) return;

    const pal = VARIANT_PALETTES[variant];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setUseSvgFallback(true);
      return;
    }

    const program = createTearProgram(gl);
    if (!program) {
      setUseSvgFallback(true);
      return;
    }

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "aPosition");
    const resLoc = gl.getUniformLocation(program, "uResolution");
    const phaseLoc = gl.getUniformLocation(program, "uPhase");
    const velLoc = gl.getUniformLocation(program, "uVelocity");
    const paperColorLoc = gl.getUniformLocation(program, "uPaperColor");
    const fiberColorLoc = gl.getUniformLocation(program, "uFiberColor");
    const shadowColorLoc = gl.getUniformLocation(program, "uShadowColor");
    const texScaleLoc = gl.getUniformLocation(program, "uTextureScale");

    gl.useProgram(program);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);

    const initialY = window.scrollY;
    let dynamics: TornPaperDynamicsState = {
      ...INITIAL_TORN_PAPER_DYNAMICS,
      smoothedScrollY: initialY,
      phase: initialY * 0.0028,
      velocity: 0,
      isActive: false,
    };

    let widthPx = 1;
    let heightPx = 1;
    let isNearViewport = false;
    let rafId: number | null = null;
    let lastTime = performance.now();
    let disposed = false;

    const resizeCanvas = () => {
      const rect = edgeEl.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const nextW = Math.max(2, Math.round(rect.width * dpr));
      const nextH = Math.max(2, Math.round(rect.height * dpr));
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
      widthPx = nextW;
      heightPx = nextH;
      gl.viewport(0, 0, widthPx, heightPx);
    };

    const drawFrame = (phase: number, velocity: number) => {
      if (disposed || gl.isContextLost()) return;
      gl.useProgram(program);
      gl.uniform2f(resLoc, widthPx, heightPx);
      gl.uniform1f(phaseLoc, phase + phaseOffset);
      gl.uniform1f(velLoc, velocity);
      gl.uniform3f(paperColorLoc, pal.paperRgb[0], pal.paperRgb[1], pal.paperRgb[2]);
      gl.uniform3f(fiberColorLoc, pal.fiberRgb[0], pal.fiberRgb[1], pal.fiberRgb[2]);
      gl.uniform3f(shadowColorLoc, pal.shadowRgb[0], pal.shadowRgb[1], pal.shadowRgb[2]);
      gl.uniform1f(texScaleLoc, pal.textureScale);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const stopLoop = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const tick = (now: number) => {
      rafId = null;
      if (disposed || !isNearViewport) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      dynamics = stepTornPaperDynamics(dynamics, window.scrollY, dt);
      drawFrame(dynamics.phase, dynamics.velocity);

      if (dynamics.isActive && isNearViewport && !reduced) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const wakeLoop = () => {
      if (disposed || reduced || !isNearViewport) return;
      if (rafId === null) {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(tick);
      }
    };

    resizeCanvas();
    drawFrame(dynamics.phase, 0);

    const handleScroll = () => {
      if (!reduced && isNearViewport) wakeLoop();
    };

    const handleResize = () => {
      resizeCanvas();
      drawFrame(dynamics.phase, reduced ? 0 : dynamics.velocity);
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      stopLoop();
      setUseSvgFallback(true);
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(handleResize)
        : null;
    resizeObserver?.observe(edgeEl);

    const intersectionObserver =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              isNearViewport = Boolean(entries[0]?.isIntersecting);
              if (isNearViewport) {
                if (reduced) {
                  drawFrame(dynamics.phase, 0);
                } else {
                  wakeLoop();
                }
              } else {
                stopLoop();
              }
            },
            { rootMargin: "320px 0px" }
          )
        : null;
    intersectionObserver?.observe(rootEl);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    canvas.addEventListener("webglcontextlost", handleContextLost, false);

    return () => {
      disposed = true;
      stopLoop();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      if (!gl.isContextLost()) {
        if (quadBuffer) gl.deleteBuffer(quadBuffer);
        gl.deleteProgram(program);
      }
    };
  }, [phaseOffset, variant]);

  // 2. Standalone scroll-scrubbed upward peel (skipped in `attached` mode where parent StoryScrollChapter moves the whole sheet)
  useEffect(() => {
    if (attached) return;
    const rootEl = rootRef.current;
    const sheetEl = sheetRef.current;
    if (!rootEl || !sheetEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(sheetEl, { yPercent: -14 });
      rootEl.dataset.peelProgress = "0.50";
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootEl,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => {
            rootEl.dataset.peelProgress = self.progress.toFixed(2);
          },
        },
      });

      tl.fromTo(
        sheetEl,
        { yPercent: 0 },
        { yPercent: -34, ease: "none", duration: 1 },
        0
      );
    }, rootRef);

    return () => ctx.revert();
  }, [attached]);

  // Attached mode: transparent-backed jagged paper lip welded directly to bottom of parent sheet
  if (attached) {
    return (
      <div
        ref={rootRef}
        data-testid={testId}
        data-peel-variant={variant}
        data-peel-mode="attached"
        className="pointer-events-none relative -mt-[2px] h-[132px] sm:h-[164px] lg:h-[188px] w-full overflow-hidden select-none"
        aria-hidden="true"
      >
        {/* 3px hairline overlap anchor in upper sheet hue to prevent subpixel seam on retina scaling */}
        <div
          className="absolute inset-x-0 top-0 h-[4px]"
          style={{ backgroundColor: palette.upperHex }}
        />
        <div ref={edgeWrapRef} className="relative h-full w-full overflow-hidden">
          {!useSvgFallback ? (
            <canvas ref={canvasRef} className="block h-full w-full" />
          ) : (
            <svg
              viewBox={`0 0 ${FALLBACK_TORN_GEOMETRY.viewBoxWidth} ${FALLBACK_TORN_GEOMETRY.viewBoxHeight}`}
              preserveAspectRatio="none"
              className="block h-full w-full overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d={FALLBACK_TORN_GEOMETRY.shadowPath}
                fill={palette.svgShadowHex}
                fillOpacity="0.28"
              />
              <path
                d={FALLBACK_TORN_GEOMETRY.fiberFringePath}
                fill={palette.svgFiberHex}
                fillOpacity="0.72"
              />
              <path d={FALLBACK_TORN_GEOMETRY.sheetPath} fill={palette.upperHex} />
            </svg>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      data-testid={testId}
      data-peel-variant={variant}
      data-peel-mode="standalone"
      data-peel-progress="0.00"
      className="relative h-[168px] sm:h-[208px] lg:h-[236px] w-full overflow-hidden"
      style={{ backgroundColor: palette.lowerHex }}
      aria-hidden="true"
    >
      {/* Physical upper sheet lip + live scroll-morphing jagged torn-paper edge */}
      <div
        ref={sheetRef}
        className="pointer-events-none absolute inset-x-0 -top-6 z-[10] will-change-transform"
      >
        {/* Solid upper anchor connecting seamlessly to the chapter above */}
        <div
          className="relative h-12 sm:h-14 w-full"
          style={{ backgroundColor: palette.upperHex }}
        >
          {upperCaption && (
            <div
              className={`page-container flex h-full items-end justify-between pb-1.5 text-[10px] font-mono uppercase tracking-[0.2em] ${palette.captionClass}`}
            >
              <span>{upperCaption}</span>
              {lowerHint && <span className="hidden sm:inline">{lowerHint}</span>}
            </div>
          )}
        </div>

        {/* Full-width live scroll-morphing jagged torn edge hanging directly off the upper sheet */}
        <div
          ref={edgeWrapRef}
          className="relative -mt-[2px] h-[145px] sm:h-[180px] lg:h-[208px] w-full overflow-hidden"
        >
          {!useSvgFallback ? (
            <canvas
              ref={canvasRef}
              className="block h-full w-full"
            />
          ) : (
            <svg
              viewBox={`0 0 ${FALLBACK_TORN_GEOMETRY.viewBoxWidth} ${FALLBACK_TORN_GEOMETRY.viewBoxHeight}`}
              preserveAspectRatio="none"
              className="block h-full w-full overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d={FALLBACK_TORN_GEOMETRY.shadowPath}
                fill={palette.svgShadowHex}
                fillOpacity="0.22"
              />
              <path
                d={FALLBACK_TORN_GEOMETRY.fiberFringePath}
                fill={palette.svgFiberHex}
                fillOpacity="0.65"
              />
              <path d={FALLBACK_TORN_GEOMETRY.sheetPath} fill={palette.upperHex} />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

