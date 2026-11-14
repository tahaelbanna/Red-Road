import * as THREE from "three";
import { type ScientificTarget } from "../interfaces/index";
import { sound } from "../main";
import { appState } from "../state/app.state";
import { enableFocusMode } from "../ui/focus-mode.ui";
import { gridCellToScenePosition } from "./coordinates";

export function focusCluster(targets: ScientificTarget[]) {
  sound.click();
  if (!appState.mainCamera || !appState.mainControls || targets.length === 0)
    return;

  let sumX = 0,
    sumY = 0,
    sumZ = 0;
  for (const t of targets) {
    const pt = gridCellToScenePosition({ row: t.row, col: t.col });
    sumX += pt.x;
    sumY += pt.y;
    sumZ += pt.z;
  }
  const len = targets.length;
  const pt = new THREE.Vector3(sumX / len, sumY / len, sumZ / len);

  const startPos = appState.mainCamera.position.clone();
  const targetPos = new THREE.Vector3(
    pt.x + 30,
    Math.max(pt.y + 30, 40),
    pt.z + 30,
  );
  const startTarget = appState.mainControls.target.clone();
  const targetTarget = pt.clone();

  const duration = 800;
  const startTime = performance.now();

  function animateCamera(time: number) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    const t = 1 - Math.pow(1 - progress, 3);

    appState.mainCamera!.position.lerpVectors(startPos, targetPos, t);
    appState.mainControls!.target.lerpVectors(startTarget, targetTarget, t);
    appState.mainControls!.update();

    if (progress < 1.0) requestAnimationFrame(animateCamera);
  }
  requestAnimationFrame(animateCamera);
}

export function focusTarget(target: ScientificTarget) {
  sound.click();
  enableFocusMode();
  const pt = gridCellToScenePosition({ row: target.row, col: target.col });
  if (!appState.mainCamera || !appState.mainControls) {
    console.error("[FocusTarget] ABORT: mainCamera or mainControls is null");
    return;
  }

  const isRegion = target.category === "region";
  const desiredDistance = isRegion ? 20 : 8;

  const cameraOffset = new THREE.Vector3(
    desiredDistance * 0.5,
    desiredDistance * 0.7,
    desiredDistance * 0.5,
  );

  const endCameraPos = pt.clone().add(cameraOffset);
  const endControlsTarget = pt.clone();

  const startCameraPos = appState.mainCamera.position.clone();
  const startControlsTarget = appState.mainControls.target.clone();

  const duration = isRegion ? 1200 : 900;
  const startTime = performance.now();

  appState.mainControls.enabled = false;

  function animateCamera(time: number) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    const t = 1 - Math.pow(1 - progress, 3);

    appState.mainCamera!.position.lerpVectors(startCameraPos, endCameraPos, t);
    appState.mainControls!.target.lerpVectors(
      startControlsTarget,
      endControlsTarget,
      t,
    );
    appState.mainControls!.update();

    if (progress < 1.0) {
      requestAnimationFrame(animateCamera);
    } else {
      appState.mainControls!.enabled = true;
      appState.mainControls!.update();
    }
  }
  requestAnimationFrame(animateCamera);
}
