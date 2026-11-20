import test from "node:test";
import assert from "node:assert/strict";
import {
  buildJourneyRouteGeometry,
  buildJourneySchedule,
  computeJourneyCameraState,
  getJourneyMilestoneAnchorProgress,
} from "./journey-camera";

test("Stage A enters with headline mask reveal and settles into milestone 01", () => {
  const s0 = computeJourneyCameraState(0, 3, "desktop");
  const sMidEnter = computeJourneyCameraState(0.045, 3, "desktop");
  const sAnchor0 = computeJourneyCameraState(
    getJourneyMilestoneAnchorProgress(0, 3),
    3,
    "desktop"
  );

  assert.equal(s0.phase, "enter");
  assert.equal(s0.headlineReveal, 0);
  assert.ok(sMidEnter.headlineReveal > 0.2 && sMidEnter.headlineReveal < 1);
  assert.equal(sAnchor0.phase, "milestone");
  assert.equal(sAnchor0.headlineReveal, 1);
  assert.equal(sAnchor0.activeIndex, 0);
  assert.equal(sAnchor0.settleStrength, 1);
  assert.equal(sAnchor0.exhibits[0].rotateYDeg, 0);
  assert.equal(sAnchor0.exhibits[0].localZPx, 0);
  assert.equal(sAnchor0.exhibits[0].scale, 1);
  assert.equal(sAnchor0.exhibits[0].opacity, 1);
  // Upcoming company (Haegl Tech) sits partially visible behind Exhibit 01
  assert.ok(sAnchor0.exhibits[1].localZPx < 0);
  assert.ok(sAnchor0.exhibits[1].opacity > 0.45 && sAnchor0.exhibits[1].opacity < 0.7);
});

test("Each company milestone has a zero-drift reading plateau", () => {
  const schedule = buildJourneySchedule(3);
  for (const plateau of schedule.plateaus) {
    const startState = computeJourneyCameraState(plateau.start + 0.002, 3, "desktop");
    const midState = computeJourneyCameraState(plateau.midpoint, 3, "desktop");
    const endState = computeJourneyCameraState(plateau.end - 0.002, 3, "desktop");

    assert.equal(startState.phase, "milestone");
    assert.equal(midState.phase, "milestone");
    assert.equal(endState.phase, "milestone");
    assert.equal(startState.cameraFocus, plateau.index);
    assert.equal(midState.cameraFocus, plateau.index);
    assert.equal(endState.cameraFocus, plateau.index);
    assert.equal(startState.cameraTranslateXPx, endState.cameraTranslateXPx);
    assert.equal(midState.exhibits[plateau.index].isSettled, true);
  }
});

test("Stage C moves camera horizontally so passed exhibit moves to foreground edge and next emerges from behind", () => {
  const m0 = computeJourneyCameraState(getJourneyMilestoneAnchorProgress(0, 3), 3, "desktop");
  const m1 = computeJourneyCameraState(getJourneyMilestoneAnchorProgress(1, 3), 3, "desktop");
  const m2 = computeJourneyCameraState(getJourneyMilestoneAnchorProgress(2, 3), 3, "desktop");

  // Shared camera world pans horizontally leftward as we move 0 -> 1 -> 2
  assert.ok(m0.cameraTranslateXPx > m1.cameraTranslateXPx);
  assert.ok(m1.cameraTranslateXPx > m2.cameraTranslateXPx);

  // At milestone 02 (Haegl Tech): Exhibit 01 shifts to foreground left edge; Exhibit 02 is flat center; Exhibit 03 peeks behind right
  assert.equal(m1.activeIndex, 1);
  assert.ok(m1.exhibits[0].relativeOffset < 0);
  assert.ok(m1.exhibits[0].localZPx > 0, "passed exhibit shifts slightly into foreground edge");
  assert.ok(m1.exhibits[0].opacity > 0.3 && m1.exhibits[0].opacity < 0.6);

  assert.equal(m1.exhibits[1].rotateYDeg, 0);
  assert.equal(m1.exhibits[1].localZPx, 0);
  assert.equal(m1.exhibits[1].scale, 1);

  assert.ok(m1.exhibits[2].localZPx < 0, "upcoming exhibit waits behind active exhibit");
  assert.ok(m1.exhibits[2].scale < 1);
});

