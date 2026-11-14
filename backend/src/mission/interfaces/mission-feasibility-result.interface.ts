import { EnvironmentalAssessment } from './environmental-assessment.interface.js';
import { MissionFeasibilityStatus } from '../types/mission-feasibility-status.type.js';
import { OxygenBudgetResult } from './oxygen-budget-result.interface.js';

export interface MissionFeasibilityResult {
    status: MissionFeasibilityStatus;
    oxygen: OxygenBudgetResult;
    environment: EnvironmentalAssessment;
    reasons: string[];
    warnings: string[];
    uncertainties: string[];
}
