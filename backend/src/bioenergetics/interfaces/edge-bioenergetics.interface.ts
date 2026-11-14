/**
 * Detailed bioenergetic and kinematic telemetry for a single route edge.
 * Strict estimation terminology enforced per scientific guidelines.
 */
export interface EdgeBioenergeticsResult {
    // Spatial & Kinematic Telemetry
    horizontalDistanceMeters: number;
    elevationDeltaMeters: number;
    slopeGradient: number;           // tan(theta)
    clampedSlopeGradient: number;    // Clamped to [-0.40, +0.40]
    slopeAngleDegrees: number;
    slopeAngleRadians: number;
    traversalDistance3DMeters: number;
    walkingSpeedMps: number;
    traversalDurationSeconds: number;

    // Biomechanical Work & Power Breakdown
    terrestrialCostOfTransportJoulePerKgM: number;
    martianCostOfTransportJoulePerKgM: number;
    locomotionPowerWatts: number;
    suitJointPowerWatts: number;
    basalPowerWatts: number;
    grossMetabolicPowerWatts: number;

    // Energy Expenditure (Estimated)
    estimatedEnergyJoules: number;
    estimatedEnergyKJ: number;
    estimatedEnergyKcal: number;

    // Oxygen Equivalent Consumed (Estimated)
    oxygenUptakeRateLpm: number;                     // STPD (0 C, 101.325 kPa)
    estimatedMetabolicOxygenEquivalentLiters: number;
    estimatedMetabolicOxygenEquivalentGrams: number;
    estimatedStructuralLeakageLiters: number;
    estimatedStructuralLeakageGrams: number;
    estimatedTotalOxygenDrawLiters: number;
    estimatedTotalOxygenDrawGrams: number;
}
