import { Injectable } from '@nestjs/common';
import {
    OxygenBudgetConfig,
    OxygenBudgetResult,
    EnvironmentalLimits,
    EnvironmentalAssessment,
    MissionFeasibilityResult,
} from './interfaces/index.js';
import {
    CalculateOxygenBudgetUseCase,
    AssessEnvironmentUseCase,
    EvaluateFeasibilityUseCase,
} from './use-cases/index.js';

@Injectable()
export class MissionService {
    constructor(
        private readonly calculateOxygenBudgetUseCase: CalculateOxygenBudgetUseCase,
        private readonly assessEnvironmentUseCase: AssessEnvironmentUseCase,
        private readonly evaluateFeasibilityUseCase: EvaluateFeasibilityUseCase,
    ) {}

    public calculateOxygenBudget(
        config: OxygenBudgetConfig,
        durationHours: number,
    ): OxygenBudgetResult {
        return this.calculateOxygenBudgetUseCase.execute(config, durationHours);
    }

    public assessEnvironment(
        limits: EnvironmentalLimits,
    ): EnvironmentalAssessment {
        return this.assessEnvironmentUseCase.execute(limits);
    }

    public evaluateFeasibility(
        oxygenResult: OxygenBudgetResult,
        envAssessment: EnvironmentalAssessment,
        routeFound: boolean,
    ): MissionFeasibilityResult {
        return this.evaluateFeasibilityUseCase.execute(
            oxygenResult,
            envAssessment,
            routeFound,
        );
    }
}
