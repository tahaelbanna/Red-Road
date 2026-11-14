import { type EnvironmentalLimits } from "./environmental-limits.interface";
import { type OxygenBudgetConfig } from "./oxygen-budget-config.interface";

export interface FeasibilityRequest {
  durationHours: number;
  routeFound: boolean;
  oxygenConfig: OxygenBudgetConfig;
  envLimits: EnvironmentalLimits;
}
