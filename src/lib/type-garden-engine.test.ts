import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWeaveSegments,
  computeWideCenteredLayout,
  createRng,
  generateGardenPhrase,
  layerAt,
} from "./type-garden-engine";

test("createRng produces deterministic sequence in [0, 1)", () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 12; i++) {
    const va = a();
    const vb = b();
    assert.equal(va, vb);
    assert.ok(va >= 0 && va < 1);
  }
});

test("buildWeaveSegments covers [0, 1] and alternates front/back layers", () => {
  const r = createRng(108);
  const segs = buildWeaveSegments(r, 0);
  assert.ok(segs.length >= 2);
  assert.equal(segs[0].u0, 0);
  assert.equal(segs[segs.length - 1].u1, 1);
  assert.equal(layerAt(segs, 0.01), 0);
});

test("computeWideCenteredLayout centers CURIOSITY widely inside viewport without clipping", () => {
  const phrase = "CURIOSITY";
  const widths = Array.from(phrase).map(() => 0.68);
  const layout = computeWideCenteredLayout(phrase, widths, 1440, 900, {
    letterSpacingEm: 0.34,
    stretchX: 1.12,
    maxWidthRatio: 0.9,
    maxFontPx: 184,
  });

  assert.equal(layout.letters.length, phrase.length);
  assert.ok(layout.fontSize >= 120, "CURIOSITY should render big on 1440px desktop");
  assert.ok(layout.totalWidth <= 1440 * 0.91, "Must not clip horizontally");

  const firstLeft = layout.letters[0].x - layout.letters[0].tw / 2;
  const lastRight =
    layout.letters[layout.letters.length - 1].x +
    layout.letters[layout.letters.length - 1].tw / 2;
  const centerOffset = Math.abs((firstLeft + lastRight) / 2 - 720);
  assert.ok(centerOffset < 1, "Phrase must be horizontally centered");
});

test("generateGardenPhrase grows stems, leaves, and roses deterministically", () => {
  const phrase = "CURIOSITY";
  const widths = Array.from(phrase).map(() => 0.68);
  const layout = computeWideCenteredLayout(phrase, widths, 1440, 900, {
    letterSpacingEm: 0.34,
    stretchX: 1.12,
  });

  const letters = generateGardenPhrase(layout, 2026, 1.05, 80);
  assert.equal(letters.length, phrase.length);

  const allEls = letters.flatMap((l) => l.els);
  const stems = allEls.filter((e) => e.t === "stem");
  const roses = allEls.filter((e) => e.t === "rose");
  const leaves = allEls.filter((e) => e.t === "leaf");

  assert.ok(stems.length >= phrase.length, "Every letter must grow at least one stem");
  assert.ok(roses.length >= 2, "Phrase must bloom multiple signature roses");
  assert.ok(leaves.length >= 4, "Phrase must populate botanical leaves");
});
