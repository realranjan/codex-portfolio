"use client";

import { useEffect, useState } from "react";
import { Download, Menu, X } from "lucide-react";
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
      setScrolled(window.scrollY > 36);
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
    <div
      className={`site-nav-wrap ${scrolled ? "is-scrolled" : "is-on-hero"}`}
      data-nav-theme="washi-sumi"
    >
      <header className="page-container flex h-16 md:h-[74px] items-center justify-between gap-8">
        <a
          href="#top"
          className="text-[15px] font-semibold tracking-[-0.02em] text-[#1E1916] whitespace-nowrap shrink-0 no-underline hover:text-[#A91D22]"
        >
          {IDENTITY.name}
        </a>

        <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => {
            const isActive = scrolled && activeId === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 no-underline ${
                  isActive
                    ? "text-[#1E1916]"
                    : "text-[#4D443E] hover:text-[#1E1916]"
                }`}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#A91D22] transition-transform duration-200 origin-left ${
                    isActive ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenResume}
            aria-label="Open resume"
            className="btn-secondary hidden sm:inline-flex"
          >
            <span>Resume</span>
            <Download size={14} strokeWidth={1.7} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden h-11 w-11 items-center justify-center rounded-full border border-[#2B231E]/28 bg-[#FBF6EF]/90 text-[#1E1916] hover:border-[#A91D22]"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileOpen ? <X size={18} strokeWidth={1.6} /> : <Menu size={18} strokeWidth={1.6} />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <nav
          id="mobile-nav-drawer"
          aria-label="Mobile navigation"
          className="md:hidden border-t border-[#2B231E]/14 bg-[#F4EADF] px-5 py-5"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={handleLinkClick}
                className="flex min-h-[44px] items-center justify-between border-b border-[#2B231E]/10 py-2 text-base font-medium text-[#1E1916] no-underline hover:text-[#A91D22]"
              >
                <span>{link.label}</span>
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
                <span>Resume</span>
                <Download size={14} strokeWidth={1.7} aria-hidden="true" />
              </button>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
