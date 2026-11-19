"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { MotionConfig } from "motion/react";
import { ArrowUp, Check, ChevronDown, Copy, Send } from "lucide-react";
import {
  DISCIPLINES,
  IDENTITY,
  STACK_CATEGORIES,
  type ProjectCaseStudy,
} from "@/data/portfolio";
import { computeHeroToCarouselState } from "@/lib/motion";
import type { SpatialControlValues } from "@/components/particle-portrait";
import { DirectionalMediaReveal } from "@/components/motion/directional-media-reveal";
import { MaskedLineReveal } from "@/components/motion/masked-line-reveal";
import { ScrollWordReveal } from "@/components/motion/scroll-word-reveal";
import { CareerJourney } from "@/components/portfolio/career-journey";
import {
  HeroJapaneseBackdrop,
  HeroJapaneseForeground,
} from "@/components/portfolio/hero-japanese-backdrop";
import { ProjectFlyout } from "@/components/portfolio/project-flyout";
import { ProjectsGallerySection } from "@/components/portfolio/projects-gallery-section";
import { ResumeModal } from "@/components/portfolio/resume-modal";
import { SiteNav } from "@/components/portfolio/site-nav";

gsap.registerPlugin(ScrollTrigger);

const ParticlePortrait = dynamic(() => import("@/components/particle-portrait"), {
  ssr: false,
});

const DEFAULT_SPATIAL_CONTROLS: SpatialControlValues = {
  layerMode: "reveal",
  lightAzimuth: 0,
};

