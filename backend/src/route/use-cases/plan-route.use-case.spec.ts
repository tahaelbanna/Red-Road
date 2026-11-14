import { describe, expect, it } from 'vitest';
import { PlanRouteUseCase } from './plan-route.use-case.js';
import { TerrainService } from '../../terrain/terrain.service.js';
import { LoadRegionUseCase } from '../../terrain/use-cases/load-region.use-case.js';
import { LoadScientificTargetsUseCase } from '../../terrain/use-cases/load-scientific-targets.use-case.js';
import { BuildScienceBenefitGridUseCase } from '../../terrain/use-cases/build-science-benefit-grid.use-case.js';
import { GetCellUseCase } from '../../terrain/use-cases/get-cell.use-case.js';
import { WorldToRowColUseCase } from '../../terrain/use-cases/world-to-row-col.use-case.js';
import { RowColToWorldUseCase } from '../../terrain/use-cases/row-col-to-world.use-case.js';
import { ResolvePrioritiesUseCase } from './resolve-priorities.use-case.js';
import { CalculateCellCostUseCase } from './calculate-cell-cost.use-case.js';
import { EnrichPathUseCase } from './enrich-path.use-case.js';
import { ComputeMetricsUseCase } from './compute-metrics.use-case.js';
import { MissionType } from '../enums/mission-type.enum.js';
import { dijkstraFindPath } from '../pathfinding.js';

