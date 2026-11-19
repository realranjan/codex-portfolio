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

export interface TornPaperPeelProps {
  /** Small editorial note printed near the torn lip of the Burgundy sheet */
  upperCaption?: string;
  /** Subtle destination hint revealed on the Ivory sheet beneath the tear */
  lowerHint?: string;
  /** Unique test identifier for verification */
  testId?: string;
  /** Optional phase seed offset so multiple peel instances have distinct organic tear contours */
  phaseOffset?: number;
}

/**
 * Reusable Burgundy (#792B33) -> Warm Ivory (#F3E9DE) physical torn-paper peel transition.
 *
 * Used identically between:
 * - Chapter 01 (About / Burgundy) -> Chapter 02 (Selected Projects / Ivory)
 * - Chapter 07 (Achievements / Burgundy) -> Chapter 08 (Contact / Ivory)
 *
 * Driven by GSAP ScrollTrigger (`scrub: true`) with physical upward transform occlusion
 * (zero opacity crossfade) and a live scroll-morphing jagged fiber WebGL shader that pauses
 * automatically when offscreen.
 */
export function TornPaperPeel({
  upperCaption = "Peel upward",
  lowerHint,
  testId = "torn-paper-peel",
  phaseOffset = 0,
}: TornPaperPeelProps) {
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
            { rootMargin: "280px 0px" }
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
  }, [phaseOffset]);

  // 2. GSAP ScrollTrigger pinned physical upward peel (100% scroll-driven & reversible)
  useEffect(() => {
    const rootEl = rootRef.current;
    const sheetEl = sheetRef.current;
    if (!rootEl || !sheetEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(sheetEl, { yPercent: -50 });
      rootEl.dataset.peelProgress = "0.50";
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootEl,
          start: "top top",
          end: "+=115%",
          scrub: true,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            rootEl.dataset.peelProgress = self.progress.toFixed(2);
          },
        },
      });

      // Physical occlusion lift: Burgundy sheet + attached jagged tear skirt sweep cleanly upward
      tl.fromTo(
        sheetEl,
        { yPercent: -10 },
        { yPercent: -136, ease: "none", duration: 1 },
        0
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      data-testid={testId}
      data-peel-progress="0.00"
      className="relative h-[100svh] w-full overflow-hidden bg-[#F3E9DE]"
      aria-hidden="true"
    >
      {/* Underlying Warm Ivory (#F3E9DE) layer revealed physically as the Burgundy sheet peels up */}
      <div className="relative z-[1] flex h-full w-full flex-col justify-between bg-[#F3E9DE] py-24 sm:py-28">
        <div className="page-container flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em] text-[#792B33]/55">
          <span>Washi Peel Transition</span>
          <span>Ivory · #F3E9DE</span>
        </div>

        {lowerHint && (
          <div className="page-container my-auto">
            <p className="m-0 font-mono text-xs uppercase tracking-[0.22em] text-[#792B33]/64">
              Entering Next Chapter
            </p>
            <p
              className="mt-3 m-0 font-normal uppercase leading-[0.88] tracking-[-0.03em] text-[#792B33]"
              style={{
                fontFamily: "var(--font-anton), Impact, sans-serif",
                fontSize: "clamp(48px, 8.5vw, 136px)",
              }}
            >
              {lowerHint}
            </p>
          </div>
        )}

        <div className="page-container flex items-center justify-between border-t border-[#792B33]/16 pt-5 text-[11px] font-mono uppercase tracking-[0.18em] text-[#792B33]/55">
          <span>Continue scrolling</span>
          <span>Physical Paper Occlusion</span>
        </div>
      </div>

      {/* Physical Burgundy (#792B33) upper sheet + attached jagged torn-paper skirt peeling upward */}
      <div
        ref={sheetRef}
        className="pointer-events-none absolute inset-x-0 top-0 z-[10] h-full will-change-transform"
      >
        {/* Solid full-viewport Burgundy paper body */}
        <div className="relative flex h-full w-full flex-col justify-end bg-[#792B33] pb-8">
          <div className="page-container flex items-center justify-between border-t border-[#F3E9DE]/18 pt-5 text-[11px] font-mono uppercase tracking-[0.2em] text-[#F3E9DE]/64">
            <span>{upperCaption}</span>
            <span className="hidden sm:inline">Burgundy · #792B33 · Washi Tear</span>
          </div>
        </div>

        {/* Full-width live scroll-morphing jagged torn edge hanging directly off the Burgundy sheet */}
        <div
          ref={edgeWrapRef}
          className="relative -mt-[2px] h-[210px] sm:h-[260px] lg:h-[300px] w-full overflow-hidden"
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
                fill="#792B33"
                fillOpacity="0.16"
              />
              <path
                d={FALLBACK_TORN_GEOMETRY.fiberFringePath}
                fill="#F3E9DE"
                fillOpacity="0.6"
              />
              <path d={FALLBACK_TORN_GEOMETRY.sheetPath} fill="#792B33" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
