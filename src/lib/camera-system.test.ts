import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCameraStopDwell,
  computeExperienceCameraState,
  computeParallaxOffsetPx,
  computeProjectsCameraState,
  getProjectCameraAnchorProgress,
} from "./camera-system";
import type { CurvedWaypoint } from "./journey-path";

const SAMPLE_WAYPOINTS: readonly CurvedWaypoint[] = [
  { id: "c1", stop: 0, x: 130, y: 470 },
  { id: "c2", stop: 0.3333, x: 430, y: 200 },
  { id: "c3", stop: 0.6667, x: 760, y: 420 },
  { id: "c4", stop: 1, x: 1070, y: 175 },
];

test("computeParallaxOffsetPx stays bounded and handles clamping cleanly", () => {
  assert.equal(computeParallaxOffsetPx(0, 20), 0);
  assert.equal(computeParallaxOffsetPx(-1, 20), 0);
  assert.equal(computeParallaxOffsetPx(1, 20), -20);
  assert.equal(computeParallaxOffsetPx(2, 20), -20);
  assert.equal(computeParallaxOffsetPx(0.5, 20), -10);
});

test("applyCameraStopDwell is strictly monotonic and settles at each stop", () => {
  let prev = -1;
  for (let i = 0; i <= 40; i++) {
    const p = i / 40;
    const v = applyCameraStopDwell(p, 4);
    assert.ok(v > prev, `dwell curve must remain strictly increasing at p=${p}`);
    prev = v;
  }
  assert.equal(applyCameraStopDwell(0, 4), 0);
  assert.equal(applyCameraStopDwell(1, 4), 1);
  // Exact stop anchors map cleanly to themselves
  assert.ok(Math.abs(applyCameraStopDwell(1 / 3, 4) - 1 / 3) < 1e-6);
  assert.ok(Math.abs(applyCameraStopDwell(2 / 3, 4) - 2 / 3) < 1e-6);
});

test("computeProjectsCameraState progresses cleanly across Stages 01..04 with modest depth and <=4deg rotation", () => {
  const s0 = computeProjectsCameraState(getProjectCameraAnchorProgress(0, 4), 4);
  const s1 = computeProjectsCameraState(getProjectCameraAnchorProgress(1, 4), 4);
  const s2 = computeProjectsCameraState(getProjectCameraAnchorProgress(2, 4), 4);
  const s3 = computeProjectsCameraState(getProjectCameraAnchorProgress(3, 4), 4);

  assert.equal(s0.activeIndex, 0);
  assert.equal(s0.panels[0].isActive, true);
  assert.equal(s0.panels[0].translateXPct, 0);
  assert.equal(s0.panels[0].scale, 1);
  assert.equal(s0.panels[0].rotateYDeg, 0);
  assert.ok(s0.panels[1].opacity > 0.4, "Project 02 should remain partially visible at depth");

  assert.equal(s1.activeIndex, 1);
  assert.ok(s1.panels[0].translateXPct < 0, "Project 01 moves to left side when Project 02 focuses");
  assert.equal(s1.panels[1].translateXPct, 0);
  assert.equal(s1.panels[1].scale, 1);

  assert.equal(s2.activeIndex, 2);
  assert.equal(s3.activeIndex, 3);
  assert.equal(s3.panels[3].translateXPct, 0);

  // Enforce motion comfort bounds across every progress sample
  for (let i = 0; i <= 40; i++) {
    const st = computeProjectsCameraState(i / 40, 4);
    for (const panel of st.panels) {
      assert.ok(
        Math.abs(panel.rotateYDeg) <= 3.6,
        `panel rotation must stay under 4deg, got ${panel.rotateYDeg}`
      );
      assert.ok(
        panel.scale >= 0.8 && panel.scale <= 1.0,
        `panel scale must stay modest, got ${panel.scale}`
      );
    }
  }
});

test("computeProjectsCameraState reverses deterministically on backward scroll", () => {
  const forward = computeProjectsCameraState(0.5, 4);
  const end = computeProjectsCameraState(1.0, 4);
  const reversed = computeProjectsCameraState(0.5, 4);

  assert.notEqual(forward.activeIndex, end.activeIndex);
  assert.deepEqual(reversed, forward);
});

test("computeExperienceCameraState tracks airplane sideways and gently diagonally with slower background parallax", () => {
  const start = computeExperienceCameraState(SAMPLE_WAYPOINTS, 0);
  const stop2 = computeExperienceCameraState(SAMPLE_WAYPOINTS, 1 / 3);
  const stop3 = computeExperienceCameraState(SAMPLE_WAYPOINTS, 2 / 3);
  const end = computeExperienceCameraState(SAMPLE_WAYPOINTS, 1);

  assert.equal(start.flight.activeIndex, 0);
  assert.equal(stop2.flight.activeIndex, 1);
  assert.equal(stop3.flight.activeIndex, 2);
  assert.equal(end.flight.activeIndex, 3);

  // As airplane flies left -> right, camera composition glides smoothly right -> left
  assert.ok(start.cameraPanX > stop2.cameraPanX);
  assert.ok(stop2.cameraPanX > stop3.cameraPanX);
  assert.ok(stop3.cameraPanX > end.cameraPanX);

  // Diagonal pan tracks vertical elevation changes modestly
  assert.notEqual(start.cameraPanY, stop2.cameraPanY);
  assert.ok(Math.abs(start.cameraPanY) <= 30 && Math.abs(end.cameraPanY) <= 30);

  // Background parallax moves in same direction but slower than route plane
  assert.ok(Math.abs(end.bgParallaxX) < Math.abs(end.cameraPanX));
  assert.equal(Math.sign(end.bgParallaxX), Math.sign(end.cameraPanX));

  // Deterministic reverse
  assert.deepEqual(computeExperienceCameraState(SAMPLE_WAYPOINTS, 1 / 3), stop2);
});
