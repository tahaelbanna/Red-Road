import { Injectable } from '@nestjs/common';
import {
    OxygenBudgetResult,
    EnvironmentalAssessment,
    MissionFeasibilityResult,
} from '../interfaces/index.js';
import { MissionFeasibilityStatus } from '../types/index.js';

@Injectable()
export class EvaluateFeasibilityUseCase {
    execute(
        oxygenResult: OxygenBudgetResult,
        envAssessment: EnvironmentalAssessment,
        routeFound: boolean,
    ): MissionFeasibilityResult {
        const reasons: string[] = [];
        const warnings: string[] = [...envAssessment.warnings];
        const uncertainties: string[] = [
            'Travel time is a heuristic estimate based on configured speed and a linear slope penalty. It is not a validated traversal simulation.',
            'Environmental values are static scenario estimates, not live observations or verified MEDA measurements.',
            'O₂ consumption default (0.086 kg/h) is from BVAD Table 4-70 metabolic rate only; suit leakage and CO₂-removal losses are not included.',
            'O₂ supply default (0.55 kg) approximates ISS-era EMU PLSS primary usable capacity; actual mission supply depends on hardware configuration.',
            'Reserve fraction (20%) is a configurable planning assumption, not a cited NASA flight rule.',
            'WITHIN_CONFIGURED_LIMITS means configured checks passed; it does not certify real mission safety.',
        ];

        let status: MissionFeasibilityStatus = 'WITHIN_CONFIGURED_LIMITS';

        if (!routeFound) {
            status = 'INFEASIBLE';
            reasons.push(
                'No valid route could be found connecting the start and end points.',
            );
        }

        if (!oxygenResult.isSufficient) {
            status = 'INFEASIBLE';
            reasons.push(
                `Oxygen budget insufficient. Shortfall of ${oxygenResult.additionalOxygenNeededKg.toFixed(2)} kg after reserve.`,
            );
        } else {
            reasons.push(
                'Oxygen budget is within configured limits and reserve margins.',
            );
        }

        if (!envAssessment.isWithinLimits) {
            status = 'INFEASIBLE';
            reasons.push(
                'Environmental conditions violate configured operating limits.',
            );
        } else {
            reasons.push(
                'Environmental conditions are within configured operating limits.',
            );
        }

        if (status === 'WITHIN_CONFIGURED_LIMITS' && warnings.length > 0) {
            status = 'CONDITIONAL';
        }

        return {
            status,
            oxygen: oxygenResult,
            environment: envAssessment,
            reasons,
            warnings,
            uncertainties,
        };
    }
}
