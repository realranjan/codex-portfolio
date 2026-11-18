export const MOTION_DURATION = {
  fast: 0.2,
  standard: 0.75,
  editorial: 1.05,
  flyout: 0.55,
} as const;

export const MOTION_STAGGER = {
  tight: 0.04,
  base: 0.06,
  relaxed: 0.09,
} as const;

export const MOTION_EASE = {
  editorial: "power3.out",
  smooth: "power2.inOut",
  cssEditorial: "cubic-bezier(0.22, 1, 0.36, 1)",
  motionEditorial: [0.22, 1, 0.36, 1] as const,
} as const;

export const ASCII_CHARSET = ".:;+*#%@01/|-";

/**
 * Deterministically decodes target text left-to-right from constrained ASCII characters.
 * Preserves spaces so layout dimensions never shift during scramble.
 */
export function scrambleTextAtProgress(
  target: string,
  progress: number,
  seed = 0,
  charset: string = ASCII_CHARSET
): string {
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped >= 1) return target;
  if (target.length === 0) return "";

  const resolvedCount = Math.floor(clamped * target.length);
  let out = "";

  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    if (ch === " " || ch === "\n" || ch === "\t") {
      out += ch;
      continue;
    }
    if (i < resolvedCount) {
      out += ch;
    } else {
      const idx = Math.abs((i * 7 + seed * 13 + Math.floor(clamped * 37)) % charset.length);
      out += charset[idx];
    }
  }

  return out;
}

export interface SpatialScrollState {
  /** Normalized 0..1 progress across the hero-to-sculpture transition */
  progress: number;
  /** Camera lateral pan in world units */
  cameraOffsetX: number;
  /** Camera dolly zoom offset in world units */
  cameraOffsetZ: number;
  /** Sculpture yaw rotation bias in radians */
  headBiasX: number;
  /** Sculpture pitch rotation bias in radians */
  headBiasY: number;
  /** Normalized particle dispersal/reveal multiplier */
  dispersion: number;
  /** Typography vertical drift in px */
  textDriftY: number;
  /** Typography opacity fade */
  textOpacity: number;
  /** Background ASCII poster horizontal parallax in percent */
  bgDriftX: number;
  /** Background ASCII poster vertical parallax in percent */
  bgDriftY: number;
  /** Background ASCII poster parallax scale */
  bgScale: number;
  /** Background ASCII poster opacity modulation */
  bgOpacity: number;
  /** LightRays layer vertical parallax in px */
  raysShiftY: number;
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Computes coordinated 3D camera, sculpture orientation, background parallax,
 * and typography displacement across a single ScrollTrigger progress curve.
 */
export function computeSpatialScrollState(rawProgress: number): SpatialScrollState {
  const progress = clamp01(rawProgress);
  const arc = Math.sin(progress * Math.PI);
  const settle = smoothstep(0.04, 0.94, progress);

  return {
    progress,
    cameraOffsetX: -1.35 * settle,
    cameraOffsetZ: -3.5 * settle + 0.45 * arc,
    headBiasX: 0.92 * settle,
    headBiasY: -0.26 * settle,
    dispersion: 1 + 1.15 * arc,
    textDriftY: -96 * smoothstep(0, 0.72, progress),
    textOpacity: 1 - smoothstep(0.28, 0.85, progress),
    bgDriftX: -5.5 * settle,
    bgDriftY: -8.0 * settle,
    bgScale: 1.06 + 0.24 * settle,
    bgOpacity: 0.48 + 0.26 * arc,
    raysShiftY: -54 * settle,
  };
}

export interface HeroToCarouselState {
  /** Normalized 0..1 progress across the hero-to-carousel transition band */
  heroProgress: number;
  /** Hero copy & bottom shader dock opacity (1 -> 0) */
  heroOverlayOpacity: number;
  /** Hero copy upward drift in px */
  heroOverlayY: number;
  /** Bust framing blend: 0 = hero composition, 1 = dead-center inside carousel */
  centerMix: number;
  /** Carousel ring visibility & reveal progress (0 -> 1) */
  carouselMix: number;
  /** Carousel orbital ring scale during reveal (0.86 -> 1) */
  carouselScale: number;
}

/**
 * Coordinates the seamless transition from the asymmetric Hero framing into
 * the centered 3D bust surrounded by the orbiting circular project carousel.
 */
export function computeHeroToCarouselState(rawHeroProgress: number): HeroToCarouselState {
  const heroProgress = clamp01(rawHeroProgress);
  const heroFade = smoothstep(0.04, 0.52, heroProgress);
  const centerMix = smoothstep(0.06, 0.88, heroProgress);
  const carouselMix = smoothstep(0.46, 0.96, heroProgress);

  return {
    heroProgress,
    heroOverlayOpacity: 1 - heroFade,
    heroOverlayY: -56 * smoothstep(0, 0.62, heroProgress),
    centerMix,
    carouselMix,
    carouselScale: 0.86 + 0.14 * carouselMix,
  };
}

/**
 * Maps normalized scroll progress [0..1] into a centered vertical parallax translation [-rangePx..+rangePx].
 */
export function computeParallaxOffset(rawProgress: number, rangePx: number): number {
  const progress = clamp01(rawProgress);
  return (progress - 0.5) * 2 * rangePx;
}

export interface FlightWaypoint {
  id: string;
  /** Normalized scroll stop along route [0..1] */
  stop: number;
  /** Normalized X coordinate in SVG viewBox [0..1000] */
  x: number;
  /** Normalized Y coordinate in SVG viewBox [0..1000] */
  y: number;
}

export interface FlightPathSample {
  x: number;
  y: number;
  angleDeg: number;
  progress: number;
  activeWaypointId: string;
  reachedIds: string[];
}

/**
 * Samples airplane position, heading angle, and reached checkpoints along waypoints.
 */
export function sampleFlightPath(
  waypoints: readonly FlightWaypoint[],
  rawProgress: number
): FlightPathSample {
  if (waypoints.length === 0) {
    return {
      x: 0,
      y: 0,
      angleDeg: 0,
      progress: 0,
      activeWaypointId: "",
      reachedIds: [],
    };
  }

  const progress = clamp01(rawProgress);
  const reachedIds = waypoints.filter((w) => progress >= w.stop - 0.02).map((w) => w.id);
  const activeWaypointId =
    reachedIds.length > 0 ? reachedIds[reachedIds.length - 1] : waypoints[0].id;

  if (waypoints.length === 1 || progress <= waypoints[0].stop) {
    const first = waypoints[0];
    const next = waypoints[1] ?? first;
    const angleDeg =
      (Math.atan2(next.y - first.y, next.x - first.x) * 180) / Math.PI;
    return {
      x: first.x,
      y: first.y,
      angleDeg,
      progress,
      activeWaypointId,
      reachedIds,
    };
  }

  const last = waypoints[waypoints.length - 1];
  if (progress >= last.stop) {
    const prev = waypoints[waypoints.length - 2] ?? last;
    const angleDeg =
      (Math.atan2(last.y - prev.y, last.x - prev.x) * 180) / Math.PI;
    return {
      x: last.x,
      y: last.y,
      angleDeg,
      progress,
      activeWaypointId,
      reachedIds,
    };
  }

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (progress >= a.stop && progress <= b.stop) {
      const span = Math.max(1e-5, b.stop - a.stop);
      const localT = clamp01((progress - a.stop) / span);
      // Smooth cubic ease along each segment
      const eased = localT * localT * (3 - 2 * localT);
      const x = a.x + (b.x - a.x) * eased;
      const y = a.y + (b.y - a.y) * eased;
      const angleDeg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      return {
        x,
        y,
        angleDeg,
        progress,
        activeWaypointId,
        reachedIds,
      };
    }
  }

