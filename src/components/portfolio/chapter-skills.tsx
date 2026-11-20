"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, CheckCircle2, Search, X } from "lucide-react";
import { SKILLS_CONTENT, type ChapterSurface } from "@/data/portfolio-content";
import {
  TECH_CONCEPTS_MANIFEST,
  TECH_ICON_CATEGORIES,
  TECH_ICONS_MANIFEST,
  type TechCategoryId,
  type TechIconEntry,
} from "@/data/tech-icons-manifest";
import { ChapterHeading } from "@/components/portfolio/editorial-primitives";
import { TechIcon } from "@/components/portfolio/tech-icon";
import { TechStackRibbon } from "@/components/portfolio/tech-ribbon";

gsap.registerPlugin(ScrollTrigger);

function shortSourceTag(source: string): string {
  if (source.startsWith("Devicon")) return "Devicon";
  if (source.startsWith("SVG Logos")) return "SVG Logos";
  if (source.startsWith("Simple Icons")) return "Simple Icons";
  return "Unverified";
}

/**
 * CHAPTER 04 — SKILLS & TECHNOLOGY (Burgundy #792B33 / Ivory #F3E9DE)
 *
 * Interactive brand-accurate colored SVG technology icon library + full-bleed infinite ribbon:
 * - Covers all 12 domains for AI Engineer, Full-Stack Developer & Creative Technologist.
 * - Full-bleed 3-lane interactive infinite SVG ribbon with geometric dot separators,
 *   hover deceleration, pointer drag/fling physics, and click-to-inspect domain sync.
 * - Renders individual normalized 64x64 transparent SVGs sourced from Devicon, SVG Logos,
 *   and Simple Icons with contrast-safe backing plates for both Burgundy (#792B33) and
 *   Warm Ivory (#F3E9DE) surfaces.
 * - Explicitly separates non-branded engineering concepts & protocols (REST, RAG, NLP,
 *   OAuth 2.0, WebSockets, SQL, GLSL, etc.) into a dedicated text-label manifest band.
 */
