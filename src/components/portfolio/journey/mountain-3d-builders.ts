import * as THREE from "three";
import type { JourneyMilestone } from "@/data/experience-journey";
import {
  getMountainTerrainHeight,
  getNearestTrailMetrics,
  sampleTrail3D,
  type Landmark3DPlacement,
} from "@/lib/mountain-3d-world";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROCEDURAL 3D JAPANESE ART (UKIYO-E / SUMI-E / WASHI) ASSET & TEXTURE BUILDERS
 * -------------------------------------------------------------------------------
 * Zero external file / 404 dependencies. Every surface carries handcrafted
 * Japanese art textures synthesized onto HTML5 2D canvases:
 *   - Washi mulberry-paper fibers & sumi-e dry-brush woodblock terrain texture
 *   - Ukiyo-e bokashi sky gradient with subtle kasumi ink-mist cloud bands
 *   - Hand-inked Japanese granite & moss-flecked stepping stone / boulder textures
 *   - Hokusai-style layered pine-needle fan foliage & scaly kuromatsu bark maps
 *   - Traditional seigaiha kimono weave, chirimen silk scarf, ajiro rattan pack,
 *     and hand-inked woven bamboo kasa hat textures
 *   - Carved michishirube stone stele tablets with vermilion-burgundy hanko seals
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface TravelerCatRig {
  readonly group: THREE.Group;
  readonly bodyGroup: THREE.Group;
  readonly headGroup: THREE.Group;
  readonly leftLeg: THREE.Group;
  readonly rightLeg: THREE.Group;
  readonly leftArm: THREE.Group;
  readonly rightArm: THREE.Group;
  readonly scarfTail: THREE.Group;
  readonly catTail: THREE.Group;
}

export interface Landmark3DHandle {
  readonly id: string;
  readonly milestone: JourneyMilestone;
  readonly group: THREE.Group;
  readonly hitbox: THREE.Mesh;
  readonly steleMaterial: THREE.MeshStandardMaterial;
  readonly sealMaterial: THREE.MeshStandardMaterial;
  readonly anchorWorld: THREE.Vector3;
}

export interface PathTraceHandle {
  readonly mesh: THREE.Mesh;
  readonly totalIndices: number;
  readonly setProgress: (trailT: number) => void;
}

export interface JapaneseArtTextureSet {
  readonly terrainColor: THREE.CanvasTexture;
  readonly terrainBump: THREE.CanvasTexture;
  readonly stoneColor: THREE.CanvasTexture;
  readonly stoneBump: THREE.CanvasTexture;
  readonly pineFoliageColor: THREE.CanvasTexture;
  readonly pineFoliageBump: THREE.CanvasTexture;
  readonly pineBarkColor: THREE.CanvasTexture;
  readonly kimonoColor: THREE.CanvasTexture;
  readonly rattanColor: THREE.CanvasTexture;
  readonly chirimenColor: THREE.CanvasTexture;
  readonly strawHatColor: THREE.CanvasTexture;
  readonly contactShadow: THREE.CanvasTexture;
  readonly skyColor: THREE.CanvasTexture;
  readonly mistBandColor: THREE.CanvasTexture;
  readonly disposeAll: () => void;
}

// Deterministic pseudo-random helper so every brushstroke, fiber, rock, and pine is 100% stable
function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Helper: paints delicate handmade Japanese kozo (washi) paper fibers onto any 2D canvas.
 */
function paintWashiFibers(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  seedOffset: number,
  darkAlpha: number,
  lightAlpha: number
) {
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const s = i + seedOffset;
    const x0 = seededRand(s * 3.1) * w;
    const y0 = seededRand(s * 5.3) * h;
    const angle = seededRand(s * 7.7) * Math.PI * 2;
    const len = 8 + seededRand(s * 11.1) * 28;
    const bend = (seededRand(s * 13.7) - 0.5) * 10;
    const x1 = x0 + Math.cos(angle) * len;
    const y1 = y0 + Math.sin(angle) * len;
    const cx = (x0 + x1) * 0.5 - Math.sin(angle) * bend;
    const cy = (y0 + y1) * 0.5 + Math.cos(angle) * bend;

    ctx.strokeStyle =
      i % 3 === 0
        ? `rgba(255, 250, 242, ${lightAlpha})`
        : `rgba(88, 68, 58, ${darkAlpha})`;
    ctx.lineWidth = 0.6 + seededRand(s * 17.3) * 0.9;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
  }
}

/**
 * 1. Washi Paper + Sumi-e Dry-Brush + Woodblock Grain Terrain Textures (Albedo + Bump).
 * High-value neutral-warm color map so multiplying with terrain vertexColors adds rich
 * Japanese woodblock contour striations, ink-wash brushwork, and handmade paper grain
 * without muddying the Burgundy/Ivory palette.
 */
