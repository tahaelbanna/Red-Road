import { describe, expect, it } from 'vitest';
import { CalculateCellCostUseCase } from './calculate-cell-cost.use-case.js';
import { TerrainService } from '../../terrain/terrain.service.js';
import { Priorities } from '../interfaces/priorities.interface.js';
import { TerrainData } from '../../terrain/interfaces/terrain-data.interface.js';

describe('CalculateCellCostUseCase Unit Tests', () => {
    // Construct mock TerrainService
    const mockTerrain: TerrainData = {
        region: 'test_region',
        cell_size_meters: 100,
        grid_rows: 10,
        grid_cols: 10,
        origin_x: 0,
        origin_y: 0,
        crs: 'test',
        source_bounds: [0, 0, 1000, 1000],
        max_walkable_slope_deg: 20,
        elevation: new Array(100).fill(100),
        slope: new Array(100).fill(5),
        hazard: new Array(100).fill(0.1),
    };

    let scienceBenefitVal = 0.5;

    const terrainServiceMock = {
        getRegion: (region: string) => (region === 'test_region' ? mockTerrain : null),
        getCell: (region: string, r: number, c: number) => {
            const idx = r * 10 + c;
            return {
                row: r,
                col: c,
                elevation: mockTerrain.elevation[idx],
                slope: mockTerrain.slope[idx],
                hazard: mockTerrain.hazard[idx],
            };
        },
        getScienceBenefit: () => scienceBenefitVal,
    } as unknown as TerrainService;

    const useCase = new CalculateCellCostUseCase(terrainServiceMock);

    const balancedPriorities: Priorities = {
        safety: 0.4,
        slope: 0.3,
        distance: 0.2,
        science: 0.1,
    };

    it('should compute exact expected edge cost for orthogonal and diagonal steps', () => {
        // Orthogonal step: from (0,0) to (0,1)
        // distanceCost = 1.0
        // hazardPenalty = 0.4 * 0.1 = 0.04
        // slopePenalty = 0.3 * (5 / 20) = 0.3 * 0.25 = 0.075
        // baseCost = 0.2 * 1.0 + 0.04 + 0.075 = 0.315
        // scienceDiscount = 1 + 0.1 * 0.5 * 20 = 1 + 1.0 = 2.0
        // cost = 0.315 / 2.0 = 0.1575
        const costOrthogonal = useCase.execute(
            'test_region',
            0,
            0,
            0,
            1,
            balancedPriorities,
        );
        expect(costOrthogonal).toBeCloseTo(0.1575, 6);

        // Diagonal step: from (0,0) to (1,1)
        // distanceCost = Math.SQRT2 ≈ 1.41421356
        // baseCost = 0.2 * 1.41421356 + 0.04 + 0.075 = 0.2828427 + 0.115 = 0.3978427
        // cost = 0.3978427 / 2.0 = 0.19892135
        const costDiagonal = useCase.execute(
            'test_region',
            0,
            0,
            1,
            1,
            balancedPriorities,
        );
        expect(costDiagonal).toBeCloseTo(0.19892135, 6);
    });

    it('should return Infinity for impassable hazards (hazard >= 1.0)', () => {
        mockTerrain.hazard[5] = 1.0;
        const cost = useCase.execute('test_region', 0, 0, 0, 5, balancedPriorities);
        expect(cost).toBe(Infinity);
        mockTerrain.hazard[5] = 0.1; // reset
    });

    it('should return Infinity for nodata elevation (elevation === null)', () => {
        mockTerrain.elevation[5] = null;
        const cost = useCase.execute('test_region', 0, 0, 0, 5, balancedPriorities);
        expect(cost).toBe(Infinity);
        mockTerrain.elevation[5] = 100; // reset
    });

    it('should produce strictly zero edge cost when distance=0, hazard=0, slope=0', () => {
        mockTerrain.hazard[5] = 0.0;
        mockTerrain.slope[5] = 0.0;
        const zeroDistPriorities: Priorities = {
            safety: 0.5,
            slope: 0.3,
            distance: 0.0,
            science: 0.2,
        };

        const cost = useCase.execute('test_region', 0, 0, 0, 5, zeroDistPriorities);
        expect(cost).toBe(0.0);
        mockTerrain.hazard[5] = 0.1; // reset
        mockTerrain.slope[5] = 5; // reset
    });

    it('should never return NaN or negative costs for any edge combination', () => {
        const edgeCases: Priorities[] = [
            { safety: 1, slope: 0, distance: 0, science: 0 },
            { safety: 0, slope: 1, distance: 0, science: 0 },
            { safety: 0, slope: 0, distance: 1, science: 0 },
            { safety: 0, slope: 0, distance: 0, science: 1 },
            { safety: 0.25, slope: 0.25, distance: 0.25, science: 0.25 },
        ];

        for (const p of edgeCases) {
            const cost = useCase.execute('test_region', 0, 0, 0, 1, p);
            expect(Number.isFinite(cost)).toBe(true);
            expect(cost).toBeGreaterThanOrEqual(0);
            expect(Number.isNaN(cost)).toBe(false);
        }
    });

    it('should return Infinity for nonexistent region', () => {
        const cost = useCase.execute('nonexistent', 0, 0, 0, 1, balancedPriorities);
        expect(cost).toBe(Infinity);
    });
});
