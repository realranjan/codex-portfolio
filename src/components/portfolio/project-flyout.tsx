"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ArrowUpRight, X } from "lucide-react";
import type { ProjectCaseStudy } from "@/data/portfolio";
import { MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from "@/lib/motion";

interface ProjectFlyoutProps {
  project: ProjectCaseStudy | null;
  onClose: () => void;
}

export function ProjectFlyout({ project, onClose }: ProjectFlyoutProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!project) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 60);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced && overlayRef.current && panelRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.35, ease: "power2.out" }
        );
        gsap.fromTo(
          panelRef.current,
          { xPercent: 8, opacity: 0, clipPath: "inset(0% 0% 0% 12%)" },
          {
            xPercent: 0,
            opacity: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            duration: MOTION_DURATION.flyout,
            ease: MOTION_EASE.editorial,
            clearProps: "clipPath,transform",
          }
        );
        const staggerItems = panelRef.current?.querySelectorAll<HTMLElement>("[data-flyout-stagger]");
        if (staggerItems && staggerItems.length > 0) {
          gsap.fromTo(
            staggerItems,
            { opacity: 0, y: 14 },
            {
              opacity: 1,
              y: 0,
              duration: 0.45,
              delay: 0.14,
              stagger: MOTION_STAGGER.tight,
              ease: MOTION_EASE.editorial,
              clearProps: "transform,opacity",
            }
          );
        }
      }, panelRef);

      return () => {
        ctx.revert();
        window.clearTimeout(focusTimer);
        window.removeEventListener("keydown", onKeyDown);
        document.body.style.overflow = prevOverflow;
      };
    }

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flyout-project-title"
      data-testid="project-flyout"
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-[#0D0B12]/80"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative z-10 flex h-full w-full max-w-[720px] flex-col overflow-y-auto border-l border-[#393143] bg-[#17131F] p-6 sm:p-10 text-[#F3EEF8]"
      >
        <div
          data-flyout-stagger
          className="flex items-center justify-between gap-4 border-b border-[#393143] pb-5"
        >
          <div className="flex items-center gap-3 type-tech-label">
            <span>Case {project.index}</span>
            <span aria-hidden="true">·</span>
            <span>{project.year}</span>
            <span aria-hidden="true">·</span>
            <span>{project.coordinates}</span>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#393143] bg-[#25202E] text-[#F3EEF8] transition-colors duration-200 hover:border-[#BCA5D4] hover:text-[#BCA5D4]"
            aria-label={`Close ${project.title} details`}
          >
            <X size={18} strokeWidth={1.6} />
          </button>
        </div>

        <div className="mt-7 space-y-7">
          <div data-flyout-stagger>
            <p className="type-tech-label text-[#BCA5D4] mb-2">{project.category}</p>
            <h3 id="flyout-project-title" className="type-h2 text-[#F3EEF8]">
              {project.title}{" "}
              <span className="type-serif-accent font-normal">{project.serifAccent}</span>
            </h3>
            <p className="mt-3 text-base leading-relaxed text-[#ADA4B8] prose-measure">
              {project.summary}
            </p>
          </div>

          {/* Media */}
          <div
            data-flyout-stagger
            className="relative aspect-[16/9] w-full overflow-hidden rounded-[12px] border border-[#393143] bg-[#0D0B12]"
          >
            <Image
              src={project.image}
              alt={project.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 680px"
              referrerPolicy="no-referrer"
              className="object-cover"
            />
          </div>

          {/* Metrics Row */}
          <div
            data-flyout-stagger
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-[#393143] py-5"
          >
            {project.metrics.map((metric) => (
              <div key={metric.label}>
                <div className="type-tech-label text-[#766C83]">{metric.label}</div>
                <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-[#F3EEF8]">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          {/* Architecture Breakdown */}
          <div data-flyout-stagger>
            <h4 className="type-tech-label text-[#BCA5D4] mb-3">Architecture Decisions</h4>
            <ul className="space-y-3 border-t border-[#393143]/70 pt-3 list-none p-0 m-0">
              {project.architecture.map((point, idx) => (
                <li
                  key={idx}
                  className="grid grid-cols-[28px_1fr] gap-3 text-sm sm:text-base leading-relaxed text-[#ADA4B8]"
                >
                  <span className="font-mono text-xs text-[#766C83] pt-1 tabular-nums">
                    0{idx + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Outcome & Stack */}
          <div
            data-flyout-stagger
            className="rounded-[12px] border border-[#393143] bg-[#0D0B12] p-5 space-y-4"
          >
            <div>
              <div className="type-tech-label text-[#766C83]">Measured Outcome</div>
              <p className="mt-1.5 text-sm sm:text-base text-[#F3EEF8] leading-relaxed">
                {project.outcome}
              </p>
            </div>
            <div className="border-t border-[#393143]/70 pt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs font-mono text-[#ADA4B8] tracking-[0.04em]">
                {project.stack.join(" · ")}
              </div>
              <a
                href={`https://${project.repoSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.08em] text-[#BCA5D4] no-underline hover:text-[#D2BCE8] whitespace-nowrap shrink-0"
              >
                <span>Source Repository</span>
                <ArrowUpRight size={14} strokeWidth={1.6} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
