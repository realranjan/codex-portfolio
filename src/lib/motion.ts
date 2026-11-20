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
export function computeSpatialScrollState(
  rawProgress: number,
  rawProjectsProgress = 0
): SpatialScrollState {
  const progress = clamp01(rawProgress);
  const projects = clamp01(rawProjectsProgress);
  const arc = Math.sin(progress * Math.PI);
  const settle = smoothstep(0.04, 0.94, progress);
  const orbitDrift = smoothstep(0, 1, projects);
  const outroArc = Math.sin(smoothstep(0.7, 1, projects) * Math.PI);

  return {
    progress,
    cameraOffsetX: -1.35 * settle,
    cameraOffsetZ: -3.5 * settle + 0.45 * arc,
    headBiasX: 0.92 * settle - 0.55 * outroArc,
    headBiasY: -0.26 * settle + 0.16 * outroArc,
    dispersion: 1 + 1.15 * arc + 0.7 * outroArc,
    textDriftY: -96 * smoothstep(0, 0.72, progress),
    textOpacity: 1 - smoothstep(0.28, 0.85, progress),
    bgDriftX: -5.5 * settle - 4.5 * orbitDrift,
    bgDriftY: -8.0 * settle - 6.5 * orbitDrift,
    bgScale: 1.06 + 0.24 * settle + 0.14 * orbitDrift,
    bgOpacity: 0.48 + 0.26 * arc + 0.14 * Math.sin(projects * Math.PI),
    raysShiftY: -54 * settle - 42 * orbitDrift,
  };
}

export interface HeroToCarouselState {
  /** Normalized 0..1 progress across the hero-to-carousel transition band */
  heroProgress: number;
  /** Normalized 0..1 progress across the projects orbital band */
  projectsProgress: number;
  /** Hero copy & bottom shader dock opacity (1 -> 0) */
  heroOverlayOpacity: number;
  /** Hero copy upward drift in px */
  heroOverlayY: number;
  /** Bust framing blend: 0 = hero composition, 1 = horizontally centered */
  centerMix: number;
  /** Continuous scroll-driven camera dolly offset in world Z */
  cinematicDollyZ: number;
  /** Scroll-driven particle dispersion boost across Hero & Projects outro */
  cinematicDispersion: number;
  /** Continuous orbital camera lateral sweep during projects scroll */
  orbitCameraArcX: number;
  /** Continuous orbital camera vertical breath during projects scroll */
  orbitCameraArcY: number;
  /** Blend from Hero camera distance to Orbit framing distance (0 -> 1) */
  orbitPullbackMix: number;
  /** 0..1 trace progress for the O-shape circular track around the model (comes & goes) */
  ringDrawMix: number;
  /** Carousel cards visibility along the O-shape line (comes & goes) */
  carouselMix: number;
  /** Selected Work HUD opacity (tracks carousel entrance & exit) */
  hudOpacity: number;
  /** Carousel orbital ring scale during reveal and exit (0.88 -> 1 -> 0.88) */
  carouselScale: number;
}

/**
 * Coordinates the continuous 4-act spatial scroll choreography:
 * Act I  (hero 0.00 -> 0.52): Close-up Hero cinematic (zoom-in, head turn, particle dispersion).
 * Act II (hero 0.54 -> 0.86): Camera pulls back to center while the circular O-shape orbit line draws.
 * Act III(hero 0.72 -> 1.00, projects 0.00 -> 0.74): Carousel comes along the O-ring and orbits while scroll cinema continues.
 * Act IV (projects 0.72 -> 1.00): Carousel & O-ring retract back out while the bust completes a closing cinematic sweep.
 */
