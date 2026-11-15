import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
    ScientificTarget,
    ScientificTargetsData,
} from '../interfaces/index.js';

@Injectable()
export class LoadScientificTargetsUseCase {
    private readonly logger = new Logger(LoadScientificTargetsUseCase.name);

    execute(regionName: string): ScientificTarget[] {
        const candidatePaths = [
            path.join(
                process.cwd(),
                'data',
                'terrain',
                `scientific_targets_${regionName}.json`,
            ),
            path.join(
                process.cwd(),
                'backend',
                'data',
                'terrain',
                `scientific_targets_${regionName}.json`,
            ),
        ];
        const filePath =
            candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];

        if (!fs.existsSync(filePath)) {
            this.logger.warn(
                `No scientific targets file for region: ${regionName} (looked for ${filePath})`,
            );
            return [];
        }

        this.logger.log(`Loading scientific targets for region: ${regionName}`);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data: ScientificTargetsData = JSON.parse(raw);

        const outOfBounds = data.targets.filter((t) => !t.in_bounds);
        if (outOfBounds.length > 0) {
            this.logger.warn(
                `${outOfBounds.length} scientific target(s) for ${regionName} are out of grid bounds and will be ignored: ` +
                    outOfBounds.map((t) => t.id).join(', '),
            );
        }

        const inBoundsTargets = data.targets.filter((t) => t.in_bounds);
        this.logger.log(
            `Loaded ${inBoundsTargets.length} scientific target(s) for ${regionName}`,
        );

        return inBoundsTargets;
    }
}