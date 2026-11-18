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
          { opacity: 1, duration: 0.32, ease: "power2.out" }
        );
        gsap.fromTo(
          panelRef.current,
          { xPercent: 6, opacity: 0, clipPath: "inset(0% 0% 0% 10%)" },
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
            { opacity: 0, y: 12 },
            {
              opacity: 1,
              y: 0,
              duration: 0.42,
              delay: 0.12,
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
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-[#0A0A0C]/80"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="relative z-10 flex h-full w-full max-w-[720px] flex-col overflow-y-auto border-l border-white/[0.1] bg-[#121216] p-6 sm:p-10 text-[#F4F1EA]"
      >
        <div
          data-flyout-stagger
          className="flex items-center justify-between gap-4 border-b border-white/[0.1] pb-5"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] border border-white/[0.12] bg-[#1B1A20] text-[#F4F1EA] transition-colors duration-200 hover:border-[#C4B0DC] hover:text-[#C4B0DC]"
            aria-label={`Close ${project.title} details`}
          >
            <X size={18} strokeWidth={1.6} />
          </button>
        </div>

        <div className="mt-7 space-y-7">
          <div data-flyout-stagger>
            <p className="type-tech-label text-[#C4B0DC] mb-2">{project.category}</p>
            <h3 id="flyout-project-title" className="type-h2 text-[#F4F1EA]">
              {project.title}{" "}
              <span className="type-serif-accent font-normal">{project.serifAccent}</span>
            </h3>
            <p className="mt-3 text-base leading-relaxed text-[#A19D97] prose-measure">
              {project.summary}
            </p>
          </div>

          <div
            data-flyout-stagger
            className="relative aspect-[16/9] w-full overflow-hidden rounded-[6px] border border-white/[0.1] bg-[#0A0A0C]"
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

          <div
            data-flyout-stagger
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-white/[0.1] py-5"
          >
            {project.metrics.map((metric) => (
              <div key={metric.label}>
                <div className="type-tech-label text-[#6C6863]">{metric.label}</div>
                <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-[#F4F1EA]">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          <div data-flyout-stagger>
            <h4 className="type-tech-label text-[#C4B0DC] mb-3">Architecture Notes</h4>
            <ul className="space-y-3 border-t border-white/[0.08] pt-3 list-none p-0 m-0">
              {project.architecture.map((point, idx) => (
                <li
                  key={idx}
                  className="grid grid-cols-[28px_1fr] gap-3 text-sm sm:text-base leading-relaxed text-[#A19D97]"
                >
                  <span className="font-mono text-xs text-[#6C6863] pt-1 tabular-nums">
                    0{idx + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            data-flyout-stagger
            className="border-t border-white/[0.1] pt-5 space-y-4"
          >
            <div>
              <div className="type-tech-label text-[#6C6863]">Outcome</div>
              <p className="mt-1.5 text-sm sm:text-base text-[#F4F1EA] leading-relaxed">
                {project.outcome}
              </p>
            </div>
            <div className="border-t border-white/[0.08] pt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs font-mono text-[#A19D97]">
                {project.stack.join(" · ")}
              </div>
              <a
                href={`https://${project.repoSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[#C4B0DC] no-underline hover:text-[#D9CAE8] whitespace-nowrap shrink-0"
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