  return {
    x: last.x,
    y: last.y,
    angleDeg: 0,
    progress,
    activeWaypointId,
    reachedIds,
  };
}

export interface GalleryCardTransform {
  itemAngle: number;
  relativeAngle: number;
  normalizedAngle: number;
  opacity: number;
  isFront: boolean;
}

/**
 * Computes angular placement and depth opacity for a card on a 3D circular ring.
 */
export function computeGalleryCardTransform(
  itemIndex: number,
  totalItems: number,
  rotationDeg: number
): GalleryCardTransform {
  if (totalItems <= 0) {
    return {
      itemAngle: 0,
      relativeAngle: 0,
      normalizedAngle: 0,
      opacity: 1,
      isFront: true,
    };
  }
  const anglePerItem = 360 / totalItems;
  const itemAngle = itemIndex * anglePerItem;
  const wrappedRotation = ((rotationDeg % 360) + 360) % 360;
  const relativeAngle = (itemAngle + wrappedRotation + 360) % 360;
  const normalizedAngle = Math.abs(
    relativeAngle > 180 ? 360 - relativeAngle : relativeAngle
  );
  const opacity = Math.max(0.28, 1 - normalizedAngle / 180);
  const isFront = normalizedAngle <= anglePerItem * 0.5 + 0.01;

  return {
    itemAngle,
    relativeAngle,
    normalizedAngle,
    opacity,
    isFront,
  };
}

/**
 * Returns the index of the card currently closest to 0deg (front-facing).
 */
export function getFrontGalleryIndex(
  totalItems: number,
  rotationDeg: number
): number {
  if (totalItems <= 0) return 0;
  let bestIdx = 0;
  let bestAngle = Infinity;
  for (let i = 0; i < totalItems; i++) {
    const { normalizedAngle } = computeGalleryCardTransform(i, totalItems, rotationDeg);
    if (normalizedAngle < bestAngle) {
      bestAngle = normalizedAngle;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Maps a sticky container's bounding rect into a 0..360 degree carousel rotation.
 */
export function computeStickyScrollRotation(
  rectTop: number,
  containerHeight: number,
  viewportHeight: number
): number {
  const scrollable = containerHeight - viewportHeight;
  if (scrollable <= 0) return 0;
  const progress = clamp01(-rectTop / scrollable);
  return progress * 360;
}

