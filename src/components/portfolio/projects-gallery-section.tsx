"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MoveUpRight, Pause, Play } from "lucide-react";
import { PROJECTS, type ProjectCaseStudy } from "@/data/portfolio";
import { CircularGallery, type GalleryItem } from "@/components/ui/circular-gallery";
import { AsciiScramble } from "@/components/motion/ascii-scramble";
import { MaskedLineReveal } from "@/components/motion/masked-line-reveal";

interface ProjectsGallerySectionProps {
  selectedProject: ProjectCaseStudy | null;
  onSelectProject: (project: ProjectCaseStudy) => void;
}

export function ProjectsGallerySection({
  selectedProject,
  onSelectProject,
}: ProjectsGallerySectionProps) {
  const runwayRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualOffsetDeg, setManualOffsetDeg] = useState(0);
  const [paused, setPaused] = useState(false);

  const angleStep = 360 / PROJECTS.length;

  const galleryItems: GalleryItem[] = useMemo(
    () =>
      PROJECTS.map((project) => ({
        id: project.id,
        index: project.index,
        common: project.title,
        binomial: `${project.category} · ${project.year}`,
        accent: project.serifAccent,
        metricLabel: project.metrics[0]?.label,
        metricValue: project.metrics[0]
          ? `${project.metrics[0].label}: ${project.metrics[0].value}`
          : undefined,
        photo: {
          url: project.image.src,
          text: project.imageAlt,
          pos: "50% 45%",
          by: project.stack.slice(0, 3).join(" · "),
        },
      })),
    []
  );

  const activeProject = PROJECTS[activeIndex] ?? PROJECTS[0];

  const handleStep = useCallback(
    (direction: -1 | 1) => {
      // Direction +1 advances to the next project by rotating the ring -angleStep
      setManualOffsetDeg((prev) => prev - direction * angleStep);
    },
    [angleStep]
  );

  const handleJumpToIndex = useCallback(
    (targetIdx: number) => {
      const diff = targetIdx - activeIndex;
      if (diff === 0) return;
      const wrapped =
        ((diff + PROJECTS.length + Math.floor(PROJECTS.length / 2)) % PROJECTS.length) -
        Math.floor(PROJECTS.length / 2);
      setManualOffsetDeg((prev) => prev - wrapped * angleStep);
    },
    [activeIndex, angleStep]
  );

  return (
    <section
      ref={runwayRef}
      id="projects"
      aria-labelledby="projects-heading"
      className="section-band section-band--elevated !py-0 min-h-[145vh] lg:min-h-[185vh]"
    >
      <div className="sticky top-0 flex min-h-[100svh] flex-col justify-between pt-20 pb-8 lg:pt-24 lg:pb-10">
        {/* Top Header */}
        <div className="page-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-end">
            <div className="lg:col-span-2">
              <AsciiScramble text="02 / SELECTED WORK" className="type-tech-label" />
            </div>
            <div className="lg:col-span-6">
              <MaskedLineReveal
                as="h2"
                id="projects-heading"
                className="type-h2 text-[#F3EEF8]"
                lines={[
                  "Systems built for",
                  <>
                    clarity under <em className="type-serif-accent font-medium">scale.</em>
                  </>,
                ]}
              />
            </div>
            <div className="lg:col-span-4">
              <p className="text-sm text-[#ADA4B8] leading-relaxed">
                Scroll, drag, or step through the 3D carousel and select any system card to inspect
                architecture decisions and production metrics.
              </p>
            </div>
          </div>
        </div>

        {/* 3D Circular Gallery Stage */}
        <div
          className="relative my-2 h-[370px] sm:h-[480px] lg:h-[540px] w-full will-change-transform"
          data-testid="projects-circular-gallery"
          data-parallax="gallery-ring"
        >
          <CircularGallery
            items={galleryItems}
            radius={460}
            autoRotateSpeed={0.22}
            scrollTargetRef={runwayRef}
            manualOffsetDeg={manualOffsetDeg}
            paused={paused || Boolean(selectedProject)}
            selectedItemId={selectedProject?.id ?? null}
            onActiveIndexChange={setActiveIndex}
            onSelectItem={(_, idx) => {
              const project = PROJECTS[idx];
              if (project) onSelectProject(project);
            }}
          />
        </div>

        {/* Bottom Interactive Controls & Active Case Readout */}
        <div className="page-container">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-t border-[#393143] pt-5">
            {/* Active Case Info */}
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 min-w-0">
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-[#BCA5D4] tabular-nums shrink-0">
                {activeProject.index} / {String(PROJECTS.length).padStart(2, "0")}
              </span>
              <span className="text-lg font-semibold tracking-[-0.02em] text-[#F3EEF8] whitespace-nowrap shrink-0">
                {activeProject.title}{" "}
                <em className="type-serif-accent font-normal">{activeProject.serifAccent}</em>
              </span>
              <span className="hidden 2xl:inline font-mono text-xs text-[#766C83] truncate max-w-[320px]">
                {activeProject.summary}
              </span>
            </div>

            {/* Carousel Controls + Quick Selectors */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div
                className="hidden sm:flex items-center gap-1 mr-1"
                role="group"
                aria-label="Project index"
              >
                {PROJECTS.map((project, idx) => {
                  const isCurrent = idx === activeIndex;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleJumpToIndex(idx)}
                      aria-label={`Rotate to ${project.title}`}
                      aria-pressed={isCurrent}
                      className={`h-9 min-w-[36px] px-2 rounded-[8px] font-mono text-xs tabular-nums transition-colors duration-200 cursor-pointer ${
                        isCurrent
                          ? "bg-[#BCA5D4] text-[#0D0B12] font-medium"
                          : "border border-[#393143] bg-[#17131F] text-[#ADA4B8] hover:border-[#BCA5D4] hover:text-[#F3EEF8]"
                      }`}
                    >
                      {project.index}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handleStep(-1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#393143] bg-[#17131F] text-[#F3EEF8] transition-colors duration-200 hover:border-[#BCA5D4] hover:text-[#BCA5D4] cursor-pointer"
                aria-label="Previous project"
              >
                <ChevronLeft size={16} strokeWidth={1.6} />
              </button>

              <button
                type="button"
                onClick={() => handleStep(1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#393143] bg-[#17131F] text-[#F3EEF8] transition-colors duration-200 hover:border-[#BCA5D4] hover:text-[#BCA5D4] cursor-pointer"
                aria-label="Next project"
              >
                <ChevronRight size={16} strokeWidth={1.6} />
              </button>

              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#393143] bg-[#17131F] text-[#F3EEF8] transition-colors duration-200 hover:border-[#BCA5D4] hover:text-[#BCA5D4] cursor-pointer"
                aria-label={paused ? "Resume gallery rotation" : "Pause gallery rotation"}
                aria-pressed={paused}
              >
                {paused ? (
                  <Play size={14} strokeWidth={1.6} />
                ) : (
                  <Pause size={14} strokeWidth={1.6} />
                )}
              </button>

              <button
                type="button"
                onClick={() => onSelectProject(activeProject)}
                className="btn-primary"
              >
                <span>Inspect case</span>
                <MoveUpRight size={14} strokeWidth={1.6} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
