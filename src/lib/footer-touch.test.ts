import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeFooterTouchState } from "./footer-touch";

describe("computeFooterTouchState (whole-cat Michelangelo glide)", () => {
  it("Phase A (0-25%) holds a wide initial gap with zero contact effects", () => {
    const start = computeFooterTouchState(0);
    const endA = computeFooterTouchState(0.24);

    assert.equal(start.phase, "entrance");
    assert.equal(endA.phase, "entrance");
    assert.equal(start.gapRatio, 1);
    assert.ok(start.leftCatTranslateXPct < -20, "left cat starts well back from center");
    assert.ok(start.rightCatTranslateXPct > 20, "right cat starts well back from center");
    assert.equal(start.contactStrength, 0);
    assert.equal(endA.contactStrength, 0);
    assert.equal(start.rippleOpacity, 0);
    assert.equal(start.blossomOpacity, 0);
    assert.equal(start.backgroundStill, false);
  });

  it("Phase B (25-60%) glides both entire cats symmetrically toward center", () => {
    const startB = computeFooterTouchState(0.26);
    const midB = computeFooterTouchState(0.45);
    const endB = computeFooterTouchState(0.59);

    assert.equal(startB.phase, "approach");
    assert.equal(midB.phase, "approach");
    assert.equal(endB.phase, "approach");

    // Symmetrical mirrored inward glide
    assert.equal(midB.leftCatTranslateXPct, -midB.rightCatTranslateXPct);
    assert.equal(midB.leftCatRotateDeg, -midB.rightCatRotateDeg);
    assert.equal(midB.leftCatTranslateYPx, midB.rightCatTranslateYPx);

    // Monotonic gap closure across Phase B
    assert.ok(startB.gapRatio > midB.gapRatio);
    assert.ok(midB.gapRatio > endB.gapRatio);
    assert.ok(endB.gapRatio < 0.25, "closes most of the gap during approach");
    assert.equal(endB.contactStrength, 0);
  });

  it("Phase C (60-85%) slows into an anticipation crawl with still background", () => {
    const startC = computeFooterTouchState(0.61);
    const endC = computeFooterTouchState(0.84);

    assert.equal(startC.phase, "anticipation");
    assert.equal(endC.phase, "anticipation");
    assert.equal(startC.backgroundStill, true);
    assert.equal(endC.backgroundStill, true);

    // Rate of gap closure in anticipation is much slower than during approach
    const approachDelta =
      computeFooterTouchState(0.55).gapRatio - computeFooterTouchState(0.35).gapRatio;
    const anticipationDelta = endC.gapRatio - startC.gapRatio;
    assert.ok(
      Math.abs(anticipationDelta) < Math.abs(approachDelta),
      "anticipation crawl must move noticeably slower than approach"
    );
    assert.ok(endC.gapRatio > 0 && endC.gapRatio < 0.1, "tiny visible gap remains before 85%");
    assert.equal(endC.contactStrength, 0);
  });

  it("Phase D (85-100%) brings both cats to exact contact with subtle poetic effects", () => {
    const midD = computeFooterTouchState(0.92);
    const endD = computeFooterTouchState(1);

    assert.equal(midD.phase, "contact");
    assert.equal(endD.phase, "contact");
    assert.equal(endD.gapRatio, 0);
    assert.equal(endD.leftCatTranslateXPct, 0);
    assert.equal(endD.rightCatTranslateXPct, 0);
    assert.equal(endD.leftCatTranslateYPx, 0);
    assert.equal(endD.rightCatTranslateYPx, 0);
    assert.equal(endD.leftCatRotateDeg, 0);
    assert.equal(endD.rightCatRotateDeg, 0);

    assert.ok(midD.rippleOpacity > 0, "subtle ink ripple appears during contact");
    assert.equal(endD.brushstrokeProgress, 1);
    assert.ok(endD.blossomOpacity > 0.85);
    assert.equal(endD.ctaEmphasis, 1);
  });

  it("Reverse scrolling and out-of-range inputs are deterministic and cleanly clamped", () => {
    assert.deepEqual(computeFooterTouchState(-0.4), computeFooterTouchState(0));
    assert.deepEqual(computeFooterTouchState(1.8), computeFooterTouchState(1));
    assert.deepEqual(computeFooterTouchState(Number.NaN), computeFooterTouchState(0));

    const forward = computeFooterTouchState(0.52);
    const reversed = computeFooterTouchState(0.52);
    assert.deepEqual(forward, reversed);
  });
});
