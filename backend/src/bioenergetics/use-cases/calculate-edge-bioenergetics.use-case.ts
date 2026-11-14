import { Injectable } from '@nestjs/common';
import { AstronautProfile } from '../interfaces/astronaut-profile.interface.js';
import { EdgeBioenergeticsResult } from '../interfaces/edge-bioenergetics.interface.js';
import {
    GRAVITY_RATIO,
    MINETTI_A0,
    MINETTI_A1,
    MINETTI_A2,
    MINETTI_A3,
    MINETTI_A4,
    MINETTI_A5,
    OPERATIONAL_SLOPE_CLAMP_MIN,
    OPERATIONAL_SLOPE_CLAMP_MAX,
    SPEED_OPTIMAL_SLOPE,
    SPEED_DECAY_COEFFICIENT,
    OXYGEN_CALORIC_FACTOR,
    OXYGEN_DENSITY_STPD,
    JOULES_PER_KCAL,
} from '../constants/bioenergetics.constants.js';

export interface EdgeInputParameters {
    horizontalDistanceMeters: number;
    elevationDeltaMeters: number;
    terrainImpedance?: number;
    isStationary?: boolean;
    stationaryDurationSeconds?: number;
}

@Injectable()
export class CalculateEdgeBioenergeticsUseCase {
    execute(
        params: EdgeInputParameters,
        profile: AstronautProfile,
    ): EdgeBioenergeticsResult {
        const {
            horizontalDistanceMeters: dh,
            elevationDeltaMeters: dz,
            isStationary = false,
            stationaryDurationSeconds = 0,
        } = params;

        const etaTerrain = Math.max(1.0, params.terrainImpedance ?? profile.defaultTerrainImpedance ?? 1.15);

        // 1. Spatial & Slope Geometry
        const safeDh = Math.max(0.01, dh);
        const slopeGradient = dz / safeDh;
        const clampedSlopeGradient = Math.max(
            OPERATIONAL_SLOPE_CLAMP_MIN,
            Math.min(OPERATIONAL_SLOPE_CLAMP_MAX, slopeGradient),
        );
        const slopeAngleRadians = Math.atan(slopeGradient);
        const slopeAngleDegrees = (slopeAngleRadians * 180) / Math.PI;
        const traversalDistance3DMeters = Math.sqrt(dh * dh + dz * dz);

        // 2. Kinematics & Walking Speed
        let walkingSpeedMps = 0;
        let traversalDurationSeconds = 0;

        if (isStationary) {
            walkingSpeedMps = 0;
            traversalDurationSeconds = Math.max(0, stationaryDurationSeconds);
        } else {
            // Adaptive speed: v(i) = v_nominal * exp(-3.5 * |i_clamped - i_opt| + 3.5 * |i_opt|)
            const speedExponent =
                -SPEED_DECAY_COEFFICIENT * Math.abs(clampedSlopeGradient - SPEED_OPTIMAL_SLOPE) +
                SPEED_DECAY_COEFFICIENT * Math.abs(SPEED_OPTIMAL_SLOPE);
            const nominalV = Math.max(0.01, profile.nominalWalkingSpeedMps);
            const rawV = nominalV * Math.exp(speedExponent);
            const minV = Math.max(0.01, profile.minWalkingSpeedMps);
            const maxV = Math.max(minV, profile.maxWalkingSpeedMps);
            walkingSpeedMps = Math.max(minV, Math.min(maxV, rawV));
            traversalDurationSeconds = traversalDistance3DMeters / walkingSpeedMps;
        }

        // 3. Minetti Cost of Transport & Mars Transformation
        const ic = clampedSlopeGradient;
        const ic2 = ic * ic;
        const ic3 = ic2 * ic;
        const ic4 = ic3 * ic;
        const ic5 = ic4 * ic;

        const terrestrialCost =
            MINETTI_A5 * ic5 +
            MINETTI_A4 * ic4 +
            MINETTI_A3 * ic3 +
            MINETTI_A2 * ic2 +
            MINETTI_A1 * ic +
            MINETTI_A0;

        const alpha = Math.max(0, Math.min(1.0, profile.internalWorkFraction));
        const martianCost =
            (terrestrialCost - 2.5) * GRAVITY_RATIO +
            2.5 * (alpha + (1.0 - alpha) * GRAVITY_RATIO);

        // 4. Metabolic Power Breakdown
        const effectiveMassFactor = Math.max(0, profile.effectiveMassFactor);
        const effectiveMassKg =
            profile.crewMassKg + effectiveMassFactor * (profile.suitMassKg + profile.payloadMassKg);

        let locomotionPowerWatts = 0;
        let suitJointPowerWatts = 0;

        if (walkingSpeedMps > 0) {
            locomotionPowerWatts = martianCost * effectiveMassKg * walkingSpeedMps * etaTerrain;
            suitJointPowerWatts =
                profile.suitJointWorkNominalWatts * (walkingSpeedMps / profile.nominalWalkingSpeedMps);
        }

        const basalPowerWatts = profile.basalMetabolicRatePerKg * profile.crewMassKg;
        const grossMetabolicPowerWatts = locomotionPowerWatts + suitJointPowerWatts + basalPowerWatts;

        // 5. Energy Consumed
        const estimatedEnergyJoules = grossMetabolicPowerWatts * traversalDurationSeconds;
        const estimatedEnergyKJ = estimatedEnergyJoules / 1000.0;
        const estimatedEnergyKcal = estimatedEnergyJoules / JOULES_PER_KCAL;

        // 6. Oxygen Equivalent Consumed (STPD)
        const oxygenUptakeRateLpm = grossMetabolicPowerWatts / OXYGEN_CALORIC_FACTOR;
        const estimatedMetabolicOxygenEquivalentLiters =
            oxygenUptakeRateLpm * (traversalDurationSeconds / 60.0);
        const estimatedMetabolicOxygenEquivalentGrams =
            estimatedMetabolicOxygenEquivalentLiters * OXYGEN_DENSITY_STPD;

        if (
            typeof profile.suitLeakageRateLpm !== 'number' ||
            !Number.isFinite(profile.suitLeakageRateLpm) ||
            profile.suitLeakageRateLpm < 0
        ) {
            throw new Error(
                `Invalid suitLeakageRateLpm: ${profile.suitLeakageRateLpm}. Must be a finite non-negative number.`,
            );
        }
        const suitLeakageRateLpm = profile.suitLeakageRateLpm;
        const estimatedStructuralLeakageLiters =
            suitLeakageRateLpm * (traversalDurationSeconds / 60.0);
        const estimatedStructuralLeakageGrams =
            estimatedStructuralLeakageLiters * OXYGEN_DENSITY_STPD;

        const estimatedTotalOxygenDrawLiters =
            estimatedMetabolicOxygenEquivalentLiters + estimatedStructuralLeakageLiters;
        const estimatedTotalOxygenDrawGrams =
            estimatedTotalOxygenDrawLiters * OXYGEN_DENSITY_STPD;

        return {
            horizontalDistanceMeters: dh,
            elevationDeltaMeters: dz,
            slopeGradient,
            clampedSlopeGradient,
            slopeAngleDegrees,
            slopeAngleRadians,
            traversalDistance3DMeters,
            walkingSpeedMps,
            traversalDurationSeconds,
            terrestrialCostOfTransportJoulePerKgM: terrestrialCost,
            martianCostOfTransportJoulePerKgM: martianCost,
            locomotionPowerWatts,
            suitJointPowerWatts,
            basalPowerWatts,
            grossMetabolicPowerWatts,
            estimatedEnergyJoules,
            estimatedEnergyKJ,
            estimatedEnergyKcal,
            oxygenUptakeRateLpm,
            estimatedMetabolicOxygenEquivalentLiters,
            estimatedMetabolicOxygenEquivalentGrams,
            estimatedStructuralLeakageLiters,
            estimatedStructuralLeakageGrams,
            estimatedTotalOxygenDrawLiters,
            estimatedTotalOxygenDrawGrams,
        };
    }
}
