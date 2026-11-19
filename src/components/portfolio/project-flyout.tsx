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
        className="fixed inset-0 bg-[#1E1916]/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="relative z-10 flex h-full w-full max-w-[720px] flex-col overflow-y-auto border-l border-[#2B231E]/[0.16] bg-[#FBF6EF] p-6 sm:p-10 text-[#1E1916] shadow-[0_0_54px_rgba(30,25,22,0.22)]"
      >
        <div
          data-flyout-stagger
          className="flex items-center justify-between gap-4 border-b border-[#2B231E]/[0.14] pb-5"
        >
          <div className="flex items-center gap-3 type-tech-label text-[#766C63]">
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] border border-[#2B231E]/[0.18] bg-[#F4EADF] text-[#1E1916] transition-colors duration-200 hover:border-[#A91D22] hover:text-[#A91D22] cursor-pointer"
            aria-label={`Close ${project.title} details`}
          >
            <X size={18} strokeWidth={1.6} />
          </button>
        </div>

        <div className="mt-7 space-y-7">
          <div data-flyout-stagger>
            <p className="type-tech-label text-[#A91D22] mb-2">{project.category}</p>
            <h3 id="flyout-project-title" className="type-h2 text-[#1E1916]">
              {project.title}{" "}
              <span className="type-serif-accent font-normal">{project.serifAccent}</span>
            </h3>
            <p className="mt-3 text-base leading-relaxed text-[#554C45] prose-measure">
              {project.summary}
            </p>
          </div>

          <div
            data-flyout-stagger
            className="relative aspect-[16/9] w-full overflow-hidden rounded-[6px] border border-[#2B231E]/[0.16] bg-[#EAE0D2]"
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
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-[#2B231E]/[0.14] py-5"
          >
            {project.metrics.map((metric) => (
              <div key={metric.label}>
                <div className="type-tech-label text-[#766C63]">{metric.label}</div>
                <div className="mt-1 font-mono text-2xl font-medium tabular-nums text-[#1E1916]">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          <div data-flyout-stagger>
            <h4 className="type-tech-label text-[#A91D22] mb-3">Architecture Notes</h4>
            <ul className="space-y-3 border-t border-[#2B231E]/[0.12] pt-3 list-none p-0 m-0">
              {project.architecture.map((point, idx) => (
                <li
                  key={idx}
                  className="grid grid-cols-[28px_1fr] gap-3 text-sm sm:text-base leading-relaxed text-[#554C45]"
                >
                  <span className="font-mono text-xs text-[#766C63] pt-1 tabular-nums">
                    0{idx + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            data-flyout-stagger
            className="border-t border-[#2B231E]/[0.14] pt-5 space-y-4"
          >
            <div>
              <div className="type-tech-label text-[#766C63]">Outcome</div>
              <p className="mt-1.5 text-sm sm:text-base text-[#1E1916] leading-relaxed">
                {project.outcome}
              </p>
            </div>
            <div className="border-t border-[#2B231E]/[0.12] pt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs font-mono text-[#554C45]">
                {project.stack.join(" · ")}
              </div>
              <a
                href={`https://${project.repoSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[#A91D22] no-underline hover:text-[#7D1217] whitespace-nowrap shrink-0"
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
