import { AstronautProfile } from '../interfaces/astronaut-profile.interface.js';

export interface EvaAssessmentDto {
    region: string;
    path: Array<{ row: number; col: number }>;
    profile?: Partial<AstronautProfile>;
    stationaryTimeHours?: number;
}
