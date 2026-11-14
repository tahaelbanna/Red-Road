import { Injectable, Logger } from '@nestjs/common';
import { TerrainService } from '../../terrain/terrain.service.js';
import { RoutePlanRequest, RoutePlanResult } from '../interfaces/index.js';
import { findPath } from '../pathfinding.js';
import { ResolvePrioritiesUseCase } from './resolve-priorities.use-case.js';
import { EnrichPathUseCase } from './enrich-path.use-case.js';
import { ComputeMetricsUseCase } from './compute-metrics.use-case.js';

@Injectable()
export class PlanRouteUseCase {
    private readonly logger = new Logger(PlanRouteUseCase.name);

    constructor(
        private readonly terrainService: TerrainService,
        private readonly resolvePrioritiesUseCase: ResolvePrioritiesUseCase,
        private readonly enrichPathUseCase: EnrichPathUseCase,
        private readonly computeMetricsUseCase: ComputeMetricsUseCase,
    ) {}

    execute(request: RoutePlanRequest): RoutePlanResult {
        const { region, start, end, mission, priorities: overrides } = request;
        const priorities = this.resolvePrioritiesUseCase.execute(
            mission,
            overrides,
        );
        const terrain = this.terrainService.getRegion(region);
        const maxSlope = terrain.max_walkable_slope_deg;

        const isImpassable = (row: number, col: number) => {
            const cell = this.terrainService.getCell(region, row, col);
            return cell.hazard >= 1;
        };

        const edgeCost = (
            fromRow: number,
            fromCol: number,
            toRow: number,
            toCol: number,
        ): number => {
            if (isImpassable(toRow, toCol)) return Infinity;

            const isDiagonal = fromRow !== toRow && fromCol !== toCol;
            const distanceCost = isDiagonal ? Math.SQRT2 : 1;

            const cell = this.terrainService.getCell(region, toRow, toCol);
            const scienceBenefit = this.terrainService.getScienceBenefit(
                region,
                toRow,
                toCol,
            );

            const hazardPenalty = priorities.safety * cell.hazard;
            const slopePenalty =
                priorities.slope *
                (cell.slope === null ? 1 : Math.min(cell.slope / maxSlope, 1));

            const baseCost =
                Math.max(priorities.distance, 0.01) * distanceCost +
                hazardPenalty +
                slopePenalty;

            const scienceDiscount =
                1 + priorities.science * scienceBenefit * 20;

            return baseCost / scienceDiscount;
        };

        const minPossibleCellCost =
            Math.max(priorities.distance, 0.01) /
            (1 + priorities.science * 1.0 * 20);
        const heuristicWeight = minPossibleCellCost;

        this.logger.log(
            `Planning route in ${region} from (${start.row},${start.col}) to (${end.row},${end.col})`,
        );

        const result = findPath(
            terrain.grid_rows,
            terrain.grid_cols,
            start,
            end,
            edgeCost,
            heuristicWeight,
        );

        if (!result.found) {
            this.logger.warn('No path found between the given points');
            return {
                found: false,
                path: [],
                metrics: {
                    totalCost: Infinity,
                    distanceMeters: 0,
                    maxSlopeDeg: 0,
                    elevationChangeMeters: 0,
                    minElevationMeters: 0,
                    maxElevationMeters: 0,
                    estimatedTravelTimeHours: 0,
                    scientificTargetsNearRoute: [],
                    hazardSegments: 0,
                },
                prioritiesUsed: priorities,
            };
        }

        return {
            found: true,
            path: this.enrichPathUseCase.execute(region, result.path),
            metrics: this.computeMetricsUseCase.execute(
                region,
                result.path,
                result.totalCost,
                request,
            ),
            prioritiesUsed: priorities,
        };
    }
}
