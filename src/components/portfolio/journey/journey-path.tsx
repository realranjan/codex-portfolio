"use client";

import type { RefObject } from "react";
import {
  JOURNEY_WORLD,
  MOUNTAIN_TRAIL_POINTS,
} from "@/data/experience-journey";
import {
  buildMountainTrailSvgPath,
  evaluateMountainSpline,
} from "@/lib/mountain-journey";

interface JourneyPathProps {
  traveledPathRef?: RefObject<SVGPathElement | null>;
  staticProgress?: number;
}

const TRAIL_D = buildMountainTrailSvgPath(MOUNTAIN_TRAIL_POINTS, 130);

// Deterministic stepping stones along the mountain footpath (zero random jitter)
const STEPPING_STONES = Array.from({ length: 34 }, (_, idx) => {
  const t = 0.03 + (idx / 34) * 0.94;
  const pt = evaluateMountainSpline(MOUNTAIN_TRAIL_POINTS, t);
  const ahead = evaluateMountainSpline(MOUNTAIN_TRAIL_POINTS, Math.min(1, t + 0.008));
  const angle = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
  const rx = 12 + (idx % 3) * 4;
  const ry = 4.2 + (idx % 2) * 1.4;
  const offsetY = (idx % 2 === 0 ? 1 : -1) * 3.5;
  return { id: idx, x: pt.x, y: pt.y + offsetY, rx, ry, angle };
});

// Restrained sumi-e grass tufts and trailside stones near bends
const TRAILSIDE_GRASS = [
  { x: 350, y: 696, scale: 1.0 },
  { x: 640, y: 634, scale: 0.85 },
  { x: 1020, y: 626, scale: 1.05 },
  { x: 1410, y: 632, scale: 0.9 },
  { x: 1875, y: 558, scale: 0.88 },
  { x: 2260, y: 536, scale: 0.95 },
  { x: 2630, y: 486, scale: 0.82 },
] as const;

/**
 * Winding Japanese stone/earth mountain pathway rendered inside the 3000 x 900
 * panoramic trail world plane. Strictly natural ink & stone materials—zero
 * glowing roads or fantasy embellishments.
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
        <linearGradient id="journeyTrailBed" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#DFCDBD" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#E7D8C9" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#DFCDBD" stopOpacity="0.88" />
        </linearGradient>
        <linearGradient id="journeyGroundWash" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D7C5B4" stopOpacity="0.46" />
          <stop offset="32%" stopColor="#E9DCCE" stopOpacity="0.88" />
          <stop offset="68%" stopColor="#F3E9DE" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#F3E9DE" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Deep warm earth & mist wash below the winding trail extending well past y=900 so no bottom edge ever shows */}
      <path
        d={`${TRAIL_D} L ${JOURNEY_WORLD.width + 600} ${JOURNEY_WORLD.height + 560} L -600 ${JOURNEY_WORLD.height + 560} Z`}
        fill="url(#journeyGroundWash)"
      />

      {/* Soft dark sumi-e shadow edge under the trail lip */}
      <path
        d={TRAIL_D}
        fill="none"
        stroke="#3A2D2B"
        strokeOpacity="0.18"
        strokeWidth="44"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(0, 7)"
      />

      {/* Main carved earth/stone footpath bed */}
      <path
        d={TRAIL_D}
        fill="none"
        stroke="url(#journeyTrailBed)"
        strokeWidth="36"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Fine dry-brush ink contour edges bordering the path */}
      <path
        d={TRAIL_D}
        fill="none"
        stroke="#4A3A37"
        strokeOpacity="0.28"
        strokeWidth="38"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="18 26 42 19"
      />
      <path
        d={TRAIL_D}
        fill="none"
        stroke="#EDE1D3"
        strokeWidth="33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Hand-set weathered flat stepping stones embedded along the path */}
      <g opacity="0.58">
        {STEPPING_STONES.map((stone) => (
          <ellipse
            key={stone.id}
            cx={stone.x.toFixed(1)}
            cy={stone.y.toFixed(1)}
            rx={stone.rx}
            ry={stone.ry}
            transform={`rotate(${stone.angle.toFixed(1)}, ${stone.x.toFixed(1)}, ${stone.y.toFixed(1)})`}
            fill="#C7B6A5"
            stroke="#594844"
            strokeOpacity="0.32"
            strokeWidth="1"
          />
        ))}
      </g>

      {/* Quiet Burgundy traveled footpath trace revealing behind the traveler cat */}
      <path
        ref={traveledPathRef}
        d={TRAIL_D}
        fill="none"
        stroke="#792B33"
        strokeOpacity="0.52"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray={staticProgress !== undefined ? "1 0" : undefined}
      />

      {/* Restrained ink-brush mountain grass tufts along trail shoulders */}
      <g fill="none" stroke="#362A29" strokeLinecap="round" opacity="0.46">
        {TRAILSIDE_GRASS.map((tuft, idx) => (
          <g
            key={idx}
            transform={`translate(${tuft.x}, ${tuft.y}) scale(${tuft.scale})`}
          >
            <path d="M 0 0 Q -6 -14 -14 -20" strokeWidth="1.5" />
            <path d="M 2 0 Q 1 -18 -3 -26" strokeWidth="1.6" />
            <path d="M 5 0 Q 11 -15 17 -21" strokeWidth="1.4" />
            <path d="M 8 1 Q 15 -8 22 -11" strokeWidth="1.1" />
            <ellipse cx="4" cy="2" rx="11" ry="2.6" fill="#4B3C39" fillOpacity="0.24" stroke="none" />
          </g>
        ))}
      </g>
    </svg>
  );
}
