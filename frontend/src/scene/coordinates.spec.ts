import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  gridCellToScenePosition,
  scenePositionToGridCell,
  sampledScenePosition,
} from './coordinates';
import {
  TERRAIN_GRID_COLS,
  TERRAIN_GRID_ROWS,
  TERRAIN_HEIGHT_UNITS,
  TERRAIN_WIDTH_UNITS,
} from '../config/index';

describe('Coordinates & Aspect Ratio System', () => {
  it('should maintain isotropic cell dimensions across X and Z axes', () => {
    const deltaX = TERRAIN_WIDTH_UNITS / (TERRAIN_GRID_COLS - 1);
    const deltaZ = TERRAIN_HEIGHT_UNITS / (TERRAIN_GRID_ROWS - 1);

    expect(Math.abs(deltaX - deltaZ)).toBeLessThan(1e-12);
    expect(deltaX).toBeCloseTo(0.0988142, 6);
    expect(deltaZ).toBeCloseTo(0.0988142, 6);
  });

  it('should map all four corners of the terrain accurately', () => {
    // Top-Left corner: (row 0, col 0)
    const tl = gridCellToScenePosition({ row: 0, col: 0 });
    expect(tl.x).toBeCloseTo(-TERRAIN_WIDTH_UNITS / 2, 5);
    expect(tl.z).toBeCloseTo(-TERRAIN_HEIGHT_UNITS / 2, 5);

    // Top-Right corner: (row 0, col 890)
    const tr = gridCellToScenePosition({ row: 0, col: TERRAIN_GRID_COLS - 1 });
    expect(tr.x).toBeCloseTo(TERRAIN_WIDTH_UNITS / 2, 5);
    expect(tr.z).toBeCloseTo(-TERRAIN_HEIGHT_UNITS / 2, 5);

    // Bottom-Left corner: (row 1012, col 0)
    const bl = gridCellToScenePosition({ row: TERRAIN_GRID_ROWS - 1, col: 0 });
    expect(bl.x).toBeCloseTo(-TERRAIN_WIDTH_UNITS / 2, 5);
    expect(bl.z).toBeCloseTo(TERRAIN_HEIGHT_UNITS / 2, 5);

    // Bottom-Right corner: (row 1012, col 890)
    const br = gridCellToScenePosition({
      row: TERRAIN_GRID_ROWS - 1,
      col: TERRAIN_GRID_COLS - 1,
    });
    expect(br.x).toBeCloseTo(TERRAIN_WIDTH_UNITS / 2, 5);
    expect(br.z).toBeCloseTo(TERRAIN_HEIGHT_UNITS / 2, 5);
  });

  it('should demonstrate quantization behavior on either side of cell boundaries', () => {
    const deltaX = TERRAIN_WIDTH_UNITS / (TERRAIN_GRID_COLS - 1);
    const deltaZ = TERRAIN_HEIGHT_UNITS / (TERRAIN_GRID_ROWS - 1);

    // Boundary between col 10 and col 11
    // Col 10 center scene X:
    const col10SceneX = (10 / (TERRAIN_GRID_COLS - 1) - 0.5) * TERRAIN_WIDTH_UNITS;
    // Halfway boundary to col 11 is col10SceneX + 0.5 * deltaX
    const boundaryX = col10SceneX + 0.5 * deltaX;

    // Immediately to the left of the boundary (belongs to col 10)
    const leftOfBoundary = new THREE.Vector3(boundaryX - 0.0001, 0, 0);
    const cellLeft = scenePositionToGridCell(leftOfBoundary);
    expect(cellLeft.col).toBe(10);

    // Immediately to the right of the boundary (belongs to col 11)
    const rightOfBoundary = new THREE.Vector3(boundaryX + 0.0001, 0, 0);
    const cellRight = scenePositionToGridCell(rightOfBoundary);
    expect(cellRight.col).toBe(11);

    // Boundary between row 20 and row 21
    const row20SceneZ = (20 / (TERRAIN_GRID_ROWS - 1) - 0.5) * TERRAIN_HEIGHT_UNITS;
    const boundaryZ = row20SceneZ + 0.5 * deltaZ;

    const northOfBoundary = new THREE.Vector3(0, 0, boundaryZ - 0.0001);
    const cellNorth = scenePositionToGridCell(northOfBoundary);
    expect(cellNorth.row).toBe(20);

    const southOfBoundary = new THREE.Vector3(0, 0, boundaryZ + 0.0001);
    const cellSouth = scenePositionToGridCell(southOfBoundary);
    expect(cellSouth.row).toBe(21);
  });

  it('should achieve 100% round-trip fidelity from Grid -> Scene -> Grid', () => {
    const testCells = [
      { row: 0, col: 0 },
      { row: 0, col: 890 },
      { row: 1012, col: 0 },
      { row: 1012, col: 890 },
      { row: 506, col: 445 },
      { row: 501, col: 254 }, // Octavia E. Butler Landing
      { row: 534, col: 246 }, // Three Forks
      { row: 480, col: 215 }, // Belva Crater
      { row: 438, col: 113 }, // Neretva Vallis
      { row: 496, col: 250 }, // Seitah
      { row: 123, col: 789 },
      { row: 800, col: 300 },
    ];

    for (const cell of testCells) {
      const scenePos = gridCellToScenePosition(cell);
      const recovered = scenePositionToGridCell(scenePos);

      expect(recovered.row).toBe(cell.row);
      expect(recovered.col).toBe(cell.col);
    }
  });

  it('should clamp out-of-bound scene positions gracefully', () => {
    const farLeft = new THREE.Vector3(-1000, 0, 0);
    const cellLeft = scenePositionToGridCell(farLeft);
    expect(cellLeft.col).toBe(0);

    const farRight = new THREE.Vector3(1000, 0, 0);
    const cellRight = scenePositionToGridCell(farRight);
    expect(cellRight.col).toBe(TERRAIN_GRID_COLS - 1);

    const farTop = new THREE.Vector3(0, 0, -1000);
    const cellTop = scenePositionToGridCell(farTop);
    expect(cellTop.row).toBe(0);

    const farBottom = new THREE.Vector3(0, 0, 1000);
    const cellBottom = scenePositionToGridCell(farBottom);
    expect(cellBottom.row).toBe(TERRAIN_GRID_ROWS - 1);
  });

  it('should correctly sample normalized UV coordinates', () => {
    const p1 = sampledScenePosition(0, 0);
    expect(p1.x).toBeCloseTo(-TERRAIN_WIDTH_UNITS / 2, 5);
    expect(p1.z).toBeCloseTo(-TERRAIN_HEIGHT_UNITS / 2, 5);

    const p2 = sampledScenePosition(1, 1);
    expect(p2.x).toBeCloseTo(TERRAIN_WIDTH_UNITS / 2, 5);
    expect(p2.z).toBeCloseTo(TERRAIN_HEIGHT_UNITS / 2, 5);

    const p3 = sampledScenePosition(0.5, 0.5);
    expect(p3.x).toBeCloseTo(0, 5);
    expect(p3.z).toBeCloseTo(0, 5);
  });
});
