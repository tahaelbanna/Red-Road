import { Injectable } from '@nestjs/common';
import { AstronautProfile } from '../interfaces/astronaut-profile.interface.js';
import {
    EvaFeasibilityResult,
    EvaFeasibilityStatus,
} from '../interfaces/eva-feasibility.interface.js';
import { CalculateRouteBioenergeticsUseCase } from './calculate-route-bioenergetics.use-case.js';
import { EvaluateSafeReturnUseCase } from './evaluate-safe-return.use-case.js';

export interface EvaluateEvaFeasibilityInput {
    region: string;
    path: Array<{ row: number; col: number }>;
    profile: AstronautProfile;
    stationaryTimeHours?: number;
}

@Injectable()
export class EvaluateEvaFeasibilityUseCase {
    constructor(
        private readonly calculateRouteBioenergeticsUseCase: CalculateRouteBioenergeticsUseCase,
        private readonly evaluateSafeReturnUseCase: EvaluateSafeReturnUseCase,
    ) {}

    execute(input: EvaluateEvaFeasibilityInput): EvaFeasibilityResult {
        const { region, path, profile, stationaryTimeHours = 0 } = input;

        // 1. Calculate Outbound Traversal (with optional stationary science time at destination)
        const outbound = this.calculateRouteBioenergeticsUseCase.execute({
            region,
            path,
            profile,
            reverse: false,
            stationaryTimeHours,
        });

        // 2. Calculate Directional Return Traversal (dz_return = -dz_forward)
        const returnTraversal = this.calculateRouteBioenergeticsUseCase.execute({
            region,
            path,
            profile,
            reverse: true,
            stationaryTimeHours: 0, // Stationary time already completed at destination
        });

        // 3. Evaluate Step-by-Step Point of Safe Return Trace
        const { safeReturnTrace, pointOfSafeReturnViolated, firstBreachIndex } =
            this.evaluateSafeReturnUseCase.execute({
                region,
                path,
                profile,
            });

        // 4. Combined Mission Resource Totals
        const totalMissionDurationMinutes =
            outbound.totalDurationMinutes + returnTraversal.totalDurationMinutes;
        const totalMissionDurationHours = totalMissionDurationMinutes / 60.0;
        const totalMissionEnergyKJ =
            outbound.estimatedTotalEnergyKJ + returnTraversal.estimatedTotalEnergyKJ;
        const totalMissionEnergyKcal =
            outbound.estimatedTotalEnergyKcal + returnTraversal.estimatedTotalEnergyKcal;
        // Independent aggregation of metabolic oxygen and structural suit leakage
        const totalMissionMetabolicOxygenEquivalentGrams =
            outbound.estimatedTotalMetabolicOxygenEquivalentGrams +
            returnTraversal.estimatedTotalMetabolicOxygenEquivalentGrams;
        const totalMissionStructuralLeakageGrams =
            outbound.estimatedTotalStructuralLeakageGrams +
            returnTraversal.estimatedTotalStructuralLeakageGrams;

        // Combined Estimated Oxygen Draw
        const totalMissionOxygenDrawGrams =
            totalMissionMetabolicOxygenEquivalentGrams + totalMissionStructuralLeakageGrams;
        const totalMissionOxygenDrawLiters =
            outbound.estimatedTotalOxygenDrawLiters +
            returnTraversal.estimatedTotalOxygenDrawLiters;

        const remainingOxygenGrams = profile.usableOxygenGrams - totalMissionOxygenDrawGrams;
        const remainingOxygenPercentage =
            profile.usableOxygenGrams > 0
                ? (remainingOxygenGrams / profile.usableOxygenGrams) * 100
                : 0;

        const configuredOxygenReserveGrams =
            profile.usableOxygenGrams * profile.oxygenReserveFraction;
        const nominalOxygenBudgetGrams =
            profile.usableOxygenGrams - configuredOxygenReserveGrams;

        // 5. Objective Feasibility Criteria
        const isDurationFeasible =
            totalMissionDurationMinutes <= profile.maxEvaDurationMinutes;
        const isOxygenFeasible =
            totalMissionOxygenDrawGrams <= nominalOxygenBudgetGrams;
        const peakPower = Math.max(
            outbound.peakMetabolicPowerWatts,
            returnTraversal.peakMetabolicPowerWatts,
        );
        const isWorkloadFeasible = peakPower <= profile.peakRedLinePowerWatts;

        const reasons: string[] = [];
        const warnings: string[] = [];
        const constraintBreaches: string[] = [];

        // Check for Critical Breaches (Deterministic Precedence)
        if (!isDurationFeasible) {
            constraintBreaches.push(
                `EXCEEDS_CONFIGURED_EVA_DURATION: Total mission duration (${totalMissionDurationHours.toFixed(2)}h) exceeds limit (${(profile.maxEvaDurationMinutes / 60).toFixed(2)}h)`,
            );
        }

        if (!isOxygenFeasible) {
            constraintBreaches.push(
                `EXCEEDS_CONFIGURED_PLSS_OXYGEN_BUDGET: Oxygen draw (${totalMissionOxygenDrawGrams.toFixed(1)}g) breaches 30% reserve threshold (budget: ${nominalOxygenBudgetGrams.toFixed(1)}g)`,
            );
        }

        if (pointOfSafeReturnViolated && firstBreachIndex !== undefined) {
            constraintBreaches.push(
                `INSUFFICIENT_SCENARIO_RETURN_MARGIN: Point of Safe Return breached at waypoint ${firstBreachIndex}. Insufficient oxygen margin to abort back to base.`,
            );
        }

        if (peakPower > profile.peakRedLinePowerWatts) {
            constraintBreaches.push(
                `EXCEEDS_CONFIGURED_WORKLOAD_THRESHOLD: Peak metabolic power (${peakPower.toFixed(0)}W) exceeds red-line ceiling (${profile.peakRedLinePowerWatts.toFixed(0)}W)`,
            );
        }

        // Check for Marginal Warnings
        if (
            outbound.durationAboveContinuousThresholdMinutes > 30 ||
            returnTraversal.durationAboveContinuousThresholdMinutes > 30
        ) {
            warnings.push(
                `EXCESSIVE_CONTINUOUS_EXERTION: High sustained workload (> ${profile.maxContinuousPowerWatts.toFixed(0)}W) exceeded 30 minutes. Astronaut pacing advised.`,
            );
        }

        const marginAboveReserveGrams = remainingOxygenGrams - configuredOxygenReserveGrams;
        if (isOxygenFeasible && marginAboveReserveGrams < 100.0) {
            warnings.push(
                `APPROACHING_SCENARIO_OXYGEN_RESERVE: Remaining oxygen margin above 30% reserve is narrow (${marginAboveReserveGrams.toFixed(1)}g remaining).`,
            );
        }

        const maxSlope = Math.max(
            outbound.maxInclineSlopeDegrees,
            returnTraversal.maxInclineSlopeDegrees,
        );
        if (maxSlope > 15.0) {
            warnings.push(
                `HIGH_TERRAIN_GRADIENT: Route traverses steep inclines (peak: ${maxSlope.toFixed(1)}°). Locomotion slip risk elevated.`,
            );
        }

        // 6. Assign Overall Status
        let status: EvaFeasibilityStatus = 'FEASIBLE';
        if (constraintBreaches.length > 0) {
            status = 'CRITICAL';
            reasons.push(
                `CRITICAL: Mission plan violates ${constraintBreaches.length} hard operational constraints.`,
            );
        } else if (warnings.length > 0) {
            status = 'MARGINAL';
            reasons.push(
                `MARGINAL: Mission plan is feasible but presents ${warnings.length} operational strain warnings.`,
            );
        } else {
            status = 'FEASIBLE';
            reasons.push(
                `FEASIBLE: Mission plan is within all configured life-support, duration, and safety return margins.`,
            );
        }

        const uncertaintyNotice =
            'Notice: Bioenergetic, metabolic, and oxygen metrics are operational engineering estimates based on partial-gravity biomechanical models. They do not constitute certified NASA flight-safety clearance or guaranteed PLSS performance.';

        return {
            status,
            isDurationFeasible,
            isOxygenFeasible,
            isWorkloadFeasible,
            pointOfSafeReturnViolated,
            firstBreachIndex,
            outbound,
            returnTraversal,
            totalMissionDurationMinutes,
            totalMissionDurationHours,
            totalMissionEnergyKcal,
            totalMissionEnergyKJ,
            totalMissionMetabolicOxygenEquivalentGrams,
            totalMissionStructuralLeakageGrams,
            totalMissionOxygenDrawGrams,
            totalMissionOxygenDrawLiters,
            remainingOxygenGrams,
            remainingOxygenPercentage,
            configuredOxygenReserveGrams,
            reasons,
            warnings,
            constraintBreaches,
            safeReturnTrace,
            uncertaintyNotice,
        };
    }
}
