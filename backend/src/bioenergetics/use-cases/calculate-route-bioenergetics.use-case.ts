import { Injectable } from '@nestjs/common';
import { TerrainService } from '../../terrain/terrain.service.js';
import { AstronautProfile } from '../interfaces/astronaut-profile.interface.js';
import { RouteBioenergeticsSummary } from '../interfaces/route-bioenergetics.interface.js';
import { EdgeBioenergeticsResult } from '../interfaces/edge-bioenergetics.interface.js';
import { CalculateEdgeBioenergeticsUseCase } from './calculate-edge-bioenergetics.use-case.js';
import { JOULES_PER_KCAL, TERRAIN_IMPEDANCE } from '../constants/bioenergetics.constants.js';

export interface RouteBioenergeticsInput {
    region: string;
    path: Array<{ row: number; col: number }>;
    profile: AstronautProfile;
    reverse?: boolean;
    stationaryTimeHours?: number;
}

@Injectable()
export class CalculateRouteBioenergeticsUseCase {
    constructor(
        private readonly terrainService: TerrainService,
        private readonly calculateEdgeUseCase: CalculateEdgeBioenergeticsUseCase,
    ) {}

    execute(input: RouteBioenergeticsInput): RouteBioenergeticsSummary {
        const { region, profile, reverse = false, stationaryTimeHours = 0 } = input;
        const terrain = this.terrainService.getRegion(region);
        const cellSize = terrain.cell_size_meters;

        // Path sequencing: if reverse is true, we reverse the array of points
        const orderedPath = reverse ? [...input.path].reverse() : input.path;

        const edges: EdgeBioenergeticsResult[] = [];

        let totalHorizontalDistanceMeters = 0;
        let totalTraversalDistance3DMeters = 0;
        let totalElevationGainMeters = 0;
        let totalElevationLossMeters = 0;
        let maxInclineSlopeDegrees = 0;
        let maxDeclineSlopeDegrees = 0;

        let totalDurationSeconds = 0;
        let estimatedTotalEnergyJoules = 0;
        let peakMetabolicPowerWatts = 0;
        let durationAboveContinuousSeconds = 0;

        let estimatedTotalMetabolicOxygenEquivalentLiters = 0;
        let estimatedTotalMetabolicOxygenEquivalentGrams = 0;
        let estimatedTotalStructuralLeakageLiters = 0;
        let estimatedTotalStructuralLeakageGrams = 0;
        let estimatedTotalOxygenDrawLiters = 0;
        let estimatedTotalOxygenDrawGrams = 0;

        for (let i = 1; i < orderedPath.length; i++) {
            const pFrom = orderedPath[i - 1];
            const pTo = orderedPath[i];

            const cellFrom = this.terrainService.getCell(region, pFrom.row, pFrom.col);
            const cellTo = this.terrainService.getCell(region, pTo.row, pTo.col);

            const isDiagonal = pFrom.row !== pTo.row && pFrom.col !== pTo.col;
            const dh = (isDiagonal ? Math.SQRT2 : 1.0) * cellSize;

            const elevFrom = cellFrom.elevation ?? 0;
            const elevTo = cellTo.elevation ?? 0;
            const dz = elevTo - elevFrom;

            if (dz > 0) {
                totalElevationGainMeters += dz;
            } else {
                totalElevationLossMeters += Math.abs(dz);
            }

            // Geomorphic terrain impedance lookup: if hazard > 0.5, use boulder rubble (1.40)
            const terrainImpedance =
                cellTo.hazard > 0.5
                    ? TERRAIN_IMPEDANCE.BOULDER_RUBBLE
                    : (profile.defaultTerrainImpedance ?? TERRAIN_IMPEDANCE.CONSOLIDATED_REGOLITH);

            const edgeResult = this.calculateEdgeUseCase.execute(
                {
                    horizontalDistanceMeters: dh,
                    elevationDeltaMeters: dz,
                    terrainImpedance,
                    isStationary: false,
                },
                profile,
            );

            edges.push(edgeResult);

            totalHorizontalDistanceMeters += edgeResult.horizontalDistanceMeters;
            totalTraversalDistance3DMeters += edgeResult.traversalDistance3DMeters;
            totalDurationSeconds += edgeResult.traversalDurationSeconds;
            estimatedTotalEnergyJoules += edgeResult.estimatedEnergyJoules;

            if (edgeResult.slopeAngleDegrees > maxInclineSlopeDegrees) {
                maxInclineSlopeDegrees = edgeResult.slopeAngleDegrees;
            }
            if (edgeResult.slopeAngleDegrees < 0 && Math.abs(edgeResult.slopeAngleDegrees) > maxDeclineSlopeDegrees) {
                maxDeclineSlopeDegrees = Math.abs(edgeResult.slopeAngleDegrees);
            }

            if (edgeResult.grossMetabolicPowerWatts > peakMetabolicPowerWatts) {
                peakMetabolicPowerWatts = edgeResult.grossMetabolicPowerWatts;
            }

            if (edgeResult.grossMetabolicPowerWatts > profile.maxContinuousPowerWatts) {
                durationAboveContinuousSeconds += edgeResult.traversalDurationSeconds;
            }

            estimatedTotalMetabolicOxygenEquivalentLiters +=
                edgeResult.estimatedMetabolicOxygenEquivalentLiters;
            estimatedTotalMetabolicOxygenEquivalentGrams +=
                edgeResult.estimatedMetabolicOxygenEquivalentGrams;
            estimatedTotalStructuralLeakageLiters +=
                edgeResult.estimatedStructuralLeakageLiters;
            estimatedTotalStructuralLeakageGrams +=
                edgeResult.estimatedStructuralLeakageGrams;
            estimatedTotalOxygenDrawLiters += edgeResult.estimatedTotalOxygenDrawLiters;
            estimatedTotalOxygenDrawGrams += edgeResult.estimatedTotalOxygenDrawGrams;
        }

        // Account for optional stationary science pause duration
        if (stationaryTimeHours > 0) {
            const stationarySeconds = stationaryTimeHours * 3600;
            const stationaryResult = this.calculateEdgeUseCase.execute(
                {
                    horizontalDistanceMeters: 0,
                    elevationDeltaMeters: 0,
                    isStationary: true,
                    stationaryDurationSeconds: stationarySeconds,
                },
                profile,
            );

            edges.push(stationaryResult);
            totalDurationSeconds += stationaryResult.traversalDurationSeconds;
            estimatedTotalEnergyJoules += stationaryResult.estimatedEnergyJoules;

            estimatedTotalMetabolicOxygenEquivalentLiters +=
                stationaryResult.estimatedMetabolicOxygenEquivalentLiters;
            estimatedTotalMetabolicOxygenEquivalentGrams +=
                stationaryResult.estimatedMetabolicOxygenEquivalentGrams;
            estimatedTotalStructuralLeakageLiters +=
                stationaryResult.estimatedStructuralLeakageLiters;
            estimatedTotalStructuralLeakageGrams +=
                stationaryResult.estimatedStructuralLeakageGrams;
            estimatedTotalOxygenDrawLiters += stationaryResult.estimatedTotalOxygenDrawLiters;
            estimatedTotalOxygenDrawGrams += stationaryResult.estimatedTotalOxygenDrawGrams;
        }

        const averageMetabolicPowerWatts =
            totalDurationSeconds > 0
                ? estimatedTotalEnergyJoules / totalDurationSeconds
                : profile.basalMetabolicRatePerKg * profile.crewMassKg;

        const totalDurationMinutes = totalDurationSeconds / 60.0;
        const totalDurationHours = totalDurationSeconds / 3600.0;
        const estimatedTotalEnergyKJ = estimatedTotalEnergyJoules / 1000.0;
        const estimatedTotalEnergyKcal = estimatedTotalEnergyJoules / JOULES_PER_KCAL;
        const durationAboveContinuousThresholdMinutes = durationAboveContinuousSeconds / 60.0;

        return {
            totalHorizontalDistanceMeters,
            totalTraversalDistance3DMeters,
            totalElevationGainMeters,
            totalElevationLossMeters,
            maxInclineSlopeDegrees,
            maxDeclineSlopeDegrees,
            totalDurationSeconds,
            totalDurationMinutes,
            totalDurationHours,
            estimatedTotalEnergyJoules,
            estimatedTotalEnergyKJ,
            estimatedTotalEnergyKcal,
            averageMetabolicPowerWatts,
            peakMetabolicPowerWatts,
            durationAboveContinuousThresholdMinutes,
            estimatedTotalMetabolicOxygenEquivalentLiters,
            estimatedTotalMetabolicOxygenEquivalentGrams,
            estimatedTotalStructuralLeakageLiters,
            estimatedTotalStructuralLeakageGrams,
            estimatedTotalOxygenDrawLiters,
            estimatedTotalOxygenDrawGrams,
            edges,
        };
    }
}
