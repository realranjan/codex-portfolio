"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TRAVELER SPRITE — 8-FRAME ANIMATED JAPANESE TRAVELER CAT (SVG)
 * -------------------------------------------------------------------------------
 * Distinct from the armored samurai Hero character:
 *  - Small anthropomorphic cat silhouette with pointed ears & subtle whiskers
 *  - Light woven bamboo traveling hat (kasa) worn tilted back slightly so cat
 *    ears and face profile remain immediately recognizable
 *  - Dark charcoal Japanese traveling cloak (kappa) & small woven backpack
 *  - Signature Burgundy (#792B33) scarf fluttering dynamically across 8 stride frames
 *  - Light wooden mountain walking staff & natural balancing tail
 *  - Strictly scroll-driven: cycles cleanly through 8 walk frames when scrolling,
 *    flips facing cleanly on reverse scroll, and settles into calm idle when stopped.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface TravelerSpriteProps {
  /** 0..7 walk frame index */
  walkFrame: number;
  /** True while actively scrolling along the trail; false settles smoothly into idle */
  isWalking: boolean;
  /** Direction of travel along the mountain trail */
  facing: "forward" | "backward";
  /** Gentle uphill/downhill terrain slope in degrees */
  slopeDeg?: number;
  /** Optional subtle height override */
  sizePx?: number;
}

interface GaitPose {
  bodyBobY: number;
  bodyLeanDeg: number;
  frontLegDeg: number;
  backLegDeg: number;
  frontKneeBend: number;
  backKneeBend: number;
  staffAngleDeg: number;
  staffShiftX: number;
  scarfWaveY: number;
  scarfWaveY2: number;
  cloakFlareX: number;
  tailAngleDeg: number;
}

/**
 * 8-frame calibrated bipedal cat gait cycle:
 * 0: Contact R  -> 1: Down R -> 2: Passing R -> 3: Up/Push R ->
 * 4: Contact L  -> 5: Down L -> 6: Passing L -> 7: Up/Push L
 */
const WALK_GAIT_FRAMES: readonly GaitPose[] = [
  {
    bodyBobY: 0.4,
    bodyLeanDeg: 5,
    frontLegDeg: 24,
    backLegDeg: -22,
    frontKneeBend: 2,
    backKneeBend: 6,
    staffAngleDeg: -10,
    staffShiftX: 4,
    scarfWaveY: -2.2,
    scarfWaveY2: 1.5,
    cloakFlareX: -2.5,
    tailAngleDeg: -6,
  },
  {
    bodyBobY: 2.2,
    bodyLeanDeg: 6.5,
    frontLegDeg: 14,
    backLegDeg: -26,
    frontKneeBend: 6,
    backKneeBend: 12,
    staffAngleDeg: -6,
    staffShiftX: 2.5,
    scarfWaveY: 0.5,
    scarfWaveY2: -1.8,
    cloakFlareX: -3.5,
    tailAngleDeg: -2,
  },
  {
    bodyBobY: -0.6,
    bodyLeanDeg: 4.5,
    frontLegDeg: -2,
    backLegDeg: 6,
    frontKneeBend: 3,
    backKneeBend: 14,
    staffAngleDeg: 3,
    staffShiftX: -1,
    scarfWaveY: 2.6,
    scarfWaveY2: -2.5,
    cloakFlareX: -1.8,
    tailAngleDeg: 5,
  },
  {
    bodyBobY: -2.0,
    bodyLeanDeg: 4,
    frontLegDeg: -16,
    backLegDeg: 20,
    frontKneeBend: 4,
    backKneeBend: 5,
    staffAngleDeg: 11,
    staffShiftX: -3.5,
    scarfWaveY: 1.0,
    scarfWaveY2: 2.2,
    cloakFlareX: -2.2,
    tailAngleDeg: 8,
  },
  {
    bodyBobY: 0.4,
    bodyLeanDeg: 5,
    frontLegDeg: -22,
    backLegDeg: 24,
    frontKneeBend: 6,
    backKneeBend: 2,
    staffAngleDeg: 14,
    staffShiftX: -4.5,
    scarfWaveY: -1.8,
    scarfWaveY2: 2.0,
    cloakFlareX: -2.8,
    tailAngleDeg: 4,
  },
  {
    bodyBobY: 2.2,
    bodyLeanDeg: 6.5,
    frontLegDeg: -26,
    backLegDeg: 14,
    frontKneeBend: 12,
    backKneeBend: 6,
    staffAngleDeg: 8,
    staffShiftX: -2,
    scarfWaveY: -0.2,
    scarfWaveY2: -1.5,
    cloakFlareX: -3.6,
    tailAngleDeg: -1,
  },
  {
    bodyBobY: -0.6,
    bodyLeanDeg: 4.5,
    frontLegDeg: 6,
    backLegDeg: -2,
    frontKneeBend: 14,
    backKneeBend: 3,
    staffAngleDeg: -1,
    staffShiftX: 1,
    scarfWaveY: 2.4,
    scarfWaveY2: -2.2,
    cloakFlareX: -1.6,
    tailAngleDeg: -7,
  },
  {
    bodyBobY: -2.0,
    bodyLeanDeg: 4,
    frontLegDeg: 20,
    backLegDeg: -16,
    frontKneeBend: 5,
    backKneeBend: 4,
    staffAngleDeg: -7,
    staffShiftX: 3,
    scarfWaveY: 0.4,
    scarfWaveY2: 1.8,
    cloakFlareX: -2.0,
    tailAngleDeg: -4,
  },
];

const IDLE_POSE: GaitPose = {
  bodyBobY: 0,
  bodyLeanDeg: 0,
  frontLegDeg: 4,
  backLegDeg: -5,
  frontKneeBend: 0,
  backKneeBend: 0,
  staffAngleDeg: -3,
  staffShiftX: 1,
  scarfWaveY: 1.2,
  scarfWaveY2: 0.8,
  cloakFlareX: 0,
  tailAngleDeg: 0,
};

export function TravelerSprite({
  walkFrame,
  isWalking,
  facing,
  slopeDeg = 0,
  sizePx = 92,
}: TravelerSpriteProps) {
  const safeFrame = ((walkFrame % 8) + 8) % 8;
  const pose = isWalking ? WALK_GAIT_FRAMES[safeFrame] : IDLE_POSE;
  const flipX = facing === "backward" ? -1 : 1;
  // Invert visual terrain tilt when facing left so cat leans naturally uphill/downhill
  const adjustedSlope = facing === "backward" ? -slopeDeg : slopeDeg;

  return (
    <div
      data-testid="traveler-cat-sprite"
      data-motion-state={isWalking ? "walking" : "idle"}
      data-facing={facing}
      data-walk-frame={String(isWalking ? safeFrame : 0)}
      style={{
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        transform: `scaleX(${flipX}) rotate(${adjustedSlope.toFixed(1)}deg)`,
        transformOrigin: "50% 92%",
      }}
      className="relative select-none pointer-events-none transition-[transform] duration-150 ease-out"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 120 120"
        width={sizePx}
        height={sizePx}
        className="block overflow-visible"
      >
        {/* Soft grounded contact shadow on mountain trail */}
        <ellipse
          cx="60"
          cy="111"
          rx={isWalking ? 19 : 16}
          ry="4.2"
          fill="#2B1F1E"
          fillOpacity="0.22"
        />

        {/* Character body rig pivoted near hips */}
        <g
          transform={`translate(0, ${pose.bodyBobY.toFixed(1)}) rotate(${pose.bodyLeanDeg.toFixed(1)}, 58, 86)`}
        >
          {/* Expressive cat tail curving out behind cloak */}
          <g transform={`rotate(${pose.tailAngleDeg.toFixed(1)}, 46, 84)`}>
            <path
              d="M 46 84 C 31 85, 22 76, 20 65 C 19 59, 24 57, 26 62 C 28 68, 34 77, 46 79 Z"
              fill="#352B2A"
            />
            <path
              d="M 21 63 C 20.5 60, 23.5 58.5, 25 61.5"
              fill="none"
              stroke="#F3E9DE"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.72"
            />
          </g>

          {/* Back leg (darker silhouette for depth) */}
          <g transform={`rotate(${pose.backLegDeg.toFixed(1)}, 56, 84)`}>
            <path
              d={`M 53 83 L ${52 - pose.backKneeBend * 0.25} 96 L ${55 - pose.backKneeBend * 0.15} 108`}
              stroke="#261E1E"
              strokeWidth="5.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Sandaled paw */}
            <ellipse
              cx={57 - pose.backKneeBend * 0.15}
              cy="109"
              rx="4.6"
              ry="2.6"
              fill="#3A2A27"
            />
          </g>

          {/* Small woven traveler backpack + rolled scroll on back */}
          <g transform="translate(36, 51) rotate(-9)">
            {/* Bedroll / parchment scroll tied atop pack */}
            <rect
              x="2"
              y="-5"
              width="15"
              height="6.5"
              rx="3.2"
              fill="#DFCEBA"
              stroke="#3B2B29"
              strokeWidth="1.4"
            />
            <line x1="6.5" y1="-5" x2="6.5" y2="1.5" stroke="#792B33" strokeWidth="1.3" />
            <line x1="12.5" y1="-5" x2="12.5" y2="1.5" stroke="#792B33" strokeWidth="1.3" />
            {/* Main woven pack */}
            <rect
              x="0"
              y="1"
              width="18"
              height="22"
              rx="4.5"
              fill="#6D5648"
              stroke="#2B1F1E"
              strokeWidth="1.6"
            />
            <path
              d="M 1 9 Q 9 12 17 9"
              fill="none"
              stroke="#2B1F1E"
              strokeWidth="1.4"
            />
            <circle cx="9" cy="11.5" r="1.5" fill="#792B33" />
          </g>

          {/* Front leg */}
          <g transform={`rotate(${pose.frontLegDeg.toFixed(1)}, 62, 84)`}>
            <path
              d={`M 61 83 L ${62 + pose.frontKneeBend * 0.2} 96 L ${63 + pose.frontKneeBend * 0.1} 108`}
              stroke="#3A2F2E"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Cream cat paw + simple straw sandal wrap */}
            <ellipse
              cx={65 + pose.frontKneeBend * 0.1}
              cy="109"
              rx="4.8"
              ry="2.7"
              fill="#EFE2D2"
              stroke="#2B1F1E"
              strokeWidth="1.2"
            />
            <line
              x1={61 + pose.frontKneeBend * 0.1}
              y1="109"
              x2={69 + pose.frontKneeBend * 0.1}
              y2="109"
              stroke="#792B33"
              strokeWidth="1.3"
            />
          </g>

          {/* Traveler wooden mountain walking staff (rhythmic plant/lift) */}
          <g
            transform={`translate(${pose.staffShiftX.toFixed(1)}, 0) rotate(${pose.staffAngleDeg.toFixed(1)}, 76, 72)`}
          >
            <line
              x1="79"
              y1="40"
              x2="75"
              y2="111"
              stroke="#4D392E"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Small burgundy cord tie near top of staff */}
            <line
              x1="78"
              y1="47"
              x2="79.5"
              y2="51"
              stroke="#792B33"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>

          {/* Simple Japanese traveling cloak (sumi-e charcoal cloth) */}
          <path
            d={`M 51 50 C 44 61, ${41 + pose.cloakFlareX} 75, ${40 + pose.cloakFlareX * 1.2} 87 C 52 90, 66 89, 75 84 C 74 71, 71 58, 66 50 Z`}
            fill="#2E2626"
            stroke="#1C1616"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* Subtle inner cloak fold line & ivory trim */}
          <path
            d={`M 56 54 C 54 66, ${53 + pose.cloakFlareX * 0.4} 77, ${54 + pose.cloakFlareX * 0.5} 87`}
            fill="none"
            stroke="#594C49"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d={`M ${42 + pose.cloakFlareX} 85 C 53 88, 65 87, 74 83`}
            fill="none"
            stroke="#E8D8C6"
            strokeOpacity="0.45"
            strokeWidth="1.2"
          />

          {/* Front paw reaching lightly onto the wooden walking staff */}
          <circle
            cx={75 + pose.staffShiftX * 0.45}
            cy="70"
            r="3.2"
            fill="#F3E9DE"
            stroke="#2B1F1E"
            strokeWidth="1.2"
          />

          {/* Signature Burgundy (#792B33) traveler scarf with animated trailing cloth */}
          <g>
            {/* Trailing scarf tail A */}
            <path
              d={`M 52 49 C 40 ${52 + pose.scarfWaveY}, 29 ${50 + pose.scarfWaveY2}, 21 ${55 + pose.scarfWaveY} C 28 ${60 + pose.scarfWaveY2}, 41 ${57 + pose.scarfWaveY * 0.5}, 53 54 Z`}
              fill="#792B33"
              stroke="#511A20"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
            {/* Shorter scarf tail B */}
            <path
              d={`M 53 52 C 44 ${57 + pose.scarfWaveY2 * 0.6}, 36 ${59 + pose.scarfWaveY * 0.8}, 30 ${63 + pose.scarfWaveY2} C 38 ${64 + pose.scarfWaveY}, 47 ${60 + pose.scarfWaveY2 * 0.5}, 56 55 Z`}
              fill="#8D353E"
              stroke="#511A20"
              strokeWidth="1"
            />
            {/* Neck wrap collar */}
            <path
              d="M 49 47 C 55 51, 64 51, 69 47 C 70 51, 67 55, 59 55 C 52 55, 48 52, 49 47 Z"
              fill="#792B33"
              stroke="#511A20"
              strokeWidth="1.1"
            />
          </g>

          {/* Recognizable cat head profile (warm ivory fur, crisp ears, serene expression) */}
          <g transform="translate(0, 0)">
            {/* Back cat ear */}
            <path
              d="M 52 33 L 50 20 L 60 28 Z"
              fill="#352B2A"
              stroke="#1E1717"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Head silhouette */}
            <ellipse
              cx="60"
              cy="38"
              rx="11.8"
              ry="10.4"
              fill="#F3E9DE"
              stroke="#261E1E"
              strokeWidth="1.5"
            />
            {/* Subtle warm-ink forehead marking */}
            <path
              d="M 54 29 C 57 31, 61 31, 64 29.5 C 61 33.5, 57 33.5, 54 29 Z"
              fill="#3B3130"
              opacity="0.82"
            />
            {/* Front cat ear */}
            <path
              d="M 58 31 L 60 19 L 68 29 Z"
              fill="#F3E9DE"
              stroke="#261E1E"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M 60.4 28.6 L 61.1 22.8 L 65.2 28 Z" fill="#792B33" opacity="0.48" />
            {/* Serene traveler eye (looking ahead along mountain trail) */}
            <circle cx="66.2" cy="37.2" r="1.7" fill="#1F1818" />
            <circle cx="66.8" cy="36.6" r="0.5" fill="#F3E9DE" />
            {/* Tiny nose & soft whiskers */}
            <polygon points="71.4,39.2 69.6,39.2 70.5,40.5" fill="#792B33" />
            <path
              d="M 67 41.2 L 75 40.4 M 66.8 42.6 L 74.2 43.2"
              stroke="#261E1E"
              strokeWidth="0.9"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>

          {/* Woven conical bamboo traveler hat (kasa) resting gently tilted back on neck/head */}
          <g transform="translate(55, 25) rotate(-14)">
            <path
              d="M -21 5 Q 0 -10 21 5 Q 0 1.5 -21 5 Z"
              fill="#DEC7A9"
              stroke="#3B2B29"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M -13 2.8 Q 0 -4.5 13 2.8"
              fill="none"
              stroke="#792B33"
              strokeOpacity="0.45"
              strokeWidth="1.1"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
