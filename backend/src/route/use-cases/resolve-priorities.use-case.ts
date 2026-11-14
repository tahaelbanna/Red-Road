import { Injectable } from '@nestjs/common';
import { Priorities } from '../interfaces/index.js';
import { MissionType } from '../enums/mission-type.enum.js';
import { MISSION_DEFAULT_PRIORITIES } from '../constants/index.js';

@Injectable()
export class ResolvePrioritiesUseCase {
    execute(mission: MissionType, overrides?: Partial<Priorities>): Priorities {
        const defaults =
            MISSION_DEFAULT_PRIORITIES[mission] ??
            MISSION_DEFAULT_PRIORITIES[MissionType.HUMAN_EXPLORATION];

        if (!overrides) {
            return { ...defaults };
        }

        const raw = {
            safety:
                typeof overrides.safety === 'number' &&
                Number.isFinite(overrides.safety)
                    ? Math.max(0, overrides.safety)
                    : defaults.safety,
            slope:
                typeof overrides.slope === 'number' &&
                Number.isFinite(overrides.slope)
                    ? Math.max(0, overrides.slope)
                    : defaults.slope,
            distance:
                typeof overrides.distance === 'number' &&
                Number.isFinite(overrides.distance)
                    ? Math.max(0, overrides.distance)
                    : defaults.distance,
            science:
                typeof overrides.science === 'number' &&
                Number.isFinite(overrides.science)
                    ? Math.max(0, overrides.science)
                    : defaults.science,
        };

        const sum = raw.safety + raw.slope + raw.distance + raw.science;
        if (sum <= 0) {
            return { ...defaults };
        }

        return {
            safety: raw.safety / sum,
            slope: raw.slope / sum,
            distance: raw.distance / sum,
            science: raw.science / sum,
        };
    }
}
