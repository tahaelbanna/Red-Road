import type { EdgeBioenergeticsResult } from "./edge-bioenergetics.interface";

export interface RouteBioenergeticsSummary {
  totalHorizontalDistanceMeters: number;
  totalTraversalDistance3DMeters: number;
  totalElevationGainMeters: number;
  totalElevationLossMeters: number;
  maxInclineSlopeDegrees: number;
  maxDeclineSlopeDegrees: number;

  totalDurationSeconds: number;
  totalDurationMinutes: number;
  totalDurationHours: number;

  estimatedTotalEnergyJoules: number;
  estimatedTotalEnergyKJ: number;
  estimatedTotalEnergyKcal: number;

  averageMetabolicPowerWatts: number;
  peakMetabolicPowerWatts: number;
  durationAboveContinuousThresholdMinutes: number;

  estimatedTotalMetabolicOxygenEquivalentLiters: number;
  estimatedTotalMetabolicOxygenEquivalentGrams: number;
  estimatedTotalStructuralLeakageLiters: number;
  estimatedTotalStructuralLeakageGrams: number;
  estimatedTotalOxygenDrawLiters: number;
  estimatedTotalOxygenDrawGrams: number;

  edges: EdgeBioenergeticsResult[];
}
