import test from "node:test";
import assert from "node:assert/strict";
import {
  computeChapterHingeTransform,
  computeChapterParallaxLayerState,
  computeContinuousStrokeState,
  computeStoryCardCamera,
  computeWordRevealState,
} from "./story-scroll-camera";

test("computeStoryCardCamera keeps first section level and rotates subsequent sections from 30deg to 0deg", () => {
  const firstStart = computeStoryCardCamera(0, 0, 0, 0);
  assert.equal(firstStart.rotationDeg, 0);
  assert.equal(firstStart.cameraScale, 1);
  assert.equal(firstStart.recedeVeilOpacity, 0);

  const secondStart = computeStoryCardCamera(1, 0, 0, 0);
  assert.equal(secondStart.rotationDeg, 30);

  const secondMid = computeStoryCardCamera(1, 0.5, 0, 0.5);
  assert.equal(secondMid.rotationDeg, 15);
  assert.equal(secondMid.artworkParallaxY, 0);
  assert.equal(secondMid.headlineParallaxY, 0);

  const secondSettled = computeStoryCardCamera(1, 1, 0, 0.5);
  assert.equal(secondSettled.rotationDeg, 0);
});

test("computeStoryCardCamera applies cinematic camera recession as pinned section exits behind incoming card", () => {
  const neutral = computeStoryCardCamera(1, 1, 0, 0.5);
  const receding = computeStoryCardCamera(1, 1, 1, 1);

  assert.equal(neutral.cameraScale, 1);
  assert.equal(neutral.cameraY, 0);
  assert.equal(neutral.cameraRotateX, 0);

  assert.ok(receding.cameraScale < 0.95, "Receding card should scale down subtly in camera space");
  assert.ok(receding.cameraY < -20, "Receding card should lift smoothly upward");
  assert.ok(receding.cameraRotateX > 2, "Receding card should pitch subtly in 3D perspective");
  assert.ok(receding.recedeVeilOpacity > 0.3, "Receding card should dim slightly behind next sheet");
});

test("computeStoryCardCamera maintains ordered multi-plane parallax across transit", () => {
  const early = computeStoryCardCamera(2, 1, 0, 0);
  const late = computeStoryCardCamera(2, 1, 0, 1);

  assert.ok(early.artworkParallaxY > 0);
  assert.ok(late.artworkParallaxY < 0);
  assert.ok(
    Math.abs(early.artworkParallaxY) > Math.abs(early.headlineParallaxY) &&
      Math.abs(early.headlineParallaxY) > Math.abs(early.detailParallaxY),
    "Background artwork should parallax faster than headline and foreground detail"
  );
});

test("computeContinuousStrokeState tracks unbroken stroke fill and chapter node transitions", () => {
  const start = computeContinuousStrokeState(0, 5);
  assert.equal(start.strokeProgress, 0);
  assert.equal(start.activeIndex, 0);
  assert.deepEqual(
    start.nodes.map((n) => n.status),
    ["active", "upcoming", "upcoming", "upcoming", "upcoming"]
  );

  const middle = computeContinuousStrokeState(0.5, 5);
  assert.equal(middle.strokeProgress, 0.5);
  assert.equal(middle.activeIndex, 2);
  assert.deepEqual(
    middle.nodes.map((n) => n.status),
    ["passed", "passed", "active", "upcoming", "upcoming"]
  );

  const end = computeContinuousStrokeState(1.2, 5);
  assert.equal(end.strokeProgress, 1);
  assert.equal(end.activeIndex, 4);
  assert.deepEqual(
    end.nodes.map((n) => n.status),
    ["passed", "passed", "passed", "passed", "active"]
  );
});

test("computeWordRevealState illuminates words progressively from muted ink to full opacity", () => {
  const total = 20;
  const firstAtStart = computeWordRevealState(0, 0, total);
  const lastAtStart = computeWordRevealState(0, total - 1, total);
  assert.equal(firstAtStart.opacity, 0.2);
  assert.equal(firstAtStart.isLit, false);
  assert.equal(lastAtStart.opacity, 0.2);

  const firstMid = computeWordRevealState(0.45, 0, total);
  const midWord = computeWordRevealState(0.45, 10, total);
  const lastMid = computeWordRevealState(0.45, total - 1, total);
  assert.equal(firstMid.opacity, 1);
  assert.equal(firstMid.isLit, true);
  assert.ok(midWord.opacity > lastMid.opacity, "Earlier words must illuminate ahead of later words");

  const lastAtEnd = computeWordRevealState(1, total - 1, total);
  assert.equal(lastAtEnd.opacity, 1);
  assert.equal(lastAtEnd.yPx, 0);
  assert.equal(lastAtEnd.isLit, true);
});

test("computeChapterHingeTransform swings cleanly from angled entry to settled flat state", () => {
  const leftEntry = computeChapterHingeTransform(0, 11, "left");
  assert.equal(leftEntry.rotationDeg, 11);
  assert.equal(leftEntry.translateYPx, 34);
  assert.equal(leftEntry.isSettled, false);

  const rightEntry = computeChapterHingeTransform(0, 11, "right");
  assert.equal(rightEntry.rotationDeg, -11);

  const mid = computeChapterHingeTransform(0.5, 11, "left");
  assert.ok(mid.rotationDeg > 0 && mid.rotationDeg < 6, "Eased hinge should unwind smoothly");

  const settled = computeChapterHingeTransform(1, 11, "left");
  assert.equal(settled.rotationDeg, 0);
  assert.equal(settled.translateYPx, 0);
  assert.equal(settled.scale, 1);
  assert.equal(settled.isSettled, true);
});

test("computeChapterParallaxLayerState surges upward on enter, rests neutral, and lags with depth veil on exit", () => {
  const enteringLeft = computeChapterParallaxLayerState(0, 0, 9, "left");
  assert.equal(enteringLeft.isNeutral, false);
  assert.equal(enteringLeft.rotationDeg, 9);
  assert.ok(enteringLeft.translateYPx >= 88, "Entering sheet should start below and surge up");
  assert.ok(enteringLeft.scale < 0.98, "Entering sheet should scale slightly up as it arrives");
  assert.ok(enteringLeft.shadowOpacity > 0.25, "Entering sheet should cast an upper overlap shadow");
  assert.equal(enteringLeft.recedeVeilOpacity, 0);

  const enteringRight = computeChapterParallaxLayerState(0, 0, 9, "right");
  assert.equal(enteringRight.rotationDeg, -9);

  const settled = computeChapterParallaxLayerState(1, 0, 9, "left");
  assert.equal(settled.isNeutral, true);
  assert.equal(settled.rotationDeg, 0);
  assert.equal(settled.translateYPx, 0);
  assert.equal(settled.scale, 1);
  assert.equal(settled.shadowOpacity, 0);
  assert.equal(settled.recedeVeilOpacity, 0);

  const receding = computeChapterParallaxLayerState(1, 1, 9, "left");
  assert.equal(receding.isNeutral, false);
  assert.equal(receding.rotationDeg, 0);
  assert.ok(receding.translateYPx > 100, "Outgoing sheet should lag downward behind incoming sheet");
  assert.ok(receding.scale < 0.96, "Outgoing sheet should recede softly in scale");
  assert.ok(receding.recedeVeilOpacity > 0.25, "Outgoing sheet should dim under recession veil");
});


