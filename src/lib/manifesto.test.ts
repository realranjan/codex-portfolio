import test from "node:test";
import assert from "node:assert/strict";
import { computeManifestoScrollState } from "./manifesto";

test("computeManifestoScrollState stays hidden during early hero and enters cleanly for 0-25% beat", () => {
  const earlyHero = computeManifestoScrollState(0, 0.3);
  assert.equal(earlyHero.stageVisible, false);
  assert.equal(earlyHero.stageOpacity, 0);
  assert.equal(earlyHero.carouselDriver, 0);

  const beat1 = computeManifestoScrollState(0.12, 1);
  assert.equal(beat1.stageVisible, true);
  assert.equal(beat1.stageOpacity, 1);
  assert.equal(beat1.activeBeat, "person");
  assert.equal(beat1.activeIndex, 0);
  assert.equal(beat1.beat1.opacity, 1);
  assert.equal(beat1.beat2.opacity, 0);
  assert.equal(beat1.beat3.opacity, 0);
  assert.equal(beat1.beat4.opacity, 0);
});

test("computeManifestoScrollState plays all 4 quarters sequentially with strict mutual exclusivity", () => {
  // Quarter 2 (25-50%): "can't leave a"
  const q2 = computeManifestoScrollState(0.38, 1);
  assert.equal(q2.activeBeat, "cant-leave");
  assert.equal(q2.activeIndex, 1);
  assert.equal(q2.beat2.opacity, 1);
  assert.equal(q2.beat1.opacity, 0);
  assert.equal(q2.beat3.opacity, 0);
  assert.equal(q2.beat4.opacity, 0);

  // Quarter 3 (50-75%): "question unanswered."
  const q3 = computeManifestoScrollState(0.65, 1);
  assert.equal(q3.activeBeat, "unanswered");
  assert.equal(q3.activeIndex, 2);
  assert.equal(q3.beat3.opacity, 1);
  assert.equal(q3.beat3.unansweredReveal, 1);
  assert.equal(q3.beat3.underlineReveal, 1);
  assert.equal(q3.beat1.opacity, 0);
  assert.equal(q3.beat2.opacity, 0);
  assert.equal(q3.beat4.opacity, 0);

  // Quarter 4 (75-100%): staggered 3-sentence reveal
  const q4Early = computeManifestoScrollState(0.79, 1);
  assert.equal(q4Early.activeBeat, "sometimes");
  assert.ok(q4Early.beat4.lineOpacities[0] > 0.4);
  assert.equal(q4Early.beat4.lineOpacities[1], 0);
  assert.equal(q4Early.beat4.lineOpacities[2], 0);

  const q4Full = computeManifestoScrollState(0.92, 1);
  assert.equal(q4Full.beat4.opacity, 1);
  assert.equal(q4Full.beat4.lineOpacities[0], 1);
  assert.equal(q4Full.beat4.lineOpacities[1], 1);
  assert.equal(q4Full.beat4.lineOpacities[2], 1);

  // Strict mutual exclusivity sweep across 200 samples
  for (let i = 0; i <= 200; i++) {
    const p = i / 200;
    const s = computeManifestoScrollState(p, 1);
    const visibleCount = [
      s.beat1.opacity > 0.01,
      s.beat2.opacity > 0.01,
      s.beat3.opacity > 0.01,
      s.beat4.opacity > 0.01,
    ].filter(Boolean).length;
    assert.ok(
      visibleCount <= 1,
      `Expected at most 1 beat visible at p=${p.toFixed(3)}, got ${visibleCount}`
    );
  }
});

test("computeManifestoScrollState exits cleanly at 100% and hands off to #projects carousel", () => {
  const end = computeManifestoScrollState(1, 1);
  assert.equal(end.stageVisible, false);
  assert.equal(end.stageOpacity, 0);
  assert.equal(end.beat4.visible, false);
  assert.equal(end.carouselDriver, 1);
});
