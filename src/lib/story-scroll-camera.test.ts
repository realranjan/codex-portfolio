import test from "node:test";
import assert from "node:assert/strict";
import {
  computeContinuousStrokeState,
  computeStoryCardCamera,
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
