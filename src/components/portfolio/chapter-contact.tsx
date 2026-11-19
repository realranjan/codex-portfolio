"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Briefcase,
  Check,
  Code2,
  Copy,
  FileText,
  Mail,
  Send,
  X,
} from "lucide-react";
import { CONTACT_CONTENT, SOCIAL_LINKS } from "@/data/portfolio-content";
import { computeFooterTouchState } from "@/lib/footer-touch";

gsap.registerPlugin(ScrollTrigger);

interface ChapterContactProps {
  onOpenResume: () => void;
}

const BRUSH_PATH_LENGTH = 260;

/**
 * 09 / CONTACT — CINEMATIC JAPANESE SAMURAI CAT FOOTER ("THE TOUCH")
 *
 * Michelangelo "The Creation of Adam" whole-figure composition:
 * - Left:  Realistic armored 3D Samurai Cat (body + proportionate reaching arm bonded as ONE unit)
 * - Right: Traditional Japanese ukiyo-e woodblock Samurai Cat (body + proportionate arm bonded as ONE unit)
 *
 * As the visitor scrolls, both entire cats glide smoothly inward from the outer edges
 * until their paws gently kiss in front of the textured burgundy sun.
 * Strictly scroll-driven via GSAP ScrollTrigger (`scrub: true`, zero autoplay, 100% reversible).
 * Strict palette: Warm Ivory (#F3E9DE) paper + Deep Burgundy (#792B33) ink & typography.
 */
