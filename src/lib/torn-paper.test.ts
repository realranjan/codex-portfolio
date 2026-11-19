import test from "node:test";
import assert from "node:assert/strict";
import {
  computeTornPaperPeelState,
  generateTornPaperPaths,
} from "./torn-paper";

test("generateTornPaperPaths is deterministic and produces high-detail irregular fibers across full width", () => {
  const a = generateTornPaperPaths(1600, 190, 720, 42);
  const b = generateTornPaperPaths(1600, 190, 720, 42);

  // SSR/hydration determinism
  assert.equal(a.sheetPath, b.sheetPath);
  assert.equal(a.fiberFringePath, b.fiberFringePath);
  assert.equal(a.shadowPath, b.shadowPath);
  assert.equal(a.curlHighlightPath, b.curlHighlightPath);

  // Full width coverage & high vertex count
  assert.equal(a.samplePoints.length, 721);
  assert.equal(a.samplePoints[0].x, 0);
  assert.equal(a.samplePoints[a.samplePoints.length - 1].x, 1600);

  // Verify substantial irregular organic height variance (not a flat line or tiny uniform wave)
  const ys = a.samplePoints.map((pt) => pt.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  assert.ok(
    maxY - minY > 75,
    `Expected deep irregular macro tear amplitude (>75px), got ${(maxY - minY).toFixed(1)}px`
  );

  // Verify micro-fiber toothiness (consecutive point deltas vary irregularly)
  let nonZeroMicroSteps = 0;
  for (let i = 1; i < ys.length; i++) {
    if (Math.abs(ys[i] - ys[i - 1]) > 1.2) {
      nonZeroMicroSteps++;
    }
  }
  assert.ok(
    nonZeroMicroSteps > 250,
    `Expected rich micro-fiber raggedness (>250 jagged steps), got ${nonZeroMicroSteps}`
  );
  assert.ok(!a.sheetPath.includes("NaN"));
});

test("computeTornPaperPeelState executes all 4 scroll phases accurately and reverses cleanly", () => {
  // Phase 1 (0-20%): Dark sheet fills viewport, headline stays masked
  const p0 = computeTornPaperPeelState(0);
  assert.equal(p0.phase, "before");
  assert.equal(p0.sheetYPercent, 0);
  assert.equal(p0.headlineReveal, 0);
  assert.equal(p0.headlineYPercent, 108);

  const p15 = computeTornPaperPeelState(0.15);
  assert.equal(p15.phase, "before");
  assert.ok(p15.sheetYPercent > -3 && p15.sheetYPercent <= 0);
  assert.equal(p15.headlineReveal, 0);

  // Phase 2 (20-45%): Paper begins peeling upward with contact shadow & edge curl
  const p35 = computeTornPaperPeelState(0.35);
  assert.equal(p35.phase, "peeling");
  assert.ok(p35.sheetYPercent < -10 && p35.sheetYPercent > -35);
  assert.ok(p35.shadowOpacity > 0.85, "Contact shadow should be active along tear");
  assert.ok(p35.curlOpacity > 0.4, "Subtle edge curl highlight should appear during peel");
  assert.equal(p35.headlineReveal, 0);

  // Phase 3 (45-85%): Main reveal continuously moves dark sheet upward through viewport
  const p65 = computeTornPaperPeelState(0.65);
  assert.equal(p65.phase, "reveal");
  assert.ok(p65.sheetYPercent < -60 && p65.sheetYPercent > -105);
  assert.ok(p65.shadowOpacity > 0.8);
  assert.equal(p65.headlineReveal, 0);

  // Phase 4 (85-100%): Torn edge exits top completely; ivory headline reveals upward
  const p85 = computeTornPaperPeelState(0.85);
  assert.equal(p85.phase, "complete");
  assert.equal(p85.sheetYPercent, -126);

  const p92 = computeTornPaperPeelState(0.92);
  assert.equal(p92.phase, "complete");
  assert.ok(p92.headlineReveal > 0.3 && p92.headlineReveal < 0.8);
  assert.ok(p92.headlineYPercent > 15 && p92.headlineYPercent < 80);

  const p100 = computeTornPaperPeelState(1);
  assert.equal(p100.phase, "complete");
  assert.equal(p100.sheetYPercent, -126);
  assert.equal(p100.shadowOpacity, 0);
  assert.equal(p100.headlineReveal, 1);
  assert.equal(p100.headlineYPercent, 0);

  // Clamping & reversibility
  assert.deepEqual(computeTornPaperPeelState(-0.3), p0);
  assert.deepEqual(computeTornPaperPeelState(1.4), p100);
  assert.deepEqual(computeTornPaperPeelState(0.35), p35);
});
