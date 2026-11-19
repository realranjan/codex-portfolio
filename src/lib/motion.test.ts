import test from "node:test";
import assert from "node:assert/strict";
import {
  ASCII_CHARSET,
  computeSpatialScrollState,
  sampleFlightPath,
  scrambleTextAtProgress,
  type FlightWaypoint,
} from "./motion";

test("scrambleTextAtProgress resolves cleanly and preserves whitespace", () => {
  const target = "SYSTEMS ARCH 01";
  const mid = scrambleTextAtProgress(target, 0.5, 2);

  assert.equal(mid.length, target.length);
  assert.equal(mid[7], " ");
  assert.equal(mid[12], " ");
  assert.equal(mid.slice(0, 7), "SYSTEMS");

  for (const ch of mid.slice(8).replace(/\s/g, "")) {
    assert.ok(ASCII_CHARSET.includes(ch), `Unexpected char ${ch} outside constrained set`);
  }

  assert.equal(scrambleTextAtProgress(target, 1, 2), target);
  assert.equal(scrambleTextAtProgress(target, 1.4, 2), target);
});

test("computeSpatialScrollState clamps inputs and interpolates multi-plane parallax", () => {
  const start = computeSpatialScrollState(-0.5);
  const mid = computeSpatialScrollState(0.5);
  const end = computeSpatialScrollState(1.5);

  assert.equal(start.progress, 0);
  assert.equal(start.textOpacity, 1);
  assert.equal(start.dispersion, 1);
  assert.equal(start.bgScale, 1.06);

  assert.ok(mid.dispersion > 1.5, "Mid-scroll dispersion should expand strongly");
  assert.ok(mid.cameraOffsetZ < 0, "Camera should dolly inward mid-scroll");
  assert.ok(mid.bgOpacity > start.bgOpacity, "ASCII backdrop should brighten mid-scroll");

  assert.equal(end.progress, 1);
  assert.equal(end.textOpacity, 0);
  assert.ok(end.headBiasX > 0.55);
  assert.ok(end.bgScale > 1.2);
  assert.ok(end.raysShiftY < -30);
});

import {
  computeHeroToCarouselState,
  computeParallaxOffset,
} from "./motion";

test("computeHeroToCarouselState preserves close-up hero cinema then traces O-ring into carousel", () => {
  const atStart = computeHeroToCarouselState(-0.2);
  assert.equal(atStart.heroProgress, 0);
  assert.equal(atStart.heroOverlayOpacity, 1);
  assert.equal(atStart.cinematicDollyZ, 0);
  assert.equal(atStart.ringDrawMix, 0);
  assert.equal(atStart.carouselMix, 0);

  // Act I peak (~0.45): close-up zoom-in + dispersion before ring draws
  const atCinemaPeak = computeHeroToCarouselState(0.45);
  assert.equal(atCinemaPeak.heroOverlayOpacity, 0);
  assert.ok(atCinemaPeak.cinematicDollyZ < -3.0, "Camera should dolly close during Act I cinema");
  assert.ok(atCinemaPeak.cinematicDispersion > 2.0, "Particles should disperse at cinema peak");
  assert.equal(atCinemaPeak.ringDrawMix, 0);
  assert.equal(atCinemaPeak.carouselMix, 0);

  // Act II (~0.70): O-shape orbital track is tracing while cards prepare to emerge
  const atRingDraw = computeHeroToCarouselState(0.7);
  assert.ok(atRingDraw.ringDrawMix > 0.4 && atRingDraw.ringDrawMix < 0.7);
  assert.equal(atRingDraw.carouselMix, 0);
  assert.ok(atRingDraw.orbitPullbackMix > 0.4);

  // Act III (hero = 1.0, projects = 0.0): full centered orbit with O-ring closed and carousel active
  const atAnchor = computeHeroToCarouselState(1.2, 0);
  assert.equal(atAnchor.heroProgress, 1);
  assert.equal(atAnchor.projectsProgress, 0);
  assert.equal(atAnchor.heroOverlayOpacity, 0);
  assert.equal(atAnchor.centerMix, 1);
  assert.equal(atAnchor.cinematicDollyZ, 0);
  assert.equal(atAnchor.ringDrawMix, 1);
  assert.equal(atAnchor.carouselMix, 1);
  assert.equal(atAnchor.hudOpacity, 1);
  assert.equal(atAnchor.carouselScale, 1);

  // Mid-projects orbit (projects = 0.35): cinematic scroll keeps moving camera while carousel stays active
  const atMidOrbit = computeHeroToCarouselState(1, 0.35);
  assert.equal(atMidOrbit.carouselMix, 1);
  assert.equal(atMidOrbit.ringDrawMix, 1);
  assert.ok(Math.abs(atMidOrbit.orbitCameraArcX) > 0.3, "Camera continues arcing smoothly across orbit");
  assert.ok(atMidOrbit.cinematicDollyZ < -0.4, "Camera breathes forward along the orbital scroll");

  // Act IV exit (projects = 0.98): carousel and O-ring dissolve back out before next section enters
  const atExit = computeHeroToCarouselState(1, 0.98);
  assert.equal(atExit.carouselMix, 0);
  assert.equal(atExit.ringDrawMix, 0);
  assert.equal(atExit.hudOpacity, 0);
  assert.ok(atExit.cinematicDollyZ < -1.5, "Closing sculptural dolly sweep remains active on exit");
});