export function ChapterContact({ onOpenResume }: ChapterContactProps) {
  const footerRef = useRef<HTMLElement>(null);

  // Unified whole-cat composite refs (each body + proportionate arm glides together as one figure)
  const leftCatUnitRef = useRef<HTMLDivElement>(null);
  const rightCatUnitRef = useRef<HTMLDivElement>(null);

  // Phase D (85–100%) restrained contact moment refs
  const rippleOuterRef = useRef<HTMLDivElement>(null);
  const rippleInnerRef = useRef<HTMLDivElement>(null);
  const brushstrokeRef = useRef<SVGPathElement>(null);
  const blossomRef = useRef<HTMLDivElement>(null);
  const ctaWrapRef = useRef<HTMLDivElement>(null);

  // Contact dialog state
  const [contactOpen, setContactOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Zero-broken-image fallback tracking
  const [missingAssets, setMissingAssets] = useState<Record<string, boolean>>({});
  const markAssetMissing = (key: string) => {
    setMissingAssets((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  // Apply deterministic whole-cat scroll choreography directly to compositor-only transforms/opacity
  const applyTouchProgress = (rawProgress: number) => {
    const state = computeFooterTouchState(rawProgress);

    if (footerRef.current) {
      footerRef.current.dataset.touchProgress = state.progress.toFixed(2);
      footerRef.current.dataset.touchPhase = state.phase;
    }

    // Whole-cat sculptural glide inward toward the central touch point (zero detached arm sliding)
    if (leftCatUnitRef.current) {
      leftCatUnitRef.current.style.transform = `translate3d(${state.leftCatTranslateXPct.toFixed(2)}%, ${state.leftCatTranslateYPx.toFixed(2)}px, 0) rotate(${state.leftCatRotateDeg.toFixed(2)}deg)`;
    }
    if (rightCatUnitRef.current) {
      rightCatUnitRef.current.style.transform = `translate3d(${state.rightCatTranslateXPct.toFixed(2)}%, ${state.rightCatTranslateYPx.toFixed(2)}px, 0) rotate(${state.rightCatRotateDeg.toFixed(2)}deg)`;
    }

    // Phase D poetic contact details (ripple, sumi-e brushstroke, delicate plum blossom)
    if (rippleOuterRef.current) {
      rippleOuterRef.current.style.opacity = state.rippleOpacity.toFixed(3);
      rippleOuterRef.current.style.transform = `translate(-50%, -50%) scale(${state.rippleScale.toFixed(3)})`;
    }
    if (rippleInnerRef.current) {
      const innerOpacity = state.rippleOpacity * 0.68;
      const innerScale = 0.25 + state.contactStrength * 0.68;
      rippleInnerRef.current.style.opacity = innerOpacity.toFixed(3);
      rippleInnerRef.current.style.transform = `translate(-50%, -50%) scale(${innerScale.toFixed(3)})`;
    }
    if (brushstrokeRef.current) {
      const offset = BRUSH_PATH_LENGTH * (1 - state.brushstrokeProgress);
      brushstrokeRef.current.style.strokeDashoffset = offset.toFixed(1);
      brushstrokeRef.current.style.opacity = (state.contactStrength * 0.42).toFixed(3);
    }
    if (blossomRef.current) {
      blossomRef.current.style.opacity = state.blossomOpacity.toFixed(3);
      blossomRef.current.style.transform = `translate(-50%, -50%) scale(${state.blossomScale.toFixed(3)}) rotate(${state.blossomRotateDeg.toFixed(1)}deg)`;
    }
    if (ctaWrapRef.current) {
      const lift = (1 - state.ctaEmphasis) * 5;
      const opacity = 0.88 + state.ctaEmphasis * 0.12;
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
      applyTouchProgress(1);
      return;
    }

    applyTouchProgress(0);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: footerEl,
        start: "top 78%",
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

  const renderSocialIcon = (id: string) => {
    switch (id) {
      case "email":
        return <Mail size={15} strokeWidth={1.65} aria-hidden="true" />;
      case "github":
        return <Code2 size={15} strokeWidth={1.65} aria-hidden="true" />;
      case "linkedin":
        return <Briefcase size={15} strokeWidth={1.65} aria-hidden="true" />;
      case "resume":
        return <FileText size={15} strokeWidth={1.65} aria-hidden="true" />;
      default:
        return null;
    }
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
      className="relative overflow-x-clip bg-[#F3E9DE] text-[#792B33] pt-10 sm:pt-12 pb-6 sm:pb-7"
    >
      {/* Subtle handmade washi paper grain texture (pure lightweight CSS) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(#792B33 0.55px, transparent 0.55px), radial-gradient(#792B33 0.45px, transparent 0.45px)",
          backgroundSize: "20px 20px, 29px 29px",
          backgroundPosition: "0 0, 10px 13px",
        }}
      />

      {/* ── UPPER CORNER PLUM BLOSSOM BRANCHES (Left: filled dark-burgundy | Right: woodblock outline) ── */}
      <svg
        aria-hidden="true"
        viewBox="0 0 380 240"
        className="pointer-events-none absolute top-0 left-0 z-[2] hidden md:block w-[240px] lg:w-[320px] h-auto text-[#792B33]"
        fill="none"
      >
        {/* Main dark gnarled ink branch */}
        <path
          d="M-12 118 C36 92, 74 62, 134 42 C188 24, 246 18, 304 6"
          stroke="currentColor"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <path
          d="M66 72 C108 78, 152 68, 206 48"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M42 94 C72 122, 98 148, 128 164"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M156 36 C178 18, 202 8, 228 -4"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Filled burgundy five-petal plum blossoms */}
        {[
          { cx: 146, cy: 48, r: 19 },
          { cx: 68, cy: 132, r: 15 },
          { cx: 48, cy: 44, r: 13 },
          { cx: 214, cy: 36, r: 10 },
          { cx: 102, cy: 76, r: 9 },
        ].map((b, i) => (
          <g key={i} transform={`translate(${b.cx} ${b.cy})`} fill="currentColor">
            <circle cx="0" cy={-b.r * 0.56} r={b.r * 0.44} fillOpacity="0.92" />
            <circle cx={b.r * 0.53} cy={-b.r * 0.17} r={b.r * 0.44} fillOpacity="0.92" />
            <circle cx={b.r * 0.33} cy={b.r * 0.45} r={b.r * 0.44} fillOpacity="0.92" />
            <circle cx={-b.r * 0.33} cy={b.r * 0.45} r={b.r * 0.44} fillOpacity="0.92" />
            <circle cx={-b.r * 0.53} cy={-b.r * 0.17} r={b.r * 0.44} fillOpacity="0.92" />
            <circle cx="0" cy="0" r={b.r * 0.24} fill="#F3E9DE" fillOpacity="0.88" />
            <circle cx="0" cy="0" r={b.r * 0.1} fill="currentColor" />
          </g>
        ))}
        {/* Drifting petals */}
        <path d="M188 94 C196 86, 208 88, 204 98 C198 104, 186 102, 188 94 Z" fill="currentColor" fillOpacity="0.86" />
        <path d="M98 176 C106 170, 118 176, 112 188 C104 192, 94 184, 98 176 Z" fill="currentColor" fillOpacity="0.82" />
        <path d="M244 120 C250 115, 259 118, 255 125 C250 129, 242 126, 244 120 Z" fill="currentColor" fillOpacity="0.72" />
      </svg>

      {/* Right woodblock-outlined plum branch mirroring the right cat's traditional print aesthetic */}
      <svg
        aria-hidden="true"
        viewBox="0 0 380 240"
        className="pointer-events-none absolute top-0 right-0 z-[2] hidden md:block w-[240px] lg:w-[320px] h-auto text-[#792B33]"
        fill="none"
      >
        <path
          d="M392 46 C340 74, 294 98, 232 132 C192 154, 160 176, 130 202"
          stroke="currentColor"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        <path
          d="M312 86 C272 72, 232 64, 188 68"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M254 120 C272 146, 286 168, 294 194"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Woodblock-outlined ivory-filled plum blossoms */}
        {[
          { cx: 298, cy: 48, r: 19 },
          { cx: 232, cy: 64, r: 16 },
          { cx: 288, cy: 112, r: 14 },
          { cx: 196, cy: 148, r: 12 },
          { cx: 342, cy: 96, r: 13 },
        ].map((b, i) => (
          <g key={i} transform={`translate(${b.cx} ${b.cy})`}>
            <circle cx="0" cy={-b.r * 0.56} r={b.r * 0.43} fill="#F3E9DE" stroke="currentColor" strokeWidth="1.5" />
            <circle cx={b.r * 0.53} cy={-b.r * 0.17} r={b.r * 0.43} fill="#F3E9DE" stroke="currentColor" strokeWidth="1.5" />
            <circle cx={b.r * 0.33} cy={b.r * 0.45} r={b.r * 0.43} fill="#F3E9DE" stroke="currentColor" strokeWidth="1.5" />
            <circle cx={-b.r * 0.33} cy={b.r * 0.45} r={b.r * 0.43} fill="#F3E9DE" stroke="currentColor" strokeWidth="1.5" />
            <circle cx={-b.r * 0.53} cy={-b.r * 0.17} r={b.r * 0.43} fill="#F3E9DE" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="0" cy="0" r={b.r * 0.24} fill="#F3E9DE" stroke="currentColor" strokeWidth="1.1" />
            <circle cx="0" cy="0" r={b.r * 0.08} fill="currentColor" />
          </g>
        ))}
        {/* Drifting outlined petals */}
        <path d="M164 102 C171 95, 181 98, 177 107 C171 112, 162 108, 164 102 Z" fill="#F3E9DE" stroke="currentColor" strokeWidth="1.3" />
        <path d="M116 178 C122 172, 132 175, 128 183 C122 188, 114 184, 116 178 Z" fill="#F3E9DE" stroke="currentColor" strokeWidth="1.3" />
      </svg>

      {/* ── TOP EDITORIAL HEADER (Calm, restrained — significantly smaller than Hero) ── */}
      <div className="page-container relative z-[10] text-center">
        <div className="inline-flex items-center gap-4 text-[#792B33]/78">
          <span aria-hidden="true" className="h-px w-8 sm:w-10 bg-[#792B33]/42" />
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.26em]">
            {CONTACT_CONTENT.chapterNumber} / {CONTACT_CONTENT.chapterLabel}
          </p>
          <span aria-hidden="true" className="h-px w-8 sm:w-10 bg-[#792B33]/42" />
        </div>

        <h2
          id="contact-heading"
          className="mx-auto mt-3 mb-0 max-w-2xl font-serif font-semibold leading-[1.04] tracking-[-0.02em] text-[#792B33]"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(34px, 4.3vw, 58px)",
            textWrap: "balance",
          }}
        >
          <em className="italic font-semibold">The story</em> isn&apos;t finished.
        </h2>

        <p
          className="mx-auto mt-2 mb-0 max-w-xl font-serif italic leading-snug text-[#792B33]/86"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(18px, 1.8vw, 24px)",
          }}
        >
          {CONTACT_CONTENT.supportingStatement}
        </p>
      </div>

      {/* ── MAIN ARTWORK STAGE — FULL-WIDTH WHOLE-CAT MICHELANGELO GLIDE ── */}
      <div
        data-testid="footer-touch-stage"
        className="relative z-[5] mt-2 sm:mt-3 w-full h-[215px] sm:h-[290px] md:h-[330px] lg:h-[360px] overflow-hidden select-none"
      >
        {/* Textured Woodblock Burgundy Sun + Minimal Japanese Mist Clouds behind touch point */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[52%] z-[2] -translate-x-1/2 -translate-y-1/2"
        >
          <svg
            viewBox="0 0 300 300"
            className="h-[146px] w-[146px] sm:h-[205px] sm:w-[205px] lg:h-[238px] lg:w-[238px]"
            fill="none"
          >
            <defs>
              <linearGradient id="footer-ukiyoe-sun" x1="50%" y1="4%" x2="50%" y2="96%">
                <stop offset="0%" stopColor="#792B33" stopOpacity="0.88" />
                <stop offset="48%" stopColor="#792B33" stopOpacity="0.58" />
                <stop offset="82%" stopColor="#792B33" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#792B33" stopOpacity="0.04" />
              </linearGradient>
              <pattern
                id="footer-sun-grain"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1.5" cy="1.5" r="0.6" fill="#F3E9DE" fillOpacity="0.22" />
                <circle cx="4.5" cy="4.2" r="0.55" fill="#F3E9DE" fillOpacity="0.18" />
              </pattern>
            </defs>
            {/* Main textured burgundy sun disc */}
            <circle cx="150" cy="150" r="118" fill="url(#footer-ukiyoe-sun)" />
            <circle cx="150" cy="150" r="118" fill="url(#footer-sun-grain)" />
            {/* Minimal traditional horizontal mist-cloud streaks */}
            <path
              d="M36 122 Q68 117 98 121 Q114 123 128 122 Q100 128 66 126 Z"
              fill="#F3E9DE"
              fillOpacity="0.72"
            />
            <path
              d="M172 142 Q208 136 248 140 Q268 142 284 140 Q254 148 206 146 Z"
              fill="#F3E9DE"
              fillOpacity="0.76"
            />
          </svg>
        </div>

        {/* ── UNIFIED LEFT SAMURAI CAT FIGURE (Body + Proportionate Reaching Arm Glide Together as ONE) ── */}
        <div
          ref={leftCatUnitRef}
          data-testid="footer-left-cat-unit"
          className="pointer-events-none absolute top-0 bottom-0 right-[calc(50%-6px)] z-[6] w-[49vw] sm:w-[clamp(300px,46vw,600px)] will-change-transform"
          style={{
            transformOrigin: "38% 72%",
          }}
        >
          {/* Left Proportionate Armored Paw — deeply tucked into shoulder armor, reaching upward like Creation of Adam */}
          <div
            data-testid="footer-left-paw"
            className="absolute top-[56.5%] right-0 z-[1] w-[48%] -translate-y-1/2"
            style={{
              transformOrigin: "100% 50%",
              transform: "rotate(-13deg)",
            }}
          >
            {!missingAssets.realisticPaw ? (
              <Image
                src={realisticPawUrl}
                alt=""
                width={806}
                height={285}
                sizes="(max-width: 640px) 26vw, 310px"
                aria-hidden="true"
                referrerPolicy="no-referrer"
                onError={() => markAssetMissing("realisticPaw")}
                className="block h-auto w-full drop-shadow-[0_10px_18px_rgba(121,43,51,0.16)]"
              />
            ) : (
              <div className="h-12 w-full border border-dashed border-[#792B33]/35 bg-[#792B33]/10" />
            )}
          </div>

          {/* Left Realistic Armored Samurai Cat Body — solidly overlaps inner shoulder sleeve */}
          <div
            data-testid="footer-left-body"
            className="absolute -bottom-[8%] sm:-bottom-[12%] left-[12%] sm:left-[16%] z-[2] w-[54%] sm:w-[52%]"
          >
            {!missingAssets.realisticBody ? (
              <Image
                src={realisticBodyUrl}
                alt="Realistic armored 3D samurai cat reaching toward the center"
                width={840}
                height={1125}
                sizes="(max-width: 640px) 28vw, 320px"
                referrerPolicy="no-referrer"
                onError={() => markAssetMissing("realisticBody")}
                className="block h-auto w-full drop-shadow-[0_14px_26px_rgba(121,43,51,0.18)]"
              />
            ) : (
              <div className="aspect-[3/4] w-full border border-dashed border-[#792B33]/35 bg-[#792B33]/10" />
            )}
          </div>
        </div>

        {/* ── UNIFIED RIGHT WOODBLOCK SAMURAI CAT FIGURE (Body + Proportionate Arm Glide Together as ONE) ── */}
        <div
          ref={rightCatUnitRef}
          data-testid="footer-right-cat-unit"
          className="pointer-events-none absolute top-0 bottom-0 left-[calc(50%-6px)] z-[6] w-[49vw] sm:w-[clamp(300px,46vw,600px)] will-change-transform"
          style={{
            transformOrigin: "62% 72%",
          }}
        >
          {/* Right Proportionate Woodblock Paw — deeply tucked into shoulder armor, reaching upward */}
          <div
            data-testid="footer-right-paw"
            className="absolute top-[57%] left-0 z-[1] w-[47%] -translate-y-1/2"
            style={{
              transformOrigin: "0% 50%",
              transform: "rotate(13deg)",
            }}
          >
            {!missingAssets.woodblockPaw ? (
              <Image
                src={woodblockPawUrl}
                alt=""
                width={672}
                height={276}
                sizes="(max-width: 640px) 25vw, 300px"
                aria-hidden="true"
                referrerPolicy="no-referrer"
                onError={() => markAssetMissing("woodblockPaw")}
                className="block h-auto w-full"
              />
            ) : (
              <div className="h-12 w-full border border-dashed border-[#792B33]/35 bg-[#792B33]/10" />
            )}
          </div>

          {/* Right Traditional Woodblock Samurai Cat Body — solidly overlaps inner shoulder sleeve */}
          <div
            data-testid="footer-right-body"
            className="absolute -bottom-[6%] sm:-bottom-[10%] right-[10%] sm:right-[14%] z-[2] w-[54%] sm:w-[52%]"
          >
            {!missingAssets.woodblockBody ? (
              <Image
                src={woodblockBodyUrl}
                alt="Traditional Japanese burgundy woodblock-print samurai cat reaching toward the center"
                width={840}
                height={1125}
                sizes="(max-width: 640px) 28vw, 320px"
                referrerPolicy="no-referrer"
                onError={() => markAssetMissing("woodblockBody")}
                className="block h-auto w-full"
              />
            ) : (
              <div className="aspect-[3/4] w-full border border-dashed border-[#792B33]/35 bg-[#792B33]/10" />
            )}
          </div>
        </div>

        {/* ── PHASE D (85–100%) POETIC CONTACT MOMENTS AT EXACT CENTER ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[56.5%] z-[12] h-0 w-0"
        >
          {/* Subtle burgundy sumi-e brushstroke expanding calmly along the touch axis */}
          <svg
            viewBox="0 0 280 48"
            className="absolute left-0 top-0 h-10 w-[180px] sm:w-[240px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
            fill="none"
          >
            <path
              ref={brushstrokeRef}
              d="M14 26 C64 21, 114 28, 140 24 C172 20, 224 27, 266 23"
              stroke="#792B33"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeDasharray={BRUSH_PATH_LENGTH}
              strokeDashoffset={BRUSH_PATH_LENGTH}
              style={{ opacity: 0 }}
            />
          </svg>

          {/* Subtle concentric ink-like ripples expanding from touching fingertips */}
          <div
            ref={rippleOuterRef}
            className="absolute left-0 top-0 h-20 w-20 sm:h-24 sm:w-24 rounded-full border border-[#792B33]/55 will-change-transform"
            style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0.28)" }}
          />
          <div
            ref={rippleInnerRef}
            className="absolute left-0 top-0 h-12 w-12 sm:h-14 sm:w-14 rounded-full border border-[#792B33]/42 will-change-transform"
            style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0.25)" }}
          />

          {/* Delicate five-petal Japanese plum blossom (ume) revealed above contact point */}
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

        {/* Soft ivory mist gradient + billowing cloud silhouette blending lower armor cleanly into paper */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[9] h-16 sm:h-24 bg-gradient-to-t from-[#F3E9DE] via-[#F3E9DE]/82 to-transparent"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[10] h-[48px] sm:h-[68px] w-full"
        >
          <path
            d="M0 120 L0 64 Q120 34 250 56 Q370 76 510 52 Q640 34 720 48 Q810 62 940 44 Q1080 28 1210 54 Q1330 72 1440 46 L1440 120 Z"
            fill="#F3E9DE"
            fillOpacity="0.72"
          />
          <path
            d="M0 120 L0 86 Q180 58 360 80 Q540 96 720 74 Q900 54 1080 78 Q1260 96 1440 70 L1440 120 Z"
            fill="#F3E9DE"
          />
        </svg>
      </div>

      {/* ── LOWER CORNER TRADITIONAL WOODBLOCK MOUNTAIN SILHOUETTES (Desktop/Tablet) ── */}
      <svg
        aria-hidden="true"
        viewBox="0 0 340 110"
        className="pointer-events-none absolute bottom-11 left-0 z-[3] hidden sm:block w-[220px] lg:w-[300px] h-auto text-[#792B33]"
        fill="none"
      >
        <path
          d="M0 110 L0 74 L48 44 L86 58 L138 14 L194 64 L236 52 L310 110 Z"
          fill="currentColor"
          fillOpacity="0.13"
        />
        <path
          d="M0 74 L48 44 L86 58 L138 14 L194 64 L236 52 L310 110"
          stroke="currentColor"
          strokeOpacity="0.34"
          strokeWidth="1.3"
        />
        <path
          d="M138 14 L126 42 M138 14 L154 48 M138 14 L168 62 M48 44 L62 66"
          stroke="currentColor"
          strokeOpacity="0.26"
          strokeWidth="1"
        />
      </svg>

      <svg
        aria-hidden="true"
        viewBox="0 0 340 110"
        className="pointer-events-none absolute bottom-11 right-0 z-[3] hidden sm:block w-[220px] lg:w-[300px] h-auto text-[#792B33] -scale-x-100"
        fill="none"
      >
        <path
          d="M0 110 L0 72 L56 38 L102 60 L152 12 L212 68 L264 56 L326 110 Z"
          fill="currentColor"
          fillOpacity="0.13"
        />
        <path
          d="M0 72 L56 38 L102 60 L152 12 L212 68 L264 56 L326 110"
          stroke="currentColor"
          strokeOpacity="0.34"
          strokeWidth="1.3"
        />
        <path
          d="M152 12 L138 44 M152 12 L166 50 M152 12 L182 68 M56 38 L70 62"
          stroke="currentColor"
          strokeOpacity="0.26"
          strokeWidth="1"
        />
      </svg>

      {/* ── CONTACT CTA & SOCIAL NAVIGATION ── */}
      <div className="page-container relative z-[10] -mt-3 sm:-mt-5 flex flex-col items-center">
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
            className="group inline-flex min-h-[48px] items-center gap-3 rounded-full border border-[#792B33] bg-[#792B33] px-9 py-2.5 font-serif text-base font-medium tracking-[0.02em] text-[#F3E9DE] shadow-[0_12px_30px_rgba(121,43,51,0.24)] transition-all duration-200 hover:bg-[#F3E9DE] hover:text-[#792B33] focus-visible:outline-2 focus-visible:outline-[#792B33] focus-visible:outline-offset-4 cursor-pointer whitespace-nowrap"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "19px" }}
          >
            <span>{CONTACT_CONTENT.ctaLabel}</span>
            <ArrowRight
              size={17}
              strokeWidth={1.7}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </button>
        </div>

        {/* Clean horizontal social navigation row: Email | GitHub | LinkedIn | Resume */}
        <nav
          aria-label="Contact and social links"
          className="mt-5 flex flex-wrap items-center justify-center gap-x-2.5 sm:gap-x-4 gap-y-1.5 text-xs sm:text-sm text-[#792B33]"
        >
          {SOCIAL_LINKS.map((item, idx) => {
            const separator =
              idx < SOCIAL_LINKS.length - 1 ? (
                <span aria-hidden="true" className="h-3.5 w-px bg-[#792B33]/32 select-none" />
              ) : null;

            if (item.id === "resume") {
              return (
                <span key={item.id} className="inline-flex items-center gap-2.5 sm:gap-4">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[34px] items-center gap-1.5 sm:gap-2 px-0.5 sm:px-1 font-medium text-[#792B33]/90 underline-offset-4 transition-colors hover:text-[#792B33] hover:underline focus-visible:outline-2 focus-visible:outline-[#792B33]"
                    >
                      {renderSocialIcon(item.id)}
                      <span>{item.label}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={onOpenResume}
                      className="inline-flex min-h-[34px] items-center gap-1.5 sm:gap-2 px-0.5 sm:px-1 font-medium text-[#792B33]/90 underline-offset-4 transition-colors hover:text-[#792B33] hover:underline focus-visible:outline-2 focus-visible:outline-[#792B33] cursor-pointer"
                    >
                      {renderSocialIcon(item.id)}
                      <span>{item.label}</span>
                    </button>
                  )}
                  {separator}
                </span>
              );
            }

            return (
              <span key={item.id} className="inline-flex items-center gap-2.5 sm:gap-4">
                {item.url ? (
                  <a
                    href={item.url}
                    target={item.url.startsWith("mailto:") ? undefined : "_blank"}
                    rel={item.url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                    className="inline-flex min-h-[34px] items-center gap-1.5 sm:gap-2 px-0.5 sm:px-1 font-medium text-[#792B33]/90 underline-offset-4 transition-colors hover:text-[#792B33] hover:underline focus-visible:outline-2 focus-visible:outline-[#792B33]"
                  >
                    {renderSocialIcon(item.id)}
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <span
                    aria-disabled="true"
                    title={item.handlePlaceholder}
                    className="inline-flex min-h-[34px] items-center gap-1.5 sm:gap-2 px-0.5 sm:px-1 text-[#792B33]/52 cursor-default"
                  >
                    {renderSocialIcon(item.id)}
                    <span>{item.label}</span>
                  </span>
                )}
                {separator}
              </span>
            );
          })}
        </nav>

        {/* Bottom Legal Line — quiet, unobtrusive end credits */}
        <div className="mt-5 w-full border-t border-[#792B33]/28 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#792B33]/82">
          <p className="m-0 text-center sm:text-left font-serif text-[14px]" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
            {CONTACT_CONTENT.legalLeft}
          </p>
          <p className="m-0 font-serif italic text-[14px] text-[#792B33]/78" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
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
