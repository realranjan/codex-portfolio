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
import {
  computeHeroToCarouselState,
  computeSpatialScrollState,
} from "@/lib/motion";
import type { SpatialControlValues } from "@/components/particle-portrait";
import AsciiBackground from "@/components/ascii-background";
import { DirectionalMediaReveal } from "@/components/motion/directional-media-reveal";
import { MaskedLineReveal } from "@/components/motion/masked-line-reveal";
import { ScrollWordReveal } from "@/components/motion/scroll-word-reveal";
import { CareerJourney } from "@/components/portfolio/career-journey";
import { ProjectFlyout } from "@/components/portfolio/project-flyout";
import { ProjectsGallerySection } from "@/components/portfolio/projects-gallery-section";
import { ResumeModal } from "@/components/portfolio/resume-modal";
import { SiteNav } from "@/components/portfolio/site-nav";

gsap.registerPlugin(ScrollTrigger);

const ParticlePortrait = dynamic(() => import("@/components/particle-portrait"), {
  ssr: false,
});
const LightRays = dynamic(() => import("@/components/light-rays"), {
  ssr: false,
});

const SCULPTURE_MODES: readonly {
  id: "reveal" | "samurai" | "cute";
  label: string;
  values: SpatialControlValues;
}[] = [
  {
    id: "reveal",
    label: "Hover Reveal",
    values: { layerMode: "reveal", lightAzimuth: 0 },
  },
  {
    id: "samurai",
    label: "Samurai",
    values: { layerMode: "samurai", lightAzimuth: 0.45 },
  },
  {
    id: "cute",
    label: "Cute Cat",
    values: { layerMode: "cute", lightAzimuth: -0.35 },
  },
];

