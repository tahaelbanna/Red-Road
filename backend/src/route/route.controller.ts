import { Body, Controller, Post } from '@nestjs/common';
import { RouteService } from './route.service.js';
import type { RoutePlanRequest, RoutePlanResult } from './interfaces/index.js';
import { RouteExplanationService } from '../ai/explanation.service.js';

@Controller('route')
export class RouteController {
    constructor(
        private readonly routeService: RouteService,
        private readonly explanationService: RouteExplanationService,
    ) {}

    @Post('plan')
    plan(@Body() request: RoutePlanRequest): RoutePlanResult {
        const result = this.routeService.planRoute(request);
        if (result.found) {
            result.explanation = this.explanationService.generateExplanation(
                request.mission,
                result.prioritiesUsed,
                result.metrics,
            );
        }
        return result;
    }
}
