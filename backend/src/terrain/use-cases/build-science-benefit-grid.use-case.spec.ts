import { describe, expect, it } from 'vitest';
import { BuildScienceBenefitGridUseCase } from './build-science-benefit-grid.use-case.js';
import { TerrainData, ScientificTarget } from '../interfaces/index.js';

describe('BuildScienceBenefitGridUseCase', () => {
    const useCase = new BuildScienceBenefitGridUseCase();

    const mockTerrain: TerrainData = {
        region: 'test_region',
        cell_size_meters: 100,
        grid_rows: 10,
        grid_cols: 10,
        origin_x: 0,
        origin_y: 1000,
        crs: 'Equirectangular',
        source_bounds: [0, 0, 1000, 1000],
        max_walkable_slope_deg: 20,
        elevation: new Array(100).fill(0),
        slope: new Array(100).fill(0),
        hazard: new Array(100).fill(0),
    };

    it('should return all zeros when target list is empty', () => {
        const { grid, maxBenefit } = useCase.execute(
            'test_region',
            mockTerrain,
            [],
        );
        expect(grid.length).toBe(100);
        expect(maxBenefit).toBe(0);
        expect(grid.every((val) => val === 0)).toBe(true);
    });

    it('should calculate peak benefit at target center with Gaussian distance decay', () => {
        const target: ScientificTarget = {
            id: 't1',
            name: 'Target 1',
            lat: 18.0,
            lon: 77.0,
            x: 0,
            y: 1000, // exact center of cell (row 0, col 0)
            row: 0,
            col: 0,
            in_bounds: true,
            type: 'Rock outcrop',
            category: 'point',
            science_value: 0.9,
            position_accuracy: 'published',
            source: 'test',
        };

        const { grid, maxBenefit } = useCase.execute(
            'test_region',
            mockTerrain,
            [target],
        );

        expect(maxBenefit).toBeCloseTo(0.9, 6);
        // Cell (0, 0) should have exact peak
        expect(grid[0]).toBeCloseTo(0.9, 6);

        // Cell (0, 10) is 1000m away (1 sigma). Falloff at d = sigma is exp(-1/2) = ~0.60653
        // In our 10x10 grid, cell (0, 9) is 900m away
        const cell09 = grid[9];
        const expected900m = 0.9 * Math.exp(-(900 ** 2) / (2 * 1000 ** 2));
        expect(cell09).toBeCloseTo(expected900m, 5);
        expect(cell09).toBeLessThan(grid[0]);
    });

    it('should correctly sum multiple overlapping targets and track maxBenefit', () => {
        const targets: ScientificTarget[] = [
            {
                id: 't1',
                name: 'T1',
                lat: 0,
                lon: 0,
                x: 500,
                y: 500,
                row: 5,
                col: 5,
                in_bounds: true,
                type: 'Test',
                category: 'point',
                science_value: 0.8,
                position_accuracy: 'published',
                source: 'test',
            },
            {
                id: 't2',
                name: 'T2',
                lat: 0,
                lon: 0,
                x: 500,
                y: 500,
                row: 5,
                col: 5,
                in_bounds: true,
                type: 'Test',
                category: 'region',
                science_value: 0.9,
                position_accuracy: 'published',
                source: 'test',
            },
        ];

        const { grid, maxBenefit } = useCase.execute(
            'test_region',
            mockTerrain,
            targets,
        );
        expect(maxBenefit).toBeCloseTo(1.7, 6);
        const cellIdx = 5 * 10 + 5;
        expect(grid[cellIdx]).toBeCloseTo(1.7, 6);
    });
});