test("Motion comfort invariants hold across every scroll step and reverse deterministically", () => {
  let prevFocus = -1;
  for (let i = 0; i <= 100; i++) {
    const p = i / 100;
    const state = computeJourneyCameraState(p, 3, "desktop");
    assert.ok(
      state.cameraFocus >= prevFocus - 1e-6,
      `cameraFocus must be monotonic forward at p=${p}`
    );
    prevFocus = state.cameraFocus;

    for (const ex of state.exhibits) {
      assert.ok(
        Math.abs(ex.rotateYDeg) <= 3.5,
        `exhibit rotation must remain under 4deg, got ${ex.rotateYDeg} at p=${p}`
      );
      assert.ok(
        ex.scale >= 0.72 && ex.scale <= 1.05,
        `exhibit scale must stay restrained, got ${ex.scale} at p=${p}`
      );
    }
  }

  // Exact deterministic reversibility
  const forward = computeJourneyCameraState(0.48, 3, "desktop");
  const end = computeJourneyCameraState(1.0, 3, "desktop");
  const backward = computeJourneyCameraState(0.48, 3, "desktop");
  assert.notEqual(forward.activeIndex, end.activeIndex);
  assert.deepEqual(backward, forward);
});

test("Stage F pulls back camera and straightens the curved Burgundy path into a horizontal line", () => {
  const beforeExit = computeJourneyCameraState(0.84, 3, "desktop");
  const atEnd = computeJourneyCameraState(1.0, 3, "desktop");

  assert.equal(beforeExit.pathFlattenProgress, 0);
  assert.equal(atEnd.phase, "leave");
  assert.equal(atEnd.pathFlattenProgress, 1);
  assert.ok(atEnd.cameraTranslateZPx < 0, "camera pulls back subtly on exit");
  assert.ok(atEnd.cameraScale < 1 && atEnd.cameraScale >= 0.94);

  const curved = buildJourneyRouteGeometry(3, 0, 1, 0.5);
  const flat = buildJourneyRouteGeometry(3, 1, 2, 1.0);

  // Curved path has varying Y across nodes; flattened path has every node right on horizonY
  const curvedYs = new Set(curved.nodes.map((n) => n.y));
  assert.ok(curvedYs.size > 1, "curved route should undulate gently before exit");

  for (const node of flat.nodes) {
    assert.equal(
      node.y,
      flat.horizonY,
      `flattened Stage F path node ${node.index} must sit cleanly on horizonY`
    );
  }
});

test("Supports tablet reduced depth and scales automatically when adding more companies", () => {
  const desktop = computeJourneyCameraState(0.16, 3, "desktop");
  const tablet = computeJourneyCameraState(0.16, 3, "tablet");

  assert.ok(tablet.stridePx < desktop.stridePx, "tablet uses smaller camera travel");
  assert.ok(
    Math.abs(tablet.exhibits[1].localZPx) < Math.abs(desktop.exhibits[1].localZPx),
    "tablet uses reduced Z-depth"
  );
  assert.ok(
    Math.abs(tablet.exhibits[1].rotateYDeg) < Math.abs(desktop.exhibits[1].rotateYDeg),
    "tablet uses gentler perspective rotation"
  );

  // Extensibility check: adding 4th or 5th company requires zero architecture changes
  const fiveCompanies = computeJourneyCameraState(
    getJourneyMilestoneAnchorProgress(4, 5),
    5,
    "desktop"
  );
  assert.equal(fiveCompanies.exhibits.length, 5);
  assert.equal(fiveCompanies.activeIndex, 4);
  assert.equal(fiveCompanies.exhibits[4].isSettled, true);
  assert.equal(fiveCompanies.exhibits[4].rotateYDeg, 0);
});
