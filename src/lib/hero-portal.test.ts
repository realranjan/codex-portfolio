import test from "node:test";
import assert from "node:assert/strict";
import {
  computeBasePortalDimensions,
  computeHeroPortalGeometry,
  computeXrayPointerLocal,
  selectJapaneseLoaderStage,
  shouldBypassHeroPortal,
  stepPortalFromTouchDelta,
  stepPortalFromWheel,
  stepSmoothPortalKinematics,
} from "./hero-portal";

test("base portal dimensions stay centered and well-proportioned on desktop and mobile", () => {
  const desktop = computeBasePortalDimensions(1440, 900);
  assert.equal(desktop.isMobile, false);
  assert.ok(desktop.width >= 375 && desktop.width <= 485);
  assert.ok(desktop.height >= 490 && desktop.height <= 650);
  assert.ok(desktop.width < 1440 * 0.4, "desktop portal leaves side corridor space for YIN/YANG");

  const mobile = computeBasePortalDimensions(390, 844);
  assert.equal(mobile.isMobile, true);
  assert.ok(mobile.width <= 304 && mobile.width < 390);
  assert.ok(mobile.height <= 390 && mobile.height < 844);
});

test("computeHeroPortalGeometry transitions cleanly from framed portal (0) to full-bleed hero (1)", () => {
  const start = computeHeroPortalGeometry(0, 1440, 900);
  const mid = computeHeroPortalGeometry(0.5, 1440, 900);
  const end = computeHeroPortalGeometry(1, 1440, 900);

  assert.ok(start.insetX > 400);
  assert.ok(start.insetY > 100);
  assert.equal(start.backdropOpacity, 1);
  assert.equal(start.backdropScale, 1);
  assert.equal(start.titleShiftVw, 0);
  assert.equal(start.titleOpacity, 1);
  assert.equal(start.shojiOpenProgress, 0);
  assert.equal(start.frameChromeOpacity, 1);
  assert.equal(start.loaderChromeOpacity, 1);
  assert.equal(start.heroFullChromeOpacity, 0);
  assert.equal(start.navOpacity, 0);

  assert.ok(mid.insetX < start.insetX && mid.insetX > 0);
  assert.ok(mid.insetY < start.insetY && mid.insetY > 0);
  assert.ok(mid.backdropScale > 1.05 && mid.backdropScale < 1.18);
  assert.ok(mid.titleShiftVw > 10);
  assert.ok(mid.shojiOpenProgress > 0.85);
  assert.equal(mid.loaderChromeOpacity, 0);
  assert.equal(mid.navOpacity, 0);

  assert.equal(end.insetX, 0);
  assert.equal(end.insetY, 0);
  assert.equal(end.borderRadius, 0);
  assert.equal(end.backdropOpacity, 0);
  assert.equal(end.titleOpacity, 0);
  assert.equal(end.frameChromeOpacity, 0);
  assert.equal(end.loaderChromeOpacity, 0);
  assert.equal(end.heroFullChromeOpacity, 1);
  assert.equal(end.navOpacity, 1);
});

test("selectJapaneseLoaderStage returns verified klee-one stages from 0% to 100% ready", () => {
  const s0 = selectJapaneseLoaderStage(12, false);
  assert.equal(s0.japaneseWord, "よみこみ中");
  assert.equal(s0.percent, 12);
  assert.equal(s0.isReady, false);

  const s50 = selectJapaneseLoaderStage(58, false);
  assert.equal(s50.japaneseWord, "じゅんびちゅう");
  assert.equal(s50.percent, 58);

  const s90 = selectJapaneseLoaderStage(91, false);
  assert.equal(s90.japaneseWord, "まもなく");
  assert.equal(s90.percent, 91);

  const sReady = selectJapaneseLoaderStage(100, true);
  assert.equal(sReady.japaneseWord, "ひらく");
  assert.equal(sReady.percent, 100);
  assert.equal(sReady.isReady, true);
});

test("stepSmoothPortalKinematics glides exponentially toward target and settles deterministically", () => {
  const a = stepSmoothPortalKinematics({ current: 0, target: 1, dtSeconds: 1 / 60 });
  assert.ok(a.nextProgress > 0.08 && a.nextProgress < 0.25);
  assert.equal(a.settled, false);

  const b = stepSmoothPortalKinematics({ current: 0.9995, target: 1, dtSeconds: 1 / 60 });
  assert.equal(b.nextProgress, 1);
  assert.equal(b.settled, true);
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

  const s2 = stepPortalFromWheel({
    currentProgress: 0.94,
    expanded: false,
    deltaY: 120,
    windowScrollY: 0,
  });
  assert.equal(s2.consumed, true);
  assert.equal(s2.expanded, true);
  assert.equal(s2.nextProgress, 1);

  const s3 = stepPortalFromWheel({
    currentProgress: 1,
    expanded: true,
    deltaY: 120,
    windowScrollY: 200,
  });
  assert.equal(s3.consumed, false);
  assert.equal(s3.expanded, true);

  const s4 = stepPortalFromWheel({
    currentProgress: 1,
    expanded: true,
    deltaY: -120,
    windowScrollY: 420,
  });
  assert.equal(s4.consumed, false);
  assert.equal(s4.expanded, true);

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

test("computeXrayPointerLocal clamps pointer coordinates cleanly within host box", () => {
  const rect = { left: 100, top: 50, width: 300, height: 80 };
  assert.deepEqual(computeXrayPointerLocal(175.4, 90.2, rect), { x: 75.4, y: 40.2 });
  assert.deepEqual(computeXrayPointerLocal(40, 10, rect), { x: 0, y: 0 });
  assert.deepEqual(computeXrayPointerLocal(600, 300, rect), { x: 300, y: 80 });
});
