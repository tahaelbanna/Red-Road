import { Injectable } from '@nestjs/common';
import {
    Priorities,
    RoutePlanRequest,
    RoutePlanResult,
} from './interfaces/index.js';
import { MissionType } from './enums/index.js';
import {
    ResolvePrioritiesUseCase,
    CalculateCellCostUseCase,
    PlanRouteUseCase,
} from './use-cases/index.js';

@Injectable()
export class RouteService {
    constructor(
        private readonly resolvePrioritiesUseCase: ResolvePrioritiesUseCase,
        private readonly calculateCellCostUseCase: CalculateCellCostUseCase,
        private readonly planRouteUseCase: PlanRouteUseCase,
    ) {}

    resolvePriorities(
        mission: MissionType,
        overrides?: Priorities,
    ): Priorities {
        return this.resolvePrioritiesUseCase.execute(mission, overrides);
    }

    calculateCellCost(
        region: string,
        row: number,
        col: number,
        priorities: Priorities,
    ): number {
        return this.calculateCellCostUseCase.execute(
            region,
            row,
            col,
            priorities,
        );
    }

    planRoute(request: RoutePlanRequest): RoutePlanResult {
        return this.planRouteUseCase.execute(request);
    }
}
