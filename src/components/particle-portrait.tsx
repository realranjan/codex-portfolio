"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { computeSpatialScrollState } from "@/lib/motion";

const COUNT = 66000;
const MODEL = "/particle-bust.glb";
const GLYPHS = ".,:;i1tfLCG08@#%";

export interface SpatialControlValues {
  densityScale: number;
  lightAzimuth: number;
  dispersionBoost: number;
}

interface ParticlePortraitProps {
  spatialProgressRef?: MutableRefObject<number>;
  centerMixRef?: MutableRefObject<number>;
  controlsRef?: MutableRefObject<SpatialControlValues>;
}

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") || probe.getContext("webgl");
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

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
    context.fillText(GLYPHS[i], ((i % 4) + 0.5) * 64, (Math.floor(i / 4) + 0.51) * 64);
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
uniform float uTime, uAssemble, uSize, uGlint, uShine, uRingRadius, uKeep, uHoverOn, uHoverRadius, uDispersion, uPulseAge;
uniform vec2 uHead;
uniform vec2 uHover, uViewport, uPulseOrigin;
uniform vec3 uLight;
varying float vBrightness, vAlpha, vShine, vGlint, vPart, vGlyph, vReveal, vScatterGlow;
mat3 rotX(float a) { float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
mat3 rotY(float a) { float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
void main() {
  float head = smoothstep(-1.3,-0.6,position.y);
  mat3 turn = rotY(uHead.x*(0.28+0.72*head))*rotX(uHead.y*head);
  vec3 home = turn*(position-vec3(0.,-1.,0.))+vec3(0.,-1.,0.);
  vec3 n = normalize(turn*aNormal);
  home += n*sin(uTime*1.6+aRand*60.)*0.009*uDispersion;
  home += n*(uDispersion-1.)*0.2*(0.3+aRand*0.7);
  float r2 = fract(sin(aRand*91.7)*43758.5453);
  float t = clamp((uAssemble-aRand*0.45)/0.55,0.,1.);
  float e = t<0.5 ? 4.*t*t*t : 1.-pow(-2.*t+2.,3.)/2.;
  float angle=aRand*6.2831853;
  vec3 start=vec3(cos(angle)*uRingRadius, sin(angle)*uRingRadius-0.15, 0.);
  vec3 p=mix(start,home,e)+vec3(sin(aRand*40.+uTime*0.3),cos(aRand*31.),0.9+r2*1.4)*sin(e*3.14159)*0.45;
  vec4 mvPre=modelViewMatrix*vec4(p,1.);
  vec4 clipPre=projectionMatrix*mvPre;
  vec2 screenPre=(clipPre.xy/clipPre.w*0.5+0.5)*uViewport;
  float hoverDist=distance(screenPre,uHover);
  float scatter=(1.-smoothstep(0.,uHoverRadius*1.65,hoverDist))*uHoverOn;
  float pulseWave=0.;
  if(uPulseAge>0. && uPulseAge<1.6){
    float pulseDist=distance(screenPre,uPulseOrigin);
    float ringPos=uPulseAge*420.;
    pulseWave=exp(-pow((pulseDist-ringPos)/75.,2.))*(1.-uPulseAge/1.6);
  }
  p+=n*(scatter*0.18*(0.35+r2*0.85)+pulseWave*0.24*(0.4+aRand));
  vec3 toLight=uLight-home;
  float lit=max(dot(n,normalize(toLight)),0.)/(1.+dot(toLight,toLight)*0.3);
  float key=max(dot(n,normalize(vec3(0.5,0.6,0.7))),0.);
  float facing=n.z;
  float rim=pow(1.-abs(facing),2.6);
  float b=(0.24+key*0.26+lit*1.12+rim*0.28)*mix(0.45,1.,smoothstep(-0.3,0.25,facing));
  if(aPart>0.5) b*=0.86;
  if(aPart>1.5) b*=0.72;
  if(aPart>2.5) b*=0.64;
  b*=0.72+r2*0.48;
  float glint=aPart>0.5 ? 1.-smoothstep(0.,0.09,abs(position.x-uGlint)) : 0.;
  float band=home.y-home.x*0.5-uShine;
  float shine=exp(-band*band*4.);
  b+=glint*0.95+shine*1.05+scatter*0.65+pulseWave*0.95;
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=min(18.,uSize*(1.18+r2*0.24+scatter*0.28)/max(0.1,-mv.z));
  vec2 screen=(gl_Position.xy/gl_Position.w*0.5+0.5)*uViewport;
  vReveal=uHoverOn*(1.-smoothstep(uHoverRadius*0.38,uHoverRadius*0.90,distance(screen,uHover)));
  vScatterGlow=clamp(scatter+pulseWave,0.,1.);
  vGlyph=floor(clamp((b*0.54+r2*0.18),0.,0.999)*16.);
  vBrightness=min(b,1.75); vAlpha=mix(0.75,1.,e)*step(aRand, aPart>1.5 ? 0.30 : uKeep); vShine=shine; vGlint=glint; vPart=aPart;
}`;

const fragmentShader = /* glsl */ `
uniform vec3 uInk,uAccent,uIvory;
uniform sampler2D uGlyphAtlas;
varying float vBrightness,vAlpha,vShine,vGlint,vPart,vGlyph,vReveal,vScatterGlow;
void main() {
  if(vAlpha<0.01) discard;
  vec2 cell=vec2(mod(vGlyph,4.),3.-floor(vGlyph/4.));
  vec2 uv=(cell+vec2(gl_PointCoord.x,1.-gl_PointCoord.y))/4.;
  float glyph=texture2D(uGlyphAtlas,uv).a;
  if(glyph<0.08) discard;
  float alpha=glyph*vAlpha*(1.-vReveal*0.96);
  if(alpha<0.01) discard;
  vec3 ink=mix(uInk,uIvory,clamp(vShine*0.55+vScatterGlow*0.40,0.,1.));
  if(vPart>2.5) ink=mix(ink,uAccent,0.72);
  ink=mix(ink,uAccent,clamp(vGlint*0.72+vScatterGlow*0.52,0.,1.));
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
  mat3 turn=rotY(uHead.x*(0.28+0.72*head))*rotX(uHead.y*head);
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
  vec3 n=normalize(vNormal);
  float key=max(dot(n,normalize(vec3(0.5,0.65,0.8))),0.);
  float rim=pow(1.-abs(n.z),2.4);
  float spotlight=(1.-smoothstep(uHoverRadius*0.5,uHoverRadius*1.05,distance(gl_FragCoord.xy,uHover)))*uHoverOn;
  float baseAlpha=clamp(0.11+rim*0.22,0.,0.34)*uAssemble;
  float reveal=max(baseAlpha,spotlight*uAssemble);
  if(reveal<0.01) discard;
  float x=abs(vModelPos.x), y=vModelPos.y, z=vModelPos.z;
  // Classical Pentelic marble and obsidian chiaroscuro tones
  vec3 marble=vec3(0.84,0.80,0.90);
  vec3 shadowStone=vec3(0.32,0.28,0.38);
  vec3 drape=vec3(0.16,0.13,0.21);
  vec3 laurel=vec3(0.74,0.65,0.83);
  float drapeMask=(1.-smoothstep(-0.43,-0.19,y))*smoothstep(0.11,0.22,x);
  float hairMask=max(smoothstep(0.69,0.82,y),smoothstep(0.33,0.46,x)*smoothstep(0.24,0.38,y));
  float leafMask=step(0.13,vModelPos.x)*step(0.60,y)*step(0.035,pow(vModelPos.x-0.02,2.)+pow(z+0.06,2.));
  vec3 base=mix(marble,drape,drapeMask);
  base=mix(base,shadowStone,hairMask*0.75);
  base=mix(base,laurel,leafMask);
  float visor=(1.-smoothstep(0.20,0.24,x))*smoothstep(0.275,0.30,y)*(1.-smoothstep(0.37,0.39,y))*smoothstep(0.1,0.25,z);
  base=mix(base,vec3(0.82,0.74,0.91),visor*0.65);
  float ambientScale=mix(0.24,1.0,spotlight);
  vec3 color=(base*(0.32+key*0.68)*ambientScale)+vec3(0.74,0.65,0.83)*rim*0.36;
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
      if (bin) bin.push(dot);
      else bins.set(key, [dot]);
    }
    if (n.z >= 0.2 && p.x >= -0.32 && p.x <= 0.32 && p.y >= 0.2 && p.y <= 0.45) {
      const key = faceKey(p.x, p.y);
      face.set(key, Math.max(face.get(key) ?? -Infinity, p.z));
    }
  }
  const height = (x: number, y: number) => {
    let z = -Infinity;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        z = Math.max(z, face.get(faceKey(x + dx * 0.01, y + dy * 0.01)) ?? -Infinity);
      }
    }
    return z;
  };
  const W = 0.215;
  const top = (x: number) => 0.378 - 0.022 * (x / W) ** 2;
  const bottom = (x: number) =>
    0.282 + 0.032 * Math.exp(-((x / 0.034) ** 2)) + 0.026 * (x / W) ** 4;
  let front = -Infinity;
  for (let x = -0.06; x <= 0.06; x += 0.01) {
    for (let y = 0.3; y <= 0.36; y += 0.01) front = Math.max(front, height(x, y));
  }
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
  const addVisor = (x: number, y: number, zOffset: number, part: number) =>
    visor.push({
      p: new THREE.Vector3(x, y, front - wrap * x * x + zOffset),
      n: new THREE.Vector3(2 * wrap * x, 0, 1).normalize(),
      part,
    });
  for (let i = 0; i < 950; i++) {
    const x = (Math.random() * 2 - 1) * W;
    addVisor(x, top(x) - Math.random() ** 2 * 0.016, 0.004, 2);
  }
  for (let i = 0; i < 380; i++) {
    const x = (Math.random() * 2 - 1) * W;
    addVisor(x, bottom(x) + Math.random() * 0.004, 0.002, 2);
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 70; i++) {
      addVisor(side * W, bottom(W) + Math.random() * (top(W) - bottom(W)), 0.002, 2);
    }
    for (let i = 0; i < 70; i++) {
      const t = Math.random();
      addVisor(side * (W + 0.03 * t), top(W) - 0.008, -0.15 * t, 2);
    }
  }
  for (let i = 0; i < 1500; i++) {
    const x = (Math.random() * 2 - 1) * W;
    addVisor(x, bottom(x) + Math.random() * (top(x) - bottom(x)), 0, 3);
  }
  const wanted = COUNT - visor.length - Math.min(leaves.length, 6000);
  const leafDots = leaves.slice(0, COUNT - visor.length - wanted);
  let lo = 1;
  let hi = 100;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    let total = 0;
    for (const bin of bins.values()) total += Math.min(bin.length, mid);
    if (total >= wanted * 1.8) hi = mid;
    else lo = mid + 1;
  }
  const pool: Dot[] = [];
  for (const bin of bins.values()) pool.push(...bin.slice(0, lo));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const dots = [...pool.slice(0, wanted), ...leafDots, ...visor];
  while (dots.length < COUNT) dots.push(candidates[Math.floor(Math.random() * candidates.length)]);
  const positions = new Float32Array(COUNT * 3);
  const normals = new Float32Array(COUNT * 3);
  const randoms = new Float32Array(COUNT);
  const parts = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const d = dots[i];
    positions.set([d.p.x * 2.8, d.p.y * 2.8 - 0.68, d.p.z * 2.8], i * 3);
    normals.set([d.n.x, d.n.y, d.n.z], i * 3);
    randoms[i] = Math.random();
    parts[i] = d.part;
  }
  const result = new THREE.BufferGeometry();
  result.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  result.setAttribute("aNormal", new THREE.BufferAttribute(normals, 3));
  result.setAttribute("aRand", new THREE.BufferAttribute(randoms, 1));
  result.setAttribute("aPart", new THREE.BufferAttribute(parts, 1));
  geometry.dispose();
  return result;
}

