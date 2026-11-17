"use client";

import { useEffect, useState } from "react";
import { FileText, Menu, X } from "lucide-react";
import { IDENTITY, NAV_LINKS } from "@/data/portfolio";

interface SiteNavProps {
  onOpenResume: () => void;
}

export function SiteNav({ onOpenResume }: SiteNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string>("top");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = ["projects", "about", "experience", "contact"];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-35% 0px -50% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  return (
    <div className={`site-nav-wrap ${scrolled ? "is-scrolled" : ""}`}>
      <header className="page-container flex h-16 md:h-[72px] items-center justify-between gap-8">
        {/* Zone 1: Identity / Monogram */}
        <a
          href="#top"
          className="inline-flex items-center gap-3 whitespace-nowrap shrink-0 text-[#F3EEF8] no-underline group"
          aria-label={`${IDENTITY.name} — Back to top`}
        >
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#393143] bg-[#17131F] font-mono text-xs font-medium tracking-[0.08em] text-[#BCA5D4] transition-colors duration-200 group-hover:border-[#BCA5D4] group-hover:text-[#F3EEF8]"
            aria-hidden="true"
          >
            {IDENTITY.monogram}
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#F3EEF8]">
            {IDENTITY.name}
          </span>
        </a>

        {/* Zone 2: Persistent Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => {
            const isActive = activeId === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 no-underline transition-colors duration-200 ${
                  isActive
                    ? "text-[#F3EEF8]"
                    : "text-[#ADA4B8] hover:text-[#F3EEF8]"
                }`}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 -bottom-0.5 h-[1px] bg-[#BCA5D4] transition-transform duration-200 origin-left ${
                    isActive ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Primary Resume Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenResume}
            className="btn-secondary hidden sm:inline-flex"
            aria-label="Open engineering resume"
          >
            <FileText size={15} strokeWidth={1.6} aria-hidden="true" />
            <span>Resume</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden h-11 w-11 items-center justify-center rounded-[8px] border border-[#393143] bg-[#17131F] text-[#F3EEF8] transition-colors duration-200 hover:border-[#BCA5D4]"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileOpen ? <X size={18} strokeWidth={1.6} /> : <Menu size={18} strokeWidth={1.6} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          id="mobile-nav-drawer"
          aria-label="Mobile navigation"
          className="md:hidden border-t border-[#393143] bg-[#0D0B12] px-5 py-5"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={handleLinkClick}
                className="flex min-h-[44px] items-center justify-between border-b border-[#393143]/60 py-2 text-base font-medium text-[#F3EEF8] no-underline hover:text-[#BCA5D4]"
              >
                <span>{link.label}</span>
                <span className="font-mono text-xs text-[#766C83] uppercase tracking-[0.08em]">
                  Jump
                </span>
              </a>
            ))}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenResume();
                }}
                className="btn-primary w-full justify-center"
              >
                <FileText size={16} strokeWidth={1.6} aria-hidden="true" />
                <span>View Resume</span>
              </button>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
