import test from "node:test";
import assert from "node:assert/strict";
import {
  cardPose,
  clamp01,
  computeTumbleScrollPosition,
  deckAdvance,
  fallAngle,
  getTumbleProjectAnchorProgress,
  resolveTumbleActiveIndex,
  wrap,
} from "./tumble-deck";

test("clamp01 bounds values into [0, 1]", () => {
  assert.equal(clamp01(-0.5), 0);
  assert.equal(clamp01(0), 0);
  assert.equal(clamp01(0.42), 0.42);
  assert.equal(clamp01(1), 1);
  assert.equal(clamp01(3.14), 1);
});

test("wrap handles positive, zero, and negative virtual indices symmetrically", () => {
  assert.equal(wrap(0, 4), 0);
  assert.equal(wrap(4, 4), 0);
  assert.equal(wrap(5, 4), 1);
  assert.equal(wrap(-1, 4), 3);
  assert.equal(wrap(-5, 4), 3);
  assert.equal(wrap(2, 0), 0);
});

test("fallAngle starts upright, hits floor at 0.78, bounces, and settles at -90", () => {
  assert.equal(fallAngle(0), 0);
  assert.equal(fallAngle(-0.2), 0);

  // Gravity ease-in: midway before landing is well between -90 and 0
  const mid = fallAngle(0.5);
  assert.ok(mid < -15 && mid > -60, `Expected mid-fall angle in (-60, -15), got ${mid}`);

  // Exact landing at t = 0.78
  assert.ok(Math.abs(fallAngle(0.78) - -90) < 1e-6);

  // Bounce kick lifts slightly off the floor (> -90) during (0.78, 1)
  const bounce = fallAngle(0.86);
  assert.ok(bounce > -90 && bounce < -84, `Expected gentle floor kick, got ${bounce}`);

  // Settles flat at t = 1
  assert.ok(Math.abs(fallAngle(1) - -90) < 1e-6);
  assert.ok(Math.abs(fallAngle(1.5) - -90) < 1e-6);
});

test("deckAdvance pauses while front card begins tipping then smoothly advances", () => {
  assert.equal(deckAdvance(0), 0);
  assert.equal(deckAdvance(0.2), 0);
  assert.equal(deckAdvance(0.28), 0);

  const mid = deckAdvance(0.58);
  assert.ok(mid > 0.4 && mid < 0.6, `Expected smooth midpoint advance, got ${mid}`);

  assert.equal(deckAdvance(0.88), 1);
  assert.equal(deckAdvance(0.99), 1);
  assert.equal(deckAdvance(2.2), 2);
});

test("cardPose computes upright stack, falling front card, and floor pile accurately", () => {
  // At pos = 0, card 0 is upright at front (z = 0, angle = 0)
  const front = cardPose(0, 0, 5);
  assert.equal(front.angle, 0);
  assert.equal(front.z, 0);
  assert.equal(front.opacity, 1);
  assert.equal(front.flat, false);

  // Card 2 sits behind at z = -2
  const behind = cardPose(2, 0, 5);
  assert.equal(behind.angle, 0);
  assert.equal(behind.z, -2);
  assert.equal(behind.opacity, 1);

  // At pos = 0.5, card 0 is mid-fall
  const falling = cardPose(0, 0.5, 5);
  assert.ok(falling.angle < -10 && falling.angle > -80);
  assert.equal(falling.flat, false);
  assert.equal(falling.opacity, 1);

  // At pos = 1.5, card 0 lies flat on the floor
  const floorRecent = cardPose(0, 1.5, 5);
  assert.equal(floorRecent.angle, -90);
  assert.equal(floorRecent.flat, true);
  assert.equal(floorRecent.opacity, 1);

  // At pos = 3.2, card 0 is buried past the 2-card floor pile and fades out
  const floorBuried = cardPose(0, 3.2, 5);
  assert.equal(floorBuried.angle, -90);
  assert.equal(floorBuried.flat, true);
  assert.equal(floorBuried.opacity, 0);
});

test("cardPose hides out-of-range virtual indices when loop is false", () => {
  const before = cardPose(-1, 0, 4, { loop: false, cardCount: 4 });
  assert.equal(before.opacity, 0);

  const after = cardPose(4, 2, 4, { loop: false, cardCount: 4 });
  assert.equal(after.opacity, 0);

  const valid = cardPose(3, 2, 4, { loop: false, cardCount: 4 });
  assert.equal(valid.opacity, 1);
});

test("computeTumbleScrollPosition and getTumbleProjectAnchorProgress are consistent", () => {
  const count = 4;

  // Ends clamp to 0 and count - 1
  assert.equal(computeTumbleScrollPosition(0, count), 0);
  assert.equal(computeTumbleScrollPosition(1, count), 3);

  // Every project anchor lands cleanly upright on that exact integer card index
  for (let i = 0; i < count; i++) {
    const anchor = getTumbleProjectAnchorProgress(i, count);
    const pos = computeTumbleScrollPosition(anchor, count);
    assert.ok(
      Math.abs(pos - i) < 1e-6,
      `Anchor for project ${i} (progress=${anchor}) expected pos=${i}, got ${pos}`
    );
    assert.equal(resolveTumbleActiveIndex(pos, count, false), i);
  }

  // Monotonically non-decreasing across [0, 1]
  let prev = -1;
  for (let step = 0; step <= 100; step++) {
    const pos = computeTumbleScrollPosition(step / 100, count);
    assert.ok(pos >= prev - 1e-9, `Non-monotonic jump at step ${step}: ${pos} < ${prev}`);
    prev = pos;
  }
});

test("resolveTumbleActiveIndex switches cleanly past midpoint", () => {
  assert.equal(resolveTumbleActiveIndex(0.0, 4, false), 0);
  assert.equal(resolveTumbleActiveIndex(0.4, 4, false), 0);
  assert.equal(resolveTumbleActiveIndex(0.6, 4, false), 1);
  assert.equal(resolveTumbleActiveIndex(2.7, 4, false), 3);
  assert.equal(resolveTumbleActiveIndex(4.2, 4, false), 3);
  assert.equal(resolveTumbleActiveIndex(-0.8, 4, true), 3);
});
