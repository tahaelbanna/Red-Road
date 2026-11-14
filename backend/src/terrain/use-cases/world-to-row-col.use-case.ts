import { Injectable } from '@nestjs/common';
import { TerrainData } from '../interfaces/index.js';

@Injectable()
export class WorldToRowColUseCase {
    execute(
        data: TerrainData,
        x: number,
        y: number,
    ): { row: number; col: number } {
        const col = Math.round((x - data.origin_x) / data.cell_size_meters);
        const row = Math.round((data.origin_y - y) / data.cell_size_meters);
        return { row, col };
    }
}