import { EnvironmentalLimits } from './environmental-limits.interface.js';
import { OxygenBudgetConfig } from './oxygen-budget-config.interface.js';

export interface FeasibilityRequest {
    durationHours: number;
    routeFound: boolean;
    oxygenConfig: OxygenBudgetConfig;
    envLimits: EnvironmentalLimits;
}
