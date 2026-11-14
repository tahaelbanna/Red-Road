import { Controller, Post, Body } from '@nestjs/common';
import { MissionService } from './mission.service.js';
import type {
    FeasibilityRequest,
    MissionFeasibilityResult,
} from './interfaces/index.js';

@Controller('api/mission')
export class MissionController {
    constructor(private readonly missionService: MissionService) {}

    @Post('feasibility')
    assessFeasibility(
        @Body() req: FeasibilityRequest,
    ): MissionFeasibilityResult {
        const oxygenResult = this.missionService.calculateOxygenBudget(
            req.oxygenConfig,
            req.durationHours,
        );
        const envAssessment = this.missionService.assessEnvironment(
            req.envLimits,
        );
        return this.missionService.evaluateFeasibility(
            oxygenResult,
            envAssessment,
            req.routeFound,
        );
    }
}
