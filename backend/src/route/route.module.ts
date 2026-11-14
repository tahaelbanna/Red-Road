import { Module } from '@nestjs/common';
import { RouteService } from './route.service.js';
import { RouteExplanationService } from '../ai/explanation.service.js';
import { RouteController } from './route.controller.js';
import { TerrainModule } from '../terrain/terrain.module.js';
import {
    ResolvePrioritiesUseCase,
    CalculateCellCostUseCase,
    EnrichPathUseCase,
    ComputeMetricsUseCase,
    PlanRouteUseCase,
} from './use-cases/index.js';

const USE_CASES = [
    ResolvePrioritiesUseCase,
    CalculateCellCostUseCase,
    EnrichPathUseCase,
    ComputeMetricsUseCase,
    PlanRouteUseCase,
];

@Module({
    providers: [RouteService, RouteExplanationService, ...USE_CASES],
    controllers: [RouteController],
    imports: [TerrainModule],
    exports: [RouteService],
})
export class RouteModule {}