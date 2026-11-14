import { Injectable } from '@nestjs/common';
import { Priorities } from '../interfaces/index.js';
import { MissionType } from '../enums/mission-type.enum.js';
import { MISSION_DEFAULT_PRIORITIES } from '../constants/index.js';

@Injectable()
export class ResolvePrioritiesUseCase {
    execute(mission: MissionType, overrides?: Priorities): Priorities {
        return overrides ?? MISSION_DEFAULT_PRIORITIES[mission];
    }
}
