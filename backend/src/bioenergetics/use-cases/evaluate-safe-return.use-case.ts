import { Injectable } from '@nestjs/common';
import { TerrainService } from '../../terrain/terrain.service.js';
import { AstronautProfile } from '../interfaces/astronaut-profile.interface.js';
import { SafeReturnWaypointAudit } from '../interfaces/eva-feasibility.interface.js';
import { CalculateEdgeBioenergeticsUseCase } from './calculate-edge-bioenergetics.use-case.js';
import { TERRAIN_IMPEDANCE } from '../constants/bioenergetics.constants.js';

export interface EvaluateSafeReturnInput {
    region: string;
    path: Array<{ row: number; col: number }>;
    profile: AstronautProfile;
}

@Injectable()
export class EvaluateSafeReturnUseCase {
    constructor(
        private readonly terrainService: TerrainService,
        private readonly calculateEdgeUseCase: CalculateEdgeBioenergeticsUseCase,
    ) {}

    execute(input: EvaluateSafeReturnInput): {
        safeReturnTrace: SafeReturnWaypointAudit[];
        pointOfSafeReturnViolated: boolean;
        firstBreachIndex?: number;
    } {
        const { region, path, profile } = input;
        const terrain = this.terrainService.getRegion(region);
        const cellSize = terrain.cell_size_meters;

        const emergencyReserveGrams =
            profile.usableOxygenGrams * profile.oxygenReserveFraction;

        const safeReturnTrace: SafeReturnWaypointAudit[] = [];
        let pointOfSafeReturnViolated = false;
        let firstBreachIndex: number | undefined = undefined;

        // Step 1: Precompute forward edge oxygen draws
        const forwardEdgeOxygenGrams: number[] = [0]; // Index 0 has 0 cost
        let cumulativeOutboundO2Grams = 0;

        for (let i = 1; i < path.length; i++) {
            const pFrom = path[i - 1];
            const pTo = path[i];

            const cellFrom = this.terrainService.getCell(region, pFrom.row, pFrom.col);
            const cellTo = this.terrainService.getCell(region, pTo.row, pTo.col);

            const isDiagonal = pFrom.row !== pTo.row && pFrom.col !== pTo.col;
            const dh = (isDiagonal ? Math.SQRT2 : 1.0) * cellSize;
            const dz = (cellTo.elevation ?? 0) - (cellFrom.elevation ?? 0);

            const terrainImpedance =
                cellTo.hazard > 0.5
                    ? TERRAIN_IMPEDANCE.BOULDER_RUBBLE
                    : (profile.defaultTerrainImpedance ?? TERRAIN_IMPEDANCE.CONSOLIDATED_REGOLITH);

            const edge = this.calculateEdgeUseCase.execute(
                {
                    horizontalDistanceMeters: dh,
                    elevationDeltaMeters: dz,
                    terrainImpedance,
                },
                profile,
            );

            cumulativeOutboundO2Grams += edge.estimatedTotalOxygenDrawGrams;
            forwardEdgeOxygenGrams.push(cumulativeOutboundO2Grams);
        }

        // Step 2: At each waypoint k, calculate walkback abort cost (k -> 0)
        // Note: For walkback abort, elevation delta is reversed: dz_return = -dz_forward
        for (let k = 0; k < path.length; k++) {
            const outboundO2 = forwardEdgeOxygenGrams[k];
            const remainingOxygenGrams = profile.usableOxygenGrams - outboundO2;

            let walkbackOxygenRequiredGrams = 0;

            // Trace walkback path backwards from k down to 0
            for (let j = k; j >= 1; j--) {
                const pCurrent = path[j];
                const pNextReturn = path[j - 1];

                const cellCurrent = this.terrainService.getCell(region, pCurrent.row, pCurrent.col);
                const cellNext = this.terrainService.getCell(region, pNextReturn.row, pNextReturn.col);

                const isDiagonal = pCurrent.row !== pNextReturn.row && pCurrent.col !== pNextReturn.col;
                const dh = (isDiagonal ? Math.SQRT2 : 1.0) * cellSize;
                // Directional reverse elevation delta:
                const dzReturn = (cellNext.elevation ?? 0) - (cellCurrent.elevation ?? 0);

                const terrainImpedance =
                    cellNext.hazard > 0.5
                        ? TERRAIN_IMPEDANCE.BOULDER_RUBBLE
                        : (profile.defaultTerrainImpedance ?? TERRAIN_IMPEDANCE.CONSOLIDATED_REGOLITH);

                const returnEdge = this.calculateEdgeUseCase.execute(
                    {
                        horizontalDistanceMeters: dh,
                        elevationDeltaMeters: dzReturn,
                        terrainImpedance,
                    },
                    profile,
                );

                walkbackOxygenRequiredGrams += returnEdge.estimatedTotalOxygenDrawGrams;
            }

            const marginGrams =
                remainingOxygenGrams - walkbackOxygenRequiredGrams - emergencyReserveGrams;
            const isViable = marginGrams >= 0;

            if (!isViable && !pointOfSafeReturnViolated) {
                pointOfSafeReturnViolated = true;
                firstBreachIndex = k;
            }

            safeReturnTrace.push({
                waypointIndex: k,
                cumulativeOutboundOxygenGrams: outboundO2,
                remainingOxygenGrams,
                walkbackOxygenRequiredGrams,
                emergencyReserveGrams,
                marginGrams,
                isViable,
            });
        }

        return {
            safeReturnTrace,
            pointOfSafeReturnViolated,
            firstBreachIndex,
        };
    }
}
