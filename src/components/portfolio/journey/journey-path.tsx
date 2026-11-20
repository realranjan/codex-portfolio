"use client";

import type { RefObject } from "react";
import {
  JOURNEY_WORLD,
  MOUNTAIN_TRAIL_POINTS,
  type MountainPoint,
} from "@/data/experience-journey";
import {
  buildMountainTrailSvgPath,
  evaluateMountainSpline,
} from "@/lib/mountain-journey";

interface JourneyPathProps {
  traveledPathRef?: RefObject<SVGPathElement | null>;
  staticProgress?: number;
}

// Exact spline walked by the traveler cat (used for the burgundy ink progress trace)
const TRAIL_D = buildMountainTrailSvgPath(MOUNTAIN_TRAIL_POINTS, 130);

// Extended full-bleed footpath & hillside silhouette spanning well beyond both viewport edges
// so there is NEVER a diagonal cutoff or abrupt road edge on the left or right.
const EXTENDED_TRAIL_POINTS: readonly MountainPoint[] = [
  { x: -640, y: 742 },
  { x: -180, y: 716 },
  ...MOUNTAIN_TRAIL_POINTS,
  { x: 3220, y: 552 },
  { x: 3680, y: 560 },
];
const EXTENDED_TRAIL_D = buildMountainTrailSvgPath(EXTENDED_TRAIL_POINTS, 180);

// Gentle rolling hillside ridge tucked slightly above the footpath so the road sits
// naturally carved into the mountain base instead of floating across mid-air cliffs.
const UPPER_TERRACE_POINTS: readonly MountainPoint[] = EXTENDED_TRAIL_POINTS.map(
  (pt, idx) => ({
    x: pt.x,
    y: pt.y - 26 - (idx % 3) * 8,
  })
);
const UPPER_TERRACE_D = buildMountainTrailSvgPath(UPPER_TERRACE_POINTS, 140);

// Delicate sumi-e ink hillside contour lines sweeping naturally down the earth slope
const SLOPE_CONTOUR_A = buildMountainTrailSvgPath(
  EXTENDED_TRAIL_POINTS.map((pt, idx) => ({
    x: pt.x,
    y: pt.y + 42 + Math.sin(idx * 1.3) * 14,
  })),
  120
);
const SLOPE_CONTOUR_B = buildMountainTrailSvgPath(
  EXTENDED_TRAIL_POINTS.map((pt, idx) => ({
    x: pt.x,
    y: pt.y + 98 + Math.cos(idx * 1.1) * 18,
  })),
  110
);

// Organic, irregular hand-set flat flagstones along the mountain trail (no uniform polka-dot ovals)
const FLAGSTONE_SHAPES = [
  "M -11 -2 L -4 -5 L 8 -4 L 12 0 L 7 4 L -7 3 Z",
  "M -9 -3 L 1 -5 L 10 -2 L 8 3 L -2 4 L -10 1 Z",
  "M -13 -1 L -5 -4 L 6 -3 L 11 1 L 4 4 L -8 3 Z",
  "M -8 -3 L 3 -4 L 9 0 L 5 3 L -6 4 Z",
] as const;

const STEPPING_STONES = Array.from({ length: 30 }, (_, idx) => {
  const t = 0.03 + (idx / 30) * 0.94;
  const pt = evaluateMountainSpline(MOUNTAIN_TRAIL_POINTS, t);
  const ahead = evaluateMountainSpline(
    MOUNTAIN_TRAIL_POINTS,
    Math.min(1, t + 0.008)
  );
  const angle = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
  const offsetY = (idx % 3 === 0 ? -3.5 : idx % 3 === 1 ? 3.2 : 0.4);
  const scale = 0.85 + (idx % 4) * 0.12;
  return {
    id: idx,
    x: pt.x,
    y: pt.y + offsetY,
    angle,
    scale,
    shape: FLAGSTONE_SHAPES[idx % FLAGSTONE_SHAPES.length],
  };
});