export function ChapterSkills() {
  const [activeCategoryId, setActiveCategoryId] = useState<TechCategoryId | "all">("languages");
  const [previewSurface, setPreviewSurface] = useState<ChapterSurface>("burgundy");
  const [query, setQuery] = useState("");
  const [inspectedIcon, setInspectedIcon] = useState<TechIconEntry>(TECH_ICONS_MANIFEST[0]);

  const flightBridgeRef = useRef<HTMLDivElement>(null);
  const bridgePathRef = useRef<SVGPathElement>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const countsByCategory = useMemo(() => {
    const map = new Map<TechCategoryId, number>();
    for (const icon of TECH_ICONS_MANIFEST) {
      map.set(icon.category, (map.get(icon.category) ?? 0) + 1);
    }
    return map;
  }, []);

  const verifiedTotal = useMemo(
    () => TECH_ICONS_MANIFEST.filter((i) => i.verified).length,
    []
  );

  const activeCategory = useMemo(
    () =>
      activeCategoryId === "all"
        ? null
        : (TECH_ICON_CATEGORIES.find((cat) => cat.id === activeCategoryId) ??
          TECH_ICON_CATEGORIES[0]),
    [activeCategoryId]
  );

  const visibleIcons = useMemo(() => {
    return TECH_ICONS_MANIFEST.filter((icon) => {
      if (normalizedQuery) {
        return (
          icon.name.toLowerCase().includes(normalizedQuery) ||
          icon.slug.toLowerCase().includes(normalizedQuery) ||
          icon.category.toLowerCase().includes(normalizedQuery) ||
          icon.source.toLowerCase().includes(normalizedQuery)
        );
      }
      return activeCategoryId === "all" ? true : icon.category === activeCategoryId;
    });
  }, [activeCategoryId, normalizedQuery]);

  const visibleConcepts = useMemo(() => {
    return TECH_CONCEPTS_MANIFEST.filter((concept) => {
      if (normalizedQuery) {
        return (
          concept.label.toLowerCase().includes(normalizedQuery) ||
          concept.summary.toLowerCase().includes(normalizedQuery) ||
          concept.kind.toLowerCase().includes(normalizedQuery)
        );
      }
      return activeCategoryId === "all" ? true : concept.category === activeCategoryId;
    });
  }, [activeCategoryId, normalizedQuery]);

  // Keep inspected icon synchronized when switching categories
  const displayedInspectedIcon = useMemo(() => {
    if (visibleIcons.some((i) => i.slug === inspectedIcon.slug)) {
      return inspectedIcon;
    }
    return visibleIcons[0] ?? inspectedIcon;
  }, [visibleIcons, inspectedIcon]);

  const handleRibbonSelect = (icon: TechIconEntry) => {
    setQuery("");
    setActiveCategoryId(icon.category);
    setInspectedIcon(icon);
  };

  useEffect(() => {
    const bridge = flightBridgeRef.current;
    const path = bridgePathRef.current;
    if (!bridge || !path) return;

    const length = path.getTotalLength();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = "0";
      return;
    }

    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    const ctx = gsap.context(() => {
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: bridge,
          start: "top 88%",
          end: "bottom 42%",
          scrub: true,
        },
      });
    }, flightBridgeRef);

    return () => ctx.revert();
  }, []);

  const isIvoryPreview = previewSurface === "ivory";

  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      data-chapter-surface="burgundy"
      className="relative bg-[#792B33] text-[#F3E9DE] pt-10 sm:pt-14 overflow-x-clip"
    >
      <div className="page-container">
        <ChapterHeading
          id="skills-heading"
          number={SKILLS_CONTENT.chapterNumber}
          label={SKILLS_CONTENT.chapterLabel}
          heading={SKILLS_CONTENT.heading}
          supportingText={SKILLS_CONTENT.supportingText}
          surface="burgundy"
          action={
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#F3E9DE]/76 tabular-nums">
              {verifiedTotal} Verified SVGs · {TECH_ICON_CATEGORIES.length} Domains ·{" "}
              {TECH_CONCEPTS_MANIFEST.length} Concepts
            </span>
          }
        />
      </div>

      {/* Full-Bleed Interactive 3-Lane Infinite Tech Stack SVG Ribbon with Dot Separators */}
      <TechStackRibbon
        surface={previewSurface}
        activeIcon={displayedInspectedIcon}
        searchQuery={query}
        onSelectIcon={handleRibbonSelect}
      />

      <div className="page-container pb-12 sm:pb-16">
        {/* Control Toolbar: Search + Surface Contrast Tester (#792B33 vs #F3E9DE) + View All */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-[#F3E9DE]/18 pb-4">
          {/* Instant Filter */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#F3E9DE]/55"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter technologies, APIs, or concepts (e.g. PyTorch, OpenAI, RAG)..."
              aria-label="Filter technologies and concepts"
              data-testid="skills-search-input"
              className="h-10 w-full border border-[#F3E9DE]/28 bg-[#F3E9DE]/[0.06] pl-9 pr-8 font-mono text-xs text-[#F3E9DE] placeholder:text-[#F3E9DE]/48 focus:border-[#F3E9DE] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#F3E9DE]/70 hover:text-[#F3E9DE] cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* All Domains Toggle */}
            <button
              type="button"
              onClick={() =>
                setActiveCategoryId((prev) => (prev === "all" ? "languages" : "all"))
              }
              aria-pressed={activeCategoryId === "all"}
              data-testid="skills-view-all-toggle"
              className={`h-10 px-3.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors cursor-pointer whitespace-nowrap ${
                activeCategoryId === "all"
                  ? "bg-[#F3E9DE] text-[#792B33] font-medium"
                  : "border border-[#F3E9DE]/28 text-[#F3E9DE]/85 hover:border-[#F3E9DE]"
              }`}
            >
              {activeCategoryId === "all"
                ? `Showing All ${TECH_ICONS_MANIFEST.length}`
                : `View All ${TECH_ICONS_MANIFEST.length}`}
            </button>

            {/* Dual-Surface Contrast Switcher (Burgundy #792B33 vs Ivory #F3E9DE) */}
            <div
              role="group"
              aria-label="Preview icon plate on portfolio background"
              className="inline-flex border border-[#F3E9DE]/28 p-0.5"
            >
              <button
                type="button"
                onClick={() => setPreviewSurface("burgundy")}
                aria-pressed={previewSurface === "burgundy"}
                data-testid="skills-surface-burgundy"
                className={`h-9 px-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors cursor-pointer whitespace-nowrap ${
                  previewSurface === "burgundy"
                    ? "bg-[#F3E9DE] text-[#792B33] font-medium"
                    : "text-[#F3E9DE]/78 hover:text-[#F3E9DE]"
                }`}
              >
                On Burgundy
              </button>
              <button
                type="button"
                onClick={() => setPreviewSurface("ivory")}
                aria-pressed={previewSurface === "ivory"}
                data-testid="skills-surface-ivory"
                className={`h-9 px-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors cursor-pointer whitespace-nowrap ${
                  previewSurface === "ivory"
                    ? "bg-[#F3E9DE] text-[#792B33] font-medium"
                    : "text-[#F3E9DE]/78 hover:text-[#F3E9DE]"
                }`}
              >
                On Ivory
              </button>
            </div>
          </div>
        </div>

        {/* Interactive 12-Domain Brand Icon Explorer */}
        <div
          data-testid="skills-explorer"
          className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
        >
          {/* Left Rail: 12 Curated Technology Domains */}
          <div
            className="lg:col-span-4 border-t border-[#F3E9DE]/20"
            role="tablist"
            aria-label="Technology domains"
          >
            {TECH_ICON_CATEGORIES.map((category) => {
              const isSelected = !normalizedQuery && activeCategoryId === category.id;
              const count = countsByCategory.get(category.id) ?? 0;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  id={`skill-tab-${category.id}`}
                  aria-selected={isSelected}
                  onClick={() => {
                    setQuery("");
                    setActiveCategoryId(category.id);
                  }}
                  className={`group flex w-full items-baseline justify-between gap-3 border-b border-[#F3E9DE]/16 py-2.5 text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-[#F3E9DE]/[0.08] px-3 text-[#F3E9DE]"
                      : "px-1 text-[#F3E9DE]/58 hover:text-[#F3E9DE]"
                  }`}
                >
                  <span className="flex items-baseline gap-3 min-w-0">
                    <span className="font-mono text-[11px] tracking-[0.16em] tabular-nums shrink-0 opacity-75">
                      {category.number}
                    </span>
                    <span
                      className="font-normal uppercase leading-[1.02] tracking-[-0.015em] truncate"
                      style={{
                        fontFamily: "var(--font-anton), Impact, sans-serif",
                        fontSize: "clamp(18px, 1.85vw, 24px)",
                      }}
                    >
                      {category.title}
                    </span>
                  </span>

                  <span className="flex items-center gap-2 shrink-0 font-mono text-[11px] tabular-nums">
                    <span className="opacity-75">{String(count).padStart(2, "0")}</span>
                    <ArrowRight
                      size={13}
                      strokeWidth={1.7}
                      aria-hidden="true"
                      className={`transition-transform duration-200 ${
                        isSelected ? "translate-x-0.5 opacity-100" : "opacity-35"
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Panel: Authentic Colored SVG Library Grid + Inspector */}
          <div className="lg:col-span-8 space-y-5">
            <div
              role="tabpanel"
              data-testid="skills-active-panel"
              data-preview-surface={previewSurface}
              className={`border p-5 sm:p-6 transition-colors duration-300 ${
                isIvoryPreview
                  ? "border-[#F3E9DE] bg-[#F3E9DE] text-[#792B33]"
                  : "border-[#F3E9DE]/24 bg-[#F3E9DE]/[0.04] text-[#F3E9DE]"
              }`}
            >
              {/* Panel Header */}
              <div
                className={`flex flex-wrap items-baseline justify-between gap-3 border-b pb-3.5 ${
                  isIvoryPreview ? "border-[#792B33]/18" : "border-[#F3E9DE]/18"
                }`}
              >
                <div>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.2em] tabular-nums ${
                      isIvoryPreview ? "text-[#792B33]/68" : "text-[#F3E9DE]/68"
                    }`}
                  >
                    {normalizedQuery
                      ? `Search Results · ${visibleIcons.length} Verified Icons`
                      : activeCategory
                        ? `Domain ${activeCategory.number} / ${String(TECH_ICON_CATEGORIES.length).padStart(2, "0")} · Branded Technologies`
                        : `Complete Library · ${visibleIcons.length} Branded Technologies`}
                  </span>
                  <h3
                    className="mt-1 m-0 font-normal uppercase leading-[0.95] tracking-[-0.02em]"
                    style={{
                      fontFamily: "var(--font-anton), Impact, sans-serif",
                      fontSize: "clamp(26px, 2.4vw, 36px)",
                    }}
                  >
                    {normalizedQuery
                      ? `Matching “${query.trim()}”`
                      : activeCategory
                        ? activeCategory.title
                        : "All 12 Technology Domains"}
                  </h3>
                  {!normalizedQuery && activeCategory && (
                    <p
                      className={`mt-1.5 m-0 text-xs sm:text-sm leading-relaxed max-w-[60ch] ${
                        isIvoryPreview ? "text-[#792B33]/78" : "text-[#F3E9DE]/76"
                      }`}
                    >
                      {activeCategory.summary}
                    </p>
                  )}
                </div>

                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
                    isIvoryPreview ? "text-[#792B33]/62" : "text-[#F3E9DE]/62"
                  }`}
                >
                  {isIvoryPreview ? "Surface: Ivory #F3E9DE" : "Surface: Burgundy #792B33"}
                </span>
              </div>

              {/* Individual Colored Brand SVG Grid */}
              {visibleIcons.length > 0 ? (
                <div
                  data-testid="skills-icon-grid"
                  className={`mt-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 ${
                    activeCategoryId === "all" && !normalizedQuery
                      ? "max-h-[540px] overflow-y-auto pr-1"
                      : ""
                  }`}
                >
                  {visibleIcons.map((icon) => {
                    const isInspected = displayedInspectedIcon?.slug === icon.slug;
                    return (
                      <button
                        key={icon.slug}
                        type="button"
                        onClick={() => setInspectedIcon(icon)}
                        onMouseEnter={() => setInspectedIcon(icon)}
                        data-testid={`tech-icon-card-${icon.slug}`}
                        aria-pressed={isInspected}
                        className={`group flex items-center gap-3 border p-2.5 text-left transition-all duration-200 cursor-pointer ${
                          isIvoryPreview
                            ? isInspected
                              ? "border-[#792B33] bg-[#792B33]/[0.08]"
                              : "border-[#792B33]/18 bg-transparent hover:border-[#792B33]/55"
                            : isInspected
                              ? "border-[#F3E9DE]/72 bg-[#F3E9DE]/[0.11]"
                              : "border-[#F3E9DE]/16 bg-transparent hover:border-[#F3E9DE]/45"
                        }`}
                      >
                        <TechIcon
                          icon={icon}
                          surface={previewSurface}
                          size="md"
                          className="group-hover:scale-[1.04]"
                        />

                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-xs sm:text-[13px] font-semibold leading-tight">
                            {icon.name}
                          </span>
                          <span
                            className={`mt-1 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em] ${
                              isIvoryPreview ? "text-[#792B33]/65" : "text-[#F3E9DE]/65"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className="inline-block h-2 w-2 shrink-0 rounded-full border border-current/25"
                              style={{ backgroundColor: icon.brandColor }}
                            />
                            <span className="truncate">{shortSourceTag(icon.source)}</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p
                  className={`mt-5 mb-2 font-mono text-xs ${
                    isIvoryPreview ? "text-[#792B33]/68" : "text-[#F3E9DE]/68"
                  }`}
                >
                  No branded technologies match “{query.trim()}”. Check Concepts &amp; Protocols
                  below.
                </p>
              )}

              {/* Compact Asset Metadata Inspector Strip */}
              {displayedInspectedIcon && (
                <div
                  data-testid="skills-icon-inspector"
                  className={`mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-3.5 text-[11px] font-mono ${
                    isIvoryPreview
                      ? "border-[#792B33]/18 text-[#792B33]/82"
                      : "border-[#F3E9DE]/18 text-[#F3E9DE]/82"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 size={13} aria-hidden="true" className="shrink-0" />
                    <span className="font-semibold">{displayedInspectedIcon.name}</span>
                    <span aria-hidden="true" className="opacity-45">
                      ·
                    </span>
                    <span className="truncate opacity-80">
                      {displayedInspectedIcon.iconFile}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.12em] opacity-78">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 rounded-full border border-current/30"
                        style={{ backgroundColor: displayedInspectedIcon.brandColor }}
                      />
                      {displayedInspectedIcon.brandColor}
                    </span>
                    <span>{displayedInspectedIcon.source}</span>
                    <span>
                      {displayedInspectedIcon.verified ? "Verified 64×64 SVG" : "Unverified"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Separate Text-Label Manifest Band: Protocols, Concepts & Standards (Zero Fake Logos) */}
            <div
              data-testid="skills-concepts-manifest"
              className="border border-[#F3E9DE]/20 bg-[#F3E9DE]/[0.03] p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#F3E9DE]/16 pb-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F3E9DE]/78">
                  Protocols, Concepts &amp; Standards · Text-Label Manifest (No Invented Logos)
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#F3E9DE]/55 tabular-nums">
                  {visibleConcepts.length} / {TECH_CONCEPTS_MANIFEST.length} Shown
                </span>
              </div>

              {visibleConcepts.length > 0 ? (
                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {visibleConcepts.map((concept) => (
                    <div
                      key={concept.slug}
                      data-testid={`tech-concept-${concept.slug}`}
                      className="border border-[#F3E9DE]/16 px-3.5 py-2.5"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs sm:text-[13px] font-semibold text-[#F3E9DE]">
                          {concept.label}
                        </span>
                        <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#F3E9DE]/58">
                          {concept.kind}
                        </span>
                      </div>
                      <p className="mt-1 m-0 text-[11.5px] leading-snug text-[#F3E9DE]/72">
                        {concept.summary}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 m-0 font-mono text-[11px] text-[#F3E9DE]/60">
                  No non-branded concepts in this category — select &ldquo;View All&rdquo; to inspect
                  REST, RAG, NLP, OAuth 2.0, WebSockets, SQL, and GLSL.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── COMPACT TRANSITION TO CHAPTER 05 (EXPERIENCE): SINGLE FINE LINE BENDING INTO FLIGHT PATH ── */}
      <div
        ref={flightBridgeRef}
        aria-hidden="true"
        className="relative w-full overflow-hidden"
      >
        <div className="h-[52px] sm:h-[64px] w-full bg-[#792B33]" />
        <div className="h-[52px] sm:h-[64px] w-full bg-[#F3E9DE]" />

        <svg
          viewBox="0 0 1200 140"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 600 0 L 600 70"
            fill="none"
            stroke="#F3E9DE"
            strokeWidth="1.5"
            strokeOpacity="0.65"
          />
          <path
            ref={bridgePathRef}
            d="M 600 70 C 600 109, 340 102, 115 140"
            fill="none"
            stroke="#792B33"
            strokeWidth="1.75"
            strokeDasharray="6 6"
          />
          <circle cx="600" cy="70" r="4.5" fill="#F3E9DE" stroke="#792B33" strokeWidth="2" />
        </svg>
      </div>
    </section>
  );
}
