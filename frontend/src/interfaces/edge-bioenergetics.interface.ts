export interface EdgeBioenergeticsResult {
  horizontalDistanceMeters: number;
  elevationDeltaMeters: number;
  slopeGradient: number;
  clampedSlopeGradient: number;
  slopeAngleDegrees: number;
  slopeAngleRadians: number;
  traversalDistance3DMeters: number;
  walkingSpeedMps: number;
  traversalDurationSeconds: number;

  terrestrialCostOfTransportJoulePerKgM: number;
  martianCostOfTransportJoulePerKgM: number;
  locomotionPowerWatts: number;
  suitJointPowerWatts: number;
  basalPowerWatts: number;
  grossMetabolicPowerWatts: number;

  estimatedEnergyJoules: number;
  estimatedEnergyKJ: number;
  estimatedEnergyKcal: number;

  oxygenUptakeRateLpm: number;
  estimatedMetabolicOxygenEquivalentLiters: number;
  estimatedMetabolicOxygenEquivalentGrams: number;
  estimatedStructuralLeakageLiters: number;
  estimatedStructuralLeakageGrams: number;
  estimatedTotalOxygenDrawLiters: number;
  estimatedTotalOxygenDrawGrams: number;
}
