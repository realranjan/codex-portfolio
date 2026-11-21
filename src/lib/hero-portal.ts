/**
 * Pure, deterministic geometry & scroll-step math for the Japanese
 * Scroll-Expansion Hero Portal (`ScrollExpandMedia`).
 *
 * Kept strictly free of DOM / browser globals so it can be unit-tested
 * via `node:test` and shared cleanly between the portal component and
 * Hero stage synchronization.
 */

export interface HeroPortalGeometry {
  /** Clamped linear input progress in [0, 1]. */
  progress: number;
  /** Smooth cubic-out eased progress for spatial expansion in [0, 1]. */
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
  /** Opacity of full-bleed Hero typography & side decor (hidden inside small frame, blooms 0.52 -> 0.94). */
  heroFullChromeOpacity: number;
  /** Opacity of the global SiteNav bar (stays tucked away until portal opens 0.84 -> 1.0). */
  navOpacity: number;
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
 * Computes responsive base portal dimensions (at progress = 0) so the
 * centered Japanese architectural frame holds the 3D Samurai Cat + rising sun
 * cleanly on both desktop widescreen and narrow mobile viewports.
 */
export function computeBasePortalDimensions(
  viewportWidth: number,
  viewportHeight: number
): { width: number; height: number; isMobile: boolean } {
  const safeW = Math.max(320, viewportWidth);
  const safeH = Math.max(480, viewportHeight);
  const isMobile = safeW < 768;

  if (isMobile) {
    const width = Math.round(Math.min(safeW * 0.72, 310));
    const height = Math.round(Math.min(safeH * 0.5, 410));
    return { width, height, isMobile: true };
  }

  // Desktop / tablet: stately vertical tokonoma window proportion (~5:7)
  // giving generous gallery headroom above the Samurai Cat kabuto horns and
  // beside its armored ears while keeping flanking corridor space for split titles.
  const height = Math.round(Math.min(Math.max(safeH * 0.74, 510), 690));
  const width = Math.round(Math.min(Math.max(height * 0.71, 380), Math.min(490, safeW * 0.36)));
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
  const borderRadius = progress >= 0.96 ? 0 : Number(((1 - smoothstep(0.68, 0.96, progress)) * 6).toFixed(2));

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
    heroFullChromeOpacity,
    navOpacity,
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

  // Guard against degenerate or zero wheel noise
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
  // Swiping finger UP (positive touchDeltaY = startY - currentY) expands portal
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
