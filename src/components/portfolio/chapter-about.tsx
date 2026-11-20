"use client";

import Image, { type StaticImageData } from "next/image";
import FlowArt, {
  FlowSection,
  type FlowArtSectionMeta,
} from "@/components/ui/story-scroll";
import { ABOUT_CONTENT } from "@/data/portfolio-content";

import koiArtwork from "@/assets/images/jp_flow_koi_curiosity_1795184918518.jpg";
import craneArtwork from "@/assets/images/jp_flow_crane_pine_1795184921090.jpg";
import waveArtwork from "@/assets/images/jp_flow_indigo_wave_1795184920745.jpg";
import lanternArtwork from "@/assets/images/jp_flow_autumn_lantern_1795184917772.jpg";
import camelliaArtwork from "@/assets/images/jp_flow_camellia_moon_1795184930276.jpg";

/**
 * Ultra-fine static paper grain overlay (composited once, zero runtime filter cost).
 */
const WASHI_GRAIN_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.52'/%3E%3C/svg%3E\")";

interface StoryArtworkProps {
  src: StaticImageData;
  alt: string;
  caption: string;
  imageClassName?: string;
  frameClassName?: string;
  edgeFadeColor: string;
  isLightSurface?: boolean;
}

function StoryJapaneseArtwork({
  src,
  alt,
  caption,
  imageClassName = "scale-[1.09] object-cover object-center",
  frameClassName = "",
  edgeFadeColor,
  isLightSurface = false,
}: StoryArtworkProps) {
  return (
    <figure
      data-flow-parallax="artwork"
      className={`relative m-0 w-full max-w-[330px] lg:max-w-[375px] xl:max-w-[400px] shrink-0 self-center lg:self-end will-change-transform ${frameClassName}`}
    >
      <div
        className={`relative aspect-[3/4] max-h-[54vh] w-full overflow-hidden border ${
          isLightSurface
            ? "border-[#792B33]/25 shadow-[0_24px_54px_rgba(40,20,24,0.16)]"
            : "border-[#F3E9DE]/18 shadow-[0_28px_64px_rgba(8,5,7,0.44)]"
        }`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 82vw, 460px"
          referrerPolicy="no-referrer"
          className={`select-none ${imageClassName}`}
        />
        {/* Subtle atmospheric perimeter vignette so rich pigments integrate smoothly into the sheet */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 58%, ${edgeFadeColor} 100%)`,
          }}
        />
      </div>
      <figcaption
        className={`mt-2.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] ${
          isLightSurface ? "text-[#792B33]/68" : "text-[#F3E9DE]/58"
        }`}
      >
        <span>{caption}</span>
        <span aria-hidden="true">日本画</span>
      </figcaption>
    </figure>
  );
}

const ABOUT_FLOW_META: readonly FlowArtSectionMeta[] = [
  { index: "01", label: "Who I Am", tone: "light" },
  { index: "02", label: "Relentless Curiosity", tone: "light" },
  { index: "03", label: "Build to Understand", tone: "dark" },
  { index: "04", label: "Ideas Into Systems", tone: "light" },
  { index: "05", label: "Lost in the Details", tone: "light" },
] as const;

/**
 * CHAPTER 01 — ABOUT & PHILOSOPHY
 *
 * Powered by the integrated shadcn `FlowArt` / `FlowSection` story-scroll component:
 * - Signature bottom-left 30deg -> 0deg hinged sheet rotation + pinned stack
 * - Cinematic 3D camera recession on outgoing pinned sheets + multi-plane inner parallax
 * - Continuous Japanese calligraphic vertical ink stroke rail spanning all 5 panels
 * - Rich, subtle, colorful Japanese Nihonga / Rinpa / Ukiyo-e / Shin-hanga editorial illustrations
 * - Starts and concludes on Primary Burgundy (#792B33) so it joins seamlessly with the Hero above
 *   and the Burgundy TornPaperPeel transition into Chapter 02 Projects below.
 */
export function ChapterAbout() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      data-chapter-surface="burgundy"
      className="relative bg-[#792B33] text-[#F3E9DE]"
    >
      <FlowArt
        as="div"
        aria-label="Chapter 01 — About and Philosophy Story Scroll"
        showSideStroke
        sectionMeta={ABOUT_FLOW_META}
      >
        {/* ── PANEL 01 · WHO I AM (Primary Burgundy #792B33) ─────────────────────── */}
        <FlowSection
          aria-label="01 — More Than Meets the Eye"
          strokeLabel="Who I Am"
          strokeTone="light"
          style={{ backgroundColor: "#792B33", color: "#F3E9DE" }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.048] mix-blend-soft-light"
            style={{ backgroundImage: WASHI_GRAIN_BG, backgroundRepeat: "repeat" }}
          />

          <div className="relative z-10 flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#F3E9DE]/78">
            <span>01 — {ABOUT_CONTENT.chapterLabel}</span>
            <span className="tabular-nums">01 / 05</span>
          </div>

          <hr className="relative z-10 my-2 border-none border-t border-[#F3E9DE]/28" />

          <div className="relative z-10 my-auto grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(290px,0.75fr)] lg:gap-12">
            <div data-flow-parallax="headline" className="will-change-transform">
              <p
                className="m-0 mb-4 text-xs font-medium uppercase tracking-[0.24em] text-[#F3E9DE]/75"
                style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}
              >
                {ABOUT_CONTENT.heading}
              </p>

              <h2
                id="about-heading"
                className="m-0 uppercase text-[#F3E9DE] tracking-[-0.02em]"
                style={{
                  fontFamily: "var(--font-anton), Impact, sans-serif",
                  fontSize: "clamp(3.2rem, 8.2vw, 8.4rem)",
                  lineHeight: 0.9,
                }}
              >
                I&apos;M THE KIND
                <br />
                OF PERSON{" "}
                <em
                  className="normal-case italic font-medium text-[#F6DFC4]"
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "1.06em",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {ABOUT_CONTENT.headlineItalic}
                </em>
              </h2>

              <p
                data-flow-parallax="detail"
                className="mt-7 max-w-[44ch] text-[clamp(1.05rem,1.65vw,1.45rem)] leading-[1.58] text-[#F3E9DE]/90 will-change-transform"
                style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}
              >
                {ABOUT_CONTENT.philosophyParagraphs[0]}
              </p>
            </div>

            <StoryJapaneseArtwork
              src={koiArtwork}
              alt="Traditional Japanese Nihonga painting of vermilion and gold koi gliding through midnight indigo water with crimson maple leaves"
              caption="Plate I · Koi & Autumn Stream"
              imageClassName="scale-[1.16] object-cover object-center"
              edgeFadeColor="rgba(121, 43, 51, 0.34)"
            />
          </div>

          <hr className="relative z-10 my-1 border-none border-t border-[#F3E9DE]/24" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 text-[clamp(0.92rem,1.2vw,1.08rem)] text-[#F3E9DE]/82">
            <p className="m-0 max-w-[62ch]">{ABOUT_CONTENT.supportingStatement}</p>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#F3E9DE]/60">
              Scroll to turn the folio
            </span>
          </div>
        </FlowSection>

        {/* ── PANEL 02 · UNANSWERED QUESTIONS (Lacquer Sumi Ink #171315) ─────────── */}
        <FlowSection
          aria-label="02 — Can't Leave a Question Unanswered"
          strokeLabel="Relentless Curiosity"
          strokeTone="light"
          style={{ backgroundColor: "#171315", color: "#F3E9DE" }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-soft-light"
            style={{ backgroundImage: WASHI_GRAIN_BG, backgroundRepeat: "repeat" }}
          />

          <div className="relative z-10 flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#F3E9DE]/72">
            <span>02 — Relentless Curiosity</span>
            <span className="tabular-nums">02 / 05</span>
          </div>

          <hr className="relative z-10 my-2 border-none border-t border-[#F3E9DE]/22" />

          <div className="relative z-10 my-auto grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(290px,0.75fr)] lg:gap-12">
            <div data-flow-parallax="headline" className="will-change-transform">
              <h3
                className="m-0 uppercase text-[#F3E9DE] tracking-[-0.02em]"
                style={{
                  fontFamily: "var(--font-anton), Impact, sans-serif",
                  fontSize: "clamp(3rem, 7.6vw, 7.6rem)",
                  lineHeight: 0.9,
                }}
              >
                CAN&apos;T LEAVE A
                <br />
                QUESTION
                <br />
                <span className="text-[#D47A6A]">UNANSWERED.</span>
              </h3>

              <hr className="my-7 border-none border-t border-[#F3E9DE]/18" />

              <div
                data-flow-parallax="detail"
                className="grid grid-cols-1 gap-6 sm:grid-cols-3 will-change-transform"
              >
                <div>
                  <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#E6B87D]">
                    01 · Inquiry
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-[#F3E9DE]/78">
                    Pulling at loose threads until the underlying mechanism makes complete sense.
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#E6B87D]">
                    02 · Disassembly
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-[#F3E9DE]/78">
                    Taking abstractions apart — from neural inference pipelines to GPU shaders.
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#E6B87D]">
                    03 · Momentum
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-[#F3E9DE]/78">
                    Following an interesting edge case even when it stretches into a long night.
                  </p>
                </div>
              </div>
            </div>

            <StoryJapaneseArtwork
              src={craneArtwork}
              alt="Traditional Japanese Rinpa painting of a red-crowned crane beneath emerald pine boughs and antique gold clouds"
              caption="Plate II · Crane & Black Pine"
              imageClassName="scale-[1.2] object-cover object-[center_60%]"
              edgeFadeColor="rgba(23, 19, 21, 0.42)"
            />
          </div>

          <hr className="relative z-10 my-2 border-none border-t border-[#F3E9DE]/18" />

          <p className="relative z-10 m-0 ml-auto max-w-[46ch] text-right text-[clamp(0.98rem,1.45vw,1.25rem)] leading-relaxed text-[#F3E9DE]/82">
            Not just what a system does — what happens when you push it a little further.
          </p>
        </FlowSection>

        {/* ── PANEL 03 · BUILD TO UNDERSTAND (Warm Washi Ivory #F3E9DE) ──────────── */}
        <FlowSection
          aria-label="03 — Builds Things to Understand How They Work"
          strokeLabel="Build to Understand"
          strokeTone="dark"
          style={{ backgroundColor: "#F3E9DE", color: "#241A1C" }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply"
            style={{ backgroundImage: WASHI_GRAIN_BG, backgroundRepeat: "repeat" }}
          />

          <div className="relative z-10 flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#792B33]/80">
            <span>03 — Craft Through Building</span>
            <span className="tabular-nums">03 / 05</span>
          </div>

          <hr className="relative z-10 my-2 border-none border-t border-[#792B33]/28" />

          <div className="relative z-10 my-auto grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(290px,0.75fr)] lg:gap-12">
            <div data-flow-parallax="headline" className="will-change-transform">
              <h3
                className="m-0 uppercase text-[#792B33] tracking-[-0.02em]"
                style={{
                  fontFamily: "var(--font-anton), Impact, sans-serif",
                  fontSize: "clamp(3rem, 7.6vw, 7.6rem)",
                  lineHeight: 0.9,
                }}
              >
                BUILDS THINGS
                <br />
                TO UNDERSTAND
                <br />
                <span className="text-[#1E3A52]">HOW THEY WORK.</span>
              </h3>

              <p
                className="mt-6 max-w-[46ch] text-[clamp(1rem,1.5vw,1.3rem)] leading-[1.58] text-[#241A1C]/86"
                style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}
              >
                {ABOUT_CONTENT.philosophyParagraphs[1]}
              </p>

              <hr className="my-6 border-none border-t border-[#792B33]/22" />

              <div
                data-flow-parallax="detail"
                className="grid grid-cols-1 gap-5 sm:grid-cols-3 will-change-transform"
              >
                <div>
                  <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#792B33]">
                    01 · AI &amp; Models
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-[#241A1C]/78">
                    Applied machine learning, inference tooling, and multimodal reasoning flows.
                  </p>
                </div>
                <div>
                  <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#792B33]">
                    02 · Full-Stack
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-[#241A1C]/78">
                    Typed architectures, real-time APIs, and responsive interfaces built to endure.
                  </p>
                </div>
                <div>
                  <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#792B33]">
                    03 · Creative Tech
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-[#241A1C]/78">
                    Interactive WebGL worlds, tactile physics, and kinetic editorial choreography.
                  </p>
                </div>
              </div>
            </div>

            <StoryJapaneseArtwork
              src={waveArtwork}
              alt="Japanese ukiyo-e woodblock print of Prussian-indigo curling waves beneath a warm ochre moon and cliffside vermilion torii"
              caption="Plate III · Moonlit Tide"
              imageClassName="scale-[1.15] object-cover object-center"
              edgeFadeColor="rgba(243, 233, 222, 0.22)"
              isLightSurface
            />
          </div>

          <hr className="relative z-10 my-2 border-none border-t border-[#792B33]/22" />

          <div className="relative z-10 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-[#792B33]/72">
            <span>First principles over black boxes</span>
            <span>Practice · Research · Execution</span>
          </div>
        </FlowSection>

        {/* ── PANEL 04 · IDEAS INTO SYSTEMS (Deep Woodblock Indigo #1B2638) ──────── */}
        <FlowSection
          aria-label="04 — Turns Ideas Into Working Systems"
          strokeLabel="Ideas Into Systems"
          strokeTone="light"
          style={{ backgroundColor: "#1B2638", color: "#F3E9DE" }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-soft-light"
            style={{ backgroundImage: WASHI_GRAIN_BG, backgroundRepeat: "repeat" }}
          />

          <div className="relative z-10 flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#F3E9DE]/75">
            <span>04 — From Sketch to Production</span>
            <span className="tabular-nums">04 / 05</span>
          </div>

          <hr className="relative z-10 my-2 border-none border-t border-[#F3E9DE]/24" />

          <div className="relative z-10 my-auto grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(290px,0.75fr)] lg:gap-12">
            <div data-flow-parallax="headline" className="will-change-transform">
              <h3
                className="m-0 uppercase text-[#F3E9DE] tracking-[-0.02em]"
                style={{
                  fontFamily: "var(--font-anton), Impact, sans-serif",
                  fontSize: "clamp(3rem, 7.6vw, 7.6rem)",
                  lineHeight: 0.9,
                }}
              >
                TURNS IDEAS
                <br />
                INTO WORKING
                <br />
                <span className="text-[#E39A67]">SYSTEMS.</span>
              </h3>

              <hr className="my-7 border-none border-t border-[#F3E9DE]/20" />

              <div
                data-flow-parallax="detail"
                className="grid grid-cols-1 gap-6 sm:grid-cols-3 will-change-transform"
              >
                <div>
                  <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#E8AE74]">
                    From Scratch
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-[#F3E9DE]/80">
                    Prototyping directly in code so architectural constraints shape the design early.
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#E8AE74]">
                    Question the Obvious
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-[#F3E9DE]/80">
                    Challenging default patterns when a calmer, sharper interaction works better.
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#E8AE74]">
                    Shipped Reality
                  </p>
                  <p className="m-0 text-sm leading-relaxed text-[#F3E9DE]/80">
                    Bridging research ambition with crisp performance, reliability, and polish.
                  </p>
                </div>
              </div>
            </div>

            <StoryJapaneseArtwork
              src={lanternArtwork}
              alt="Japanese shin-hanga woodblock print of scarlet autumn maple branches over a softly glowing mossy granite lantern in indigo rain"
              caption="Plate IV · Autumn Lantern"
              imageClassName="scale-[1.14] object-cover object-center"
              edgeFadeColor="rgba(27, 38, 56, 0.36)"
            />
          </div>

          <hr className="relative z-10 my-2 border-none border-t border-[#F3E9DE]/20" />

          <p className="relative z-10 m-0 max-w-[50ch] text-[clamp(0.98rem,1.4vw,1.2rem)] leading-relaxed text-[#F3E9DE]/82">
            An idea only reveals its real shape once people can touch it, break it, and use it.
          </p>
        </FlowSection>

        {/* ── PANEL 05 · LOST IN THE DETAILS (Closes on Primary Burgundy #792B33) ── */}
        <FlowSection
          aria-label="05 — Gets Lost in the Details"
          strokeLabel="Lost in the Details"
          strokeTone="light"
          style={{ backgroundColor: "#792B33", color: "#F3E9DE" }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.048] mix-blend-soft-light"
            style={{ backgroundImage: WASHI_GRAIN_BG, backgroundRepeat: "repeat" }}
          />

          <div className="relative z-10 flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#F3E9DE]/78">
            <span>05 — The Journey Ahead</span>
            <span className="tabular-nums">05 / 05</span>
          </div>

          <hr className="relative z-10 my-2 border-none border-t border-[#F3E9DE]/28" />

          <div className="relative z-10 my-auto grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(290px,0.75fr)] lg:gap-12">
            <div data-flow-parallax="headline" className="will-change-transform">
              <h3
                className="m-0 uppercase text-[#F3E9DE] tracking-[-0.02em]"
                style={{
                  fontFamily: "var(--font-anton), Impact, sans-serif",
                  fontSize: "clamp(3.1rem, 8vw, 8.2rem)",
                  lineHeight: 0.9,
                }}
              >
                GETS LOST IN
                <br />
                THE{" "}
                <em
                  className="normal-case italic font-medium text-[#F5D8A9]"
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "1.08em",
                    letterSpacing: "-0.01em",
                  }}
                >
                  details.
                </em>
              </h3>

              <p
                data-flow-parallax="detail"
                className="mt-7 max-w-[46ch] text-[clamp(1.08rem,1.7vw,1.5rem)] leading-[1.58] text-[#F3E9DE]/92 will-change-transform"
                style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}
              >
                {ABOUT_CONTENT.philosophyParagraphs[2]}
              </p>
            </div>

            <StoryJapaneseArtwork
              src={camelliaArtwork}
              alt="Japanese Nihonga illustration of deep crimson camellia blossoms, dark emerald foliage, temple eaves, and a burnished gold crescent moon"
              caption="Plate V · Tsubaki & Crescent Moon"
              imageClassName="scale-[1.12] object-cover object-center"
              edgeFadeColor="rgba(121, 43, 51, 0.34)"
            />
          </div>

          <hr className="relative z-10 my-2 border-none border-t border-[#F3E9DE]/24" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-[#F3E9DE]/72">
            <span>
              {ABOUT_CONTENT.chapterNumber} / {ABOUT_CONTENT.chapterLabel}
            </span>
            <span>Next · 02 Selected Projects ↓</span>
          </div>
        </FlowSection>
      </FlowArt>
    </section>
  );
}
