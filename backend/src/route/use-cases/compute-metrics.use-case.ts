import { Injectable } from '@nestjs/common';
import { TerrainService } from '../../terrain/terrain.service.js';
import {
    GridPosition,
    RoutePlanRequest,
    RouteMetrics,
    ScientificTargetHit,
} from '../interfaces/index.js';

@Injectable()
export class ComputeMetricsUseCase {
    constructor(private readonly terrainService: TerrainService) {}

    execute(
        region: string,
        path: GridPosition[],
        totalCost: number,
        request: RoutePlanRequest,
    ): RouteMetrics {
        const terrain = this.terrainService.getRegion(region);
        const targets = this.terrainService.getScientificTargets(region);

        let distanceMeters = 0;
        let maxSlopeDeg = 0;
        let totalElevationChange = 0;
        let minElevation = Infinity;
        let maxElevation = -Infinity;
        let hazardSegments = 0;

        const rawSpeed = request.baseSpeedKmh ?? 1.5;
        const BASE_SPEED_KM_H = Math.max(0.01, Math.min(rawSpeed, 20));

        for (let i = 0; i < path.length; i++) {
            const cell = this.terrainService.getCell(
                region,
                path[i].row,
                path[i].col,
            );

            if (cell.slope !== null) {
                maxSlopeDeg = Math.max(maxSlopeDeg, cell.slope);
            }

            if (cell.elevation !== null) {
                minElevation = Math.min(minElevation, cell.elevation);
                maxElevation = Math.max(maxElevation, cell.elevation);
            }

            if (cell.hazard > 0.5) {
                hazardSegments++;
            }

            if (i > 0) {
                const isDiagonal =
                    path[i].row !== path[i - 1].row &&
                    path[i].col !== path[i - 1].col;
                distanceMeters +=
                    (isDiagonal ? Math.SQRT2 : 1) * terrain.cell_size_meters;

                const prevCell = this.terrainService.getCell(
                    region,
                    path[i - 1].row,
                    path[i - 1].col,
                );
                if (cell.elevation !== null && prevCell.elevation !== null) {
                    totalElevationChange += Math.abs(
                        cell.elevation - prevCell.elevation,
                    );
                }
            }
        }

        const avgSlopeFactor = 1 + (maxSlopeDeg / 20) * 0.5;
        const effectiveSpeedKmH = BASE_SPEED_KM_H / avgSlopeFactor;
        const stationaryTimeHours = Math.max(
            0,
            request.stationaryTimeHours ?? 0,
        );
        const estimatedTravelTimeHours =
            distanceMeters / 1000 / effectiveSpeedKmH + stationaryTimeHours;

        const PROXIMITY_THRESHOLD_M = 500;
        const scientificTargetsNearRoute: ScientificTargetHit[] = [];

        for (const target of targets) {
            let closestDistance = Infinity;

            for (const point of path) {
                const { x: px, y: py } = this.terrainService.rowColToWorld(
                    region,
                    point.row,
                    point.col,
                );
                const dx = px - target.x;
                const dy = py - target.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                closestDistance = Math.min(closestDistance, dist);
            }

            if (closestDistance <= PROXIMITY_THRESHOLD_M) {
                scientificTargetsNearRoute.push({
                    id: target.id,
                    name: target.name,
                    type: target.type,
                    distanceMeters: Math.round(closestDistance),
                });
            }
        }

        return {
            totalCost,
            distanceMeters: Math.round(distanceMeters),
            maxSlopeDeg,
            elevationChangeMeters: Math.round(totalElevationChange),
            minElevationMeters:
                minElevation === Infinity ? 0 : Math.round(minElevation),
            maxElevationMeters:
                maxElevation === -Infinity ? 0 : Math.round(maxElevation),
            estimatedTravelTimeHours:
                Math.round(estimatedTravelTimeHours * 100) / 100,
            scientificTargetsNearRoute,
            hazardSegments,
        };
    }
}