export function computeHeroToCarouselState(
  rawHeroProgress: number,
  rawProjectsProgress = 0
): HeroToCarouselState {
  const heroProgress = clamp01(rawHeroProgress);
  const projectsProgress = clamp01(rawProjectsProgress);
  const heroFade = smoothstep(0.04, 0.36, heroProgress);
  const centerMix = smoothstep(0.14, 0.82, heroProgress);

  // Bell curve peaking ~0.45 for the preserved dramatic close-up Hero cinematic
  const closeUpEnvelope =
    smoothstep(0.06, 0.42, heroProgress) * (1 - smoothstep(0.48, 0.9, heroProgress));
  const heroDollyZ = closeUpEnvelope === 0 ? 0 : -3.4 * closeUpEnvelope;

  // Continuous cinematic motion while scrolling through the projects orbital band & exit outro
  const activeOrbitPhase = clamp01(projectsProgress / 0.78);
  const orbitDollyBreath =
    projectsProgress === 0 ? 0 : -0.7 * Math.sin(activeOrbitPhase * Math.PI);
  const outroEnvelope = smoothstep(0.72, 0.96, projectsProgress);
  const outroWave = Math.sin(smoothstep(0.7, 1.0, projectsProgress) * Math.PI);
  const outroDollyZ = outroEnvelope === 0 ? 0 : -1.85 * outroEnvelope;

  const orbitCameraArcX =
    projectsProgress === 0 ? 0 : 0.72 * Math.sin(projectsProgress * Math.PI * 2);
  const orbitCameraArcY =
    projectsProgress === 0 ? 0 : 0.22 * Math.sin(projectsProgress * Math.PI * 2);

  const orbitPullbackMix = smoothstep(0.48, 0.94, heroProgress);

  // Carousel & O-ring come in across Hero -> Projects, then dissolve back out near runway end
  const ringEnter = smoothstep(0.54, 0.86, heroProgress);
  const ringExit = 1 - smoothstep(0.8, 0.97, projectsProgress);
  const ringDrawMix = ringEnter * ringExit;

  const carouselEnter = smoothstep(0.72, 1.0, heroProgress);
  const carouselExit = 1 - smoothstep(0.72, 0.92, projectsProgress);
  const carouselMix = carouselEnter * carouselExit;

  const hudExit = 1 - smoothstep(0.68, 0.88, projectsProgress);
  const hudOpacity = carouselEnter * hudExit;

  return {
    heroProgress,
    projectsProgress,
    heroOverlayOpacity: 1 - heroFade,
    heroOverlayY: heroProgress === 0 ? 0 : -72 * smoothstep(0, 0.45, heroProgress),
    centerMix,
    cinematicDollyZ: heroDollyZ + orbitDollyBreath + outroDollyZ,
    cinematicDispersion: 1 + 1.25 * closeUpEnvelope + 0.28 * Math.sin(activeOrbitPhase * Math.PI) + 0.95 * outroWave,
    orbitCameraArcX,
    orbitCameraArcY,
    orbitPullbackMix,
    ringDrawMix,
    carouselMix,
    hudOpacity,
    carouselScale: 0.88 + 0.12 * carouselMix,
  };
}

export type HeroStoryBeat = "curiosity" | "killed" | "punchline" | "transition";

export interface HeroStoryScrollState {
  /** Clamped 0..1 progress across the full hero runway */
  progress: number;
  /** Which narrative beat currently owns the hero stage */
  activeBeat: HeroStoryBeat;
  /** Beat 1: "CURIOSITY" — visible at scroll 0, exits cleanly before Beat 2 */
  curiosity: {
    opacity: number;
    y: number;
    clipTopPct: number;
    visible: boolean;
  };
  /** Beat 2: "KILLED THE CAT." — word-staggered bottom-to-top reveal, exits cleanly before Beat 3 */
  killed: {
    opacity: number;
    y: number;
    wordYPercent: [number, number, number];
    visible: boolean;
  };
  /** Beat 3: "Not this one." — crimson SVG brushstroke left-to-right reveal, exits with parallax */
  punchline: {
    opacity: number;
    y: number;
    /** 0..1 left-to-right text & underline reveal progress */
    reveal: number;
    /** 0..1 leading edge of sweeping crimson wash */
    washHead: number;
    /** 0..1 trailing edge clearing the crimson wash behind the lettering */
    washTail: number;
    visible: boolean;
  };
  /** Initial scroll-down mouse cue opacity (fades quickly once user starts scrolling) */
  scrollCueOpacity: number;
  /** Multi-plane vertical parallax offset (px) for sakura branch, mountains, pagoda */
  backdropParallaxY: number;
  /** Multi-plane vertical parallax offset (px) for the crimson rising sun */
  sunParallaxY: number;
  /** Subtle scale modulation for the crimson rising sun */
  sunScale: number;
  /** Multi-plane vertical parallax offset (px) for foreground crimson sweep & petals */
  foregroundParallaxY: number;
  /** Hero scenery opacity (stays 1 across all 3 story beats, fades smoothly during transition) */
  decorOpacity: number;
  /** Lower mist opacity */
  mistOpacity: number;
  /** Normalized 0..1 progress forwarded to computeHeroToCarouselState for the next section */
  carouselStageProgress: number;
}

/**
 * Pure scroll-scrubbed choreography for the 3-beat hero typography narrative + parallax exit:
 * - Beat 1 (0.00 -> 0.18): Only "CURIOSITY" is displayed; scrolls upward & clips out cleanly.
 * - Beat 2 (0.20 -> 0.43): Only "KILLED THE CAT." rises word-by-word; exits cleanly upward.
 * - Beat 3 (0.45 -> 0.65): Only "Not this one." sweeps L->R with the crimson brushstroke; exits with parallax.
 * - Beat 4 (0.56 -> 1.00): Multi-plane depth parallax transitions smoothly into the #projects 3D circular gallery.
 *
 * Guarantees strict mutual exclusivity: previous text always reaches opacity 0 before the next text appears.
 */