export default function Home() {
  const pageRef = useRef<HTMLElement>(null);
  const unifiedRunwayRef = useRef<HTMLDivElement>(null);
  const heroBandRef = useRef<HTMLDivElement>(null);
  const projectsBandRef = useRef<HTMLElement>(null);

  const heroOverlayRef = useRef<HTMLDivElement>(null);
  const heroActionsRef = useRef<HTMLDivElement>(null);
  const heroDockRef = useRef<HTMLDivElement>(null);
  const heroScrimMobileRef = useRef<HTMLDivElement>(null);
  const heroScrimDesktopRef = useRef<HTMLDivElement>(null);
  const projectsHudRef = useRef<HTMLDivElement>(null);

  const asciiLayerRef = useRef<HTMLDivElement>(null);
  const raysLayerRef = useRef<HTMLDivElement>(null);

  const spatialProgressRef = useRef<number>(0);
  const projectsProgressRef = useRef<number>(0);
  const centerMixRef = useRef<number>(0);
  const ringDrawMixRef = useRef<number>(0);
  const carouselMixRef = useRef<number>(0);
  const spatialControlsRef = useRef<SpatialControlValues>(SCULPTURE_MODES[0].values);

  const [sculptureMode, setSculptureMode] = useState<"reveal" | "samurai" | "cute">("reveal");
  const [selectedProject, setSelectedProject] = useState<ProjectCaseStudy | null>(null);
  const [lastTriggerId, setLastTriggerId] = useState<string | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSent, setContactSent] = useState(false);

  const handleSculptureMode = (mode: (typeof SCULPTURE_MODES)[number]) => {
    setSculptureMode(mode.id);
    spatialControlsRef.current = mode.values;
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const applyStageFromScroll = () => {
      const heroHeight = Math.max(
        1,
        heroBandRef.current?.offsetHeight ?? window.innerHeight * 1.15
      );
      const rawHero = Math.min(1, Math.max(0, window.scrollY / heroHeight));

      const projectsEl = projectsBandRef.current;
      const projectsTop = projectsEl
        ? projectsEl.getBoundingClientRect().top + window.scrollY
        : heroHeight;
      const projectsScrollable = projectsEl
        ? Math.max(1, projectsEl.offsetHeight - window.innerHeight)
        : Math.max(1, window.innerHeight);
      const rawProjects = Math.min(
        1,
        Math.max(0, (window.scrollY - projectsTop) / projectsScrollable)
      );

      const spatial = computeSpatialScrollState(rawHero, rawProjects);
      const transition = computeHeroToCarouselState(rawHero, rawProjects);

      spatialProgressRef.current = rawHero;
      projectsProgressRef.current = rawProjects;
      centerMixRef.current = transition.centerMix;
      ringDrawMixRef.current = transition.ringDrawMix;
      carouselMixRef.current = transition.carouselMix;

      if (heroOverlayRef.current) {
        heroOverlayRef.current.style.transform = `translate3d(0, ${transition.heroOverlayY}px, 0)`;
        heroOverlayRef.current.style.opacity = String(transition.heroOverlayOpacity);
        heroOverlayRef.current.style.visibility =
          transition.heroOverlayOpacity > 0.02 ? "visible" : "hidden";
      }

      const heroInteractive = transition.heroOverlayOpacity > 0.25 ? "auto" : "none";
      if (heroActionsRef.current) {
        heroActionsRef.current.style.pointerEvents = heroInteractive;
      }
      if (heroDockRef.current) {
        heroDockRef.current.style.pointerEvents = heroInteractive;
      }

      if (heroScrimMobileRef.current) {
        heroScrimMobileRef.current.style.opacity = String(transition.heroOverlayOpacity);
      }
      if (heroScrimDesktopRef.current) {
        heroScrimDesktopRef.current.style.opacity = String(transition.heroOverlayOpacity);
      }

      if (projectsHudRef.current) {
        const hudY = (1 - transition.hudOpacity) * 18;
        projectsHudRef.current.style.opacity = String(transition.hudOpacity);
        projectsHudRef.current.style.transform = `translate3d(0, ${hudY.toFixed(1)}px, 0)`;
        projectsHudRef.current.style.visibility =
          transition.hudOpacity > 0.02 ? "visible" : "hidden";
      }

      if (asciiLayerRef.current) {
        asciiLayerRef.current.style.transform = `translate3d(${spatial.bgDriftX}%, ${spatial.bgDriftY}%, 0) scale(${spatial.bgScale})`;
        asciiLayerRef.current.style.opacity = String(spatial.bgOpacity);
      }

      if (raysLayerRef.current) {
        raysLayerRef.current.style.transform = `translate3d(0, ${spatial.raysShiftY}px, 0)`;
      }
    };

    applyStageFromScroll();
    window.addEventListener("scroll", applyStageFromScroll, { passive: true });
    window.addEventListener("resize", applyStageFromScroll);

    if (reduced) {
      return () => {
        window.removeEventListener("scroll", applyStageFromScroll);
        window.removeEventListener("resize", applyStageFromScroll);
      };
    }

    const lenis = new Lenis({ autoRaf: true, anchors: true });
    const syncScroll = () => {
      applyStageFromScroll();
      ScrollTrigger.update();
    };
    lenis.on("scroll", syncScroll);

    const ctx = gsap.context(() => {
      gsap.from("[data-hero-intro]", {
        y: 14,
        opacity: 0,
        duration: 0.65,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });

      const parallaxTargets: Array<{ selector: string; fromY: number; toY: number; trigger?: string }> = [
        { selector: '[data-parallax="prose"]', fromY: 16, toY: -16 },
        { selector: '[data-parallax="portrait"]', fromY: 36, toY: -36 },
        { selector: '[data-parallax="contact-form"]', fromY: 20, toY: -16, trigger: "#contact" },
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
      window.removeEventListener("scroll", applyStageFromScroll);
      window.removeEventListener("resize", applyStageFromScroll);
      ctx.revert();
      lenis.off("scroll", syncScroll);
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
        {/* 01 / UNIFIED HERO -> CIRCULAR CAROUSEL AROUND THE MODEL */}
        <div
          ref={unifiedRunwayRef}
          className="hero-runway relative"
          id="top"
        >
          {/* Sticky 100svh 3D Spatial Viewport spanning Hero -> Carousel */}
          <div
            className="hero-section cursor-grab active:cursor-grabbing"
            role="region"
            aria-label="Interactive 3D sculpture and orbiting project gallery"
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
                raysColor="#C4B0DC"
                raysSpeed={0.44}
                lightSpread={0.72}
                rayLength={2.9}
                rayDensity={1.35}
                raySharpness={0.78}
                tilt={28}
                glow={0.38}
                haze={0.2}
                atmosphere={0.18}
                intensity={1.55}
                opacity={0.78}
                pulsating
                followMouse
                mouseInfluence={0.1}
                cursorShadow
                clickPulse
                maxDevicePixelRatio={1.25}
              />
            </div>

            {/* 3D Particle Bust (z-[5]) sitting between Carousel Back Ring (z-[2]) and Front Ring (z-[12]) */}
            <ParticlePortrait
              spatialProgressRef={spatialProgressRef}
              projectsProgressRef={projectsProgressRef}
              centerMixRef={centerMixRef}
              controlsRef={spatialControlsRef}
            />

            {/* Hero contrast scrims fade away cleanly as the carousel orbits the centered model */}
            <div
              ref={heroScrimMobileRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[6] md:hidden will-change-opacity"
              style={{
                background:
                  "linear-gradient(to top, rgba(10,10,12,0.92) 0%, rgba(10,10,12,0.68) 42%, rgba(10,10,12,0.18) 72%, transparent 100%)",
              }}
            />
            <div
              ref={heroScrimDesktopRef}
              aria-hidden="true"
              className="pointer-events-none hidden md:block absolute inset-0 z-[6] will-change-opacity"
              style={{
                background:
                  "linear-gradient(90deg, rgba(10,10,12,0.82) 0%, rgba(10,10,12,0.44) 36%, transparent 60%)",
              }}
            />

            {/* Hero Copy & Bottom Shader Controls */}
            <div
              ref={heroOverlayRef}
              className="pointer-events-none absolute inset-0 z-[20] flex flex-col justify-between pt-[92px] pb-7 will-change-[transform,opacity]"
            >
              <div className="page-container pointer-events-none flex flex-1 flex-col justify-end pb-6">
                <div
                  data-testid="hero-copy"
                  className="pointer-events-none max-w-[660px]"
                >
                  <p className="pointer-events-none mb-5 type-tech-label text-[#C4B0DC]" data-hero-intro>
                    {IDENTITY.roleLine}
                  </p>

                  <MaskedLineReveal
                    as="h1"
                    id="hero-heading"
                    trigger="mount"
                    delay={0.08}
                    className="pointer-events-none type-display text-[#F4F1EA]"
                    lines={[
                      "Systems shaped",
                      <>
                        for <em className="type-serif-accent font-medium whitespace-nowrap">real-time</em>
                      </>,
                      "speed.",
                    ]}
                  />

                  <p
                    data-hero-intro
                    className="pointer-events-none mt-6 max-w-[44ch] text-base sm:text-lg leading-relaxed text-[#A19D97]"
                  >
                    Full-stack software, low-latency inference routers, and custom WebGL graphics
                    built for production predictability.
                  </p>

                  <div
                    ref={heroActionsRef}
                    data-hero-intro
                    className="mt-8 flex flex-wrap items-center gap-4 pointer-events-auto"
                  >
                    <a href="#projects" className="btn-primary no-underline">
                      <span>Selected work</span>
                      <ArrowDown size={15} strokeWidth={1.6} aria-hidden="true" />
                    </a>
                    <a href="#about" className="btn-secondary no-underline">
                      <span>Practice &amp; background</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="page-container pointer-events-none">
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.1] pt-4 text-xs font-mono text-[#A19D97]">
                  <span>Hover cat to reveal inner layer · Move pointer to guide both heads · Drag to orbit</span>

                  <div
                    ref={heroDockRef}
                    className="pointer-events-auto flex items-center gap-1 rounded-[4px] border border-white/[0.1] bg-[#0A0A0C]/85 p-1"
                    role="group"
                    aria-label="Cat layer mode"
                  >
                    {SCULPTURE_MODES.map((mode) => {
                      const active = sculptureMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => handleSculptureMode(mode)}
                          aria-pressed={active}
                          className={`px-2.5 py-1 rounded-[3px] text-[11px] font-mono transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                            active
                              ? "bg-[#C4B0DC] text-[#0A0A0C] font-medium"
                              : "text-[#A19D97] hover:text-[#F4F1EA]"
                          }`}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Work Circular Rings (Back z-2 + Front z-12) & Case Controls HUD */}
            <ProjectsGallerySection
              selectedProject={selectedProject}
              onSelectProject={handleOpenProject}
              scrollTargetRef={projectsBandRef}
              ringDrawMixRef={ringDrawMixRef}
              carouselMixRef={carouselMixRef}
              hudRef={projectsHudRef}
            />
          </div>

          {/* Scroll Band 1: Hero close-up cinema -> Centered Model & O-Shape Track Draw */}
          <div
            ref={heroBandRef}
            aria-hidden="true"
            className="h-[135svh] md:h-[165svh] pointer-events-none"
          />

          {/* Scroll Band 2 (#projects anchor): Orbiting circular carousel + continuous scroll cinema + clean exit */}
          <section
            ref={projectsBandRef}
            id="projects"
            aria-labelledby="projects-heading"
            className="h-[235svh] md:h-[260svh] pointer-events-none"
          />
        </div>

        {/* 03 / PRACTICE & CRAFT */}
        <section
          id="about"
          aria-labelledby="about-heading"
          className="section-band overflow-hidden"
        >
          <div className="page-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-start">
              <div className="lg:col-span-2">
                <span className="type-tech-label">02. Practice</span>
              </div>
              <div className="lg:col-span-10">
                <MaskedLineReveal
                  as="h2"
                  id="about-heading"
                  className="type-h2 text-[#F4F1EA]"
                  lines={[
                    "From kernel tuning",
                    <>
                      to the <em className="type-serif-accent font-medium">final</em> frame.
                    </>,
                  ]}
                />
              </div>
            </div>

            <div className="lg:ml-[16.666%] mb-14 border-y border-white/[0.1] py-10">
              <ScrollWordReveal
                text="Across backend routers, storage engines, and browser shaders, good engineering cuts out unnecessary abstraction until the mechanism holds under load."
                accentWords={["routers,", "shaders,", "holds"]}
                className="type-intro max-w-[44ch]"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              <div
                data-parallax="prose"
                className="lg:col-span-7 space-y-12 will-change-transform"
              >
                <div className="space-y-5 text-[#A19D97] prose-measure">
                  <p>
                    Over six years building distributed data pipelines, inference routers, and
                    browser WebGL engines, my approach has stayed straightforward: measure tail
                    behavior early, isolate pure state logic, and remove layers that obscure failure.
                  </p>
                  <p>
                    Whether debugging CUDA occupancy or calibrating a fragment shader, software holds
                    up best when every moving part earns its complexity.
                  </p>
                </div>

                {/* Core Disciplines */}
                <div>
                  <h3 className="type-tech-label text-[#C4B0DC] mb-4">Disciplines</h3>
                  <div className="border-t border-white/[0.1]">
                    {DISCIPLINES.map((item) => (
                      <div
                        key={item.index}
                        className="grid grid-cols-1 sm:grid-cols-[44px_1fr] gap-2 sm:gap-4 border-b border-white/[0.1] py-5"
                      >
                        <span className="font-mono text-xs text-[#6C6863] tabular-nums pt-1">
                          {item.index}
                        </span>
                        <div>
                          <h4 className="text-lg font-semibold tracking-[-0.02em] text-[#F4F1EA]">
                            {item.title}
                          </h4>
                          <p className="mt-1.5 text-sm sm:text-base text-[#A19D97] leading-relaxed prose-measure">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unboxed Hairline Stack Specification */}
                <div>
                  <h3 className="type-tech-label text-[#C4B0DC] mb-4">Technical Stack</h3>
                  <div className="border-t border-white/[0.1]">
                    {STACK_CATEGORIES.map((group) => (
                      <div
                        key={group.name}
                        className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 sm:gap-6 border-b border-white/[0.1] py-4 items-baseline"
                      >
                        <span className="text-sm font-medium text-[#F4F1EA]">
                          {group.name}
                        </span>
                        <p className="font-mono text-xs leading-relaxed text-[#A19D97]">
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
                  className="max-w-[460px] lg:ml-auto"
                >
                  <Image
                    src={IDENTITY.portrait}
                    alt={IDENTITY.portraitAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 460px"
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </DirectionalMediaReveal>
                <div className="mt-3 max-w-[460px] lg:ml-auto flex items-center justify-between text-xs font-mono text-[#6C6863]">
                  <span>{IDENTITY.location}</span>
                  <span>2026</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 04 / EXPERIENCE */}
        <CareerJourney />

        {/* 05 / CONTACT & FOOTER */}
        <section id="contact" aria-labelledby="contact-heading" className="section-band pb-12">
          <div className="page-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-start">
              <div className="lg:col-span-2">
                <span className="type-tech-label">04. Contact</span>
              </div>
              <div className="lg:col-span-10">
                <MaskedLineReveal
                  as="h2"
                  id="contact-heading"
                  className="type-h2 text-[#F4F1EA]"
                  lines={[
                    "Start a conversation",
                    <>
                      about <em className="type-serif-accent font-medium">systems</em> work.
                    </>,
                  ]}
                />
              </div>
            </div>

            <div className="lg:ml-[16.666%] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              <div className="lg:col-span-5 space-y-6">
                <p className="text-base sm:text-lg text-[#A19D97] leading-relaxed prose-measure">
                  Available for principal engineering roles, AI infrastructure advisory, and select
                  interactive web engagements.
                </p>

                <div className="border-t border-white/[0.1] pt-5 space-y-4">
                  <div>
                    <span className="type-tech-label text-[#6C6863]">Direct Email</span>
                    <div className="mt-1 font-mono text-sm text-[#F4F1EA] break-all">
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
                      <span>Resume</span>
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
                    className="rounded-[6px] border border-[#C4B0DC]/50 bg-[#121216] p-8 space-y-4"
                  >
                    <p className="type-tech-label text-[#C4B0DC]">Message Recorded</p>
                    <h3 className="text-2xl font-semibold tracking-[-0.025em] text-[#F4F1EA]">
                      Thank you, {contactName}.
                    </h3>
                    <p className="text-sm sm:text-base text-[#A19D97] prose-measure">
                      Your note is ready for {IDENTITY.email}. You can send a follow-up note below
                      or copy the email address directly.
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
                    className="rounded-[6px] border border-white/[0.1] bg-[#121216] p-6 sm:p-8 space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <label className="block">
                        <span className="type-tech-label block mb-2">Name</span>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Your name"
                          className="w-full min-h-[44px] rounded-[4px] border border-white/[0.12] bg-[#0A0A0C] px-3.5 py-2.5 text-sm text-[#F4F1EA] placeholder:text-[#6C6863] focus:border-[#C4B0DC] focus:outline-none"
                          required
                        />
                      </label>
                      <label className="block">
                        <span className="type-tech-label block mb-2">Email</span>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full min-h-[44px] rounded-[4px] border border-white/[0.12] bg-[#0A0A0C] px-3.5 py-2.5 text-sm text-[#F4F1EA] placeholder:text-[#6C6863] focus:border-[#C4B0DC] focus:outline-none"
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
                        placeholder="Share project scope, architecture context, or timeline..."
                        className="w-full rounded-[4px] border border-white/[0.12] bg-[#0A0A0C] px-3.5 py-2.5 text-sm text-[#F4F1EA] placeholder:text-[#6C6863] focus:border-[#C4B0DC] focus:outline-none"
                        required
                      />
                    </label>

                    {contactError && (
                      <p role="alert" className="text-xs font-mono text-[#D9CAE8]">
                        {contactError}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <span className="font-mono text-xs text-[#6C6863]">
                        Direct dispatch
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

            <footer className="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-white/[0.1] pt-6 text-xs font-mono text-[#A19D97]">
              <span>{IDENTITY.name}</span>
              <div className="flex flex-wrap items-center gap-6">
                <a
                  href={IDENTITY.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A19D97] no-underline hover:text-[#C4B0DC]"
                >
                  GitHub
                </a>
                <a
                  href="#top"
                  className="inline-flex items-center gap-1.5 text-[#F4F1EA] no-underline hover:text-[#C4B0DC]"
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
