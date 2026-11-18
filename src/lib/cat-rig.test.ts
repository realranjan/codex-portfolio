import test from "node:test";
import assert from "node:assert/strict";
import {
  CAT_FACING_ROTATION_Y,
  CAT_MODEL_HEIGHT,
  CUTE_DEPTH_TUCK_RAW,
  CUTE_INNER_SCALE_RATIO,
  SAMURAI_HELMET_PARTS,
  classifyCuteSegment,
  classifySamuraiSegment,
  computeDualLayerAlignment,
  computeSegmentedLookAngles,
} from "./cat-rig";

test("cute cat classifies head (part 0) vs body (part 1) cleanly", () => {
  assert.equal(classifyCuteSegment("tripo_part_0", 0.125), "head");
  assert.equal(classifyCuteSegment("tripo_part_1", -0.32), "body");
});

test("samurai cat partitions 13 segments cleanly into helmet/head (6 parts) and body (7 parts)", () => {
  const allParts = Array.from({ length: 13 }, (_, i) => `tripo_part_${i}`);
  const headCount = allParts.filter(
    (name) => classifySamuraiSegment(name, 0) === "head"
  ).length;
  const bodyCount = allParts.filter(
    (name) => classifySamuraiSegment(name, -0.3) === "body"
  ).length;

  assert.equal(headCount, 6);
  assert.equal(bodyCount, 7);
  assert.equal(SAMURAI_HELMET_PARTS.has("tripo_part_0"), true);
  assert.equal(SAMURAI_HELMET_PARTS.has("tripo_part_9"), true);
  assert.equal(SAMURAI_HELMET_PARTS.has("tripo_part_10"), true);
  assert.equal(SAMURAI_HELMET_PARTS.has("tripo_part_8"), true);
  assert.equal(SAMURAI_HELMET_PARTS.has("tripo_part_4"), true);
  assert.equal(SAMURAI_HELMET_PARTS.has("tripo_part_6"), true);
  assert.equal(classifySamuraiSegment("tripo_part_2", -0.356), "body");
  assert.equal(classifySamuraiSegment("tripo_part_3", -0.196), "body");
  assert.equal(classifySamuraiSegment("tripo_part_11", -0.407), "body");
});

test("computeDualLayerAlignment matches cute cat height (Y) and proportions 1:1 with samurai cat", () => {
  const alignment = computeDualLayerAlignment(
    { min: [-0.371, -0.5, -0.449], max: [0.371, 0.5, 0.449] },
    { min: [-0.399, -0.489, -0.367], max: [0.399, 0.49, 0.367] }
  );

  assert.equal(CUTE_INNER_SCALE_RATIO, 1.0);
  assert.equal(alignment.facingRotationY, CAT_FACING_ROTATION_Y);
  assert.ok(
    Math.abs(alignment.cuteScale * 1.0 - CAT_MODEL_HEIGHT * CUTE_INNER_SCALE_RATIO) < 1e-6
  );
  assert.ok(
    Math.abs(alignment.samuraiScale * 0.979 - CAT_MODEL_HEIGHT) < 1e-6
  );
  assert.deepEqual(alignment.cuteCenterOffset, [0, 0, CUTE_DEPTH_TUCK_RAW]);
  assert.ok(alignment.neckPivotY < 0);
});

test("computeSegmentedLookAngles faces camera directly when hovering over face and turns left/right relative to cat", () => {
  const heroCenterHover = computeSegmentedLookAngles({
    pointerX: 0.34,
    pointerY: 0.05,
    modelScreenX: 0.34,
    modelScreenY: 0.05,
    cameraFacingYaw: -0.15,
    cameraFacingPitch: 0,
    pointerActive: true,
    elapsed: 1,
    headBiasX: 0,
    headBiasY: 0,
    dragYaw: 0,
    dragPitch: 0,
    centerMix: 0,
    carouselMix: 0,
    pullbackMix: 0,
    reducedMotion: false,
  });
  assert.ok(
    Math.abs(heroCenterHover.headYaw - -0.15) < 1e-6,
    "Hovering directly over the cat's nose must face straight toward the viewer/cursor"
  );

  const rightLook = computeSegmentedLookAngles({
    pointerX: 0.85,
    pointerY: 0.5,
    modelScreenX: 0,
    modelScreenY: 0,
    pointerActive: true,
    elapsed: 1,
    headBiasX: 0,
    headBiasY: 0,
    dragYaw: 0,
    dragPitch: 0,
    centerMix: 0,
    carouselMix: 0,
    pullbackMix: 0,
    reducedMotion: false,
  });

  const leftLook = computeSegmentedLookAngles({
    pointerX: -0.85,
    pointerY: -0.5,
    modelScreenX: 0,
    modelScreenY: 0,
    pointerActive: true,
    elapsed: 1,
    headBiasX: 0,
    headBiasY: 0,
    dragYaw: 0,
    dragPitch: 0,
    centerMix: 0,
    carouselMix: 0,
    pullbackMix: 0,
    reducedMotion: false,
  });

  assert.ok(rightLook.headYaw > 0.3);
  assert.ok(leftLook.headYaw < -0.3);
  assert.ok(rightLook.headPitch < 0);
  assert.ok(leftLook.headPitch > 0);
  assert.ok(Math.abs(rightLook.bodyYaw) < Math.abs(rightLook.headYaw));
});
