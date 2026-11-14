import { describe, expect, it } from 'vitest';
import { formatEvaDuration, getFeasibilityStatusStyle } from './feasibility.ui';
import { currentAstronautProfile } from '../state/app.state';
import type { EvaFeasibilityResult } from '../interfaces/eva-feasibility.interface';

describe('Feasibility & Bioenergetics UI Unit Tests', () => {
  it('should maintain valid astronaut profile defaults', () => {
    expect(currentAstronautProfile.crewMassKg).toBe(80.0);
    expect(currentAstronautProfile.suitMassKg).toBe(120.0);
    expect(currentAstronautProfile.payloadMassKg).toBe(15.0);
    expect(currentAstronautProfile.usableOxygenGrams).toBe(1000.0);
    expect(currentAstronautProfile.oxygenReserveFraction).toBe(0.30);
    expect(currentAstronautProfile.maxEvaDurationMinutes).toBe(480.0);
    expect(currentAstronautProfile.effectiveMassFactor).toBe(0.70);
    expect(currentAstronautProfile.suitLeakageRateLpm).toBe(0.10);
    expect(currentAstronautProfile.maxContinuousPowerWatts).toBe(450.0);
    expect(currentAstronautProfile.peakRedLinePowerWatts).toBe(650.0);
  });

  it('should correctly format EVA durations into human-readable strings', () => {
    expect(formatEvaDuration(0)).toBe('0h 00m');
    expect(formatEvaDuration(5)).toBe('0h 05m');
    expect(formatEvaDuration(59)).toBe('0h 59m');
    expect(formatEvaDuration(60)).toBe('1h 00m');
    expect(formatEvaDuration(65)).toBe('1h 05m');
    expect(formatEvaDuration(135)).toBe('2h 15m');
    expect(formatEvaDuration(480)).toBe('8h 00m');
  });

  it('should resolve correct visual styles and colors for each feasibility status', () => {
    const feasibleStyle = getFeasibilityStatusStyle('FEASIBLE');
    expect(feasibleStyle.border).toBe('var(--good)');
    expect(feasibleStyle.text).toBe('var(--good)');

    const marginalStyle = getFeasibilityStatusStyle('MARGINAL');
    expect(marginalStyle.border).toBe('var(--warning)');
    expect(marginalStyle.text).toBe('var(--warning)');

    const criticalStyle = getFeasibilityStatusStyle('CRITICAL');
    expect(criticalStyle.border).toBe('var(--critical)');
    expect(criticalStyle.text).toBe('var(--critical)');

    const infeasibleStyle = getFeasibilityStatusStyle('INFEASIBLE');
    expect(infeasibleStyle.border).toBe('var(--critical)');
  });

  it('should validate structured EvaFeasibilityResult schema and metrics', () => {
    const assessment: EvaFeasibilityResult = {
      status: 'FEASIBLE',
      isDurationFeasible: true,
      isOxygenFeasible: true,
      isWorkloadFeasible: true,
      pointOfSafeReturnViolated: false,
      outbound: {
        totalHorizontalDistanceMeters: 1200,
        totalTraversalDistance3DMeters: 1205,
        totalElevationGainMeters: 15,
        totalElevationLossMeters: 2,
        maxInclineSlopeDegrees: 4.2,
        maxDeclineSlopeDegrees: 1.1,
        totalDurationSeconds: 1500,
        totalDurationMinutes: 25,
        totalDurationHours: 0.417,
        estimatedTotalEnergyJoules: 512000,
        estimatedTotalEnergyKJ: 512,
        estimatedTotalEnergyKcal: 122.4,
        averageMetabolicPowerWatts: 341.3,
        peakMetabolicPowerWatts: 410.5,
        durationAboveContinuousThresholdMinutes: 0,
        estimatedTotalMetabolicOxygenEquivalentLiters: 25.5,
        estimatedTotalMetabolicOxygenEquivalentGrams: 36.4,
        estimatedTotalStructuralLeakageLiters: 2.5,
        estimatedTotalStructuralLeakageGrams: 3.57,
        estimatedTotalOxygenDrawLiters: 28.0,
        estimatedTotalOxygenDrawGrams: 39.97,
        edges: [],
      },
      returnTraversal: {
        totalHorizontalDistanceMeters: 1200,
        totalTraversalDistance3DMeters: 1205,
        totalElevationGainMeters: 2,
        totalElevationLossMeters: 15,
        maxInclineSlopeDegrees: 1.1,
        maxDeclineSlopeDegrees: 4.2,
        totalDurationSeconds: 1400,
        totalDurationMinutes: 23.33,
        totalDurationHours: 0.389,
        estimatedTotalEnergyJoules: 448000,
        estimatedTotalEnergyKJ: 448,
        estimatedTotalEnergyKcal: 107.1,
        averageMetabolicPowerWatts: 320.0,
        peakMetabolicPowerWatts: 380.0,
        durationAboveContinuousThresholdMinutes: 0,
        estimatedTotalMetabolicOxygenEquivalentLiters: 22.3,
        estimatedTotalMetabolicOxygenEquivalentGrams: 31.9,
        estimatedTotalStructuralLeakageLiters: 2.33,
        estimatedTotalStructuralLeakageGrams: 3.33,
        estimatedTotalOxygenDrawLiters: 24.63,
        estimatedTotalOxygenDrawGrams: 35.23,
        edges: [],
      },
      totalMissionDurationMinutes: 48.33,
      totalMissionDurationHours: 0.806,
      totalMissionEnergyKcal: 229.5,
      totalMissionEnergyKJ: 960,
      totalMissionOxygenDrawGrams: 75.2,
      totalMissionOxygenDrawLiters: 52.63,
      remainingOxygenGrams: 924.8,
      remainingOxygenPercentage: 92.48,
      configuredOxygenReserveGrams: 300.0,
      reasons: ['EVA is feasible within duration, oxygen, and metabolic limits.'],
      warnings: [],
      constraintBreaches: [],
      safeReturnTrace: [
        {
          waypointIndex: 0,
          cumulativeOutboundOxygenGrams: 0,
          remainingOxygenGrams: 1000,
          walkbackOxygenRequiredGrams: 0,
          emergencyReserveGrams: 300,
          marginGrams: 700,
          isViable: true,
        },
      ],
      uncertaintyNotice: 'Bioenergetic estimates derived from Minetti (2002).',
    };

    expect(assessment.status).toBe('FEASIBLE');
    expect(assessment.totalMissionDurationHours).toBeLessThan(8.0);
    expect(assessment.totalMissionOxygenDrawGrams).toBeLessThan(assessment.configuredOxygenReserveGrams + assessment.remainingOxygenGrams);
    expect(assessment.safeReturnTrace.length).toBeGreaterThan(0);
    expect(assessment.safeReturnTrace[0].isViable).toBe(true);
  });
});
