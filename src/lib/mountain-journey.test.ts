import test from "node:test";
import assert from "node:assert/strict";
import {
  JOURNEY_MILESTONES,
  MOUNTAIN_TRAIL_POINTS,
} from "../data/experience-journey";
import {
  applyJourneyMilestoneDwell,
  buildMountainTrailSvgPath,
  classifyJourneyScenePhase,
  computeMountainJourneyPose,
  evaluateMountainSpline,
  stepTravelerAnimation,
} from "./mountain-journey";

test("applyJourneyMilestoneDwell stays strictly monotonic and pinned at endpoints", () => {
  const stops = JOURNEY_MILESTONES.map((m) => m.trailStop);
  assert.equal(applyJourneyMilestoneDwell(0, stops), 0);
  assert.equal(applyJourneyMilestoneDwell(1, stops), 1);

  let prev = -1;
  for (let i = 0; i <= 100; i++) {
    const p = i / 100;
    const eased = applyJourneyMilestoneDwell(p, stops);
    assert.ok(eased > prev, `Expected strictly increasing dwell curve at p=${p}`);
    prev = eased;
  }
});

test("evaluateMountainSpline and buildMountainTrailSvgPath trace continuous winding route", () => {
  const start = evaluateMountainSpline(MOUNTAIN_TRAIL_POINTS, 0);
  const end = evaluateMountainSpline(MOUNTAIN_TRAIL_POINTS, 1);

  assert.equal(start.x, MOUNTAIN_TRAIL_POINTS[0].x);
  assert.equal(start.y, MOUNTAIN_TRAIL_POINTS[0].y);
  assert.equal(end.x, MOUNTAIN_TRAIL_POINTS[MOUNTAIN_TRAIL_POINTS.length - 1].x);
  assert.ok(end.x > start.x + 2000, "Trail should travel substantially across panoramic world");

  const svgPath = buildMountainTrailSvgPath(MOUNTAIN_TRAIL_POINTS, 80);
  assert.ok(svgPath.startsWith("M "), "SVG path must start with M command");
  assert.ok(svgPath.includes(" L "), "SVG path must include subdivided line segments");
});

test("computeMountainJourneyPose maintains strict parallax depth ordering across all 6 visual planes", () => {
  const startPose = computeMountainJourneyPose(
    0,
    MOUNTAIN_TRAIL_POINTS,
    JOURNEY_MILESTONES
  );
  const midPose = computeMountainJourneyPose(
    0.54,
    MOUNTAIN_TRAIL_POINTS,
    JOURNEY_MILESTONES
  );
  const endPose = computeMountainJourneyPose(
    1,
    MOUNTAIN_TRAIL_POINTS,
    JOURNEY_MILESTONES
  );

  // Opening intro headline is fully visible at trailhead and clears before Stop 01
  assert.equal(startPose.introOpacity, 1);
  assert.equal(midPose.introOpacity, 0);

  // Horizontal parallax magnitudes must increase strictly from far background to foreground pines
  const farMag = Math.abs(midPose.layers.farMountains.xPx);
  const mistMag = Math.abs(midPose.layers.mistBand.xPx);
  const midMag = Math.abs(midPose.layers.midRidges.xPx);
  const occludeMag = Math.abs(midPose.layers.occludingRidge.xPx);
  const fgMag = Math.abs(midPose.layers.fgPines.xPx);

  assert.ok(farMag > 0, "Far mountains should shift gently");
  assert.ok(farMag < mistMag, "Mist should move faster than distant mountains");
  assert.ok(mistMag < midMag, "Mid ridges should move faster than mist");
  assert.ok(midMag < occludeMag, "Occluding ridge should move faster than mid ridges");
  assert.ok(occludeMag < fgMag, "Foreground pines should move fastest");

  // Scene 06 ending pulls camera back cleanly (scale < mid-pass scale)
  assert.ok(
    endPose.cameraScale < midPose.cameraScale,
    "Ending camera should gently pull back to reveal the route traveled"
  );
});

