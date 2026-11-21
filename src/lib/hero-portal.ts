/**
 * Pure, deterministic geometry, Lenis-grade smooth kinematics, Japanese
 * loader stage selection, and XrayText pointer math.
 *
 * Kept strictly free of DOM / browser globals so every calculation is
 * unit-tested via `node:test`.
 */

export interface HeroPortalGeometry {
  /** Clamped linear input progress in [0, 1]. */
  progress: number;
  /** Smooth cubic-out-in eased progress for spatial expansion in [0, 1]. */
  eased: number;
  /** True when viewport is narrow mobile (< 768px). */
  isMobile: boolean;
  /** Portal opening pixel width at current progress. */
  frameWidth: number;
  /** Portal opening pixel height at current progress. */
  frameHeight: number;
  /** Inset pixels from viewport top/bottom edge (0 at progress = 1). */
  insetY: number;
  /** Inset pixels from viewport left/right edge (0 at progress = 1). */
  insetX: number;
  /** Corner border radius in px (smoothly flattens to 0 at progress = 1). */
  borderRadius: number;
  /** Scale applied to the outer Japanese sanctuary corridor backdrop (1 -> 1.18). */
  backdropScale: number;
  /** Opacity of the outer Japanese sanctuary corridor backdrop (1 -> 0). */
  backdropOpacity: number;
  /** Horizontal outward travel in vw for the flanking split editorial titles (0 -> 42). */
  titleShiftVw: number;
  /** Opacity of the flanking split editorial titles (1 -> 0). */
  titleOpacity: number;
  /** Slide-open fraction [0, 1] for the inner left/right Japanese shoji lattice doors. */
  shojiOpenProgress: number;
  /** Opacity of the ornate wooden/brass Japanese frame chrome (1 -> 0 near end). */
  frameChromeOpacity: number;
  /** Opacity of the outside Japanese loader / percentage readout (1 -> 0 quickly as user enters). */
  loaderChromeOpacity: number;
  /** Opacity of full-bleed Hero typography & side decor (hidden inside small frame, blooms 0.52 -> 0.94). */
  heroFullChromeOpacity: number;
  /** Opacity of the global SiteNav bar (stays tucked away until portal opens 0.84 -> 1.0). */
  navOpacity: number;
}

