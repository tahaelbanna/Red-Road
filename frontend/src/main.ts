import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./style.css";
import { TERRAIN_SIZE_UNITS } from "./config/index";
import { LandingApp } from "./landing/LandingApp";
import { buildLandingUI } from "./landing/landingUI";
import { gridCellToScenePosition } from "./scene/coordinates";
import { setupClickToSelect, setupCursorZoom } from "./scene/input-controller";
import {
  initTargetOverlayPools,
  updateTargetVisuals,
} from "./scene/target-visuals";
import {
  buildMarker,
  buildRouteLine,
  buildScientificTargetMarker,
  buildTerrainMesh,
  buildTerrainWalls,
  clearEndMarker,
  clearRouteLine,
  clearStartMarker,
} from "./scene/terrain-builder";
import {
  fetchFeasibility,
  fetchHeightmapMeta,
  fetchScientificTargets,
  planRoute,
} from "./services/api.service";
import { Sound } from "./sound";
import {
  appState,
  currentEnvLimits,
  currentOxygenConfig,
  currentTraversalConfig,
} from "./state/app.state";
import { buildControlPanel } from "./ui/control-panel.ui";
import {
  initExplanationPanel,
  showExplanationEmptyState,
  showExplanationErrorState,
  showExplanationLoadingState,
  showRouteExplanation,
} from "./ui/explanation-panel.ui";
import { updateFeasibilityResultUI } from "./ui/feasibility.ui";
import { disableFocusMode } from "./ui/focus-mode.ui";
import { initRightUI } from "./ui/layout.ui";
import { hideRouteReport, showRouteReport } from "./ui/route-report.ui";
import { buildScientificExplorer } from "./ui/scientific-explorer.ui";
import { buildStatusOverlay, updateStatusText } from "./ui/status-overlay.ui";

export const sound = new Sound();

async function main() {
  appState.renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  appState.renderer.setSize(window.innerWidth, window.innerHeight);
  appState.renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(appState.renderer.domElement);

  startLanding();
}

export function destroyJezero() {
  const left = document.getElementById("ui-overlay-left");
  if (left) left.remove();
  if (appState.uiOverlayRight) {
    appState.uiOverlayRight.remove();
    appState.uiOverlayRight = null;
  }
  if (appState.focusModeIndicator) {
    appState.focusModeIndicator.remove();
    appState.focusModeIndicator = null;
  }
  if (appState.targetLabelsContainer) {
    appState.targetLabelsContainer.remove();
    appState.targetLabelsContainer = null;
  }
  if (appState.targetSvgOverlay) {
    appState.targetSvgOverlay.remove();
    appState.targetSvgOverlay = null;
  }

  appState.targetVisualsPool = [];
  appState.clusterVisualsPool = [];

  appState.zonePriorities = null;
  appState.zoneFeasibility = null;
  appState.zoneCopilot = null;
  appState.zoneExplorer = null;
  appState.targetDetailsPanelEl = null;

  if (appState.reportPanelEl) {
    appState.reportPanelEl.remove();
    appState.reportPanelEl = null;
  }
  if (appState.explanationPanelEl) {
    appState.explanationPanelEl.remove();
    appState.explanationPanelEl = null;
  }
  if (appState.statusEl) {
    appState.statusEl.remove();
    appState.statusEl = null;
  }

  if (appState.renderer) {
    appState.renderer.setAnimationLoop(null);
  }

  if (appState.jezeroAbortController) {
    appState.jezeroAbortController.abort();
    appState.jezeroAbortController = null;
  }

  if (appState.scene) {
    appState.scene.clear();
  }
}

export function startLanding() {
  appState.isJezeroActive = false;
  destroyJezero();

  const fader = document.createElement("div");
  fader.style.position = "fixed";
  fader.style.inset = "0";
  fader.style.backgroundColor = "#0a0a0a";
  fader.style.opacity = "0";
  fader.style.pointerEvents = "none";
  fader.style.transition = "opacity 1.2s ease-in-out";
  fader.style.zIndex = "9999";
  document.body.appendChild(fader);

  const landingApp = new LandingApp(appState.renderer, async () => {
    fader.style.opacity = "1";

    setTimeout(async () => {
      const landingUI = document.getElementById("landing-ui");
      if (landingUI) landingUI.remove();
      landingApp.destroy();

      document.body.style.backgroundColor = "#0a0a0a";
      if (!appState.isJezeroActive) {
        appState.isJezeroActive = true;
        await bootJezero(appState.renderer);
      }

      setTimeout(() => {
        fader.style.opacity = "0";
        setTimeout(() => {
          fader.remove();
        }, 1200);
      }, 100);
    }, 1200);
  });

  const landingUI = buildLandingUI(() => {
    sound.lock();
    sound.whoosh(3.2);
    landingUI.style.transition = "opacity 0.5s";
    landingUI.style.opacity = "0";
    landingApp.descendToJezero();
  });
  document.body.appendChild(landingUI);

  landingApp.start();
}

