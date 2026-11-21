import test from "node:test";
import assert from "node:assert/strict";
import {
  computeBasePortalDimensions,
  computeHeroPortalGeometry,
  shouldBypassHeroPortal,
  stepPortalFromTouchDelta,
  stepPortalFromWheel,
} from "./hero-portal";

test("base portal dimensions stay centered and well-proportioned on desktop and mobile", () => {
  const desktop = computeBasePortalDimensions(1440, 900);
  assert.equal(desktop.isMobile, false);
  assert.ok(desktop.width >= 380 && desktop.width <= 490);
  assert.ok(desktop.height >= 510 && desktop.height <= 690);
  assert.ok(desktop.width < 1440 * 0.4, "desktop portal leaves side corridor space for split titles");

  const mobile = computeBasePortalDimensions(390, 844);
  assert.equal(mobile.isMobile, true);
  assert.ok(mobile.width <= 310 && mobile.width < 390);
  assert.ok(mobile.height <= 410 && mobile.height < 844);
});

test("computeHeroPortalGeometry transitions cleanly from framed portal (0) to full-bleed hero (1)", () => {
  const start = computeHeroPortalGeometry(0, 1440, 900);
  const mid = computeHeroPortalGeometry(0.5, 1440, 900);
  const end = computeHeroPortalGeometry(1, 1440, 900);

  // At rest (progress = 0): centered frame with visible corridor backdrop & hidden full-bleed nav/curiosity
  assert.ok(start.insetX > 400);
  assert.ok(start.insetY > 100);
  assert.equal(start.backdropOpacity, 1);
  assert.equal(start.backdropScale, 1);
  assert.equal(start.titleShiftVw, 0);
  assert.equal(start.titleOpacity, 1);
  assert.equal(start.shojiOpenProgress, 0);
  assert.equal(start.frameChromeOpacity, 1);
  assert.equal(start.heroFullChromeOpacity, 0);
  assert.equal(start.navOpacity, 0);

  // Mid-scroll (progress = 0.5): portal expanding, shoji mostly open, titles parted, corridor zooming
  assert.ok(mid.insetX < start.insetX && mid.insetX > 0);
  assert.ok(mid.insetY < start.insetY && mid.insetY > 0);
  assert.ok(mid.backdropScale > 1.05 && mid.backdropScale < 1.18);
  assert.ok(mid.titleShiftVw > 10);
  assert.ok(mid.shojiOpenProgress > 0.85);
  assert.equal(mid.navOpacity, 0);

  // Fully expanded (progress = 1): zero seam insets, corridor & chrome dissolved, Hero & Nav 100% revealed
  assert.equal(end.insetX, 0);
  assert.equal(end.insetY, 0);
  assert.equal(end.borderRadius, 0);
  assert.equal(end.backdropOpacity, 0);
  assert.equal(end.titleOpacity, 0);
  assert.equal(end.frameChromeOpacity, 0);
  assert.equal(end.heroFullChromeOpacity, 1);
  assert.equal(end.navOpacity, 1);
});

test("stepPortalFromWheel consumes wheel while expanding and unlocks normal page scroll at full expansion", () => {
  const s1 = stepPortalFromWheel({
    currentProgress: 0,
    expanded: false,
    deltaY: 120,
    windowScrollY: 0,
  });
  assert.equal(s1.consumed, true);
  assert.equal(s1.expanded, false);
  assert.ok(s1.nextProgress > 0 && s1.nextProgress < 0.3);

  // Complete expansion
  const s2 = stepPortalFromWheel({
    currentProgress: 0.94,
    expanded: false,
    deltaY: 120,
    windowScrollY: 0,
  });
  assert.equal(s2.consumed, true);
  assert.equal(s2.expanded, true);
  assert.equal(s2.nextProgress, 1);

  // Downward scroll once expanded passes straight through to Lenis
  const s3 = stepPortalFromWheel({
    currentProgress: 1,
    expanded: true,
    deltaY: 120,
    windowScrollY: 200,
  });
  assert.equal(s3.consumed, false);
  assert.equal(s3.expanded, true);

  // Upward scroll deep in the page does NOT hijack scroll back into portal
  const s4 = stepPortalFromWheel({
    currentProgress: 1,
    expanded: true,
    deltaY: -120,
    windowScrollY: 420,
  });
  assert.equal(s4.consumed, false);
  assert.equal(s4.expanded, true);

  // Upward scroll at the very top (scrollY <= 5) smoothly re-closes the Japanese portal
  const s5 = stepPortalFromWheel({
    currentProgress: 1,
    expanded: true,
    deltaY: -120,
    windowScrollY: 0,
  });
  assert.equal(s5.consumed, true);
  assert.equal(s5.expanded, false);
  assert.ok(s5.nextProgress < 1 && s5.nextProgress > 0.7);
});

test("stepPortalFromTouchDelta handles swipe-up expansion and top-of-page swipe-down retraction", () => {
  const expandStep = stepPortalFromTouchDelta({
    currentProgress: 0,
    expanded: false,
    touchDeltaY: 110,
    windowScrollY: 0,
  });
  assert.equal(expandStep.consumed, true);
  assert.ok(expandStep.nextProgress > 0.25);

  const retractStep = stepPortalFromTouchDelta({
    currentProgress: 1,
    expanded: true,
    touchDeltaY: -40,
    windowScrollY: 0,
  });
  assert.equal(retractStep.consumed, true);
  assert.equal(retractStep.expanded, false);
  assert.ok(retractStep.nextProgress < 1);
});

test("shouldBypassHeroPortal skips intro for autostart, deep chapter hashes, or reduced motion", () => {
  assert.equal(
    shouldBypassHeroPortal({ search: "", hash: "", prefersReducedMotion: false }),
    false
  );
  assert.equal(
    shouldBypassHeroPortal({ search: "", hash: "#top", prefersReducedMotion: false }),
    false
  );
  assert.equal(
    shouldBypassHeroPortal({ search: "?autostart=1", hash: "", prefersReducedMotion: false }),
    true
  );
  assert.equal(
    shouldBypassHeroPortal({ search: "", hash: "#projects", prefersReducedMotion: false }),
    true
  );
  assert.equal(
    shouldBypassHeroPortal({ search: "", hash: "", prefersReducedMotion: true }),
    true
  );
});
