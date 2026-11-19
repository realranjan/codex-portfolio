"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown } from "lucide-react";
import { generateTornPaperPaths } from "@/lib/torn-paper";

gsap.registerPlugin(ScrollTrigger);

// Precompute deterministic 720-vertex organic torn paper geometry once (SSR-safe, zero runtime cost)
const TORN_GEOMETRY = generateTornPaperPaths(1600, 190, 720, 42);

// Lightweight static SVG grain data URI for authentic Japanese handmade paper tactility
const PAPER_GRAIN_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23g)' opacity='0.55'/%3E%3C/svg%3E")`;

/**
 * Scroll-controlled Japanese torn-paper peel transition.
 *
 * A pinned viewport holds the warm washi-paper ivory section (#F3E8DC) fixed underneath
 * while the deep textured umber sheet (#3A241D) and its attached irregular 720-vertex
 * deckled torn-paper bottom edge physically peel upward on scroll via a single GSAP
 * ScrollTrigger timeline (`scrub: true`, `pin: true`).
 *
 * Phases:
 * - 0–20%  : Dark umber sheet fills viewport; torn edge waits just below viewport.
 * - 20–45% : Dark sheet begins peeling upward with controlled parallax & soft contact shadow.
 * - 45–85% : Main reveal — irregular torn edge sweeps across viewport exposing fixed ivory layer.
 * - 85–100%: Torn edge clears top; ivory headline reveals via restrained upward mask before unpinning.
 */
