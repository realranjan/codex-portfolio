"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Menu, X } from "lucide-react";
import {
  CHAPTERS,
  CONTACT_CONTENT,
  PRIMARY_NAV_CHAPTERS,
  type ChapterSurface,
} from "@/data/portfolio-content";

interface SiteNavProps {
  onOpenResume: () => void;
}

/**
 * Adaptive 3-zone global navigation bar + 8-chapter index drawer + subtle desktop chapter rail.
 *
 * - Preserves the clean Hero top bar appearance at scroll top.
 * - Switches cleanly between Warm Ivory (#F3E9DE) and Primary Burgundy (#792B33)
 *   to match the active chapter surface without expensive backdrop-filter blur.
 * - Reaches every chapter (01 About .. 08 Contact) reliably even across GSAP pinned sections.
 */
export function SiteNav({ onOpenResume }: SiteNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string>("top");
  const [activeSurface, setActiveSurface] = useState<ChapterSurface>("ivory");
  const [menuOpen, setMenuOpen] = useState(false);

  const primaryLinks = CHAPTERS.filter((ch) =>
    (PRIMARY_NAV_CHAPTERS as readonly string[]).includes(ch.id)
  );

  const activeChapter = CHAPTERS.find((ch) => ch.id === activeId) ?? null;

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 48);
      if (y < 120) {
        setActiveId("top");
        setActiveSurface("ivory");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const elements = CHAPTERS.map((ch) => document.getElementById(ch.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveId(id);
            const ch = CHAPTERS.find((c) => c.id === id);
            if (ch) setActiveSurface(ch.surface);
          }
        }
      },
      { rootMargin: "-30% 0px -55% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const navigateToChapter = useCallback((id: string) => {
    setMenuOpen(false);
    if (id === "top") {
      window.history.pushState(null, "", "#top");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const target = document.getElementById(id);
    if (!target) return;
    window.history.pushState(null, "", `#${id}`);
    const top = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  const isBurgundyBar = scrolled && activeSurface === "burgundy";
  const barClass = !scrolled
    ? "is-on-hero"
    : isBurgundyBar
      ? "is-scrolled-burgundy"
      : "is-scrolled";

  const linkText = isBurgundyBar
    ? "text-[#F3E9DE]/78 hover:text-[#F3E9DE]"
    : "text-[#792B33]/78 hover:text-[#792B33]";
  const activeLinkText = isBurgundyBar ? "text-[#F3E9DE]" : "text-[#792B33]";
  const brandText = isBurgundyBar
    ? "text-[#F3E9DE] hover:opacity-80"
    : "text-[#792B33] hover:opacity-80";
  const underlineBg = isBurgundyBar ? "bg-[#F3E9DE]" : "bg-[#792B33]";

  return (
    <>
      <div
        className={`site-nav-wrap font-nav transition-colors duration-300 ${barClass}`}
        data-nav-surface={isBurgundyBar ? "burgundy" : "ivory"}
      >
        <header className="page-container flex h-16 md:h-[74px] items-center justify-between gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              navigateToChapter("top");
            }}
            className={`text-[15px] font-semibold tracking-[-0.02em] whitespace-nowrap shrink-0 no-underline transition-colors ${brandText}`}
          >
            {CONTACT_CONTENT.name}
          </a>

          {/* Zone 2: Clean 5-link horizontal navigation */}
          <nav
            className="hidden md:flex items-center gap-7"
            aria-label="Primary chapter navigation"
          >
            {primaryLinks.map((ch) => {
              const isActive = scrolled && activeId === ch.id;
              return (
                <a
                  key={ch.id}
                  href={`#${ch.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToChapter(ch.id);
                  }}
                  className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 no-underline transition-colors ${
                    isActive ? activeLinkText : linkText
                  }`}
                >
                  {ch.label}
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 right-0 -bottom-0.5 h-[1.5px] transition-transform duration-200 origin-left ${underlineBg} ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Compact Chapter Index Drawer Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-controls="chapters-index-drawer"
              aria-label={menuOpen ? "Close chapters menu" : "Open chapters menu"}
              data-testid="nav-chapters-toggle"
              className={`inline-flex min-h-[40px] items-center gap-2.5 border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isBurgundyBar
                  ? "border-[#F3E9DE]/38 text-[#F3E9DE] hover:bg-[#F3E9DE] hover:text-[#792B33]"
                  : "border-[#792B33]/34 text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE]"
              }`}
            >
              <span className="tabular-nums">
                {activeChapter ? `${activeChapter.number} / 08` : "Chapters"}
              </span>
              {menuOpen ? (
                <X size={15} strokeWidth={1.7} aria-hidden="true" />
              ) : (
                <Menu size={15} strokeWidth={1.7} aria-hidden="true" />
              )}
            </button>
          </div>
        </header>

        {/* Full 8-Chapter Editorial Index Drawer (Desktop & Mobile) */}
        {menuOpen && (
          <nav
            id="chapters-index-drawer"
            aria-label="All portfolio chapters"
            data-testid="chapters-index-drawer"
            className="border-t border-[#792B33]/20 bg-[#F3E9DE] text-[#792B33] shadow-[0_24px_60px_rgba(121,43,51,0.16)]"
          >
            <div className="page-container py-6 sm:py-8">
              <div className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-[#792B33]/65">
                <span>Portfolio Chapters · 01 — 08</span>
                <span>Select to jump</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 border-y border-[#792B33]/18 py-4">
                {CHAPTERS.map((ch) => {
                  const isCurrent = activeId === ch.id;
                  return (
                    <a
                      key={ch.id}
                      href={`#${ch.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToChapter(ch.id);
                      }}
                      className={`group flex min-h-[48px] items-baseline justify-between gap-3 border-b border-[#792B33]/12 px-2 py-2.5 no-underline transition-colors ${
                        isCurrent
                          ? "bg-[#792B33] text-[#F3E9DE]"
                          : "text-[#792B33] hover:bg-[#792B33]/[0.07]"
                      }`}
                    >
                      <span className="flex items-baseline gap-3">
                        <span className="font-mono text-xs tabular-nums opacity-72">
                          {ch.number}
                        </span>
                        <span className="text-sm font-medium">{ch.label}</span>
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-60">
                        {ch.surface}
                      </span>
                    </a>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <a
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToChapter("top");
                  }}
                  className="font-mono text-xs uppercase tracking-[0.16em] text-[#792B33]/75 no-underline hover:text-[#792B33]"
                >
                  00 · Return to Opening Hero
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenResume();
                  }}
                  className="inline-flex min-h-[42px] items-center gap-2 bg-[#792B33] px-5 py-2 font-mono text-xs uppercase tracking-[0.16em] text-[#F3E9DE] cursor-pointer hover:opacity-90"
                >
                  <span>Resume Summary</span>
                  <Download size={14} strokeWidth={1.7} aria-hidden="true" />
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* Minimal Right-Edge Chapter Progress Rail (Wide Desktop Only) */}
      <aside
        aria-label="Chapter progress"
        className={`fixed right-5 top-1/2 z-40 hidden xl:flex -translate-y-1/2 flex-col items-end gap-2 transition-opacity duration-300 ${
          scrolled ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {CHAPTERS.map((ch) => {
          const isCurrent = activeId === ch.id;
          const dotColor = isBurgundyBar
            ? isCurrent
              ? "bg-[#F3E9DE]"
              : "bg-[#F3E9DE]/35 hover:bg-[#F3E9DE]/75"
            : isCurrent
              ? "bg-[#792B33]"
              : "bg-[#792B33]/30 hover:bg-[#792B33]/70";
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => navigateToChapter(ch.id)}
              aria-label={`Jump to chapter ${ch.number}: ${ch.label}`}
              title={`${ch.number} · ${ch.label}`}
              className="group flex items-center gap-2 py-0.5 cursor-pointer"
            >
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.14em] opacity-0 transition-opacity group-hover:opacity-100 ${
                  isBurgundyBar ? "text-[#F3E9DE]" : "text-[#792B33]"
                }`}
              >
                {ch.label}
              </span>
              <span
                className={`block transition-all duration-200 ${dotColor} ${
                  isCurrent ? "h-[2px] w-6" : "h-[2px] w-2.5"
                }`}
              />
            </button>
          );
        })}
      </aside>
    </>
  );
}
