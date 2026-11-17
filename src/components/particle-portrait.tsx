"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";

const COUNT = 66000;
const MODEL = "/particle-bust.glb";
const GLYPHS = ".,:;i1tfLCG08@#%";

function makeGlyphAtlas(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not draw ASCII atlas");
  context.clearRect(0, 0, 256, 256);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "bold 48px monospace";
  for (let i = 0; i < GLYPHS.length; i++) {
    context.fillText(GLYPHS[i], (i % 4 + 0.5) * 64, (Math.floor(i / 4) + 0.51) * 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

const vertexShader = /* glsl */ `
attribute vec3 aNormal;
attribute float aRand;
attribute float aPart;
uniform float uTime, uAssemble, uSize, uGlint, uShine, uRingRadius, uKeep, uHoverOn, uHoverRadius;
uniform vec2 uHead;
uniform vec2 uHover, uViewport;
uniform vec3 uLight;
varying float vBrightness, vAlpha, vShine, vGlint, vPart, vGlyph, vReveal;
mat3 rotX(float a) { float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
mat3 rotY(float a) { float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
void main() {
  float head = smoothstep(-1.3,-0.6,position.y);
  mat3 turn = rotY(uHead.x*(0.25+0.75*head))*rotX(uHead.y*head);
  vec3 home = turn*(position-vec3(0.,-1.,0.))+vec3(0.,-1.,0.);
  vec3 n = normalize(turn*aNormal);
  home += n*sin(uTime*1.4+aRand*60.)*0.006;
  float r2 = fract(sin(aRand*91.7)*43758.5453);
  float t = clamp((uAssemble-aRand*0.45)/0.55,0.,1.);
  float e = t<0.5 ? 4.*t*t*t : 1.-pow(-2.*t+2.,3.)/2.;
  float angle=aRand*6.2831853;
  vec3 start=vec3(cos(angle)*uRingRadius, sin(angle)*uRingRadius-0.15, 0.);
  vec3 p=mix(start,home,e)+vec3(sin(aRand*40.+uTime*0.3),cos(aRand*31.),0.9+r2*1.4)*sin(e*3.14159)*0.45;
  vec3 toLight=uLight-home;
  float lit=max(dot(n,normalize(toLight)),0.)/(1.+dot(toLight,toLight)*0.32);
  float key=max(dot(n,normalize(vec3(0.5,0.6,0.7))),0.);
  float facing=n.z;
  float rim=pow(1.-abs(facing),3.);
  float b=(0.34+key*0.28+lit*1.5+rim*0.18)*mix(0.55,1.,smoothstep(-0.3,0.25,facing));
  if(aPart>0.5) b*=0.9;
  if(aPart>1.5) b*=0.78;
  if(aPart>2.5) b*=0.7;
  b*=0.7+r2*0.5;
  float glint=aPart>0.5 ? 1.-smoothstep(0.,0.09,abs(position.x-uGlint)) : 0.;
  float band=home.y-home.x*0.5-uShine;
  float shine=exp(-band*band*4.);
  b+=glint*1.2+shine*1.3;
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=min(22.,uSize*(1.3+r2*0.25)/max(0.1,-mv.z));
  vec2 screen=(gl_Position.xy/gl_Position.w*0.5+0.5)*uViewport;
  vReveal=uHoverOn*(1.-smoothstep(uHoverRadius*0.68,uHoverRadius,distance(screen,uHover)));
  vGlyph=floor(clamp((b*0.52+r2*0.18),0.,0.999)*16.);
  vBrightness=b; vAlpha=mix(0.75,1.,e)*step(aRand, aPart>1.5 ? 0.2 : uKeep); vShine=shine; vGlint=glint; vPart=aPart;
}`;

const fragmentShader = /* glsl */ `
uniform vec3 uInk,uBlue,uCream;
uniform sampler2D uGlyphAtlas;
varying float vBrightness,vAlpha,vShine,vGlint,vPart,vGlyph,vReveal;
void main() {
  if(vAlpha<0.01) discard;
  vec2 cell=vec2(mod(vGlyph,4.),3.-floor(vGlyph/4.));
  vec2 uv=(cell+vec2(gl_PointCoord.x,1.-gl_PointCoord.y))/4.;
  float glyph=texture2D(uGlyphAtlas,uv).a;
  if(glyph<0.08) discard;
  float alpha=glyph*vAlpha*(1.-vReveal);
  vec3 ink=mix(uInk,uCream,clamp(vShine*0.6,0.,1.));
  if(vPart>2.5) ink=mix(ink,uBlue,0.6);
  ink=mix(ink,uBlue,clamp(vGlint*0.7,0.,1.));
  gl_FragColor=vec4(ink*vBrightness,alpha);
}`;

const surfaceVertexShader = /* glsl */ `
uniform vec2 uHead;
varying vec3 vNormal;
varying vec3 vModelPos;
mat3 rotX(float a) { float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
mat3 rotY(float a) { float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
void main() {
  float head=smoothstep(-1.3,-0.6,position.y);
  mat3 turn=rotY(uHead.x*(0.25+0.75*head))*rotX(uHead.y*head);
  vec3 p=turn*(position-vec3(0.,-1.,0.))+vec3(0.,-1.,0.);
  vNormal=normalize(turn*normal);
  vModelPos=vec3(position.x/2.8,(position.y+0.68)/2.8,position.z/2.8);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;

const surfaceFragmentShader = /* glsl */ `
uniform vec2 uHover;
uniform float uHoverOn,uHoverRadius,uAssemble;
varying vec3 vNormal;
varying vec3 vModelPos;
void main() {
  float reveal=(1.-smoothstep(uHoverRadius*0.68,uHoverRadius,distance(gl_FragCoord.xy,uHover)))*uHoverOn*uAssemble;
  if(reveal<0.01) discard;
  vec3 n=normalize(vNormal);
  float key=max(dot(n,normalize(vec3(0.5,0.65,0.8))),0.);
  float rim=pow(1.-abs(n.z),2.);
  float x=abs(vModelPos.x), y=vModelPos.y, z=vModelPos.z;
  vec3 skin=vec3(1.0,0.48,0.30);
  vec3 hair=vec3(0.34,0.10,0.07);
  vec3 shirt=vec3(0.10,0.46,0.52);
  vec3 leaf=vec3(0.48,0.76,0.23);
  float shirtMask=(1.-smoothstep(-0.43,-0.19,y))*smoothstep(0.11,0.22,x);
  float hairMask=max(smoothstep(0.69,0.82,y),smoothstep(0.33,0.46,x)*smoothstep(0.24,0.38,y));
  float leafMask=step(0.13,vModelPos.x)*step(0.60,y)*step(0.035,pow(vModelPos.x-0.02,2.)+pow(z+0.06,2.));
  vec3 base=mix(skin,shirt,shirtMask);
  base=mix(base,hair,hairMask);
  base=mix(base,leaf,leafMask);
  float visor=(1.-smoothstep(0.20,0.24,x))*smoothstep(0.275,0.30,y)*(1.-smoothstep(0.37,0.39,y))*smoothstep(0.1,0.25,z);
  base=mix(base,vec3(0.24,0.55,0.54),visor*0.72);
  vec3 color=base*(0.49+key*0.62)+vec3(0.13,0.17,0.13)*rim;
  gl_FragColor=vec4(color,reveal);
}`;

type Dot = { p: THREE.Vector3; n: THREE.Vector3; part: number };

function buildDots(mesh: THREE.Mesh): THREE.BufferGeometry {
  mesh.updateWorldMatrix(true, false);
  const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(geometry)).build();
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const candidates: Dot[] = [];
  const leaves: Dot[] = [];
  const bins = new Map<string, Dot[]>();
  const face = new Map<string, number>();
  const faceKey = (x: number, y: number) => `${Math.round(x * 100)},${Math.round(y * 100)}`;
  for (let i = 0; i < COUNT * 5; i++) {
    sampler.sample(p, n);
    const dot = { p: p.clone(), n: n.clone(), part: 0 };
    candidates.push(dot);
    if (p.x > 0.13 && p.y > 0.6 && (p.x - 0.02) ** 2 + (p.z + 0.06) ** 2 > 0.035) {
      if (Math.random() < 0.6) leaves.push({ ...dot, part: 1 });
    } else {
      const key = `${Math.floor(p.x / 0.022)},${Math.floor(p.y / 0.022)},${Math.floor(p.z / 0.022)}`;
      const bin = bins.get(key);
      if (bin) bin.push(dot); else bins.set(key, [dot]);
    }
    if (n.z >= 0.2 && p.x >= -0.32 && p.x <= 0.32 && p.y >= 0.2 && p.y <= 0.45) {
      const key = faceKey(p.x, p.y);
      face.set(key, Math.max(face.get(key) ?? -Infinity, p.z));
    }
  }
  const height = (x: number, y: number) => {
    let z = -Infinity;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++)
      z = Math.max(z, face.get(faceKey(x + dx * 0.01, y + dy * 0.01)) ?? -Infinity);
    return z;
  };
  const W = 0.215;
  const top = (x: number) => 0.378 - 0.022 * (x / W) ** 2;
  const bottom = (x: number) => 0.282 + 0.032 * Math.exp(-((x / 0.034) ** 2)) + 0.026 * (x / W) ** 4;
  let front = -Infinity;
  for (let x = -0.06; x <= 0.06; x += 0.01) for (let y = 0.3; y <= 0.36; y += 0.01) front = Math.max(front, height(x, y));
  if (!Number.isFinite(front)) front = 0.36;
  front += 0.028;
  let wrap = 2.4;
  for (let x = -W; x <= W; x += 0.01) {
    if (Math.abs(x) < 0.05) continue;
    let need = -Infinity;
    for (let y = bottom(x); y <= top(x); y += 0.01) need = Math.max(need, height(x, y));
    if (Number.isFinite(need)) wrap = Math.min(wrap, (front - need - 0.0196) / (x * x));
  }
  wrap = Math.max(0.4, wrap);
  const visor: Dot[] = [];
  const addVisor = (x: number, y: number, zOffset: number, part: number) => visor.push({
    p: new THREE.Vector3(x, y, front - wrap * x * x + zOffset),
    n: new THREE.Vector3(2 * wrap * x, 0, 1).normalize(), part,
  });
  for (let i = 0; i < 950; i++) { const x = (Math.random() * 2 - 1) * W; addVisor(x, top(x) - Math.random() ** 2 * 0.016, 0.004, 2); }
  for (let i = 0; i < 380; i++) { const x = (Math.random() * 2 - 1) * W; addVisor(x, bottom(x) + Math.random() * 0.004, 0.002, 2); }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 70; i++) addVisor(side * W, bottom(W) + Math.random() * (top(W) - bottom(W)), 0.002, 2);
    for (let i = 0; i < 70; i++) { const t = Math.random(); addVisor(side * (W + 0.03 * t), top(W) - 0.008, -0.15 * t, 2); }
  }
  for (let i = 0; i < 1500; i++) { const x = (Math.random() * 2 - 1) * W; addVisor(x, bottom(x) + Math.random() * (top(x) - bottom(x)), 0, 3); }
  const wanted = COUNT - visor.length - Math.min(leaves.length, 6000);
  const leafDots = leaves.slice(0, COUNT - visor.length - wanted);
  let lo = 1, hi = 100;
  while (lo < hi) { const mid = Math.floor((lo + hi) / 2); let total = 0; for (const bin of bins.values()) total += Math.min(bin.length, mid); if (total >= wanted * 1.8) hi = mid; else lo = mid + 1; }
  const pool: Dot[] = [];
  for (const bin of bins.values()) pool.push(...bin.slice(0, lo));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const dots = [...pool.slice(0, wanted), ...leafDots, ...visor];
  // A very sparse mesh can still fill the target from the original samples.
  while (dots.length < COUNT) dots.push(candidates[Math.floor(Math.random() * candidates.length)]);
  const positions = new Float32Array(COUNT * 3), normals = new Float32Array(COUNT * 3);
  const randoms = new Float32Array(COUNT), parts = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const d = dots[i];
    positions.set([d.p.x * 2.8, d.p.y * 2.8 - 0.68, d.p.z * 2.8], i * 3);
    normals.set([d.n.x, d.n.y, d.n.z], i * 3);
    randoms[i] = Math.random(); parts[i] = d.part;
  }
  const result = new THREE.BufferGeometry();
  result.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  result.setAttribute("aNormal", new THREE.BufferAttribute(normals, 3));
  result.setAttribute("aRand", new THREE.BufferAttribute(randoms, 1));
  result.setAttribute("aPart", new THREE.BufferAttribute(parts, 1));
  geometry.dispose();
  return result;
}

export default function ParticlePortrait() {
  const host = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const stage = container;
    const controller = new AbortController();
    let renderer: THREE.WebGLRenderer | undefined;
    let frame = 0;
    let cleaned = false;
    let portrait: THREE.BufferGeometry | undefined;
    let surfaceGeometry: THREE.BufferGeometry | undefined;
    let glyphAtlas: THREE.CanvasTexture | undefined;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = new THREE.Vector2();
    let pointerActive = false, touchUntil = 0;
    const onMove = (event: PointerEvent) => { const rect = container.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2); pointerActive = true; if (event.pointerType === "touch") touchUntil = performance.now() + 1500; };
    const onLeave = () => { pointerActive = false; };
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerdown", onMove);
    container.addEventListener("pointerleave", onLeave);

    async function start() {
      try {
        const response = await fetch(MODEL, { signal: controller.signal });
        if (!response.ok || !response.body) throw new Error("Model download failed");
        const total = Number(response.headers.get("Content-Length")) || 1481612;
        const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let loaded = 0;
        while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); loaded += value.length; setProgress(Math.min(95, Math.round(loaded / total * 95))); }
        const bytes = new Uint8Array(loaded); let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
        const gltf = await new GLTFLoader().parseAsync(bytes.buffer, "");
        let mesh: THREE.Mesh | undefined;
        gltf.scene.traverse((object) => { if (!mesh && (object as THREE.Mesh).isMesh) mesh = object as THREE.Mesh; });
        if (!mesh) throw new Error("No mesh in model");
        portrait = buildDots(mesh);
        mesh.updateWorldMatrix(true, false);
        surfaceGeometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
        if (!surfaceGeometry.getAttribute("normal")) surfaceGeometry.computeVertexNormals();
        surfaceGeometry.scale(2.8, 2.8, 2.8).translate(0, -0.68, 0);
        glyphAtlas = makeGlyphAtlas();
        if (cleaned) return;
        setProgress(100);
        if (!reduced) await new Promise((resolve) => setTimeout(resolve, 380));
        if (cleaned) return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
        renderer.setClearColor("#0f110d", 0);
        stage.appendChild(renderer.domElement);
        const uniforms = {
          uTime: { value: 0 }, uAssemble: { value: reduced ? 1 : 0 }, uSize: { value: 26 }, uGlint: { value: -9 }, uShine: { value: 99 },
          uRingRadius: { value: 0.5 }, uHead: { value: new THREE.Vector2() }, uLight: { value: new THREE.Vector3(-1.4, 1.2, 1.6) },
          uGlyphAtlas: { value: glyphAtlas }, uKeep: { value: 0.27 }, uHover: { value: new THREE.Vector2(-1000, -1000) },
          uHoverOn: { value: 0 }, uHoverRadius: { value: 120 }, uViewport: { value: new THREE.Vector2(1, 1) },
          uInk: { value: new THREE.Color("#c9d4b8") }, uBlue: { value: new THREE.Color("#7fa8a3") }, uCream: { value: new THREE.Color("#f0e5c8") },
        };
        const surfaceMaterial = new THREE.ShaderMaterial({
          vertexShader: surfaceVertexShader, fragmentShader: surfaceFragmentShader,
          uniforms: { uHead: uniforms.uHead, uHover: uniforms.uHover, uHoverOn: uniforms.uHoverOn, uHoverRadius: uniforms.uHoverRadius, uAssemble: uniforms.uAssemble },
          transparent: true, depthWrite: false, side: THREE.FrontSide,
        });
        const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
        surface.frustumCulled = false; surface.renderOrder = 1; scene.add(surface);
        const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
        const bust = new THREE.Points(portrait, material); bust.frustumCulled = false; bust.renderOrder = 2; scene.add(bust);
        const dustGeometry = new THREE.BufferGeometry(); const dustPositions = new Float32Array(900 * 3), dustRand = new Float32Array(900);
        for (let i = 0; i < 900; i++) { dustPositions.set([(Math.random() - 0.5) * 18, (Math.random() - 0.5) * 12, Math.random() * 8 - 6], i * 3); dustRand[i] = Math.random(); }
        dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3)); dustGeometry.setAttribute("aRand", new THREE.BufferAttribute(dustRand, 1));
        const dustMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uTime: uniforms.uTime, uOn: { value: reduced ? 1 : 0 }, uDpr: { value: 1 }, uInk: uniforms.uInk },
          vertexShader: `attribute float aRand; uniform float uTime,uDpr; varying float vRand; void main(){vec3 p=position; p.y=mod(p.y+6.+uTime*(0.03+aRand*0.05),12.)-6.; p.x+=sin(uTime*0.2+aRand*40.)*0.15; vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=22.*uDpr*(0.5+aRand)/max(0.1,-mv.z); vRand=aRand;}`,
          fragmentShader: `uniform vec3 uInk; uniform float uOn; varying float vRand; void main(){vec2 q=gl_PointCoord-0.5; float a=exp(-64.*dot(q,q))*(0.1+vRand*0.18)*uOn; gl_FragColor=vec4(uInk,a);}` });
        const dust = new THREE.Points(dustGeometry, dustMaterial); dust.frustumCulled = false; scene.add(dust);
        const lightGeometry = new THREE.BufferGeometry(); lightGeometry.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3));
        const lightMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uOn: { value: reduced ? 1 : 0 }, uDpr: { value: 1 } },
          vertexShader: `uniform float uOn,uDpr; void main(){vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=min(260.,240.*uDpr*uOn/max(0.1,-mv.z));}`,
          fragmentShader: `void main(){float r=length(gl_PointCoord-0.5)*2.; float core=1.-smoothstep(0.08,0.14,r); float glow=exp(-4.*r)*0.45+exp(-12.*r)*0.7; gl_FragColor=vec4(vec3(0.83,0.94,0.85)*(core+glow),min(1.,core+glow));}` });
        const light = new THREE.Points(lightGeometry, lightMaterial); light.frustumCulled = false; scene.add(light);
        const resize = () => { if (!renderer) return; const w = stage.clientWidth, h = stage.clientHeight; const dpr = Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2); renderer.setPixelRatio(dpr); renderer.setSize(w, h); camera.aspect = w / h; const distance = Math.max(2.35 / Math.tan(Math.PI / 12), 1.7 / (Math.tan(Math.PI / 12) * camera.aspect)); camera.position.set(0, -0.15, distance); camera.lookAt(0, -0.15, 0); camera.updateProjectionMatrix(); uniforms.uSize.value = 74 * dpr; uniforms.uKeep.value = w < 700 ? 0.18 : 0.27; uniforms.uHoverRadius.value = (w < 700 ? 88 : 120) * dpr; uniforms.uViewport.value.set(w * dpr, h * dpr); uniforms.uRingRadius.value = 92 * 2 * distance * Math.tan(Math.PI / 12) / h; dustMaterial.uniforms.uDpr.value = dpr; lightMaterial.uniforms.uDpr.value = dpr; };
        resize(); window.addEventListener("resize", resize);
        const clock = new THREE.Clock(); const raycaster = new THREE.Raycaster(); const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.6);
        const target = new THREE.Vector3(), head = new THREE.Vector2(); let last = 0, shown = false;
        const tick = () => {
          frame = requestAnimationFrame(tick); const elapsed = clock.getElapsedTime(); const dt = Math.min(0.05, elapsed - last); last = elapsed;
          const assemble = reduced ? 1 : Math.min(1, elapsed / 2.6);
          uniforms.uAssemble.value = assemble; uniforms.uTime.value = reduced ? 0 : elapsed;
          if (!shown && assemble > 0.55) { shown = true; setReady(true); }
          if (!reduced && elapsed >= 2.34 && elapsed <= 4.54) { const s = (elapsed - 2.34) / 2.2; uniforms.uShine.value = 2.8 - (1 - (1 - s) ** 2) * 7.4; } else uniforms.uShine.value = 99;
          if (!reduced && elapsed >= 4.6) { const s = ((elapsed - 4.6) % 4.2) / 0.9; uniforms.uGlint.value = s <= 1 ? -0.75 + s * 1.8 : -9; }
          const active = pointerActive || performance.now() < touchUntil;
          const dpr = renderer!.getPixelRatio();
          uniforms.uHover.value.set((pointer.x * 0.5 + 0.5) * stage.clientWidth * dpr, (pointer.y * 0.5 + 0.5) * stage.clientHeight * dpr);
          uniforms.uHoverOn.value += ((active && assemble > 0.95 ? 1 : 0) - uniforms.uHoverOn.value) * (reduced ? 1 : 1 - Math.exp(-dt * 8));
          if (active) { raycaster.setFromCamera(pointer, camera); raycaster.ray.intersectPlane(plane, target); }
          else if (reduced) target.set(-1.4, 1.2, 2.6);
          else target.set(1.9 * Math.sin(0.45 * elapsed), 0.5 + 0.8 * Math.cos(0.33 * elapsed), 2.6);
          uniforms.uLight.value.lerp(target, reduced ? 1 : 1 - Math.exp(-dt * 5)); light.position.copy(uniforms.uLight.value);
          if (!reduced) { head.lerp(active ? new THREE.Vector2(pointer.x * 0.5, pointer.y * 0.18) : new THREE.Vector2(0.35 * Math.sin(0.45 * elapsed), 0.12 * Math.cos(0.33 * elapsed)), 1 - Math.exp(-dt * (active ? 3 : 1.5))); uniforms.uHead.value.set(head.x, -head.y); }
          const easeLight = 1 - Math.exp(-dt * 4), easeDust = 1 - Math.exp(-dt * 0.8);
          lightMaterial.uniforms.uOn.value += (Math.min(1, 1.6 * assemble) - lightMaterial.uniforms.uOn.value) * easeLight;
          dustMaterial.uniforms.uOn.value += (1 - dustMaterial.uniforms.uOn.value) * easeDust;
          renderer!.render(scene, camera);
        };
        tick();
        controller.signal.addEventListener("abort", () => { window.removeEventListener("resize", resize); material.dispose(); surfaceMaterial.dispose(); dustGeometry.dispose(); dustMaterial.dispose(); lightGeometry.dispose(); lightMaterial.dispose(); });
      } catch (cause) { if (!controller.signal.aborted) { console.error(cause); setError(true); } }
    }
    start();
    return () => { cleaned = true; controller.abort(); cancelAnimationFrame(frame); container.removeEventListener("pointermove", onMove); container.removeEventListener("pointerdown", onMove); container.removeEventListener("pointerleave", onLeave); renderer?.dispose(); renderer?.domElement.remove(); portrait?.dispose(); surfaceGeometry?.dispose(); glyphAtlas?.dispose(); };
  }, []);

  return <div className={`particle-portrait ${ready ? "is-ready" : ""}`} data-phase={ready ? "ready" : "loading"}>
    <div className="particle-stage" ref={host} aria-hidden="true" />
    <div className="particle-loader" role="progressbar" aria-label="Loading the ASCII portrait" aria-valuemin={0} aria-valuemax={100} aria-valuenow={error ? 0 : progress}>
      <svg viewBox="-110 -110 220 220" aria-hidden="true">{Array.from({ length: 96 }, (_, i) => { const angle = i / 96 * Math.PI * 2 - Math.PI / 2; return <circle key={i} cx={92 * Math.cos(angle)} cy={92 * Math.sin(angle)} r={i / 96 < progress / 100 ? 2.2 : 1.6} className={i / 96 < progress / 100 ? "is-lit" : ""} />; })}</svg>
      <span className="particle-counter">{error ? "Could not load" : String(progress).padStart(3, "0")}</span>
      <span className="particle-label">{error ? "Refresh to try again" : "ASCII portrait"}</span>
    </div>
  </div>;
}
