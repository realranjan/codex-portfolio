"use client";

import type { JourneyMilestone } from "@/data/experience-journey";

export interface MilestoneMarkerProps {
  milestone: JourneyMilestone;
  /** True when the traveler is currently settled at/near this checkpoint */
  isActiveStop: boolean;
  /** True when this checkpoint's details are currently displayed (by arrival or click) */
  isDisplayed: boolean;
  /** Ridge occlusion reveal factor [0..1] */
  revealStrength: number;
  onClick: (milestone: JourneyMilestone) => void;
}

/**
 * Physically grounded carved Japanese stone trail marker (michishirube) embedded
 * naturally beside the winding mountain path.
 *
 * - Click-only interactive <button> (never pops open on hover)
 * - Highlights smoothly when the traveler arrives at this checkpoint or when clicked
 * - Grounded into the hillside with pebbles, shadow, and crisp warm-ivory label contrast
 */
export function MilestoneMarker({
  milestone,
  isActiveStop,
  isDisplayed,
  revealStrength,
  onClick,
}: MilestoneMarkerProps) {
  const isInteractable = revealStrength > 0.2;

  return (
    <div
      style={{
        left: `${milestone.milestonePosition.x}px`,
        top: `${milestone.milestonePosition.y}px`,
        opacity: Math.max(0.18, revealStrength),
        transform: `translate(-50%, -88%) translateY(${((1 - revealStrength) * 14).toFixed(1)}px)`,
      }}
      className="absolute will-change-transform transition-opacity duration-300"
    >
      <button
        type="button"
        data-testid={`milestone-marker-${milestone.id}`}
        data-active-stop={isActiveStop ? "true" : "false"}
        data-displayed={isDisplayed ? "true" : "false"}
        aria-label={`Inspect milestone ${milestone.number}: ${milestone.companyName}`}
        aria-expanded={isDisplayed}
        aria-pressed={isDisplayed}
        disabled={!isInteractable}
        onClick={(e) => {
          e.stopPropagation();
          onClick(milestone);
        }}
        className={`group relative flex flex-col items-center focus-visible:outline-2 focus-visible:outline-[#792B33] focus-visible:outline-offset-4 ${
          isInteractable ? "cursor-pointer pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Quiet engraved company name caption rising cleanly above the stone */}
        <span
          style={{
            textShadow:
              "0 0 12px rgba(243,233,222,0.98), 0 0 5px rgba(243,233,222,0.96), 0 1px 2px rgba(243,233,222,0.95)",
          }}
          className={`mb-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] transition-all duration-200 ${
            isDisplayed
              ? "text-[#792B33] font-semibold -translate-y-0.5"
              : isActiveStop
                ? "text-[#581E25] font-medium"
                : "text-[#4D3633]/85 group-hover:text-[#792B33]"
          }`}
        >
          {milestone.number} · {milestone.companyName}
        </span>

        {/* Thin directional hairline cue linking stone marker toward the active side typography */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-[52px] h-px transition-all duration-300 ${
            milestone.sideEdge === "right"
              ? "left-full ml-2 origin-left"
              : "right-full mr-2 origin-right"
          } ${
            isDisplayed
              ? "w-16 bg-[#792B33]/70 opacity-100 scale-x-100"
              : "w-8 bg-[#792B33]/30 opacity-0 scale-x-50"
          }`}
        />

        {/* Carved Japanese Stone Trail Pillar (michishirube) */}
        <svg
          width="62"
          height="92"
          viewBox="0 0 66 98"
          className={`block overflow-visible transition-transform duration-200 ${
            isDisplayed ? "-translate-y-1 scale-[1.04]" : "group-hover:-translate-y-0.5"
          }`}
          aria-hidden="true"
        >
          {/* Ground contact shadow & embedded trailside pebbles */}
          <ellipse cx="33" cy="91" rx="25" ry="5.5" fill="#2A1F1E" fillOpacity="0.2" />
          <ellipse cx="14" cy="89" rx="6.5" ry="3" fill="#9A8B7E" stroke="#3D312F" strokeWidth="1" />
          <ellipse cx="52" cy="90" rx="5.2" ry="2.5" fill="#A9998C" stroke="#3D312F" strokeWidth="1" />

          {/* Sculpted weathered stone base plinth */}
          <path
            d="M 15 89 L 18 76 L 48 76 L 51 89 Z"
            fill="#AC9D90"
            stroke="#3B2F2D"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Standing carved stone stele */}
          <path
            d="M 21 77 L 23 19 C 23 13, 28 9, 33 8 C 39 9, 43 13, 44 19 L 45 77 Z"
            fill={isDisplayed ? "#EFE2D3" : "#D4C7B9"}
            stroke={isDisplayed ? "#792B33" : "#3B2F2D"}
            strokeWidth={isDisplayed ? "2" : "1.6"}
            strokeLinejoin="round"
          />

          {/* Subtle stone bevel shading on left flank */}
          <path
            d="M 22.5 76 L 24 20 C 24 15, 28 11.5, 31 10.5 L 30 76 Z"
            fill="#6D5E57"
            fillOpacity={isDisplayed ? "0.14" : "0.22"}
          />

          {/* Fine weathered ink cracks */}
          <path
            d="M 25 60 L 29 57 L 31 59 M 40 31 L 43 34"
            fill="none"
            stroke="#3B2F2D"
            strokeOpacity="0.32"
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* Engraved milestone numeral inside recessed vertical channel */}
          <rect
            x="27.5"
            y="22"
            width="11"
            height="36"
            rx="1.5"
            fill="none"
            stroke={isDisplayed ? "#792B33" : "#4A3B38"}
            strokeOpacity={isDisplayed ? "0.7" : "0.35"}
            strokeWidth="1"
          />
          <text
            x="33"
            y="45"
            textAnchor="middle"
            fill={isDisplayed ? "#792B33" : "#322524"}
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            {milestone.number}
          </text>

          {/* Small burgundy hanko seal square accent at top of stone */}
          <rect
            x="30.2"
            y="14"
            width="5.6"
            height="5.6"
            rx="0.8"
            fill="#792B33"
            fillOpacity={isDisplayed ? 1 : isActiveStop ? 0.82 : 0.32}
          />

          {/* Subtle trail grass blades hugging stone foot */}
          <path
            d="M 12 91 Q 9 82 6 78 M 15 91 Q 15 84 14 80 M 51 91 Q 54 83 58 80"
            fill="none"
            stroke="#3A2D2B"
            strokeOpacity="0.48"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
