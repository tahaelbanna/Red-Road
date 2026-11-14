import { MissionType } from '../enums/mission-type.enum.js';
import { Priorities } from '../interfaces/priorities.interface.js';

export const MISSION_DEFAULT_PRIORITIES: Record<MissionType, Priorities> = {
    [MissionType.HUMAN_EXPLORATION]: {
        safety: 0.4,
        slope: 0.3,
        distance: 0.2,
        science: 0.1,
    },
    [MissionType.SCIENTIFIC_RESEARCH]: {
        safety: 0.2,
        slope: 0.2,
        distance: 0.2,
        science: 0.4,
    },
    [MissionType.RAPID_TRANSIT]: {
        safety: 0.3,
        slope: 0.2,
        distance: 0.45,
        science: 0.05,
    },
};
