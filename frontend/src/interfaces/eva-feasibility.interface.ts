import type { RouteBioenergeticsSummary } from "./route-bioenergetics.interface";

export type EvaFeasibilityStatus = "FEASIBLE" | "MARGINAL" | "CRITICAL";

export interface SafeReturnWaypointAudit {
  waypointIndex: number;
  cumulativeOutboundOxygenGrams: number;
  remainingOxygenGrams: number;
  walkbackOxygenRequiredGrams: number;
  emergencyReserveGrams: number;
  marginGrams: number;
  isViable: boolean;
}

export interface EvaFeasibilityResult {
  status: EvaFeasibilityStatus;
  isDurationFeasible: boolean;
  isOxygenFeasible: boolean;
  isWorkloadFeasible: boolean;
  pointOfSafeReturnViolated: boolean;
  firstBreachIndex?: number;

  outbound: RouteBioenergeticsSummary;
  returnTraversal: RouteBioenergeticsSummary;

  totalMissionDurationMinutes: number;
  totalMissionDurationHours: number;
  totalMissionEnergyKcal: number;
  totalMissionEnergyKJ: number;
  totalMissionOxygenDrawGrams: number;
  totalMissionOxygenDrawLiters: number;
  remainingOxygenGrams: number;
  remainingOxygenPercentage: number;
  configuredOxygenReserveGrams: number;

  reasons: string[];
  warnings: string[];
  constraintBreaches: string[];
  safeReturnTrace: SafeReturnWaypointAudit[];

  uncertaintyNotice: string;
}
