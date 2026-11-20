import test from "node:test";
import assert from "node:assert/strict";
import {
  auditTechManifests,
  computeSurfaceContrastProfile,
  contrastRatio,
  normalizeSvgAsset,
  parseSvgViewBox,
  PORTFOLIO_BURGUNDY,
  PORTFOLIO_IVORY,
} from "./tech-icon-utils";

test("parseSvgViewBox handles standard, non-zero, and width/height fallback SVGs", () => {
  assert.deepEqual(parseSvgViewBox('<svg viewBox="0 0 128 128"><path/></svg>'), {
    minX: 0,
    minY: 0,
    width: 128,
    height: 128,
  });

  assert.deepEqual(parseSvgViewBox('<svg viewBox="-10 5 256 128"><path/></svg>'), {
    minX: -10,
    minY: 5,
    width: 256,
    height: 128,
  });

  assert.deepEqual(parseSvgViewBox('<svg width="48px" height="24px"><path/></svg>'), {
    minX: 0,
    minY: 0,
    width: 48,
    height: 24,
  });
});

test("normalizeSvgAsset centers wide and tall viewBoxes into 64x64 without distortion", () => {
  const wide = '<svg viewBox="0 0 200 100"><rect x="0" y="0" width="200" height="100" fill="#3178C6"/></svg>';
  const normalizedWide = normalizeSvgAsset(wide, { targetSize: 64, padding: 4 });
  assert.match(normalizedWide, /viewBox="0 0 64 64"/);
  // innerBox=56, scale=56/200=0.28, scaledH=28, ty=(64-28)/2=18, tx=4
  assert.match(normalizedWide, /translate\(4 18\) scale\(0\.28\)/);
  assert.match(normalizedWide, /fill="#3178C6"/);

  const mono = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
  const colored = normalizeSvgAsset(mono, { monochromeFill: "#10A37F" });
  assert.match(colored, /fill="#10A37F"/);
  assert.match(colored, /viewBox="0 0 64 64"/);
});

test("contrastRatio and surface profile detect dark and burgundy-adjacent marks on Burgundy", () => {
  const blackOnBurgundy = computeSurfaceContrastProfile("#000000");
  assert.equal(blackOnBurgundy.burgundyPlate, "ivory-plate");
  assert.equal(blackOnBurgundy.ivoryPlate, "transparent");

  const redisOnBurgundy = computeSurfaceContrastProfile("#DC382D");
  assert.equal(redisOnBurgundy.burgundyPlate, "ivory-plate");

  const yellowOnBurgundy = computeSurfaceContrastProfile("#F7DF1E");
  assert.equal(yellowOnBurgundy.burgundyPlate, "transparent");

  const whiteOnIvory = computeSurfaceContrastProfile("#FFFFFF");
  assert.equal(whiteOnIvory.ivoryPlate, "burgundy-plate");

  assert.ok(contrastRatio(PORTFOLIO_BURGUNDY, PORTFOLIO_IVORY) > 7.0);
});

test("auditTechManifests rejects duplicates and concept/icon slug collisions", () => {
  const ok = auditTechManifests(
    [
      {
        slug: "python",
        name: "Python",
        category: "languages",
        iconFile: "/assets/tech-icons/languages/python.svg",
        brandColor: "#3776AB",
        source: "Devicon",
        verified: true,
      },
    ],
    [
      {
        slug: "rag",
        label: "RAG",
        category: "ai-ml",
        hasBrandLogo: false,
      },
    ]
  );
  assert.equal(ok.valid, true);
  assert.equal(ok.verifiedCount, 1);

  const dup = auditTechManifests(
    [
      {
        slug: "python",
        name: "Python",
        category: "languages",
        iconFile: "/assets/tech-icons/languages/python.svg",
        brandColor: "#3776AB",
        source: "Devicon",
        verified: true,
      },
      {
        slug: "python",
        name: "Python",
        category: "languages",
        iconFile: "/assets/tech-icons/languages/python.svg",
        brandColor: "#3776AB",
        source: "Devicon",
        verified: true,
      },
    ],
    [
      {
        slug: "python",
        label: "Python",
        category: "languages",
        hasBrandLogo: false,
      },
    ]
  );
  assert.equal(dup.valid, false);
  assert.ok(dup.errors.length >= 2);
});