function createWashiTerrainTextures(maxAnisotropy: number): {
  color: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;

  // Color map (multiplied over vertexColors)
  const cCanvas = document.createElement("canvas");
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext("2d");

  // Matching grayscale bump map
  const bCanvas = document.createElement("canvas");
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext("2d");

  if (cCtx && bCtx) {
    cCtx.fillStyle = "#F7F1E8";
    cCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = "#808080";
    bCtx.fillRect(0, 0, size, size);

    // Subtle organic carved woodblock grain (varied wavelengths so zero repeating stripes appear)
    for (let y = 0; y < size; y += 5) {
      const waveA = Math.sin((y / size) * Math.PI * 6 + 0.7) * 11;
      const waveB = Math.cos((y / size) * Math.PI * 14) * 5;
      const tone = Math.sin(y * 0.13 + 1.1) * 0.5 + 0.5;
      cCtx.strokeStyle =
        tone > 0.45
          ? `rgba(116, 94, 80, ${(0.032 + tone * 0.03).toFixed(3)})`
          : `rgba(255, 251, 244, 0.075)`;
      cCtx.lineWidth = 1.5;
      cCtx.beginPath();
      cCtx.moveTo(0, y);
      cCtx.bezierCurveTo(
        size * 0.33,
        y + waveA,
        size * 0.66,
        y - waveB,
        size,
        y
      );
      cCtx.stroke();

      const bLum = Math.floor(118 + tone * 24);
      bCtx.strokeStyle = `rgb(${bLum},${bLum},${bLum})`;
      bCtx.lineWidth = 1.6;
      bCtx.beginPath();
      bCtx.moveTo(0, y);
      bCtx.bezierCurveTo(
        size * 0.33,
        y + waveA,
        size * 0.66,
        y - waveB,
        size,
        y
      );
      bCtx.stroke();
    }

    // Painterly sumi-e ink-wash blotches (soft organic mountain pigment washes)
    for (let i = 0; i < 42; i++) {
      const cx = seededRand(i * 19.3) * size;
      const cy = seededRand(i * 23.7) * size;
      const rx = 28 + seededRand(i * 7.1) * 64;
      const ry = 18 + seededRand(i * 11.3) * 44;
      const grad = cCtx.createRadialGradient(cx, cy, 4, cx, cy, rx);
      grad.addColorStop(0, "rgba(86, 70, 62, 0.065)");
      grad.addColorStop(0.6, "rgba(104, 86, 76, 0.025)");
      grad.addColorStop(1, "rgba(104, 86, 76, 0)");
      cCtx.save();
      cCtx.translate(cx, cy);
      cCtx.rotate((seededRand(i * 5.9) - 0.5) * Math.PI);
      cCtx.scale(1, ry / rx);
      cCtx.fillStyle = grad;
      cCtx.beginPath();
      cCtx.arc(0, 0, rx, 0, Math.PI * 2);
      cCtx.fill();
      cCtx.restore();
    }

    // Sumi-e dry-brush mountain contour strokes (varied curved calligraphic sweeps)
    for (let i = 0; i < 95; i++) {
      const x = seededRand(i * 4.7) * size;
      const y = seededRand(i * 6.9) * size;
      const w = 24 + seededRand(i * 9.3) * 76;
      const tilt = (seededRand(i * 11.7) - 0.5) * 1.15;
      const thickness = 2.5 + seededRand(i * 13.1) * 7.5;
      const alpha = 0.04 + seededRand(i * 15.9) * 0.065;

      cCtx.save();
      cCtx.translate(x, y);
      cCtx.rotate(tilt);
      for (let br = -2; br <= 2; br++) {
        cCtx.strokeStyle = `rgba(70, 56, 50, ${(alpha * (1 - Math.abs(br) * 0.16)).toFixed(3)})`;
        cCtx.lineWidth = Math.max(0.8, thickness * 0.28);
        cCtx.beginPath();
        cCtx.moveTo(-w * 0.5, br * (thickness * 0.34));
        cCtx.quadraticCurveTo(
          0,
          br * (thickness * 0.34) + (seededRand(i + br * 9) - 0.5) * 9,
          w * 0.5,
          br * (thickness * 0.34)
        );
        cCtx.stroke();
      }
      cCtx.restore();

      bCtx.save();
      bCtx.translate(x, y);
      bCtx.rotate(tilt);
      const bumpVal = i % 2 === 0 ? 152 : 106;
      bCtx.strokeStyle = `rgba(${bumpVal},${bumpVal},${bumpVal},0.42)`;
      bCtx.lineWidth = thickness * 0.65;
      bCtx.beginPath();
      bCtx.moveTo(-w * 0.5, 0);
      bCtx.lineTo(w * 0.5, 0);
      bCtx.stroke();
      bCtx.restore();
    }

    // Fine mineral ink speckles & handmade washi mulberry fibers
    for (let i = 0; i < 1400; i++) {
      const x = seededRand(i * 2.3 + 50) * size;
      const y = seededRand(i * 3.7 + 90) * size;
      const r = 0.6 + seededRand(i * 5.9) * 2.0;
      const isDark = i % 3 !== 0;
      cCtx.fillStyle = isDark
        ? `rgba(78, 60, 52, ${(0.03 + seededRand(i * 8.1) * 0.055).toFixed(3)})`
        : `rgba(255, 251, 245, 0.08)`;
      cCtx.beginPath();
      cCtx.arc(x, y, r, 0, Math.PI * 2);
      cCtx.fill();

      const bl = isDark ? 104 : 154;
      bCtx.fillStyle = `rgba(${bl},${bl},${bl},0.35)`;
      bCtx.beginPath();
      bCtx.arc(x, y, r * 1.15, 0, Math.PI * 2);
      bCtx.fill();
    }

    paintWashiFibers(cCtx, size, size, 280, 300, 0.085, 0.16);
    paintWashiFibers(bCtx, size, size, 170, 300, 0.14, 0.14);
  }

  const color = new THREE.CanvasTexture(cCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  color.wrapS = THREE.RepeatWrapping;
  color.wrapT = THREE.RepeatWrapping;
  color.repeat.set(11, 11);
  color.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(bCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(11, 11);
  bump.anisotropy = maxAnisotropy;

  return { color, bump };
}

/**
 * 2. Hand-Inked Japanese Granite & Moss-Flecked Stone Textures (for flagstones, boulders, steles).
 */
function createJapaneseStoneTextures(maxAnisotropy: number): {
  color: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 256;
  const cCanvas = document.createElement("canvas");
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext("2d");

  const bCanvas = document.createElement("canvas");
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext("2d");

  if (cCtx && bCtx) {
    cCtx.fillStyle = "#F0E8DE";
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = "#808080";
    bCtx.fillRect(0, 0, size, size);

    // Granite mineral flecks & soft moss dappling
    for (let i = 0; i < 1600; i++) {
      const x = seededRand(i * 3.3 + 12) * size;
      const y = seededRand(i * 5.1 + 29) * size;
      const r = 0.7 + seededRand(i * 7.9) * 2.8;
      const roll = seededRand(i * 11.3);
      if (roll < 0.14) {
        // Subtle Japanese garden moss fleck
        cCtx.fillStyle = "rgba(86, 102, 82, 0.16)";
      } else if (roll < 0.62) {
        cCtx.fillStyle = "rgba(62, 50, 46, 0.11)";
      } else {
        cCtx.fillStyle = "rgba(255, 250, 244, 0.14)";
      }
      cCtx.beginPath();
      cCtx.arc(x, y, r, 0, Math.PI * 2);
      cCtx.fill();

      const lum = roll < 0.5 ? 96 : 162;
      bCtx.fillStyle = `rgba(${lum},${lum},${lum},0.42)`;
      bCtx.beginPath();
      bCtx.arc(x, y, r, 0, Math.PI * 2);
      bCtx.fill();
    }

    // Chiseled woodblock stone hatching & hairline mineral veins
    for (let j = 0; j < 28; j++) {
      const y = seededRand(j * 9.1) * size;
      const x0 = seededRand(j * 4.3) * size * 0.4;
      const x1 = x0 + 48 + seededRand(j * 6.7) * 140;
      const dy = (seededRand(j * 12.1) - 0.5) * 18;
      cCtx.strokeStyle = "rgba(56, 44, 42, 0.18)";
      cCtx.lineWidth = 1.1;
      cCtx.beginPath();
      cCtx.moveTo(x0, y);
      cCtx.quadraticCurveTo((x0 + x1) * 0.5, y + dy, x1, y + dy * 0.5);
      cCtx.stroke();

      bCtx.strokeStyle = "rgba(72,72,72,0.55)";
      bCtx.lineWidth = 1.6;
      bCtx.beginPath();
      bCtx.moveTo(x0, y);
      bCtx.quadraticCurveTo((x0 + x1) * 0.5, y + dy, x1, y + dy * 0.5);
      bCtx.stroke();
    }
  }

  const color = new THREE.CanvasTexture(cCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  color.wrapS = THREE.RepeatWrapping;
  color.wrapT = THREE.RepeatWrapping;
  color.repeat.set(2, 2);
  color.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(bCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(2, 2);
  bump.anisotropy = maxAnisotropy;

  return { color, bump };
}

/**
 * 3. Traditional Ukiyo-e Pine-Needle Fan Foliage (Matsu) & Scaly Bark Textures.
 * Paints layered Japanese woodblock pine needle fans radiating in delicate arcs
 * so pine boughs read as hand-inked print foliage rather than bare polygons.
 */
function createUkiyoePineTextures(maxAnisotropy: number): {
  foliageColor: THREE.CanvasTexture;
  foliageBump: THREE.CanvasTexture;
  barkColor: THREE.CanvasTexture;
} {
  const size = 512;
  const fCanvas = document.createElement("canvas");
  fCanvas.width = size;
  fCanvas.height = size;
  const fCtx = fCanvas.getContext("2d");

  const fbCanvas = document.createElement("canvas");
  fbCanvas.width = size;
  fbCanvas.height = size;
  const fbCtx = fbCanvas.getContext("2d");

  if (fCtx && fbCtx) {
    // Rich ink-pine base (kept slightly bright so instanced color tints cleanly)
    fCtx.fillStyle = "#B8C7B7";
    fCtx.fillRect(0, 0, size, size);
    fbCtx.fillStyle = "#707070";
    fbCtx.fillRect(0, 0, size, size);

    // Draw 95 stylized Hokusai/ukiyo-e radiating pine-needle fan rosettes
    for (let i = 0; i < 95; i++) {
      const cx = seededRand(i * 5.7) * size;
      const cy = seededRand(i * 8.3) * size;
      const radius = 22 + seededRand(i * 11.9) * 26;
      const needles = 11 + Math.floor(seededRand(i * 14.3) * 6);
      const startAngle = -Math.PI * 0.92 + (seededRand(i * 17.1) - 0.5) * 0.5;
      const sweep = Math.PI * 0.85;

      // Soft dark ink shadow puddle under each rosette
      fCtx.fillStyle = "rgba(38, 52, 42, 0.24)";
      fCtx.beginPath();
      fCtx.arc(cx, cy + 4, radius * 0.55, 0, Math.PI * 2);
      fCtx.fill();

      for (let n = 0; n < needles; n++) {
        const a = startAngle + (n / (needles - 1)) * sweep;
        const rLen = radius * (0.78 + seededRand(i * 31 + n * 7) * 0.3);
        const nx = cx + Math.cos(a) * rLen;
        const ny = cy + Math.sin(a) * rLen;

        // Inked outer needle stroke
        fCtx.strokeStyle =
          n % 3 === 0
            ? "rgba(232, 238, 224, 0.52)"
            : "rgba(42, 58, 46, 0.58)";
        fCtx.lineWidth = n % 3 === 0 ? 1.5 : 2.1;
        fCtx.lineCap = "round";
        fCtx.beginPath();
        fCtx.moveTo(cx, cy);
        fCtx.lineTo(nx, ny);
        fCtx.stroke();

        fbCtx.strokeStyle = n % 3 === 0 ? "rgba(215,215,215,0.65)" : "rgba(95,95,95,0.5)";
        fbCtx.lineWidth = 2.0;
        fbCtx.beginPath();
        fbCtx.moveTo(cx, cy);
        fbCtx.lineTo(nx, ny);
        fbCtx.stroke();
      }
    }

    paintWashiFibers(fCtx, size, size, 120, 900, 0.08, 0.1);
  }

  // Japanese black pine (kuromatsu) inked bark texture
  const barkSize = 256;
  const kCanvas = document.createElement("canvas");
  kCanvas.width = barkSize;
  kCanvas.height = barkSize;
  const kCtx = kCanvas.getContext("2d");

  if (kCtx) {
    kCtx.fillStyle = "#4A3C37";
    kCtx.fillRect(0, 0, barkSize, barkSize);

    // Scaly bark plates with dark sumi-e ink outlines
    for (let i = 0; i < 64; i++) {
      const bx = seededRand(i * 4.1) * barkSize;
      const by = seededRand(i * 6.7) * barkSize;
      const bw = 14 + seededRand(i * 8.3) * 20;
      const bh = 24 + seededRand(i * 10.9) * 38;
      kCtx.fillStyle = i % 2 === 0 ? "#574741" : "#3E322E";
      kCtx.strokeStyle = "rgba(26, 20, 19, 0.65)";
      kCtx.lineWidth = 2;
      kCtx.beginPath();
      kCtx.ellipse(bx, by, bw * 0.5, bh * 0.5, 0.08, 0, Math.PI * 2);
      kCtx.fill();
      kCtx.stroke();
    }
  }

  const foliageColor = new THREE.CanvasTexture(fCanvas);
  foliageColor.colorSpace = THREE.SRGBColorSpace;
  foliageColor.wrapS = THREE.RepeatWrapping;
  foliageColor.wrapT = THREE.RepeatWrapping;
  foliageColor.repeat.set(2, 2);
  foliageColor.anisotropy = maxAnisotropy;

  const foliageBump = new THREE.CanvasTexture(fbCanvas);
  foliageBump.wrapS = THREE.RepeatWrapping;
  foliageBump.wrapT = THREE.RepeatWrapping;
  foliageBump.repeat.set(2, 2);
  foliageBump.anisotropy = maxAnisotropy;

  const barkColor = new THREE.CanvasTexture(kCanvas);
  barkColor.colorSpace = THREE.SRGBColorSpace;
  barkColor.wrapS = THREE.RepeatWrapping;
  barkColor.wrapT = THREE.RepeatWrapping;
  barkColor.repeat.set(1, 3);
  barkColor.anisotropy = maxAnisotropy;

  return { foliageColor, foliageBump, barkColor };
}

/**
 * 4. Traditional Japanese Seigaiha (Ocean Wave) Indigo-Charcoal Kimono Cloak Texture.
 */
function createKimonoWeaveTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Deep sumi-indigo charcoal cloth
    ctx.fillStyle = "#2A2428";
    ctx.fillRect(0, 0, size, size);

    // Subtle woven linen slub
    for (let y = 0; y < size; y += 2) {
      ctx.fillStyle = y % 4 === 0 ? "rgba(243,233,222,0.035)" : "rgba(12,10,12,0.06)";
      ctx.fillRect(0, y, size, 1);
    }

    // Restrained traditional Seigaiha concentric wave arcs in muted warm ivory-grey
    const stepX = 32;
    const stepY = 16;
    ctx.lineWidth = 1.25;
    for (let row = -1; row <= size / stepY + 2; row++) {
      const y = row * stepY;
      const offsetX = row % 2 === 0 ? 0 : stepX * 0.5;
      for (let col = -1; col <= size / stepX + 2; col++) {
        const x = col * stepX + offsetX;
        // Fill mask behind wave fan so overlapping arcs tile cleanly
        ctx.fillStyle = "#2A2428";
        ctx.beginPath();
        ctx.arc(x, y, 16, Math.PI, 0);
        ctx.fill();

        for (const r of [15, 11, 7, 3.5]) {
          ctx.strokeStyle =
            r === 15 ? "rgba(218, 200, 184, 0.24)" : "rgba(186, 168, 155, 0.14)";
          ctx.beginPath();
          ctx.arc(x, y, r, Math.PI, 0);
          ctx.stroke();
        }
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * 5. Traditional Japanese Woven Bamboo/Rattan (Ajiro-ami) Backpack Texture.
 */
function createRattanWeaveTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#9F7E59";
    ctx.fillRect(0, 0, size, size);

    const cell = 16;
    for (let y = 0; y < size; y += cell) {
      for (let x = 0; x < size; x += cell) {
        const alt = ((x / cell) + (y / cell)) % 2 === 0;
        ctx.fillStyle = alt ? "#B08E67" : "#8E6E4B";
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);

        // Bamboo split highlight + dark ink shadow line
        ctx.strokeStyle = "rgba(56, 38, 24, 0.45)";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);

        ctx.strokeStyle = "rgba(245, 228, 198, 0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (alt) {
          ctx.moveTo(x + 2, y + cell * 0.5);
          ctx.lineTo(x + cell - 2, y + cell * 0.5);
        } else {
          ctx.moveTo(x + cell * 0.5, y + 2);
          ctx.lineTo(x + cell * 0.5, y + cell - 2);
        }
        ctx.stroke();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * 6. Burgundy (#792B33) Japanese Chirimen Silk Crepe Texture for the scarf & obi sash.
 */
function createBurgundyChirimenTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#792B33";
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x += 4) {
        const v = seededRand(x * 7.1 + y * 13.3);
        ctx.fillStyle =
          v > 0.65
            ? "rgba(243, 233, 222, 0.1)"
            : v < 0.25
              ? "rgba(42, 12, 16, 0.16)"
              : "rgba(155, 62, 70, 0.08)";
        ctx.fillRect(x, y, 3, 2);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * 7. Hand-Inked Woven Bamboo Straw Kasa Hat Texture (ukiyo-e linework).
 */
function createStrawHatTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, "#DEC39A");
    grad.addColorStop(0.55, "#CEAD7E");
    grad.addColorStop(1, "#BA9668");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Concentric woven bamboo bands with hand-inked dark woodblock edges
    for (let y = 0; y < size; y += 8) {
      ctx.fillStyle =
        y % 16 === 0
          ? "rgba(130, 92, 52, 0.28)"
          : "rgba(248, 234, 206, 0.24)";
      ctx.fillRect(0, y, size, 4);
      ctx.strokeStyle = "rgba(68, 46, 28, 0.32)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // Radial bamboo ribs
    ctx.strokeStyle = "rgba(74, 50, 30, 0.36)";
    ctx.lineWidth = 1.25;
    for (let x = 0; x < size; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * 8. Soft radial contact shadow texture for grounding the cat and stone landmarks.
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const grad = ctx.createRadialGradient(
      size * 0.5,
      size * 0.5,
      size * 0.04,
      size * 0.5,
      size * 0.5,
      size * 0.48
    );
    grad.addColorStop(0, "rgba(40, 28, 27, 0.52)");
    grad.addColorStop(0.55, "rgba(40, 28, 27, 0.22)");
    grad.addColorStop(1, "rgba(40, 28, 27, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 9. Ukiyo-e Bokashi Sky Dome Texture (Washi paper sky with soft woodblock cloud bands
 * and a muted morning sun disc resting near the far horizon).
 */
function createJapaneseSkyTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Traditional ukiyo-e bokashi (hand-wiped woodblock ink gradation) matched to warm ivory #F3E9DE
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0.0, "#F1E4D5"); // Warm sunlit washi zenith
    skyGrad.addColorStop(0.26, "#F7EEE2"); // Airy open ivory upper sky
    skyGrad.addColorStop(0.45, "#F2E2D0"); // Delicate warm rose-gold horizon bokashi
    skyGrad.addColorStop(0.62, "#F6EDE2"); // Seamless blend into #F3E9DE valley fog
    skyGrad.addColorStop(1.0, "#F6EDE2");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle horizontal woodblock grain across upper sky (Hiroshige print sky feel)
    for (let y = 12; y < h * 0.56; y += 6) {
      const fade = 1 - y / (h * 0.56);
      ctx.strokeStyle = `rgba(160, 126, 98, ${(0.035 * fade).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Poetic Japanese morning sun disc aligned straight ahead along the -Z valley (u ≈ 0.77 on SphereGeometry)
    const sunX = w * 0.77;
    const sunY = h * 0.39;
    const sunHalo = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 68);
    sunHalo.addColorStop(0, "rgba(176, 86, 84, 0.28)");
    sunHalo.addColorStop(0.45, "rgba(196, 124, 108, 0.12)");
    sunHalo.addColorStop(1, "rgba(246, 237, 226, 0)");
    ctx.fillStyle = sunHalo;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 68, 0, Math.PI * 2);
    ctx.fill();

    // Soft muted vermilion-burgundy sun disc
    ctx.fillStyle = "rgba(154, 62, 68, 0.34)";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 21, 0, Math.PI * 2);
    ctx.fill();

    // Stylized byobu / ukiyo-e kasumi (elongated horizontal gold-ivory cloud ribbons framing the -Z horizon)
    const clouds = [
      { x: 660, y: 175, rw: 120, rh: 12, a: 0.55 },
      { x: 830, y: 204, rw: 145, rh: 13, a: 0.52 },
      { x: 745, y: 232, rw: 165, rh: 14, a: 0.46 },
      { x: 580, y: 218, rw: 130, rh: 12, a: 0.44 },
      { x: 920, y: 184, rw: 110, rh: 11, a: 0.42 },
      { x: 240, y: 196, rw: 160, rh: 13, a: 0.36 },
    ];
    for (const c of clouds) {
      const grad = ctx.createLinearGradient(c.x - c.rw, c.y, c.x + c.rw, c.y);
      grad.addColorStop(0, "rgba(255, 251, 245, 0)");
      grad.addColorStop(0.22, `rgba(255, 252, 246, ${c.a})`);
      grad.addColorStop(0.78, `rgba(255, 252, 246, ${c.a})`);
      grad.addColorStop(1, "rgba(255, 251, 245, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(c.x - c.rw, c.y - c.rh * 0.5, c.rw * 2, c.rh, c.rh);
      ctx.fill();

      // Delicate warm ochre-gold ink underside line
      ctx.strokeStyle = `rgba(176, 138, 108, ${(c.a * 0.36).toFixed(3)})`;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(c.x - c.rw * 0.72, c.y + c.rh * 0.48);
      ctx.lineTo(c.x + c.rw * 0.72, c.y + c.rh * 0.48);
      ctx.stroke();
    }

    paintWashiFibers(ctx, w, h, 380, 1400, 0.045, 0.12);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * 10. Soft painted Japanese kasumi mist veil texture for layered valley fog planes.
 */
function createKasumiMistTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 128;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.clearRect(0, 0, w, h);
    const puffs = [
      { cx: 145, cy: 66, rx: 120, ry: 34, a: 0.46 },
      { cx: 268, cy: 58, rx: 145, ry: 38, a: 0.52 },
      { cx: 378, cy: 70, rx: 112, ry: 30, a: 0.42 },
    ];
    for (const p of puffs) {
      const grad = ctx.createRadialGradient(p.cx, p.cy, 6, p.cx, p.cy, p.rx);
      grad.addColorStop(0, `rgba(247, 240, 232, ${p.a})`);
      grad.addColorStop(0.55, `rgba(243, 233, 222, ${(p.a * 0.5).toFixed(3)})`);
      grad.addColorStop(1, "rgba(243, 233, 222, 0)");
      ctx.save();
      ctx.translate(p.cx, p.cy);
      ctx.scale(1, p.ry / p.rx);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the entire Japanese Art Procedural Texture Suite in one cohesive call.
 */
export function createJapaneseArtTextureSet(
  maxAnisotropy: number
): JapaneseArtTextureSet {
  const terrain = createWashiTerrainTextures(maxAnisotropy);
  const stone = createJapaneseStoneTextures(maxAnisotropy);
  const pine = createUkiyoePineTextures(maxAnisotropy);
  const kimonoColor = createKimonoWeaveTexture(maxAnisotropy);
  const rattanColor = createRattanWeaveTexture(maxAnisotropy);
  const chirimenColor = createBurgundyChirimenTexture(maxAnisotropy);
  const strawHatColor = createStrawHatTexture(maxAnisotropy);
  const contactShadow = createContactShadowTexture();
  const skyColor = createJapaneseSkyTexture(maxAnisotropy);
  const mistBandColor = createKasumiMistTexture();

  const all = [
    terrain.color,
    terrain.bump,
    stone.color,
    stone.bump,
    pine.foliageColor,
    pine.foliageBump,
    pine.barkColor,
    kimonoColor,
    rattanColor,
    chirimenColor,
    strawHatColor,
    contactShadow,
    skyColor,
    mistBandColor,
  ];

  return {
    terrainColor: terrain.color,
    terrainBump: terrain.bump,
    stoneColor: stone.color,
    stoneBump: stone.bump,
    pineFoliageColor: pine.foliageColor,
    pineFoliageBump: pine.foliageBump,
    pineBarkColor: pine.barkColor,
    kimonoColor,
    rattanColor,
    chirimenColor,
    strawHatColor,
    contactShadow,
    skyColor,
    mistBandColor,
    disposeAll() {
      for (const tex of all) tex.dispose();
    },
  };
}

/**
 * Engraved Japanese stone stele front plaque texture ("01", "02", "03" + Burgundy hanko seal)
 * with weathered washi/granite grain and traditional woodblock double-line corner frame.
 */
function createSteleEngravingTexture(
  numberLabel: string,
  companyName: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const w = 256;
  const h = 384;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#EAE0D4";
    ctx.fillRect(0, 0, w, h);

    // Granite & washi grain speckles
    for (let i = 0; i < 780; i++) {
      const x = seededRand(i * 2.7 + numberLabel.charCodeAt(1)) * w;
      const y = seededRand(i * 4.3 + 9) * h;
      const r = 0.8 + seededRand(i * 6.1) * 2.4;
      const alpha = 0.05 + seededRand(i * 8.9) * 0.08;
      ctx.fillStyle =
        i % 2 === 0
          ? `rgba(58,42,40,${alpha})`
          : `rgba(252,246,238,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    paintWashiFibers(ctx, w, h, 85, numberLabel.charCodeAt(1) * 19, 0.08, 0.14);

    // Traditional ukiyo-e double-ruled cartouche frame
    ctx.strokeStyle = "rgba(121, 43, 51, 0.62)";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 22, w - 40, h - 44);
    ctx.strokeStyle = "rgba(121, 43, 51, 0.28)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 30, w - 56, h - 60);

    // Signature Burgundy hanko artist seal with stylized internal stroke mark
    ctx.fillStyle = "#792B33";
    ctx.fillRect(w / 2 - 22, 50, 44, 44);
    ctx.strokeStyle = "#F3E9DE";
    ctx.lineWidth = 2.6;
    ctx.strokeRect(w / 2 - 15, 57, 30, 30);
    // Stylized vertical seal calligraphy bar inside hanko
    ctx.beginPath();
    ctx.moveTo(w / 2, 62);
    ctx.lineTo(w / 2, 82);
    ctx.moveTo(w / 2 - 9, 70);
    ctx.lineTo(w / 2 + 9, 70);
    ctx.stroke();

    // Engraved woodblock numeral
    ctx.fillStyle = "#792B33";
    ctx.font = "700 84px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(numberLabel, w / 2, 186);

    // Hairline rule with ink-tapered ends
    ctx.fillStyle = "rgba(121, 43, 51, 0.72)";
    ctx.fillRect(w / 2 - 48, 242, 96, 3.5);

    // Crisp engraved company name
    ctx.fillStyle = "#3B1E21";
    ctx.font = "700 28px sans-serif";
    ctx.fillText(companyName.toUpperCase(), w / 2, 294);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Builds the atmospheric Japanese ukiyo-e bokashi sky dome + layered 3D valley kasumi mist veils.
 */
export function buildJapaneseAtmosphereGroup(
  textures: JapaneseArtTextureSet
): THREE.Group {
  const group = new THREE.Group();

  // 1. Wide painted Japanese washi & bokashi sky dome (fog: false so clouds & sun stay softly visible)
  const skyGeo = new THREE.SphereGeometry(158, 32, 20);
  const skyMat = new THREE.MeshBasicMaterial({
    map: textures.skyColor,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.position.set(0, -14, -22);
  group.add(skyDome);

  // 2. Three delicate translucent horizontal kasumi mist ribbons nestled in the distant mountain valley
  const mistMat = new THREE.MeshBasicMaterial({
    map: textures.mistBandColor,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mistBands = [
    { x: -12, y: 4.8, z: -18, w: 34, h: 6.5, yaw: 0.14 },
    { x: 10, y: 6.2, z: -42, w: 42, h: 7.5, yaw: -0.1 },
    { x: -4, y: 8.4, z: -76, w: 68, h: 11.5, yaw: 0.04 },
  ];
  for (const mb of mistBands) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(mb.w, mb.h), mistMat);
    plane.position.set(mb.x, mb.y, mb.z);
    plane.rotation.y = mb.yaw;
    group.add(plane);
  }

  return group;
}

/**
 * Builds the continuous 180m x 176m 3D Japanese mountain terrain mesh with washi
 * paper grain, sumi-e dry-brush rock strokes, and seamlessly carved footpath.
 */
export function buildMountainTerrainMesh(
  textures: JapaneseArtTextureSet
): THREE.Mesh {
  const width = 180;
  const depth = 176;
  const segX = 124;
  const segZ = 120;

  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);

  // Spans X: [-90..+90] and Z: [-126..+50] well past the playable trail into distant horizon silhouettes
  geo.translate(0, 0, -38);

  const posAttr = geo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);

  const colPathCore = new THREE.Color("#E2D4C3");
  const colPathEdge = new THREE.Color("#BDA996");
  const colFoothill = new THREE.Color("#CCBFAD");
  const colMossSlope = new THREE.Color("#9AA48C");
  const colRockMid = new THREE.Color("#6B605B");
  const colRockPeak = new THREE.Color("#3D3535");
  const colDistantMist = new THREE.Color("#E8DDD1");
  const tmpColor = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = getMountainTerrainHeight(x, z);
    posAttr.setY(i, y);
  }
  geo.computeVertexNormals();

  const normAttr = geo.attributes.normal;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const ny = normAttr.getY(i);
    const slope = 1 - ny;

    const trail = getNearestTrailMetrics(x, z);
    const elevAboveTrail = Math.max(0, y - trail.trailY);

    // 1. Warm earth foothill ground with subtle organic Japanese moss patches
    const mossFactor = THREE.MathUtils.clamp(
      (Math.sin(x * 0.14 + z * 0.11) * 0.5 + 0.5) * 0.58,
      0,
      0.58
    );
    tmpColor.copy(colFoothill).lerp(colMossSlope, mossFactor);

    // 2. Sculpted Japanese sumi-e ink-rock shading driven by elevation & cliff steepness
    const rockBlend = THREE.MathUtils.clamp(
      slope * 2.4 + elevAboveTrail * 0.115,
      0,
      1
    );
    tmpColor.lerp(colRockMid, rockBlend * 0.85);

    const peakDarkBlend = THREE.MathUtils.clamp(
      (elevAboveTrail - 2.1) * 0.13 + Math.max(0, slope - 0.17) * 1.55,
      0,
      0.88
    );
    tmpColor.lerp(colRockPeak, peakDarkBlend);

    // 3. Soften extreme outer perimeter gently into warm ivory horizon mist
    const edgeDist = Math.max(Math.abs(x) / 86, Math.abs(z + 38) / 82);
    const edgeFade = THREE.MathUtils.smoothstep(edgeDist, 0.76, 1.0);
    tmpColor.lerp(colDistantMist, edgeFade * 0.85);

    // 4. Seamlessly blend the compacted warm-sandstone winding footpath into the hillside
    if (trail.dist < 4.2) {
      const shoulderMask = 1 - THREE.MathUtils.smoothstep(trail.dist, 1.25, 4.0);
      const coreMask = 1 - THREE.MathUtils.smoothstep(trail.dist, 0.85, 1.9);
      tmpColor.lerp(colPathEdge, shoulderMask * 0.86);
      tmpColor.lerp(colPathCore, coreMask * 0.94);
    }

    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: textures.terrainColor,
    bumpMap: textures.terrainBump,
    bumpScale: 0.24,
    roughness: 0.94,
    metalness: 0.01,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

/**
 * Builds instanced beveled 3D weathered flagstones flush along the winding trail
 * using our hand-inked Japanese granite texture.
 */
export function buildSteppingStonesInstanced(
  textures: JapaneseArtTextureSet
): THREE.InstancedMesh {
  const shape = new THREE.Shape();
  shape.moveTo(-0.46, -0.22);
  shape.lineTo(-0.18, -0.34);
  shape.lineTo(0.28, -0.28);
  shape.lineTo(0.48, -0.04);
  shape.lineTo(0.32, 0.26);
  shape.lineTo(-0.16, 0.31);
  shape.lineTo(-0.44, 0.14);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  geo.rotateX(Math.PI / 2);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.stoneColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.075,
    roughness: 0.88,
    metalness: 0.02,
  });

  const count = 64;
  const inst = new THREE.InstancedMesh(geo, mat, count);
  inst.receiveShadow = true;
  inst.castShadow = false;

  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const baseTones = ["#C4B4A2", "#B8A997", "#CCBDA9", "#B0A191"];

  for (let i = 0; i < count; i++) {
    const t = 0.025 + (i / (count - 1)) * 0.94;
    const sample = sampleTrail3D(t);
    const lateral = (i % 2 === 0 ? 1 : -1) * (0.2 + seededRand(i * 4.1) * 0.34);
    const sx = sample.position.x + sample.right.x * lateral;
    const sz = sample.position.z + sample.right.z * lateral;
    const sy = getMountainTerrainHeight(sx, sz) + 0.015;

    dummy.position.set(sx, sy, sz);
    dummy.rotation.set(
      sample.pitchRad * 0.5,
      sample.yawRad + (seededRand(i * 9.3) - 0.5) * 0.7,
      0
    );
    const scaleXZ = 0.78 + seededRand(i * 7.7) * 0.42;
    dummy.scale.set(scaleXZ, 0.85, scaleXZ * (0.82 + seededRand(i * 3.3) * 0.3));
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);

    col.set(baseTones[i % baseTones.length]);
    inst.setColorAt(i, col);
  }

  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  inst.computeBoundingSphere();
  return inst;
}

/**
 * Builds the subtle Burgundy (#792B33) traveled-path sumi ink ribbon flush above the
 * footpath, dynamically extending behind the walking traveler cat via `setDrawRange`.
 */
export function buildTraveledPathRibbon(): PathTraceHandle {
  const segments = 160;
  const halfWidth = 0.13;
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const normals = new Float32Array((segments + 1) * 2 * 3);
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const s = sampleTrail3D(t);
    const y = getMountainTerrainHeight(s.position.x, s.position.z) + 0.055;

    const lx = s.position.x - s.right.x * halfWidth;
    const lz = s.position.z - s.right.z * halfWidth;
    const rx = s.position.x + s.right.x * halfWidth;
    const rz = s.position.z + s.right.z * halfWidth;

    const vi = i * 6;
    positions[vi] = lx;
    positions[vi + 1] = y;
    positions[vi + 2] = lz;
    positions[vi + 3] = rx;
    positions[vi + 4] = y;
    positions[vi + 5] = rz;

    normals[vi] = 0;
    normals[vi + 1] = 1;
    normals[vi + 2] = 0;
    normals[vi + 3] = 0;
    normals[vi + 4] = 1;
    normals[vi + 5] = 0;

    if (i < segments) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geo.setIndex(indices);

  const mat = new THREE.MeshStandardMaterial({
    color: 0x792b33,
    roughness: 0.72,
    metalness: 0.04,
    transparent: true,
    opacity: 0.68,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;

  const totalIndices = indices.length;
  geo.setDrawRange(0, 0);

  return {
    mesh,
    totalIndices,
    setProgress(trailT: number) {
      const clampedSegs = Math.floor(THREE.MathUtils.clamp(trailT, 0, 1) * segments);
      geo.setDrawRange(0, clampedSegs * 6);
    },
  };
}

/**
 * Builds stylized Japanese mountain pines textured with ukiyo-e pine-needle fan brushwork
 * and scaly kuromatsu bark, plus moss-flecked trailside boulders and grass blades.
 */
export function buildMountainFloraGroup(
  textures: JapaneseArtTextureSet
): THREE.Group {
  const floraGroup = new THREE.Group();

  // 1. Multi-part Stylized Japanese Pine Trees
  const pineTrunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.12, 0.85, 0.06),
    new THREE.Vector3(-0.08, 1.75, -0.05),
    new THREE.Vector3(0.06, 2.55, 0.04),
  ]);
  const trunkGeo = new THREE.TubeGeometry(pineTrunkCurve, 10, 0.115, 7, false);
  const branchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.04, 1.55, 0),
    new THREE.Vector3(0.45, 1.78, 0.14),
    new THREE.Vector3(0.88, 1.88, 0.22),
  ]);
  const branchGeo = new THREE.TubeGeometry(branchCurve, 6, 0.058, 6, false);

  const canopyGeo = new THREE.DodecahedronGeometry(0.78, 1);
  canopyGeo.scale(1.26, 0.56, 1.14);

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.pineBarkColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.08,
    roughness: 0.92,
    metalness: 0.02,
  });

  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.pineFoliageColor,
    bumpMap: textures.pineFoliageBump,
    bumpScale: 0.14,
    roughness: 0.82,
    metalness: 0.02,
    flatShading: false,
  });

  const pineSpots: ReadonlyArray<{ x: number; z: number; scale: number; yaw: number }> = [
    { x: 8.6, z: 18.5, scale: 0.96, yaw: 2.1 },
    { x: 11.4, z: 9.8, scale: 1.12, yaw: 3.4 },
    { x: -12.6, z: 4.5, scale: 0.98, yaw: 0.8 },
    { x: 12.2, z: 1.2, scale: 1.16, yaw: 4.5 },
    { x: -9.8, z: -2.4, scale: 1.1, yaw: 2.6 },
    { x: 11.5, z: -7.2, scale: 1.28, yaw: 5.1 },
    { x: -6.4, z: -10.8, scale: 0.94, yaw: 1.7 },
    { x: 8.0, z: -14.6, scale: 1.14, yaw: 3.9 },
    { x: -13.6, z: -16.8, scale: 1.24, yaw: 0.3 },
    { x: 5.2, z: -19.8, scale: 0.88, yaw: 2.4 },
    { x: -15.6, z: -24.5, scale: 1.32, yaw: 4.1 },
    { x: 7.8, z: -26.8, scale: 1.14, yaw: 1.5 },
    { x: -12.0, z: -31.5, scale: 1.04, yaw: 5.6 },
    { x: 5.6, z: -34.6, scale: 0.94, yaw: 0.9 },
    { x: -10.8, z: -38.8, scale: 1.2, yaw: 3.2 },
    { x: 12.0, z: -40.8, scale: 1.26, yaw: 2.0 },
    { x: -6.2, z: -44.5, scale: 0.92, yaw: 4.8 },
    { x: 13.8, z: -47.8, scale: 1.3, yaw: 1.1 },
    { x: -10.2, z: -51.4, scale: 1.16, yaw: 3.7 },
    { x: 10.6, z: -55.4, scale: 1.1, yaw: 5.2 },
    { x: -8.6, z: -59.8, scale: 1.2, yaw: 0.6 },
    { x: 9.8, z: -63.4, scale: 1.14, yaw: 2.9 },
    // Distant ridge accents
    { x: 18.4, z: -13.5, scale: 1.36, yaw: 4.2 },
    { x: -20.2, z: -33.5, scale: 1.4, yaw: 2.3 },
    { x: 19.0, z: -36.5, scale: 1.3, yaw: 5.0 },
  ];

  const count = pineSpots.length;
  const trunkInst = new THREE.InstancedMesh(trunkGeo, barkMat, count);
  const branchInst = new THREE.InstancedMesh(branchGeo, barkMat, count);
  const canopyInst = new THREE.InstancedMesh(canopyGeo, foliageMat, count * 4);

  trunkInst.castShadow = true;
  trunkInst.receiveShadow = true;
  branchInst.castShadow = true;
  canopyInst.castShadow = true;
  canopyInst.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  // Slightly brighter instance tints because pineFoliageColor carries dark inked needle fans
  const pineGreens = ["#45594B", "#526756", "#3C4E42", "#5C6E5B"];

  for (let i = 0; i < count; i++) {
    const spot = pineSpots[i];
    const groundY = getMountainTerrainHeight(spot.x, spot.z) - 0.16;

    dummy.position.set(spot.x, groundY, spot.z);
    dummy.rotation.set(0, spot.yaw, (seededRand(i * 3.7) - 0.5) * 0.08);
    dummy.scale.setScalar(spot.scale);
    dummy.updateMatrix();

    trunkInst.setMatrixAt(i, dummy.matrix);
    branchInst.setMatrixAt(i, dummy.matrix);

    const tiers = [
      { ox: 0.06, oy: 2.58, oz: 0.04, sx: 0.96, sy: 0.94, sz: 0.92, tilt: 0.06 },
      { ox: 0.84, oy: 1.96, oz: 0.22, sx: 0.84, sy: 0.78, sz: 0.8, tilt: -0.09 },
      { ox: -0.44, oy: 2.16, oz: -0.22, sx: 0.74, sy: 0.74, sz: 0.72, tilt: 0.08 },
      { ox: 0.14, oy: 2.94, oz: -0.06, sx: 0.62, sy: 0.68, sz: 0.62, tilt: -0.05 },
    ];
    const cosY = Math.cos(spot.yaw);
    const sinY = Math.sin(spot.yaw);

    for (let tIdx = 0; tIdx < 4; tIdx++) {
      const tier = tiers[tIdx];
      const wx = spot.x + (tier.ox * cosY + tier.oz * sinY) * spot.scale;
      const wz = spot.z + (-tier.ox * sinY + tier.oz * cosY) * spot.scale;
      const wy = groundY + tier.oy * spot.scale;

      dummy.position.set(wx, wy, wz);
      dummy.rotation.set(tier.tilt, spot.yaw + tIdx * 1.3, -tier.tilt * 0.7);
      dummy.scale.set(
        spot.scale * tier.sx,
        spot.scale * tier.sy,
        spot.scale * tier.sz
      );
      dummy.updateMatrix();

      const instIdx = i * 4 + tIdx;
      canopyInst.setMatrixAt(instIdx, dummy.matrix);
      tint.set(pineGreens[(i + tIdx) % pineGreens.length]);
      canopyInst.setColorAt(instIdx, tint);
    }
  }

  trunkInst.instanceMatrix.needsUpdate = true;
  branchInst.instanceMatrix.needsUpdate = true;
  canopyInst.instanceMatrix.needsUpdate = true;
  if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  branchInst.computeBoundingSphere();
  canopyInst.computeBoundingSphere();

  floraGroup.add(trunkInst, branchInst, canopyInst);

  // 2. Instanced Weathered Trailside Rocks with Hand-Inked Granite & Moss Texture
  const rockGeo = new THREE.DodecahedronGeometry(0.45, 0);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.stoneColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.1,
    roughness: 0.9,
    metalness: 0.02,
    flatShading: true,
  });
  const rockCount = 42;
  const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rockInst.castShadow = true;
  rockInst.receiveShadow = true;

  const rockTones = ["#8C7F76", "#786C65", "#9C8E84", "#695E59"];
  for (let i = 0; i < rockCount; i++) {
    const t = 0.04 + (i / (rockCount - 1)) * 0.92;
    const s = sampleTrail3D(t);
    const side = i % 2 === 0 ? 1 : -1;
    const dist = 2.0 + seededRand(i * 6.3) * 2.1;
    const rx = s.position.x + s.right.x * side * dist;
    const rz = s.position.z + s.right.z * side * dist;
    const ry = getMountainTerrainHeight(rx, rz) - 0.16;

    dummy.position.set(rx, ry, rz);
    dummy.rotation.set(
      seededRand(i * 2.1) * 1.2,
      seededRand(i * 4.9) * Math.PI * 2,
      seededRand(i * 7.1) * 0.7
    );
    const baseS = 0.52 + seededRand(i * 9.7) * 0.92;
    dummy.scale.set(
      baseS * (1 + seededRand(i + 2) * 0.35),
      baseS * (0.48 + seededRand(i + 5) * 0.3),
      baseS * (0.85 + seededRand(i + 8) * 0.3)
    );
    dummy.updateMatrix();
    rockInst.setMatrixAt(i, dummy.matrix);
    tint.set(rockTones[i % rockTones.length]);
    rockInst.setColorAt(i, tint);
  }
  rockInst.instanceMatrix.needsUpdate = true;
  if (rockInst.instanceColor) rockInst.instanceColor.needsUpdate = true;
  rockInst.computeBoundingSphere();
  floraGroup.add(rockInst);

  // 3. Restrained Trailside Mountain Grass Tufts
  const grassGeo = new THREE.ConeGeometry(0.06, 0.46, 4);
  grassGeo.translate(0, 0.23, 0);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0.0,
  });
  const grassCount = 84;
  const grassInst = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
  const grassTones = ["#64705E", "#757D68", "#546051", "#85856F"];

  for (let i = 0; i < grassCount; i++) {
    const clusterIdx = Math.floor(i / 3);
    const bladeInCluster = i % 3;
    const t = 0.03 + (clusterIdx / 27) * 0.94;
    const s = sampleTrail3D(t);
    const side = clusterIdx % 2 === 0 ? 1 : -1;
    const dist = 1.65 + seededRand(clusterIdx * 5.1) * 1.4;
    const gx = s.position.x + s.right.x * side * dist + (bladeInCluster - 1) * 0.08;
    const gz = s.position.z + s.right.z * side * dist + (bladeInCluster === 1 ? 0.07 : -0.04);
    const gy = getMountainTerrainHeight(gx, gz) - 0.02;

    dummy.position.set(gx, gy, gz);
    dummy.rotation.set(
      (bladeInCluster - 1) * 0.28,
      seededRand(i * 3.9) * Math.PI * 2,
      (bladeInCluster - 1) * 0.22
    );
    const sc = 0.72 + seededRand(i * 8.1) * 0.52;
    dummy.scale.set(sc, sc * (0.9 + bladeInCluster * 0.14), sc);
    dummy.updateMatrix();
    grassInst.setMatrixAt(i, dummy.matrix);
    tint.set(grassTones[i % grassTones.length]);
    grassInst.setColorAt(i, tint);
  }
  grassInst.instanceMatrix.needsUpdate = true;
  if (grassInst.instanceColor) grassInst.instanceColor.needsUpdate = true;
  grassInst.computeBoundingSphere();
  floraGroup.add(grassInst);

  return floraGroup;
}

