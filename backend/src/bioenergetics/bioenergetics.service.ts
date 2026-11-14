import { Injectable } from '@nestjs/common';
import { AstronautProfile } from './interfaces/astronaut-profile.interface.js';
import { EdgeBioenergeticsResult } from './interfaces/edge-bioenergetics.interface.js';
import { RouteBioenergeticsSummary } from './interfaces/route-bioenergetics.interface.js';
import { EvaFeasibilityResult } from './interfaces/eva-feasibility.interface.js';
import {
    CalculateEdgeBioenergeticsUseCase,
    EdgeInputParameters,
} from './use-cases/calculate-edge-bioenergetics.use-case.js';
import { CalculateRouteBioenergeticsUseCase } from './use-cases/calculate-route-bioenergetics.use-case.js';
import { EvaluateSafeReturnUseCase } from './use-cases/evaluate-safe-return.use-case.js';
import { EvaluateEvaFeasibilityUseCase } from './use-cases/evaluate-eva-feasibility.use-case.js';
import { DEFAULT_ASTRONAUT_PROFILE } from './constants/default-profile.constants.js';

@Injectable()
export class BioenergeticsService {
    constructor(
        private readonly calculateEdgeUseCase: CalculateEdgeBioenergeticsUseCase,
        private readonly calculateRouteUseCase: CalculateRouteBioenergeticsUseCase,
        private readonly evaluateSafeReturnUseCase: EvaluateSafeReturnUseCase,
        private readonly evaluateEvaFeasibilityUseCase: EvaluateEvaFeasibilityUseCase,
    ) {}

    getDefaultProfile(): AstronautProfile {
        return { ...DEFAULT_ASTRONAUT_PROFILE };
    }

    mergeProfile(overrides?: Partial<AstronautProfile>): AstronautProfile {
        if (!overrides) {
            return this.getDefaultProfile();
        }
        if (
            overrides.suitLeakageRateLpm !== undefined &&
            (typeof overrides.suitLeakageRateLpm !== 'number' ||
                !Number.isFinite(overrides.suitLeakageRateLpm) ||
                overrides.suitLeakageRateLpm < 0)
        ) {
            throw new Error(
                `Invalid suitLeakageRateLpm: ${overrides.suitLeakageRateLpm}. Must be a finite non-negative number.`,
            );
        }
        return {
            ...DEFAULT_ASTRONAUT_PROFILE,
            ...overrides,
        };
    }

    calculateEdge(
        params: EdgeInputParameters,
        profileOverrides?: Partial<AstronautProfile>,
    ): EdgeBioenergeticsResult {
        const profile = this.mergeProfile(profileOverrides);
        return this.calculateEdgeUseCase.execute(params, profile);
    }

    calculateRoute(
        region: string,
        path: Array<{ row: number; col: number }>,
        profileOverrides?: Partial<AstronautProfile>,
        reverse = false,
        stationaryTimeHours = 0,
    ): RouteBioenergeticsSummary {
        const profile = this.mergeProfile(profileOverrides);
        return this.calculateRouteUseCase.execute({
            region,
            path,
            profile,
            reverse,
            stationaryTimeHours,
        });
    }

    evaluateEvaFeasibility(
        region: string,
        path: Array<{ row: number; col: number }>,
        profileOverrides?: Partial<AstronautProfile>,
        stationaryTimeHours = 0,
    ): EvaFeasibilityResult {
        const profile = this.mergeProfile(profileOverrides);
        return this.evaluateEvaFeasibilityUseCase.execute({
            region,
            path,
            profile,
            stationaryTimeHours,
        });
    }
}