export default function Home() {
  const pageRef = useRef<HTMLElement>(null);
  const unifiedRunwayRef = useRef<HTMLDivElement>(null);
  const heroBandRef = useRef<HTMLDivElement>(null);
  const projectsBandRef = useRef<HTMLElement>(null);

  const heroOverlayRef = useRef<HTMLDivElement>(null);
  const heroBackdropDecorRef = useRef<HTMLDivElement>(null);
  const heroSunRef = useRef<HTMLDivElement>(null);
  const heroForegroundRef = useRef<HTMLDivElement>(null);
  const heroForegroundDecorRef = useRef<HTMLDivElement>(null);
  const projectsHudRef = useRef<HTMLDivElement>(null);

  const spatialProgressRef = useRef<number>(0);
  const projectsProgressRef = useRef<number>(0);
  const centerMixRef = useRef<number>(0);
  const ringDrawMixRef = useRef<number>(0);
  const carouselMixRef = useRef<number>(0);
  const spatialControlsRef = useRef<SpatialControlValues>(DEFAULT_SPATIAL_CONTROLS);

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

      // Fade peripheral sakura/mountains/pagoda/brushstroke on scroll while preserving warm washi paper + soft crimson sun halo for #projects
      const decorOpacity = Math.max(0, Math.min(1, 1 - transition.centerMix * 1.18));
      if (heroBackdropDecorRef.current) {
        heroBackdropDecorRef.current.style.opacity = String(decorOpacity);
        heroBackdropDecorRef.current.style.visibility =
          decorOpacity > 0.01 ? "visible" : "hidden";
      }
      if (heroForegroundDecorRef.current) {
        heroForegroundDecorRef.current.style.opacity = String(decorOpacity);
        heroForegroundDecorRef.current.style.visibility =
          decorOpacity > 0.01 ? "visible" : "hidden";
      }
      if (heroForegroundRef.current) {
        const mistOpacity = 0.42 + 0.58 * decorOpacity;
        heroForegroundRef.current.style.opacity = mistOpacity.toFixed(3);
      }
      if (heroSunRef.current) {
        const sunOpacity = 0.28 + 0.72 * decorOpacity;
        const sunScale = 0.86 + 0.14 * decorOpacity;
        heroSunRef.current.style.opacity = sunOpacity.toFixed(3);
        heroSunRef.current.style.transform = `translate3d(0, 0, 0) scale(${sunScale.toFixed(3)})`;
      }

      if (projectsHudRef.current) {
        const hudY = (1 - transition.hudOpacity) * 18;
        projectsHudRef.current.style.opacity = String(transition.hudOpacity);
        projectsHudRef.current.style.transform = `translate3d(0, ${hudY.toFixed(1)}px, 0)`;
        projectsHudRef.current.style.visibility =
          transition.hudOpacity > 0.02 ? "visible" : "hidden";
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
            {/* Japanese Washi Paper, Crimson Sun, Sakura Branch, Mountains & Pagoda (z-[1]) */}
            <HeroJapaneseBackdrop
              decorRef={heroBackdropDecorRef}
              sunRef={heroSunRef}
            />

            {/* 3D Layered Samurai / Cute Cat Stage (z-[5]) centered in front of the crimson sun */}
            <ParticlePortrait
              spatialProgressRef={spatialProgressRef}
              projectsProgressRef={projectsProgressRef}
              centerMixRef={centerMixRef}
              controlsRef={spatialControlsRef}
            />

            {/* Foreground Rolling Morning Mist, Sweeping Crimson Brush Stroke & Drifting Petals (z-[7]) */}
            <HeroJapaneseForeground
              ref={heroForegroundRef}
              decorRef={heroForegroundDecorRef}
            />

            {/* Accessible H1 + Minimal Bottom Controls Only (No hero text blocks or ribbon) */}
            <div
              ref={heroOverlayRef}
              className="pointer-events-none absolute inset-0 z-[20] flex flex-col justify-end pb-6 will-change-[transform,opacity]"
            >
              <h1 id="hero-heading" className="sr-only">
                {IDENTITY.name} — Interactive 3D Portfolio
              </h1>

              <div className="page-container pointer-events-none flex items-center justify-center">
                {/* Minimal centered scroll-down mouse icon cue (no text) */}
                <a
                  href="#projects"
                  aria-label="Scroll to selected work"
                  className="pointer-events-auto inline-flex flex-col items-center gap-1 text-[#2B231E]/80 transition-colors hover:text-[#A91D22]"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-[18px] items-start justify-center rounded-full border-[1.5px] border-current pt-1.5"
                  >
                    <span className="h-1.5 w-[2px] rounded-full bg-current" />
                  </span>
                  <ChevronDown size={13} strokeWidth={1.8} aria-hidden="true" />
                </a>
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
                <span className="type-tech-label text-[#A91D22]">02. Practice</span>
              </div>
              <div className="lg:col-span-10">
                <MaskedLineReveal
                  as="h2"
                  id="about-heading"
                  className="type-h2 text-[#1E1916]"
                  lines={[
                    "From kernel tuning",
                    <>
                      to the <em className="type-serif-accent font-medium">final</em> frame.
                    </>,
                  ]}
                />
              </div>
            </div>

            <div className="lg:ml-[16.666%] mb-14 border-y border-[#2B231E]/[0.14] py-10">
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
                <div className="space-y-5 text-[#554C45] prose-measure">
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
                  <h3 className="type-tech-label text-[#A91D22] mb-4">Disciplines</h3>
                  <div className="border-t border-[#2B231E]/[0.14]">
                    {DISCIPLINES.map((item) => (
                      <div
                        key={item.index}
                        className="grid grid-cols-1 sm:grid-cols-[44px_1fr] gap-2 sm:gap-4 border-b border-[#2B231E]/[0.14] py-5"
                      >
                        <span className="font-mono text-xs text-[#766C63] tabular-nums pt-1">
                          {item.index}
                        </span>
                        <div>
                          <h4 className="text-lg font-semibold tracking-[-0.02em] text-[#1E1916]">
                            {item.title}
                          </h4>
                          <p className="mt-1.5 text-sm sm:text-base text-[#554C45] leading-relaxed prose-measure">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unboxed Hairline Stack Specification */}
                <div>
                  <h3 className="type-tech-label text-[#A91D22] mb-4">Technical Stack</h3>
                  <div className="border-t border-[#2B231E]/[0.14]">
                    {STACK_CATEGORIES.map((group) => (
                      <div
                        key={group.name}
                        className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 sm:gap-6 border-b border-[#2B231E]/[0.14] py-4 items-baseline"
                      >
                        <span className="text-sm font-medium text-[#1E1916]">
                          {group.name}
                        </span>
                        <p className="font-mono text-xs leading-relaxed text-[#554C45]">
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
                  className="max-w-[460px] lg:ml-auto shadow-[0_18px_42px_rgba(43,35,30,0.12)]"
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
                <div className="mt-3 max-w-[460px] lg:ml-auto flex items-center justify-between text-xs font-mono text-[#766C63]">
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
                <span className="type-tech-label text-[#A91D22]">04. Contact</span>
              </div>
              <div className="lg:col-span-10">
                <MaskedLineReveal
                  as="h2"
                  id="contact-heading"
                  className="type-h2 text-[#1E1916]"
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
                <p className="text-base sm:text-lg text-[#554C45] leading-relaxed prose-measure">
                  Available for principal engineering roles, AI infrastructure advisory, and select
                  interactive web engagements.
                </p>

                <div className="border-t border-[#2B231E]/[0.14] pt-5 space-y-4">
                  <div>
                    <span className="type-tech-label text-[#766C63]">Direct Email</span>
                    <div className="mt-1 font-mono text-sm text-[#1E1916] break-all">
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
                    className="rounded-[6px] border border-[#A91D22]/45 bg-[#FBF6EF] p-8 space-y-4 shadow-[0_14px_36px_rgba(43,35,30,0.08)]"
                  >
                    <p className="type-tech-label text-[#A91D22]">Message Recorded</p>
                    <h3 className="text-2xl font-semibold tracking-[-0.025em] text-[#1E1916]">
                      Thank you, {contactName}.
                    </h3>
                    <p className="text-sm sm:text-base text-[#554C45] prose-measure">
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
                    className="rounded-[6px] border border-[#2B231E]/[0.15] bg-[#FBF6EF] p-6 sm:p-8 space-y-5 shadow-[0_14px_36px_rgba(43,35,30,0.07)]"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <label className="block">
                        <span className="type-tech-label text-[#554C45] block mb-2">Name</span>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Your name"
                          className="w-full min-h-[44px] rounded-[4px] border border-[#2B231E]/[0.2] bg-[#F4EADF]/65 px-3.5 py-2.5 text-sm text-[#1E1916] placeholder:text-[#8A7F75] focus:border-[#A91D22] focus:outline-none"
                          required
                        />
                      </label>
                      <label className="block">
                        <span className="type-tech-label text-[#554C45] block mb-2">Email</span>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full min-h-[44px] rounded-[4px] border border-[#2B231E]/[0.2] bg-[#F4EADF]/65 px-3.5 py-2.5 text-sm text-[#1E1916] placeholder:text-[#8A7F75] focus:border-[#A91D22] focus:outline-none"
                          required
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="type-tech-label text-[#554C45] block mb-2">Project or Inquiry</span>
                      <textarea
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Share project scope, architecture context, or timeline..."
                        className="w-full rounded-[4px] border border-[#2B231E]/[0.2] bg-[#F4EADF]/65 px-3.5 py-2.5 text-sm text-[#1E1916] placeholder:text-[#8A7F75] focus:border-[#A91D22] focus:outline-none"
                        required
                      />
                    </label>

                    {contactError && (
                      <p role="alert" className="text-xs font-mono text-[#A91D22]">
                        {contactError}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <span className="font-mono text-xs text-[#766C63]">
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

            <footer className="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-[#2B231E]/[0.14] pt-6 text-xs font-mono text-[#554C45]">
              <span>{IDENTITY.name}</span>
              <div className="flex flex-wrap items-center gap-6">
                <a
                  href={IDENTITY.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#554C45] no-underline hover:text-[#A91D22]"
                >
                  GitHub
                </a>
                <a
                  href="#top"
                  className="inline-flex items-center gap-1.5 text-[#1E1916] no-underline hover:text-[#A91D22]"
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
