import { EnvironmentalConditions } from './environmental-conditions.interface.js';
import { EnvironmentalLimits } from './environmental-limits.interface.js';

export interface EnvironmentalAssessment {
    conditions: EnvironmentalConditions;
    limits: EnvironmentalLimits;
    isWithinLimits: boolean;
    warnings: string[];
}
