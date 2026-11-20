import test from "node:test";
import assert from "node:assert/strict";
import { TECH_ICONS_MANIFEST } from "../data/tech-icons-manifest";
import {
  buildSeamlessTrackItems,
  DEFAULT_RIBBON_LANES,
  partitionIconsIntoLanes,
  stepRibbonKinematics,
  wrapRibbonOffset,
} from "./ribbon-physics";

test("wrapRibbonOffset wraps positive, negative, and multi-period values into [-period, 0)", () => {
  assert.equal(wrapRibbonOffset(0, 1000), 0);
  assert.equal(wrapRibbonOffset(-250, 1000), -250);
  assert.equal(wrapRibbonOffset(-1000, 1000), 0);
  assert.equal(wrapRibbonOffset(-1250, 1000), -250);
  assert.equal(wrapRibbonOffset(250, 1000), -750);
  assert.equal(wrapRibbonOffset(1250, 1000), -750);
  assert.equal(wrapRibbonOffset(400, 0), 0);
});

test("partitionIconsIntoLanes distributes all 102 manifest icons across 3 lanes without loss or duplication", () => {
  const lanes = partitionIconsIntoLanes(TECH_ICONS_MANIFEST, DEFAULT_RIBBON_LANES);
  assert.equal(lanes.length, 3);

  const seen = new Set<string>();
  let total = 0;

  for (const lane of lanes) {
    assert.ok(lane.items.length >= 20, `Lane ${lane.spec.id} should be populated`);
    for (const item of lane.items) {
      assert.equal(seen.has(item.slug), false, `Duplicate slug ${item.slug} across lanes`);
      seen.add(item.slug);
      total += 1;
    }
  }

  assert.equal(total, TECH_ICONS_MANIFEST.length);
});

test("buildSeamlessTrackItems pads short filtered lists to avoid blank viewport gaps", () => {
  const shortList = ["a", "b", "c"];
  const expanded = buildSeamlessTrackItems(shortList, 10);
  assert.equal(expanded.length, 12);
  assert.deepEqual(expanded.slice(0, 3), shortList);
  assert.deepEqual(buildSeamlessTrackItems([], 10), []);
});

test("stepRibbonKinematics cruises smoothly, eases to 0 on hover, and decays fling impulse", () => {
  let state = { offsetPx: 0, velocityPxPerSec: -46, impulsePxPerSec: 0 };

  // Advance 1 second cruising left
  for (let i = 0; i < 60; i += 1) {
    state = stepRibbonKinematics(state, {
      periodPx: 2000,
      baseSpeedPxPerSec: 46,
      direction: -1,
      speedMultiplier: 1,
      isPaused: false,
      isHoveredOrFocused: false,
      isDragging: false,
      dtSec: 1 / 60,
    });
  }
  assert.ok(state.offsetPx < -44 && state.offsetPx > -48);

  // Hover should smoothly decelerate velocity toward 0 within ~0.6s
  for (let i = 0; i < 40; i += 1) {
    state = stepRibbonKinematics(state, {
      periodPx: 2000,
      baseSpeedPxPerSec: 46,
      direction: -1,
      speedMultiplier: 1,
      isPaused: false,
      isHoveredOrFocused: true,
      isDragging: false,
      dtSec: 1 / 60,
    });
  }
  assert.ok(Math.abs(state.velocityPxPerSec) < 1);

  // Fling impulse decays cleanly back toward 0
  let flung = { offsetPx: -200, velocityPxPerSec: 0, impulsePxPerSec: 600 };
  for (let i = 0; i < 60; i += 1) {
    flung = stepRibbonKinematics(flung, {
      periodPx: 2000,
      baseSpeedPxPerSec: 46,
      direction: 1,
      speedMultiplier: 1,
      isPaused: true,
      isHoveredOrFocused: false,
      isDragging: false,
      dtSec: 1 / 60,
    });
  }
  assert.ok(flung.impulsePxPerSec < 25, "Fling impulse should decay smoothly");
  assert.ok(flung.offsetPx >= -2000 && flung.offsetPx <= 0);
});
