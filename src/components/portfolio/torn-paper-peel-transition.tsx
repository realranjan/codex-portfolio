"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown } from "lucide-react";
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

// Deterministic fallback SVG geometry when WebGL is unavailable or context is lost
const FALLBACK_TORN_GEOMETRY = generateTornPaperPaths(1600, 190, 720, 42);

// Crisp raw handmade paper grain + coarse organic mottled parchment SVG data URIs
const PAPER_GRAIN_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)' opacity='0.72'/%3E%3C/svg%3E")`;

const PAPER_MOTTLE_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='340' height='340' viewBox='0 0 340 340'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.032' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='340' height='340' filter='url(%23m)' opacity='0.78'/%3E%3C/svg%3E")`;

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

/**
 * Live scroll-morphing Japanese torn-paper transition.
 *
 * Flows naturally with Lenis smooth scroll (zero stiff pin dead-zones):
 * - Upper chapter: Deep textured Japanese umber (#3A241D) with organic paper mottling & parallax copy.
 * - Boundary: Full-width WebGL fragment shader rendering a 6-octave domain-warped 3D fBm torn-paper
 *   edge that actively morphs, ripples, forms organic flaps/undercuts, and pinches off micro-crumbs
 *   as the user scrolls up or down, settling smoothly to 0% idle GPU usage when scroll stops.
 * - Lower chapter: Warm Japanese washi-paper ivory (#F3E8DC) sitting directly beneath the live tear
 *   so physical occlusion reveals the Practice headline with a scrubbed upward masked-text entrance.
 */