async function bootJezero(renderer: THREE.WebGLRenderer) {
  appState.heightmapMeta = await fetchHeightmapMeta();
  console.log("Loaded heightmap metadata:", appState.heightmapMeta);

  appState.scene = new THREE.Scene();
  appState.scene.background = new THREE.Color(0x0a0a0a);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(0, 60, 100);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.enableZoom = false;

  appState.mainCamera = camera;
  appState.mainControls = controls;

  const ambientLight = new THREE.AmbientLight(0x404050, 0.6);
  appState.scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff1e0, 2.0);
  sunLight.position.set(-50, 80, 50);
  appState.scene.add(sunLight);

  appState.terrainMesh = await buildTerrainMesh(appState.heightmapMeta);
  appState.scene.add(appState.terrainMesh);

  const baseSize = TERRAIN_SIZE_UNITS * 5;
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0502,
    roughness: 1.0,
    metalness: 0.0,
  });
  const basePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(baseSize, baseSize),
    baseMaterial,
  );
  basePlane.rotation.x = -Math.PI / 2;
  basePlane.position.y = -2.0;
  appState.scene.add(basePlane);

  const terrainWalls = buildTerrainWalls(
    appState.terrainMesh.geometry as THREE.BufferGeometry,
    -2.0,
  );
  appState.scene.add(terrainWalls);

  const divisions = Math.floor(baseSize / 2);
  const gridHelper = new THREE.GridHelper(
    baseSize,
    divisions,
    0x4a2311,
    0x33170a,
  );
  gridHelper.position.y = -1.98;

  const gridMaterial = gridHelper.material as THREE.LineBasicMaterial;
  gridMaterial.transparent = true;
  gridMaterial.opacity = 0.5;

  appState.scene.add(gridHelper);

  appState.loadedTargets = await fetchScientificTargets("jezero_crater");
  for (const target of appState.loadedTargets) {
    appState.scene.add(buildScientificTargetMarker(target));
  }

  initTargetOverlayPools();

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (
        appState.targetDetailsPanelEl &&
        appState.targetDetailsPanelEl.style.display !== "none"
      ) {
        appState.targetDetailsPanelEl.style.display = "none";
        appState.selectedTargetId = null;
        disableFocusMode();
      } else if (appState.isExplorerOpen) {
        const closeBtn = document
          .getElementById("explorer-panel")
          ?.querySelector("button");
        if (closeBtn) closeBtn.click();
      }
    }
  });

  document.addEventListener("pointerdown", (e) => {
    if (e.target === renderer.domElement) {
      appState.lastLayoutTime = 0;
    }
  });

  appState.statusEl = buildStatusOverlay();
  initExplanationPanel();
  updateStatusText();
  initRightUI();
  buildControlPanel();
  buildScientificExplorer();

  appState.jezeroAbortController = new AbortController();
  setupClickToSelect(
    renderer,
    camera,
    appState.jezeroAbortController.signal,
    handleCellPicked,
  );
  setupCursorZoom(
    renderer,
    camera,
    controls,
    appState.jezeroAbortController.signal,
  );

  function animate() {
    if (!appState.isJezeroActive) return;
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(appState.scene, camera);
    updateTargetVisuals(camera);
  }
  animate();

  window.addEventListener(
    "resize",
    () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    { signal: appState.jezeroAbortController.signal },
  );
}

async function handleCellPicked(cell: { row: number; col: number }) {
  if (!appState.selectedStart) {
    appState.selectedStart = cell;
    clearStartMarker();
    appState.startMarker = buildMarker(gridCellToScenePosition(cell), 0x00ff00);
    appState.scene.add(appState.startMarker);
    updateStatusText();
  } else if (!appState.selectedEnd) {
    appState.selectedEnd = cell;
    clearEndMarker();
    appState.endMarker = buildMarker(gridCellToScenePosition(cell), 0xff0000);
    appState.scene.add(appState.endMarker);

    await requestAndDrawRoute();
  } else {
    appState.selectedStart = cell;
    appState.selectedEnd = null;
    clearStartMarker();
    clearEndMarker();
    clearRouteLine();
    hideRouteReport();
    showExplanationEmptyState();
    appState.startMarker = buildMarker(gridCellToScenePosition(cell), 0x00ff00);
    appState.scene.add(appState.startMarker);
    updateStatusText();
  }
}

export async function requestAndDrawRoute() {
  if (!appState.selectedStart || !appState.selectedEnd) return;

  if (appState.statusEl) appState.statusEl.textContent = "Planning route...";
  showExplanationLoadingState();

  try {
    const response = await planRoute({
      region: "jezero_crater",
      start: appState.selectedStart,
      end: appState.selectedEnd,
      mission: appState.selectedMission,
      priorities: appState.currentPriorities,
      baseSpeedKmh: currentTraversalConfig.baseSpeedKmh,
      stationaryTimeHours: currentTraversalConfig.stationaryTimeHours,
    });

    clearRouteLine();

    if (response.found) {
      appState.routeLine = buildRouteLine(response.path);
      appState.scene.add(appState.routeLine);
      console.log("Route drawn:", response.metrics);
      (window as any).currentRouteMetrics = response.metrics;
      showRouteReport(response);
      if (response.explanation) {
        showRouteExplanation(
          response.explanation,
          appState.currentPriorities,
          response.metrics,
          appState.loadedTargets,
        );
      } else {
        showExplanationEmptyState();
      }
    } else {
      (window as any).currentRouteMetrics = null;
      console.warn("No path found between the selected points.");
      hideRouteReport();
      showExplanationErrorState();
    }

    updateStatusText(response.found ? response.metrics : undefined);

    const feasibilityResponse = await fetchFeasibility({
      durationHours: response.metrics
        ? response.metrics.estimatedTravelTimeHours
        : 0,
      routeFound: response.found,
      oxygenConfig: currentOxygenConfig,
      envLimits: currentEnvLimits,
    });
    updateFeasibilityResultUI(feasibilityResponse);
    return response.found;
  } catch (error) {
    console.error("Error planning route:", error);
    clearRouteLine();
    hideRouteReport();
    showExplanationErrorState();
    updateStatusText();
    updateFeasibilityResultUI(null);
    return false;
  }
}

main();

const styleEl = document.createElement("style");
styleEl.innerHTML = `
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
`;
document.head.appendChild(styleEl);
