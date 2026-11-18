"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  CAT_MODEL_HEIGHT,
  STAGE_CENTER_Y,
  classifyCuteSegment,
  classifySamuraiSegment,
  computeDualLayerAlignment,
  computeSegmentedLookAngles,
} from "@/lib/cat-rig";
import {
  computeHeroToCarouselState,
  computeSpatialScrollState,
} from "@/lib/motion";

const SAMURAI_MODEL = "/samurai-cat.glb";
const CUTE_MODEL = "/cute-cat-segmented.glb";

export type CatLayerMode = "reveal" | "cute" | "samurai";

export interface SpatialControlValues {
  layerMode: CatLayerMode;
  lightAzimuth: number;
}

interface ParticlePortraitProps {
  spatialProgressRef?: MutableRefObject<number>;
  projectsProgressRef?: MutableRefObject<number>;
  centerMixRef?: MutableRefObject<number>;
  controlsRef?: MutableRefObject<SpatialControlValues>;
}

interface RevealUniforms {
  uRevealCenter: { value: THREE.Vector2 };
  uRevealRadius: { value: number };
  uRevealMix: { value: number };
  uFullCutaway: { value: number };
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

async function fetchGlbWithProgress(
  url: string,
  signal: AbortSignal,
  onBytes: (loaded: number, total: number) => void
): Promise<ArrayBuffer> {
  const response = await fetch(url, { signal });
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}`);
  }
  const total = Number(response.headers.get("Content-Length")) || 8_300_000;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onBytes(loaded, total);
  }

  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes.buffer;
}

function applyTextureSafeguards(
  material: THREE.Material,
  maxAnisotropy: number,
  revealUniforms?: RevealUniforms
): THREE.MeshStandardMaterial {
  const cloned = material.clone() as THREE.MeshStandardMaterial;
  cloned.color.setHex(0xffffff);
  cloned.transparent = false;
  cloned.depthWrite = true;
  cloned.opacity = 1;
  if (!revealUniforms) {
    cloned.side = THREE.DoubleSide;
  }

  if (typeof cloned.metalness === "number") {
    cloned.metalness = Math.min(cloned.metalness, 0.72);
  }
  if (typeof cloned.roughness === "number") {
    cloned.roughness = Math.max(cloned.roughness, 0.22);
  }
  cloned.envMapIntensity = 1.15;

  const configureTex = (tex: THREE.Texture | null | undefined, isColor: boolean) => {
    if (!tex) return;
    if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    tex.needsUpdate = true;
  };
  configureTex(cloned.map, true);
  configureTex(cloned.emissiveMap, true);
  configureTex(cloned.normalMap, false);
  configureTex(cloned.roughnessMap, false);
  configureTex(cloned.metalnessMap, false);
  configureTex(cloned.aoMap, false);

  if (revealUniforms) {
    cloned.customProgramCacheKey = () => "samurai-hover-reveal-v1";
    cloned.onBeforeCompile = (shader) => {
      shader.uniforms.uRevealCenter = revealUniforms.uRevealCenter;
      shader.uniforms.uRevealRadius = revealUniforms.uRevealRadius;
      shader.uniforms.uRevealMix = revealUniforms.uRevealMix;
      shader.uniforms.uFullCutaway = revealUniforms.uFullCutaway;

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
uniform vec2 uRevealCenter;
uniform float uRevealRadius;
uniform float uRevealMix;
uniform float uFullCutaway;`
        )
        .replace(
          "#include <dithering_fragment>",
          `if (uFullCutaway > 0.99) discard;
if (uRevealMix > 0.01) {
  float revealR = uRevealRadius * uRevealMix;
  float distToPointer = distance(gl_FragCoord.xy, uRevealCenter);
  if (distToPointer < revealR) discard;
  float rimWidth = max(4.0, revealR * 0.06);
  float edgeGlow = 1.0 - smoothstep(revealR, revealR + rimWidth, distToPointer);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.77, 0.69, 0.86), edgeGlow * 0.82 * uRevealMix);
}
#include <dithering_fragment>`
        );
    };
  }

  cloned.needsUpdate = true;
  return cloned;
}

