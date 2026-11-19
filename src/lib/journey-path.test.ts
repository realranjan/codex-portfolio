import test from "node:test";
import assert from "node:assert/strict";
import {
  applyWaypointDwell,
  buildCurvedFlightSvgPath,
  sampleCurvedFlightPath,
  type CurvedWaypoint,
} from "./journey-path";

const STOPS: readonly CurvedWaypoint[] = [
  { id: "c1", stop: 0, x: 110, y: 470 },
  { id: "c2", stop: 1 / 3, x: 430, y: 190 },
  { id: "c3", stop: 2 / 3, x: 780, y: 430 },
  { id: "c4", stop: 1, x: 1090, y: 160 },
];

test("applyWaypointDwell is strictly monotonic and preserves endpoints", () => {
  assert.equal(applyWaypointDwell(0, 4), 0);
  assert.equal(applyWaypointDwell(1, 4), 1);

  let prev = -1;
  for (let i = 0; i <= 100; i++) {
    const val = applyWaypointDwell(i / 100, 4);
    assert.ok(val >= prev, `expected monotonic increase at step ${i}: ${val} < ${prev}`);
    prev = val;
  }
});

test("sampleCurvedFlightPath lands on start & end waypoints with natural heading angles", () => {
  const start = sampleCurvedFlightPath(STOPS, 0);
  assert.equal(start.activeId, "c1");
  assert.ok(Math.abs(start.x - 110) < 0.5);
  assert.ok(Math.abs(start.y - 470) < 0.5);
  assert.ok(start.angleDeg < 0, "heading upward-right from c1 to c2 should have negative SVG angle");

  const end = sampleCurvedFlightPath(STOPS, 1);
  assert.equal(end.activeId, "c4");
  assert.equal(end.activeIndex, 3);
  assert.ok(Math.abs(end.x - 1090) < 0.5);
  assert.ok(Math.abs(end.y - 160) < 0.5);
  assert.deepEqual(end.reachedIds, ["c1", "c2", "c3", "c4"]);
});

test("sampleCurvedFlightPath is deterministic on forward and reverse scroll", () => {
  const forward = sampleCurvedFlightPath(STOPS, 0.5);
  const reverse = sampleCurvedFlightPath(STOPS, 0.5);
  assert.deepEqual(forward, reverse);

  const pathD = buildCurvedFlightSvgPath(STOPS, 48);
  assert.ok(pathD.startsWith("M 110.0 470.0"));
  assert.ok(pathD.includes("L 1090.0 160.0"));
});