export function computeHeroStoryScrollState(
  rawHeroProgress: number
): HeroStoryScrollState {
  const p = clamp01(rawHeroProgress);

  // Beat 1: CURIOSITY (holds 0.00 -> 0.08, exits 0.08 -> 0.18)
  const curiosityExit = smoothstep(0.08, 0.18, p);
  const curiosityOpacity = p >= 0.18 ? 0 : 1 - curiosityExit;
  const curiosityY = -42 * curiosityExit;
  const curiosityClipTopPct = 100 * smoothstep(0.09, 0.18, p);
  const curiosityVisible = curiosityOpacity > 0.005;

  // Beat 2: KILLED THE CAT. (enters 0.20 -> 0.33, holds 0.33 -> 0.36, exits 0.36 -> 0.43)
  const wordEnterWindows: ReadonlyArray<readonly [number, number]> = [
    [0.2, 0.27],
    [0.23, 0.3],
    [0.26, 0.33],
  ];
  const wordExitWindows: ReadonlyArray<readonly [number, number]> = [
    [0.36, 0.41],
    [0.375, 0.42],
    [0.39, 0.43],
  ];
  const wordYPercent = wordEnterWindows.map(([inStart, inEnd], idx) => {
    const [outStart, outEnd] = wordExitWindows[idx];
    if (p <= inStart) return 115;
    if (p >= outEnd) return -115;
    const enterT = smoothstep(inStart, inEnd, p);
    const exitT = smoothstep(outStart, outEnd, p);
    return (1 - enterT) * 115 - exitT * 115;
  }) as [number, number, number];

  const killedInMask = smoothstep(0.195, 0.215, p);
  const killedOutMask = 1 - smoothstep(0.415, 0.435, p);
  const killedOpacity = p < 0.2 || p >= 0.435 ? 0 : killedInMask * killedOutMask;
  const killedSpanT = clamp01((p - 0.2) / 0.235);
  const killedY = 10 - 16 * killedSpanT;
  const killedVisible = killedOpacity > 0.005;

  // Beat 3: "Not this one." + Crimson SVG Brushstroke (sweeps 0.45 -> 0.54, holds steady 0.54 -> 0.72, exits 0.72 -> 0.80)
  const punchlineReveal = smoothstep(0.45, 0.54, p);
  const washHead = smoothstep(0.45, 0.505, p);
  const washTail = smoothstep(0.495, 0.548, p);
  const punchlineExit = smoothstep(0.72, 0.8, p);
  const punchlineOpacity =
    p < 0.45 || p >= 0.8 ? 0 : smoothstep(0.45, 0.465, p) * (1 - punchlineExit);
  const punchlineY = 8 * (1 - punchlineReveal) - 26 * punchlineExit;
  const punchlineVisible = punchlineOpacity > 0.005;

  // Initial scroll cue gently clears once the user begins scrolling
  const scrollCueOpacity = 1 - smoothstep(0.015, 0.09, p);

  // Multi-plane parallax across the story + accelerated sweep into the next section
  const storyDrift = smoothstep(0, 0.6, p);
  const exitSweep = smoothstep(0.56, 0.96, p);
  const backdropParallaxY = -22 * storyDrift - 110 * exitSweep;
  const sunParallaxY = -12 * storyDrift - 62 * exitSweep;
  const sunScale = 1 - 0.03 * storyDrift - 0.13 * exitSweep;
  const foregroundParallaxY = -16 * storyDrift - 74 * exitSweep;

  const decorOpacity = 1 - smoothstep(0.68, 0.9, p);
  const mistOpacity = 0.42 + 0.58 * decorOpacity;

  // Forward the final 44% of the hero runway cleanly into the 3D close-up -> O-ring -> #projects carousel
  const carouselStageProgress = clamp01((p - 0.56) / 0.44);

  let activeBeat: HeroStoryBeat = "transition";
  if (p < 0.19) {
    activeBeat = "curiosity";
  } else if (p < 0.44) {
    activeBeat = "killed";
  } else if (p < 0.8) {
    activeBeat = "punchline";
  }

  return {
    progress: p,
    activeBeat,
    curiosity: {
      opacity: curiosityOpacity,
      y: curiosityY,
      clipTopPct: curiosityClipTopPct,
      visible: curiosityVisible,
    },
    killed: {
      opacity: killedOpacity,
      y: killedY,
      wordYPercent,
      visible: killedVisible,
    },
    punchline: {
      opacity: punchlineOpacity,
      y: punchlineY,
      reveal: punchlineReveal,
      washHead,
      washTail,
      visible: punchlineVisible,
    },
    scrollCueOpacity,
    backdropParallaxY,
    sunParallaxY,
    sunScale,
    foregroundParallaxY,
    decorOpacity,
    mistOpacity,
    carouselStageProgress,
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

