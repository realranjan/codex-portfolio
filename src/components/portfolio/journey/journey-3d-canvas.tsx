"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
} from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { JourneyMilestone } from "@/data/experience-journey";
import {
  computeLandmark3DPlacements,
  computeMountain3DCameraPose,
  stepTraveler3DWalk,
} from "@/lib/mountain-3d-world";
import {
  buildJapaneseAtmosphereGroup,
  buildMilestoneLandmark3D,
  buildMountainFloraGroup,
  buildMountainTerrainMesh,
  buildSteppingStonesInstanced,
  buildTraveledPathRibbon,
  buildTravelerCat3D,
  createJapaneseArtTextureSet,
  type Landmark3DHandle,
} from "@/components/portfolio/journey/mountain-3d-builders";

export interface Journey3DCanvasHandle {
  /** Updates target scroll progress [0..1] imperatively without React re-renders. */
  setScrollProgress: (rawProgress: number, isUserScroll: boolean) => void;
}

export interface Journey3DCanvasProps {
  milestones: readonly JourneyMilestone[];
  initialProgress?: number;
  activeMilestoneId: string | null;
  displayedMilestoneId: string | null;
  onSelectMilestone: (milestone: JourneyMilestone) => void;
  onDismiss: () => void;
  stageDatasetRef?: RefObject<HTMLDivElement | null>;
  compact?: boolean;
}

/**
 * Probes whether the browser is using a software WebGL rasterizer (e.g. SwiftShader)
 * and immediately releases the probe context so zero WebGL slots leak.
 */
function detectSoftwareWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const probe = document.createElement("canvas");
    const gl =
      probe.getContext("webgl2") ||
      probe.getContext("webgl") ||
      (probe.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return true;
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const rendererStr = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? "")
      : "";
    const isSoft = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(
      rendererStr
    );
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return isSoft;
  } catch {
    return true;
  }
}

/**
 * Shortest signed angular difference (radians) in [-PI, PI].
 */
