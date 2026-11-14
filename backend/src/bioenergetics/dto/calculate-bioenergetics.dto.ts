import { AstronautProfile } from '../interfaces/astronaut-profile.interface.js';

export interface CalculateBioenergeticsDto {
    region: string;
    path: Array<{ row: number; col: number }>;
    profile?: Partial<AstronautProfile>;
    reverse?: boolean;
    stationaryTimeHours?: number;
}