test("computeParallaxOffset maps normalized scroll progress cleanly", () => {
  assert.equal(computeParallaxOffset(0, 40), -40);
  assert.equal(computeParallaxOffset(0.5, 40), 0);
  assert.equal(computeParallaxOffset(1, 40), 40);
  assert.equal(computeParallaxOffset(-0.4, 40), -40);
  assert.equal(computeParallaxOffset(1.4, 40), 40);
});

test("sampleFlightPath moves continuously and reverses cleanly", () => {
  const waypoints: FlightWaypoint[] = [
    { id: "blr", stop: 0, x: 100, y: 120 },
    { id: "zrh", stop: 0.5, x: 500, y: 360 },
    { id: "sfo", stop: 1, x: 900, y: 600 },
  ];

  const atStart = sampleFlightPath(waypoints, 0);
  assert.equal(atStart.x, 100);
  assert.equal(atStart.y, 120);
  assert.deepEqual(atStart.reachedIds, ["blr"]);

  const atMid = sampleFlightPath(waypoints, 0.5);
  assert.equal(atMid.x, 500);
  assert.equal(atMid.y, 360);
  assert.deepEqual(atMid.reachedIds, ["blr", "zrh"]);

  const atEnd = sampleFlightPath(waypoints, 1);
  assert.equal(atEnd.x, 900);
  assert.equal(atEnd.y, 600);
  assert.deepEqual(atEnd.reachedIds, ["blr", "zrh", "sfo"]);

  // Reversibility check: scrolling back to 0.25 produces midpoint between blr and zrh
  const reversed = sampleFlightPath(waypoints, 0.25);
  assert.equal(reversed.x, 300);
  assert.equal(reversed.y, 240);
  assert.deepEqual(reversed.reachedIds, ["blr"]);
});

import {
  computeGalleryCardTransform,
  computeStickyScrollRotation,
  getFrontGalleryIndex,
} from "./motion";

test("computeGalleryCardTransform computes symmetrical angles and opacity", () => {
  const front = computeGalleryCardTransform(0, 5, 0);
  assert.equal(front.itemAngle, 0);
  assert.equal(front.normalizedAngle, 0);
  assert.equal(front.opacity, 1);
  assert.equal(front.isFront, true);

  // Rotating by -72deg brings item 1 (at 72deg) to 0deg front center
  const rotatedToSecond = computeGalleryCardTransform(1, 5, -72);
  assert.equal(rotatedToSecond.normalizedAngle, 0);
  assert.equal(rotatedToSecond.opacity, 1);
  assert.equal(rotatedToSecond.isFront, true);

  // Back card stays bounded above minimum opacity 0.28
  const back = computeGalleryCardTransform(2, 4, 0);
  assert.equal(back.normalizedAngle, 180);
  assert.equal(back.opacity, 0.28);
});

test("getFrontGalleryIndex resolves front card across positive and negative rotations", () => {
  assert.equal(getFrontGalleryIndex(5, 0), 0);
  assert.equal(getFrontGalleryIndex(5, -72), 1);
  assert.equal(getFrontGalleryIndex(5, -144), 2);
  assert.equal(getFrontGalleryIndex(5, 72), 4);
  assert.equal(getFrontGalleryIndex(5, -360), 0);
});

