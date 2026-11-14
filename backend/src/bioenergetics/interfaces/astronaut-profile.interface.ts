/**
 * Astronaut, spacesuit, and mission scenario configuration.
 * All uncertain/estimated parameters are exposed as configurable values.
 */
export interface AstronautProfile {
    // Physical Mass Characteristics
    crewMassKg: number;              // Default: 80.0 kg (ESTIMATED: 50th percentile male)
    suitMassKg: number;              // Default: 120.0 kg (ESTIMATED: exploration suit flight mass)
    payloadMassKg: number;           // Default: 15.0 kg (ASSUMED: carried science tools)
    effectiveMassFactor: number;     // Default: 0.70 (ASSUMED: kappa_load for anthropomorphic suit mass)

    // Kinematic Pacing Limits (ASSUMED operational pacing heuristic)
    nominalWalkingSpeedMps: number;  // Default: 1.00 m/s (ESTIMATED: self-selected suited speed)
    maxWalkingSpeedMps: number;      // Default: 1.20 m/s (ASSUMED: conservative pacing cap)
    minWalkingSpeedMps: number;      // Default: 0.30 m/s (ASSUMED: operational crawl clamp)

    // Biomechanical Model Parameters
    internalWorkFraction: number;    // Default: 0.40 (ASSUMED: alpha)
    suitJointWorkNominalWatts: number; // Default: 65.0 W (ESTIMATED: lumped suited increment at 1.0 m/s)
    basalMetabolicRatePerKg: number; // Default: 1.20 W/kg (ESTIMATED: resting baseline)

    // Life-Support Scenario Constraints
    suitLeakageRateLpm: number;      // Default: 0.0 L/min baseline (opt-in scenario assumption; e.g. 0.10 for legacy 100 sccm)
    usableOxygenGrams: number;       // Default: 1000.0 g (ASSUMED: scenario capacity)
    oxygenReserveFraction: number;   // Default: 0.30 (ASSUMED: 30% flight rule reserve)
    maxEvaDurationMinutes: number;    // Default: 480.0 min (ASSUMED / Mission Profile Constraint)
    maxContinuousPowerWatts: number; // Default: 450.0 W (ESTIMATED / advisory: sustained ceiling)
    peakRedLinePowerWatts: number;   // Default: 650.0 W (ESTIMATED / advisory: peak redline)

    // Terrain Simulation Scenario
    defaultTerrainImpedance?: number; // Default: 1.15 (ASSUMED: regolith plains)
}