/**
 * Builds the articulated 12-part procedural 3D Japanese Traveler Cat dressed in
 * textured seigaiha kimono cloth, chirimen silk burgundy scarf, ajiro woven rattan
 * backpack, and hand-inked bamboo kasa hat.
 */
export function buildTravelerCat3D(
  textures: JapaneseArtTextureSet
): TravelerCatRig {
  const root = new THREE.Group();

  // Contact shadow disc grounded just above footpath surface
  const shadowMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.54, 24),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.52,
    })
  );
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // Materials with traditional Japanese textile maps & deliberate roughness contrast
  const cloakMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.kimonoColor,
    roughness: 0.9,
    metalness: 0.03,
  });
  const ivoryFurMat = new THREE.MeshStandardMaterial({
    color: 0xf1e6d8,
    roughness: 0.8,
    metalness: 0.02,
  });
  const burgundyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.chirimenColor,
    roughness: 0.62,
    metalness: 0.06,
  });
  const strawMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.strawHatColor,
    roughness: 0.74,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const packMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.rattanColor,
    roughness: 0.86,
    metalness: 0.02,
  });
  const packFlapMat = new THREE.MeshStandardMaterial({
    color: 0xdcc4a6,
    map: textures.rattanColor,
    roughness: 0.88,
    metalness: 0.02,
  });
  const woodStaffMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.pineBarkColor,
    roughness: 0.78,
    metalness: 0.04,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a264,
    roughness: 0.28,
    metalness: 0.82,
  });
  const darkInkMat = new THREE.MeshStandardMaterial({
    color: 0x1e191a,
    roughness: 0.35,
    metalness: 0.08,
  });

  // Articulated legs (pivoted at hip y = 0.34)
  const buildLeg = (xOffset: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xOffset, 0.34, 0);

    const shin = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.062, 0.17, 6, 10),
      cloakMat
    );
    shin.position.y = -0.15;
    shin.castShadow = true;
    legPivot.add(shin);

    const paw = new THREE.Mesh(
      new THREE.SphereGeometry(0.072, 10, 8),
      ivoryFurMat
    );
    paw.scale.set(0.95, 0.62, 1.35);
    paw.position.set(0, -0.29, 0.035);
    paw.castShadow = true;
    legPivot.add(paw);

    return legPivot;
  };

  const leftLeg = buildLeg(-0.11);
  const rightLeg = buildLeg(0.11);
  root.add(leftLeg, rightLeg);

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.34;
  root.add(bodyGroup);

  // 1. Sculpted Japanese travel cloak / haori (ordered BOTTOM -> TOP for outward normals)
  const cloakProfile = [
    new THREE.Vector2(0.01, 0.0),
    new THREE.Vector2(0.29, 0.0),
    new THREE.Vector2(0.28, 0.16),
    new THREE.Vector2(0.23, 0.42),
    new THREE.Vector2(0.165, 0.60),
    new THREE.Vector2(0.01, 0.62),
  ];
  const cloakMesh = new THREE.Mesh(
    new THREE.LatheGeometry(cloakProfile, 20),
    cloakMat
  );
  cloakMesh.castShadow = true;
  cloakMesh.receiveShadow = true;
  bodyGroup.add(cloakMesh);

  // Burgundy chirimen silk obi sash
  const obiMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.235, 0.032, 8, 20),
    burgundyMat
  );
  obiMesh.rotation.x = Math.PI / 2;
  obiMesh.position.y = 0.29;
  bodyGroup.add(obiMesh);

  // 2. Woven rattan traveler backpack + rolled ivory sleeping mat
  const packGroup = new THREE.Group();
  packGroup.position.set(0, 0.36, -0.24);

  const packBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.31, 0.34, 0.18),
    packMat
  );
  packBody.castShadow = true;
  packGroup.add(packBody);

  const packFlap = new THREE.Mesh(
    new THREE.BoxGeometry(0.33, 0.09, 0.2),
    packFlapMat
  );
  packFlap.position.set(0, 0.15, 0);
  packGroup.add(packFlap);

  const bedroll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.37, 12),
    ivoryFurMat
  );
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(0, 0.24, -0.01);
  bedroll.castShadow = true;
  packGroup.add(bedroll);

  for (const bx of [-0.1, 0.1]) {
    const tie = new THREE.Mesh(
      new THREE.TorusGeometry(0.071, 0.012, 6, 12),
      burgundyMat
    );
    tie.rotation.y = Math.PI / 2;
    tie.position.set(bx, 0.24, -0.01);
    packGroup.add(tie);
  }
  bodyGroup.add(packGroup);

  // 3. Flowing Burgundy (#792B33) chirimen silk scarf collar + trailing tail
  const scarfCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.175, 0.052, 10, 20),
    burgundyMat
  );
  scarfCollar.rotation.x = Math.PI / 2;
  scarfCollar.position.y = 0.61;
  scarfCollar.castShadow = true;
  bodyGroup.add(scarfCollar);

  const scarfTail = new THREE.Group();
  scarfTail.position.set(-0.08, 0.59, -0.17);
  const scarfCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.06, -0.08, -0.18),
    new THREE.Vector3(-0.12, -0.14, -0.36),
    new THREE.Vector3(-0.16, -0.10, -0.50),
  ]);
  const scarfTailGeo = new THREE.TubeGeometry(scarfCurve, 10, 0.036, 6, false);
  scarfTailGeo.scale(1.5, 0.45, 1);
  const scarfTailMesh = new THREE.Mesh(scarfTailGeo, burgundyMat);
  scarfTailMesh.castShadow = true;
  scarfTail.add(scarfTailMesh);
  bodyGroup.add(scarfTail);

  // 4. Curved articulated feline tail
  const catTail = new THREE.Group();
  catTail.position.set(0, 0.14, -0.24);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.05, 0.03, -0.18),
    new THREE.Vector3(0.14, 0.15, -0.32),
    new THREE.Vector3(0.18, 0.30, -0.35),
  ]);
  const catTailMesh = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 12, 0.032, 8, false),
    cloakMat
  );
  catTailMesh.castShadow = true;
  catTail.add(catTailMesh);
  bodyGroup.add(catTail);

  // 5. Articulated Arms + Seasoned Wood Walking Staff
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.22, 0.52, 0.02);
  const leftSleeve = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.056, 0.18, 6, 10),
    cloakMat
  );
  leftSleeve.position.set(-0.02, -0.12, 0.02);
  leftSleeve.rotation.z = -0.18;
  leftSleeve.castShadow = true;
  leftArm.add(leftSleeve);
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), ivoryFurMat);
  leftHand.position.set(-0.05, -0.24, 0.04);
  leftArm.add(leftHand);
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.22, 0.52, 0.02);
  const rightSleeve = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.056, 0.18, 6, 10),
    cloakMat
  );
  rightSleeve.position.set(0.02, -0.11, 0.05);
  rightSleeve.rotation.set(-0.32, 0, 0.16);
  rightSleeve.castShadow = true;
  rightArm.add(rightSleeve);
  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), ivoryFurMat);
  rightHand.position.set(0.06, -0.22, 0.12);
  rightArm.add(rightHand);

  const staff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.017, 1.38, 8),
    woodStaffMat
  );
  staff.position.set(0.08, -0.18, 0.15);
  staff.rotation.x = 0.08;
  staff.castShadow = true;
  rightArm.add(staff);

  const staffFerrule = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.08, 8),
    brassMat
  );
  staffFerrule.position.set(0.08, 0.45, 0.19);
  rightArm.add(staffFerrule);
  bodyGroup.add(rightArm);

  // 6. Sculpted Cat Head + Ears + Hand-Inked Woven Straw Kasa Hat
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.78, 0.02);
  bodyGroup.add(headGroup);

  const headSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.185, 16, 14),
    ivoryFurMat
  );
  headSphere.scale.set(1.06, 0.94, 0.98);
  headSphere.castShadow = true;
  headGroup.add(headSphere);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.062, 0.145, 4),
      ivoryFurMat
    );
    ear.position.set(side * 0.115, 0.15, 0.01);
    ear.rotation.set(0.08, side * 0.25, -side * 0.24);
    ear.castShadow = true;
    headGroup.add(ear);

    const innerEar = new THREE.Mesh(
      new THREE.ConeGeometry(0.036, 0.095, 4),
      burgundyMat
    );
    innerEar.position.set(side * 0.115, 0.145, 0.032);
    innerEar.rotation.copy(ear.rotation);
    headGroup.add(innerEar);

    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.021, 8, 8),
      darkInkMat
    );
    eye.position.set(side * 0.068, 0.015, 0.162);
    headGroup.add(eye);
  }

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.018, 0.02, 3),
    burgundyMat
  );
  nose.rotation.x = Math.PI;
  nose.position.set(0, -0.022, 0.182);
  headGroup.add(nose);

  const kasaProfile = [
    new THREE.Vector2(0.16, 0.07),
    new THREE.Vector2(0.45, -0.01),
    new THREE.Vector2(0.47, 0.005),
    new THREE.Vector2(0.32, 0.068),
    new THREE.Vector2(0.14, 0.165),
    new THREE.Vector2(0.005, 0.225),
  ];
  const kasaHat = new THREE.Mesh(
    new THREE.LatheGeometry(kasaProfile, 24),
    strawMat
  );
  kasaHat.position.set(0, 0.14, -0.01);
  kasaHat.rotation.x = -0.09;
  kasaHat.castShadow = true;
  kasaHat.receiveShadow = true;
  headGroup.add(kasaHat);

  const hatKnot = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 10, 8),
    burgundyMat
  );
  hatKnot.scale.set(1, 0.65, 1);
  hatKnot.position.set(0, 0.35, -0.03);
  headGroup.add(hatKnot);

  return {
    group: root,
    bodyGroup,
    headGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    scarfTail,
    catTail,
  };
}

