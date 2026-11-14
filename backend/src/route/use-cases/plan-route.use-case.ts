import { Injectable, Logger } from '@nestjs/common';
import { TerrainService } from '../../terrain/terrain.service.js';
import { RoutePlanRequest, RoutePlanResult } from '../interfaces/index.js';
import { findPath } from '../pathfinding.js';
import { ResolvePrioritiesUseCase } from './resolve-priorities.use-case.js';
import { CalculateCellCostUseCase } from './calculate-cell-cost.use-case.js';
import { EnrichPathUseCase } from './enrich-path.use-case.js';
import { ComputeMetricsUseCase } from './compute-metrics.use-case.js';

@Injectable()
export class PlanRouteUseCase {
    private readonly logger = new Logger(PlanRouteUseCase.name);

    constructor(
        private readonly terrainService: TerrainService,
        private readonly resolvePrioritiesUseCase: ResolvePrioritiesUseCase,
        private readonly calculateCellCostUseCase: CalculateCellCostUseCase,
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

        const edgeCost = (
            fromRow: number,
            fromCol: number,
            toRow: number,
            toCol: number,
        ): number => {
            return this.calculateCellCostUseCase.execute(
                region,
                fromRow,
                fromCol,
                toRow,
                toCol,
                priorities,
            );
        };

        const maxScienceBenefit =
            this.terrainService.getMaxScienceBenefit(region);
        const maxScienceDiscount =
            1 + priorities.science * maxScienceBenefit * 20;
        const heuristicWeight =
            priorities.distance > 0
                ? priorities.distance / maxScienceDiscount
                : 0;

        this.logger.log(
            `Planning route in ${region} from (${start.row},${start.col}) to (${end.row},${end.col}) with heuristicWeight=${heuristicWeight.toFixed(6)}`,
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
