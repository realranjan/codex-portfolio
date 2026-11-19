import test from "node:test";
import assert from "node:assert/strict";
import { computeFooterTouchState } from "./footer-touch";

test("Phase A (0-25%) holds a wide initial gap with zero contact effects", () => {
  const start = computeFooterTouchState(0);
  const midEntrance = computeFooterTouchState(0.2);

  assert.equal(start.phase, "entrance");
  assert.equal(start.gapRatio, 1);
  assert.equal(start.contactStrength, 0);
  assert.equal(start.rippleOpacity, 0);
  assert.equal(start.blossomOpacity, 0);
  assert.equal(start.brushstrokeProgress, 0);
  assert.ok(start.leftPawTranslateXPct < -20);
  assert.ok(start.rightPawTranslateXPct > 20);
  assert.equal(midEntrance.phase, "entrance");
  assert.ok(midEntrance.gapRatio > 0.9);
});

test("Phase B (25-60%) moves paws symmetrically toward center while keeping bodies anchored", () => {
  const early = computeFooterTouchState(0.26);
  const late = computeFooterTouchState(0.58);

  assert.equal(early.phase, "approach");
  assert.equal(late.phase, "approach");
  assert.ok(late.gapRatio < early.gapRatio);
  // Symmetric paw reach
  assert.equal(late.leftPawTranslateXPct, -late.rightPawTranslateXPct);
  assert.equal(late.leftPawRotateDeg, -late.rightPawRotateDeg);
  // Bodies remain mostly stationary (<= 6px subtle lean)
  assert.ok(Math.abs(late.leftBodyShiftPx) <= 6);
  assert.ok(Math.abs(late.rightBodyShiftPx) <= 6);
  assert.equal(late.contactStrength, 0);
});

test("Phase C (60-85%) creates a slow anticipation gap with completely still background", () => {
  const enterC = computeFooterTouchState(0.61);
  const endC = computeFooterTouchState(0.84);

  assert.equal(enterC.phase, "anticipation");
  assert.equal(endC.phase, "anticipation");
  assert.equal(enterC.backgroundStill, true);
  assert.equal(endC.backgroundStill, true);
  assert.ok(endC.gapRatio > 0.05 && endC.gapRatio < 0.25);
  assert.equal(endC.contactStrength, 0);
});

test("Phase D (85-100%) completes paw touch with ripple, brushstroke, blossom, and full CTA emphasis", () => {
  const touching = computeFooterTouchState(1);

  assert.equal(touching.phase, "contact");
  assert.equal(touching.gapRatio, 0);
  assert.equal(touching.leftPawTranslateXPct, 0);
  assert.equal(touching.rightPawTranslateXPct, 0);
  assert.equal(touching.leftPawRotateDeg, 0);
  assert.equal(touching.rightPawRotateDeg, 0);
  assert.equal(touching.contactStrength, 1);
  assert.equal(touching.brushstrokeProgress, 1);
  assert.ok(touching.blossomOpacity > 0.9);
  assert.equal(touching.ctaEmphasis, 1);
});

test("Reverse scrolling and out-of-range inputs are deterministic and cleanly clamped", () => {
  const forward = computeFooterTouchState(0.72);
  const reversed = computeFooterTouchState(0.72);
  assert.deepEqual(forward, reversed);

  assert.deepEqual(computeFooterTouchState(-0.5), computeFooterTouchState(0));
  assert.deepEqual(computeFooterTouchState(2.4), computeFooterTouchState(1));
  assert.deepEqual(computeFooterTouchState(Number.NaN), computeFooterTouchState(0));
});
