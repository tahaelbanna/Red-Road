import { Injectable } from '@nestjs/common';

@Injectable()
export class NormalizePrioritiesUseCase {
    execute(priorities: Record<string, number>): void {
        const sum =
            (priorities.safety || 0) +
            (priorities.slope || 0) +
            (priorities.distance || 0) +
            (priorities.science || 0);

        if (sum > 0) {
            priorities.safety = (priorities.safety || 0) / sum;
            priorities.slope = (priorities.slope || 0) / sum;
            priorities.distance = (priorities.distance || 0) / sum;
            priorities.science = (priorities.science || 0) / sum;
        }
    }
}