test("computeMountainJourneyPose reveals milestones sequentially behind mountain ridges and reverses deterministically", () => {
  const atStop1 = computeMountainJourneyPose(
    JOURNEY_MILESTONES[0].trailStop,
    MOUNTAIN_TRAIL_POINTS,
    JOURNEY_MILESTONES
  );
  const atStop2 = computeMountainJourneyPose(
    JOURNEY_MILESTONES[1].trailStop,
    MOUNTAIN_TRAIL_POINTS,
    JOURNEY_MILESTONES
  );
  const atStop3 = computeMountainJourneyPose(
    JOURNEY_MILESTONES[2].trailStop,
    MOUNTAIN_TRAIL_POINTS,
    JOURNEY_MILESTONES
  );

  // At Stop 01 (iMerit), Stop 01 is visible while Stop 02 and Stop 03 remain concealed behind ridges
  assert.equal(atStop1.activeMilestoneId, "imerit");
  assert.equal(atStop1.milestoneReveal[0], 1);
  assert.equal(atStop1.milestoneReveal[1], 0);
  assert.equal(atStop1.milestoneReveal[2], 0);

  // At Stop 02 (Haegl Tech), Stop 02 has emerged while Stop 03 is still concealed
  assert.equal(atStop2.activeMilestoneId, "haegl-tech");
  assert.equal(atStop2.milestoneReveal[1], 1);
  assert.equal(atStop2.milestoneReveal[2], 0);

  // At Stop 03 (RYVO), Stop 03 is revealed
  assert.equal(atStop3.activeMilestoneId, "ryvo");
  assert.equal(atStop3.milestoneReveal[2], 1);

  // Exact deterministic reversibility
  assert.deepEqual(
    computeMountainJourneyPose(
      JOURNEY_MILESTONES[1].trailStop,
      MOUNTAIN_TRAIL_POINTS,
      JOURNEY_MILESTONES
    ),
    atStop2
  );
});

test("classifyJourneyScenePhase covers all 6 narrative scenes", () => {
  assert.equal(classifyJourneyScenePhase(0.02), "beginning");
  assert.equal(classifyJourneyScenePhase(0.24), "stop-01");
  assert.equal(classifyJourneyScenePhase(0.40), "mountain-bend");
  assert.equal(classifyJourneyScenePhase(0.54), "stop-02");
  assert.equal(classifyJourneyScenePhase(0.81), "stop-03");
  assert.equal(classifyJourneyScenePhase(0.96), "ending");
});

test("stepTravelerAnimation advances 8-frame walk cycle on scroll, flips on reverse, and idles when stationary", () => {
  const forward1 = stepTravelerAnimation({
    prevProgress: 0.1,
    nextProgress: 0.12,
    prevAccumulatedDistance: 0,
    prevFacing: "forward",
  });
  assert.equal(forward1.isMoving, true);
  assert.equal(forward1.facing, "forward");
  assert.ok(forward1.walkFrame >= 0 && forward1.walkFrame < 8);
  assert.ok(forward1.accumulatedDistance > 0);

  // Stationary scroll -> immediately stops walking without changing facing
  const stopped = stepTravelerAnimation({
    prevProgress: 0.12,
    nextProgress: 0.12,
    prevAccumulatedDistance: forward1.accumulatedDistance,
    prevFacing: forward1.facing,
  });
  assert.equal(stopped.isMoving, false);
  assert.equal(stopped.facing, "forward");
  assert.equal(stopped.walkFrame, forward1.walkFrame);

  // Reverse scroll -> flips facing backward and advances walk stride frames
  const backward = stepTravelerAnimation({
    prevProgress: 0.12,
    nextProgress: 0.09,
    prevAccumulatedDistance: stopped.accumulatedDistance,
    prevFacing: stopped.facing,
  });
  assert.equal(backward.isMoving, true);
  assert.equal(backward.facing, "backward");
  assert.ok(backward.accumulatedDistance > stopped.accumulatedDistance);
});

test("computeMountainJourneyPose triggers reachedMilestoneId only when the traveler arrives at a checkpoint", () => {
  const atStart = computeMountainJourneyPose(0, MOUNTAIN_TRAIL_POINTS, JOURNEY_MILESTONES);
  const atStop1 = computeMountainJourneyPose(0.24, MOUNTAIN_TRAIL_POINTS, JOURNEY_MILESTONES);
  const atBend = computeMountainJourneyPose(0.4, MOUNTAIN_TRAIL_POINTS, JOURNEY_MILESTONES);
  const atStop2 = computeMountainJourneyPose(0.54, MOUNTAIN_TRAIL_POINTS, JOURNEY_MILESTONES);
  const atStop3 = computeMountainJourneyPose(0.81, MOUNTAIN_TRAIL_POINTS, JOURNEY_MILESTONES);
  const atEnding = computeMountainJourneyPose(0.98, MOUNTAIN_TRAIL_POINTS, JOURNEY_MILESTONES);

  assert.equal(atStart.reachedMilestoneId, null);
  assert.equal(atStop1.reachedMilestoneId, "imerit");
  assert.equal(atBend.reachedMilestoneId, null);
  assert.equal(atStop2.reachedMilestoneId, "haegl-tech");
  assert.equal(atStop3.reachedMilestoneId, "ryvo");
  assert.equal(atEnding.reachedMilestoneId, null);
});
