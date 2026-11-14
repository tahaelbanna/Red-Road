import { Injectable } from '@nestjs/common';
import { TerrainService } from '../../terrain/terrain.service.js';
import { GridPosition } from '../interfaces/index.js';

@Injectable()
export class EnrichPathUseCase {
    constructor(private readonly terrainService: TerrainService) {}

    execute(
        region: string,
        path: GridPosition[],
    ): Array<{ row: number; col: number; x: number; y: number }> {
        return path.map((p) => {
            const { x, y } = this.terrainService.rowColToWorld(
                region,
                p.row,
                p.col,
            );
            return { row: p.row, col: p.col, x, y };
        });
    }
}
