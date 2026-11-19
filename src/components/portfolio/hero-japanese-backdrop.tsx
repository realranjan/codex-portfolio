"use client";

import { forwardRef } from "react";

interface HeroBackdropProps {
  className?: string;
  decorRef?: React.Ref<HTMLDivElement>;
  sunRef?: React.Ref<HTMLDivElement>;
}

/**
 * Full-bleed warm Japanese washi-paper backdrop behind the centered 3D cat:
 * - Persistent organic paper fiber texture & studio radial warmth (stays active across #projects)
 * - Large painterly crimson rising sun disc framing the upper helmet & ears (softens gently into a seal halo in #projects)
 * - Hero-only peripheral decor (`decorRef`): sakura cherry blossom branch, sumi-e mountains, and 3-tier Japanese pagoda
 */
export const HeroJapaneseBackdrop = forwardRef<HTMLDivElement, HeroBackdropProps>(
  function HeroJapaneseBackdrop({ className = "", decorRef, sunRef }, ref) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        data-testid="hero-japanese-backdrop"
        className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden ${className}`}
        style={{
          background:
            "radial-gradient(ellipse 84% 78% at 50% 42%, #FBF5ED 0%, #F4EADF 54%, #E8DAC8 100%)",
        }}
      >
        {/* Subtle handmade washi paper fiber texture */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.055] mix-blend-multiply"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="washi-fiber-noise" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.72"
                numOctaves="4"
                seed="11"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#washi-fiber-noise)" />
        </svg>

        {/* Soft warm edge vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 44%, transparent 46%, rgba(164, 138, 114, 0.16) 100%)",
          }}
        />

        {/* Large Centered Painterly Crimson Rising Sun Disc */}
        <div
          ref={sunRef}
          className="absolute left-1/2 top-[46%] sm:top-[45%] -translate-x-1/2 -translate-y-1/2 w-[min(74vw,330px)] sm:w-[min(60vh,495px)] lg:w-[min(64vh,555px)] aspect-square will-change-[opacity,transform]"
        >
          <svg
            viewBox="0 0 520 520"
            className="h-full w-full overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="crimson-sun-grad" cx="48%" cy="36%" r="58%">
                <stop offset="0%" stopColor="#DE3033" />
                <stop offset="48%" stopColor="#C11D23" />
                <stop offset="84%" stopColor="#9C1319" />
                <stop offset="100%" stopColor="#820E14" />
              </radialGradient>
              <radialGradient id="crimson-sun-halo" cx="50%" cy="50%" r="50%">
                <stop offset="68%" stopColor="#C42228" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#C42228" stopOpacity="0" />
              </radialGradient>
              <clipPath id="crimson-sun-clip">
                <circle cx="260" cy="260" r="236" />
              </clipPath>
              <filter id="sun-ink-blur" x="-15%" y="-15%" width="130%" height="130%">
                <feGaussianBlur stdDeviation="12" />
              </filter>
              <filter id="sun-edge-soft" x="-5%" y="-5%" width="110%" height="110%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.035"
                  numOctaves="3"
                  seed="7"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="4.5"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>

            <circle cx="260" cy="260" r="256" fill="url(#crimson-sun-halo)" />

            <g filter="url(#sun-edge-soft)">
              <circle cx="260" cy="260" r="236" fill="url(#crimson-sun-grad)" />
            </g>

            {/* Painterly sumi-e cloud washes inside the sun disc */}
            <g clipPath="url(#crimson-sun-clip)" filter="url(#sun-ink-blur)">
              <path
                d="M10 148 C95 120, 178 164, 265 138 C340 116, 425 144, 510 120 L510 198 C415 215, 325 182, 232 204 C145 224, 72 195, 10 212 Z"
                fill="#F9DFD6"
                opacity="0.22"
              />
              <path
                d="M35 280 C130 250, 215 292, 315 268 C395 248, 455 276, 515 260 L515 340 C422 355, 338 320, 240 342 C155 360, 82 325, 35 346 Z"
                fill="#FBE5DC"
                opacity="0.18"
              />
              <ellipse cx="148" cy="112" rx="98" ry="44" fill="#FF7367" opacity="0.24" />
              <ellipse cx="385" cy="186" rx="112" ry="52" fill="#FBE5DC" opacity="0.2" />
              <ellipse cx="220" cy="390" rx="140" ry="62" fill="#6D0A10" opacity="0.26" />
              <ellipse cx="372" cy="325" rx="96" ry="46" fill="#7D0E14" opacity="0.24" />
            </g>
          </svg>
        </div>

        {/* Hero Peripheral Art Wrapper (fades out cleanly as #projects cards orbit in) */}
        <div
          ref={decorRef}
          className="pointer-events-none absolute inset-0 will-change-[opacity,transform]"
        >
        {/* Top-Left Illustrated Sakura (Cherry Blossom) Branch — positioned cleanly below the header */}
        <div className="absolute left-0 top-[56px] sm:top-[64px] w-[58vw] max-w-[440px] sm:w-[40vw] lg:w-[32vw] lg:max-w-[470px]">
          <svg
            viewBox="0 0 540 280"
            className="h-auto w-full overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="branch-bark" x1="0%" y1="0%" x2="100%" y2="40%">
                <stop offset="0%" stopColor="#261714" />
                <stop offset="55%" stopColor="#3F2520" />
                <stop offset="100%" stopColor="#5C3830" />
              </linearGradient>
              <radialGradient id="petal-crimson" cx="45%" cy="32%" r="70%">
                <stop offset="0%" stopColor="#E64A4C" />
                <stop offset="52%" stopColor="#BE1E24" />
                <stop offset="100%" stopColor="#861016" />
              </radialGradient>
              <radialGradient id="petal-scarlet" cx="40%" cy="30%" r="72%">
                <stop offset="0%" stopColor="#F26F6D" />
                <stop offset="48%" stopColor="#CE262C" />
                <stop offset="100%" stopColor="#941319" />
              </radialGradient>
              <radialGradient id="petal-blush" cx="45%" cy="35%" r="68%">
                <stop offset="0%" stopColor="#F7A7A1" />
                <stop offset="58%" stopColor="#D63B40" />
                <stop offset="100%" stopColor="#9C1A20" />
              </radialGradient>

              <g id="sakura-bloom-rich">
                {[0, 72, 144, 216, 288].map((deg) => (
                  <g key={deg} transform={`rotate(${deg})`}>
                    <path
                      d="M0,-3 C-8,-9 -13,-21 -7,-29 C-3.5,-32 -1.2,-29.5 0,-26.5 C1.2,-29.5 3.5,-32 7,-29 C13,-21 8,-9 0,-3 Z"
                      fill="url(#petal-crimson)"
                      stroke="#780D13"
                      strokeWidth="0.6"
                      strokeOpacity="0.45"
                    />
                    <path
                      d="M0,-5 L0,-19"
                      stroke="#740C12"
                      strokeWidth="0.65"
                      strokeOpacity="0.45"
                      strokeLinecap="round"
                    />
                  </g>
                ))}
                <circle cx="0" cy="0" r="4.8" fill="#6D0A10" />
                {[18, 54, 90, 126, 162, 198, 234, 270, 306, 342].map((deg) => (
                  <g key={deg} transform={`rotate(${deg})`}>
                    <line
                      x1="0"
                      y1="-2"
                      x2="0"
                      y2="-9.5"
                      stroke="#F6D7A7"
                      strokeWidth="0.7"
                      strokeOpacity="0.85"
                    />
                    <circle cx="0" cy="-10.2" r="1.25" fill="#FBE6BC" />
                  </g>
                ))}
              </g>

              <g id="sakura-bloom-soft">
                {[0, 72, 144, 216, 288].map((deg) => (
                  <g key={deg} transform={`rotate(${deg})`}>
                    <path
                      d="M0,-3 C-7.5,-9 -12,-20 -6.5,-27.5 C-3,-30.5 -1,-28 0,-25 C1,-28 3,-30.5 6.5,-27.5 C12,-20 7.5,-9 0,-3 Z"
                      fill="url(#petal-scarlet)"
                      stroke="#841117"
                      strokeWidth="0.55"
                      strokeOpacity="0.4"
                    />
                  </g>
                ))}
                <circle cx="0" cy="0" r="4" fill="#780E14" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                  <g key={deg} transform={`rotate(${deg})`}>
                    <line x1="0" y1="-2" x2="0" y2="-8.2" stroke="#F7DCB2" strokeWidth="0.65" />
                    <circle cx="0" cy="-8.8" r="1.15" fill="#FCE9C5" />
                  </g>
                ))}
              </g>

              <g id="sakura-bud">
                <path
                  d="M0,0 C-3.5,-4 -4,-10 0,-14 C4,-10 3.5,-4 0,0 Z"
                  fill="url(#petal-blush)"
                />
                <path d="M-2.2,1 C-1,-1.5 1,-1.5 2.2,1 L0,4 Z" fill="#4B2B23" />
              </g>
            </defs>

            {/* Primary gnarled sakura branch + organic forked sub-twigs */}
            <path
              d="M-16,32 C26,52 58,80 104,84 C152,88 186,62 238,68 C286,74 322,114 376,114 C420,114 458,96 498,78 C464,104 424,124 374,124 C318,124 280,84 234,78 C184,72 148,100 98,95 C50,90 18,63 -16,46 Z"
              fill="url(#branch-bark)"
            />
            <path d="M214,70 C238,50 266,32 304,22 C272,38 246,56 224,75 Z" fill="#3A221D" />
            <path d="M286,92 C318,78 348,68 388,66 C354,76 324,86 296,100 Z" fill="#492C25" />
            <path
              d="M54,76 C74,106 86,142 114,174 C130,192 152,204 174,212 C146,210 122,196 104,176 C76,144 62,108 42,80 Z"
              fill="#361F1B"
            />
            <path d="M150,84 C168,112 188,130 222,142 C186,136 162,118 140,89 Z" fill="#462922" />
            <path d="M396,114 C428,122 456,136 482,152 C452,142 424,130 390,122 Z" fill="#523129" />
            <path d="M18,60 C34,104 32,144 18,182 C24,142 24,104 8,62 Z" fill="#2E1B17" />

            {/* Subtle foliage leaves */}
            <path d="M138,82 C148,68 164,66 172,76 C160,84 146,86 138,82 Z" fill="#5D362D" opacity="0.82" />
            <path d="M322,110 C336,98 352,100 358,110 C346,118 330,118 322,110 Z" fill="#5D362D" opacity="0.78" />
            <path d="M84,134 C68,132 58,142 62,152 C74,150 84,143 84,134 Z" fill="#522F27" opacity="0.82" />

            {/* Buds */}
            <use href="#sakura-bud" transform="translate(308,20) rotate(68) scale(0.9)" />
            <use href="#sakura-bud" transform="translate(390,65) rotate(82) scale(0.85)" />
            <use href="#sakura-bud" transform="translate(498,77) rotate(62) scale(0.95)" />
            <use href="#sakura-bud" transform="translate(480,152) rotate(125) scale(0.8)" />
            <use href="#sakura-bud" transform="translate(224,142) rotate(118) scale(0.85)" />
            <use href="#sakura-bud" transform="translate(176,212) rotate(124) scale(0.85)" />
            <use href="#sakura-bud" transform="translate(17,184) rotate(196) scale(0.82)" />
            <use href="#sakura-bud" transform="translate(160,50) rotate(22) scale(0.75)" />

            {/* Cherry blossoms */}
            <use href="#sakura-bloom-rich" transform="translate(36,84) rotate(-14) scale(1.12)" />
            <use href="#sakura-bloom-soft" transform="translate(74,104) rotate(22) scale(0.8)" />
            <use href="#sakura-bloom-rich" transform="translate(114,76) rotate(18) scale(0.92)" />
            <use href="#sakura-bloom-soft" transform="translate(106,154) rotate(-25) scale(1.0)" />
            <use href="#sakura-bloom-rich" transform="translate(136,180) rotate(32) scale(0.74)" />
            <use href="#sakura-bloom-rich" transform="translate(198,72) rotate(-8) scale(0.84)" />
            <use href="#sakura-bloom-rich" transform="translate(262,44) rotate(16) scale(1.04)" />
            <use href="#sakura-bloom-soft" transform="translate(292,76) rotate(-28) scale(0.76)" />
            <use href="#sakura-bloom-rich" transform="translate(340,116) rotate(12) scale(1.02)" />
            <use href="#sakura-bloom-soft" transform="translate(368,136) rotate(40) scale(0.74)" />
            <use href="#sakura-bloom-soft" transform="translate(422,106) rotate(-18) scale(0.9)" />
            <use href="#sakura-bloom-rich" transform="translate(458,92) rotate(24) scale(0.66)" />
            <use href="#sakura-bloom-soft" transform="translate(178,122) rotate(-12) scale(0.7)" />
            <use href="#sakura-bloom-soft" transform="translate(22,134) rotate(28) scale(0.74)" />
          </svg>
        </div>

        {/* Bottom-Left Organic Sumi-e Ink-Wash Mountains */}
        <div className="absolute bottom-0 left-0 w-[64vw] max-w-[780px] sm:w-[52vw]">
          <svg
            viewBox="0 0 820 380"
            className="block h-auto w-full"
            preserveAspectRatio="xMinYMax meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mtn-far-left" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#B8B0A7" stopOpacity="0.58" />
                <stop offset="68%" stopColor="#D8D0C6" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#F4EADF" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="mtn-mid-left" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#857E77" stopOpacity="0.68" />
                <stop offset="64%" stopColor="#BEB6AD" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#F4EADF" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="mtn-near-left" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4C4844" stopOpacity="0.84" />
                <stop offset="56%" stopColor="#847E77" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#F4EADF" stopOpacity="0" />
              </linearGradient>
              <filter id="sumi-wash-edge" x="-4%" y="-6%" width="108%" height="112%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.025"
                  numOctaves="3"
                  seed="19"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="7"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>

            <g filter="url(#sumi-wash-edge)">
              {/* Distant hazy alpine horizon */}
              <path
                d="M-10,168 C40,148 76,126 122,138 C166,148 194,108 242,118 C288,128 318,100 368,124 C420,148 468,136 534,174 C606,214 692,248 820,294 L820,380 L-10,380 Z"
                fill="url(#mtn-far-left)"
              />

              {/* Mid-distance sumi-e ridge */}
              <path
                d="M-10,196 C32,172 68,154 114,170 C158,184 186,142 232,158 C278,174 316,162 364,202 C416,244 468,218 538,262 C608,304 676,336 742,380 L-10,380 Z"
                fill="url(#mtn-mid-left)"
              />

              {/* Near craggy ink-wash peak on bottom-left */}
              <path
                d="M-10,142 C18,134 38,144 64,160 C86,174 102,162 132,188 C162,214 186,232 224,252 C256,268 274,252 318,284 C368,320 426,348 486,380 L-10,380 Z"
                fill="url(#mtn-near-left)"
              />
              {/* Organic ink shadow valleys */}
              <path
                d="M14,144 C34,168 48,196 36,236 C16,226 4,218 -10,210 L-10,142 Z"
                fill="#35312E"
                opacity="0.34"
              />
              <path
                d="M108,174 C132,202 146,236 126,268 C102,248 86,222 78,196 Z"
                fill="#3F3A36"
                opacity="0.28"
              />
            </g>
          </svg>
        </div>

        {/* Bottom-Right Misty Mountain Cliff & 3-Tier Japanese Pagoda */}
        <div className="absolute bottom-[4%] right-0 w-[56vw] max-w-[660px] sm:w-[44vw]">
          <svg
            viewBox="0 0 680 420"
            className="block h-auto w-full"
            preserveAspectRatio="xMaxYMax meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="right-mtn-far" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#B8B0A7" stopOpacity="0.52" />
                <stop offset="70%" stopColor="#DDD4CB" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#F4EADF" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="right-cliff-ink" x1="20%" y1="0%" x2="55%" y2="100%">
                <stop offset="0%" stopColor="#58534E" stopOpacity="0.92" />
                <stop offset="52%" stopColor="#857F78" stopOpacity="0.58" />
                <stop offset="100%" stopColor="#F4EADF" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="pagoda-ink" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B3734" />
                <stop offset="100%" stopColor="#5C5650" />
              </linearGradient>
            </defs>

            {/* Organic hazy distant ridges rolling behind the cliff */}
            <g filter="url(#sumi-wash-edge)">
              <path
                d="M40,340 C100,296 142,262 198,274 C252,286 286,220 344,234 C402,248 446,204 510,224 C574,244 624,210 690,192 L690,420 L40,420 Z"
                fill="url(#right-mtn-far)"
              />
              <path
                d="M170,355 C228,308 272,272 328,284 C382,296 420,240 484,256 C552,272 616,240 690,226 L690,420 L170,420 Z"
                fill="#A79F97"
                opacity="0.32"
              />

              {/* Rocky Promontory Cliff supporting the Pagoda */}
              <path
                d="M366,408 C406,358 448,312 486,266 C504,244 518,214 544,196 L596,194 C622,206 646,228 690,256 L690,420 L366,420 Z"
                fill="url(#right-cliff-ink)"
              />
              <path
                d="M544,196 C558,224 558,256 522,296 L484,268 C504,242 518,216 544,196 Z"
                fill="#44403C"
                opacity="0.44"
              />
              <path
                d="M596,194 C616,226 618,268 588,312 L564,252 Z"
                fill="#524D48"
                opacity="0.3"
              />
            </g>

            {/* Wind-sculpted cliff pine clusters */}
            <g fill="#4A4540" opacity="0.82">
              <ellipse cx="514" cy="212" rx="18" ry="6.5" transform="rotate(-12 514 212)" />
              <ellipse cx="526" cy="204" rx="13" ry="5" transform="rotate(-6 526 204)" />
              <ellipse cx="628" cy="210" rx="19" ry="6.5" transform="rotate(14 628 210)" />
              <ellipse cx="642" cy="222" rx="16" ry="5.5" transform="rotate(10 642 222)" />
              <ellipse cx="484" cy="252" rx="15" ry="5.2" transform="rotate(-16 484 252)" />
              <ellipse cx="468" cy="272" rx="18" ry="5.8" transform="rotate(-10 468 272)" />
            </g>

            {/* Traditional 3-Tiered Japanese Pagoda */}
            <g transform="translate(570, 196)" fill="url(#pagoda-ink)">
              <polygon points="-32,0 32,0 28,-8 -28,-8" fill="#4D4844" />
              <rect x="-22" y="-26" width="44" height="18" fill="#5B5550" />
              <rect x="-15" y="-23" width="6" height="12" fill="#E8DED2" opacity="0.48" />
              <rect x="-3" y="-23" width="6" height="12" fill="#E8DED2" opacity="0.54" />
              <rect x="9" y="-23" width="6" height="12" fill="#E8DED2" opacity="0.48" />
              <path d="M-46,-26 C-34,-27 -24,-33 -18,-40 L18,-40 C24,-33 34,-27 46,-26 C35,-21 24,-22 18,-23 L-18,-23 C-24,-22 -35,-21 -46,-26 Z" />

              <rect x="-17" y="-56" width="34" height="16" fill="#544F4A" />
              <rect x="-10" y="-53" width="5" height="9" fill="#E8DED2" opacity="0.45" />
              <rect x="5" y="-53" width="5" height="9" fill="#E8DED2" opacity="0.45" />
              <path d="M-38,-56 C-28,-57 -19,-62 -14,-69 L14,-69 C19,-62 28,-57 38,-56 C29,-51 19,-52 14,-53 L-14,-53 C-19,-52 -29,-51 -38,-56 Z" />

              <rect x="-12" y="-83" width="24" height="14" fill="#4B4642" />
              <rect x="-3" y="-80" width="6" height="8" fill="#E8DED2" opacity="0.48" />
              <path d="M-30,-83 C-21,-84 -14,-89 -9,-97 L9,-97 C14,-89 21,-84 30,-83 C22,-78 14,-79 9,-80 L-9,-80 C-14,-79 -22,-78 -30,-83 Z" />

              <polygon points="-8,-97 8,-97 4,-103 -4,-103" />
              <line
                x1="0"
                y1="-103"
                x2="0"
                y2="-128"
                stroke="#3A3633"
                strokeWidth="2.1"
                strokeLinecap="round"
              />
              <circle cx="0" cy="-114" r="2.1" fill="#3A3633" />
              <circle cx="0" cy="-120" r="1.6" fill="#3A3633" />
            </g>
          </svg>
        </div>
        </div>
      </div>
    );
  }
);

interface HeroForegroundProps {
  className?: string;
  decorRef?: React.Ref<HTMLDivElement>;
}

/**
 * Foreground Japanese atmosphere sitting above the 3D cat canvas (`z-[7]`, pointer-events-none):
 * - Billowy organic rolling warm washi clouds & morning mist enveloping the base of the cat's armor
 * - Hero-only foreground accents (`decorRef`): sweeping crimson dry-brush calligraphy stroke & drifting petals
 */
export const HeroJapaneseForeground = forwardRef<HTMLDivElement, HeroForegroundProps>(
  function HeroJapaneseForeground({ className = "", decorRef }, ref) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        data-testid="hero-japanese-foreground"
        className={`pointer-events-none absolute inset-0 z-[7] overflow-hidden will-change-[opacity,transform] ${className}`}
      >
        {/* Soft lower horizon washi veil */}
        <div
          className="absolute inset-x-0 bottom-0 h-[31%]"
          style={{
            background:
              "linear-gradient(to top, #F4EADF 0%, rgba(244, 234, 223, 0.94) 26%, rgba(244, 234, 223, 0.48) 58%, rgba(244, 234, 223, 0) 100%)",
          }}
        />

        {/* Billowy organic rolling morning clouds enveloping the lower armor edge */}
        <svg
          viewBox="0 0 1440 340"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-[34%] w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="washi-cloud-blur" x="-8%" y="-20%" width="116%" height="140%">
              <feGaussianBlur stdDeviation="20" />
            </filter>
            <linearGradient id="cloud-puff-warm" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FBF5ED" stopOpacity="0.92" />
              <stop offset="65%" stopColor="#F4EADF" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#F4EADF" stopOpacity="1" />
            </linearGradient>
          </defs>
          <g filter="url(#washi-cloud-blur)">
            <ellipse cx="180" cy="285" rx="260" ry="96" fill="url(#cloud-puff-warm)" opacity="0.92" />
            <ellipse cx="470" cy="268" rx="235" ry="92" fill="#FBF5ED" opacity="0.88" />
            <ellipse cx="720" cy="292" rx="270" ry="86" fill="url(#cloud-puff-warm)" opacity="0.96" />
            <ellipse cx="990" cy="262" rx="240" ry="96" fill="#FBF5ED" opacity="0.9" />
            <ellipse cx="1270" cy="282" rx="260" ry="98" fill="url(#cloud-puff-warm)" opacity="0.92" />
            <ellipse cx="590" cy="306" rx="210" ry="72" fill="#F4EADF" opacity="0.98" />
            <ellipse cx="860" cy="308" rx="215" ry="74" fill="#F4EADF" opacity="0.98" />
          </g>
        </svg>

        {/* Hero-Only Foreground Decor (crimson brush stroke + floating petals fade on scroll to #projects) */}
        <div
          ref={decorRef}
          className="pointer-events-none absolute inset-0 will-change-[opacity,transform]"
        >
        {/* Dynamic Sweeping Crimson Sumi-e Dry-Brush Stroke (Bottom-Right) */}
        <div className="absolute bottom-0 right-0 w-[68vw] max-w-[780px] sm:w-[54vw] lg:w-[48vw]">
          <svg
            viewBox="0 0 760 280"
            className="block h-auto w-full overflow-visible"
            preserveAspectRatio="xMaxYMax meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="brush-crimson-main" x1="8%" y1="92%" x2="96%" y2="18%">
                <stop offset="0%" stopColor="#BA2126" stopOpacity="0.12" />
                <stop offset="22%" stopColor="#B81D23" stopOpacity="0.72" />
                <stop offset="56%" stopColor="#A6171D" stopOpacity="0.96" />
                <stop offset="100%" stopColor="#7C0F14" stopOpacity="0.98" />
              </linearGradient>
              <linearGradient id="brush-crimson-bright" x1="15%" y1="88%" x2="95%" y2="25%">
                <stop offset="0%" stopColor="#D63237" stopOpacity="0" />
                <stop offset="32%" stopColor="#CA252B" stopOpacity="0.75" />
                <stop offset="78%" stopColor="#9B141A" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#750E13" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            <path
              d="M95,282 C192,262 292,248 398,256 C504,264 592,232 652,164 C698,112 732,74 785,48 L792,98 C742,126 706,172 656,220 C594,278 492,294 384,282 C276,270 184,274 95,282 Z"
              fill="url(#brush-crimson-main)"
            />
            <path
              d="M172,268 C264,234 368,224 468,236 C552,246 620,206 668,142 C704,94 740,58 784,34 C744,64 712,108 674,158 C624,222 552,254 464,244 C366,232 266,242 172,268 Z"
              fill="url(#brush-crimson-bright)"
            />
            <path
              d="M276,262 C368,256 462,264 548,232 C618,206 666,144 714,96 C738,72 762,56 788,44 C762,66 738,90 714,118 C666,174 614,228 544,248 C460,272 368,266 276,262 Z"
              fill="#6E0C11"
              opacity="0.62"
            />
            <path
              d="M44,279 C142,254 252,228 366,238 C462,246 544,234 610,188"
              fill="none"
              stroke="#B81E24"
              strokeWidth="3.2"
              strokeLinecap="round"
              opacity="0.58"
            />
            <path
              d="M120,281 C214,244 328,234 438,248 C528,260 604,230 666,162"
              fill="none"
              stroke="#C9282E"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.66"
            />
            <path
              d="M498,274 C582,266 646,222 702,158 C730,126 756,102 786,84"
              fill="none"
              stroke="#8F1218"
              strokeWidth="4.2"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d="M362,268 C454,274 536,258 604,206 C654,168 692,118 754,76"
              fill="none"
              stroke="#F4EADF"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.55"
            />
            <path
              d="M448,256 C526,252 596,216 648,158 C678,124 708,92 746,68"
              fill="none"
              stroke="#F4EADF"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.45"
            />
          </svg>
        </div>

        {/* Floating Drifting Sakura Petals */}
        <svg
          viewBox="0 0 1440 900"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="drifting-petal-fill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E4474B" />
              <stop offset="55%" stopColor="#BD1E24" />
              <stop offset="100%" stopColor="#851016" />
            </linearGradient>
            <path
              id="loose-petal"
              d="M0,0 C8,-6 21,-5 28,2 C23,11 10,12 0,4 C-2,2 -2,1 0,0 Z"
              fill="url(#drifting-petal-fill)"
            />
          </defs>

          <g className="hero-petal-a" transform="translate(342, 166) rotate(-24) scale(1.05)">
            <use href="#loose-petal" opacity="0.88" />
          </g>
          <g className="hero-petal-b" transform="translate(402, 228) rotate(36) scale(0.76)">
            <use href="#loose-petal" opacity="0.82" />
          </g>
          <g className="hero-petal-c" transform="translate(1078, 304) rotate(18) scale(0.84)">
            <use href="#loose-petal" opacity="0.78" />
          </g>
          <g className="hero-petal-a" transform="translate(184, 542) rotate(52) scale(0.78)">
            <use href="#loose-petal" opacity="0.72" />
          </g>
          <g className="hero-petal-b" transform="translate(1176, 756) rotate(-32) scale(1.18)">
            <use href="#loose-petal" opacity="0.92" />
          </g>
          <g className="hero-petal-c" transform="translate(264, 344) rotate(-42) scale(0.62)">
            <use href="#loose-petal" opacity="0.62" />
          </g>
        </svg>
        </div>
      </div>
    );
  }
);
