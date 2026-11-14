import { Module } from '@nestjs/common';
import { MissionController } from './mission.controller.js';
import { MissionService } from './mission.service.js';
import {
    CalculateOxygenBudgetUseCase,
    AssessEnvironmentUseCase,
    EvaluateFeasibilityUseCase,
} from './use-cases/index.js';

const USE_CASES = [
    CalculateOxygenBudgetUseCase,
    AssessEnvironmentUseCase,
    EvaluateFeasibilityUseCase,
];

@Module({
    controllers: [MissionController],
    providers: [MissionService, ...USE_CASES],
    exports: [MissionService],
})
export class MissionModule {}
