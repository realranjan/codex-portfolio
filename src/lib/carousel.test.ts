import test from "node:test";
import assert from "node:assert/strict";
import {
  computeSpatialSlideState,
  resolveDragStep,
  signedCircularOffset,
  wrapIndex,
} from "./carousel";

test("wrapIndex handles negative and overflowing indices", () => {
  assert.equal(wrapIndex(-1, 4), 3);
  assert.equal(wrapIndex(4, 4), 0);
  assert.equal(wrapIndex(5, 4), 1);
});

test("signedCircularOffset picks shortest signed direction", () => {
  assert.equal(signedCircularOffset(0, 0, 4), 0);
  assert.equal(signedCircularOffset(1, 0, 4), 1);
  assert.equal(signedCircularOffset(3, 0, 4), -1);
  assert.equal(signedCircularOffset(0, 3, 4), 1);
});

test("computeSpatialSlideState emphasizes active slide and keeps neighbors visible", () => {
  const active = computeSpatialSlideState(1, 1, 4);
  assert.equal(active.isActive, true);
  assert.equal(active.scale, 1);
  assert.equal(active.opacity, 1);
  assert.equal(active.rotateYDeg, 0);

  const rightNeighbor = computeSpatialSlideState(2, 1, 4);
  assert.equal(rightNeighbor.isActive, false);
  assert.ok(rightNeighbor.scale < 1 && rightNeighbor.scale >= 0.76);
  assert.ok(rightNeighbor.opacity > 0.3 && rightNeighbor.opacity < 1);
  assert.ok(rightNeighbor.zIndex < active.zIndex);
});

test("resolveDragStep respects swipe direction and deadzone threshold", () => {
  assert.equal(resolveDragStep(-80, 56), 1);
  assert.equal(resolveDragStep(80, 56), -1);
  assert.equal(resolveDragStep(20, 56), 0);
  assert.equal(resolveDragStep(-20, 56), 0);
});
