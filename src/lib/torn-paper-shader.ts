/**
 * Real-time, scroll-morphing jagged Japanese torn handmade paper WebGL shader
 * (#3A241D rough textured umber paper over transparent lower reveal).
 *
 * Key technique:
 * - Spatial axes (X, Y) use angular linear-facet & ridged noise with high-persistence
 *   anisotropic fiber octaves -> razor-crisp jagged rips, stepped notches, cellulose
 *   whiskers, and raw ragged micro-flecks (ZERO smooth blobby curves or blurry halos).
 * - Scroll axis (Z / uPhase) uses C1-smooth Hermite interpolation -> buttery-smooth
 *   continuous morphing on scroll up/down with zero strobing or frame jitter.
 */

export const TORN_PAPER_VERTEX_SHADER = /* glsl */ `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const TORN_PAPER_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform vec2 uResolution;
uniform float uPhase;
uniform float uVelocity;
uniform vec3 uPaperColor;
uniform vec3 uFiberColor;
uniform vec3 uShadowColor;
uniform float uTextureScale;

// Fast deterministic 3D hash in [0, 1]
float hash31(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

// Angular torn-paper noise: sharp linear facets in X/Y (jagged, never blobby)
// paired with smooth Hermite interpolation along Z (buttery scroll morphing).
float jaggedNoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);

  // Linear X/Y keeps sharp angular peaks & torn corners; smooth Z keeps scroll fluid
  float ux = f.x;
  float uy = f.y;
  float uz = f.z * f.z * (3.0 - 2.0 * f.z);

  float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, ux);
  float nx10 = mix(n010, n110, ux);
  float nx01 = mix(n001, n101, ux);
  float nx11 = mix(n011, n111, ux);

  float nxy0 = mix(nx00, nx10, uy);
  float nxy1 = mix(nx01, nx11, uy);

  return mix(nxy0, nxy1, uz) * 2.0 - 1.0;
}

// Angular multi-octave fBm with high persistence so fine ragged detail bites hard
float fbmJagged(vec3 p) {
  float sum = 0.0;
  float amp = 0.50;
  for (int i = 0; i < 4; i++) {
    sum += amp * jaggedNoise3(p);
    p = vec3(p.x * 2.28 + 11.7, p.y * 2.34 + 7.3, p.z * 1.18 + 5.1);
    amp *= 0.58;
  }
  return sum;
}

// Sharp ridged torn creases (creates sudden paper rip cliffs & pointed torn peaks)
float fbmRidged(vec3 p) {
  float sum = 0.0;
  float amp = 0.55;
  for (int i = 0; i < 4; i++) {
    float n = jaggedNoise3(p);
    // Sharp fold at 0 creates crisp torn paper peaks & sudden steep drops
    float ridge = 1.0 - abs(n) * 2.0;
    sum += amp * ridge;
    p = vec3(p.x * 2.18 + 6.4, p.y * 2.22 + 13.1, p.z * 1.14 + 3.9);
    amp *= 0.54;
  }
  return sum;
}

// Fine spiky cellulose fiber fBm (anisotropic vertical & diagonal paper whiskers)
float fbmFibers(vec3 p) {
  float sum = 0.0;
  float amp = 0.54;
  for (int i = 0; i < 4; i++) {
    float n = jaggedNoise3(p);
    // Sharpen spikes so individual paper fibers protrude crisply
    sum += amp * (sign(n) * pow(abs(n), 0.72));
    p = vec3(p.x * 2.42 + 4.3, p.y * 2.15 + 9.7, p.z * 1.12 + 2.8);
    amp *= 0.62;
  }
  return sum;
}

void main() {
  // vUv.y = 1.0 at top edge (touching upper sheet), 0.0 at bottom edge
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float ax = vUv.x * aspect;

  // Scroll-coupled angular domain warp creates steep torn cliffs, undercuts & living flaps
  float velBoost = clamp(uVelocity, 0.0, 1.0);
  vec3 warpPos = vec3(ax * 0.42, vUv.y * 0.95, uPhase * 0.58);
  float warpX = fbmJagged(warpPos + vec3(2.3, 5.1, 0.0)) * (0.42 + velBoost * 0.24);
  float warpY = fbmJagged(warpPos + vec3(9.7, 1.4, 4.2)) * (0.34 + velBoost * 0.20);

  // 1. BOLD DRAMATIC macro torn-paper cliffs, high coves & deep hanging peninsulas
  float macroWide  = fbmJagged(vec3(ax * 0.27 + warpX * 0.65, vUv.y * 0.62 + warpY * 0.52, uPhase * 0.68));
  float macroMid   = fbmJagged(vec3(ax * 0.64 + warpX * 0.78, vUv.y * 0.92 + warpY * 0.64, uPhase * 0.78 + 4.1));
  float macroRidge = fbmRidged(vec3(ax * 0.34 + warpX * 0.55, vUv.y * 0.68 + warpY * 0.45, uPhase * 0.64 + 8.3));
  float macroTear  = macroWide * 0.52 + macroMid * 0.28 + macroRidge * 0.20;

  // 2. Medium craggy deckle ledges & sharp torn notches
  float medTear = fbmJagged(vec3(ax * 2.15 + warpX * 1.15, vUv.y * 2.35 + warpY * 0.95, uPhase * 1.02 + 17.4));

  // 3. Coarse jagged rips & irregular torn teeth
  float coarseRips = fbmJagged(vec3(ax * 9.5 + warpX * 0.42, vUv.y * 10.4 + warpY * 0.42, uPhase * 1.24 + 31.2));

  // 4. Vertical & cross-diagonal torn paper fiber whiskers (signature hairy paper edge)
  float verticalFibers = fbmFibers(vec3(ax * 42.0 + warpX * 0.25, vUv.y * 13.5 + warpY * 0.22, uPhase * 1.32 + 49.6));
  float diagFibers     = fbmFibers(vec3(ax * 64.0 + vUv.y * 24.0, vUv.y * 26.0 - ax * 18.0, uPhase * 1.38 + 73.1));

  // 5. Pixel-crisp micro-serrations & ragged detached paper specks right at the torn rim
  float microTeeth = jaggedNoise3(vec3(ax * 138.0, vUv.y * 86.0, uPhase * 1.45 + 91.4));
  float nanoGrit   = jaggedNoise3(vec3(ax * 255.0, vUv.y * 195.0, uPhase * 1.52 + 118.2));

  // Combined ragged torn paper displacement — bold uneven torn peaks + aggressive crisp fibers
  float tearOffset =
      macroTear * (0.60 + velBoost * 0.14) +
      medTear * (0.145 + velBoost * 0.055) +
      coarseRips * 0.062 +
      verticalFibers * 0.044 +
      diagFibers * 0.026 +
      microTeeth * 0.022 +
      nanoGrit * 0.013;

  // Signed distance field: > 0 is upper rough paper, < 0 is transparent revealing lower sheet
  float sdf = (vUv.y - 0.48) + tearOffset;

  // Guarantee top 6% is solid paper so there is zero gap at the upper sheet seam
  float topLock = smoothstep(0.90, 0.985, vUv.y);
  sdf = mix(sdf, 0.56, topLock);

  // Guarantee bottom 3% clears cleanly so deepest hanging flaps never clip flat at canvas bottom
  float bottomClear = smoothstep(0.045, 0.0, vUv.y);
  sdf -= bottomClear * 0.65;

  // RAZOR-CRISP binary-feeling torn edge (sub-pixel ~0.55px AA — zero smooth blur or fuzzy halo)
  float aa = max(0.58 / max(uResolution.y, 1.0), 0.0016);
  float paperAlpha = smoothstep(-aa, aa, sdf);

  // ── RAW, ROUGH HANDMADE TEXTURED PAPER SURFACE (ZERO SEAM AT TOP!) ──
  float blotch     = fbmJagged(vec3(ax * 1.25, vUv.y * 1.75, 2.4));
  float pulpClumps = fbmJagged(vec3(ax * 6.5, vUv.y * 8.0, 11.7));
  float fiberGrain = jaggedNoise3(vec3(ax * 54.0, vUv.y * 20.0, 19.3));
  float crispSpeck = jaggedNoise3(vec3(gl_FragCoord.xy * 0.62, 4.1));
  float darkFleck  = smoothstep(0.66, 0.90, jaggedNoise3(vec3(gl_FragCoord.xy * 0.24, 9.5))) - 0.12;

  // Feather ALL texture perturbations smoothly to exact uPaperColor toward top edge (vUv.y -> 1.0)
  float seamBlend = (1.0 - smoothstep(0.64, 0.97, vUv.y)) * uTextureScale;
  vec3 paperColor = uPaperColor
      + (vec3(0.030, 0.018, 0.016) * blotch
      +  vec3(0.020, 0.013, 0.012) * pulpClumps
      +  vec3(0.013, 0.009, 0.008) * fiberGrain
      +  vec3(0.014, 0.010, 0.009) * crispSpeck
      -  vec3(0.032, 0.018, 0.017) * darkFleck) * seamBlend;

  // Raw exposed kozo pulp fibers right along the outermost torn teeth
  float rimTeeth = smoothstep(0.013, 0.0, sdf) * paperAlpha * (1.0 - topLock);
  paperColor = mix(paperColor, uFiberColor, rimTeeth * 0.36);

  // Subtle narrow contact shadow just beneath the torn edge (physical separation over lower sheet)
  float shadowBand = (1.0 - paperAlpha) * smoothstep(-0.048, -0.002, sdf) * (1.0 - topLock);
  float shadowAlpha = shadowBand * 0.20;

  float outAlpha = clamp(paperAlpha + shadowAlpha, 0.0, 1.0);
  vec3 outPremul = paperColor * paperAlpha + uShadowColor * shadowAlpha;

  gl_FragColor = vec4(outPremul, outAlpha);
}
`;