test("computeStickyScrollRotation maps sticky container scroll into 0..360 degrees", () => {
  assert.equal(computeStickyScrollRotation(200, 1800, 900), 0);
  assert.equal(computeStickyScrollRotation(-450, 1800, 900), 180);
  assert.equal(computeStickyScrollRotation(-900, 1800, 900), 360);
  assert.equal(computeStickyScrollRotation(-1500, 1800, 900), 360);
});

import { computeHeroStoryScrollState } from "./motion";

test("computeHeroStoryScrollState reveals CURIOSITY -> KILLED THE CAT. -> Not this one. with zero text overlap and parallax handoff", () => {
  // Beat 1 at scroll 0: ONLY CURIOSITY is visible
  const beat1 = computeHeroStoryScrollState(0);
  assert.equal(beat1.activeBeat, "curiosity");
  assert.equal(beat1.curiosity.visible, true);
  assert.equal(beat1.curiosity.opacity, 1);
  assert.equal(beat1.killed.visible, false);
  assert.equal(beat1.killed.opacity, 0);
  assert.equal(beat1.punchline.visible, false);
  assert.equal(beat1.punchline.opacity, 0);
  assert.equal(beat1.carouselStageProgress, 0);

  // Beat 2 entry (~0.25): CURIOSITY is completely gone, words stagger in order (KILLED leads THE leads CAT.)
  const beat2Enter = computeHeroStoryScrollState(0.25);
  assert.equal(beat2Enter.activeBeat, "killed");
  assert.equal(beat2Enter.curiosity.visible, false);
  assert.equal(beat2Enter.killed.visible, true);
  assert.ok(
    beat2Enter.killed.wordYPercent[0] < beat2Enter.killed.wordYPercent[1],
    "KILLED should rise ahead of THE"
  );
  assert.ok(
    beat2Enter.killed.wordYPercent[1] < beat2Enter.killed.wordYPercent[2],
    "THE should rise ahead of CAT."
  );
  assert.equal(beat2Enter.punchline.visible, false);

  // Beat 2 hold (~0.345): KILLED THE CAT. fully settled, previous & next hidden
  const beat2Hold = computeHeroStoryScrollState(0.345);
  assert.deepEqual(beat2Hold.killed.wordYPercent, [0, 0, 0]);
  assert.equal(beat2Hold.curiosity.opacity, 0);
  assert.equal(beat2Hold.punchline.opacity, 0);

  // Beat 3 mid-sweep (~0.50): KILLED THE CAT. completely gone, brushstroke sweeping Not this one.
  const beat3Mid = computeHeroStoryScrollState(0.5);
  assert.equal(beat3Mid.activeBeat, "punchline");
  assert.equal(beat3Mid.curiosity.visible, false);
  assert.equal(beat3Mid.killed.visible, false);
  assert.equal(beat3Mid.punchline.visible, true);
  assert.ok(beat3Mid.punchline.reveal > 0.3 && beat3Mid.punchline.reveal < 0.8);
  assert.ok(beat3Mid.punchline.washHead > beat3Mid.punchline.washTail);

  // Beat 3 hold (~0.56): Not this one. fully revealed and clear
  const beat3Hold = computeHeroStoryScrollState(0.56);
  assert.equal(beat3Hold.punchline.reveal, 1);
  assert.equal(beat3Hold.punchline.washTail, 1);
  assert.equal(beat3Hold.punchline.opacity, 1);

  // Beat 4 transition (~0.85): all hero typography gone, parallax active, carousel progressing
  const beat4 = computeHeroStoryScrollState(0.85);
  assert.equal(beat4.activeBeat, "transition");
  assert.equal(beat4.curiosity.visible, false);
  assert.equal(beat4.killed.visible, false);
  assert.equal(beat4.punchline.visible, false);
  assert.ok(beat4.backdropParallaxY < -80, "Backdrop parallax should glide upward into next section");
  assert.ok(beat4.sunScale < 0.9, "Rising sun should scale back smoothly");
  assert.ok(beat4.carouselStageProgress > 0.6 && beat4.carouselStageProgress < 0.75);

  // Exhaustive mutual exclusivity invariant across 201 sample points [0..1]
  for (let i = 0; i <= 200; i++) {
    const sample = computeHeroStoryScrollState(i / 200);
    const visibleCount =
      Number(sample.curiosity.visible) +
      Number(sample.killed.visible) +
      Number(sample.punchline.visible);
    assert.ok(
      visibleCount <= 1,
      `Expected at most 1 hero text visible at p=${(i / 200).toFixed(3)}, got ${visibleCount}`
    );
  }
});


