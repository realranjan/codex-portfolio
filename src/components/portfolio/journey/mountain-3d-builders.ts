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
 * PROCEDURAL 3D JAPANESE MOUNTAIN ASSET & MATERIAL BUILDERS
 * -------------------------------------------------------------------------------
 * Zero external file / 404 dependencies. All textures (stone micro-grain bump,
 * woven straw kasa, engraved stone stele plaques, soft radial contact shadows)
 * are procedurally synthesized onto HTML5 2D canvases with proper SRGBColorSpace
 * and max anisotropy.
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

// Deterministic pseudo-random helper so every rock, pine, and flagstone layout is 100% stable
function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Procedural grayscale stone/earth micro-grain bump texture (linear color space).
 */
export function createStoneBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 2400; i++) {
      const x = seededRand(i * 3.1) * size;
      const y = seededRand(i * 5.7) * size;
      const r = 1 + seededRand(i * 7.3) * 4.5;
      const lum = Math.floor(96 + seededRand(i * 11.9) * 64);
      ctx.fillStyle = `rgb(${lum},${lum},${lum})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Subtle striated sedimentary mineral lines
    ctx.strokeStyle = "rgba(65,65,65,0.22)";
    ctx.lineWidth = 1.2;
    for (let j = 0; j < 26; j++) {
      const y = (j / 26) * size;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(
        size * 0.33,
        y + (seededRand(j + 40) - 0.5) * 10,
        size * 0.66,
        y + (seededRand(j + 80) - 0.5) * 10,
        size,
        y
      );
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Soft radial contact shadow texture for grounding the cat and stone landmarks.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
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
    grad.addColorStop(0, "rgba(38, 28, 27, 0.52)");
    grad.addColorStop(0.55, "rgba(38, 28, 27, 0.22)");
    grad.addColorStop(1, "rgba(38, 28, 27, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Woven bamboo/straw texture for the traveler cat's traditional Japanese kasa hat.
 */
export function createStrawHatTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#D4B68A";
    ctx.fillRect(0, 0, size, size);

    // Concentric woven straw bands
    for (let y = 0; y < size; y += 8) {
      ctx.fillStyle = y % 16 === 0 ? "rgba(155, 118, 72, 0.26)" : "rgba(242, 224, 192, 0.22)";
      ctx.fillRect(0, y, size, 4);
    }
    // Fine radial stitch lines
    ctx.strokeStyle = "rgba(116, 86, 52, 0.28)";
    ctx.lineWidth = 1;
    for (let x = 0; x < size; x += 12) {
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
 * Engraved Japanese stone stele front plaque texture ("01", "02", "03" + Burgundy hanko seal).
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
    // Crisp recessed ivory-sandstone engraved tablet face
    ctx.fillStyle = "#E6DACE";
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 650; i++) {
      const x = seededRand(i * 2.7 + numberLabel.charCodeAt(1)) * w;
      const y = seededRand(i * 4.3 + 9) * h;
      const r = 0.8 + seededRand(i * 6.1) * 2.4;
      const alpha = 0.05 + seededRand(i * 8.9) * 0.08;
      ctx.fillStyle = i % 2 === 0 ? `rgba(58,42,40,${alpha})` : `rgba(250,244,236,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Recessed vertical carved border
    ctx.strokeStyle = "rgba(121, 43, 51, 0.52)";
    ctx.lineWidth = 5;
    ctx.strokeRect(24, 26, w - 48, h - 52);

    // Signature Burgundy hanko seal stamp near top
    ctx.fillStyle = "#792B33";
    ctx.fillRect(w / 2 - 22, 52, 44, 44);
    ctx.strokeStyle = "#F3E9DE";
    ctx.lineWidth = 3;
    ctx.strokeRect(w / 2 - 14, 60, 28, 28);

    // Engraved stop numeral
    ctx.fillStyle = "#792B33";
    ctx.font = "700 84px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(numberLabel, w / 2, 186);

    // Hairline rule
    ctx.fillStyle = "rgba(121, 43, 51, 0.72)";
    ctx.fillRect(w / 2 - 48, 242, 96, 4);

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
 * Builds the continuous 170m x 150m 3D Japanese mountain terrain mesh.
 * The winding stone/earth footpath is carved directly into the heightfield and
 * seamlessly vertex-blended into warm-stone foothills and ink-charcoal mountain ridges.
 */
export function buildMountainTerrainMesh(
  bumpMap: THREE.CanvasTexture
): THREE.Mesh {
  const width = 180;
  const depth = 176;
  const segX = 124;
  const segZ = 120;

  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);

  // Shift terrain center so it spans X: [-90..+90] and Z: [-126..+50]
  // extending far past the playable trail and distant horizon silhouettes into ivory fog
  geo.translate(0, 0, -38);

  const posAttr = geo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);

  const colPathCore = new THREE.Color("#DFD1C0");
  const colPathEdge = new THREE.Color("#BAA895");
  const colFoothill = new THREE.Color("#C9BCAC");
  const colMossSlope = new THREE.Color("#9BA48F");
  const colRockMid = new THREE.Color("#6B615C");
  const colRockPeak = new THREE.Color("#403737");
  const colDistantMist = new THREE.Color("#E7DCD0");
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
    const slope = 1 - ny; // 0 = flat, higher = steeper rock cliff

    const trail = getNearestTrailMetrics(x, z);
    const elevAboveTrail = Math.max(0, y - trail.trailY);

    // 1. Warm earth foothill ground with subtle organic Japanese moss patches
    const mossFactor = THREE.MathUtils.clamp(
      (Math.sin(x * 0.14 + z * 0.11) * 0.5 + 0.5) * 0.56,
      0,
      0.56
    );
    tmpColor.copy(colFoothill).lerp(colMossSlope, mossFactor);

    // 2. Sculpted Japanese sumi-e ink-rock shading driven by elevation & cliff steepness
    const rockBlend = THREE.MathUtils.clamp(
      slope * 2.35 + elevAboveTrail * 0.11,
      0,
      1
    );
    tmpColor.lerp(colRockMid, rockBlend * 0.84);

    const peakDarkBlend = THREE.MathUtils.clamp(
      (elevAboveTrail - 2.2) * 0.125 + Math.max(0, slope - 0.18) * 1.55,
      0,
      0.88
    );
    tmpColor.lerp(colRockPeak, peakDarkBlend);

    // 3. Soften extreme outer perimeter gently into warm ivory horizon mist
    const edgeDist = Math.max(Math.abs(x) / 80, Math.abs(z + 28) / 74);
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
    roughness: 0.93,
    metalness: 0.02,
    bumpMap,
    bumpScale: 0.12,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

/**
 * Builds instanced beveled 3D weathered flagstones flush along the winding trail.
 */
export function buildSteppingStonesInstanced(
  bumpMap: THREE.CanvasTexture
): THREE.InstancedMesh {
  // Irregular 7-sided hand-hewn stepping stone slab
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
    roughness: 0.86,
    metalness: 0.03,
    bumpMap,
    bumpScale: 0.04,
  });

  const count = 64;
  const inst = new THREE.InstancedMesh(geo, mat, count);
  inst.receiveShadow = true;
  inst.castShadow = false;

  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const baseTones = ["#B8A897", "#AEA090", "#C1B2A1", "#A59688"];

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
 * Builds the subtle Burgundy (#792B33) traveled-path ink ribbon flush above the
 * footpath (`+0.035m` Y offset + polygonOffset so zero Z-fighting), dynamically
 * extending behind the walking traveler cat via `setDrawRange`.
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
 * Builds a restrained collection of sculptural Japanese mountain pines (multi-part
 * curved bark trunks + asymmetric tiered flat foliage canopies) plus instanced
 * trailside rocks and grass blades grounded flush on the terrain.
 */
export function buildMountainFloraGroup(
  bumpMap: THREE.CanvasTexture
): THREE.Group {
  const floraGroup = new THREE.Group();

  // 1. Multi-part Stylized Japanese Pine Trees (32 restrained pines along ridges & foothills)
  const pineTrunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.12, 0.85, 0.06),
    new THREE.Vector3(-0.08, 1.75, -0.05),
    new THREE.Vector3(0.06, 2.55, 0.04),
  ]);
  const trunkGeo = new THREE.TubeGeometry(pineTrunkCurve, 10, 0.11, 6, false);
  const branchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.04, 1.55, 0),
    new THREE.Vector3(0.45, 1.78, 0.14),
    new THREE.Vector3(0.88, 1.88, 0.22),
  ]);
  const branchGeo = new THREE.TubeGeometry(branchCurve, 6, 0.055, 5, false);

  // Faceted irregular Japanese pine needle cluster (natural bonsai-cloud silhouette, not flat UFO discs)
  const canopyGeo = new THREE.DodecahedronGeometry(0.76, 1);
  canopyGeo.scale(1.24, 0.56, 1.12);

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x3b302d,
    roughness: 0.92,
    metalness: 0.02,
    bumpMap,
    bumpScale: 0.05,
  });

  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.02,
    flatShading: true,
  });

  // Curated placements framing ridges & foothills while keeping Scene 01 upper-left sky completely clear
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
  const pineGreens = ["#344238", "#3F4F42", "#2D3A31", "#475647"];

  for (let i = 0; i < count; i++) {
    const spot = pineSpots[i];
    const groundY = getMountainTerrainHeight(spot.x, spot.z) - 0.16;

    dummy.position.set(spot.x, groundY, spot.z);
    dummy.rotation.set(0, spot.yaw, (seededRand(i * 3.7) - 0.5) * 0.08);
    dummy.scale.setScalar(spot.scale);
    dummy.updateMatrix();

    trunkInst.setMatrixAt(i, dummy.matrix);
    branchInst.setMatrixAt(i, dummy.matrix);

    // 4 overlapping irregular tiered Japanese pine bough clouds per tree
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

  // 2. Instanced Weathered Trailside Rocks (48 sculpted rocks grounding the path edges)
  const rockGeo = new THREE.DodecahedronGeometry(0.45, 0);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.02,
    bumpMap,
    bumpScale: 0.06,
    flatShading: true,
  });
  const rockCount = 42;
  const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rockInst.castShadow = true;
  rockInst.receiveShadow = true;

  const rockTones = ["#7E726B", "#6A5F5A", "#8F8279", "#5C524E"];
  for (let i = 0; i < rockCount; i++) {
    const t = 0.04 + (i / (rockCount - 1)) * 0.92;
    const s = sampleTrail3D(t);
    const side = i % 2 === 0 ? 1 : -1;
    // Keep rocks nestled cleanly on the path shoulder & base slopes (never floating high on cliffs)
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

  // 3. Restrained Trailside Mountain Grass Tufts (84 grounded blades hugging trail edges)
  const grassGeo = new THREE.ConeGeometry(0.06, 0.46, 4);
  grassGeo.translate(0, 0.23, 0);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.0,
  });
  const grassCount = 84;
  const grassInst = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
  const grassTones = ["#6C7564", "#7C816E", "#5A6556", "#8B8A74"];

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
 * Builds the articulated 12-part procedural 3D Japanese Traveler Cat.
 * Distinct from the armored Hero samurai cat: wears a matte charcoal travel
 * cloak, Burgundy (#792B33) fluttering scarf, woven straw kasa hat, rattan
 * backpack with bedroll, and carries a seasoned wood walking staff.
 * Pivoted cleanly at bottom-center (y = 0) flush on the trail!
 */
export function buildTravelerCat3D(
  strawTex: THREE.CanvasTexture,
  shadowTex: THREE.CanvasTexture
): TravelerCatRig {
  const root = new THREE.Group();

  // Contact shadow disc grounded just above footpath surface
  const shadowMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.54, 24),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.52,
    })
  );
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // Materials with deliberate roughness contrast (>= 0.25 across adjacent parts)
  const cloakMat = new THREE.MeshStandardMaterial({
    color: 0x2c2627,
    roughness: 0.9,
    metalness: 0.03,
  });
  const ivoryFurMat = new THREE.MeshStandardMaterial({
    color: 0xf1e6d8,
    roughness: 0.78,
    metalness: 0.02,
  });
  const burgundyMat = new THREE.MeshStandardMaterial({
    color: 0x792b33,
    roughness: 0.62,
    metalness: 0.06,
  });
  const strawMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: strawTex,
    roughness: 0.72,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const packMat = new THREE.MeshStandardMaterial({
    color: 0x9b7a58,
    roughness: 0.86,
    metalness: 0.03,
  });
  const woodStaffMat = new THREE.MeshStandardMaterial({
    color: 0x5d4332,
    roughness: 0.76,
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

  // Upper body group (subtle walk bob & lean)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.34;
  root.add(bodyGroup);

  // 1. Sculpted Japanese travel cloak / haori (LatheGeometry ordered BOTTOM -> TOP for outward normals!)
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

  // Subtle Burgundy obi / waist sash tying the travel coat
  const obiMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.235, 0.032, 8, 20),
    burgundyMat
  );
  obiMesh.rotation.x = Math.PI / 2;
  obiMesh.position.y = 0.29;
  bodyGroup.add(obiMesh);

  // 2. Woven rattan traveler backpack + rolled ivory sleeping mat on back (-Z is behind!)
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
    new THREE.MeshStandardMaterial({ color: 0x7e6043, roughness: 0.88 })
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

  // Burgundy cord bindings around bedroll
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

  // 3. Flowing Burgundy (#792B33) traveler scarf collar + articulated trailing tail
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

  // 4. Curved articulated feline tail peeking cleanly from beneath the rear cloak
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

  // 5. Articulated Arms + Seasoned Wood Walking Staff with Brass Ferrule
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

  // Walking staff gripped cleanly in right paw
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

  // 6. Sculpted Cat Head + Triangular Cat Ears + Woven Japanese Straw Kasa Hat
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

  // Pointed cat ears with burgundy inner-ear accents
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

    // Subtle dark ink eyes facing forward (+Z)
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.021, 8, 8),
      darkInkMat
    );
    eye.position.set(side * 0.068, 0.015, 0.162);
    headGroup.add(eye);
  }

  // Tiny nose accent
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.018, 0.02, 3),
    burgundyMat
  );
  nose.rotation.x = Math.PI;
  nose.position.set(0, -0.022, 0.182);
  headGroup.add(nose);

  // Wide conical Japanese straw traveling hat (kasa) — ordered BOTTOM -> TOP for clean outward normals
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
  kasaHat.rotation.x = -0.09; // tilted gently back so cat silhouette & ears peek cleanly
  kasaHat.castShadow = true;
  kasaHat.receiveShadow = true;
  headGroup.add(kasaHat);

  // Small Burgundy crown knot crowning the straw kasa
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
 * with engraved CanvasTexture plaque, burgundy seal trim, mossy base plinth,
 * grounded pebbles, contact shadow, and generous invisible raycast hitbox.
 */
