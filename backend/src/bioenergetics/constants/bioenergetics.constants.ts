/**
 * RED ROAD 2.0 - Bioenergetics Physical & Biomechanical Constants
 * Calibrated against NASA Technical Reports and Peer-Reviewed Literature.
 * Strict Evidence Classifications per Addendum RR2-PH2A2-1-CLOSURE.
 */

// Gravity Reference Values
export const MARS_SURFACE_GRAVITY = 3.710; // m/s^2 (MEASURED / reference value: Folkner 1997, Smith 2001)
export const EARTH_STANDARD_GRAVITY = 9.80665; // m/s^2 (DEFINED reference: ISO 80000-3)
export const GRAVITY_RATIO = MARS_SURFACE_GRAVITY / EARTH_STANDARD_GRAVITY; // ~0.3783147

// Minetti et al. (2002) 5th-Order Cost of Transport Polynomial Coefficients
// C_w(i) = a5*i^5 + a4*i^4 + a3*i^3 + a2*i^2 + a1*i + a0 [J/(kg*m)]
// MEASURED empirical source model on terrestrial treadmill
export const MINETTI_A0 = 2.5;
export const MINETTI_A1 = 19.6;
export const MINETTI_A2 = 51.9;
export const MINETTI_A3 = -76.8;
export const MINETTI_A4 = -58.7;
export const MINETTI_A5 = 280.5;

// Operational Slope Clamp Bounds (Chosen conservative domain, not an intrinsic biological singularity)
export const OPERATIONAL_SLOPE_CLAMP_MIN = -0.40; // -40% grade (-21.8 deg)
export const OPERATIONAL_SLOPE_CLAMP_MAX = 0.40;  // +40% grade (+21.8 deg)

// Adaptive Walking Speed Defaults (Tobler 1993 pacing heuristic adapted for simulation)
export const SPEED_OPTIMAL_SLOPE = -0.05; // -5% grade where walking is mechanically most efficient
export const SPEED_DECAY_COEFFICIENT = 3.5;
export const DEFAULT_NOMINAL_SPEED_MPS = 1.00; // 3.6 km/h
export const DEFAULT_MIN_SPEED_MPS = 0.30;     // 1.08 km/h operational crawl clamp
export const DEFAULT_MAX_SPEED_MPS = 1.20;     // 4.32 km/h conservative pacing cap

// Bioenergetic Model Mechanics
export const DEFAULT_INTERNAL_WORK_FRACTION = 0.40; // alpha: swing-limb kinetic work fraction (ASSUMED)
export const DEFAULT_EFFECTIVE_MASS_FACTOR = 0.70;  // kappa_load: distributed anthropomorphic suit mass factor (ASSUMED)
export const DEFAULT_SUIT_JOINT_POWER_NOMINAL = 65.0; // Watts: lumped suited increment at 1.0 m/s (ESTIMATED)
export const DEFAULT_BASAL_METABOLIC_RATE_PER_KG = 1.20; // W/kg: resting metabolic baseline (ESTIMATED: NASA HIDH)

// Indirect Calorimetry and Oxygen Conversions
// Weir (1949): 20.10 kJ/L at STPD for RQ = 0.85 -> 20,100 J / 60 s = 335.0 W*min/L
export const OXYGEN_CALORIC_FACTOR = 335.0; // W*min/L STPD (DERIVED / conditional on steady-state aerobic)
export const OXYGEN_DENSITY_STPD = 1.429;   // g/L STPD (0 deg C, 101.325 kPa) (MEASURED / physical constant)
export const JOULES_PER_KCAL = 4184.0;      // J/kcal (DEFINED)

// Spacesuit Structural Leakage
// Legacy Shuttle/ISS EMU spec limit (100 sccm = 0.10 L/min)
// UNVERIFIED for current suit applicability - explicitly configurable
export const DEFAULT_SUIT_LEAKAGE_LPM = 0.10; // 100 sccm

// Life Support Scenario Defaults
export const DEFAULT_USABLE_OXYGEN_GRAMS = 1000.0; // 1.0 kg usable O2 (ASSUMED)
export const DEFAULT_OXYGEN_RESERVE_FRACTION = 0.30; // 30% emergency reserve (ASSUMED)
export const DEFAULT_MAX_EVA_DURATION_MINUTES = 480.0; // 8.0 hours (ASSUMED / Mission Profile Constraint)
export const DEFAULT_MAX_CONTINUOUS_POWER_WATTS = 450.0; // High sustained workload ceiling (ESTIMATED / advisory)
export const DEFAULT_PEAK_REDLINE_POWER_WATTS = 650.0; // 15-min emergency peak ceiling (ESTIMATED / advisory)

// Geomorphic Terrain Impedance Scenarios (ASSUMED scenario multipliers)
export const TERRAIN_IMPEDANCE = {
    BEDROCK: 1.05,            // Hard basaltic pavement (e.g. Ma'az formation)
    CONSOLIDATED_REGOLITH: 1.15, // Compacted dust and pebbles (crater plains baseline)
    DELTA_SEDIMENTS: 1.20,    // Layered mudstone/sandstone
    BOULDER_RUBBLE: 1.40,     // Belva ejecta / rocky debris
    AEOLIAN_SAND: 1.80,       // Seítah active sand ripples / dunes
} as const;

export const DEFAULT_TERRAIN_IMPEDANCE = TERRAIN_IMPEDANCE.CONSOLIDATED_REGOLITH;
