import { Injectable, Optional } from '@nestjs/common';
import {
    Priorities,
    RouteMetrics,
} from '../route/interfaces/index.js';
import { RouteExplanation } from './interfaces/index.js';
import { GenerateExplanationUseCase } from './use-cases/index.js';
import { MissionType } from '../route/enums/index.js';
export type { RouteExplanation } from './interfaces/index.js';

@Injectable()
export class RouteExplanationService {
    private readonly generateExplanationUseCase: GenerateExplanationUseCase;

    constructor(
        @Optional() generateExplanationUseCase?: GenerateExplanationUseCase,
    ) {
        this.generateExplanationUseCase =
            generateExplanationUseCase ?? new GenerateExplanationUseCase();
    }

    generateExplanation(
        mission: MissionType,
        priorities: Priorities,
        metrics: RouteMetrics,
    ): RouteExplanation {
        return this.generateExplanationUseCase.execute(
            mission,
            priorities,
            metrics,
        );
    }
}
