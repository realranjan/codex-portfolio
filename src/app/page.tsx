"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { MotionConfig } from "motion/react";
import { ArrowDown, ArrowUp, Check, Copy, Send } from "lucide-react";
import {
  DISCIPLINES,
  IDENTITY,
  STACK_CATEGORIES,
  type ProjectCaseStudy,
} from "@/data/portfolio";
import { computeSpatialScrollState } from "@/lib/motion";
import type { SpatialControlValues } from "@/components/particle-portrait";
import AsciiBackground from "@/components/ascii-background";
import { AsciiScramble } from "@/components/motion/ascii-scramble";
import { DirectionalMediaReveal } from "@/components/motion/directional-media-reveal";
import { MaskedLineReveal } from "@/components/motion/masked-line-reveal";
import { ScrollWordReveal } from "@/components/motion/scroll-word-reveal";
import { CareerJourney } from "@/components/portfolio/career-journey";
import { ProjectFlyout } from "@/components/portfolio/project-flyout";
import { ProjectsGallerySection } from "@/components/portfolio/projects-gallery-section";
import { ResumeModal } from "@/components/portfolio/resume-modal";
import { SiteNav } from "@/components/portfolio/site-nav";
import { SpatialStudy } from "@/components/portfolio/spatial-study";

gsap.registerPlugin(ScrollTrigger);

const ParticlePortrait = dynamic(() => import("@/components/particle-portrait"), {
  ssr: false,
});
const LightRays = dynamic(() => import("@/components/light-rays"), {
  ssr: false,
});

