"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Check, Copy, Send, X } from "lucide-react";
import { CONTACT_CONTENT, SOCIAL_LINKS } from "@/data/portfolio-content";
import { computeFooterTouchState } from "@/lib/footer-touch";

gsap.registerPlugin(ScrollTrigger);

interface ChapterContactProps {
  onOpenResume: () => void;
}

const BRUSH_PATH_LENGTH = 260;

/**
 * 09 / CONTACT — CINEMATIC JAPANESE SAMURAI CAT FOOTER
 *
 * A restrained, poetic closing scene (~65–75vh desktop composition) echoing Michelangelo's
 * "The Creation of Adam" through two distinct renderings of the Samurai Cat:
 * - Left:  Realistic armored 3D Samurai Cat (body anchored, articulated paw reaching right)
 * - Right: Traditional Japanese ukiyo-e burgundy woodblock Samurai Cat (body anchored, paw reaching left)
 *
 * Driven purely by GSAP ScrollTrigger (`scrub: true`, zero autoplay, 100% reversible).
 * Strict palette: Warm Ivory (#F3E9DE) canvas + Deep Burgundy (#792B33) typography & print ink.
 */
export function ChapterContact({ onOpenResume }: ChapterContactProps) {
  const footerRef = useRef<HTMLElement>(null);

  // Independently animated DOM layers (bodies stay anchored; paws extend from shoulder pivots)
  const leftBodyRef = useRef<HTMLDivElement>(null);
  const rightBodyRef = useRef<HTMLDivElement>(null);
  const leftPawRef = useRef<HTMLDivElement>(null);
  const rightPawRef = useRef<HTMLDivElement>(null);

  // Phase D (85-100%) subtle contact artwork refs
  const rippleOuterRef = useRef<HTMLDivElement>(null);
  const rippleInnerRef = useRef<HTMLDivElement>(null);
  const brushstrokeRef = useRef<SVGPathElement>(null);
  const blossomRef = useRef<HTMLDivElement>(null);
  const ctaWrapRef = useRef<HTMLDivElement>(null);

  // Interactive contact drawer state (keeps footer serene while providing full real contact action)
  const [contactOpen, setContactOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Image load fallback tracking (Zero-Broken-Image policy)
  const [missingAssets, setMissingAssets] = useState<Record<string, boolean>>({});
  const markAssetMissing = (key: string) => {
    setMissingAssets((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  // Apply deterministic pure scroll choreography directly to compositor-only transforms/opacity
  const applyTouchProgress = (rawProgress: number) => {
    const state = computeFooterTouchState(rawProgress);

    if (footerRef.current) {
      footerRef.current.dataset.touchProgress = state.progress.toFixed(2);
      footerRef.current.dataset.touchPhase = state.phase;
    }

    // Bodies remain mostly stationary — only subtle micro-lean & head incline
    if (leftBodyRef.current) {
      leftBodyRef.current.style.transform = `translate3d(${state.leftBodyShiftPx.toFixed(2)}px, 0, 0) rotate(${state.leftHeadRotateDeg.toFixed(2)}deg)`;
    }
    if (rightBodyRef.current) {
      rightBodyRef.current.style.transform = `translate3d(${state.rightBodyShiftPx.toFixed(2)}px, 0, 0) rotate(${state.rightHeadRotateDeg.toFixed(2)}deg)`;
    }

    // Articulated reaching paws move independently from their shoulder pivots toward the center
    if (leftPawRef.current) {
      leftPawRef.current.style.transform = `translate3d(${state.leftPawTranslateXPct.toFixed(2)}%, ${state.leftPawTranslateYPx.toFixed(2)}px, 0) rotate(${state.leftPawRotateDeg.toFixed(2)}deg)`;
    }
    if (rightPawRef.current) {
      rightPawRef.current.style.transform = `translate3d(${state.rightPawTranslateXPct.toFixed(2)}%, ${state.rightPawTranslateYPx.toFixed(2)}px, 0) rotate(${state.rightPawRotateDeg.toFixed(2)}deg)`;
    }

    // Phase D contact effects (ripple, sumi-e brushstroke, delicate plum blossom)
    if (rippleOuterRef.current) {
      rippleOuterRef.current.style.opacity = state.rippleOpacity.toFixed(3);
      rippleOuterRef.current.style.transform = `translate(-50%, -50%) scale(${state.rippleScale.toFixed(3)})`;
    }
    if (rippleInnerRef.current) {
      const innerOpacity = state.rippleOpacity * 0.72;
      const innerScale = 0.25 + state.contactStrength * 0.72;
      rippleInnerRef.current.style.opacity = innerOpacity.toFixed(3);
      rippleInnerRef.current.style.transform = `translate(-50%, -50%) scale(${innerScale.toFixed(3)})`;
    }
    if (brushstrokeRef.current) {
      const offset = BRUSH_PATH_LENGTH * (1 - state.brushstrokeProgress);
      brushstrokeRef.current.style.strokeDashoffset = offset.toFixed(1);
      brushstrokeRef.current.style.opacity = (state.contactStrength * 0.45).toFixed(3);
    }
    if (blossomRef.current) {
      blossomRef.current.style.opacity = state.blossomOpacity.toFixed(3);
      blossomRef.current.style.transform = `translate(-50%, -50%) scale(${state.blossomScale.toFixed(3)}) rotate(${state.blossomRotateDeg.toFixed(1)}deg)`;
    }
    if (ctaWrapRef.current) {
      const lift = (1 - state.ctaEmphasis) * 6;
      const opacity = 0.84 + state.ctaEmphasis * 0.16;
      ctaWrapRef.current.style.opacity = opacity.toFixed(3);
      ctaWrapRef.current.style.transform = `translate3d(0, ${lift.toFixed(1)}px, 0)`;
    }
  };

  // Scroll-synchronized GSAP ScrollTrigger (`scrub: true`, no autoplay, fully reversible)
  useEffect(() => {
    const footerEl = footerRef.current;
    if (!footerEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // Reduced-motion users receive the calm static touching-paws composition
      applyTouchProgress(1);
      return;
    }

    applyTouchProgress(0);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: footerEl,
        start: "top 68%",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          applyTouchProgress(self.progress);
        },
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  // Keyboard Escape close for Contact Dialog
  useEffect(() => {
    if (!contactOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContactOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [contactOpen]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_CONTENT.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2200);
    } catch {
      try {
        const helper = document.createElement("textarea");
        helper.value = CONTACT_CONTENT.email;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(helper);
        if (ok) {
          setCopiedEmail(true);
          window.setTimeout(() => setCopiedEmail(false), 2200);
        }
      } catch {
        setCopiedEmail(false);
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const n = name.trim();
    const em = email.trim();
    const msg = message.trim();

    if (!n) {
      setError("Please enter your name before sending.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (msg.length < 10) {
      setError("Please write a short note (at least 10 characters).");
      return;
    }

    setError(null);
    setSent(true);
  };

  const {
    realisticBodyUrl,
    realisticPawUrl,
    woodblockBodyUrl,
    woodblockPawUrl,
  } = CONTACT_CONTENT.footerArtwork;

  return (
    <footer
      ref={footerRef}
      id="contact"
      aria-labelledby="contact-heading"
      data-chapter-surface="ivory"
      data-testid="samurai-cat-footer"
      data-touch-phase="entrance"
      data-touch-progress="0.00"
      className="relative overflow-x-clip bg-[#F3E9DE] text-[#792B33] pt-9 sm:pt-11 pb-6 sm:pb-7"
    >
      {/* Subtle handmade washi paper grain texture (pure lightweight CSS, zero heavy SVG filter) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "radial-gradient(#792B33 0.55px, transparent 0.55px), radial-gradient(#792B33 0.45px, transparent 0.45px)",
          backgroundSize: "22px 22px, 31px 31px",
          backgroundPosition: "0 0, 11px 14px",
        }}
      />

      {/* Minimal corner plum blossom branches (desktop/tablet only for serene mobile restraint) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 320 180"
        className="pointer-events-none absolute top-2 left-0 z-[1] hidden md:block w-[210px] lg:w-[260px] h-auto text-[#792B33]"
        fill="none"
      >
        <path
          d="M-10 38 C52 42, 98 62, 158 92 C194 110, 230 112, 266 106"
          stroke="currentColor"
          strokeOpacity="0.34"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M92 60 C118 42, 148 34, 184 36"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M150 88 C166 108, 186 124, 210 132"
          stroke="currentColor"
          strokeOpacity="0.24"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Delicate five-petal ink plum blossoms */}
        {[
          { cx: 146, cy: 40, r: 5.2 },
          { cx: 184, cy: 36, r: 4.1 },
          { cx: 214, cy: 108, r: 5.5 },
          { cx: 256, cy: 106, r: 3.6 },
          { cx: 196, cy: 126, r: 4.0 },
        ].map((b, i) => (
          <g key={i} transform={`translate(${b.cx} ${b.cy})`} fill="currentColor" fillOpacity="0.38">
            <circle cx="0" cy={-b.r * 0.72} r={b.r * 0.48} />
            <circle cx={b.r * 0.68} cy={-b.r * 0.22} r={b.r * 0.48} />
            <circle cx={b.r * 0.42} cy={b.r * 0.58} r={b.r * 0.48} />
            <circle cx={-b.r * 0.42} cy={b.r * 0.58} r={b.r * 0.48} />
            <circle cx={-b.r * 0.68} cy={-b.r * 0.22} r={b.r * 0.48} />
            <circle cx="0" cy="0" r={b.r * 0.28} fill="#F3E9DE" />
          </g>
        ))}
      </svg>

      <svg
        aria-hidden="true"
        viewBox="0 0 320 180"
        className="pointer-events-none absolute top-2 right-0 z-[1] hidden md:block w-[210px] lg:w-[260px] h-auto text-[#792B33] -scale-x-100"
        fill="none"
      >
        <path
          d="M-10 34 C48 44, 96 66, 152 88 C192 104, 224 108, 258 100"
          stroke="currentColor"
          strokeOpacity="0.34"
          strokeWidth="2.0"
          strokeLinecap="round"
        />
        <path
          d="M104 68 C134 48, 166 42, 198 46"
          stroke="currentColor"
          strokeOpacity="0.26"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        {[
          { cx: 158, cy: 48, r: 4.8 },
          { cx: 196, cy: 46, r: 3.8 },
          { cx: 222, cy: 103, r: 5.2 },
          { cx: 120, cy: 76, r: 3.5 },
        ].map((b, i) => (
          <g key={i} transform={`translate(${b.cx} ${b.cy})`} fill="currentColor" fillOpacity="0.36">
            <circle cx="0" cy={-b.r * 0.72} r={b.r * 0.48} />
            <circle cx={b.r * 0.68} cy={-b.r * 0.22} r={b.r * 0.48} />
            <circle cx={b.r * 0.42} cy={b.r * 0.58} r={b.r * 0.48} />
            <circle cx={-b.r * 0.42} cy={b.r * 0.58} r={b.r * 0.48} />
            <circle cx={-b.r * 0.68} cy={-b.r * 0.22} r={b.r * 0.48} />
            <circle cx="0" cy="0" r={b.r * 0.28} fill="#F3E9DE" />
          </g>
        ))}
      </svg>

      {/* ── TOP EDITORIAL HEADER (Calm, restrained — significantly smaller than Hero) ── */}
      <div className="page-container relative z-[10] text-center">
        <p className="m-0 font-mono text-[11px] uppercase tracking-[0.26em] text-[#792B33]/72">
          {CONTACT_CONTENT.chapterNumber} / {CONTACT_CONTENT.chapterLabel}
        </p>

        <h2
          id="contact-heading"
          className="mx-auto mt-2.5 mb-0 max-w-2xl font-serif font-medium leading-[1.06] tracking-[-0.02em] text-[#792B33]"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(32px, 4.1vw, 54px)",
            textWrap: "balance",
          }}
        >
          {CONTACT_CONTENT.heading}
        </h2>

        <p
          className="mx-auto mt-2 mb-0 max-w-xl font-serif italic leading-snug text-[#792B33]/82"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(18px, 1.75vw, 23px)",
          }}
        >
          {CONTACT_CONTENT.supportingStatement}
        </p>
      </div>

      {/* ── MAIN ARTWORK STAGE — "THE TOUCH" (Michelangelo Creation of Adam Reinterpretation) ── */}
      <div
        data-testid="footer-touch-stage"
        className="relative z-[5] mx-auto mt-3 sm:mt-4 w-full max-w-[1520px] h-[200px] sm:h-[270px] md:h-[310px] lg:h-[340px] overflow-hidden select-none"
      >
        {/* Subtle distant Japanese mountain silhouettes near lower horizon (hidden on compact mobile) */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] hidden sm:block h-[42%] w-full text-[#792B33]"
        >
          <path
            d="M0 200 L0 146 Q170 86 350 132 T720 112 T1090 128 T1440 96 L1440 200 Z"
            fill="currentColor"
            fillOpacity="0.055"
          />
          <path
            d="M0 200 L0 166 Q240 124 490 156 T980 140 T1440 154 L1440 200 Z"
            fill="currentColor"
            fillOpacity="0.04"
          />
        </svg>

        {/* Restrained textured burgundy sun behind the central meeting point (stays still during touch) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[73%] sm:top-[75%] z-[2] -translate-x-1/2 -translate-y-1/2"
        >
          <svg
            viewBox="0 0 260 260"
            className="h-[118px] w-[118px] sm:h-[172px] sm:w-[172px] lg:h-[208px] lg:w-[208px]"
            fill="none"
          >
            <defs>
              <radialGradient id="footer-woodblock-sun" cx="46%" cy="44%" r="54%">
                <stop offset="0%" stopColor="#792B33" stopOpacity="0.21" />
                <stop offset="76%" stopColor="#792B33" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#792B33" stopOpacity="0.11" />
              </radialGradient>
            </defs>
            {/* Outer delicate woodblock impression halo */}
            <circle
              cx="130"
              cy="130"
              r="118"
              stroke="#792B33"
              strokeOpacity="0.13"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            {/* Main sun disc */}
            <circle cx="130" cy="130" r="102" fill="url(#footer-woodblock-sun)" />
            {/* Restrained concentric print grain arcs */}
            <path
              d="M54 102 A82 82 0 0 1 206 102"
              stroke="#F3E9DE"
              strokeOpacity="0.32"
              strokeWidth="1"
            />
            <path
              d="M66 158 A76 76 0 0 0 194 158"
              stroke="#F3E9DE"
              strokeOpacity="0.24"
              strokeWidth="0.9"
            />
          </svg>
        </div>

        {/* ── ARTICULATED PAW LAYERS (Tucked deeply behind shoulder armor plates so joints stay seamless across 0-100%) ── */}
        {/* Left Realistic Armored Paw — fingertip kisses exact center (x = 50%) at progress = 1 */}
        <div
          ref={leftPawRef}
          data-testid="footer-left-paw"
          className="pointer-events-none absolute top-[73%] sm:top-[75%] right-[calc(50%-14px)] z-[6] -translate-y-1/2 w-[41%] sm:w-[34.5%] will-change-transform"
          style={{
            transformOrigin: "8% 54%",
          }}
        >
          {!missingAssets.realisticPaw ? (
            <Image
              src={realisticPawUrl}
              alt=""
              width={806}
              height={285}
              sizes="(max-width: 640px) 42vw, 36vw"
              aria-hidden="true"
              referrerPolicy="no-referrer"
              onError={() => markAssetMissing("realisticPaw")}
              className="block h-auto w-full drop-shadow-[0_10px_18px_rgba(121,43,51,0.14)]"
            />
          ) : (
            <div className="h-14 w-full border border-dashed border-[#792B33]/35 bg-[#792B33]/10" />
          )}
        </div>

        {/* Right Woodblock Illustrated Paw — fingertip kisses exact center (x = 50%) at progress = 1 */}
        <div
          ref={rightPawRef}
          data-testid="footer-right-paw"
          className="pointer-events-none absolute top-[74.5%] sm:top-[76.5%] left-[calc(50%-11px)] z-[6] -translate-y-1/2 w-[40%] sm:w-[33.5%] will-change-transform"
          style={{
            transformOrigin: "92% 54%",
          }}
        >
          {!missingAssets.woodblockPaw ? (
            <Image
              src={woodblockPawUrl}
              alt=""
              width={672}
              height={276}
              sizes="(max-width: 640px) 41vw, 35vw"
              aria-hidden="true"
              referrerPolicy="no-referrer"
              onError={() => markAssetMissing("woodblockPaw")}
              className="block h-auto w-full"
            />
          ) : (
            <div className="h-14 w-full border border-dashed border-[#792B33]/35 bg-[#792B33]/10" />
          )}
        </div>

        {/* ── STATIONARY / ANCHORED SAMURAI CAT BODIES (Cropped naturally by outer viewport edges) ── */}
        {/* Left: Realistic 3D Armored Samurai Cat facing right */}
        <div
          ref={leftBodyRef}
          data-testid="footer-left-body"
          className="pointer-events-none absolute -bottom-[8%] sm:-bottom-[17%] -left-[5%] sm:-left-[2.2%] z-[8] w-[33%] sm:w-[23.5%] will-change-transform"
          style={{
            transformOrigin: "18% 85%",
          }}
        >
          {!missingAssets.realisticBody ? (
            <Image
              src={realisticBodyUrl}
              alt="Realistic armored 3D samurai cat extending its paw toward the center"
              width={840}
              height={1125}
              sizes="(max-width: 640px) 34vw, 25vw"
              referrerPolicy="no-referrer"
              onError={() => markAssetMissing("realisticBody")}
              className="block h-auto w-full drop-shadow-[0_14px_26px_rgba(121,43,51,0.16)]"
            />
          ) : (
            <div className="aspect-[3/4] w-full border border-dashed border-[#792B33]/35 bg-[#792B33]/10" />
          )}
        </div>

        {/* Right: Traditional Japanese Woodblock-Print Samurai Cat facing left */}
        <div
          ref={rightBodyRef}
          data-testid="footer-right-body"
          className="pointer-events-none absolute -bottom-[6%] sm:-bottom-[15%] -right-[3%] sm:-right-[1.0%] z-[8] w-[33%] sm:w-[23.5%] will-change-transform"
          style={{
            transformOrigin: "82% 85%",
          }}
        >
          {!missingAssets.woodblockBody ? (
            <Image
              src={woodblockBodyUrl}
              alt="Traditional Japanese burgundy woodblock-print samurai cat extending its paw toward the center"
              width={840}
              height={1125}
              sizes="(max-width: 640px) 34vw, 25vw"
              referrerPolicy="no-referrer"
              onError={() => markAssetMissing("woodblockBody")}
              className="block h-auto w-full"
            />
          ) : (
            <div className="aspect-[3/4] w-full border border-dashed border-[#792B33]/35 bg-[#792B33]/10" />
          )}
        </div>

        {/* ── PHASE D (85–100%) POETIC CONTACT MOMENTS AT EXACT CENTER ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[73.5%] sm:top-[75.5%] z-[12] h-0 w-0"
        >
          {/* Subtle burgundy sumi-e brushstroke expanding calmly along the touch axis */}
          <svg
            viewBox="0 0 280 48"
            className="absolute left-0 top-0 h-10 w-[190px] sm:w-[250px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
            fill="none"
          >
            <path
              ref={brushstrokeRef}
              d="M14 26 C64 21, 114 28, 140 24 C172 20, 224 27, 266 23"
              stroke="#792B33"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray={BRUSH_PATH_LENGTH}
              strokeDashoffset={BRUSH_PATH_LENGTH}
              style={{ opacity: 0 }}
            />
          </svg>

          {/* Subtle concentric ink-like ripples expanding from touching fingertips */}
          <div
            ref={rippleOuterRef}
            className="absolute left-0 top-0 h-20 w-20 sm:h-24 sm:w-24 rounded-full border border-[#792B33]/65 will-change-transform"
            style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0.28)" }}
          />
          <div
            ref={rippleInnerRef}
            className="absolute left-0 top-0 h-12 w-12 sm:h-14 sm:w-14 rounded-full border border-[#792B33]/50 will-change-transform"
            style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0.25)" }}
          />

          {/* Delicate five-petal Japanese plum blossom (ume) revealed at the contact point */}
          <div
            ref={blossomRef}
            data-testid="footer-contact-blossom"
            className="absolute left-0 -top-6 sm:-top-7 will-change-transform"
            style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0.35)" }}
          >
            <svg viewBox="0 0 40 40" className="h-7 w-7 sm:h-8 sm:w-8" fill="none">
              <g transform="translate(20 20)" fill="#792B33">
                <circle cx="0" cy="-7.6" r="5.1" fillOpacity="0.92" />
                <circle cx="7.2" cy="-2.3" r="5.1" fillOpacity="0.92" />
                <circle cx="4.5" cy="6.2" r="5.1" fillOpacity="0.92" />
                <circle cx="-4.5" cy="6.2" r="5.1" fillOpacity="0.92" />
                <circle cx="-7.2" cy="-2.3" r="5.1" fillOpacity="0.92" />
                <circle cx="0" cy="0" r="3.4" fill="#F3E9DE" />
                <circle cx="0" cy="0" r="1.4" fill="#792B33" />
              </g>
            </svg>
          </div>
        </div>

        {/* Soft bottom ivory veil blending lower armor hems smoothly into the CTA zone */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[10] h-9 bg-gradient-to-t from-[#F3E9DE] via-[#F3E9DE]/65 to-transparent"
        />
      </div>

      {/* ── CONTACT CTA & SOCIAL NAVIGATION ── */}
      <div className="page-container relative z-[10] mt-3 sm:mt-4 flex flex-col items-center">
        <div ref={ctaWrapRef} className="will-change-transform">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => {
              setSent(false);
              setError(null);
              setContactOpen(true);
            }}
            data-testid="footer-get-in-touch"
            className="group inline-flex min-h-[46px] items-center gap-3 border border-[#792B33] bg-[#792B33] px-8 py-2.5 font-sans text-sm font-medium tracking-[0.04em] text-[#F3E9DE] shadow-[0_10px_28px_rgba(121,43,51,0.18)] transition-all duration-200 hover:bg-[#F3E9DE] hover:text-[#792B33] focus-visible:outline-2 focus-visible:outline-[#792B33] focus-visible:outline-offset-4 cursor-pointer whitespace-nowrap"
          >
            <span>{CONTACT_CONTENT.ctaLabel}</span>
            <ArrowRight
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </button>
        </div>

        {/* Clean horizontal social navigation row: Email / GitHub / LinkedIn / Resume */}
        <nav
          aria-label="Contact and social links"
          className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-[#792B33]"
        >
          {SOCIAL_LINKS.map((item, idx) => {
            const separator =
              idx < SOCIAL_LINKS.length - 1 ? (
                <span aria-hidden="true" className="text-[#792B33]/34 select-none">
                  /
                </span>
              ) : null;

            if (item.id === "resume") {
              return (
                <span key={item.id} className="inline-flex items-center gap-3">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[34px] items-center px-1.5 font-medium text-[#792B33]/88 underline-offset-4 transition-colors hover:text-[#792B33] hover:underline focus-visible:outline-2 focus-visible:outline-[#792B33]"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={onOpenResume}
                      className="inline-flex min-h-[34px] items-center px-1.5 font-medium text-[#792B33]/88 underline-offset-4 transition-colors hover:text-[#792B33] hover:underline focus-visible:outline-2 focus-visible:outline-[#792B33] cursor-pointer"
                    >
                      {item.label}
                    </button>
                  )}
                  {separator}
                </span>
              );
            }

            return (
              <span key={item.id} className="inline-flex items-center gap-3">
                {item.url ? (
                  <a
                    href={item.url}
                    target={item.url.startsWith("mailto:") ? undefined : "_blank"}
                    rel={item.url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                    className="inline-flex min-h-[34px] items-center px-1.5 font-medium text-[#792B33]/88 underline-offset-4 transition-colors hover:text-[#792B33] hover:underline focus-visible:outline-2 focus-visible:outline-[#792B33]"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span
                    aria-disabled="true"
                    title={item.handlePlaceholder}
                    className="inline-flex min-h-[34px] items-center px-1.5 text-[#792B33]/46 cursor-default"
                  >
                    {item.label}
                  </span>
                )}
                {separator}
              </span>
            );
          })}
        </nav>

        {/* Bottom Legal Line — quiet, unobtrusive end credits */}
        <div className="mt-5 w-full border-t border-[#792B33]/18 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#792B33]/70">
          <p className="m-0 text-center sm:text-left">{CONTACT_CONTENT.legalLeft}</p>
          <p className="m-0 font-mono text-[11px] tracking-[0.04em] text-[#792B33]/66">
            {CONTACT_CONTENT.legalRight}
          </p>
        </div>
      </div>

      {/* ── EDITORIAL CONTACT DIALOG (Opened via "Get in touch →") ── */}
      {contactOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-dialog-title"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#792B33]/40 p-4 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setContactOpen(false);
              triggerRef.current?.focus();
            }
          }}
        >
          <div className="relative w-full max-w-xl border border-[#792B33]/35 bg-[#F3E9DE] p-6 sm:p-8 text-[#792B33] shadow-[0_24px_64px_rgba(121,43,51,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#792B33]/18 pb-4">
              <div>
                <p className="m-0 font-mono text-[11px] uppercase tracking-[0.2em] text-[#792B33]/65">
                  09 / Direct Contact
                </p>
                <h3
                  id="contact-dialog-title"
                  className="mt-1 m-0 font-serif text-3xl font-medium leading-tight text-[#792B33]"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  Start a conversation.
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setContactOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label="Close contact dialog"
                className="inline-flex h-10 w-10 items-center justify-center border border-[#792B33]/28 text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Direct email bar with one-click copy */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#792B33]/14 pb-4">
              <a
                href={`mailto:${CONTACT_CONTENT.email}`}
                className="font-mono text-xs text-[#792B33] underline underline-offset-4 hover:opacity-75"
              >
                {CONTACT_CONTENT.email}
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                aria-label="Copy email address"
                className="inline-flex min-h-[34px] items-center gap-1.5 border border-[#792B33]/30 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#792B33] transition-colors hover:bg-[#792B33] hover:text-[#F3E9DE] cursor-pointer"
              >
                {copiedEmail ? (
                  <>
                    <Check size={13} aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} aria-hidden="true" />
                    <span>Copy Email</span>
                  </>
                )}
              </button>
            </div>

            {sent ? (
              <div
                role="status"
                data-testid="contact-confirmation"
                className="mt-6 border border-[#792B33]/35 bg-[#792B33] p-6 text-[#F3E9DE] space-y-4"
              >
                <p className="m-0 font-mono text-[11px] uppercase tracking-[0.18em] text-[#F3E9DE]/75">
                  Note Prepared
                </p>
                <p
                  className="m-0 font-serif text-3xl leading-tight text-[#F3E9DE]"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  Thank you, {name}.
                </p>
                <p className="m-0 text-sm leading-relaxed text-[#F3E9DE]/86">
                  Your message has been validated for{" "}
                  <span className="font-mono">{CONTACT_CONTENT.email}</span>. You can
                  also launch your mail client directly below.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href={`mailto:${CONTACT_CONTENT.email}?subject=${encodeURIComponent(
                      `Portfolio inquiry from ${name}`
                    )}&body=${encodeURIComponent(message)}`}
                    className="inline-flex min-h-[40px] items-center gap-2 border border-[#F3E9DE] bg-[#F3E9DE] px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[#792B33] no-underline hover:opacity-90"
                  >
                    <span>Open in Mail Client</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setName("");
                      setEmail("");
                      setMessage("");
                    }}
                    className="inline-flex min-h-[40px] items-center border border-[#F3E9DE]/55 px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[#F3E9DE] hover:bg-[#F3E9DE]/12 cursor-pointer"
                  >
                    Write another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#792B33]/78">
                      Name
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full min-h-[44px] border border-[#792B33]/30 bg-[#F3E9DE] px-3.5 py-2 text-sm text-[#792B33] placeholder:text-[#792B33]/42 focus:border-[#792B33] focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="block mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#792B33]/78">
                      Email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      required
                      className="w-full min-h-[44px] border border-[#792B33]/30 bg-[#F3E9DE] px-3.5 py-2 text-sm text-[#792B33] placeholder:text-[#792B33]/42 focus:border-[#792B33] focus:outline-none"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="block mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#792B33]/78">
                    Message
                  </span>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Have an idea, a question, or something unusual in mind?"
                    required
                    className="w-full border border-[#792B33]/30 bg-[#F3E9DE] px-3.5 py-2.5 text-sm text-[#792B33] placeholder:text-[#792B33]/42 focus:border-[#792B33] focus:outline-none"
                  />
                </label>

                {error && (
                  <p role="alert" className="m-0 font-mono text-xs text-[#792B33] underline">
                    {error}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <a
                    href={`mailto:${CONTACT_CONTENT.email}`}
                    className="font-mono text-xs text-[#792B33]/75 underline underline-offset-4 hover:text-[#792B33]"
                  >
                    Open mail client instead
                  </a>
                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center gap-2 bg-[#792B33] px-6 py-2.5 font-mono text-xs uppercase tracking-[0.16em] text-[#F3E9DE] transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    <span>Send Note</span>
                    <Send size={13} strokeWidth={1.7} aria-hidden="true" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </footer>
  );
}