/**
 * Builds a composite 6-part carved 3D Japanese stone trail marker (michishirube)
 * with weathered granite texture, woodblock engraved plaque, burgundy hanko seal,
 * mossy plinth, grounded pebbles, and invisible raycast hitbox.
 */
export function buildMilestoneLandmark3D(
  milestone: JourneyMilestone,
  placement: Landmark3DPlacement,
  textures: JapaneseArtTextureSet,
  maxAnisotropy: number
): Landmark3DHandle {
  const group = new THREE.Group();
  group.position.set(placement.position.x, placement.position.y, placement.position.z);
  group.rotation.y = placement.facingYawRad;

  // 1. Soft contact shadow disc
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 22),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  group.add(shadow);

  // 2. Sculpted weathered granite plinth
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0xa99a8e,
    map: textures.stoneColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.08,
    roughness: 0.92,
    metalness: 0.02,
  });
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.68, 0.28, 7),
    plinthMat
  );
  plinth.position.y = 0.14;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // 3. Carved tapered granite stele body
  const steleShape = new THREE.Shape();
  steleShape.moveTo(-0.38, 0);
  steleShape.lineTo(0.38, 0);
  steleShape.lineTo(0.32, 1.52);
  steleShape.quadraticCurveTo(0.30, 1.72, 0, 1.78);
  steleShape.quadraticCurveTo(-0.30, 1.72, -0.32, 1.52);
  steleShape.closePath();

  const steleGeo = new THREE.ExtrudeGeometry(steleShape, {
    depth: 0.32,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  steleGeo.translate(0, 0.26, -0.16);

  const steleMaterial = new THREE.MeshStandardMaterial({
    color: 0xc2b3a4,
    map: textures.stoneColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.065,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0,
    roughness: 0.86,
    metalness: 0.03,
  });
  const steleMesh = new THREE.Mesh(steleGeo, steleMaterial);
  steleMesh.castShadow = true;
  steleMesh.receiveShadow = true;
  group.add(steleMesh);

  // 4. Engraved woodblock stone tablet plaques (front + back)
  const plaqueTex = createSteleEngravingTexture(
    milestone.number,
    milestone.companyName,
    maxAnisotropy
  );
  const plaqueMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: plaqueTex,
    bumpMap: textures.stoneBump,
    bumpScale: 0.025,
    roughness: 0.78,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const frontPlaque = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.18), plaqueMat);
  frontPlaque.position.set(0, 1.12, 0.215);
  group.add(frontPlaque);

  const backPlaque = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.18), plaqueMat);
  backPlaque.rotation.y = Math.PI;
  backPlaque.position.set(0, 1.12, -0.215);
  group.add(backPlaque);

  // 5. Burgundy (#792B33) carved lacquer base collar
  const sealMaterial = new THREE.MeshStandardMaterial({
    color: 0x792b33,
    emissive: new THREE.Color(0x792b33),
    emissiveIntensity: 0.1,
    roughness: 0.45,
    metalness: 0.14,
  });
  const crownBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.065, 0.42),
    sealMaterial
  );
  crownBand.position.set(0, 0.32, 0);
  group.add(crownBand);

  // 6. Grounded base pebbles hugging the plinth
  const pebbleGeo = new THREE.DodecahedronGeometry(0.18, 0);
  const pebblePositions = [
    { x: -0.58, y: 0.08, z: 0.24, s: 1.0 },
    { x: 0.56, y: 0.07, z: -0.18, s: 0.85 },
    { x: -0.42, y: 0.06, z: -0.44, s: 0.75 },
  ];
  for (const pb of pebblePositions) {
    const pebble = new THREE.Mesh(pebbleGeo, plinthMat);
    pebble.position.set(pb.x, pb.y, pb.z);
    pebble.scale.set(pb.s * 1.2, pb.s * 0.65, pb.s);
    pebble.castShadow = true;
    group.add(pebble);
  }

  // Dedicated invisible raycast proxy box for effortless click picking
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 2.5, 1.2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitbox.position.set(0, 1.15, 0);
  hitbox.userData.milestoneId = milestone.id;
  group.add(hitbox);

  const anchorWorld = new THREE.Vector3(
    placement.position.x,
    placement.position.y + 2.38,
    placement.position.z
  );

  return {
    id: milestone.id,
    milestone,
    group,
    hitbox,
    steleMaterial,
    sealMaterial,
    anchorWorld,
  };
}
