import { Injectable } from '@nestjs/common';
import { TerrainData } from '../interfaces/index.js';

@Injectable()
export class RowColToWorldUseCase {
    execute(
        data: TerrainData,
        row: number,
        col: number,
    ): { x: number; y: number } {
        const x = data.origin_x + col * data.cell_size_meters;
        const y = data.origin_y - row * data.cell_size_meters;
        return { x, y };
    }
}