export function TornPaperPeelTransition() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pinStageRef = useRef<HTMLDivElement>(null);
  const darkSheetRef = useRef<HTMLDivElement>(null);
  const darkContentRef = useRef<HTMLDivElement>(null);
  const shadowLayerRef = useRef<SVGGElement>(null);
  const curlLayerRef = useRef<SVGGElement>(null);
  const headlineLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const subcopyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rootEl = rootRef.current;
    const pinStageEl = pinStageRef.current;
    const darkSheetEl = darkSheetRef.current;
    const darkContentEl = darkContentRef.current;
    const shadowEl = shadowLayerRef.current;
    const curlEl = curlLayerRef.current;
    const headlineEls = headlineLineRefs.current.filter(
      (el): el is HTMLSpanElement => el !== null
    );
    const subcopyEl = subcopyRef.current;

    if (!rootEl || !pinStageEl || !darkSheetEl || !darkContentEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      rootEl.setAttribute("data-peel-mode", "reduced");
      gsap.set(headlineEls, { yPercent: 0 });
      if (subcopyEl) gsap.set(subcopyEl, { y: 0, opacity: 1 });
      return;
    }

    rootEl.setAttribute("data-peel-mode", "interactive");

    const ctx = gsap.context(() => {
      // Initial states: dark sheet covers viewport completely; ivory headline masked cleanly below
      gsap.set(darkSheetEl, { yPercent: 0, y: 0 });
      gsap.set(darkContentEl, { y: 0 });
      if (shadowEl) gsap.set(shadowEl, { opacity: 0.22, y: 4 });
      if (curlEl) gsap.set(curlEl, { opacity: 0 });
      gsap.set(headlineEls, { yPercent: 110 });
      if (subcopyEl) gsap.set(subcopyEl, { y: 18, opacity: 0.92 });

      // Single master GSAP timeline driven strictly by scroll progress (scrub: true, pin: true)
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: pinStageEl,
          start: "top top",
          end: "+=290%",
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            let phase = "complete";
            if (p < 0.2) phase = "before";
            else if (p < 0.45) phase = "peeling";
            else if (p < 0.85) phase = "reveal";
            pinStageEl.setAttribute("data-peel-phase", phase);
            pinStageEl.setAttribute("data-peel-progress", p.toFixed(3));
          },
        },
      });

      // ── Phase 1 (0% → 20%): Dark paper fills viewport; gentle initial tension before peel
      tl.to(
        darkSheetEl,
        {
          yPercent: -3.5,
          y: -10,
          duration: 0.2,
          ease: "power1.in",
        },
        0
      );
      tl.to(
        darkContentEl,
        {
          y: -14,
          duration: 0.2,
          ease: "power1.in",
        },
        0
      );
      if (shadowEl) {
        tl.to(
          shadowEl,
          {
            opacity: 0.48,
            y: 6,
            duration: 0.2,
          },
          0
        );
      }

      // ── Phase 2 (20% → 45%): Paper begins peeling upward with slower-than-scroll parallax
      tl.to(
        darkSheetEl,
        {
          yPercent: -34,
          y: -58,
          duration: 0.25,
          ease: "none",
        },
        0.2
      );
      tl.to(
        darkContentEl,
        {
          y: -56,
          duration: 0.25,
          ease: "none",
        },
        0.2
      );
      if (shadowEl) {
        tl.to(
          shadowEl,
          {
            opacity: 0.96,
            y: 12,
            duration: 0.25,
          },
          0.2
        );
      }
      if (curlEl) {
        tl.to(
          curlEl,
          {
            opacity: 0.88,
            duration: 0.25,
          },
          0.2
        );
      }

      // ── Phase 3 (45% → 85%): Main reveal — torn edge sweeps completely through & out top of viewport
      tl.to(
        darkSheetEl,
        {
          yPercent: -102,
          y: -210,
          duration: 0.4,
          ease: "none",
        },
        0.45
      );
      tl.to(
        darkContentEl,
        {
          y: -124,
          duration: 0.4,
          ease: "none",
        },
        0.45
      );
      if (shadowEl) {
        tl.to(
          shadowEl,
          {
            y: 15,
            duration: 0.3,
          },
          0.45
        ).to(
          shadowEl,
          {
            opacity: 0,
            duration: 0.1,
          },
          0.75
        );
      }
      if (curlEl) {
        tl.to(
          curlEl,
          {
            opacity: 0,
            duration: 0.12,
          },
          0.73
        );
      }

      // ── Phase 4 (85% → 100%): Torn edge has exited; warm ivory fills viewport & headline reveals upward
      tl.to(
        headlineEls,
        {
          yPercent: 0,
          duration: 0.115,
          stagger: 0.032,
          ease: "power3.out",
        },
        0.85
      );
      if (subcopyEl) {
        tl.to(
          subcopyEl,
          {
            y: 0,
            opacity: 1,
            duration: 0.12,
            ease: "power2.out",
          },
          0.865
        );
      }

      // Guarantee timeline total duration is exactly 1.0 for clean scrub mapping
      tl.set({}, {}, 1.0);
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-testid="torn-paper-transition"
      className="relative w-full"
    >
      {/* Pinned 100svh transition stage (collapses to clean static stacked chapters under reduced motion) */}
      <div
        ref={pinStageRef}
        data-testid="torn-paper-stage"
        data-peel-phase="before"
        data-peel-progress="0.000"
        className="relative h-[100svh] w-full overflow-hidden bg-[#F3E8DC] motion-reduce:h-auto"
      >
        {/* ═══════════════════════════════════════════════════════════════════════════
            LOWER LAYER (FIXED UNDERNEATH): Warm Japanese Washi-Paper Ivory (#F3E8DC)
            Physically occluded by the dark sheet above until the torn edge peels past it.
           ═══════════════════════════════════════════════════════════════════════════ */}
        <div
          data-testid="torn-paper-ivory-layer"
          className="relative z-[10] flex h-full w-full flex-col justify-center bg-[#F3E8DC] px-6 sm:px-10 py-20 sm:py-24 motion-reduce:min-h-[70svh]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 90% 80% at 50% 42%, #F8F0E6 0%, #F3E8DC 58%, #E9DAC9 100%)",
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

        {/* ═══════════════════════════════════════════════════════════════════════════
            UPPER LAYER (PEELS UPWARD VIA GPU TRANSFORM): Deep Textured Umber (#3A241D)
            Moves as ONE physical handmade paper sheet together with its irregular torn skirt.
           ═══════════════════════════════════════════════════════════════════════════ */}
        <div
          ref={darkSheetRef}
          data-testid="torn-paper-dark-sheet"
          className="absolute inset-0 z-[20] w-full bg-[#3A241D] will-change-transform motion-reduce:relative motion-reduce:h-auto motion-reduce:min-h-[60svh]"
          style={{
            backgroundColor: "#3A241D",
            backgroundImage: [
              "radial-gradient(ellipse 68% 52% at 24% 32%, rgba(78, 49, 39, 0.36) 0%, transparent 66%)",
              "radial-gradient(ellipse 52% 44% at 76% 52%, rgba(40, 22, 16, 0.44) 0%, transparent 66%)",
              "radial-gradient(ellipse 46% 36% at 50% 66%, rgba(74, 46, 36, 0.24) 0%, transparent 64%)",
              "radial-gradient(ellipse 80% 64% at 88% 18%, rgba(34, 18, 13, 0.38) 0%, transparent 60%)",
              "linear-gradient(180deg, #36211A 0%, #3A241D 58%, #3A241D 100%)",
            ].join(", "),
          }}
        >
          {/* Organic dark handmade paper grain extending seamlessly down into the torn skirt */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.20] mix-blend-soft-light"
            style={{
              backgroundImage: PAPER_GRAIN_URI,
              backgroundRepeat: "repeat",
              backgroundSize: "200px 200px",
              maskImage: "linear-gradient(180deg, black 0%, black 88%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(180deg, black 0%, black 88%, transparent 100%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(176deg, transparent 0px, transparent 19px, rgba(243, 232, 220, 0.35) 19px, rgba(243, 232, 220, 0.35) 20px)",
              maskImage: "linear-gradient(180deg, black 0%, black 78%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(180deg, black 0%, black 78%, transparent 100%)",
            }}
          />

          {/* Editorial chapter interlude printed on the dark umber sheet — rides upward with the paper */}
          <div
            ref={darkContentRef}
            data-testid="torn-paper-dark-content"
            className="relative z-[2] flex h-full w-full flex-col justify-between px-6 sm:px-10 pt-28 pb-16 sm:pt-32 sm:pb-20 will-change-transform"
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

            <div className="page-container flex w-full flex-wrap items-center justify-between gap-3 border-t border-[#F3E8DC]/15 pt-5 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em] text-[#D7BEA8]/75">
              <span>Chapter 02 · Craft & Practice</span>
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <span>Scroll to peel</span>
                <ArrowDown size={13} strokeWidth={1.6} aria-hidden="true" />
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════
              ATTACHED IRREGULAR JAPANESE TORN-PAPER EDGE SKIRT
              Rests just below viewport at 0%, physically peels upward with darkSheetRef.
              720 deterministic micro-fiber vertices across 100% viewport width.
             ═══════════════════════════════════════════════════════════════════════ */}
          <div
            aria-hidden="true"
            data-testid="torn-paper-edge"
            className="pointer-events-none absolute left-0 right-0 top-[calc(100%-3px)] h-[135px] sm:h-[170px] lg:h-[195px] w-full overflow-visible"
          >
            <svg
              viewBox={`0 0 ${TORN_GEOMETRY.viewBoxWidth} ${TORN_GEOMETRY.viewBoxHeight}`}
              preserveAspectRatio="none"
              className="block h-full w-full overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Narrow soft contact shadow filter constrained tightly to the edge strip */}
                <filter
                  id="torn-paper-contact-blur"
                  x="-2%"
                  y="-12%"
                  width="104%"
                  height="145%"
                >
                  <feGaussianBlur stdDeviation="4.2" />
                </filter>

                {/* Exact seamless #3A241D paper match transitioning gently into rich umber toward tips */}
                <linearGradient id="torn-dark-sheet-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3A241D" />
                  <stop offset="55%" stopColor="#3A241D" />
                  <stop offset="100%" stopColor="#352019" />
                </linearGradient>

                {/* Delicate paper-edge curl sheen gradient catching light along the lifted edge */}
                <linearGradient id="torn-edge-curl-sheen" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1B0E0A" stopOpacity="0" />
                  <stop offset="58%" stopColor="#1E100B" stopOpacity="0.22" />
                  <stop offset="92%" stopColor="#D7BDAA" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#F3E8DC" stopOpacity="0.22" />
                </linearGradient>
              </defs>

              {/* 1. Narrow soft contact shadow cast onto the ivory paper beneath */}
              <g
                ref={shadowLayerRef}
                data-testid="torn-paper-shadow"
                opacity="0.22"
              >
                <path
                  d={TORN_GEOMETRY.shadowPath}
                  fill="#1E110C"
                  fillOpacity="0.34"
                  filter="url(#torn-paper-contact-blur)"
                />
              </g>

              {/* 2. Subtle exposed raw-pulp mulberry/kozo paper deckle fibers along the tear */}
              <path
                d={TORN_GEOMETRY.fiberFringePath}
                fill="#DFD0BF"
                fillOpacity="0.62"
              />

              {/* 3. Primary deep textured umber torn-paper silhouette (100% seamless with #3A241D upper sheet) */}
              <path
                d={TORN_GEOMETRY.sheetPath}
                fill="url(#torn-dark-sheet-fill)"
              />

              {/* 4. Subtle paper-edge curl depth highlight along the peeling rim */}
              <g
                ref={curlLayerRef}
                data-testid="torn-paper-curl"
                opacity="0"
              >
                <path
                  d={TORN_GEOMETRY.curlHighlightPath}
                  fill="url(#torn-edge-curl-sheen)"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