function shortestAngleDelta(from: number, to: number): number {
  let diff = (to - from + Math.PI) % (Math.PI * 2);
  if (diff < 0) diff += Math.PI * 2;
  return diff - Math.PI;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INTERACTIVE 3D JAPANESE MOUNTAIN CANVAS (THREE.JS)
 * -------------------------------------------------------------------------------
 * - Dedicated WebGL canvas initialized once inside useEffect(..., []).
 * - Procedural terrain with carved & vertex-blended footpath, beveled flagstones,
 *   stylized Japanese pines, trailside rocks, grass tufts, 3 carved stone steles,
 *   and an articulated 12-part 3D traveler cat walking strictly on scroll.
 * - Follow-behind perspective camera with warm ivory sky (#F3E9DE) & horizon fog.
 * - Click-only 3D stone picking & projected accessible labels (zero hover open!).
 * - Software-WebGL safe via on-demand coalesced rendering + WebGL2 fenceSync.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export const Journey3DCanvas = forwardRef<
  Journey3DCanvasHandle,
  Journey3DCanvasProps
>(function Journey3DCanvas(
  {
    milestones,
    initialProgress = 0,
    activeMilestoneId,
    displayedMilestoneId,
    onSelectMilestone,
    onDismiss,
    stageDatasetRef,
    compact = false,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [webglReady, setWebglReady] = useState(false);

  // Mutable refs so prop changes never re-initialize the Three.js WebGLRenderer
  const milestonesRef = useRef(milestones);
  const activeIdRef = useRef(activeMilestoneId);
  const displayedIdRef = useRef(displayedMilestoneId);
  const onSelectRef = useRef(onSelectMilestone);
  const onDismissRef = useRef(onDismiss);
  const compactRef = useRef(compact);

  useEffect(() => {
    milestonesRef.current = milestones;
  }, [milestones]);
  useEffect(() => {
    onSelectRef.current = onSelectMilestone;
  }, [onSelectMilestone]);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);
  useEffect(() => {
    compactRef.current = compact;
  }, [compact]);

  // Imperative bridge between React / GSAP and the Three.js scene loop
  const engineBridgeRef = useRef<{
    setScrollProgress: (rawProgress: number, isUserScroll: boolean) => void;
    requestRender: () => void;
  } | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      setScrollProgress(rawProgress: number, isUserScroll: boolean) {
        engineBridgeRef.current?.setScrollProgress(rawProgress, isUserScroll);
      },
    }),
    []
  );

  // Sync active/displayed milestone highlight state into Three.js without remounting
  useEffect(() => {
    activeIdRef.current = activeMilestoneId;
    displayedIdRef.current = displayedMilestoneId;
    engineBridgeRef.current?.requestRender();
  }, [activeMilestoneId, displayedMilestoneId]);

  useEffect(() => {
    const containerEl = containerRef.current;
    const mountEl = canvasMountRef.current;
    if (!containerEl || !mountEl) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const initialW = Math.max(1, containerEl.clientWidth || 1280);
    const initialH = Math.max(1, containerEl.clientHeight || 720);

    // 1. Renderer setup (ACES Filmic + sRGB + software-GL guard)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.setSize(initialW, initialH, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
    renderer.shadowMap.enabled = !isSoftwareGl;
    if (!isSoftwareGl) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.setAttribute("data-testid", "journey-3d-webgl-canvas");
    mountEl.innerHTML = "";
    mountEl.appendChild(renderer.domElement);

    const maxAnisotropy = Math.min(
      8,
      renderer.capabilities.getMaxAnisotropy?.() || 1
    );

    // 2. Scene, Warm Ivory Sky (#F3E9DE), Exponential Horizon Fog, & RoomEnvironment IBL
    const scene = new THREE.Scene();
    const skyColor = new THREE.Color(0xf3e9de);
    scene.background = skyColor;
    scene.fog = new THREE.FogExp2(0xf3e9de, 0.0138);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.44;
    roomEnv.dispose();
    pmrem.dispose();

    // 3. Perspective Follow Camera (far=260 cleanly encompasses the 158m Japanese sky dome)
    const camera = new THREE.PerspectiveCamera(42, initialW / initialH, 0.25, 260);

    // 4. Three-point Natural Daylight Mountain Rig
    const hemiLight = new THREE.HemisphereLight(0xf6f0e8, 0x9b8876, 0.84);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff2dd, 1.92);
    sunLight.position.set(22, 34, 38);
    if (!isSoftwareGl) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(1024, 1024);
      sunLight.shadow.camera.near = 6;
      sunLight.shadow.camera.far = 110;
      const d = 26;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.024;
    }
    scene.add(sunLight);
    scene.add(sunLight.target);

    // Subtle warm back-rim light separating the seigaiha travel cloak against mountain ridges
    const rimLight = new THREE.DirectionalLight(0xffe7cf, 0.48);
    rimLight.position.set(-22, 18, -42);
    scene.add(rimLight);

    // 5. Procedural Japanese Art Texture Suite & Complete 3D Mountain World
    const artTextures = createJapaneseArtTextureSet(maxAnisotropy);

    const atmosphereGroup = buildJapaneseAtmosphereGroup(artTextures);
    scene.add(atmosphereGroup);

    const terrainMesh = buildMountainTerrainMesh(artTextures);
    scene.add(terrainMesh);

    const steppingStones = buildSteppingStonesInstanced(artTextures);
    scene.add(steppingStones);

    const traveledPath = buildTraveledPathRibbon();
    scene.add(traveledPath.mesh);

    const floraGroup = buildMountainFloraGroup(artTextures);
    scene.add(floraGroup);

    const travelerCat = buildTravelerCat3D(artTextures);
    scene.add(travelerCat.group);

    // Three grounded carved 3D stone landmarks (iMerit, Haegl Tech, RYVO)
    const placements = computeLandmark3DPlacements(milestonesRef.current);
    const landmarkHandles: Landmark3DHandle[] = placements.map((pl, idx) => {
      const m = milestonesRef.current[idx];
      const handle = buildMilestoneLandmark3D(m, pl, artTextures, maxAnisotropy);
      scene.add(handle.group);
      return handle;
    });
    const hitboxes = landmarkHandles.map((h) => h.hitbox);

    // 6. Initialize Pose Deterministically from initialProgress
    const startProgress = THREE.MathUtils.clamp(initialProgress, 0, 1);
    const initialPose = computeMountain3DCameraPose(
      startProgress,
      milestonesRef.current
    );

    const state = {
      targetProgress: startProgress,
      currentProgress: startProgress,
      prevWalkProgress: startProgress,
      stridePhase: 0,
      travelDir: 1 as 1 | -1,
      walkIntensity: 0,
      lastScrollAtMs: 0,
      turnOffsetRad: 0,
      pointerNormX: 0,
      pointerNormY: 0,
      dampedPointerX: 0,
      dampedPointerY: 0,
      catPos: new THREE.Vector3(
        initialPose.catPosition.x,
        initialPose.catPosition.y,
        initialPose.catPosition.z
      ),
      catYaw: initialPose.catYawRad,
      catPitch: initialPose.catPitchRad,
      camPos: new THREE.Vector3(
        initialPose.cameraPosition.x,
        initialPose.cameraPosition.y,
        initialPose.cameraPosition.z
      ),
      camLook: new THREE.Vector3(
        initialPose.cameraLookAt.x,
        initialPose.cameraLookAt.y,
        initialPose.cameraLookAt.z
      ),
      camFov: initialPose.cameraFov,
      viewportW: initialW,
      viewportH: initialH,
    };

    // Place camera & cat immediately on frame 0 (no jump-in on initial paint)
    travelerCat.group.position.copy(state.catPos);
    travelerCat.group.rotation.set(state.catPitch, state.catYaw, 0);
    traveledPath.setProgress(initialPose.trailT);
    camera.position.copy(state.camPos);
    camera.fov = state.camFov;
    camera.updateProjectionMatrix();
    camera.lookAt(state.camLook);
    sunLight.target.position.copy(state.catPos);
    sunLight.position.set(
      state.catPos.x + 20,
      state.catPos.y + 30,
      state.catPos.z + 18
    );

    // Pre-compile shaders only on hardware GPU (skip on SwiftShader to avoid startup stall)
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pre-allocated scratch math objects (zero per-frame GC allocations)
    const scratchTargetCatPos = new THREE.Vector3();
    const scratchTargetCamPos = new THREE.Vector3();
    const scratchTargetCamLook = new THREE.Vector3();
    const scratchProj = new THREE.Vector3();
    const scratchPointerNdc = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const colorSteleBase = new THREE.Color(0xb4a496);
    const colorSteleActive = new THREE.Color(0xcbc0b4);

    // 7. Coalesced On-Demand Render Loop + Software-GL FenceSync
    let disposed = false;
    let rafId = 0;
    let busy = false;
    let dirty = false;
    let lastFrameTimeMs = performance.now();
    const activeTimers = new Set<number>();

    const scheduleTimer = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        activeTimers.delete(id);
        if (!disposed) fn();
      }, ms);
      activeTimers.add(id);
    };

    const afterDraw = (done: () => void) => {
      if (!isSoftwareGl) {
        done();
        return;
      }
      const gl = renderer.getContext();
      if (!(gl instanceof WebGL2RenderingContext)) {
        scheduleTimer(done, 45);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        scheduleTimer(done, 45);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const status = gl.clientWaitSync(sync, 0, 0);
        if (status === gl.TIMEOUT_EXPIRED) {
          scheduleTimer(poll, 5);
        } else {
          gl.deleteSync(sync);
          scheduleTimer(done, 45);
        }
      };
      scheduleTimer(poll, 5);
    };

    const updateProjectedLabels = () => {
      const w = state.viewportW;
      const h = state.viewportH;
      const activeId = activeIdRef.current;
      const displayedId = displayedIdRef.current;

      for (let i = 0; i < landmarkHandles.length; i++) {
        const handle = landmarkHandles[i];
        const btn = labelRefs.current[i];
        if (!btn) continue;

        scratchProj.copy(handle.anchorWorld).project(camera);
        const dist = camera.position.distanceTo(handle.anchorWorld);
        const inFront = scratchProj.z > -1 && scratchProj.z < 1;
        const sx = (scratchProj.x * 0.5 + 0.5) * w;
        const sy = (-scratchProj.y * 0.5 + 0.5) * h;

        const maxVisibleDist = compactRef.current ? 30 : 34;
        const withinBounds =
          sx > 28 && sx < w - 28 && sy > 58 && sy < h - 78 && dist < maxVisibleDist;

        const isFocused = handle.id === activeId || handle.id === displayedId;
        if (!inFront || !withinBounds) {
          btn.style.opacity = "0";
          btn.style.pointerEvents = "none";
          continue;
        }

        // Restrained focal hierarchy: upcoming distant stones whisper softly;
        // the current stone landmark reads clearly without cluttering the scene.
        const distFade = THREE.MathUtils.clamp(
          1 - (dist - 12) / (maxVisibleDist - 10),
          0.16,
          1
        );
        const opacity = isFocused ? Math.max(0.95, distFade) : distFade * 0.72;

        btn.style.opacity = opacity.toFixed(3);
        btn.style.pointerEvents = opacity > 0.25 ? "auto" : "none";
        btn.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
      }
    };

    const renderFrame = () => {
      rafId = 0;
      if (disposed) return;

      busy = true;
      dirty = false;

      const now = performance.now();
      const elapsedSec = Math.max(0.001, (now - lastFrameTimeMs) / 1000);
      const dt = Math.min(elapsedSec, 0.05);
      // Allow real elapsed time (up to 0.35s) for smooth convergence even under software WebGL
      const convergeDt = Math.min(elapsedSec, 0.35);
      lastFrameTimeMs = now;

      // Desktop ScrollTrigger already scrubs smoothly; snap directly when not compact
      // (or on large instant jumps) so 3D cat & camera never lag behind the active checkpoint!
      const prevProgress = state.currentProgress;
      const deltaToTarget = Math.abs(state.targetProgress - state.currentProgress);
      if (!compactRef.current || deltaToTarget > 0.35 || isSoftwareGl) {
        state.currentProgress = state.targetProgress;
      } else {
        const progressAlpha = 1 - Math.exp(-8.5 * convergeDt);
        state.currentProgress +=
          (state.targetProgress - state.currentProgress) * progressAlpha;
        if (Math.abs(state.targetProgress - state.currentProgress) < 0.0004) {
          state.currentProgress = state.targetProgress;
        }
      }

      // Compute pose for current progress
      const pose = computeMountain3DCameraPose(
        state.currentProgress,
        milestonesRef.current
      );

      // Scroll-driven walk stride & idle decay (strictly proportional to scroll; zero endless autoplay)
      const walkStep = stepTraveler3DWalk({
        prevProgress,
        nextProgress: state.currentProgress,
        prevStridePhase: state.stridePhase,
        prevTravelDir: state.travelDir,
      });

      const msSinceScroll = now - state.lastScrollAtMs;
      const isActivelyStepping = walkStep.isMoving || msSinceScroll < 140;

      if (walkStep.isMoving) {
        state.stridePhase = walkStep.stridePhase;
        state.travelDir = walkStep.travelDir;
      }

      const targetWalkIntensity = isActivelyStepping ? 1 : 0;
      const walkAlpha = 1 - Math.exp(-(isActivelyStepping ? 14 : 9) * convergeDt);
      state.walkIntensity +=
        (targetWalkIntensity - state.walkIntensity) * walkAlpha;
      if (state.walkIntensity < 0.008 && !isActivelyStepping) {
        state.walkIntensity = 0;
      }

      // Smoothly turn traveler cat around on reverse scroll (PI offset), forward on advance (0)
      const targetTurnOffset = state.travelDir === -1 ? Math.PI : 0;
      state.turnOffsetRad +=
        shortestAngleDelta(state.turnOffsetRad, targetTurnOffset) *
        (1 - Math.exp(-10 * convergeDt));

      // Fast, responsive tracking (snaps cleanly on large scroll jumps or software GL)
      const snapImmediate = isSoftwareGl || deltaToTarget > 0.12;
      const camAlpha = snapImmediate ? 1 : 1 - Math.exp(-12 * dt);
      const catAlpha = snapImmediate ? 1 : 1 - Math.exp(-16 * dt);
      const ptrAlpha = 1 - Math.exp(-6.0 * dt);

      // Update cat world position & orientation
      scratchTargetCatPos.set(
        pose.catPosition.x,
        pose.catPosition.y,
        pose.catPosition.z
      );
      state.catPos.lerp(scratchTargetCatPos, catAlpha);
      const desiredYaw = pose.catYawRad + state.turnOffsetRad;
      state.catYaw += shortestAngleDelta(state.catYaw, desiredYaw) * catAlpha;
      state.catPitch += (pose.catPitchRad - state.catPitch) * catAlpha;

      travelerCat.group.position.copy(state.catPos);
      travelerCat.group.rotation.set(state.catPitch, state.catYaw, 0);

      // Apply articulated limb gait damped cleanly to calm standing idle when walkIntensity -> 0
      const wInt = state.walkIntensity;
      const sSin = Math.sin(state.stridePhase);
      const sCos = Math.cos(state.stridePhase);
      travelerCat.leftLeg.rotation.x = sSin * 0.52 * wInt;
      travelerCat.rightLeg.rotation.x = -sSin * 0.52 * wInt;
      travelerCat.leftArm.rotation.x = -sSin * 0.42 * wInt;
      travelerCat.rightArm.rotation.x = sSin * 0.34 * wInt;
      travelerCat.bodyGroup.position.y = 0.34 + Math.abs(sSin) * 0.044 * wInt;
      travelerCat.bodyGroup.rotation.z = sCos * 0.036 * wInt;
      travelerCat.headGroup.rotation.y = -sCos * 0.045 * wInt;
      travelerCat.scarfTail.rotation.x =
        (0.14 + Math.sin(state.stridePhase * 1.35) * 0.16) * wInt;
      travelerCat.scarfTail.rotation.y =
        Math.cos(state.stridePhase * 0.9) * 0.18 * wInt;
      travelerCat.catTail.rotation.y =
        Math.sin(state.stridePhase * 0.85) * 0.22 * wInt;

      // Update Burgundy traveled path trace behind the traveler cat
      traveledPath.setProgress(pose.trailT);

      // Damped subtle pointer parallax (restrained +-0.32m shift, never dizzy)
      state.dampedPointerX += (state.pointerNormX - state.dampedPointerX) * ptrAlpha;
      state.dampedPointerY += (state.pointerNormY - state.dampedPointerY) * ptrAlpha;

      // Update follow-behind perspective camera
      scratchTargetCamPos.set(
        pose.cameraPosition.x + state.dampedPointerX * 0.36,
        pose.cameraPosition.y + state.dampedPointerY * 0.18,
        pose.cameraPosition.z
      );
      scratchTargetCamLook.set(
        pose.cameraLookAt.x + state.dampedPointerX * 0.14,
        pose.cameraLookAt.y + state.dampedPointerY * 0.08,
        pose.cameraLookAt.z
      );
      state.camPos.lerp(scratchTargetCamPos, camAlpha);
      state.camLook.lerp(scratchTargetCamLook, camAlpha);
      state.camFov += (pose.cameraFov - state.camFov) * camAlpha;

      camera.position.copy(state.camPos);
      if (Math.abs(camera.fov - state.camFov) > 0.01) {
        camera.fov = state.camFov;
        camera.updateProjectionMatrix();
      }
      camera.lookAt(state.camLook);

      // Move directional sun shadow frustum smoothly with the traveler cat
      sunLight.target.position.copy(state.catPos);
      sunLight.position.set(
        state.catPos.x + 20,
        state.catPos.y + 30,
        state.catPos.z + 18
      );

      // Subtle static burgundy warmth on active/displayed stone stele (zero pulse/glow spam)
      const activeId = activeIdRef.current;
      const displayedId = displayedIdRef.current;
      for (let i = 0; i < landmarkHandles.length; i++) {
        const h = landmarkHandles[i];
        const isHighlighted = h.id === displayedId || h.id === activeId;
        h.sealMaterial.emissiveIntensity = isHighlighted ? 0.42 : 0.08;
        h.steleMaterial.color.copy(
          isHighlighted ? colorSteleActive : colorSteleBase
        );
      }

      // Sync lightweight DOM telemetry attributes for automated verification
      const stageEl = stageDatasetRef?.current;
      if (stageEl) {
        stageEl.dataset.webglReady = "true";
        stageEl.dataset.cameraZ = state.camPos.z.toFixed(2);
        stageEl.dataset.catZ = state.catPos.z.toFixed(2);
        stageEl.dataset.catY = state.catPos.y.toFixed(2);
        stageEl.dataset.walkIntensity = state.walkIntensity.toFixed(2);
      }

      renderer.render(scene, camera);
      updateProjectedLabels();

      // Determine whether any motion/damping still needs settling
      const posErr =
        state.camPos.distanceToSquared(scratchTargetCamPos) +
        state.catPos.distanceToSquared(scratchTargetCatPos);
      const progErr = Math.abs(state.targetProgress - state.currentProgress);
      const ptrErr =
        Math.abs(state.pointerNormX - state.dampedPointerX) +
        Math.abs(state.pointerNormY - state.dampedPointerY);
      const stillSettling =
        progErr > 0.0003 ||
        posErr > 0.0004 ||
        state.walkIntensity > 0.01 ||
        ptrErr > 0.005 ||
        Math.abs(shortestAngleDelta(state.turnOffsetRad, targetTurnOffset)) > 0.015;

      afterDraw(() => {
        busy = false;
        if (disposed) return;
        if (dirty || stillSettling) {
          requestRender();
        }
      });
    };

    const requestRender = () => {
      if (disposed) return;
      if (busy) {
        dirty = true;
        return;
      }
      if (!rafId) {
        lastFrameTimeMs = performance.now();
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    engineBridgeRef.current = {
      setScrollProgress(rawProgress: number, isUserScroll: boolean) {
        const clamped = THREE.MathUtils.clamp(rawProgress, 0, 1);
        const delta = Math.abs(clamped - state.targetProgress);
        state.targetProgress = clamped;
        if (isUserScroll && delta > 0.0002) {
          state.lastScrollAtMs = performance.now();
        }
        requestRender();
      },
      requestRender,
    };

    // 8. Click-Only 3D Stone Picking (NO hover open — pointermove only sets cursor & gentle drift)
    let pointerDownX = 0;
    let pointerDownY = 0;
    let lastHoverCheckMs = 0;

    const pickMilestoneAtClient = (
      clientX: number,
      clientY: number
    ): JourneyMilestone | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      scratchPointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      scratchPointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(scratchPointerNdc, camera);
      const hits = raycaster.intersectObjects(hitboxes, false);
      if (hits.length === 0) return null;
      const hitId = hits[0].object.userData?.milestoneId as string | undefined;
      if (!hitId) return null;
      return landmarkHandles.find((h) => h.id === hitId)?.milestone ?? null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      if (!compactRef.current) {
        state.pointerNormX = THREE.MathUtils.clamp(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -1,
          1
        );
        state.pointerNormY = THREE.MathUtils.clamp(
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
          -1,
          1
        );
        requestRender();
      }

      const now = performance.now();
      if (now - lastHoverCheckMs > 55) {
        lastHoverCheckMs = now;
        const hovered = pickMilestoneAtClient(e.clientX, e.clientY);
        renderer.domElement.style.cursor = hovered ? "pointer" : "default";
      }
    };

    const onPointerLeave = () => {
      state.pointerNormX = 0;
      state.pointerNormY = 0;
      renderer.domElement.style.cursor = "default";
      requestRender();
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const moveDist = Math.hypot(
        e.clientX - pointerDownX,
        e.clientY - pointerDownY
      );
      if (moveDist > 8) return;
      const picked = pickMilestoneAtClient(e.clientX, e.clientY);
      if (picked) {
        onSelectRef.current(picked);
      } else {
        onDismissRef.current();
      }
    };

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    // 9. ResizeObserver keeping camera aspect & projection crisp
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(1, Math.round(entry.contentRect.width));
        const h = Math.max(1, Math.round(entry.contentRect.height));
        if (w === state.viewportW && h === state.viewportH) continue;
        state.viewportW = w;
        state.viewportH = h;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        requestRender();
      }
    });
    resizeObserver.observe(containerEl);

    // Paint initial frame immediately and mark ready
    setWebglReady(true);
    requestRender();

    // 10. Exhaustive WebGL & DOM Cleanup on Unmount
    return () => {
      disposed = true;
      engineBridgeRef.current = null;
      if (rafId) window.cancelAnimationFrame(rafId);
      for (const id of activeTimers) window.clearTimeout(id);
      activeTimers.clear();

      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const mats = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          for (const mat of mats) {
            if (!mat) continue;
            const std = mat as THREE.MeshStandardMaterial;
            std.map?.dispose();
            std.bumpMap?.dispose();
            std.roughnessMap?.dispose();
            mat.dispose();
          }
        }
      });

      artTextures.disposeAll();
      envRT.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mountEl) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, [initialProgress, stageDatasetRef]);

  return (
    <div
      ref={containerRef}
      data-testid={compact ? "journey-3d-mobile-viewport" : "journey-3d-viewport"}
      data-webgl-ready={webglReady ? "true" : "false"}
      className="relative h-full w-full overflow-hidden bg-[#F3E9DE]"
    >
      {/* Dedicated WebGL canvas mount — untouched by React state updates */}
      <div ref={canvasMountRef} className="absolute inset-0 h-full w-full" />

      {/* Whisper-light handmade Japanese washi paper fiber texture unifying the 3D print */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-[0.14] mix-blend-multiply"
      >
        <filter id="japanese-washi-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.72"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0.32 0 0 0 0.56  0 0.28 0 0 0.50  0 0 0.24 0 0.44  0 0 0 0.65 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#japanese-washi-grain)" />
      </svg>

      {/* Projected accessible HTML landmark buttons anchored directly above each 3D stone stele.
          Click-only (no hover open) so keyboard, touch, and screen-reader users can inspect any stone. */}
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {milestones.map((milestone, idx) => {
          const isDisplayed = displayedMilestoneId === milestone.id;
          const isCurrent = activeMilestoneId === milestone.id;
          return (
            <button
              key={milestone.id}
              ref={(el) => {
                labelRefs.current[idx] = el;
              }}
              type="button"
              data-testid={`milestone-marker-${milestone.id}`}
              aria-label={`Inspect ${milestone.companyName} (${milestone.number})`}
              aria-expanded={isDisplayed}
              onClick={(e) => {
                e.stopPropagation();
                onSelectMilestone(milestone);
              }}
              style={{
                opacity: 0,
                pointerEvents: "none",
                left: 0,
                top: 0,
              }}
              className="group absolute will-change-transform flex flex-col items-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#792B33]"
            >
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] whitespace-nowrap transition-colors border ${
                  isDisplayed
                    ? "bg-[#792B33] text-[#F3E9DE] border-[#792B33]"
                    : isCurrent
                      ? "bg-[#F3E9DE]/95 text-[#792B33] border-[#792B33]/55 group-hover:bg-[#792B33] group-hover:text-[#F3E9DE]"
                      : "bg-[#F3E9DE]/88 text-[#522429]/85 border-[#792B33]/28 group-hover:border-[#792B33] group-hover:text-[#792B33]"
                }`}
              >
                <span className="tabular-nums font-semibold">
                  {milestone.number}
                </span>
                <span aria-hidden="true">·</span>
                <span>{milestone.companyName}</span>
              </span>
              <span
                aria-hidden="true"
                className={`h-3 w-px transition-colors ${
                  isDisplayed ? "bg-[#792B33]" : "bg-[#792B33]/45"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
});
