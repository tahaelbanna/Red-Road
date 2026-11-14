import { Injectable } from '@nestjs/common';
import { TerrainData, CellInfo } from '../interfaces/index.js';

@Injectable()
export class GetCellUseCase {
    execute(data: TerrainData, row: number, col: number): CellInfo {
        const index = row * data.grid_cols + col;

        return {
            row,
            col,
            elevation: data.elevation[index],
            slope: data.slope[index],
            hazard: data.hazard[index],
        };
    }
}