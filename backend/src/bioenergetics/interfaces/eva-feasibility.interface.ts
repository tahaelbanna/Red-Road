import { RouteBioenergeticsSummary } from './route-bioenergetics.interface.js';

export type EvaFeasibilityStatus = 'FEASIBLE' | 'MARGINAL' | 'CRITICAL';

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
    // Overall Scenario Evaluation
    status: EvaFeasibilityStatus;
    isDurationFeasible: boolean;
    isOxygenFeasible: boolean;
    isWorkloadFeasible: boolean;
    pointOfSafeReturnViolated: boolean;
    firstBreachIndex?: number;

    // Outbound & Return Telemetry Breakdown
    outbound: RouteBioenergeticsSummary;
    returnTraversal: RouteBioenergeticsSummary;

    // Combined Mission Resource Totals
    totalMissionDurationMinutes: number;
    totalMissionDurationHours: number;
    totalMissionEnergyKcal: number;
    totalMissionEnergyKJ: number;
    totalMissionOxygenDrawGrams: number;
    totalMissionOxygenDrawLiters: number;
    remainingOxygenGrams: number;
    remainingOxygenPercentage: number;
    configuredOxygenReserveGrams: number;

    // Audit Logs and Point-of-Safe-Return Trace
    reasons: string[];
    warnings: string[];
    constraintBreaches: string[];
    safeReturnTrace: SafeReturnWaypointAudit[];

    // Mandatory Epistemological Disclaimers
    uncertaintyNotice: string;
}
