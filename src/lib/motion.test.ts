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