export default function ParticlePortrait({
  spatialProgressRef,
  centerMixRef,
  controlsRef,
}: ParticlePortraitProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    const stage = container;
    const controller = new AbortController();
    let renderer: THREE.WebGLRenderer | undefined;
    let frameId = 0;
    let cleaned = false;
    let portrait: THREE.BufferGeometry | undefined;
    let surfaceGeometry: THREE.BufferGeometry | undefined;
    let glyphAtlas: THREE.CanvasTexture | undefined;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = new THREE.Vector2();
    let pointerActive = false;
    let touchUntil = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let orbitBaseYaw = 0;
    let orbitBasePitch = 0;
    let targetOrbitYaw = 0;
    let targetOrbitPitch = 0;
    let currentOrbitYaw = 0;
    let currentOrbitPitch = 0;
    let dragMoved = 0;
    let pulseStartTime = -10;
    const pulseOrigin = new THREE.Vector2(-1000, -1000);

    const heroInteractionRoot: EventTarget =
      container.closest(".hero-section") ?? container;

    const updatePointerFromClient = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      const inside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;
      pointer.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((clientY - rect.top) / rect.height) * 2
      );
      return inside;
    };

    const syncTelemetry = (activeState: boolean, yawValue: number) => {
      if (!rootRef.current) return;
      rootRef.current.dataset.hoverActive = activeState ? "true" : "false";
      rootRef.current.dataset.orbitRad = yawValue.toFixed(3);
    };

    const onWindowMove = (event: PointerEvent) => {
      const inside = updatePointerFromClient(event.clientX, event.clientY);
      pointerActive = inside || dragging;
      if (dragging) {
        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;
        dragMoved = Math.max(dragMoved, Math.hypot(dx, dy));
        targetOrbitYaw = orbitBaseYaw + dx * 0.0085;
        targetOrbitPitch = Math.max(-0.55, Math.min(0.55, orbitBasePitch - dy * 0.0045));
      }
      if (event.pointerType === "touch" && inside) {
        touchUntil = performance.now() + 1500;
      }
      syncTelemetry(pointerActive, dragging ? targetOrbitYaw : currentOrbitYaw);
    };

    const onStageDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      if ((centerMixRef?.current ?? 0) >= 0.55) return;
      const targetEl = event.target as HTMLElement | null;
      if (targetEl?.closest("a, button, input, textarea, select, label, [role='button']")) {
        return;
      }
      updatePointerFromClient(event.clientX, event.clientY);
      pointerActive = true;
      dragging = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      orbitBaseYaw = targetOrbitYaw;
      orbitBasePitch = targetOrbitPitch;
      dragMoved = 0;
      if (event.pointerType === "touch") touchUntil = performance.now() + 1500;
      syncTelemetry(true, targetOrbitYaw);
      try {
        container.setPointerCapture(event.pointerId);
      } catch {
        // Ignore capture failures in synthetic events
      }
    };

    const onStageUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      const rect = container.getBoundingClientRect();
      const dpr = renderer?.getPixelRatio() ?? 1;
      if (dragMoved < 10 && rect.width > 0 && rect.height > 0) {
        pulseOrigin.set(
          (event.clientX - rect.left) * dpr,
          (rect.bottom - event.clientY) * dpr
        );
        pulseStartTime = performance.now() * 0.001;
      }
      syncTelemetry(pointerActive, targetOrbitYaw);
      try {
        if (container.hasPointerCapture(event.pointerId)) {
          container.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Ignore release errors
      }
    };

    const onWindowLeave = () => {
      if (!dragging) {
        pointerActive = false;
        syncTelemetry(false, currentOrbitYaw);
      }
    };

    window.addEventListener("pointermove", onWindowMove, { passive: true });
    heroInteractionRoot.addEventListener("pointerdown", onStageDown as EventListener);
    window.addEventListener("pointerup", onStageUp, { passive: true });
    window.addEventListener("pointercancel", onStageUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onWindowLeave);

    async function start() {
      try {
        let canUseWebGL = true;
        try {
          const probe = document.createElement("canvas");
          const ctx = probe.getContext("webgl2") || probe.getContext("webgl");
          if (!ctx) canUseWebGL = false;
          ctx?.getExtension("WEBGL_lose_context")?.loseContext();
        } catch {
          canUseWebGL = false;
        }

        if (!canUseWebGL) {
          if (!cleaned) {
            setWebglUnavailable(true);
            setProgress(100);
            setReady(true);
          }
          return;
        }

        const isSoftwareGl = detectSoftwareWebGL();
        const response = await fetch(MODEL, { signal: controller.signal });
        if (!response.ok || !response.body) throw new Error("Model download failed");
        const total = Number(response.headers.get("Content-Length")) || 1481612;
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let loaded = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          setProgress(Math.min(95, Math.round((loaded / total) * 95)));
        }
        const bytes = new Uint8Array(loaded);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.length;
        }
        const gltf = await new GLTFLoader().parseAsync(bytes.buffer, "");
        let mesh: THREE.Mesh | undefined;
        gltf.scene.traverse((object) => {
          if (!mesh && (object as THREE.Mesh).isMesh) mesh = object as THREE.Mesh;
        });
        if (!mesh) throw new Error("No mesh in model");
        portrait = buildDots(mesh);
        mesh.updateWorldMatrix(true, false);
        surfaceGeometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
        if (!surfaceGeometry.getAttribute("normal")) surfaceGeometry.computeVertexNormals();
        surfaceGeometry.scale(2.8, 2.8, 2.8).translate(0, -0.68, 0);
        const bustBox = new THREE.Box3().setFromBufferAttribute(
          surfaceGeometry.getAttribute("position") as THREE.BufferAttribute
        );
        const bustCenter = bustBox.getCenter(new THREE.Vector3());
        glyphAtlas = makeGlyphAtlas();
        if (cleaned) return;
        setProgress(100);
        if (!reduced && !isSoftwareGl) {
          await new Promise((resolve) => setTimeout(resolve, 260));
        }
        if (cleaned) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        });
        renderer.setClearColor("#0D0B12", 0);
        stage.appendChild(renderer.domElement);

        const uniforms = {
          uTime: { value: 0 },
          uAssemble: { value: reduced ? 1 : 0 },
          uSize: { value: 28 },
          uGlint: { value: -9 },
          uShine: { value: 99 },
          uRingRadius: { value: 0.5 },
          uHead: { value: new THREE.Vector2() },
          uLight: { value: new THREE.Vector3(-1.4, 1.2, 1.6) },
          uGlyphAtlas: { value: glyphAtlas },
          uKeep: { value: 0.48 },
          uHover: { value: new THREE.Vector2(-1000, -1000) },
          uHoverOn: { value: 0 },
          uHoverRadius: { value: 145 },
          uViewport: { value: new THREE.Vector2(1, 1) },
          uDispersion: { value: 1.0 },
          uPulseAge: { value: -1 },
          uPulseOrigin: { value: new THREE.Vector2(-1000, -1000) },
          uInk: { value: new THREE.Color("#C4B9D2") },
          uAccent: { value: new THREE.Color("#BCA5D4") },
          uIvory: { value: new THREE.Color("#F3EEF8") },
        };

        const surfaceMaterial = new THREE.ShaderMaterial({
          vertexShader: surfaceVertexShader,
          fragmentShader: surfaceFragmentShader,
          uniforms: {
            uHead: uniforms.uHead,
            uHover: uniforms.uHover,
            uHoverOn: uniforms.uHoverOn,
            uHoverRadius: uniforms.uHoverRadius,
            uAssemble: uniforms.uAssemble,
          },
          transparent: true,
          depthWrite: false,
          side: THREE.FrontSide,
        });
        const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
        surface.frustumCulled = false;
        surface.renderOrder = 1;
        scene.add(surface);

        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const bust = new THREE.Points(portrait, material);
        bust.frustumCulled = false;
        bust.renderOrder = 2;
        scene.add(bust);

        const dustCount = 1400;
        const dustGeometry = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(dustCount * 3);
        const dustRand = new Float32Array(dustCount);
        for (let i = 0; i < dustCount; i++) {
          const aroundBust = i < 860;
          if (aroundBust) {
            const theta = Math.random() * Math.PI * 2;
            const r = 0.58 + Math.random() * 1.35;
            dustPositions.set(
              [
                bustCenter.x + Math.cos(theta) * r,
                bustCenter.y - 1.45 + Math.random() * 2.95,
                bustCenter.z + Math.sin(theta) * r * 0.78,
              ],
              i * 3
            );
          } else {
            dustPositions.set(
              [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, Math.random() * 7 - 5],
              i * 3
            );
          }
          dustRand[i] = Math.random();
        }
        dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
        dustGeometry.setAttribute("aRand", new THREE.BufferAttribute(dustRand, 1));
        const dustMaterial = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: uniforms.uTime,
            uOn: { value: reduced ? 1 : 0 },
            uDpr: { value: 1 },
            uInk: uniforms.uAccent,
            uHover: uniforms.uHover,
            uHoverOn: uniforms.uHoverOn,
            uHoverRadius: uniforms.uHoverRadius,
            uViewport: uniforms.uViewport,
          },
          vertexShader: `attribute float aRand; uniform float uTime,uDpr,uHoverOn,uHoverRadius; uniform vec2 uHover,uViewport; varying float vRand,vSwirl; void main(){vec3 p=position; p.y=mod(p.y+5.+uTime*(0.06+aRand*0.09),10.)-5.; p.x+=sin(uTime*0.35+aRand*40.)*0.18; p.z+=cos(uTime*0.28+aRand*25.)*0.14; vec4 mv0=modelViewMatrix*vec4(p,1.); vec4 clip0=projectionMatrix*mv0; vec2 scr=(clip0.xy/clip0.w*0.5+0.5)*uViewport; float swirl=(1.-smoothstep(0.,uHoverRadius*1.8,distance(scr,uHover)))*uHoverOn; p.xy+=normalize(scr-uHover+vec2(0.001,0.002))*swirl*0.24*(0.5+aRand); vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=min(14.,(28.+swirl*16.)*uDpr*(0.5+aRand)/max(0.1,-mv.z)); vRand=aRand; vSwirl=swirl;}`,
          fragmentShader: `uniform vec3 uInk; uniform float uOn; varying float vRand,vSwirl; void main(){vec2 q=gl_PointCoord-0.5; float a=exp(-34.*dot(q,q))*(0.26+vRand*0.38+vSwirl*0.35)*uOn; gl_FragColor=vec4(mix(uInk,vec3(0.96,0.94,0.98),clamp(vRand*0.45+vSwirl*0.45,0.,1.)),a);}`,
        });
        const dust = new THREE.Points(dustGeometry, dustMaterial);
        dust.frustumCulled = false;
        scene.add(dust);

        const lightGeometry = new THREE.BufferGeometry();
        lightGeometry.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3));
        const lightMaterial = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: { uOn: { value: reduced ? 1 : 0 }, uDpr: { value: 1 } },
          vertexShader: `uniform float uOn,uDpr; void main(){vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=min(240.,220.*uDpr*uOn/max(0.1,-mv.z));}`,
          fragmentShader: `void main(){float p=length(gl_PointCoord-0.5)*2.; float core=1.-smoothstep(0.08,0.14,p); float glow=exp(-4.*p)*0.4+exp(-12.*p)*0.65; gl_FragColor=vec4(vec3(0.82,0.74,0.91)*(core+glow),min(1.,core+glow));}`,
        });
        const light = new THREE.Points(lightGeometry, lightMaterial);
        light.frustumCulled = false;
        scene.add(light);

        let baseDistance = 8.5;
        let baseKeep = 0.34;
        let shown = false;

        const applyCameraFraming = (w: number) => {
          const isDesktop = w >= 768;
          const spatial = computeSpatialScrollState(spatialProgressRef?.current ?? 0);
          const centerMix = centerMixRef?.current ?? 0;

          // Hero framing puts the bust firmly in the right-third clear of H1 & top nav;
          // Carousel framing pulls back slightly and centers the bust inside the orbital ring.
          const heroShiftX = isDesktop ? 1.24 : 0;
          const heroCamX = bustCenter.x - heroShiftX * 1.12;
          const heroLookX = bustCenter.x - heroShiftX * 0.92;
          const heroCamY = isDesktop ? bustCenter.y - 0.26 : bustCenter.y - 0.36;
          const heroLookY = isDesktop ? bustCenter.y - 0.12 : bustCenter.y - 0.18;
          const heroCamZ = isDesktop ? baseDistance * 1.06 : baseDistance * 1.18;

          const orbitCamX = bustCenter.x;
          const orbitLookX = bustCenter.x;
          const orbitCamY = isDesktop ? bustCenter.y - 0.08 : bustCenter.y - 0.1;
          const orbitLookY = isDesktop ? bustCenter.y - 0.16 : bustCenter.y - 0.14;
          const orbitCamZ = Math.max(7.2, baseDistance * (isDesktop ? 1.44 : 1.52));

          const camX = heroCamX + (orbitCamX - heroCamX) * centerMix;
          const lookX = heroLookX + (orbitLookX - heroLookX) * centerMix;
          const camY = heroCamY + (orbitCamY - heroCamY) * centerMix;
          const lookY = heroLookY + (orbitLookY - heroLookY) * centerMix;
          const camZ =
            heroCamZ +
            (orbitCamZ - heroCamZ) * centerMix +
            Math.sin(spatial.progress * Math.PI) * -0.4;

          camera.position.set(camX, camY, camZ);
          camera.lookAt(lookX, lookY, bustCenter.z);
          return { spatial, centerMix };
        };

        const resize = () => {
          if (!renderer) return;
          const w = Math.max(1, stage.clientWidth);
          const h = Math.max(1, stage.clientHeight);
          const dpr = isSoftwareGl ? 1 : Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2);
          renderer.setPixelRatio(dpr);
          renderer.setSize(w, h);
          camera.aspect = w / h;
          baseDistance = Math.max(
            2.35 / Math.tan(Math.PI / 12),
            1.7 / (Math.tan(Math.PI / 12) * camera.aspect)
          );
          applyCameraFraming(w);
          camera.updateProjectionMatrix();
          uniforms.uSize.value = 72 * dpr;
          baseKeep = w < 700 ? 0.22 : 0.34;
          const densityScale = controlsRef?.current?.densityScale ?? 1;
          uniforms.uKeep.value = Math.min(0.95, baseKeep * densityScale);
          uniforms.uHoverRadius.value = (w < 700 ? 105 : 145) * dpr;
          uniforms.uViewport.value.set(w * dpr, h * dpr);
          uniforms.uRingRadius.value =
            (92 * 2 * baseDistance * Math.tan(Math.PI / 12)) / h;
          dustMaterial.uniforms.uDpr.value = dpr;
          lightMaterial.uniforms.uDpr.value = dpr;
          if (shown) {
            renderer.render(scene, camera);
          }
        };
        resize();
        window.addEventListener("resize", resize);

        const clock = new THREE.Clock();
        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.6);
        const target = new THREE.Vector3();
        const head = new THREE.Vector2();
        const desiredHead = new THREE.Vector2();
        let last = 0;

        function afterDraw(cb: () => void) {
          const gl = renderer!.getContext() as WebGL2RenderingContext;
          if (!gl || typeof gl.fenceSync !== "function") {
            frameId = window.setTimeout(cb, 80);
            return;
          }
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (cleaned) {
              if (sync) gl.deleteSync(sync);
              return;
            }
            const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
            if (state === gl.UNSIGNALED) {
              frameId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              frameId = window.setTimeout(cb, 80);
            }
          };
          frameId = window.setTimeout(poll, 5);
        }

        const tick = () => {
          if (cleaned) return;
          const elapsed = clock.getElapsedTime();
          const dt = Math.min(0.16, Math.max(0.001, elapsed - last));
          last = elapsed;

          const assemble = reduced ? 1 : Math.min(1, elapsed / 2.2);
          uniforms.uAssemble.value = assemble;
          uniforms.uTime.value = reduced ? 0 : elapsed;

          if (!shown) {
            shown = true;
            setReady(true);
          }

          if (!reduced && elapsed >= 2.0 && elapsed <= 4.2) {
            const s = (elapsed - 2.0) / 2.2;
            uniforms.uShine.value = 2.8 - (1 - (1 - s) ** 2) * 7.4;
          } else {
            uniforms.uShine.value = 99;
          }
          if (!reduced && elapsed >= 4.4) {
            const s = ((elapsed - 4.4) % 4.2) / 0.9;
            uniforms.uGlint.value = s <= 1 ? -0.75 + s * 1.8 : -9;
          }

          const { spatial, centerMix } = applyCameraFraming(stage.clientWidth);
          const ctrl = controlsRef?.current;
          const densityScale = ctrl?.densityScale ?? 1;
          const dispersionBoost = ctrl?.dispersionBoost ?? 0;
          const azimuthOffset = ctrl?.lightAzimuth ?? 0;

          uniforms.uKeep.value = Math.min(0.95, baseKeep * densityScale);
          uniforms.uDispersion.value = spatial.dispersion + dispersionBoost;

          const pulseAge = performance.now() * 0.001 - pulseStartTime;
          uniforms.uPulseAge.value = pulseAge >= 0 && pulseAge < 1.6 ? pulseAge : -1;
          uniforms.uPulseOrigin.value.copy(pulseOrigin);

          const active = pointerActive || performance.now() < touchUntil;
          const dpr = renderer!.getPixelRatio();
          uniforms.uHover.value.set(
            (pointer.x * 0.5 + 0.5) * stage.clientWidth * dpr,
            (pointer.y * 0.5 + 0.5) * stage.clientHeight * dpr
          );
          uniforms.uHoverOn.value +=
            ((active && assemble > 0.7 ? 1 : 0) - uniforms.uHoverOn.value) *
            (reduced || isSoftwareGl ? 0.65 : 1 - Math.exp(-dt * 9));

          if (active) {
            raycaster.setFromCamera(pointer, camera);
            raycaster.ray.intersectPlane(plane, target);
          } else if (reduced) {
            target.set(-1.4 + azimuthOffset, 1.2, 2.6);
          } else {
            target.set(
              1.9 * Math.sin(0.45 * elapsed + azimuthOffset),
              0.5 + 0.8 * Math.cos(0.33 * elapsed),
              2.6
            );
          }

          uniforms.uLight.value.lerp(target, reduced ? 1 : 1 - Math.exp(-dt * 6));
          light.position.copy(uniforms.uLight.value);

          const orbitAlpha = isSoftwareGl ? 0.55 : 1 - Math.exp(-dt * 7);
          currentOrbitYaw += (targetOrbitYaw - currentOrbitYaw) * orbitAlpha;
          currentOrbitPitch += (targetOrbitPitch - currentOrbitPitch) * orbitAlpha;

          // Keep a poised front-facing sculpture silhouette inside the orbital ring
          const dragAttenuation = 1 - centerMix * 0.65;
          const heroYawBias = spatial.headBiasX * (1 - centerMix * 0.88);
          const heroPitchBias = spatial.headBiasY * (1 - centerMix * 0.85);

          if (!reduced) {
            if (active) {
              desiredHead.set(
                pointer.x * (0.45 - 0.17 * centerMix) + heroYawBias + currentOrbitYaw * dragAttenuation,
                pointer.y * (0.22 - 0.08 * centerMix) + heroPitchBias + currentOrbitPitch * dragAttenuation
              );
            } else {
              desiredHead.set(
                (0.28 - 0.1 * centerMix) * Math.sin(0.45 * elapsed) + heroYawBias + currentOrbitYaw * dragAttenuation,
                0.08 * Math.cos(0.33 * elapsed) + heroPitchBias + currentOrbitPitch * dragAttenuation
              );
            }
            const headAlpha = isSoftwareGl ? 0.55 : 1 - Math.exp(-dt * (active ? 5 : 3.2));
            head.lerp(desiredHead, headAlpha);
            uniforms.uHead.value.set(head.x, -head.y);
          } else {
            uniforms.uHead.value.set(
              heroYawBias + currentOrbitYaw * dragAttenuation,
              -(heroPitchBias + currentOrbitPitch * dragAttenuation)
            );
          }

          if (rootRef.current) {
            rootRef.current.dataset.hoverActive = active ? "true" : "false";
            rootRef.current.dataset.orbitRad = currentOrbitYaw.toFixed(3);
            rootRef.current.dataset.centerMix = centerMix.toFixed(2);
          }

          const easeLight = 1 - Math.exp(-dt * 4);
          const easeDust = 1 - Math.exp(-dt * 0.8);
          lightMaterial.uniforms.uOn.value +=
            (Math.min(1, 1.6 * assemble) - lightMaterial.uniforms.uOn.value) * easeLight;
          dustMaterial.uniforms.uOn.value += (1 - dustMaterial.uniforms.uOn.value) * easeDust;

          renderer!.render(scene, camera);

          if (isSoftwareGl) {
            afterDraw(tick);
          } else {
            frameId = requestAnimationFrame(tick);
          }
        };

        tick();

        controller.signal.addEventListener("abort", () => {
          window.removeEventListener("resize", resize);
          material.dispose();
          surfaceMaterial.dispose();
          dustGeometry.dispose();
          dustMaterial.dispose();
          lightGeometry.dispose();
          lightMaterial.dispose();
        });
      } catch (cause) {
        if (!controller.signal.aborted) {
          console.error(cause);
          setWebglUnavailable(true);
          setProgress(100);
          setReady(true);
        }
      }
    }

    start();

    return () => {
      cleaned = true;
      controller.abort();
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener("pointermove", onWindowMove);
      heroInteractionRoot.removeEventListener("pointerdown", onStageDown as EventListener);
      window.removeEventListener("pointerup", onStageUp);
      window.removeEventListener("pointercancel", onStageUp);
      document.documentElement.removeEventListener("pointerleave", onWindowLeave);
      renderer?.dispose();
      renderer?.domElement.remove();
      portrait?.dispose();
      surfaceGeometry?.dispose();
      glyphAtlas?.dispose();
    };
  }, [spatialProgressRef, centerMixRef, controlsRef]);

  return (
    <div
      ref={rootRef}
      className={`particle-portrait ${ready ? "is-ready" : ""}`}
      data-phase={ready ? "ready" : "loading"}
      data-webgl={webglUnavailable ? "fallback" : "active"}
      data-hover-active="false"
      data-orbit-rad="0"
      data-center-mix="0"
      data-testid="particle-portrait"
    >
      {webglUnavailable ? (
        <div
          className="relative h-full w-full overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 68% 44%, rgba(196,176,220,0.16), #0A0A0C 64%)",
          }}
        />
      ) : (
        <div
          className="particle-stage cursor-grab active:cursor-grabbing"
          ref={host}
          aria-hidden="true"
        />
      )}

      <div
        className="particle-loader"
        role="progressbar"
        aria-label="Loading 3D sculpture"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <svg viewBox="-110 -110 220 220" aria-hidden="true">
          {Array.from({ length: 96 }, (_, i) => {
            const angle = (i / 96) * Math.PI * 2 - Math.PI / 2;
            const lit = i / 96 < progress / 100;
            return (
              <circle
                key={i}
                cx={92 * Math.cos(angle)}
                cy={92 * Math.sin(angle)}
                r={lit ? 2.2 : 1.5}
                className={lit ? "is-lit" : ""}
              />
            );
          })}
        </svg>
        <span className="particle-counter">{String(progress).padStart(3, "0")}</span>
      </div>
    </div>
  );
}
