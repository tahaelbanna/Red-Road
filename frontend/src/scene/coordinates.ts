import * as THREE from "three";
import {
  TERRAIN_GRID_COLS,
  TERRAIN_GRID_ROWS,
  TERRAIN_SIZE_UNITS,
} from "../config/index";
import { type RouteCell } from "../interfaces/index";
import { appState } from "../state/app.state";

export function scenePositionToGridCell(point: THREE.Vector3): {
  row: number;
  col: number;
} {
  const u = point.x / TERRAIN_SIZE_UNITS + 0.5;
  const v = point.z / TERRAIN_SIZE_UNITS + 0.5;

  const col = Math.round(u * (TERRAIN_GRID_COLS - 1));
  const row = Math.round(v * (TERRAIN_GRID_ROWS - 1));

  return {
    row: Math.min(Math.max(row, 0), TERRAIN_GRID_ROWS - 1),
    col: Math.min(Math.max(col, 0), TERRAIN_GRID_COLS - 1),
  };
}

export function sampledScenePosition(u: number, v: number): THREE.Vector3 {
  const sceneX = (u - 0.5) * TERRAIN_SIZE_UNITS;
  const sceneZ = (v - 0.5) * TERRAIN_SIZE_UNITS;

  const pixelX = Math.floor(u * (appState.heightmapMeta.size_pixels - 1));
  const pixelY = Math.floor(v * (appState.heightmapMeta.size_pixels - 1));
  const normalizedHeight =
    appState.heightmapPixels[
      pixelY * appState.heightmapMeta.size_pixels + pixelX
    ];
  const sceneY = normalizedHeight * appState.heightScaleUnits;

  const LIFT = 0.3;
  return new THREE.Vector3(sceneX, sceneY + LIFT, sceneZ);
}

export function gridCellToScenePosition(cell: {
  row: number;
  col: number;
}): THREE.Vector3 {
  const u = cell.col / (TERRAIN_GRID_COLS - 1);
  const v = cell.row / (TERRAIN_GRID_ROWS - 1);
  return sampledScenePosition(u, v);
}

export function routeCellToScenePosition(cell: RouteCell): THREE.Vector3 {
  return gridCellToScenePosition(cell);
}