export default function Home() {
  const pageRef = useRef<HTMLElement>(null);
  const heroRunwayRef = useRef<HTMLDivElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const asciiLayerRef = useRef<HTMLDivElement>(null);
  const raysLayerRef = useRef<HTMLDivElement>(null);
  const heroScrollPctRef = useRef<HTMLSpanElement>(null);
  const spatialProgressRef = useRef<number>(0);
  const spatialControlsRef = useRef<SpatialControlValues>({
    densityScale: 1.0,
    lightAzimuth: 0,
    dispersionBoost: 0,
  });

  const [selectedProject, setSelectedProject] = useState<ProjectCaseStudy | null>(null);
  const [lastTriggerId, setLastTriggerId] = useState<string | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({ autoRaf: true, anchors: true });
    const syncScrollTrigger = () => ScrollTrigger.update();
    lenis.on("scroll", syncScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.from("[data-hero-intro]", {
        y: 14,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });

      const applyHeroState = (progress: number) => {
        spatialProgressRef.current = progress;
        const state = computeSpatialScrollState(progress);

        if (heroCopyRef.current) {
          heroCopyRef.current.style.transform = `translate3d(0, ${state.textDriftY}px, 0)`;
          heroCopyRef.current.style.opacity = String(state.textOpacity);
        }

        if (asciiLayerRef.current) {
          asciiLayerRef.current.style.transform = `translate3d(${state.bgDriftX}%, ${state.bgDriftY}%, 0) scale(${state.bgScale})`;
          asciiLayerRef.current.style.opacity = String(state.bgOpacity);
        }

        if (raysLayerRef.current) {
          raysLayerRef.current.style.transform = `translate3d(0, ${state.raysShiftY}px, 0)`;
        }

        if (heroScrollPctRef.current) {
          const pct = Math.round(state.progress * 100);
          heroScrollPctRef.current.textContent = `SCROLL DEPTH ${String(pct).padStart(2, "0")}%`;
        }
      };

      applyHeroState(0);

      if (heroRunwayRef.current) {
        ScrollTrigger.create({
          trigger: heroRunwayRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => applyHeroState(self.progress),
        });
      }

      const parallaxTargets: Array<{ selector: string; fromY: number; toY: number; trigger?: string }> = [
        { selector: '[data-parallax="ascii-ambient"]', fromY: -48, toY: 48, trigger: "#about" },
        { selector: '[data-parallax="prose"]', fromY: 20, toY: -20 },
        { selector: '[data-parallax="portrait"]', fromY: 56, toY: -56 },
        { selector: '[data-parallax="gallery-ring"]', fromY: 26, toY: -26, trigger: "#projects" },
        { selector: '[data-parallax="contact-form"]', fromY: 30, toY: -22, trigger: "#contact" },
      ];

      for (const item of parallaxTargets) {
        const el = document.querySelector<HTMLElement>(item.selector);
        if (!el) continue;
        const triggerEl = item.trigger
          ? document.querySelector<HTMLElement>(item.trigger) ?? el
          : el;

        gsap.fromTo(
          el,
          { y: item.fromY },
          {
            y: item.toY,
            ease: "none",
            scrollTrigger: {
              trigger: triggerEl,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      }

      ScrollTrigger.refresh();
    }, pageRef);

    return () => {
      ctx.revert();
      lenis.off("scroll", syncScrollTrigger);
      lenis.destroy();
    };
  }, []);

  const handleOpenProject = (project: ProjectCaseStudy) => {
    setLastTriggerId(`project-trigger-${project.id}`);
    setSelectedProject(project);
  };

  const handleCloseProject = () => {
    setSelectedProject(null);
    if (lastTriggerId) {
      window.requestAnimationFrame(() => {
        document.getElementById(lastTriggerId)?.focus();
      });
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(IDENTITY.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2200);
    } catch {
      try {
        const helper = document.createElement("textarea");
        helper.value = IDENTITY.email;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(helper);
        if (copied) {
          setCopiedEmail(true);
          window.setTimeout(() => setCopiedEmail(false), 2200);
          return;
        }
      } catch {
        // Ignore fallback failure
      }
      setCopiedEmail(false);
    }
  };

  const handleContactSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = contactName.trim();
    const trimmedEmail = contactEmail.trim();
    const trimmedMessage = contactMessage.trim();

    if (!trimmedName) {
      setContactError("Please enter your name before sending.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setContactError("Please enter a valid email address.");
      return;
    }
    if (trimmedMessage.length < 10) {
      setContactError("Please include a brief note (at least 10 characters).");
      return;
    }

    setContactError(null);
    setContactSent(true);
  };

  return (
    <MotionConfig reducedMotion="user">
      <SiteNav onOpenResume={() => setResumeOpen(true)} />

      <main ref={pageRef} id="main-content">
        {/* 01 / HERO & SPATIAL SCULPTURE RUNWAY */}
        <div
          ref={heroRunwayRef}
          className="hero-runway relative min-h-[165svh] md:min-h-[215svh]"
          id="top"
        >
          <section
            className="hero-section sticky top-0 h-[100svh] min-h-[100svh] cursor-grab active:cursor-grabbing"
            aria-labelledby="hero-heading"
          >
            <AsciiBackground ref={asciiLayerRef} />

            <div
              ref={raysLayerRef}
              className="pointer-events-none absolute inset-0 z-[1] will-change-transform"
            >
              <LightRays
                className="hero-rays"
                style={{}}
                raysOrigin="top-right"
                raysColor="#BCA5D4"
                raysSpeed={0.48}
                lightSpread={0.72}
                rayLength={3.0}
                rayDensity={1.45}
                raySharpness={0.78}
                tilt={28}
                glow={0.44}
                haze={0.24}
                atmosphere={0.22}
                intensity={1.75}
                opacity={0.86}
                pulsating
                followMouse
                mouseInfluence={0.12}
                cursorShadow
                clickPulse
                maxDevicePixelRatio={1.25}
              />
            </div>

            <ParticlePortrait
              spatialProgressRef={spatialProgressRef}
              controlsRef={spatialControlsRef}
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[2] md:hidden"
              style={{
                background:
                  "linear-gradient(to top, rgba(13,11,18,0.92) 0%, rgba(13,11,18,0.68) 42%, rgba(13,11,18,0.18) 72%, transparent 100%)",
              }}
            />

            <div
              aria-hidden="true"
              className="pointer-events-none hidden md:block absolute inset-0 z-[3]"
              style={{
                background:
                  "linear-gradient(90deg, rgba(13,11,18,0.78) 0%, rgba(13,11,18,0.42) 34%, transparent 58%)",
              }}
            />

            <div className="page-container pointer-events-none relative z-10 flex flex-1 flex-col justify-end pt-14 pb-6">
              <div
                ref={heroCopyRef}
                data-testid="hero-copy"
                className="pointer-events-none max-w-[680px] will-change-transform"
              >
                <div className="pointer-events-none mb-5 flex items-center gap-3" data-hero-intro>
                  <AsciiScramble
                    text={IDENTITY.roleLine}
                    trigger="mount"
                    duration={0.85}
                    className="type-tech-label text-[#BCA5D4]"
                  />
                </div>

                <MaskedLineReveal
                  as="h1"
                  id="hero-heading"
                  trigger="mount"
                  delay={0.1}
                  className="pointer-events-none type-display text-[#F3EEF8]"
                  lines={[
                    "Ideas made",
                    <>
                      <em className="type-serif-accent font-medium">visible</em> in code.
                    </>,
                  ]}
                />

                <p
                  data-hero-intro
                  className="pointer-events-none mt-6 max-w-[44ch] text-base sm:text-lg leading-relaxed text-[#ADA4B8]"
                >
                  Architecting distributed AI systems, resilient full-stack products, and
                  real-time spatial graphics with neo-classical precision.
                </p>

                <div
                  data-hero-intro
                  className="mt-8 flex flex-wrap items-center gap-4 pointer-events-auto"
                >
                  <a href="#projects" className="btn-primary no-underline">
                    <span>Explore selected work</span>
                    <ArrowDown size={15} strokeWidth={1.6} aria-hidden="true" />
                  </a>
                  <a href="#spatial-study" className="btn-secondary no-underline">
                    <span>Calibrate 3D bust</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="page-container pointer-events-none relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#393143] pt-5 text-xs font-mono uppercase tracking-[0.08em] text-[#ADA4B8]">
                <span className="inline-flex items-center gap-2">
                  Drag to orbit 3D bust · Hover for marble &amp; particle scatter · Scroll to zoom
                </span>
                <div className="flex items-center gap-5 tabular-nums">
                  <span
                    ref={heroScrollPctRef}
                    data-testid="hero-scroll-depth"
                    className="text-[#BCA5D4]"
                  >
                    SCROLL DEPTH 00%
                  </span>
                  <span className="text-[#766C83]">01 / 05</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 02 / SELECTED WORK — 3D CIRCULAR GALLERY */}
        <ProjectsGallerySection
          selectedProject={selectedProject}
          onSelectProject={handleOpenProject}
        />

        {/* 03 / ABOUT, WORD REVEAL & SPATIAL STUDY */}
        <section
          id="about"
          aria-labelledby="about-heading"
          className="section-band overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div
              data-parallax="ascii-ambient"
              className="absolute -inset-y-20 inset-x-0 opacity-[0.032] will-change-transform"
            >
              <Image
                src="/ascii-art-poster.webp"
                alt=""
                fill
                sizes="100vw"
                referrerPolicy="no-referrer"
                className="object-cover object-right mix-blend-screen grayscale contrast-125"
              />
            </div>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, var(--bg-primary) 0%, rgba(13,11,18,0.85) 48%, transparent 100%), linear-gradient(180deg, var(--bg-primary) 0%, transparent 25%, transparent 75%, var(--bg-primary) 100%)",
              }}
            />
          </div>

          <div className="page-container relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-14 items-start">
              <div className="lg:col-span-2">
                <AsciiScramble text="03 / ABOUT & CRAFT" className="type-tech-label" />
              </div>
              <div className="lg:col-span-10">
                <MaskedLineReveal
                  as="h2"
                  id="about-heading"
                  className="type-h2 text-[#F3EEF8]"
                  lines={[
                    "Where engineering rigor",
                    <>
                      meets <em className="type-serif-accent font-medium">sculptural</em> stillness.
                    </>,
                  ]}
                />
              </div>
            </div>

            {/* Scroll-Synchronized Editorial Word Reveal */}
            <div className="lg:ml-[16.666%] mb-16 border-y border-[#393143] py-10">
              <ScrollWordReveal
                text="I build intelligent software systems, low-latency AI infrastructure, and tactile spatial interfaces that turn dense computation into calm, legible human instruments."
                accentWords={["intelligent", "tactile", "instruments"]}
                className="type-intro max-w-[44ch]"
              />
            </div>

            {/* Asymmetrical 12-Col Editorial Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              <div
                data-parallax="prose"
                className="lg:col-span-7 space-y-10 will-change-transform"
              >
                <div className="space-y-5 text-[#ADA4B8] prose-measure">
                  <p>
                    Across six years working on distributed data pipelines, inference routers, and
                    real-time WebGL engines, my focus has stayed consistent: remove incidental
                    complexity until only the essential mechanics remain.
                  </p>
                  <p>
                    Whether profiling CUDA kernel occupancy or tuning a GLSL fragment shader, good
                    engineering shares the discipline of classical stonework—every joint is load-bearing,
                    every proportion deliberate.
                  </p>
                </div>

                {/* Connected Disciplines */}
                <div>
                  <h3 className="type-tech-label text-[#BCA5D4] mb-4">Core Disciplines</h3>
                  <div className="border-t border-[#393143]">
                    {DISCIPLINES.map((item) => (
                      <div
                        key={item.index}
                        className="grid grid-cols-1 sm:grid-cols-[44px_1fr] gap-2 sm:gap-4 border-b border-[#393143] py-5"
                      >
                        <span className="font-mono text-xs text-[#766C83] tabular-nums pt-1">
                          {item.index}
                        </span>
                        <div>
                          <h4 className="text-lg font-semibold tracking-[-0.02em] text-[#F3EEF8]">
                            {item.title}
                          </h4>
                          <p className="mt-1.5 text-sm sm:text-base text-[#ADA4B8] leading-relaxed prose-measure">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Stack Matrix (Zero Pills) */}
                <div>
                  <h3 className="type-tech-label text-[#BCA5D4] mb-4">Technical Stack</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {STACK_CATEGORIES.map((group) => (
                      <div
                        key={group.name}
                        className="rounded-[12px] border border-[#393143] bg-[#17131F] p-5"
                      >
                        <div className="flex items-center justify-between border-b border-[#393143]/70 pb-3">
                          <span className="font-semibold text-[#F3EEF8]">{group.name}</span>
                          <span className="font-mono text-xs text-[#766C83] tabular-nums">
                            {group.index}
                          </span>
                        </div>
                        <p className="mt-3 font-mono text-xs leading-relaxed text-[#ADA4B8]">
                          {group.items.join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Portrait Column */}
              <div
                data-parallax="portrait"
                className="lg:col-span-5 will-change-transform"
              >
                <DirectionalMediaReveal
                  direction="right"
                  aspectClassName="aspect-[3/4]"
                  className="max-w-[480px] lg:ml-auto"
                >
                  <Image
                    src={IDENTITY.portrait}
                    alt={IDENTITY.portraitAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 480px"
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </DirectionalMediaReveal>
                <div className="mt-4 max-w-[480px] lg:ml-auto flex items-center justify-between text-xs font-mono text-[#766C83]">
                  <span>{IDENTITY.location}</span>
                  <span>Studio Monograph · 2026</span>
                </div>
              </div>
            </div>

            {/* Spatial 3D Calibration Study */}
            <div id="spatial-study" className="mt-16 pt-4">
              <SpatialStudy controlsRef={spatialControlsRef} />
            </div>
          </div>
        </section>

        {/* 04 / AIRPLANE CAREER JOURNEY */}
        <CareerJourney />

        {/* 05 / CONTACT & FOOTER */}
        <section id="contact" aria-labelledby="contact-heading" className="section-band pb-12">
          <div className="page-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-start">
              <div className="lg:col-span-2">
                <AsciiScramble text="05 / CONTACT" className="type-tech-label" />
              </div>
              <div className="lg:col-span-10">
                <MaskedLineReveal
                  as="h2"
                  id="contact-heading"
                  className="type-h2 text-[#F3EEF8]"
                  lines={[
                    "Let’s architect something",
                    <>
                      <em className="type-serif-accent font-medium">enduring</em> together.
                    </>,
                  ]}
                />
              </div>
            </div>

            <div className="lg:ml-[16.666%] grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5 space-y-6">
                <p className="text-base sm:text-lg text-[#ADA4B8] leading-relaxed prose-measure">
                  Open to principal engineering roles, AI infrastructure advisory, and select
                  interactive web collaborations.
                </p>

                <div className="rounded-[12px] border border-[#393143] bg-[#17131F] p-5 space-y-4">
                  <div>
                    <span className="type-tech-label text-[#766C83]">Direct Email</span>
                    <div className="mt-1 font-mono text-sm text-[#F3EEF8] break-all">
                      {IDENTITY.email}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="btn-secondary"
                      aria-label="Copy email address to clipboard"
                    >
                      {copiedEmail ? (
                        <>
                          <Check size={15} strokeWidth={1.6} aria-hidden="true" />
                          <span>Email copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={15} strokeWidth={1.6} aria-hidden="true" />
                          <span>Copy email</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResumeOpen(true)}
                      className="btn-secondary"
                    >
                      <span>View Resume</span>
                    </button>
                  </div>
                </div>
              </div>

              <div
                data-parallax="contact-form"
                className="lg:col-span-7 will-change-transform"
              >
                {contactSent ? (
                  <div
                    role="status"
                    className="rounded-[16px] border border-[#BCA5D4]/60 bg-[#17131F] p-8 space-y-4"
                  >
                    <p className="type-tech-label text-[#BCA5D4]">Dispatch Recorded</p>
                    <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#F3EEF8]">
                      Thank you, {contactName}.
                    </h3>
                    <p className="text-sm sm:text-base text-[#ADA4B8] prose-measure">
                      Your note has been formatted for {IDENTITY.email}. You can also reach out
                      directly via email or send another inquiry below.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setContactSent(false);
                        setContactName("");
                        setContactEmail("");
                        setContactMessage("");
                      }}
                      className="btn-secondary"
                    >
                      Send another note
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleContactSubmit}
                    noValidate
                    className="rounded-[16px] border border-[#393143] bg-[#17131F] p-6 sm:p-8 space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <label className="block">
                        <span className="type-tech-label block mb-2">Name</span>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Ada Lovelace"
                          className="w-full min-h-[44px] rounded-[8px] border border-[#393143] bg-[#0D0B12] px-3.5 py-2.5 text-sm text-[#F3EEF8] placeholder:text-[#766C83] focus:border-[#BCA5D4] focus:outline-none"
                          required
                        />
                      </label>
                      <label className="block">
                        <span className="type-tech-label block mb-2">Email</span>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="ada@analytical.org"
                          className="w-full min-h-[44px] rounded-[8px] border border-[#393143] bg-[#0D0B12] px-3.5 py-2.5 text-sm text-[#F3EEF8] placeholder:text-[#766C83] focus:border-[#BCA5D4] focus:outline-none"
                          required
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="type-tech-label block mb-2">Project or Inquiry</span>
                      <textarea
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Share architecture context, timeline, or collaboration goals..."
                        className="w-full rounded-[8px] border border-[#393143] bg-[#0D0B12] px-3.5 py-2.5 text-sm text-[#F3EEF8] placeholder:text-[#766C83] focus:border-[#BCA5D4] focus:outline-none"
                        required
                      />
                    </label>

                    {contactError && (
                      <p role="alert" className="text-xs font-mono text-[#D2BCE8]">
                        {contactError}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <span className="font-mono text-xs text-[#766C83]">
                        Response within 24–48h
                      </span>
                      <button type="submit" className="btn-primary">
                        <span>Send message</span>
                        <Send size={14} strokeWidth={1.6} aria-hidden="true" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <footer className="mt-24 flex flex-wrap items-center justify-between gap-6 border-t border-[#393143] pt-6 text-xs font-mono uppercase tracking-[0.08em] text-[#ADA4B8]">
              <span>
                {IDENTITY.monogram} · {IDENTITY.name}
              </span>
              <div className="flex flex-wrap items-center gap-6">
                <a
                  href={IDENTITY.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ADA4B8] no-underline hover:text-[#BCA5D4]"
                >
                  GitHub
                </a>
                <a
                  href="#top"
                  className="inline-flex items-center gap-1.5 text-[#F3EEF8] no-underline hover:text-[#BCA5D4]"
                >
                  <span>Back to top</span>
                  <ArrowUp size={14} strokeWidth={1.6} aria-hidden="true" />
                </a>
              </div>
            </footer>
          </div>
        </section>
      </main>

      <ProjectFlyout project={selectedProject} onClose={handleCloseProject} />
      <ResumeModal open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </MotionConfig>
  );
}
