"use client";

import {
  useCallback,
  useMemo,
  useState,
  type MutableRefObject,
  type RefObject,
} from "react";
import { ChevronLeft, ChevronRight, MoveUpRight, Pause, Play } from "lucide-react";
import { PROJECTS, type ProjectCaseStudy } from "@/data/portfolio";
import { CircularGallery, type GalleryItem } from "@/components/ui/circular-gallery";

interface ProjectsGallerySectionProps {
  selectedProject: ProjectCaseStudy | null;
  onSelectProject: (project: ProjectCaseStudy) => void;
  scrollTargetRef: RefObject<HTMLElement | null>;
  ringDrawMixRef: MutableRefObject<number>;
  carouselMixRef: MutableRefObject<number>;
  hudRef: RefObject<HTMLDivElement | null>;
}

export function ProjectsGallerySection({
  selectedProject,
  onSelectProject,
  scrollTargetRef,
  ringDrawMixRef,
  carouselMixRef,
  hudRef,
}: ProjectsGallerySectionProps) {
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
    <>
      {/* 3D Circular Ring Stages (Back hemisphere behind bust, Front hemisphere in front) */}
      <CircularGallery
        items={galleryItems}
        radius={510}
        tiltDeg={-9}
        autoRotateSpeed={0.2}
        scrollTargetRef={scrollTargetRef}
        ringDrawMixRef={ringDrawMixRef}
        carouselMixRef={carouselMixRef}
        manualOffsetDeg={manualOffsetDeg}
        paused={paused || Boolean(selectedProject)}
        selectedItemId={selectedProject?.id ?? null}
        onActiveIndexChange={setActiveIndex}
        onSelectItem={(_, idx) => {
          const project = PROJECTS[idx];
          if (project) onSelectProject(project);
        }}
        data-testid="projects-circular-gallery"
      />

      {/* Top & Bottom Selected Work HUD (revealed once bust centers) */}
      <div
        ref={hudRef}
        data-testid="projects-hud"
        className="pointer-events-none absolute inset-0 z-[20] flex flex-col justify-between will-change-[transform,opacity]"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        {/* Top Header Row with gentle warm washi contrast veil */}
        <div
          className="pt-[84px] pb-6 lg:pt-24 lg:pb-8"
          style={{
            background:
              "linear-gradient(to bottom, rgba(244,234,223,0.94) 0%, rgba(244,234,223,0.68) 64%, transparent 100%)",
          }}
        >
          <div className="page-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-8 items-end">
              <div className="lg:col-span-2">
                <span className="type-tech-label text-[#A91D22]">01. Selected Work</span>
              </div>
              <div className="lg:col-span-6">
                <h2
                  id="projects-heading"
                  className="text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.035em] text-[#1E1916]"
                >
                  Production systems, built to hold{" "}
                  <em className="type-serif-accent font-medium">latency.</em>
                </h2>
              </div>
              <div className="hidden sm:block lg:col-span-4">
                <p className="text-xs sm:text-sm text-[#554C45] leading-relaxed">
                  Scroll or drag to orbit projects around the sculpture. Select any card for
                  architecture notes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Case Controls Dock with warm washi paper backing */}
        <div
          className="pt-8 pb-5 lg:pt-10 lg:pb-7"
          style={{
            background:
              "linear-gradient(to top, rgba(244,234,223,0.96) 0%, rgba(244,234,223,0.78) 58%, transparent 100%)",
          }}
        >
          <div className="page-container">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-t border-[#2B231E]/[0.15] pt-3.5 sm:pt-4">
              <div className="flex items-baseline gap-3 sm:gap-4 min-w-0">
                <span className="font-mono text-xs text-[#A91D22] tabular-nums shrink-0">
                  {activeProject.index} / {String(PROJECTS.length).padStart(2, "0")}
                </span>
                <span className="text-base sm:text-lg font-semibold tracking-[-0.02em] text-[#1E1916] whitespace-nowrap shrink-0">
                  {activeProject.title}{" "}
                  <em className="type-serif-accent font-normal">{activeProject.serifAccent}</em>
                </span>
                <span className="hidden xl:inline font-mono text-xs text-[#554C45] truncate max-w-[380px]">
                  {activeProject.summary}
                </span>
              </div>

            <div className="pointer-events-auto flex flex-wrap items-center gap-2 shrink-0">
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
                      className={`h-9 min-w-[36px] px-2 rounded-[4px] font-mono text-xs tabular-nums transition-colors duration-200 cursor-pointer ${
                        isCurrent
                          ? "bg-[#A91D22] text-[#FBF6EF] font-medium"
                          : "border border-[#2B231E]/[0.18] bg-[#FBF6EF] text-[#554C45] hover:border-[#A91D22] hover:text-[#1E1916]"
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] border border-[#2B231E]/[0.18] bg-[#FBF6EF] text-[#1E1916] transition-colors duration-200 hover:border-[#A91D22] hover:text-[#A91D22] cursor-pointer"
                aria-label="Previous project"
              >
                <ChevronLeft size={16} strokeWidth={1.6} />
              </button>

              <button
                type="button"
                onClick={() => handleStep(1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] border border-[#2B231E]/[0.18] bg-[#FBF6EF] text-[#1E1916] transition-colors duration-200 hover:border-[#A91D22] hover:text-[#A91D22] cursor-pointer"
                aria-label="Next project"
              >
                <ChevronRight size={16} strokeWidth={1.6} />
              </button>

              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] border border-[#2B231E]/[0.18] bg-[#FBF6EF] text-[#1E1916] transition-colors duration-200 hover:border-[#A91D22] hover:text-[#A91D22] cursor-pointer"
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
      </div>
    </>
  );
}