export interface JapaneseLoaderStage {
  /** Verified klee-one Japanese calligraphy phrase rendered via TegakiRenderer. */
  japaneseWord: string;
  /** Subtle romaji/meaning label for screen readers. */
  ariaStatus: string;
  /** Clamped integer percentage [0..100]. */
  percent: number;
  /** Whether the 3D hero stage is ready for scroll entry. */
  isReady: boolean;
  /** Bold accent color for the exterior readout. */
  accentHex: string;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Selects the verified `tegaki/fonts/klee-one` Japanese calligraphy phrase
 * and bold color state for the exterior preloader readout.
 */
export function selectJapaneseLoaderStage(
  rawPercent: number,
  ready: boolean
): JapaneseLoaderStage {
  const safePct = Number.isFinite(rawPercent)
    ? Math.max(0, Math.min(100, Math.round(rawPercent)))
    : 0;

  if (ready || safePct >= 100) {
    return {
      japaneseWord: "ひらく",
      ariaStatus: "Ready to enter — 100 percent loaded",
      percent: 100,
      isReady: true,
      accentHex: "#F5C45E",
    };
  }

  if (safePct >= 82) {
    return {
      japaneseWord: "まもなく",
      ariaStatus: `Almost ready — ${safePct} percent loaded`,
      percent: safePct,
      isReady: false,
      accentHex: "#FF6B4A",
    };
  }

  if (safePct >= 42) {
    return {
      japaneseWord: "じゅんびちゅう",
      ariaStatus: `Preparing scene — ${safePct} percent loaded`,
      percent: safePct,
      isReady: false,
      accentHex: "#FF5644",
    };
  }

  return {
    japaneseWord: "よみこみ中",
    ariaStatus: `Loading — ${safePct} percent`,
    percent: safePct,
    isReady: false,
    accentHex: "#FF4D3D",
  };
}

/**
 * Computes responsive base portal dimensions (at progress = 0) so the
 * centered Japanese architectural frame holds the 3D Samurai Cat + rising sun
 * cleanly on both desktop widescreen and narrow mobile viewports while leaving
 * clear room below the bottom timber sill for the bold Japanese loader readout.
 */
export function computeBasePortalDimensions(
  viewportWidth: number,
  viewportHeight: number
): { width: number; height: number; isMobile: boolean } {
  const safeW = Math.max(320, viewportWidth);
  const safeH = Math.max(480, viewportHeight);
  const isMobile = safeW < 768;

  if (isMobile) {
    const width = Math.round(Math.min(safeW * 0.72, 304));
    const height = Math.round(Math.min(safeH * 0.46, 390));
    return { width, height, isMobile: true };
  }

  // Desktop / tablet: stately vertical tokonoma window proportion (~5:7)
  // leaving generous gallery headroom above the Samurai Cat kabuto horns,
  // room below the sill for the bold Japanese loader + percentage readout,
  // and balanced flanking corridor columns for YIN / YANG.
  const height = Math.round(Math.min(Math.max(safeH * 0.68, 490), 650));
  const width = Math.round(Math.min(Math.max(height * 0.72, 375), Math.min(485, safeW * 0.35)));
  return { width, height, isMobile: false };
}

/**
 * Computes every visual transform/inset/opacity parameter for the Japanese
 * Scroll-Expansion Hero Portal at a given `progress` in [0, 1].
 */
export function computeHeroPortalGeometry(
  rawProgress: number,
  viewportWidth: number,
  viewportHeight: number
): HeroPortalGeometry {
  const progress = clamp01(rawProgress);
  const safeW = Math.max(320, viewportWidth);
  const safeH = Math.max(480, viewportHeight);

  // Smooth cubic ease-out-in feel for cinematic portal expansion
  const eased =
    progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  const base = computeBasePortalDimensions(safeW, safeH);
  const frameWidth = base.width + (safeW - base.width) * eased;
  const frameHeight = base.height + (safeH - base.height) * eased;

  // Snap exact 0px inset at full expansion so zero 1px seam remains
  const insetX = progress >= 0.999 ? 0 : Math.max(0, (safeW - frameWidth) / 2);
  const insetY = progress >= 0.999 ? 0 : Math.max(0, (safeH - frameHeight) / 2);

  // Subtle architectural corner softening that becomes razor-square fullscreen
  const borderRadius =
    progress >= 0.96
      ? 0
      : Number(((1 - smoothstep(0.68, 0.96, progress)) * 6).toFixed(2));

  // Kyoto corridor pulls forward around the viewer as they step inside
  const backdropScale = 1 + eased * 0.18;
  const backdropOpacity = 1 - smoothstep(0.42, 0.96, progress);

  // Split editorial title parts smoothly left/right off-screen
  const titleShiftVw = eased * (base.isMobile ? 48 : 38);
  const titleOpacity = 1 - smoothstep(0.18, 0.68, progress);

  // Inner shoji lattice panels glide open during the first half of the scroll
  const shojiOpenProgress = smoothstep(0.02, 0.54, progress);

  // Wooden/brass architectural frame dissolves gracefully just as it hits viewport edges
  const frameChromeOpacity = 1 - smoothstep(0.76, 0.98, progress);

  // Outside Japanese loader readout fades out smoothly as soon as the user enters
  const loaderChromeOpacity = 1 - smoothstep(0.04, 0.34, progress);

  // Full-bleed Hero typography (CURIOSITY) and outer decor bloom as the frame opens wide
  const heroFullChromeOpacity = smoothstep(0.52, 0.94, progress);

  // Global SiteNav fades in cleanly only once the user steps fully inside the Hero
  const navOpacity = smoothstep(0.84, 0.99, progress);

  return {
    progress,
    eased,
    isMobile: base.isMobile,
    frameWidth,
    frameHeight,
    insetX,
    insetY,
    borderRadius,
    backdropScale,
    backdropOpacity,
    titleShiftVw,
    titleOpacity,
    shojiOpenProgress,
    frameChromeOpacity,
    loaderChromeOpacity,
    heroFullChromeOpacity,
    navOpacity,
  };
}

export interface SmoothPortalKinematicsResult {
  nextProgress: number;
  settled: boolean;
}

/**
 * Lenis-style framerate-independent exponential damper for portal scroll
 * interpolation so wheel/trackpad scrolling glides with identical buttery
 * momentum to Lenis smooth scroll across 60Hz, 120Hz, and software renderers.
 */
export function stepSmoothPortalKinematics(params: {
  current: number;
  target: number;
  dtSeconds: number;
  lerpRate?: number;
}): SmoothPortalKinematicsResult {
  const { current, target, dtSeconds, lerpRate = 7.8 } = params;
  const clampedTarget = clamp01(target);
  const clampedCurrent = clamp01(current);
  const diff = clampedTarget - clampedCurrent;

  if (Math.abs(diff) < 0.0008) {
    return { nextProgress: clampedTarget, settled: true };
  }

  // Framerate-independent exponential decay (matching Lenis's smooth feel)
  const safeDt = Math.min(0.064, Math.max(0.004, dtSeconds));
  const alpha = 1 - Math.exp(-safeDt * lerpRate);
  const next = clamp01(clampedCurrent + diff * alpha);

  return {
    nextProgress: next,
    settled: Math.abs(clampedTarget - next) < 0.0008,
  };
}

export interface PortalStepResult {
  nextProgress: number;
  expanded: boolean;
  consumed: boolean;
}

/**
 * Pure state machine deciding whether a wheel delta should be consumed by the
 * Japanese portal or passed through to normal page scrolling (Lenis).
 */
export function stepPortalFromWheel(params: {
  currentProgress: number;
  expanded: boolean;
  deltaY: number;
  windowScrollY: number;
  sensitivity?: number;
}): PortalStepResult {
  const {
    currentProgress,
    expanded,
    deltaY,
    windowScrollY,
    sensitivity = 0.00105,
  } = params;

  if (!Number.isFinite(deltaY) || deltaY === 0) {
    return {
      nextProgress: clamp01(currentProgress),
      expanded,
      consumed: false,
    };
  }

  // Clamp single trackpad/mouse spike so one hard flick still feels deliberate
  const clampedDelta = Math.max(-180, Math.min(180, deltaY));

  // Already inside the Hero: only re-capture when user scrolls UP at the very top
  if (expanded) {
    if (clampedDelta < 0 && windowScrollY <= 5) {
      const next = clamp01(1 + clampedDelta * sensitivity);
      return {
        nextProgress: next,
        expanded: false,
        consumed: true,
      };
    }
    return {
      nextProgress: 1,
      expanded: true,
      consumed: false,
    };
  }

  // Portal is currently active: consume wheel to expand or retract
  const next = clamp01(currentProgress + clampedDelta * sensitivity);
  const reachedFull = next >= 0.995;
  return {
    nextProgress: reachedFull ? 1 : next,
    expanded: reachedFull,
    consumed: true,
  };
}

/**
 * Pure touch-swipe progression helper for mobile viewports.
 */
export function stepPortalFromTouchDelta(params: {
  currentProgress: number;
  expanded: boolean;
  touchDeltaY: number;
  windowScrollY: number;
}): PortalStepResult {
  const { currentProgress, expanded, touchDeltaY, windowScrollY } = params;
  const sensitivity = touchDeltaY < 0 ? 0.0036 : 0.0032;

  if (expanded) {
    if (touchDeltaY < -14 && windowScrollY <= 5) {
      const next = clamp01(1 + touchDeltaY * sensitivity);
      return {
        nextProgress: next,
        expanded: false,
        consumed: true,
      };
    }
    return { nextProgress: 1, expanded: true, consumed: false };
  }

  const next = clamp01(currentProgress + touchDeltaY * sensitivity);
  const reachedFull = next >= 0.995;
  return {
    nextProgress: reachedFull ? 1 : next,
    expanded: reachedFull,
    consumed: true,
  };
}

/**
 * Determines whether the portal should start bypassed (already expanded)
 * based on query params (`?autostart=1`), deep chapter hashes (`#projects`),
 * or reduced-motion accessibility preference.
 */
export function shouldBypassHeroPortal(params: {
  search: string;
  hash: string;
  prefersReducedMotion: boolean;
}): boolean {
  if (params.prefersReducedMotion) return true;
  if (/(?:^|[?&])autostart=1(?:&|$)/.test(params.search)) return true;
  const cleanHash = params.hash.replace(/^#/, "").trim();
  if (cleanHash.length > 0 && cleanHash !== "top") return true;
  return false;
}

/**
 * Computes pointer coordinates local to an XrayText host bounding rect.
 */
export function computeXrayPointerLocal(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number }
): { x: number; y: number } {
  const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
  const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
  return {
    x: Number(x.toFixed(1)),
    y: Number(y.toFixed(1)),
  };
}
