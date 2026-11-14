import { describe, expect, it } from 'vitest';
import { WorldToRowColUseCase } from './world-to-row-col.use-case.js';
import { RowColToWorldUseCase } from './row-col-to-world.use-case.js';
import { TerrainData } from '../interfaces/terrain-data.interface.js';

describe('Coordinate Transformation & Quantization (Backend)', () => {
    const w2rc = new WorldToRowColUseCase();
    const rc2w = new RowColToWorldUseCase();

    // Actual Jezero terrain metadata
    const mockTerrain: TerrainData = {
        region: 'jezero_crater',
        cell_size_meters: 100,
        grid_rows: 1013,
        grid_cols: 891,
        origin_x: 4329050.0,
        origin_y: 1143370.0,
        crs: 'Equirectangular Mars 2020',
        source_bounds: [4328999.999999998, 1042080.0000000028, 4418119.999999998, 1143420.0000000028],
        max_walkable_slope_deg: 20,
        elevation: [],
        slope: [],
        hazard: [],
    };

    it('should achieve exact round-trip fidelity for cell centers', () => {
        const testCells = [
            { row: 0, col: 0 },
            { row: 0, col: 890 },
            { row: 1012, col: 0 },
            { row: 1012, col: 890 },
            { row: 501, col: 254 }, // Octavia E. Butler Landing
            { row: 504, col: 254 }, // Three Forks Depot
            { row: 480, col: 215 }, // Belva Crater
            { row: 438, col: 113 }, // Neretva Vallis
            { row: 487, col: 252 }, // Mandu Wall
        ];

        for (const cell of testCells) {
            const world = rc2w.execute(mockTerrain, cell.row, cell.col);
            const recovered = w2rc.execute(mockTerrain, world.x, world.y);

            expect(recovered.row).toBe(cell.row);
            expect(recovered.col).toBe(cell.col);
        }
    });

    it('should correctly position all four grid corners', () => {
        const tl = rc2w.execute(mockTerrain, 0, 0);
        expect(tl.x).toBe(4329050.0);
        expect(tl.y).toBe(1143370.0);

        const tr = rc2w.execute(mockTerrain, 0, 890);
        expect(tr.x).toBe(4329050.0 + 890 * 100);
        expect(tr.y).toBe(1143370.0);

        const bl = rc2w.execute(mockTerrain, 1012, 0);
        expect(bl.x).toBe(4329050.0);
        expect(bl.y).toBe(1143370.0 - 1012 * 100);

        const br = rc2w.execute(mockTerrain, 1012, 890);
        expect(br.x).toBe(4329050.0 + 890 * 100);
        expect(br.y).toBe(1143370.0 - 1012 * 100);
    });

    it('should demonstrate quantization on either side of 100m cell boundaries', () => {
        // Center of cell (0, 0) is (4329050, 1143370)
        // Eastern boundary of cell 0 is at x = 4329050 + 50 = 4329100.0
        // Immediately west of boundary -> col 0
        const westOfBoundary = w2rc.execute(mockTerrain, 4329099.9, 1143370);
        expect(westOfBoundary.col).toBe(0);

        // Immediately east of boundary -> col 1
        const eastOfBoundary = w2rc.execute(mockTerrain, 4329100.1, 1143370);
        expect(eastOfBoundary.col).toBe(1);

        // Southern boundary of row 0 is at y = 1143370 - 50 = 1143320.0
        // Immediately north of boundary -> row 0
        const northOfBoundary = w2rc.execute(mockTerrain, 4329050, 1143320.1);
        expect(northOfBoundary.row).toBe(0);

        // Immediately south of boundary -> row 1
        const southOfBoundary = w2rc.execute(mockTerrain, 4329050, 1143319.9);
        expect(southOfBoundary.row).toBe(1);
    });

    it('should demonstrate many-to-one quantization (not globally bijective for arbitrary reals)', () => {
        // Multiple distinct continuous GIS coordinates map to the identical discrete cell (501, 254)
        const center = w2rc.execute(mockTerrain, 4354450, 1093270);
        const offset1 = w2rc.execute(mockTerrain, 4354450 + 20, 1093270 + 20);
        const offset2 = w2rc.execute(mockTerrain, 4354450 - 30, 1093270 - 30);

        expect(center.row).toBe(offset1.row);
        expect(center.col).toBe(offset1.col);
        expect(center.row).toBe(offset2.row);
        expect(center.col).toBe(offset2.col);
    });

    it('should report negative or out-of-bounds indices for points beyond region footprint', () => {
        const farWest = w2rc.execute(mockTerrain, 4328000, 1143370);
        expect(farWest.col).toBeLessThan(0);

        const farEast = w2rc.execute(mockTerrain, 4500000, 1143370);
        expect(farEast.col).toBeGreaterThan(mockTerrain.grid_cols - 1);

        const farNorth = w2rc.execute(mockTerrain, 4329050, 1200000);
        expect(farNorth.row).toBeLessThan(0);

        const farSouth = w2rc.execute(mockTerrain, 4329050, 1000000);
        expect(farSouth.row).toBeGreaterThan(mockTerrain.grid_rows - 1);
    });
});
