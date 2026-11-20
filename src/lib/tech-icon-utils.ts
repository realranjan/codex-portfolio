export const PORTFOLIO_BURGUNDY = "#792B33";
export const PORTFOLIO_IVORY = "#F3E9DE";

export interface ParsedViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export type IconSurfacePlate = "transparent" | "ivory-plate" | "burgundy-plate";

export interface SurfaceContrastProfile {
  contrastOnBurgundy: number;
  contrastOnIvory: number;
  burgundyPlate: IconSurfacePlate;
  ivoryPlate: IconSurfacePlate;
}

/**
 * Extracts a numeric viewBox from an SVG string, falling back to width/height
 * attributes when viewBox is absent. Returns null if dimensions cannot be determined.
 */
export function parseSvgViewBox(svg: string): ParsedViewBox | null {
  const vbMatch = svg.match(/\bviewBox\s*=\s*["']([^"']+)["']/i);
  if (vbMatch) {
    const nums = vbMatch[1]
      .trim()
      .split(/[\s,]+/)
      .map((n) => Number.parseFloat(n));
    if (
      nums.length === 4 &&
      nums.every((n) => Number.isFinite(n)) &&
      nums[2] > 0 &&
      nums[3] > 0
    ) {
      return {
        minX: nums[0],
        minY: nums[1],
        width: nums[2],
        height: nums[3],
      };
    }
  }

  const openTagMatch = svg.match(/<svg\b[^>]*>/i);
  if (!openTagMatch) return null;
  const openTag = openTagMatch[0];
  const wMatch = openTag.match(/\bwidth\s*=\s*["']([\d.]+)(?:px)?["']/i);
  const hMatch = openTag.match(/\bheight\s*=\s*["']([\d.]+)(?:px)?["']/i);
  if (wMatch && hMatch) {
    const width = Number.parseFloat(wMatch[1]);
    const height = Number.parseFloat(hMatch[1]);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return { minX: 0, minY: 0, width, height };
    }
  }
  return null;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Normalizes any authentic SVG asset into a consistent square `viewBox="0 0 64 64"`
 * canvas with uniform visual padding while strictly preserving official geometry,
 * aspect ratio, gradients, masks, and transparent background.
 *
 * Optionally injects a brand fill color for monochrome SVGs (e.g., Simple Icons
 * single-path marks that omit an explicit fill attribute).
 */
export function normalizeSvgAsset(
  rawSvg: string,
  options?: {
    targetSize?: number;
    padding?: number;
    monochromeFill?: string;
    stripRootBackground?: boolean;
  }
): string {
  const targetSize = options?.targetSize ?? 64;
  const padding = options?.padding ?? 4;
  const vb = parseSvgViewBox(rawSvg);
  if (!vb) {
    throw new Error("Cannot normalize SVG without valid viewBox or width/height");
  }

  const openTagMatch = rawSvg.match(/<svg\b[^>]*>/i);
  const closeIdx = rawSvg.toLowerCase().lastIndexOf("</svg>");
  if (!openTagMatch || closeIdx === -1) {
    throw new Error("Malformed SVG markup");
  }

  const openTagEnd = (openTagMatch.index ?? 0) + openTagMatch[0].length;
  let inner = rawSvg.slice(openTagEnd, closeIdx).trim();

  // Strip XML comments and title noise only if needed? Keep clean valid SVG, remove <script> defensively.
  inner = inner.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").trim();

  // If the SVG is a monochrome source (e.g. Simple Icons) with no explicit fill or fill="currentColor",
  // apply its verified official brand color cleanly without altering any path coordinates.
  if (options?.monochromeFill) {
    const color = options.monochromeFill;
    inner = inner.replace(/\bfill\s*=\s*["']currentColor["']/gi, `fill="${color}"`);
    inner = inner.replace(/\bstroke\s*=\s*["']currentColor["']/gi, `stroke="${color}"`);
  }

  const innerBox = Math.max(1, targetSize - padding * 2);
  const scale = Math.min(innerBox / vb.width, innerBox / vb.height);
  const scaledW = vb.width * scale;
  const scaledH = vb.height * scale;
  const tx = (targetSize - scaledW) / 2 - vb.minX * scale;
  const ty = (targetSize - scaledH) / 2 - vb.minY * scale;

  const transform = `translate(${round4(tx)} ${round4(ty)}) scale(${round4(scale)})`;
  const groupFillAttr =
    options?.monochromeFill && !/\bfill\s*=/i.test(inner)
      ? ` fill="${options.monochromeFill}"`
      : "";

  // Preserve xmlns:xlink if referenced inside the SVG
  const needsXlink = /\bxlink:href\b/i.test(inner);
  const xlinkAttr = needsXlink ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg"${xlinkAttr} viewBox="0 0 ${targetSize} ${targetSize}" width="${targetSize}" height="${targetSize}">`,
    `  <g transform="${transform}"${groupFillAttr}>`,
    `    ${inner}`,
    `  </g>`,
    `</svg>`,
  ].join("\n");
}

/**
 * Computes WCAG 2.1 relative luminance for a 6-digit hex color (#RRGGBB).
 */
export function hexToRelativeLuminance(hex: string): number {
  const clean = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Computes WCAG 2.1 contrast ratio between two hex colors (1.0 to 21.0).
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = hexToRelativeLuminance(hexA);
  const l2 = hexToRelativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

/**
 * Determines contrast ratios and optimal palette-locked plate treatment so
 * authentic colored brand icons remain legible over both Burgundy (#792B33)
 * and Warm Ivory (#F3E9DE) without recoloring or distorting official brand marks.
 */
export function computeSurfaceContrastProfile(
  brandColor: string,
  options?: { hasLightInternalElements?: boolean; isDarkMark?: boolean }
): SurfaceContrastProfile {
  const contrastOnBurgundy = contrastRatio(brandColor, PORTFOLIO_BURGUNDY);
  const contrastOnIvory = contrastRatio(brandColor, PORTFOLIO_IVORY);

  // Dark or burgundy-adjacent marks need an Ivory backing plate on Burgundy surfaces.
  const needsIvoryPlateOnBurgundy =
    Boolean(options?.isDarkMark) || contrastOnBurgundy < 2.6;

  // Very pale/white marks need a Burgundy backing plate on Ivory surfaces.
  const needsBurgundyPlateOnIvory =
    !options?.hasLightInternalElements && contrastOnIvory < 1.85;

  return {
    contrastOnBurgundy,
    contrastOnIvory,
    burgundyPlate: needsIvoryPlateOnBurgundy ? "ivory-plate" : "transparent",
    ivoryPlate: needsBurgundyPlateOnIvory ? "burgundy-plate" : "transparent",
  };
}

export interface ManifestAuditResult {
  valid: boolean;
  errors: string[];
  totalIcons: number;
  verifiedCount: number;
  unverifiedCount: number;
  totalConcepts: number;
}

export function auditTechManifests(
  icons: ReadonlyArray<{
    slug: string;
    name: string;
    category: string;
    iconFile: string;
    brandColor: string;
    source: string;
    verified: boolean;
  }>,
  concepts: ReadonlyArray<{
    slug: string;
    label: string;
    category: string;
    hasBrandLogo: false;
  }>
): ManifestAuditResult {
  const errors: string[] = [];
  const seenIconSlugs = new Set<string>();
  const seenIconNames = new Set<string>();
  const seenConceptSlugs = new Set<string>();

  for (const icon of icons) {
    if (seenIconSlugs.has(icon.slug)) {
      errors.push(`Duplicate icon slug: ${icon.slug}`);
    }
    seenIconSlugs.add(icon.slug);

    const lowerName = icon.name.toLowerCase();
    if (seenIconNames.has(lowerName)) {
      errors.push(`Duplicate icon name: ${icon.name}`);
    }
    seenIconNames.add(lowerName);

    if (!icon.iconFile.startsWith("/assets/tech-icons/") || !icon.iconFile.endsWith(".svg")) {
      errors.push(`Invalid iconFile path for ${icon.slug}: ${icon.iconFile}`);
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(icon.brandColor)) {
      errors.push(`Invalid brandColor for ${icon.slug}: ${icon.brandColor}`);
    }
  }

  for (const concept of concepts) {
    if (seenConceptSlugs.has(concept.slug)) {
      errors.push(`Duplicate concept slug: ${concept.slug}`);
    }
    seenConceptSlugs.add(concept.slug);

    if (seenIconSlugs.has(concept.slug)) {
      errors.push(`Concept slug collides with branded icon slug: ${concept.slug}`);
    }
    if (concept.hasBrandLogo !== false) {
      errors.push(`Concept must have hasBrandLogo: false (${concept.slug})`);
    }
  }

  const verifiedCount = icons.filter((i) => i.verified).length;
  return {
    valid: errors.length === 0,
    errors,
    totalIcons: icons.length,
    verifiedCount,
    unverifiedCount: icons.length - verifiedCount,
    totalConcepts: concepts.length,
  };
}
