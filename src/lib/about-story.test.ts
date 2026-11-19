import test from "node:test";
import assert from "node:assert/strict";
import {
  ABOUT_STATEMENT_TARGET_PROGRESS,
  computeAboutStoryState,
  computePinePointerTarget,
} from "./about-story";

test("clamps out-of-range and non-finite scroll inputs cleanly", () => {
  const neg = computeAboutStoryState(-0.5);
  assert.equal(neg.progress, 0);
  assert.equal(neg.scene, 1);
  assert.equal(neg.mountainShiftY, 0);
  assert.equal(neg.pineShiftY, 0);

  const over = computeAboutStoryState(1.8);
  assert.equal(over.progress, 1);
  assert.equal(over.scene, 5);
  assert.equal(over.philosophyReveal, 1);

  const nanState = computeAboutStoryState(Number.NaN);
  assert.equal(nanState.progress, 0);
  assert.equal(nanState.scene, 1);
});

test("Scene 01 introduces primary headline before italic who... and keeps painting visible", () => {
  const start = computeAboutStoryState(0);
  const midIntro = computeAboutStoryState(0.06);
  const endIntro = computeAboutStoryState(0.12);

  assert.equal(start.scene, 1);
  assert.ok(start.artworkPresence >= 0.8, "ink artwork should be subtly visible immediately");
  assert.ok(
    midIntro.headlineMainReveal > midIntro.headlineItalicReveal,
    "primary sans headline completes before italic who..."
  );
  assert.equal(endIntro.headlineMainReveal, 1);
  assert.equal(endIntro.headlineItalicReveal, 1);
  assert.equal(start.statements[0].opacity, 0);
  assert.equal(start.philosophyReveal, 0);
});

test("Scenes 02, 03, 04, and 05 cycle statements 01..04 cleanly with matching markers", () => {
  const scene2 = computeAboutStoryState(ABOUT_STATEMENT_TARGET_PROGRESS[0]);
  assert.equal(scene2.scene, 2);
  assert.equal(scene2.activeStatementIndex, 0);
  assert.equal(scene2.statements[0].opacity, 1);
  assert.equal(scene2.statements[0].translateY, 0);
  assert.equal(scene2.statements[1].opacity, 0);
  assert.equal(scene2.statements[2].opacity, 0);
  assert.equal(scene2.statements[3].opacity, 0);

  const scene3 = computeAboutStoryState(ABOUT_STATEMENT_TARGET_PROGRESS[1]);
  assert.equal(scene3.scene, 3);
  assert.equal(scene3.activeStatementIndex, 1);
  assert.equal(scene3.statements[0].opacity, 0);
  assert.equal(scene3.statements[1].opacity, 1);
  assert.equal(scene3.statements[1].translateY, 0);
  assert.equal(scene3.statements[2].opacity, 0);

  const scene4 = computeAboutStoryState(ABOUT_STATEMENT_TARGET_PROGRESS[2]);
  assert.equal(scene4.scene, 4);
  assert.equal(scene4.activeStatementIndex, 2);
  assert.equal(scene4.statements[1].opacity, 0);
  assert.equal(scene4.statements[2].opacity, 1);
  assert.equal(scene4.statements[2].translateY, 0);
  assert.equal(scene4.statements[3].opacity, 0);

  const scene5 = computeAboutStoryState(ABOUT_STATEMENT_TARGET_PROGRESS[3]);
  assert.equal(scene5.scene, 5);
  assert.equal(scene5.activeStatementIndex, 3);
  assert.equal(scene5.statements[2].opacity, 0);
  assert.equal(scene5.statements[3].opacity, 1);
  assert.equal(scene5.statements[3].translateY, 0);
  assert.equal(scene5.philosophyReveal, 1);
  assert.equal(scene5.philosophyTranslateY, 0);
});

test("Scene 05 holds statement 04 and Philosophy paragraphs readable through end of scroll", () => {
  const holdStart = computeAboutStoryState(0.91);
  const holdEnd = computeAboutStoryState(1.0);

  assert.equal(holdStart.statements[3].opacity, 1);
  assert.equal(holdStart.philosophyReveal, 1);
  assert.equal(holdEnd.statements[3].opacity, 1);
  assert.equal(holdEnd.philosophyReveal, 1);
  assert.equal(holdEnd.philosophyTranslateY, 0);
});

test("3-layer parallax stays strictly within subtle depth envelopes (bg 0-5px, mid 5-12px, fg 10-24px)", () => {
  const start = computeAboutStoryState(0);
  const mid = computeAboutStoryState(0.5);
  const end = computeAboutStoryState(1);

  const bgRange = Math.abs(end.sunShiftY - start.sunShiftY);
  const mountainRange = Math.abs(end.mountainShiftY - start.mountainShiftY);
  const pineRange = Math.abs(end.pineShiftY - start.pineShiftY);

  assert.ok(bgRange >= 0 && bgRange <= 5, `expected background parallax 0-5px, got ${bgRange}`);
  assert.ok(
    mountainRange >= 5 && mountainRange <= 12,
    `expected midground parallax 5-12px, got ${mountainRange}`
  );
  assert.ok(
    pineRange >= 10 && pineRange <= 24,
    `expected foreground parallax 10-24px, got ${pineRange}`
  );
  assert.ok(
    Math.abs(mid.pineShiftY) > Math.abs(mid.mountainShiftY) &&
      Math.abs(mid.mountainShiftY) > Math.abs(mid.sunShiftY),
    "foreground moves slightly more than midground, which moves slightly more than background"
  );
  assert.ok(Math.abs(end.pineShiftX) <= 8, "horizontal depth drift stays restrained");
});

test("scroll choreography is purely deterministic and reversible", () => {
  const forward = computeAboutStoryState(0.45);
  const afterPeak = computeAboutStoryState(0.95);
  const reversed = computeAboutStoryState(0.45);

  assert.notEqual(forward.scene, afterPeak.scene);
  assert.deepEqual(reversed, forward);
});

test("pointer parallax target stays bounded within gentle editorial offsets", () => {
  assert.deepEqual(computePinePointerTarget(0, 0), { x: 0, y: 0 });
  assert.deepEqual(computePinePointerTarget(5, -5), { x: 7, y: -5 });
  assert.deepEqual(computePinePointerTarget(Number.NaN, 0.5), { x: 0, y: 2.5 });
});