// Restrained sumi-e grass tufts & tiny pebbles overlapping the footpath shoulders
// so the trail edge dissolves organically into the hillside earth.
const TRAILSIDE_ACCENTS = [
  { x: 140, y: 710, scale: 0.92, side: 1 },
  { x: 375, y: 696, scale: 1.0, side: 1 },
  { x: 645, y: 644, scale: 0.84, side: -1 },
  { x: 1025, y: 656, scale: 1.02, side: 1 },
  { x: 1385, y: 668, scale: 0.92, side: 1 },
  { x: 1555, y: 616, scale: 0.8, side: -1 },
  { x: 1895, y: 634, scale: 0.9, side: 1 },
  { x: 2245, y: 616, scale: 0.95, side: 1 },
  { x: 2615, y: 584, scale: 0.86, side: 1 },
  { x: 2890, y: 574, scale: 0.82, side: 1 },
] as const;

/**
 * Painterly Japanese mountain footpath carved organically into a rolling sumi-e
 * foothill slope. Uses soft-feathered earth washes, dry-brush ink contour edges,
 * irregular weathered flagstones, and full-bleed hillside gradients so the trail
 * blends seamlessly with both the mountains above and the ivory paper below.
 */
export function JourneyPath({
  traveledPathRef,
  staticProgress,
}: JourneyPathProps) {
  return (
    <svg
      viewBox={`0 0 ${JOURNEY_WORLD.width} ${JOURNEY_WORLD.height}`}
      width={JOURNEY_WORLD.width}
      height={JOURNEY_WORLD.height}
      className="block h-full w-full overflow-visible pointer-events-none"
      aria-hidden="true"
    >
      <defs>
        {/* Soft earth feathering filter so the footpath melts into the hillside instead of looking pasted on */}
        <filter
          id="journeyPathFeather"
          x="-5%"
          y="-30%"
          width="110%"
          height="160%"
        >
          <feGaussianBlur stdDeviation="5.5" />
        </filter>
        <filter
          id="journeyPathCoreSoft"
          x="-5%"
          y="-20%"
          width="110%"
          height="140%"
        >
          <feGaussianBlur stdDeviation="1.8" />
        </filter>

        {/* Soft misted upper hillside terrace separating mountains gently from the earth trail */}
        <linearGradient
          id="journeyUpperTerrace"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#F3E9DE" stopOpacity="0" />
          <stop offset="22%" stopColor="#EFE4D6" stopOpacity="0.88" />
          <stop offset="65%" stopColor="#E9DCCD" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#F3E9DE" stopOpacity="1" />
        </linearGradient>

        {/* Seamless hillside ground wash below the footpath melting smoothly into #F3E9DE */}
        <linearGradient
          id="journeyHillsideWash"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#DED0BF" stopOpacity="0.82" />
          <stop offset="14%" stopColor="#E8DACC" stopOpacity="0.94" />
          <stop offset="36%" stopColor="#F0E5D9" stopOpacity="0.99" />
          <stop offset="68%" stopColor="#F3E9DE" stopOpacity="1" />
          <stop offset="100%" stopColor="#F3E9DE" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* 1. Full-bleed soft foothill embankment rising just behind the trail so mountains seat naturally behind it */}
      <path
        d={`${UPPER_TERRACE_D} L 3680 1480 L -640 1480 Z`}
        fill="url(#journeyUpperTerrace)"
      />

      {/* 2. Subtle sumi-e uphill ridge contour stroke anchoring the path to the hillside */}
      <path
        d={UPPER_TERRACE_D}
        fill="none"
        stroke="#5E4D45"
        strokeOpacity="0.16"
        strokeWidth="2.4"
        strokeDasharray="34 24 68 30"
        strokeLinecap="round"
      />

      {/* 3. Full-bleed downhill slope wash seamlessly melting into #F3E9DE warm ivory */}
      <path
        d={`${EXTENDED_TRAIL_D} L 3680 1480 L -640 1480 Z`}
        fill="url(#journeyHillsideWash)"
      />

      {/* 4. Delicate dry-brush sumi-e hillside contour lines giving painterly earth depth */}
      <path
        d={SLOPE_CONTOUR_A}
        fill="none"
        stroke="#6B5950"
        strokeOpacity="0.16"
        strokeWidth="1.6"
        strokeDasharray="62 38 110 52"
        strokeLinecap="round"
      />
      <path
        d={SLOPE_CONTOUR_B}
        fill="none"
        stroke="#7A675D"
        strokeOpacity="0.11"
        strokeWidth="1.4"
        strokeDasharray="48 64 92 48"
        strokeLinecap="round"
      />

      {/* 5. Soft feathered earth shoulder wash (eliminates hard tape-like edges) */}
      <path
        d={EXTENDED_TRAIL_D}
        fill="none"
        stroke="#C7B39E"
        strokeOpacity="0.46"
        strokeWidth="38"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#journeyPathFeather)"
      />

      {/* 6. Soft downhill shadow edge tucked beneath the trail lip */}
      <path
        d={EXTENDED_TRAIL_D}
        fill="none"
        stroke="#4B3B36"
        strokeOpacity="0.15"
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(0, 7)"
        filter="url(#journeyPathFeather)"
      />

      {/* 7. Organic compacted sandstone/earth footpath surface */}
      <path
        d={EXTENDED_TRAIL_D}
        fill="none"
        stroke="#EAE0D3"
        strokeOpacity="0.86"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#journeyPathCoreSoft)"
      />

      {/* 8. Fine interrupted sumi-e brush ink accents along the downhill trail shoulder */}
      <path
        d={EXTENDED_TRAIL_D}
        fill="none"
        stroke="#52403A"
        strokeOpacity="0.24"
        strokeWidth="1.5"
        strokeDasharray="24 30 56 26 14 40"
        strokeLinecap="round"
        transform="translate(0, 12)"
      />
      <path
        d={EXTENDED_TRAIL_D}
        fill="none"
        stroke="#52403A"
        strokeOpacity="0.15"
        strokeWidth="1.2"
        strokeDasharray="18 46 38 34"
        strokeLinecap="round"
        transform="translate(0, -11)"
      />

      {/* 9. Hand-set irregular weathered flagstones blended gently into the footpath */}
      <g opacity="0.52">
        {STEPPING_STONES.map((stone) => (
          <path
            key={stone.id}
            d={stone.shape}
            transform={`translate(${stone.x.toFixed(1)}, ${stone.y.toFixed(1)}) rotate(${stone.angle.toFixed(1)}) scale(${stone.scale.toFixed(2)})`}
            fill="#C9B7A4"
            fillOpacity="0.65"
            stroke="#594740"
            strokeOpacity="0.26"
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* 10. Quiet Burgundy traveled ink brushstroke following behind the traveler cat */}
      <path
        ref={traveledPathRef}
        d={TRAIL_D}
        fill="none"
        stroke="#792B33"
        strokeOpacity="0.48"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={staticProgress !== undefined ? "1 0" : undefined}
      />

      {/* 11. Restrained ink-brush mountain grass tufts & trailside pebbles grounding the path */}
      <g fill="none" stroke="#3D302D" strokeLinecap="round" opacity="0.5">
        {TRAILSIDE_ACCENTS.map((tuft, idx) => (
          <g
            key={idx}
            transform={`translate(${tuft.x}, ${tuft.y}) scale(${tuft.scale})`}
          >
            <path d="M 0 0 Q -5 -12 -12 -18" strokeWidth="1.4" />
            <path d="M 2 0 Q 1 -16 -3 -23" strokeWidth="1.5" />
            <path d="M 5 0 Q 10 -13 15 -18" strokeWidth="1.3" />
            <path d="M 8 1 Q 14 -7 20 -9" strokeWidth="1.05" />
            <ellipse
              cx="-4"
              cy="2"
              rx="4.2"
              ry="1.9"
              fill="#9E8D7E"
              fillOpacity="0.55"
              stroke="#4B3B36"
              strokeOpacity="0.32"
              strokeWidth="0.8"
            />
            <ellipse
              cx="6"
              cy="3"
              rx="6.5"
              ry="2.1"
              fill="#4B3C39"
              fillOpacity="0.18"
              stroke="none"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
