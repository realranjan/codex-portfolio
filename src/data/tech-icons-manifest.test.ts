import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  TECH_CONCEPTS_MANIFEST,
  TECH_ICON_CATEGORIES,
  TECH_ICONS_MANIFEST,
} from "./tech-icons-manifest";
import { auditTechManifests, parseSvgViewBox } from "../lib/tech-icon-utils";

const PUBLIC_DIR = path.join(process.cwd(), "public");

test("manifest covers all 12 required technology domains without duplicates or concept collisions", () => {
  const requiredDomains = [
    "languages",
    "frontend",
    "backend",
    "ai-ml",
    "databases",
    "cloud",
    "apis",
    "dev-tools",
    "desktop",
    "three-d",
    "design",
    "video",
  ];

  const categoryIds = TECH_ICON_CATEGORIES.map((c) => c.id);
  for (const domain of requiredDomains) {
    assert.ok(categoryIds.includes(domain as never), `Missing domain: ${domain}`);
    const count = TECH_ICONS_MANIFEST.filter((i) => i.category === domain).length;
    assert.ok(count >= 4, `Domain ${domain} should have at least 4 verified icons (got ${count})`);
  }

  const audit = auditTechManifests(TECH_ICONS_MANIFEST, TECH_CONCEPTS_MANIFEST);
  assert.equal(audit.valid, true, `Manifest audit errors: ${audit.errors.join("; ")}`);
  assert.equal(audit.unverifiedCount, 0, "All icons in manifest should be verified");
  assert.ok(audit.totalIcons >= 90, `Expected >= 90 verified icons, got ${audit.totalIcons}`);
});

test("every verified icon file exists on disk as a normalized 64x64 transparent SVG", () => {
  for (const icon of TECH_ICONS_MANIFEST) {
    const abs = path.join(PUBLIC_DIR, icon.iconFile);
    assert.ok(fs.existsSync(abs), `Missing SVG file on disk: ${icon.iconFile}`);
    const svg = fs.readFileSync(abs, "utf8");
    const vb = parseSvgViewBox(svg);
    assert.deepEqual(
      vb,
      { minX: 0, minY: 0, width: 64, height: 64 },
      `Icon ${icon.slug} must have normalized 0 0 64 64 viewBox`
    );
    assert.ok(!/currentColor/i.test(svg), `Icon ${icon.slug} contains unresolved currentColor`);
    assert.ok(!/<script\b/i.test(svg), `Icon ${icon.slug} contains forbidden <script>`);
    assert.ok(
      !/<svg\b[^>]*\bfill\s*=\s*["']none["']/i.test(svg),
      `Icon ${icon.slug} must not set fill="none" on root <svg> (breaks W3C default black fills)`
    );
  }
});

test("concepts manifest separates REST, RAG, NLP, OAuth, and WebSockets from branded icons", () => {
  const conceptSlugs = new Set(TECH_CONCEPTS_MANIFEST.map((c) => c.slug));
  for (const required of ["rest", "rag", "nlp", "oauth", "websockets"]) {
    assert.ok(conceptSlugs.has(required), `Missing required concept: ${required}`);
  }
  const iconSlugs = new Set(TECH_ICONS_MANIFEST.map((i) => i.slug));
  for (const concept of TECH_CONCEPTS_MANIFEST) {
    assert.equal(concept.hasBrandLogo, false);
    assert.ok(!iconSlugs.has(concept.slug), `Concept ${concept.slug} leaked into branded icons`);
  }
});