describe('PlanRouteUseCase on Real Jezero Crater Terrain', () => {
    // Instantiate real terrain service with real 100m Jezero dataset
    const loadRegion = new LoadRegionUseCase();
    const loadTargets = new LoadScientificTargetsUseCase();
    const buildScience = new BuildScienceBenefitGridUseCase();
    const getCell = new GetCellUseCase();
    const w2rc = new WorldToRowColUseCase();
    const rc2w = new RowColToWorldUseCase();

    const terrainService = new TerrainService(
        loadRegion,
        loadTargets,
        buildScience,
        getCell,
        w2rc,
        rc2w,
    );
    terrainService.onModuleInit();

    const resolvePriorities = new ResolvePrioritiesUseCase();
    const calculateCellCost = new CalculateCellCostUseCase(terrainService);
    const enrichPath = new EnrichPathUseCase(terrainService);
    const computeMetrics = new ComputeMetricsUseCase(terrainService);

    const planRoute = new PlanRouteUseCase(
        terrainService,
        resolvePriorities,
        calculateCellCost,
        enrichPath,
        computeMetrics,
    );

    const terrain = terrainService.getRegion('jezero_crater');

    it('should calculate valid route between Octavia Butler Landing and Three Forks', () => {
        const start = { row: 501, col: 254 }; // Octavia Butler Landing
        const end = { row: 504, col: 254 };   // Three Forks Depot (~300m South)

        const result = planRoute.execute({
            region: 'jezero_crater',
            start,
            end,
            mission: MissionType.HUMAN_EXPLORATION,
        });

        expect(result.found).toBe(true);
        expect(result.path.length).toBeGreaterThanOrEqual(4);
        expect(result.metrics.distanceMeters).toBeGreaterThan(0);
        expect(result.metrics.maxSlopeDeg).toBeGreaterThan(0);
        expect(result.metrics.elevationChangeMeters).toBeGreaterThanOrEqual(0);
        expect(result.prioritiesUsed.safety + result.prioritiesUsed.slope + result.prioritiesUsed.distance + result.prioritiesUsed.science).toBeCloseTo(1.0, 6);
    });

    it('should find identical path cost between A* and Dijkstra on Jezero Crater terrain', () => {
        const start = { row: 501, col: 254 };
        const end = { row: 496, col: 250 }; // Seitah

        const priorities = resolvePriorities.execute(MissionType.HUMAN_EXPLORATION);
        const edgeCost = (fr: number, fc: number, tr: number, tc: number) =>
            calculateCellCost.execute('jezero_crater', fr, fc, tr, tc, priorities);

        const astar = planRoute.execute({
            region: 'jezero_crater',
            start,
            end,
            mission: MissionType.HUMAN_EXPLORATION,
        });

        const dijkstra = dijkstraFindPath(
            terrain.grid_rows,
            terrain.grid_cols,
            start,
            end,
            edgeCost,
        );

        expect(astar.found).toBe(true);
        expect(dijkstra.found).toBe(true);
        expect(astar.metrics.totalCost).toBeCloseTo(dijkstra.totalCost, 6);
    });

    it('should guarantee admissibility and match Dijkstra when distance weight = 0', () => {
        // Zero-distance weight: pure safety & slope & science
        const zeroDistancePriorities = {
            safety: 0.4,
            slope: 0.3,
            distance: 0.0,
            science: 0.3,
        };

        const start = { row: 501, col: 254 };
        const end = { row: 496, col: 250 };

        const resolved = resolvePriorities.execute(
            MissionType.HUMAN_EXPLORATION,
            zeroDistancePriorities,
        );
        expect(resolved.distance).toBe(0);

        const edgeCost = (fr: number, fc: number, tr: number, tc: number) =>
            calculateCellCost.execute('jezero_crater', fr, fc, tr, tc, resolved);

        const astar = planRoute.execute({
            region: 'jezero_crater',
            start,
            end,
            mission: MissionType.HUMAN_EXPLORATION,
            priorities: zeroDistancePriorities,
        });

        const dijkstra = dijkstraFindPath(
            terrain.grid_rows,
            terrain.grid_cols,
            start,
            end,
            edgeCost,
        );

        expect(astar.found).toBe(true);
        expect(dijkstra.found).toBe(true);
        expect(astar.metrics.totalCost).toBeCloseTo(dijkstra.totalCost, 6);
    });

    it('should match Dijkstra when science weight = 0', () => {
        const zeroSciencePriorities = {
            safety: 0.35,
            slope: 0.35,
            distance: 0.3,
            science: 0.0,
        };

        const start = { row: 501, col: 254 };
        const end = { row: 504, col: 254 };

        const resolved = resolvePriorities.execute(
            MissionType.HUMAN_EXPLORATION,
            zeroSciencePriorities,
        );
        expect(resolved.science).toBe(0);

        const edgeCost = (fr: number, fc: number, tr: number, tc: number) =>
            calculateCellCost.execute('jezero_crater', fr, fc, tr, tc, resolved);

        const astar = planRoute.execute({
            region: 'jezero_crater',
            start,
            end,
            mission: MissionType.HUMAN_EXPLORATION,
            priorities: zeroSciencePriorities,
        });

        const dijkstra = dijkstraFindPath(
            terrain.grid_rows,
            terrain.grid_cols,
            start,
            end,
            edgeCost,
        );

        expect(astar.found).toBe(true);
        expect(dijkstra.found).toBe(true);
        expect(astar.metrics.totalCost).toBeCloseTo(dijkstra.totalCost, 6);
    });

    it('should match Dijkstra when distance weight approaches zero (1e-5)', () => {
        const tinyDistancePriorities = {
            safety: 0.5,
            slope: 0.25,
            distance: 0.00001,
            science: 0.25,
        };

        const start = { row: 501, col: 254 };
        const end = { row: 496, col: 250 };

        const resolved = resolvePriorities.execute(
            MissionType.HUMAN_EXPLORATION,
            tinyDistancePriorities,
        );

        const edgeCost = (fr: number, fc: number, tr: number, tc: number) =>
            calculateCellCost.execute('jezero_crater', fr, fc, tr, tc, resolved);

        const astar = planRoute.execute({
            region: 'jezero_crater',
            start,
            end,
            mission: MissionType.HUMAN_EXPLORATION,
            priorities: tinyDistancePriorities,
        });

        const dijkstra = dijkstraFindPath(
            terrain.grid_rows,
            terrain.grid_cols,
            start,
            end,
            edgeCost,
        );

        expect(astar.found).toBe(true);
        expect(dijkstra.found).toBe(true);
        expect(astar.metrics.totalCost).toBeCloseTo(dijkstra.totalCost, 6);
    });

    it('should route into maximum scientific benefit target (Mandu Wall, benefit=16.23) and match Dijkstra', () => {
        const start = { row: 501, col: 254 }; // Octavia Butler Landing
        const end = { row: 487, col: 252 };   // Mandu Wall (max scientific density)

        const priorities = resolvePriorities.execute(MissionType.SCIENTIFIC_RESEARCH);
        const edgeCost = (fr: number, fc: number, tr: number, tc: number) =>
            calculateCellCost.execute('jezero_crater', fr, fc, tr, tc, priorities);

        const astar = planRoute.execute({
            region: 'jezero_crater',
            start,
            end,
            mission: MissionType.SCIENTIFIC_RESEARCH,
        });

        const dijkstra = dijkstraFindPath(
            terrain.grid_rows,
            terrain.grid_cols,
            start,
            end,
            edgeCost,
        );

        expect(astar.found).toBe(true);
        expect(dijkstra.found).toBe(true);
        expect(astar.metrics.totalCost).toBeCloseTo(dijkstra.totalCost, 6);
    });

    it('should route across overlapping scientific targets on Western Fan and match Dijkstra', () => {
        const start = { row: 488, col: 257 }; // Wildcat Ridge / Skinner Ridge cluster
        const end = { row: 484, col: 248 };   // Bright Angel

        const priorities = resolvePriorities.execute(MissionType.SCIENTIFIC_RESEARCH);
        const edgeCost = (fr: number, fc: number, tr: number, tc: number) =>
            calculateCellCost.execute('jezero_crater', fr, fc, tr, tc, priorities);

        const astar = planRoute.execute({
            region: 'jezero_crater',
            start,
            end,
            mission: MissionType.SCIENTIFIC_RESEARCH,
        });

        const dijkstra = dijkstraFindPath(
            terrain.grid_rows,
            terrain.grid_cols,
            start,
            end,
            edgeCost,
        );

        expect(astar.found).toBe(true);
        expect(dijkstra.found).toBe(true);
        expect(astar.metrics.totalCost).toBeCloseTo(dijkstra.totalCost, 6);
    });

    it('should match Dijkstra optimality across all predefined mission profiles', () => {
        const missionProfiles = [
            MissionType.HUMAN_EXPLORATION,
            MissionType.SCIENTIFIC_RESEARCH,
            MissionType.RAPID_TRANSIT,
        ];

        const start = { row: 501, col: 254 };
        const end = { row: 503, col: 252 }; // Roubion

        for (const mission of missionProfiles) {
            const priorities = resolvePriorities.execute(mission);
            const edgeCost = (fr: number, fc: number, tr: number, tc: number) =>
                calculateCellCost.execute('jezero_crater', fr, fc, tr, tc, priorities);

            const astar = planRoute.execute({
                region: 'jezero_crater',
                start,
                end,
                mission,
            });

            const dijkstra = dijkstraFindPath(
                terrain.grid_rows,
                terrain.grid_cols,
                start,
                end,
                edgeCost,
            );

            expect(astar.found).toBe(true);
            expect(dijkstra.found).toBe(true);
            expect(astar.metrics.totalCost).toBeCloseTo(dijkstra.totalCost, 6);
        }
    });
});
