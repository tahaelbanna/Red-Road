import { Injectable, Logger } from '@nestjs/common';
import { TerrainData, ScientificTarget } from '../interfaces/index.js';

const SCIENCE_INFLUENCE_RADIUS_METERS = 1000;

@Injectable()
export class BuildScienceBenefitGridUseCase {
    private readonly logger = new Logger(BuildScienceBenefitGridUseCase.name);

    execute(
        regionName: string,
        terrain: TerrainData,
        targets: ScientificTarget[],
    ): number[] {
        const totalCells = terrain.grid_rows * terrain.grid_cols;
        const benefitGrid = new Array<number>(totalCells).fill(0);

        if (targets.length === 0) {
            this.logger.log(
                `No scientific targets for ${regionName}; science benefit grid is all zero`,
            );
            return benefitGrid;
        }

        const twoSigmaSq = 2 * SCIENCE_INFLUENCE_RADIUS_METERS ** 2;

        for (let row = 0; row < terrain.grid_rows; row++) {
            for (let col = 0; col < terrain.grid_cols; col++) {
                const cellX = terrain.origin_x + col * terrain.cell_size_meters;
                const cellY = terrain.origin_y - row * terrain.cell_size_meters;

                let totalBenefit = 0;
                for (const target of targets) {
                    const dx = cellX - target.x;
                    const dy = cellY - target.y;
                    const distanceSq = dx * dx + dy * dy;

                    const falloff = Math.exp(-distanceSq / twoSigmaSq);
                    totalBenefit += target.science_value * falloff;
                }

                const index = row * terrain.grid_cols + col;
                benefitGrid[index] = totalBenefit;
            }
        }

        this.logger.log(
            `Built science benefit grid for ${regionName} (${targets.length} target(s), radius ${SCIENCE_INFLUENCE_RADIUS_METERS}m)`,
        );

        return benefitGrid;
    }
}