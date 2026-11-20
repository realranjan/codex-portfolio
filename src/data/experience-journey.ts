/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHAPTER 05 · INTERACTIVE JAPANESE MOUNTAIN JOURNEY — EDITABLE DATA MANIFEST
 * -------------------------------------------------------------------------------
 * Verified company names in chronological order (01 -> 03).
 * Unverified career fields use explicit editable placeholders — update them here
 * directly without touching any scene, camera, or animation code.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface MountainPoint {
  readonly x: number;
  readonly y: number;
}

export interface JourneyMilestone {
  readonly id: string;
  readonly number: "01" | "02" | "03";
  readonly companyName: string;
  readonly role: string;
  readonly period: string;
  readonly location: string;
  readonly summary: string;
  readonly achievements: readonly [string, string];
  readonly technologies: readonly string[];
  readonly logo: string | null;
  readonly link: string | null;
  /** Normalized scroll progress [0..1] where the cat and camera settle at this stop */
  readonly trailStop: number;
  /** Exact stone marker coordinates in the 3000 x 900 panoramic world space */
  readonly milestonePosition: MountainPoint;
  /** Viewport edge where borderless company typography reveals (opposite the marker) */
  readonly sideEdge: "left" | "right";
}

export const JOURNEY_WORLD = {
  width: 3000,
  height: 900,
} as const;

export const JOURNEY_INTRO = {
  chapterNumber: "05",
  chapterLabel: "Experience & Journey",
  heading: "EVERY PATH LEAVES A MARK.",
  supportingText:
    "Different places. Different challenges. Something learned at every stop.",
} as const;

export const JOURNEY_ARTWORK = {
  farMountains: "/assets/journey/far-mountains.webp",
  midRidges: "/assets/journey/mid-ridges.webp",
  nearCrag: "/assets/journey/near-crag.webp",
  fgPines: "/assets/journey/fg-pines.webp",
} as const;

/**
 * Control points defining the winding Japanese mountain footpath across the
 * 3000 x 900 panoramic world. Waypoint indices 2, 4, and 6 align closely with
 * the three stone milestone markers along the trail.
 */
export const MOUNTAIN_TRAIL_POINTS: readonly MountainPoint[] = [
  { x: 210, y: 690 }, // Scene 01: Trailhead quiet arrival
  { x: 510, y: 650 }, // Gentle ascent along lower rocks
  { x: 850, y: 580 }, // Stop 01 — iMerit
  { x: 1250, y: 642 }, // Scene 03: Mountain bend dipping behind rocky ridge
  { x: 1685, y: 525 }, // Stop 02 — Haegl Tech (revealed around ridge bend)
  { x: 2075, y: 568 }, // High rocky pass transition
  { x: 2450, y: 472 }, // Stop 03 — RYVO (open upper mountain overlook)
  { x: 2790, y: 446 }, // Scene 06: Trail continues into misty ridge pullback
] as const;

/**
 * Three chronological career milestones.
 * NOTE: Company names are real; placeholder fields are explicitly labeled so no
 * unverified dates, job titles, metrics, or stacks are fabricated.
 */
export const JOURNEY_MILESTONES: readonly JourneyMilestone[] = [
  {
    id: "imerit",
    number: "01",
    companyName: "iMerit",
    role: "Role Title Placeholder — Update with verified title",
    period: "Start Date — End Date (Placeholder)",
    location: "Location Placeholder",
    summary:
      "Concise overview placeholder for your work at iMerit — replace with the team mission and engineering context.",
    achievements: [
      "Accomplishment 01 placeholder — add a verified engineering contribution or project outcome at iMerit.",
      "Accomplishment 02 placeholder — add a concrete technical system, workflow, or collaboration highlight.",
    ],
    technologies: ["Technology 01", "Technology 02", "Technology 03", "Technology 04"],
    logo: null,
    link: null,
    trailStop: 0.24,
    milestonePosition: { x: 865, y: 552 },
    sideEdge: "right",
  },
  {
    id: "haegl-tech",
    number: "02",
    companyName: "Haegl Tech",
    role: "Role Title Placeholder — Update with verified title",
    period: "Start Date — End Date (Placeholder)",
    location: "Location Placeholder",
    summary:
      "Concise overview placeholder for your work at Haegl Tech — replace with the product scope and engineering focus.",
    achievements: [
      "Accomplishment 01 placeholder — add a verified feature, architecture decision, or shipped deliverable at Haegl Tech.",
      "Accomplishment 02 placeholder — add a concrete technical challenge solved during this chapter.",
    ],
    technologies: ["Technology 01", "Technology 02", "Technology 03", "Technology 04"],
    logo: null,
    link: null,
    trailStop: 0.54,
    milestonePosition: { x: 1695, y: 496 },
    sideEdge: "left",
  },
  {
    id: "ryvo",
    number: "03",
    companyName: "RYVO",
    role: "Role Title Placeholder — Update with verified title",
    period: "Start Date — Present (Placeholder)",
    location: "Location Placeholder",
    summary:
      "Concise overview placeholder for your work at RYVO — replace with current ownership, systems built, and direction.",
    achievements: [
      "Accomplishment 01 placeholder — add a verified product or engineering milestone shipped at RYVO.",
      "Accomplishment 02 placeholder — add a second verifiable highlight or technical breakthrough.",
    ],
    technologies: ["Technology 01", "Technology 02", "Technology 03", "Technology 04"],
    logo: null,
    link: null,
    trailStop: 0.81,
    milestonePosition: { x: 2455, y: 444 },
    sideEdge: "left",
  },
] as const;
