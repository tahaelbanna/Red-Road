import * as THREE from "three";
import {
  HEIGHTMAP_PATH,
  MESH_RESOLUTION,
  TERRAIN_SIZE_UNITS,
  VERTICAL_EXAGGERATION,
} from "../config/index";
import {
  type HeightmapMeta,
  type RouteCell,
  type ScientificTarget,
} from "../interfaces/index";
import { appState } from "../state/app.state";
import {
  gridCellToScenePosition,
  routeCellToScenePosition,
} from "./coordinates";

export async function buildTerrainMesh(
  meta: HeightmapMeta,
): Promise<THREE.Mesh> {
  appState.heightmapPixels = await loadHeightmapPixels(
    HEIGHTMAP_PATH,
    meta.size_pixels,
  );

  const geometry = new THREE.PlaneGeometry(
    TERRAIN_SIZE_UNITS,
    TERRAIN_SIZE_UNITS,
    MESH_RESOLUTION - 1,
    MESH_RESOLUTION - 1,
  );
  geometry.rotateX(-Math.PI / 2);

  const elevationRange = meta.max_elevation_m - meta.min_elevation_m;
  appState.heightScaleUnits =
    (elevationRange / 1000) * (TERRAIN_SIZE_UNITS / 89) * VERTICAL_EXAGGERATION;

  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const gridX = i % MESH_RESOLUTION;
    const gridY = Math.floor(i / MESH_RESOLUTION);

    const pixelX = Math.floor(
      (gridX / (MESH_RESOLUTION - 1)) * (meta.size_pixels - 1),
    );
    const pixelY = Math.floor(
      (gridY / (MESH_RESOLUTION - 1)) * (meta.size_pixels - 1),
    );
    const normalizedHeight =
      appState.heightmapPixels[pixelY * meta.size_pixels + pixelX];

    positions.setY(i, normalizedHeight * appState.heightScaleUnits);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();

  const texLoader = new THREE.TextureLoader();
  const albedo = await texLoader.loadAsync(
    "/data/jezero_ctx_orthomosaic_5m.jpg",
  );
  albedo.colorSpace = THREE.SRGBColorSpace;

  const normalMap = await texLoader.loadAsync(
    "/data/jezero_ctx_dem_20m_normal.jpg",
  );

  const material = new THREE.MeshStandardMaterial({
    map: albedo,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(2, 2),
    roughness: 0.8,
    metalness: 0.1,
    flatShading: false,
    wireframe: false,
  });

  return new THREE.Mesh(geometry, material);
}

export function buildTerrainWalls(
  terrainGeometry: THREE.BufferGeometry,
  baseY: number,
): THREE.Mesh {
  const positions = terrainGeometry.attributes.position;
  const W = MESH_RESOLUTION;
  const H = MESH_RESOLUTION;

  const pos: number[] = [];
  const idx: number[] = [];

  const edges = [
    Array.from({ length: W }, (_, c) => [c, 0]),
    Array.from({ length: H }, (_, r) => [W - 1, r]),
    Array.from({ length: W }, (_, c) => [W - 1 - c, H - 1]),
    Array.from({ length: H }, (_, r) => [0, H - 1 - r]),
  ];

  for (const edge of edges) {
    const start = pos.length / 3;
    for (const [gridX, gridY] of edge) {
      const i = gridY * W + gridX;
      const x = positions.getX(i);
      const yTop = positions.getY(i);
      const z = positions.getZ(i);

      pos.push(x, yTop, z);
      pos.push(x, baseY, z);
    }

    for (let i = 0; i < edge.length - 1; i++) {
      const a = start + i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const wallGeo = new THREE.BufferGeometry();
  wallGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  wallGeo.setIndex(idx);
  wallGeo.computeVertexNormals();

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1e0f08,
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(wallGeo, wallMat);
}

export function buildScientificTargetMarker(
  target: ScientificTarget,
): THREE.Mesh {
  const position = gridCellToScenePosition({
    row: target.row,
    col: target.col,
  });

  const isRegion = target.category === "region";
  const color = target.position_accuracy === "published" ? 0xffd700 : 0xff3333;
  const dotGeometry = new THREE.SphereGeometry(isRegion ? 1.0 : 0.35, 12, 12);
  const dotMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: isRegion,
    opacity: isRegion ? 0.0 : 1.0,
  });
  const dot = new THREE.Mesh(dotGeometry, dotMaterial);
  dot.position.copy(position);
  dot.userData = { target };

  appState.targetMeshes.push(dot);

  return dot;
}

export function buildMarker(
  position: THREE.Vector3,
  color: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.8, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color });
  const marker = new THREE.Mesh(geometry, material);
  marker.position.copy(position);
  return marker;
}

export function buildRouteLine(path: RouteCell[]): THREE.Line {
  const points = path.map(routeCellToScenePosition);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x00ffaa,
    linewidth: 3,
  });
  return new THREE.Line(geometry, material);
}

export function clearStartMarker() {
  if (appState.startMarker) {
    appState.scene.remove(appState.startMarker);
    appState.startMarker = null;
  }
}

export function clearEndMarker() {
  if (appState.endMarker) {
    appState.scene.remove(appState.endMarker);
    appState.endMarker = null;
  }
}

export function clearRouteLine() {
  if (appState.routeLine) {
    appState.scene.remove(appState.routeLine);
    appState.routeLine = null;
  }
}

async function loadHeightmapPixels(
  path: string,
  size: number,
): Promise<Float32Array> {
  const img = await loadImage(path);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const pixels = imageData.data;

  const heights = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const packed = r * 256 + g;
    heights[i] = packed / 65535;
  }

  return heights;
}

function loadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = path;
  });
}
