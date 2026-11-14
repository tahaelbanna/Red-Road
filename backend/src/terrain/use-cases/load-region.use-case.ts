import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { TerrainData } from '../interfaces/index.js';

@Injectable()
export class LoadRegionUseCase {
    private readonly logger = new Logger(LoadRegionUseCase.name);

    execute(regionName: string): TerrainData {
        const filePath = path.join(
            process.cwd(),
            'data',
            'terrain',
            `terrain_${regionName}.json`,
        );

        this.logger.log(`Loading terrain data for region: ${regionName}`);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data: TerrainData = JSON.parse(raw);

        this.logger.log(
            `Loaded ${regionName}: ${data.grid_rows}x${data.grid_cols} cells`,
        );

        return data;
    }
}