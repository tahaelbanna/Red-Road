import { Injectable } from '@nestjs/common';
import { Priorities } from '../interfaces/index.js';

@Injectable()
export class CalculateCellCostUseCase {
    execute(
        region: string,
        row: number,
        col: number,
        priorities: Priorities,
    ): number {
        return 0;
    }
}
