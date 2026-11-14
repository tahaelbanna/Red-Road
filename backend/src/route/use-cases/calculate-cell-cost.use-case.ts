import { Injectable } from '@nestjs/common';
import { Priorities } from '../interfaces/index.js';
import { TerrainService } from '../../terrain/terrain.service.js';

@Injectable()
export class CalculateCellCostUseCase {
    constructor(private readonly terrainService: TerrainService) {}

    execute(
        region: string,
        fromRow: number,
        fromCol: number,
        toRow: number,
        toCol: number,
        priorities: Priorities,
    ): number {
        const terrain = this.terrainService.getRegion(region);
        if (!terrain) {
            return Infinity;
        }

        const cell = this.terrainService.getCell(region, toRow, toCol);
        if (
            !cell ||
            cell.elevation === null ||
            typeof cell.hazard !== 'number' ||
            cell.hazard >= 1.0
        ) {
            return Infinity;
        }

        const isDiagonal = fromRow !== toRow && fromCol !== toCol;
        const distanceCost = isDiagonal ? Math.SQRT2 : 1.0;

        const scienceBenefit = this.terrainService.getScienceBenefit(
            region,
            toRow,
            toCol,
        );

        const hazardPenalty = priorities.safety * Math.max(0, cell.hazard);
        const maxSlope =
            terrain.max_walkable_slope_deg > 0
                ? terrain.max_walkable_slope_deg
                : 20;
        const normalizedSlope =
            cell.slope === null || typeof cell.slope !== 'number'
                ? 1.0
                : Math.min(Math.max(0, cell.slope) / maxSlope, 1.0);
        const slopePenalty = priorities.slope * normalizedSlope;

        const baseCost =
            priorities.distance * distanceCost +
            hazardPenalty +
            slopePenalty;

        const safeBenefit = Math.max(0, typeof scienceBenefit === 'number' ? scienceBenefit : 0);
        const scienceDiscount = 1 + priorities.science * safeBenefit * 20;

        return baseCost / scienceDiscount;
    }
}
