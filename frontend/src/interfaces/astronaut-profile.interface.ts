export interface AstronautProfile {
  crewMassKg: number;
  suitMassKg: number;
  payloadMassKg: number;
  effectiveMassFactor: number;
  nominalWalkingSpeedMps: number;
  maxWalkingSpeedMps: number;
  minWalkingSpeedMps: number;
  internalWorkFraction: number;
  suitJointWorkNominalWatts: number;
  basalMetabolicRatePerKg: number;
  suitLeakageRateLpm: number;
  usableOxygenGrams: number;
  oxygenReserveFraction: number;
  maxEvaDurationMinutes: number;
  maxContinuousPowerWatts: number;
  peakRedLinePowerWatts: number;
  defaultTerrainImpedance?: number;
}
