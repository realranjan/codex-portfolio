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
import footerSakuraCutout from "@/assets/illustrations/footer-sakura-cutout.png";
import footerWavesCutout from "@/assets/illustrations/footer-waves-cutout.png";
import footerColorCatCutout from "@/assets/illustrations/footer-color-cat-cutout.png";
import footerColorPawCutout from "@/assets/illustrations/footer-color-paw-cutout.png";

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
      className="relative overflow-x-clip bg-[#F3E9DE] text-[#792B33] pt-36 sm:pt-44 lg:pt-48 pb-6 sm:pb-7"
    >
      {/* Soft warm sunset atmospheric wash lending subtle color depth behind the footer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 64% 48% at 50% 48%, rgba(244, 184, 89, 0.16) 0%, rgba(217, 72, 54, 0.06) 44%, rgba(243, 233, 222, 0) 78%)",
        }}
      />

      {/* ── COLORFUL SWEEPING JAPANESE SAKURA CHERRY BLOSSOM BRANCHES (Kigo-Studio Style Cutouts) ── */}
      <div
        aria-hidden="true"
        data-testid="footer-sakura-left"
        className="pointer-events-none select-none absolute top-28 sm:top-36 lg:top-40 -left-6 z-[3] hidden md:block w-[270px] lg:w-[355px] xl:w-[400px]"
        style={{
          filter: "drop-shadow(0 12px 22px rgba(121, 43, 51, 0.14))",
        }}
      >
        <Image
          src={footerSakuraCutout}
          alt=""
          referrerPolicy="no-referrer"
          className="block h-auto w-full object-contain"
        />
      </div>

      <div
        aria-hidden="true"
        data-testid="footer-sakura-right"
        className="pointer-events-none select-none absolute top-28 sm:top-36 lg:top-40 -right-6 z-[3] hidden md:block w-[240px] lg:w-[310px] xl:w-[350px] -scale-x-100"
        style={{
          filter: "drop-shadow(0 12px 22px rgba(121, 43, 51, 0.14))",
        }}
      >
        <Image
          src={footerSakuraCutout}
          alt=""
          referrerPolicy="no-referrer"
          className="block h-auto w-full object-contain"
        />
      </div>

      {/* ── TOP EDITORIAL HEADER (With subtle Japanese vermilion seal accent) ── */}
      <div className="page-container relative z-[10] text-center">
        <div className="inline-flex items-center gap-3.5 text-[#792B33]/84">
          <span aria-hidden="true" className="h-px w-8 sm:w-10 bg-gradient-to-r from-transparent to-[#D94836]/65" />
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.26em]">
            {CONTACT_CONTENT.chapterNumber} / {CONTACT_CONTENT.chapterLabel}
          </p>
          <span
            aria-hidden="true"
            className="inline-flex h-5 w-5 items-center justify-center border border-[#C8372D] bg-[#C8372D] font-serif text-[11px] font-semibold leading-none text-[#F3E9DE]"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            縁
          </span>
          <span aria-hidden="true" className="h-px w-8 sm:w-10 bg-gradient-to-l from-transparent to-[#D94836]/65" />
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
        {/* Vibrant Vermilion-to-Gold Japanese Rising Sun + Golden Mist Clouds behind touch point */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[52%] z-[2] -translate-x-1/2 -translate-y-1/2"
        >
          <svg
            viewBox="0 0 320 320"
            className="h-[162px] w-[162px] sm:h-[224px] sm:w-[224px] lg:h-[260px] lg:w-[260px]"
            fill="none"
          >
            <defs>
              <radialGradient id="footer-sun-halo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F5B856" stopOpacity="0.46" />
                <stop offset="65%" stopColor="#E65D3B" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#E65D3B" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="footer-ukiyoe-sun" x1="50%" y1="4%" x2="50%" y2="96%">
                <stop offset="0%" stopColor="#D6362B" stopOpacity="0.96" />
                <stop offset="46%" stopColor="#E96B3A" stopOpacity="0.9" />
                <stop offset="82%" stopColor="#F4B252" stopOpacity="0.72" />
                <stop offset="100%" stopColor="#F9D58B" stopOpacity="0.18" />
              </linearGradient>
              <pattern
                id="footer-sun-grain"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1.5" cy="1.5" r="0.6" fill="#F3E9DE" fillOpacity="0.22" />
                <circle cx="4.5" cy="4.2" r="0.55" fill="#792B33" fillOpacity="0.12" />
              </pattern>
            </defs>
            {/* Soft golden-coral atmospheric halo */}
            <circle cx="160" cy="160" r="154" fill="url(#footer-sun-halo)" />
            {/* Main vibrant vermilion-gold sun disc */}
            <circle cx="160" cy="160" r="118" fill="url(#footer-ukiyoe-sun)" />
            <circle cx="160" cy="160" r="118" fill="url(#footer-sun-grain)" />
            {/* Fine gold-leaf orbital ring */}
            <circle cx="160" cy="160" r="127" stroke="#D4963B" strokeOpacity="0.38" strokeWidth="1.2" strokeDasharray="4 6" />
            {/* Traditional warm ivory & gold mist-cloud streaks */}
            <path
              d="M34 126 Q68 120 102 125 Q118 127 134 126 Q104 133 66 131 Z"
              fill="#F3E9DE"
              fillOpacity="0.82"
            />
            <path
              d="M180 148 Q218 141 258 146 Q278 148 294 146 Q264 154 214 152 Z"
              fill="#F3E9DE"
              fillOpacity="0.84"
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

        {/* ── UNIFIED RIGHT POLYCHROME UKIYO-E SAMURAI CAT FIGURE (Indigo, Vermilion & Gold Armor) ── */}
        <div
          ref={rightCatUnitRef}
          data-testid="footer-right-cat-unit"
          className="pointer-events-none absolute top-0 bottom-0 left-[calc(50%-6px)] z-[6] w-[49vw] sm:w-[clamp(300px,46vw,600px)] will-change-transform"
          style={{
            transformOrigin: "62% 72%",
          }}
        >
          {/* Right Colorful Polychrome Ukiyo-e Paw — indigo/crimson/gold armored cuff reaching left */}
          <div
            data-testid="footer-right-paw"
            className="absolute top-[57%] -left-1 z-[1] w-[47%] -translate-y-1/2"
            style={{
              transformOrigin: "0% 50%",
              transform: "rotate(12deg)",
            }}
          >
            <Image
              src={footerColorPawCutout}
              alt=""
              sizes="(max-width: 640px) 25vw, 300px"
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="block h-auto w-full drop-shadow-[0_10px_18px_rgba(33,54,84,0.2)]"
            />
          </div>

          {/* Right Polychrome Ukiyo-e Samurai Cat Bust — vibrant indigo, turquoise, vermilion & gold */}
          <div
            data-testid="footer-right-body"
            className="absolute -bottom-[7%] sm:-bottom-[11%] right-[10%] sm:right-[14%] z-[2] w-[54%] sm:w-[52%]"
          >
            <Image
              src={footerColorCatCutout}
              alt="Colorful Japanese polychrome ukiyo-e samurai cat in indigo and gold armor reaching toward the center"
              sizes="(max-width: 640px) 28vw, 320px"
              referrerPolicy="no-referrer"
              className="block h-auto w-full drop-shadow-[0_14px_26px_rgba(33,54,84,0.22)]"
            />
          </div>
        </div>

        {/* ── PHASE D (85–100%) COLORFUL POETIC CONTACT MOMENTS AT EXACT CENTER ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[56.5%] z-[12] h-0 w-0"
        >
          {/* Warm gold-vermilion brushstroke expanding along touch axis */}
          <svg
            viewBox="0 0 280 48"
            className="absolute left-0 top-0 h-10 w-[180px] sm:w-[240px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
            fill="none"
          >
            <path
              ref={brushstrokeRef}
              d="M14 26 C64 21, 114 28, 140 24 C172 20, 224 27, 266 23"
              stroke="#D94836"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray={BRUSH_PATH_LENGTH}
              strokeDashoffset={BRUSH_PATH_LENGTH}
              style={{ opacity: 0 }}
            />
          </svg>

          {/* Concentric vermilion & gold-leaf ripples expanding from touching fingertips */}
          <div
            ref={rippleOuterRef}
            className="absolute left-0 top-0 h-20 w-20 sm:h-24 sm:w-24 rounded-full border border-[#D94836]/60 will-change-transform"
            style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0.28)" }}
          />
          <div
            ref={rippleInnerRef}
            className="absolute left-0 top-0 h-12 w-12 sm:h-14 sm:w-14 rounded-full border border-[#E5A33E]/65 will-change-transform"
            style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0.25)" }}
          />

          {/* Colorful rose-pink & gold Japanese sakura blossom revealed right at contact point */}
          <div
            ref={blossomRef}
            data-testid="footer-contact-blossom"
            className="absolute left-0 -top-4 sm:-top-5 will-change-transform"
            style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0.35)" }}
          >
            <svg viewBox="0 0 40 40" className="h-8 w-8 sm:h-9 sm:w-9" fill="none">
              <g transform="translate(20 20)">
                <circle cx="0" cy="-7.8" r="5.2" fill="#F07B93" stroke="#792B33" strokeWidth="0.9" />
                <circle cx="7.4" cy="-2.4" r="5.2" fill="#F2899C" stroke="#792B33" strokeWidth="0.9" />
                <circle cx="4.6" cy="6.4" r="5.2" fill="#EC6F88" stroke="#792B33" strokeWidth="0.9" />
                <circle cx="-4.6" cy="6.4" r="5.2" fill="#F2899C" stroke="#792B33" strokeWidth="0.9" />
                <circle cx="-7.4" cy="-2.4" r="5.2" fill="#F07B93" stroke="#792B33" strokeWidth="0.9" />
                <circle cx="0" cy="0" r="3.6" fill="#F5C056" />
                <circle cx="0" cy="0" r="1.4" fill="#C8372D" />
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

      {/* ── LOWER CORNER COLORFUL UKIYO-E INDIGO WAVES, VERMILION TORII & GOLD CLOUDS ── */}
      <div
        aria-hidden="true"
        data-testid="footer-waves-left"
        className="pointer-events-none select-none absolute bottom-[62px] lg:bottom-[64px] -left-2 lg:left-2 z-[11] hidden md:block w-[210px] lg:w-[275px] xl:w-[310px] opacity-95"
        style={{
          filter: "drop-shadow(0 10px 18px rgba(28, 56, 78, 0.16))",
        }}
      >
        <Image
          src={footerWavesCutout}
          alt=""
          referrerPolicy="no-referrer"
          className="block h-auto w-full object-contain"
        />
      </div>

      <div
        aria-hidden="true"
        data-testid="footer-waves-right"
        className="pointer-events-none select-none absolute bottom-[62px] lg:bottom-[64px] -right-2 lg:right-2 z-[11] hidden md:block w-[210px] lg:w-[275px] xl:w-[310px] -scale-x-100 opacity-95"
        style={{
          filter: "drop-shadow(0 10px 18px rgba(28, 56, 78, 0.16))",
        }}
      >
        <Image
          src={footerWavesCutout}
          alt=""
          referrerPolicy="no-referrer"
          className="block h-auto w-full object-contain"
        />
      </div>

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