function measureRotatedSceneBounds(
  root: THREE.Object3D,
  facingRotationY: number
): { min: [number, number, number]; max: [number, number, number] } {
  root.updateMatrixWorld(true);
  const rotMat = new THREE.Matrix4().makeRotationY(facingRotationY);
  const fullBox = new THREE.Box3();
  const tempBox = new THREE.Box3();

  root.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    const geom = mesh.geometry.clone();
    geom.applyMatrix4(mesh.matrixWorld);
    geom.applyMatrix4(rotMat);
    geom.computeBoundingBox();
    if (geom.boundingBox) {
      tempBox.copy(geom.boundingBox);
      fullBox.union(tempBox);
    }
    geom.dispose();
  });

  return {
    min: [fullBox.min.x, fullBox.min.y, fullBox.min.z],
    max: [fullBox.max.x, fullBox.max.y, fullBox.max.z],
  };
}

function buildSegmentedCatRig(params: {
  sourceRoot: THREE.Object3D;
  facingRotationY: number;
  centerOffset: readonly [number, number, number];
  scale: number;
  neckPivotY: number;
  classify: (name: string, centerY: number) => "head" | "body";
  maxAnisotropy: number;
  revealUniforms?: RevealUniforms;
}) {
  const {
    sourceRoot,
    facingRotationY,
    centerOffset,
    scale,
    neckPivotY,
    classify,
    maxAnisotropy,
    revealUniforms,
  } = params;

  sourceRoot.updateMatrixWorld(true);
  const rootGroup = new THREE.Group();
  const bodyGroup = new THREE.Group();
  const neckPivot = new THREE.Group();
  neckPivot.position.set(0, neckPivotY, 0);
  const headGroup = new THREE.Group();
  headGroup.rotation.order = "YXZ";
  bodyGroup.rotation.order = "YXZ";
  rootGroup.rotation.order = "YXZ";

  neckPivot.add(headGroup);
  rootGroup.add(bodyGroup);
  rootGroup.add(neckPivot);

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const rotMat = new THREE.Matrix4().makeRotationY(facingRotationY);

  sourceRoot.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const srcMesh = obj as THREE.Mesh;

    const geom = srcMesh.geometry.clone();
    geom.applyMatrix4(srcMesh.matrixWorld);
    geom.applyMatrix4(rotMat);
    geom.translate(centerOffset[0], centerOffset[1], centerOffset[2]);
    geom.computeBoundingBox();
    const rawBox = geom.boundingBox ?? new THREE.Box3();
    const unscaledCenterY = (rawBox.min.y + rawBox.max.y) * 0.5;

    geom.scale(scale, scale, scale);
    geom.translate(0, STAGE_CENTER_Y, 0);
    if (!geom.getAttribute("normal")) {
      geom.computeVertexNormals();
    }

    const role = classify(srcMesh.name, unscaledCenterY);
    if (role === "head") {
      geom.translate(0, -neckPivotY, 0);
    }

    geometries.push(geom);

    const srcMat = Array.isArray(srcMesh.material)
      ? srcMesh.material[0]
      : srcMesh.material;
    const nextMat = srcMat
      ? applyTextureSafeguards(srcMat, maxAnisotropy, revealUniforms)
      : applyTextureSafeguards(
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 }),
          maxAnisotropy,
          revealUniforms
        );
    materials.push(nextMat);

    const mesh = new THREE.Mesh(geom, nextMat);
    mesh.name = srcMesh.name;
    mesh.frustumCulled = false;

    if (role === "head") {
      headGroup.add(mesh);
    } else {
      bodyGroup.add(mesh);
    }
  });

  return {
    rootGroup,
    bodyGroup,
    headGroup,
    dispose: () => {
      for (const g of geometries) g.dispose();
      for (const m of materials) {
        const std = m as THREE.MeshStandardMaterial;
        std.map?.dispose();
        std.normalMap?.dispose();
        std.roughnessMap?.dispose();
        std.metalnessMap?.dispose();
        std.aoMap?.dispose();
        std.emissiveMap?.dispose();
        m.dispose();
      }
    },
  };
}