export function buildMilestoneLandmark3D(
  milestone: JourneyMilestone,
  placement: Landmark3DPlacement,
  bumpMap: THREE.CanvasTexture,
  shadowTex: THREE.CanvasTexture,
  maxAnisotropy: number
): Landmark3DHandle {
  const group = new THREE.Group();
  group.position.set(placement.position.x, placement.position.y, placement.position.z);
  group.rotation.y = placement.facingYawRad;

  // 1. Soft contact shadow disc
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 22),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  group.add(shadow);

  // 2. Sculpted weathered stone base plinth
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x9e8f83,
    roughness: 0.92,
    metalness: 0.03,
    bumpMap,
    bumpScale: 0.06,
  });
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.68, 0.28, 7),
    plinthMat
  );
  plinth.position.y = 0.14;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // 3. Carved tapered granite stele body (ExtrudeGeometry with beveled arched top)
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
    color: 0xb4a496,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0,
    roughness: 0.84,
    metalness: 0.04,
    bumpMap,
    bumpScale: 0.055,
  });
  const steleMesh = new THREE.Mesh(steleGeo, steleMaterial);
  steleMesh.castShadow = true;
  steleMesh.receiveShadow = true;
  group.add(steleMesh);

  // 4. Engraved front stone tablet plaque (high-anisotropy CanvasTexture)
  const plaqueTex = createSteleEngravingTexture(
    milestone.number,
    milestone.companyName,
    maxAnisotropy
  );
  const plaqueMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: plaqueTex,
    roughness: 0.72,
    metalness: 0.03,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const frontPlaque = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.18), plaqueMat);
  frontPlaque.position.set(0, 1.12, 0.215);
  group.add(frontPlaque);

  // Duplicate plaque cleanly on back face so it reads nicely even during Scene 06 pullback
  const backPlaque = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.18), plaqueMat);
  backPlaque.rotation.y = Math.PI;
  backPlaque.position.set(0, 1.12, -0.215);
  group.add(backPlaque);

  // 5. Burgundy (#792B33) carved stone crown collar accent (lights up subtly when active)
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

  // World anchor for projected accessible label button cleanly above the stone stele
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
