"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { ArrowDown } from "lucide-react";
import type { ManifestoScrollState } from "@/lib/manifesto";

export const CANT_LEAVE_WORDS = ["can't", "leave", "a"] as const;

export interface ManifestoStageHandle {
  apply: (state: ManifestoScrollState) => void;
}

/**
 * Full-bleed warm Japanese washi-paper editorial manifesto stage placed between the Hero
 * ("CURIOSITY / KILLED THE CAT. / Not this one.") and the Selected Work 3D circular gallery.
 *
 * Drives four crisp scroll-scrubbed quarters imperatively at 60fps (zero React re-renders):
 * - 0–25%  : I'm the kind of person who...
 * - 25–50% : can't leave a
 * - 50–75% : question unanswered.
 * - 75–100%: Sometimes it becomes a project. Sometimes an experiment. Sometimes a very long night.
 */
export const PreProjectsManifesto = forwardRef<ManifestoStageHandle>(
  function PreProjectsManifesto(_, ref) {
    const stageRef = useRef<HTMLDivElement>(null);
    const beat1Ref = useRef<HTMLDivElement>(null);
    const beat1Line0Ref = useRef<HTMLSpanElement>(null);
    const beat1Line1Ref = useRef<HTMLSpanElement>(null);
    const beat2Ref = useRef<HTMLDivElement>(null);
    const beat2Word0Ref = useRef<HTMLSpanElement>(null);
    const beat2Word1Ref = useRef<HTMLSpanElement>(null);
    const beat2Word2Ref = useRef<HTMLSpanElement>(null);
    const beat3Ref = useRef<HTMLDivElement>(null);
    const beat3QuestionRef = useRef<HTMLSpanElement>(null);
    const beat3UnansweredRef = useRef<HTMLSpanElement>(null);
    const beat3UnderlineRef = useRef<HTMLDivElement>(null);
    const beat4Ref = useRef<HTMLDivElement>(null);
    const beat4Line0Ref = useRef<HTMLParagraphElement>(null);
    const beat4Line1Ref = useRef<HTMLParagraphElement>(null);
    const beat4Line2Ref = useRef<HTMLParagraphElement>(null);
    const beat4UnderlineRef = useRef<HTMLSpanElement>(null);
    const beat4CueRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const counterRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        apply(state: ManifestoScrollState) {
          const stage = stageRef.current;
          if (stage) {
            stage.style.opacity = state.stageOpacity.toFixed(4);
            stage.style.transform = `translate3d(0, ${state.stageLiftY.toFixed(1)}px, 0)`;
            stage.style.visibility = state.stageVisible ? "visible" : "hidden";
            stage.setAttribute("data-manifesto-beat", state.activeBeat);
            stage.setAttribute("data-manifesto-progress", state.progress.toFixed(3));
          }

          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${state.progress.toFixed(4)})`;
          }
          if (counterRef.current) {
            counterRef.current.textContent = `0${state.activeIndex + 1} / 04`;
          }

          // ── Beat 1 (0–25%): "I'm the kind of person who..."
          const beat1El = beat1Ref.current;
          if (beat1El) {
            beat1El.style.opacity = state.beat1.opacity.toFixed(4);
            beat1El.style.transform = `translate3d(0, ${state.beat1.y.toFixed(1)}px, 0)`;
            beat1El.style.visibility = state.beat1.visible ? "visible" : "hidden";
          }
          const b1LineEls = [beat1Line0Ref.current, beat1Line1Ref.current];
          for (let i = 0; i < 2; i++) {
            const el = b1LineEls[i];
            if (!el) continue;
            const yPct = state.beat1.lineYPercent[i] ?? 108;
            const xPx = i === 0 ? state.beat1.driftX : -state.beat1.driftX * 0.7;
            el.style.transform = `translate3d(${xPx.toFixed(1)}px, ${yPct.toFixed(2)}%, 0)`;
          }

          // ── Beat 2 (25–50%): "can't leave a"
          const beat2El = beat2Ref.current;
          if (beat2El) {
            beat2El.style.opacity = state.beat2.opacity.toFixed(4);
            beat2El.style.transform = `translate3d(0, ${state.beat2.y.toFixed(1)}px, 0) scale(${state.beat2.scale.toFixed(4)})`;
            beat2El.style.visibility = state.beat2.visible ? "visible" : "hidden";
          }
          const b2WordEls = [
            beat2Word0Ref.current,
            beat2Word1Ref.current,
            beat2Word2Ref.current,
          ];
          for (let i = 0; i < 3; i++) {
            const el = b2WordEls[i];
            if (!el) continue;
            const yPct = state.beat2.wordYPercent[i] ?? 114;
            el.style.transform = `translate3d(0, ${yPct.toFixed(2)}%, 0)`;
          }

          // ── Beat 3 (50–75%): "question unanswered."
          const beat3El = beat3Ref.current;
          if (beat3El) {
            beat3El.style.opacity = state.beat3.opacity.toFixed(4);
            beat3El.style.transform = `translate3d(0, ${state.beat3.y.toFixed(1)}px, 0)`;
            beat3El.style.visibility = state.beat3.visible ? "visible" : "hidden";
          }
          if (beat3QuestionRef.current) {
            beat3QuestionRef.current.style.transform = `translate3d(0, ${state.beat3.questionYPercent.toFixed(2)}%, 0)`;
          }
          if (beat3UnansweredRef.current) {
            const rightClip = ((1 - state.beat3.unansweredReveal) * 100).toFixed(2);
            beat3UnansweredRef.current.style.clipPath =
              state.beat3.unansweredReveal >= 0.999
                ? "none"
                : `inset(-12% ${rightClip}% -22% 0%)`;
          }
          if (beat3UnderlineRef.current) {
            const lineClip = ((1 - state.beat3.underlineReveal) * 100).toFixed(2);
            beat3UnderlineRef.current.style.clipPath =
              state.beat3.underlineReveal >= 0.999
                ? "none"
                : `inset(0% ${lineClip}% 0% 0%)`;
          }

          // ── Beat 4 (75–100%): 3 staggered editorial lines
          const beat4El = beat4Ref.current;
          if (beat4El) {
            beat4El.style.opacity = state.beat4.opacity.toFixed(4);
            beat4El.style.transform = `translate3d(0, ${state.beat4.y.toFixed(1)}px, 0)`;
            beat4El.style.visibility = state.beat4.visible ? "visible" : "hidden";
          }
          const b4LineEls = [
            beat4Line0Ref.current,
            beat4Line1Ref.current,
            beat4Line2Ref.current,
          ];
          for (let i = 0; i < 3; i++) {
            const el = b4LineEls[i];
            if (!el) continue;
            const op = state.beat4.lineOpacities[i] ?? 0;
            const dy = state.beat4.lineY[i] ?? 34;
            el.style.opacity = op.toFixed(4);
            el.style.transform = `translate3d(0, ${dy.toFixed(1)}px, 0)`;
          }
          if (beat4UnderlineRef.current) {
            const clip = ((1 - state.beat4.underlineReveal) * 100).toFixed(2);
            beat4UnderlineRef.current.style.clipPath =
              state.beat4.underlineReveal >= 0.999 ? "none" : `inset(0% ${clip}% 0% 0%)`;
          }
          if (beat4CueRef.current) {
            beat4CueRef.current.style.opacity = state.beat4.nextCueOpacity.toFixed(4);
          }
        },
      }),
      []
    );

    return (
      <div
        ref={stageRef}
        data-testid="pre-projects-manifesto"
        data-manifesto-beat="person"
        data-manifesto-progress="0.000"
        aria-label="Engineering ethos"
        className="pointer-events-none absolute inset-0 z-[24] flex flex-col justify-between overflow-hidden px-6 sm:px-10 pt-24 pb-8 sm:pt-28 sm:pb-10 opacity-0 invisible will-change-[transform,opacity]"
        style={{
          backgroundColor: "#F4EADF",
          backgroundImage: [
            "radial-gradient(ellipse 76% 64% at 50% 44%, #FAF3EA 0%, #F4EADF 56%, #E8DAC8 100%)",
            "radial-gradient(circle at 50% 50%, rgba(169, 29, 34, 0.045) 0%, transparent 56%)",
          ].join(", "),
        }}
      >
        {/* Subtle architectural washi framing hairline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#2B231E]/[0.07] to-transparent"
        />

        {/* Quiet editorial header metadata */}
        <div className="page-container relative z-[2] flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.18em] text-[#766C63]">
          <span className="inline-flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A91D22]" aria-hidden="true" />
            <span>Prologue · Before the Work</span>
          </span>
          <span ref={counterRef} className="tabular-nums text-[#554C45]">
            01 / 04
          </span>
        </div>

        {/* Center Stage: 4 Mutually Exclusive Kinetic Typography Slots */}
        <div className="page-container relative z-[2] flex flex-1 items-center justify-center">
          {/* ── BEAT 1 (0–25%): I'm the kind of person who... ── */}
          <div
            ref={beat1Ref}
            data-testid="manifesto-beat-1"
            className="absolute inset-0 flex items-center justify-center text-center opacity-0 invisible will-change-[transform,opacity]"
          >
            <p
              className="m-0 max-w-[20ch] font-medium tracking-[-0.032em] text-[#1E1916] leading-[1.08]"
              style={{ fontSize: "clamp(34px, 5.2vw, 78px)" }}
            >
              <span className="block overflow-hidden py-[0.06em]">
                <span ref={beat1Line0Ref} className="block will-change-transform">
                  I&apos;m the{" "}
                  <em
                    className="font-serif italic font-medium text-[#792B33]"
                    style={{
                      fontFamily: "var(--font-cormorant), Georgia, serif",
                      fontSize: "1.12em",
                    }}
                  >
                    kind of person
                  </em>
                </span>
              </span>
              <span className="block overflow-hidden py-[0.06em]">
                <span ref={beat1Line1Ref} className="block will-change-transform">
                  who<span className="text-[#A91D22]">...</span>
                </span>
              </span>
            </p>
          </div>

          {/* ── BEAT 2 (25–50%): can't leave a ── */}
          <div
            ref={beat2Ref}
            data-testid="manifesto-beat-2"
            className="absolute inset-0 flex items-center justify-center text-center opacity-0 invisible will-change-[transform,opacity]"
          >
            <p
              className="m-0 flex flex-wrap items-end justify-center gap-x-[0.22em] font-normal uppercase text-[#792B33] leading-[0.88] tracking-[-0.03em]"
              style={{
                fontFamily: "var(--font-anton), Impact, sans-serif",
                fontSize: "clamp(64px, 12vw, 192px)",
              }}
            >
              <span className="inline-block overflow-hidden align-bottom pt-[0.04em] pb-[0.08em]">
                <span
                  ref={beat2Word0Ref}
                  className="inline-block whitespace-nowrap will-change-transform"
                  style={{ transform: "translate3d(0, 114%, 0)" }}
                >
                  {CANT_LEAVE_WORDS[0]}
                </span>
              </span>
              <span className="inline-block overflow-hidden align-bottom pt-[0.04em] pb-[0.08em]">
                <span
                  ref={beat2Word1Ref}
                  className="inline-block whitespace-nowrap will-change-transform"
                  style={{ transform: "translate3d(0, 114%, 0)" }}
                >
                  {CANT_LEAVE_WORDS[1]}
                </span>
              </span>
              <span className="inline-block overflow-hidden align-bottom pt-[0.04em] pb-[0.08em]">
                <span
                  ref={beat2Word2Ref}
                  className="inline-block whitespace-nowrap will-change-transform"
                  style={{ transform: "translate3d(0, 114%, 0)" }}
                >
                  {CANT_LEAVE_WORDS[2]}
                </span>
              </span>
            </p>
          </div>

          {/* ── BEAT 3 (50–75%): question unanswered. ── */}
          <div
            ref={beat3Ref}
            data-testid="manifesto-beat-3"
            className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 invisible will-change-[transform,opacity]"
          >
            <div className="inline-flex flex-col items-center">
              <span className="block overflow-hidden pt-[0.04em] pb-[0.04em]">
                <span
                  ref={beat3QuestionRef}
                  className="block font-normal uppercase text-[#1E1916] leading-[0.86] tracking-[-0.03em] will-change-transform"
                  style={{
                    fontFamily: "var(--font-anton), Impact, sans-serif",
                    fontSize: "clamp(58px, 10.6vw, 172px)",
                    transform: "translate3d(0, 112%, 0)",
                  }}
                >
                  question
                </span>
              </span>

              <span className="relative mt-1 sm:mt-2 inline-flex flex-col items-center">
                <span
                  ref={beat3UnansweredRef}
                  className="block font-serif font-bold italic text-[#A91D22] leading-[0.98] tracking-[-0.015em] will-change-[clip-path]"
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "clamp(52px, 8.8vw, 142px)",
                    clipPath: "inset(-12% 100% -22% 0%)",
                  }}
                >
                  unanswered.
                </span>

                {/* Sweeping sumi-crimson calligraphic underline */}
                <div
                  ref={beat3UnderlineRef}
                  aria-hidden="true"
                  className="mt-1 h-[12px] sm:h-[16px] w-[106%] will-change-[clip-path]"
                  style={{ clipPath: "inset(0% 100% 0% 0%)" }}
                >
                  <svg
                    viewBox="0 0 360 20"
                    fill="none"
                    preserveAspectRatio="none"
                    className="h-full w-full"
                  >
                    <path
                      d="M4 12 C56 6.2, 134 4.8, 214 6.5 C272 7.8, 322 6.8, 353 4.2 C358 3.8, 359 6.6, 354 8.2 C312 12.8, 248 14.4, 180 13.6 C108 12.8, 52 14.6, 10 16.5 C4.2 16.8, 0.8 13.4, 4 12 Z"
                      fill="#A91D22"
                      fillOpacity="0.82"
                    />
                  </svg>
                </div>
              </span>
            </div>
          </div>

          {/* ── BEAT 4 (75–100%): Sometimes it becomes a project. Sometimes an experiment. Sometimes a very long night. ── */}
          <div
            ref={beat4Ref}
            data-testid="manifesto-beat-4"
            className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 invisible will-change-[transform,opacity]"
          >
            <div className="max-w-[880px] space-y-4 sm:space-y-6">
              <p
                ref={beat4Line0Ref}
                className="m-0 font-medium tracking-[-0.028em] text-[#1E1916] leading-[1.15] opacity-0 will-change-[transform,opacity]"
                style={{ fontSize: "clamp(25px, 3.6vw, 52px)" }}
              >
                Sometimes it becomes a{" "}
                <em
                  className="font-serif italic font-semibold text-[#A91D22]"
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "1.14em",
                  }}
                >
                  project.
                </em>
              </p>

              <p
                ref={beat4Line1Ref}
                className="m-0 font-medium tracking-[-0.028em] text-[#1E1916] leading-[1.15] opacity-0 will-change-[transform,opacity]"
                style={{ fontSize: "clamp(25px, 3.6vw, 52px)" }}
              >
                Sometimes an{" "}
                <em
                  className="font-serif italic font-semibold text-[#A91D22]"
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "1.14em",
                  }}
                >
                  experiment.
                </em>
              </p>

              <p
                ref={beat4Line2Ref}
                className="m-0 font-medium tracking-[-0.028em] text-[#1E1916] leading-[1.15] opacity-0 will-change-[transform,opacity]"
                style={{ fontSize: "clamp(25px, 3.6vw, 52px)" }}
              >
                Sometimes a{" "}
                <span className="relative inline-block">
                  <em
                    className="font-serif italic font-bold text-[#792B33]"
                    style={{
                      fontFamily: "var(--font-cormorant), Georgia, serif",
                      fontSize: "1.16em",
                    }}
                  >
                    very long night.
                  </em>
                  <span
                    ref={beat4UnderlineRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-1.5 left-0 right-0 block h-[8px] will-change-[clip-path]"
                    style={{ clipPath: "inset(0% 100% 0% 0%)" }}
                  >
                    <svg
                      viewBox="0 0 280 12"
                      fill="none"
                      preserveAspectRatio="none"
                      className="h-full w-full"
                    >
                      <path
                        d="M3 7.5 C64 3.4, 152 3.2, 275 5.4 C240 8.6, 150 9.6, 6 9.8 Z"
                        fill="#A91D22"
                        fillOpacity="0.72"
                      />
                    </svg>
                  </span>
                </span>
              </p>
            </div>

            <div
              ref={beat4CueRef}
              className="mt-10 sm:mt-12 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#766C63] opacity-0 will-change-[opacity]"
            >
              <span>Selected Work</span>
              <ArrowDown size={13} strokeWidth={1.6} aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Bottom ultra-thin crimson ink scroll progress rail */}
        <div className="page-container relative z-[2]">
          <div className="h-[1.5px] w-full overflow-hidden bg-[#2B231E]/[0.12]">
            <div
              ref={progressBarRef}
              className="h-full w-full origin-left bg-[#A91D22] will-change-transform"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
        </div>
      </div>
    );
  }
);
