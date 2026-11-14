import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CLICK_DRAG_THRESHOLD_PX,
  MAX_ZOOM_DISTANCE,
  MIN_ZOOM_DISTANCE,
} from "../config/index";
import { type ScientificTarget } from "../interfaces/index";
import { sound, startLanding } from "../main";
import { appState } from "../state/app.state";
import { showTargetDetails } from "../ui/target-details.ui";
import { focusTarget } from "./camera-controller";
import { scenePositionToGridCell } from "./coordinates";

export function setupClickToSelect(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  signal: AbortSignal,
  onCellPicked: (cell: { row: number; col: number }) => void,
) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let downX = 0;
  let downY = 0;

  renderer.domElement.addEventListener(
    "pointerdown",
    (event) => {
      downX = event.clientX;
      downY = event.clientY;
    },
    { signal },
  );

  renderer.domElement.addEventListener(
    "pointerup",
    (event) => {
      const movedDistance = Math.hypot(
        event.clientX - downX,
        event.clientY - downY,
      );
      if (movedDistance > CLICK_DRAG_THRESHOLD_PX) return;

      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      const targetHits = raycaster.intersectObjects(appState.targetMeshes);
      if (targetHits.length > 0) {
        const mesh = targetHits[0].object as THREE.Mesh;
        const target = mesh.userData.target as ScientificTarget;
        if (target) {
          focusTarget(target);
          showTargetDetails(target);
          return;
        }
      }

      const hits = raycaster.intersectObject(appState.terrainMesh);
      if (hits.length === 0) return;

      const point = hits[0].point;
      const cell = scenePositionToGridCell(point);
      onCellPicked(cell);
    },
    { signal },
  );
}

let pushOut = 0;
export function setupCursorZoom(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  signal: AbortSignal,
) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  renderer.domElement.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();

      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(appState.terrainMesh);
      const hitPoint =
        hits.length > 0 ? hits[0].point : controls.target.clone();

      const toHit = new THREE.Vector3().subVectors(hitPoint, camera.position);
      const currentDistance = toHit.length();

      if (event.deltaY > 0 && currentDistance >= MAX_ZOOM_DISTANCE * 0.98) {
        pushOut += event.deltaY;
        if (pushOut > 200) {
          pushOut = 0;
          sound.whoosh(2.0);
          startLanding();
        }
      } else {
        pushOut = 0;
      }

      const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
      const newDistance = THREE.MathUtils.clamp(
        currentDistance * zoomFactor,
        MIN_ZOOM_DISTANCE,
        MAX_ZOOM_DISTANCE,
      );

      const moveAmount = currentDistance - newDistance;
      const moveVector = toHit.normalize().multiplyScalar(moveAmount);

      camera.position.add(moveVector);
      controls.target.add(moveVector);
      controls.update();
    },
    { passive: false, signal },
  );
}
