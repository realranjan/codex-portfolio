"use client";

import { useState, type FormEvent } from "react";
import { ArrowUp, ArrowUpRight, Check, Copy, Send } from "lucide-react";
import { CONTACT_CONTENT, SOCIAL_LINKS } from "@/data/portfolio-content";

interface ChapterContactProps {
  onOpenResume: () => void;
}

/**
 * CHAPTER 08 — CONTACT & FOOTER (Ivory #F3E9DE / Burgundy #792B33)
 *
 * Film-ending closing shot visually echoing the opening Hero:
 * - Massive Burgundy Anton headline (`THE STORY ISN'T FINISHED.`) + warm ivory negative space
 * - Dedicated Samurai Cat return integration slot (hover bow response, clean integration
 *   point referencing `/samurai-cat.glb` without duplicating heavy Hero WebGL loops)
 * - Functional contact inquiry form, copy-to-clipboard email, and unconfigured-aware links
 */
export function ChapterContact({ onOpenResume }: ChapterContactProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [bowActive, setBowActive] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_CONTENT.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2200);
    } catch {
      try {
        const helper = document.createElement("textarea");
        helper.value = CONTACT_CONTENT.email;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(helper);
        if (ok) {
          setCopiedEmail(true);
          window.setTimeout(() => setCopiedEmail(false), 2200);
        }
      } catch {
        setCopiedEmail(false);
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const n = name.trim();
    const em = email.trim();
    const msg = message.trim();

    if (!n) {
      setError("Please enter your name before sending.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (msg.length < 10) {
      setError("Please write a short note (at least 10 characters).");
      return;
    }

    setError(null);
    setSent(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      data-chapter-surface="ivory"
      className="relative bg-[#F3E9DE] text-[#792B33] pt-24 sm:pt-28 pb-12 overflow-x-clip"
    >
      <div className="page-container">
        {/* Dramatic Closing Title Shot (visually echoing the Hero's scale & calm) */}
        <div className="border-b border-[#792B33]/20 pb-12 sm:pb-16">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-[#792B33]/68">
            Chapter {CONTACT_CONTENT.chapterNumber} · {CONTACT_CONTENT.chapterLabel}
          </p>

          <h2
            id="contact-heading"
            className="m-0 font-normal uppercase leading-[0.86] tracking-[-0.032em] text-[#792B33]"
            style={{
              fontFamily: "var(--font-anton), Impact, sans-serif",
              fontSize: "clamp(54px, 9.8vw, 158px)",
              textWrap: "balance",
            }}
          >
            {CONTACT_CONTENT.heading}
          </h2>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <p
              className="lg:col-span-7 m-0 font-serif italic leading-[1.22] text-[#792B33]"
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "clamp(28px, 3vw, 44px)",
              }}
            >
              {CONTACT_CONTENT.supportingStatement}
            </p>
            <p className="lg:col-span-5 m-0 text-base leading-relaxed text-[#792B33]/80 lg:text-right">
              {CONTACT_CONTENT.additionalCopy}
            </p>
          </div>
        </div>

        {/* Main Contact Composition: Samurai Cat Return Echo + Direct Dispatch Form */}
        <div className="mt-14 sm:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Samurai Cat Closing Return Container + Editable Links Registry */}
          <div className="lg:col-span-5 space-y-10">
            {/* Dedicated Samurai Cat Return Integration Container (echoing Hero sun + subtle bow on hover) */}
            <div
              data-asset-slot={CONTACT_CONTENT.characterReturnSlot.slotId}
              onMouseEnter={() => setBowActive(true)}
              onMouseLeave={() => setBowActive(false)}
              className="relative border border-[#792B33]/24 bg-[#792B33]/[0.04] p-6 sm:p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#792B33]/64">
                <span>{CONTACT_CONTENT.characterReturnSlot.label}</span>
                <span>Hero Echo</span>
              </div>

              {/* Architectural corner registration ticks */}
              <span aria-hidden="true" className="pointer-events-none absolute top-2.5 left-2.5 h-3 w-3 border-t border-l border-[#792B33]/40" />
              <span aria-hidden="true" className="pointer-events-none absolute top-2.5 right-2.5 h-3 w-3 border-t border-r border-[#792B33]/40" />
              <span aria-hidden="true" className="pointer-events-none absolute bottom-2.5 left-2.5 h-3 w-3 border-b border-l border-[#792B33]/40" />
              <span aria-hidden="true" className="pointer-events-none absolute bottom-2.5 right-2.5 h-3 w-3 border-b border-r border-[#792B33]/40" />

              {/* Rising sun architectural seal & Samurai Kabuto crest bowing subtly on hover */}
              <div className="relative my-8 flex items-center justify-center">
                <div
                  aria-hidden="true"
                  className="relative flex h-48 w-48 items-center justify-center rounded-full border border-[#792B33]/22"
                >
                  <div
                    className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-[#792B33] text-[#F3E9DE] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      transform: bowActive
                        ? "translateY(8px) scale(0.96) rotate(-2.5deg)"
                        : "translateY(0) scale(1) rotate(0deg)",
                    }}
                  >
                    <svg
                      viewBox="0 0 120 120"
                      className="h-24 w-24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Architectural Kabuto kuwagata crescent horns */}
                      <path
                        d="M18 46 C30 18, 48 32, 60 44 C72 32, 90 18, 102 46 C86 38, 72 44, 60 52 C48 44, 34 38, 18 46 Z"
                        fill="#F3E9DE"
                      />
                      {/* Helm dome & stepped shikoro neck guard */}
                      <path
                        d="M34 54 C36 38, 84 38, 86 54 L92 78 C78 86, 42 86, 28 78 Z"
                        stroke="#F3E9DE"
                        strokeWidth="1.8"
                      />
                      <line x1="34" y1="64" x2="86" y2="64" stroke="#F3E9DE" strokeWidth="1.2" strokeOpacity="0.6" />
                      <line x1="31" y1="72" x2="89" y2="72" stroke="#F3E9DE" strokeWidth="1.2" strokeOpacity="0.45" />
                      {/* Center sun crest stud */}
                      <circle cx="60" cy="48" r="3" fill="#792B33" />
                      {/* Seal monograms */}
                      <text
                        x="60"
                        y="102"
                        textAnchor="middle"
                        fill="#F3E9DE"
                        fillOpacity="0.82"
                        fontSize="9"
                        fontFamily="monospace"
                        letterSpacing="2.4"
                      >
                        FIN · 08
                      </text>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-[#792B33]/18 pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#792B33]/65">
                <span>{CONTACT_CONTENT.characterReturnSlot.sublabel}</span>
                <span>{bowActive ? "Bowing" : "Hover"}</span>
              </div>
            </div>

            {/* Editable Social & Resume Links (unconfigured links explicitly labeled) */}
            <div className="border-t border-[#792B33]/20 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#792B33]/68">
                  Direct Channels
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  aria-label="Copy email address"
                  className="inline-flex min-h-[38px] items-center gap-2 border border-[#792B33]/32 px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[#792B33] hover:bg-[#792B33] hover:text-[#F3E9DE] transition-colors cursor-pointer"
                >
                  {copiedEmail ? (
                    <>
                      <Check size={14} aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} aria-hidden="true" />
                      <span>Copy Email</span>
                    </>
                  )}
                </button>
              </div>

              <div className="divide-y divide-[#792B33]/16 border-y border-[#792B33]/16">
                {SOCIAL_LINKS.map((item) => {
                  if (item.id === "resume") {
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 py-3.5"
                      >
                        <span className="text-sm font-medium text-[#792B33]">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-[#792B33]/58">
                            {item.url ? "PDF Ready" : "Unconfigured PDF · Preview Available"}
                          </span>
                          <button
                            type="button"
                            onClick={onOpenResume}
                            className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.14em] text-[#792B33] underline underline-offset-4 hover:opacity-75 cursor-pointer"
                          >
                            <span>Summary</span>
                            <ArrowUpRight size={13} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-3.5"
                    >
                      <span className="text-sm font-medium text-[#792B33]">
                        {item.label}
                      </span>
                      {item.url ? (
                        <a
                          href={item.url}
                          target={item.url.startsWith("mailto:") ? undefined : "_blank"}
                          rel={item.url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-[#792B33] no-underline hover:underline break-all"
                        >
                          <span>{item.handlePlaceholder}</span>
                          <ArrowUpRight size={13} aria-hidden="true" />
                        </a>
                      ) : (
                        <span
                          aria-disabled="true"
                          className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#792B33]/52"
                        >
                          Not configured
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Editorial Contact Form */}
          <div className="lg:col-span-7">
            {sent ? (
              <div
                role="status"
                data-testid="contact-confirmation"
                className="border border-[#792B33]/40 bg-[#792B33] p-8 sm:p-10 text-[#F3E9DE] space-y-5"
              >
                <p className="m-0 font-mono text-xs uppercase tracking-[0.2em] text-[#F3E9DE]/72">
                  Note Prepared
                </p>
                <h3
                  className="m-0 font-normal uppercase leading-none text-[#F3E9DE]"
                  style={{
                    fontFamily: "var(--font-anton), Impact, sans-serif",
                    fontSize: "clamp(36px, 4vw, 56px)",
                  }}
                >
                  THANK YOU, {name.toUpperCase()}.
                </h3>
                <p className="m-0 text-base leading-relaxed text-[#F3E9DE]/85 max-w-[46ch]">
                  Your message has been validated and prepared for{" "}
                  <span className="font-mono">{CONTACT_CONTENT.email}</span>. You can
                  also copy the address directly or write another note below.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setName("");
                    setEmail("");
                    setMessage("");
                  }}
                  className="inline-flex min-h-[44px] items-center border border-[#F3E9DE] px-5 py-2.5 font-mono text-xs uppercase tracking-[0.16em] text-[#F3E9DE] hover:bg-[#F3E9DE] hover:text-[#792B33] transition-colors cursor-pointer"
                >
                  Write another note
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="border border-[#792B33]/26 bg-[#792B33]/[0.03] p-6 sm:p-9 space-y-6"
              >
                <div className="flex items-baseline justify-between border-b border-[#792B33]/18 pb-4">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#792B33]">
                    Start a Conversation
                  </span>
                  <span className="font-mono text-[11px] text-[#792B33]/64">
                    {CONTACT_CONTENT.email}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <label className="block">
                    <span className="block mb-2 font-mono text-xs uppercase tracking-[0.16em] text-[#792B33]/78">
                      Name
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full min-h-[46px] border border-[#792B33]/28 bg-[#F3E9DE] px-4 py-2.5 text-sm text-[#792B33] placeholder:text-[#792B33]/42 focus:border-[#792B33] focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="block mb-2 font-mono text-xs uppercase tracking-[0.16em] text-[#792B33]/78">
                      Email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      required
                      className="w-full min-h-[46px] border border-[#792B33]/28 bg-[#F3E9DE] px-4 py-2.5 text-sm text-[#792B33] placeholder:text-[#792B33]/42 focus:border-[#792B33] focus:outline-none"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="block mb-2 font-mono text-xs uppercase tracking-[0.16em] text-[#792B33]/78">
                    Idea, Question, or Message
                  </span>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell me what you're building or curious about..."
                    required
                    className="w-full border border-[#792B33]/28 bg-[#F3E9DE] px-4 py-3 text-sm text-[#792B33] placeholder:text-[#792B33]/42 focus:border-[#792B33] focus:outline-none"
                  />
                </label>

                {error && (
                  <p role="alert" className="m-0 font-mono text-xs text-[#792B33] underline">
                    {error}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <a
                    href={`mailto:${CONTACT_CONTENT.email}`}
                    className="font-mono text-xs text-[#792B33]/75 underline underline-offset-4 hover:text-[#792B33]"
                  >
                    Or open in mail client
                  </a>
                  <button
                    type="submit"
                    className="inline-flex min-h-[46px] items-center gap-2.5 bg-[#792B33] px-7 py-3 font-mono text-xs uppercase tracking-[0.18em] text-[#F3E9DE] transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    <span>Send Message</span>
                    <Send size={14} strokeWidth={1.7} aria-hidden="true" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Quiet Editorial Film-Credit Footer */}
        <footer className="mt-20 sm:mt-24 flex flex-wrap items-center justify-between gap-6 border-t border-[#792B33]/20 pt-6 font-mono text-xs text-[#792B33]/74">
          <span>
            {CONTACT_CONTENT.name} · Experimental Portfolio
          </span>

          <div className="flex items-center gap-6">
            <a
              href={`mailto:${CONTACT_CONTENT.email}`}
              className="text-[#792B33]/75 no-underline hover:text-[#792B33]"
            >
              {CONTACT_CONTENT.email}
            </a>
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-[#792B33] hover:opacity-75 cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUp size={14} strokeWidth={1.7} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