function attachStudioLights(scene: THREE.Scene) {
  const hemi = new THREE.HemisphereLight(0xeae2f8, 0x1d1a26, 1.05);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff5ea, 1.85);
  key.position.set(2.4, 3.6, 5.2);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xc4b0dc, 0.95);
  fill.position.set(-4.2, 1.4, 3.2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xd9cae8, 1.3);
  rim.position.set(0.2, 2.8, -4.6);
  scene.add(rim);

  const pointerLight = new THREE.PointLight(0xe9defa, 1.75, 12, 1.5);
  pointerLight.position.set(0, 1.2, 3.2);
  scene.add(pointerLight);

  return { pointerLight };
}

export default function ParticlePortrait({
  spatialProgressRef,
  projectsProgressRef,
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

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = new THREE.Vector2(0, 0);
    let pointerActive = false;
    let pointerMoved = false;
    let overDomControl = false;
    let touchRevealUntil = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let orbitBaseYaw = 0;
    let orbitBasePitch = 0;
    let targetOrbitYaw = 0;
    let targetOrbitPitch = 0;
    let currentOrbitYaw = 0;
    let currentOrbitPitch = 0;

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

    const syncTelemetry = (
      activeState: boolean,
      hoveredState: boolean,
      yawValue: number,
      mode: CatLayerMode
    ) => {
      if (!rootRef.current) return;
      rootRef.current.dataset.hoverActive = activeState ? "true" : "false";
      rootRef.current.dataset.modelHovered = hoveredState ? "true" : "false";
      rootRef.current.dataset.layerMode = mode;
      rootRef.current.dataset.orbitRad = yawValue.toFixed(3);
    };

    const onWindowMove = (event: PointerEvent) => {
      const inside = updatePointerFromClient(event.clientX, event.clientY);
      pointerMoved = true;
      pointerActive = inside || dragging;
      const targetEl = event.target as HTMLElement | null;
      overDomControl = Boolean(
        targetEl?.closest("a, button, input, textarea, select, label, [role='button']")
      );

      if (dragging) {
        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;
        targetOrbitYaw = orbitBaseYaw + dx * 0.0085;
        targetOrbitPitch = Math.max(
          -0.48,
          Math.min(0.48, orbitBasePitch - dy * 0.0045)
        );
      }
      if (event.pointerType === "touch" && inside) {
        touchRevealUntil = performance.now() + 2400;
      }
    };

    const onStageDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      const curState = computeHeroToCarouselState(
        spatialProgressRef?.current ?? 0,
        projectsProgressRef?.current ?? 0
      );
      if (curState.carouselMix >= 0.35) return;
      const targetEl = event.target as HTMLElement | null;
      if (
        targetEl?.closest(
          "a, button, input, textarea, select, label, [role='button']"
        )
      ) {
        return;
      }
      updatePointerFromClient(event.clientX, event.clientY);
      pointerMoved = true;
      pointerActive = true;
      dragging = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      orbitBaseYaw = targetOrbitYaw;
      orbitBasePitch = targetOrbitPitch;
      if (event.pointerType === "touch") {
        touchRevealUntil = performance.now() + 2400;
      }
      try {
        container.setPointerCapture(event.pointerId);
      } catch {
        // Ignore capture failure on synthetic events
      }
    };

    const onStageUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      try {
        if (container.hasPointerCapture(event.pointerId)) {
          container.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Ignore capture release failures
      }
    };

    const onWindowLeave = () => {
      if (!dragging) {
        pointerActive = false;
        overDomControl = false;
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
        let samuraiLoaded = 0;
        let samuraiTotal = 8_651_784;
        let cuteLoaded = 0;
        let cuteTotal = 8_026_276;

        const updateFetchProgress = () => {
          const combined = (samuraiLoaded + cuteLoaded) / Math.max(1, samuraiTotal + cuteTotal);
          setProgress(Math.min(95, Math.round(combined * 95)));
        };

        const [samuraiBuffer, cuteBuffer] = await Promise.all([
          fetchGlbWithProgress(SAMURAI_MODEL, controller.signal, (l, t) => {
            samuraiLoaded = l;
            samuraiTotal = t;
            updateFetchProgress();
          }),
          fetchGlbWithProgress(CUTE_MODEL, controller.signal, (l, t) => {
            cuteLoaded = l;
            cuteTotal = t;
            updateFetchProgress();
          }),
        ]);

        await MeshoptDecoder.ready;
        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);

        const [samuraiGltf, cuteGltf] = await Promise.all([
          loader.parseAsync(samuraiBuffer, ""),
          loader.parseAsync(cuteBuffer, ""),
        ]);

        if (cleaned) return;
        setProgress(100);
        if (!reduced && !isSoftwareGl) {
          await new Promise((resolve) => setTimeout(resolve, 160));
        }
        if (cleaned) return;

        renderer = new THREE.WebGLRenderer({
          antialias: !isSoftwareGl,
          alpha: true,
          powerPreference: "high-performance",
        });
        renderer.setClearColor("#0D0B12", 0);
        renderer.autoClear = false;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.06;
        stage.appendChild(renderer.domElement);

        const maxAniso = isSoftwareGl
          ? 1
          : Math.min(4, renderer.capabilities.getMaxAnisotropy());

        const pmrem = new THREE.PMREMGenerator(renderer);
        const roomEnv = new RoomEnvironment();
        const envRT = pmrem.fromScene(roomEnv, 0.04);
        const envTexture = envRT.texture;
        roomEnv.dispose();
        pmrem.dispose();

        const cuteScene = new THREE.Scene();
        const samuraiScene = new THREE.Scene();
        cuteScene.environment = envTexture;
        samuraiScene.environment = envTexture;
        cuteScene.environmentIntensity = 0.72;
        samuraiScene.environmentIntensity = 0.88;

        const cuteLights = attachStudioLights(cuteScene);
        const samuraiLights = attachStudioLights(samuraiScene);

        const revealUniforms: RevealUniforms = {
          uRevealCenter: { value: new THREE.Vector2(-1000, -1000) },
          uRevealRadius: { value: 220 },
          uRevealMix: { value: 0 },
          uFullCutaway: { value: 0 },
        };

        const alignment = computeDualLayerAlignment(
          measureRotatedSceneBounds(cuteGltf.scene, -Math.PI / 2),
          measureRotatedSceneBounds(samuraiGltf.scene, -Math.PI / 2),
          CAT_MODEL_HEIGHT
        );

        const cuteRig = buildSegmentedCatRig({
          sourceRoot: cuteGltf.scene,
          facingRotationY: alignment.facingRotationY,
          centerOffset: alignment.cuteCenterOffset,
          scale: alignment.cuteScale,
          neckPivotY: alignment.neckPivotY,
          classify: classifyCuteSegment,
          maxAnisotropy: maxAniso,
        });

        const samuraiRig = buildSegmentedCatRig({
          sourceRoot: samuraiGltf.scene,
          facingRotationY: alignment.facingRotationY,
          centerOffset: alignment.samuraiCenterOffset,
          scale: alignment.samuraiScale,
          neckPivotY: alignment.neckPivotY,
          classify: classifySamuraiSegment,
          maxAnisotropy: maxAniso,
          revealUniforms,
        });

        cuteScene.add(cuteRig.rootGroup);
        samuraiScene.add(samuraiRig.rootGroup);

        // Lightweight proxy hit spheres synchronized with the cat silhouette
        const hitGroup = new THREE.Group();
        hitGroup.rotation.order = "YXZ";
        const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
        const headHitSphere = new THREE.Mesh(
          new THREE.SphereGeometry(1.16, 12, 10),
          proxyMat
        );
        headHitSphere.position.set(0, STAGE_CENTER_Y + 0.42, 0.05);
        const bodyHitSphere = new THREE.Mesh(
          new THREE.SphereGeometry(1.08, 12, 10),
          proxyMat
        );
        bodyHitSphere.position.set(0, STAGE_CENTER_Y - 0.72, 0);
        hitGroup.add(headHitSphere, bodyHitSphere);
        samuraiScene.add(hitGroup);
        const hitColliders: THREE.Object3D[] = [headHitSphere, bodyHitSphere];

        const modelCenter = new THREE.Vector3(0, STAGE_CENTER_Y, 0);
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

        let baseDistance = 7.4;
        let shown = false;

        const applyCameraFraming = (w: number) => {
          const isDesktop = w >= 768;
          const rawHero = spatialProgressRef?.current ?? 0;
          const rawProjects = projectsProgressRef?.current ?? 0;
          const spatial = computeSpatialScrollState(rawHero, rawProjects);
          const transition = computeHeroToCarouselState(rawHero, rawProjects);
          const centerMix = centerMixRef?.current ?? transition.centerMix;

          const heroShiftX = isDesktop ? 1.12 : 0;
          const heroCamX = modelCenter.x - heroShiftX * 1.04;
          const heroLookX = modelCenter.x - heroShiftX * 0.88;
          const heroCamY = isDesktop ? modelCenter.y - 0.06 : modelCenter.y - 0.35;
          const heroLookY = isDesktop ? modelCenter.y - 0.04 : modelCenter.y - 1.18;
          const heroCamZ = isDesktop
            ? Math.max(7.6, baseDistance * 1.08)
            : Math.max(9.2, baseDistance * 1.28);

          const orbitCamX = modelCenter.x;
          const orbitLookX = modelCenter.x;
          const orbitCamY = isDesktop ? modelCenter.y + 0.1 : modelCenter.y + 0.08;
          const orbitLookY = isDesktop ? modelCenter.y + 0.04 : modelCenter.y + 0.04;
          const orbitCamZ = Math.max(10.6, baseDistance * (isDesktop ? 1.54 : 1.66));

          const pullback = transition.orbitPullbackMix;
          const camX =
            heroCamX + (orbitCamX - heroCamX) * centerMix + transition.orbitCameraArcX * 0.35;
          const lookX = heroLookX + (orbitLookX - heroLookX) * centerMix;
          const camY =
            heroCamY +
            (orbitCamY - heroCamY) * pullback +
            0.12 * (1 - pullback) * centerMix +
            transition.orbitCameraArcY * 0.6;
          const lookY = heroLookY + (orbitLookY - heroLookY) * pullback;
          const camZ = Math.max(
            5.4,
            heroCamZ + (orbitCamZ - heroCamZ) * pullback + transition.cinematicDollyZ
          );

          camera.position.set(camX, camY, camZ);
          camera.lookAt(lookX, lookY, modelCenter.z);
          return { spatial, transition, centerMix, rawProjects };
        };

        const resize = () => {
          if (!renderer) return;
          const w = Math.max(1, stage.clientWidth);
          const h = Math.max(1, stage.clientHeight);
          const dpr = isSoftwareGl
            ? 1
            : Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2);
          renderer.setPixelRatio(dpr);
          renderer.setSize(w, h);
          camera.aspect = w / h;
          baseDistance = Math.max(
            (CAT_MODEL_HEIGHT * 0.65) / Math.tan(Math.PI / 12),
            1.75 / (Math.tan(Math.PI / 12) * camera.aspect)
          );
          applyCameraFraming(w);
          camera.updateProjectionMatrix();
          revealUniforms.uRevealRadius.value = (w < 700 ? 132 : 196) * dpr;
          if (shown) {
            renderer.clear();
            if (revealUniforms.uRevealMix.value > 0.01 || revealUniforms.uFullCutaway.value > 0.01) {
              renderer.render(cuteScene, camera);
              renderer.clearDepth();
            }
            if (revealUniforms.uFullCutaway.value < 0.99) {
              renderer.render(samuraiScene, camera);
            }
          }
        };
        resize();
        window.addEventListener("resize", resize);

        const clock = new THREE.Clock();
        const raycaster = new THREE.Raycaster();
        const lightPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.4);
        const lightTarget = new THREE.Vector3();
        const faceScreenAnchor = new THREE.Vector3();
        let smoothedHeadYaw = 0;
        let smoothedHeadPitch = 0;
        let smoothedBodyYaw = 0;
        let smoothedBodyPitch = 0;
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

          if (!shown) {
            shown = true;
            setReady(true);
          }

          const { spatial, transition, centerMix, rawProjects } = applyCameraFraming(
            stage.clientWidth
          );
          camera.updateMatrixWorld(true);

          const ctrl = controlsRef?.current;
          const layerMode: CatLayerMode = ctrl?.layerMode ?? "reveal";
          const azimuthOffset = ctrl?.lightAzimuth ?? 0;

          const active = pointerActive || performance.now() < touchRevealUntil;
          const dpr = renderer!.getPixelRatio();
          revealUniforms.uRevealCenter.value.set(
            (pointer.x * 0.5 + 0.5) * stage.clientWidth * dpr,
            (pointer.y * 0.5 + 0.5) * stage.clientHeight * dpr
          );

          const orbitAlpha = isSoftwareGl ? 0.55 : 1 - Math.exp(-dt * 8);
          currentOrbitYaw += (targetOrbitYaw - currentOrbitYaw) * orbitAlpha;
          currentOrbitPitch += (targetOrbitPitch - currentOrbitPitch) * orbitAlpha;

          // Keep whole-model orbit tilt aligned on both layers and hit proxies
          samuraiRig.rootGroup.rotation.set(currentOrbitPitch * 0.45, currentOrbitYaw * 0.65, 0);
          cuteRig.rootGroup.rotation.copy(samuraiRig.rootGroup.rotation);
          hitGroup.rotation.copy(samuraiRig.rootGroup.rotation);
          hitGroup.updateMatrixWorld(true);

          // Hover hit-check directly against the synchronized proxy colliders
          let modelHovered = false;
          if ((pointerActive || performance.now() < touchRevealUntil) && !overDomControl) {
            raycaster.setFromCamera(pointer, camera);
            const hits = raycaster.intersectObjects(hitColliders, false);
            modelHovered = hits.length > 0;
          }

          const targetFullCutaway = layerMode === "cute" ? 1 : 0;
          revealUniforms.uFullCutaway.value = targetFullCutaway;

          const wantsReveal =
            layerMode === "reveal" && modelHovered && targetFullCutaway < 0.5;
          const revealAlpha = reduced || isSoftwareGl ? 0.72 : 1 - Math.exp(-dt * 12);
          revealUniforms.uRevealMix.value +=
            ((wantsReveal ? 1 : 0) - revealUniforms.uRevealMix.value) * revealAlpha;

          // Synchronized pointer light across both scenes
          if (pointerMoved) {
            raycaster.setFromCamera(pointer, camera);
            raycaster.ray.intersectPlane(lightPlane, lightTarget);
          } else {
            lightTarget.set(
              1.6 * Math.sin(0.5 * elapsed + azimuthOffset),
              1.1 + 0.4 * Math.cos(0.35 * elapsed),
              3.2
            );
          }
          samuraiLights.pointerLight.position.lerp(
            lightTarget,
            reduced ? 1 : 1 - Math.exp(-dt * 7)
          );
          cuteLights.pointerLight.position.copy(samuraiLights.pointerLight.position);

          // Project the cat face into NDC screen space & compute camera sightline so hovering
          // straight over the cat's nose aligns both eyes straight toward the cursor.
          faceScreenAnchor.set(0, STAGE_CENTER_Y + 0.34, 0.25).project(camera);
          const camFacingYaw = Math.atan2(camera.position.x, camera.position.z);
          const camFacingPitch =
            Math.atan2(
              camera.position.y - (STAGE_CENTER_Y + 0.34),
              Math.hypot(camera.position.x, camera.position.z)
            ) * 0.35;

          const desired = computeSegmentedLookAngles({
            pointerX: pointer.x,
            pointerY: pointer.y,
            modelScreenX: faceScreenAnchor.x,
            modelScreenY: faceScreenAnchor.y,
            cameraFacingYaw: camFacingYaw,
            cameraFacingPitch: camFacingPitch,
            pointerActive: pointerMoved,
            elapsed,
            headBiasX: spatial.headBiasX,
            headBiasY: spatial.headBiasY,
            dragYaw: currentOrbitYaw,
            dragPitch: currentOrbitPitch,
            centerMix,
            carouselMix: transition.carouselMix,
            pullbackMix: transition.orbitPullbackMix,
            reducedMotion: reduced,
          });

          const headAlpha =
            reduced || isSoftwareGl ? 0.72 : 1 - Math.exp(-dt * (active ? 9.5 : 4.2));
          smoothedHeadYaw += (desired.headYaw - smoothedHeadYaw) * headAlpha;
          smoothedHeadPitch += (desired.headPitch - smoothedHeadPitch) * headAlpha;
          smoothedBodyYaw += (desired.bodyYaw - smoothedBodyYaw) * headAlpha;
          smoothedBodyPitch += (desired.bodyPitch - smoothedBodyPitch) * headAlpha;

          samuraiRig.headGroup.rotation.set(smoothedHeadPitch, smoothedHeadYaw, 0);
          cuteRig.headGroup.rotation.copy(samuraiRig.headGroup.rotation);

          samuraiRig.bodyGroup.rotation.set(smoothedBodyPitch, smoothedBodyYaw, 0);
          cuteRig.bodyGroup.rotation.copy(samuraiRig.bodyGroup.rotation);

          if (rootRef.current) {
            syncTelemetry(active, modelHovered, currentOrbitYaw, layerMode);
            rootRef.current.dataset.centerMix = centerMix.toFixed(2);
            rootRef.current.dataset.projectsProgress = rawProjects.toFixed(2);
            rootRef.current.dataset.gazeX = smoothedHeadYaw.toFixed(3);
            rootRef.current.dataset.gazeY = (-smoothedHeadPitch).toFixed(3);
            rootRef.current.dataset.revealMix = revealUniforms.uRevealMix.value.toFixed(2);
          }

          renderer!.clear();
          const needCutePass =
            revealUniforms.uRevealMix.value > 0.01 ||
            revealUniforms.uFullCutaway.value > 0.01;
          if (needCutePass) {
            renderer!.render(cuteScene, camera);
            renderer!.clearDepth();
          }
          if (revealUniforms.uFullCutaway.value < 0.99) {
            renderer!.render(samuraiScene, camera);
          }

          if (isSoftwareGl) {
            afterDraw(tick);
          } else {
            frameId = requestAnimationFrame(tick);
          }
        };

        tick();

        controller.signal.addEventListener("abort", () => {
          window.removeEventListener("resize", resize);
          samuraiRig.dispose();
          cuteRig.dispose();
          headHitSphere.geometry.dispose();
          bodyHitSphere.geometry.dispose();
          proxyMat.dispose();
          envRT.dispose();
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
    };
  }, [spatialProgressRef, projectsProgressRef, centerMixRef, controlsRef]);

  return (
    <div
      ref={rootRef}
      className={`particle-portrait ${ready ? "is-ready" : ""}`}
      data-phase={ready ? "ready" : "loading"}
      data-webgl={webglUnavailable ? "fallback" : "active"}
      data-hover-active="false"
      data-model-hovered="false"
      data-layer-mode="reveal"
      data-reveal-mix="0"
      data-orbit-rad="0"
      data-center-mix="0"
      data-gaze-x="0"
      data-gaze-y="0"
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
        aria-label="Loading 3D cat models"
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
