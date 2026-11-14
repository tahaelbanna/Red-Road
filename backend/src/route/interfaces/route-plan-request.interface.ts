import { GridPosition } from './grid-position.interface.js';
import { MissionType } from '../enums/mission-type.enum.js';
import { Priorities } from './priorities.interface.js';

export interface RoutePlanRequest {
    region: string;
    start: GridPosition;
    end: GridPosition;
    mission: MissionType;
    priorities?: Priorities;
    baseSpeedKmh?: number;
    stationaryTimeHours?: number;
}
