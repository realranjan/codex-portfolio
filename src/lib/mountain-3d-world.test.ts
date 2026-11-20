import test from "node:test";
import assert from "node:assert/strict";
import { JOURNEY_MILESTONES } from "../data/experience-journey";
import {
  computeLandmark3DPlacements,
  computeMountain3DCameraPose,
  getMountainTerrainHeight,
  sampleTrail3D,
  stepTraveler3DWalk,
} from "./mountain-3d-world";

test("3D mountain trail climbs continuously and terrain heightfield seats the footpath flush", () => {
  const start = sampleTrail3D(0);
  const end = sampleTrail3D(1);

  assert.ok(end.position.z < start.position.z - 80, "Trail should advance deeply into the 3D valley (-Z)");
  assert.ok(end.position.y > start.position.y + 3, "Trail should ascend gently up the mountain pass");

  // Along the entire trail centerline, the carved terrain heightfield must match the trail elevation flush
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const s = sampleTrail3D(t);
    const groundY = getMountainTerrainHeight(s.position.x, s.position.z);
    assert.ok(
      Math.abs(groundY - s.position.y) < 0.08,
      `Expected terrain to sit flush with trail at t=${t}, got delta=${Math.abs(groundY - s.position.y)}`
    );
  }
});

test("flanking 3D mountain ridges rise substantially above the valley floor", () => {
  const valleySample = sampleTrail3D(0.38);
  const centralRidgeHeight = getMountainTerrainHeight(17.0, -8.5);
  const leftMassifHeight = getMountainTerrainHeight(-21.5, -25.0);

  assert.ok(
    centralRidgeHeight > valleySample.position.y + 6,
    `Expected central crag ridge to rise clearly above pass (${centralRidgeHeight})`
  );
  assert.ok(
    leftMassifHeight > valleySample.position.y + 7,
    `Expected flanking massif to rise clearly above pass (${leftMassifHeight})`
  );
});

test("3D follow camera trails behind the traveler cat and looks ahead along the winding trail", () => {
  const startPose = computeMountain3DCameraPose(0, JOURNEY_MILESTONES);
  const stop1Pose = computeMountain3DCameraPose(0.24, JOURNEY_MILESTONES);
  const endPose = computeMountain3DCameraPose(1, JOURNEY_MILESTONES);

  // Camera must be behind the cat (+Z relative to cat since travel moves toward -Z)
  assert.ok(startPose.cameraPosition.z > startPose.catPosition.z + 3);
  assert.ok(stop1Pose.cameraPosition.z > stop1Pose.catPosition.z + 3);
  assert.ok(stop1Pose.cameraPosition.y > stop1Pose.catPosition.y + 1.5);

  // Look-at target is ahead of the cat (-Z)
  assert.ok(stop1Pose.cameraLookAt.z < stop1Pose.catPosition.z);

  // Ending pullback widens FOV and increases camera trail distance
  const midDist = Math.hypot(
    stop1Pose.cameraPosition.x - stop1Pose.catPosition.x,
    stop1Pose.cameraPosition.z - stop1Pose.catPosition.z
  );
  const endDist = Math.hypot(
    endPose.cameraPosition.x - endPose.catPosition.x,
    endPose.cameraPosition.z - endPose.catPosition.z
  );
  assert.ok(endDist > midDist + 2, "Scene 06 ending should pull camera back wider");
  assert.ok(endPose.cameraFov > stop1Pose.cameraFov);
});

test("3D milestones sit grounded on trail shoulders and auto-display only on arrival", () => {
  const placements = computeLandmark3DPlacements(JOURNEY_MILESTONES);
  assert.equal(placements.length, 3);

  for (const lm of placements) {
    const groundY = getMountainTerrainHeight(lm.position.x, lm.position.z);
    assert.ok(
      Math.abs(lm.position.y - groundY) < 0.02,
      `Landmark ${lm.id} must sit flush on 3D terrain`
    );
  }

  assert.equal(computeMountain3DCameraPose(0.02, JOURNEY_MILESTONES).reachedMilestoneId, null);
  assert.equal(computeMountain3DCameraPose(0.24, JOURNEY_MILESTONES).reachedMilestoneId, "imerit");
  assert.equal(computeMountain3DCameraPose(0.4, JOURNEY_MILESTONES).reachedMilestoneId, null);
  assert.equal(computeMountain3DCameraPose(0.54, JOURNEY_MILESTONES).reachedMilestoneId, "haegl-tech");
  assert.equal(computeMountain3DCameraPose(0.81, JOURNEY_MILESTONES).reachedMilestoneId, "ryvo");
  assert.equal(computeMountain3DCameraPose(0.98, JOURNEY_MILESTONES).reachedMilestoneId, null);
});

test("stepTraveler3DWalk advances stride on scroll, reverses cleanly, and stops when stationary", () => {
  const fwd = stepTraveler3DWalk({
    prevProgress: 0.1,
    nextProgress: 0.13,
    prevStridePhase: 0,
    prevTravelDir: 1,
  });
  assert.equal(fwd.isMoving, true);
  assert.equal(fwd.travelDir, 1);
  assert.ok(fwd.stridePhase > 0);

  const idle = stepTraveler3DWalk({
    prevProgress: 0.13,
    nextProgress: 0.13,
    prevStridePhase: fwd.stridePhase,
    prevTravelDir: fwd.travelDir,
  });
  assert.equal(idle.isMoving, false);
  assert.equal(idle.stridePhase, fwd.stridePhase);

  const back = stepTraveler3DWalk({
    prevProgress: 0.13,
    nextProgress: 0.09,
    prevStridePhase: idle.stridePhase,
    prevTravelDir: idle.travelDir,
  });
  assert.equal(back.isMoving, true);
  assert.equal(back.travelDir, -1);
  assert.ok(back.stridePhase > idle.stridePhase);
});