export function TornPaperPeelTransition() {
  const rootRef = useRef<HTMLDivElement>(null);
  const darkSheetRef = useRef<HTMLDivElement>(null);
  const darkContentRef = useRef<HTMLDivElement>(null);
  const edgeWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ivorySectionRef = useRef<HTMLDivElement>(null);
  const headlineLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const subcopyRef = useRef<HTMLDivElement>(null);

  const [useSvgFallback, setUseSvgFallback] = useState(false);

  // ── 1. Real-Time Scroll-Morphing WebGL Torn-Paper Shader Lifecycle ─────────
  useEffect(() => {
    const rootEl = rootRef.current;
    const edgeEl = edgeWrapRef.current;
    const canvas = canvasRef.current;
    if (!rootEl || !edgeEl || !canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rootEl.setAttribute("data-peel-mode", reduced ? "reduced" : "interactive");

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
      rootEl.setAttribute("data-tear-renderer", "svg");
      setUseSvgFallback(true);
      return;
    }

    const program = createTearProgram(gl);
    if (!program) {
      rootEl.setAttribute("data-tear-renderer", "svg");
      setUseSvgFallback(true);
      return;
    }

    rootEl.setAttribute("data-tear-renderer", "webgl");

    // Full-bleed 2-triangle quad covering the torn-paper edge band
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

    // Seed initial dynamics from current scrollY so reload/mid-page jump renders cleanly
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
    let isNearViewport = true;
    let rafId: number | null = null;
    let lastTime = performance.now();
    let disposed = false;

    const resizeCanvas = () => {
      const rect = edgeEl.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      gl.uniform1f(phaseLoc, phase);
      gl.uniform1f(velLoc, velocity);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rootEl.setAttribute("data-tear-phase", phase.toFixed(3));
      rootEl.setAttribute("data-tear-velocity", velocity.toFixed(3));
    };

    const stopLoop = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const tick = (now: number) => {
      rafId = null;
      if (disposed) return;

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

    // Initial crisp paint
    resizeCanvas();
    drawFrame(dynamics.phase, 0);

    const handleScroll = () => {
      if (reduced) return;
      wakeLoop();
    };

    const handleResize = () => {
      resizeCanvas();
      drawFrame(dynamics.phase, reduced ? 0 : dynamics.velocity);
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      stopLoop();
      rootEl.setAttribute("data-tear-renderer", "svg");
      setUseSvgFallback(true);
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            handleResize();
          })
        : null;
    resizeObserver?.observe(edgeEl);

    const intersectionObserver =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              const entry = entries[0];
              isNearViewport = Boolean(entry?.isIntersecting);
              if (isNearViewport) {
                // Re-sync smoothly to current scroll position on entry
                if (reduced) {
                  drawFrame(dynamics.phase, 0);
                } else {
                  wakeLoop();
                }
              } else {
                stopLoop();
              }
            },
            { rootMargin: "360px 0px" }
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
  }, []);

  // ── 2. Buttery-Smooth Unpinned Scroll Parallax & Ivory Headline Reveal ───
  useEffect(() => {
    const rootEl = rootRef.current;
    const darkSheetEl = darkSheetRef.current;
    const darkContentEl = darkContentRef.current;
    const ivoryEl = ivorySectionRef.current;
    const headlineEls = headlineLineRefs.current.filter(
      (el): el is HTMLSpanElement => el !== null
    );
    const subcopyEl = subcopyRef.current;

    if (!rootEl || !darkSheetEl || !darkContentEl || !ivoryEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(darkContentEl, { y: 0 });
      gsap.set(headlineEls, { yPercent: 0 });
      if (subcopyEl) gsap.set(subcopyEl, { y: 0, opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      // Gentle physical parallax on the dark umber interlude copy (no stiff pin lock)
      gsap.fromTo(
        darkContentEl,
        { y: 26 },
        {
          y: -52,
          ease: "none",
          scrollTrigger: {
            trigger: darkSheetEl,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      // Restrained upward masked-text reveal for Practice headline as the torn edge glides past
      if (headlineEls.length > 0) {
        gsap.fromTo(
          headlineEls,
          { yPercent: 108 },
          {
            yPercent: 0,
            stagger: 0.14,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ivoryEl,
              start: "top 78%",
              end: "top 34%",
              scrub: 0.55,
            },
          }
        );
      }

      if (subcopyEl) {
        gsap.fromTo(
          subcopyEl,
          { y: 24, opacity: 0.88 },
          {
            y: 0,
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ivoryEl,
              start: "top 70%",
              end: "top 30%",
              scrub: 0.55,
            },
          }
        );
      }
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-testid="torn-paper-transition"
      data-tear-renderer="webgl"
      data-tear-phase="0.000"
      data-tear-velocity="0.000"
      className="relative w-full"
    >
      {/* ═══════════════════════════════════════════════════════════════════════════
          UPPER SHEET: Deep Rough-Textured Japanese Umber (#3A241D)
          Raw organic parchment mottling & fibrous grain matching the live jagged WebGL
          torn-paper edge directly beneath it with zero horizontal seam.
         ═══════════════════════════════════════════════════════════════════════════ */}
      <div
        ref={darkSheetRef}
        data-testid="torn-paper-dark-sheet"
        className="relative z-[20] flex min-h-[76svh] sm:min-h-[84svh] w-full flex-col justify-between bg-[#3A241D]"
        style={{
          backgroundColor: "#3A241D",
          backgroundImage: [
            "radial-gradient(ellipse 68% 52% at 22% 30%, rgba(86, 52, 38, 0.42) 0%, transparent 64%)",
            "radial-gradient(ellipse 50% 42% at 74% 56%, rgba(34, 18, 12, 0.52) 0%, transparent 64%)",
            "radial-gradient(ellipse 42% 34% at 48% 72%, rgba(82, 49, 36, 0.30) 0%, transparent 62%)",
            "radial-gradient(ellipse 76% 60% at 88% 18%, rgba(28, 14, 10, 0.44) 0%, transparent 58%)",
            "radial-gradient(ellipse 38% 30% at 15% 80%, rgba(30, 16, 11, 0.36) 0%, transparent 62%)",
            "linear-gradient(180deg, #352019 0%, #3A241D 52%, #3A241D 100%)",
          ].join(", "),
        }}
      >
        {/* Coarse organic handmade paper pulp & mottled blotches */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.34] mix-blend-multiply"
          style={{
            backgroundImage: PAPER_MOTTLE_URI,
            backgroundRepeat: "repeat",
            backgroundSize: "340px 340px",
            maskImage: "linear-gradient(180deg, black 0%, black 76%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(180deg, black 0%, black 76%, transparent 100%)",
          }}
        />
        {/* Crisp raw handmade paper grain feathered smoothly to pure #3A241D at bottom join */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.30] mix-blend-soft-light"
          style={{
            backgroundImage: PAPER_GRAIN_URI,
            backgroundRepeat: "repeat",
            backgroundSize: "180px 180px",
            maskImage: "linear-gradient(180deg, black 0%, black 78%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(180deg, black 0%, black 78%, transparent 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(176deg, transparent 0px, transparent 17px, rgba(243, 232, 220, 0.38) 17px, rgba(243, 232, 220, 0.38) 18px)",
            maskImage: "linear-gradient(180deg, black 0%, black 74%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(180deg, black 0%, black 74%, transparent 100%)",
          }}
        />

        {/* Editorial chapter interlude printed on the dark umber paper */}
        <div
          ref={darkContentRef}
          data-testid="torn-paper-dark-content"
          className="relative z-[2] flex flex-1 w-full flex-col justify-between px-6 sm:px-10 pt-24 pb-14 sm:pt-32 sm:pb-16 will-change-transform"
        >
          <div className="page-container w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#D7BEA8]/80">
                  Interlude · 02
                </span>
              </div>
              <div className="lg:col-span-10 space-y-6">
                <p
                  className="m-0 font-serif italic text-[#E7D4C0]/90 tracking-[-0.01em] leading-[1.08]"
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "clamp(24px, 2.4vw, 34px)",
                  }}
                >
                  Beneath the surface, only mechanism remains.
                </p>
                <h2
                  className="m-0 font-normal uppercase text-[#F3E8DC] leading-[0.88] tracking-[-0.03em]"
                  style={{
                    fontFamily: "var(--font-anton), Impact, sans-serif",
                    fontSize: "clamp(54px, 8.6vw, 138px)",
                  }}
                >
                  PEEL BACK THE LAYER.
                </h2>
                <p className="m-0 max-w-[46ch] text-sm sm:text-base leading-relaxed text-[#D7C3B0]/85">
                  Every production architecture begins as layers of tooling, shaders, and
                  protocols. Scroll to strip away the outer shell and inspect the engineering
                  practice underneath.
                </p>
              </div>
            </div>
          </div>

          <div className="page-container mt-14 flex w-full flex-wrap items-center justify-between gap-3 border-t border-[#F3E8DC]/15 pt-5 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em] text-[#D7BEA8]/75">
            <span>Chapter 02 · Craft & Practice</span>
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <span>Scroll to peel</span>
              <ArrowDown size={13} strokeWidth={1.6} aria-hidden="true" />
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════
            LIVE SCROLL-MORPHING TORN-PAPER EDGE SKIRT
            6-octave domain-warped 3D fBm WebGL fragment shader (<0.15ms/frame)
            Overlaps upper sheet by 2px for zero seam; transparent bottom reveals #F3E8DC.
           ═══════════════════════════════════════════════════════════════════════════ */}
        <div
          ref={edgeWrapRef}
          aria-hidden="true"
          data-testid="torn-paper-edge"
          className="pointer-events-none absolute left-0 right-0 top-[calc(100%-2px)] z-[25] h-[220px] sm:h-[290px] lg:h-[330px] w-full overflow-hidden"
        >
          {!useSvgFallback ? (
            <canvas
              ref={canvasRef}
              data-testid="torn-paper-webgl-canvas"
              className="block h-full w-full"
            />
          ) : (
            <svg
              viewBox={`0 0 ${FALLBACK_TORN_GEOMETRY.viewBoxWidth} ${FALLBACK_TORN_GEOMETRY.viewBoxHeight}`}
              preserveAspectRatio="none"
              className="block h-full w-full overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter
                  id="torn-fallback-shadow"
                  x="-2%"
                  y="-12%"
                  width="104%"
                  height="145%"
                >
                  <feGaussianBlur stdDeviation="4.2" />
                </filter>
              </defs>
              <path
                d={FALLBACK_TORN_GEOMETRY.shadowPath}
                fill="#1E110C"
                fillOpacity="0.24"
                filter="url(#torn-fallback-shadow)"
              />
              <path
                d={FALLBACK_TORN_GEOMETRY.fiberFringePath}
                fill="#DFD0BF"
                fillOpacity="0.55"
              />
              <path d={FALLBACK_TORN_GEOMETRY.sheetPath} fill="#3A241D" />
            </svg>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LOWER LAYER (PHYSICALLY REVEALED BENEATH THE MORPHING TEAR):
          Warm Japanese Washi-Paper Ivory (#F3E8DC)
          Starts right at darkSheetRef bottom (-mt-[2px]) so the absolute WebGL torn-paper
          skirt overlays the top 220-330px cleanly while Practice typography starts below
          the deepest possible torn paper flap with zero text occlusion.
         ═══════════════════════════════════════════════════════════════════════════ */}
      <div
        ref={ivorySectionRef}
        data-testid="torn-paper-ivory-layer"
        className="relative z-[10] -mt-[2px] w-full bg-[#F3E8DC] px-6 sm:px-10 pt-[255px] sm:pt-[325px] lg:pt-[365px] pb-14 sm:pb-20"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 90% 80% at 50% 42%, #F8F0E6 0%, #F3E8DC 58%, #F3E8DC 100%)",
        }}
      >
        {/* Subtle handmade washi paper grain overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-multiply"
          style={{
            backgroundImage: PAPER_GRAIN_URI,
            backgroundRepeat: "repeat",
            backgroundSize: "220px 220px",
          }}
        />

        <div className="page-container relative z-[2] w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 sm:mb-12 items-start">
            <div className="lg:col-span-2">
              <span className="type-tech-label text-[#A91D22]">02. Practice</span>
            </div>
            <div className="lg:col-span-10">
              <h2
                id="about-heading"
                data-testid="torn-ivory-headline"
                className="type-h2 m-0 text-[#1E1916]"
              >
                <span className="block overflow-hidden pb-[0.06em]">
                  <span
                    ref={(el) => {
                      headlineLineRefs.current[0] = el;
                    }}
                    data-testid="torn-headline-line-0"
                    className="block will-change-transform"
                  >
                    From kernel tuning
                  </span>
                </span>
                <span className="block overflow-hidden pb-[0.06em]">
                  <span
                    ref={(el) => {
                      headlineLineRefs.current[1] = el;
                    }}
                    data-testid="torn-headline-line-1"
                    className="block will-change-transform"
                  >
                    to the <em className="type-serif-accent font-medium">final</em> frame.
                  </span>
                </span>
              </h2>
            </div>
          </div>

          <div
            ref={subcopyRef}
            className="lg:ml-[16.666%] border-y border-[#2B231E]/[0.16] py-8 sm:py-10 will-change-transform"
          >
            <p className="type-intro m-0 max-w-[44ch] text-[#2B231E]">
              Across backend{" "}
              <em className="type-serif-accent font-medium text-[#A91D22]">routers,</em>{" "}
              storage engines, and browser{" "}
              <em className="type-serif-accent font-medium text-[#A91D22]">shaders,</em>{" "}
              good engineering cuts out unnecessary abstraction until the mechanism{" "}
              <em className="type-serif-accent font-medium text-[#A91D22]">holds</em>{" "}
              under load.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
