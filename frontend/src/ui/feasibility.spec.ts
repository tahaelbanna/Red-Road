import { describe, expect, it } from 'vitest';
import {
  formatEvaDuration,
  getFeasibilityStatusStyle,
  validateSuitLeakageInput,
  applySuitLeakageValidation,
} from './feasibility.ui';
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
    expect(currentAstronautProfile.suitLeakageRateLpm).toBe(0.0);
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
      totalMissionMetabolicOxygenEquivalentGrams: 68.3,
      totalMissionStructuralLeakageGrams: 6.9,
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
    expect(assessment.totalMissionMetabolicOxygenEquivalentGrams).toBe(68.3);
    expect(assessment.totalMissionStructuralLeakageGrams).toBe(6.9);
    expect(assessment.totalMissionOxygenDrawGrams).toBeCloseTo(
      assessment.totalMissionMetabolicOxygenEquivalentGrams + assessment.totalMissionStructuralLeakageGrams,
      1,
    );
    expect(assessment.totalMissionOxygenDrawGrams).toBeLessThan(assessment.configuredOxygenReserveGrams + assessment.remainingOxygenGrams);
    expect(assessment.safeReturnTrace.length).toBeGreaterThan(0);
    expect(assessment.safeReturnTrace[0].isViable).toBe(true);
  });

  it('should support opt-in suit leakage configuration in app state', () => {
    // Default baseline is 0.0 (no leakage assumed)
    expect(currentAstronautProfile.suitLeakageRateLpm).toBe(0.0);

    // Can be opted into e.g. 0.10 L/min (100 sccm)
    currentAstronautProfile.suitLeakageRateLpm = 0.10;
    expect(currentAstronautProfile.suitLeakageRateLpm).toBe(0.10);

    // Reset back to baseline
    currentAstronautProfile.suitLeakageRateLpm = 0.0;
    expect(currentAstronautProfile.suitLeakageRateLpm).toBe(0.0);
  });

  describe('Suit Leakage Validation & Error Handling Regression', () => {
    it('should validate suit leakage values strictly per specification table', () => {
      // 1. -0.05 -> Rejected
      const r1 = validateSuitLeakageInput('-0.05');
      expect(r1.valid).toBe(false);
      expect(r1.message).toContain('cannot be negative');

      // 2. -1 -> Rejected
      const r2 = validateSuitLeakageInput('-1');
      expect(r2.valid).toBe(false);
      expect(r2.message).toContain('cannot be negative');

      // 3. 0 -> Accepted
      const r3 = validateSuitLeakageInput('0');
      expect(r3.valid).toBe(true);
      expect(r3.value).toBe(0);

      // 4. 0.10 -> Accepted
      const r4 = validateSuitLeakageInput('0.10');
      expect(r4.valid).toBe(true);
      expect(r4.value).toBe(0.10);

      // 5. 1.0 -> Accepted
      const r5 = validateSuitLeakageInput('1.0');
      expect(r5.valid).toBe(true);
      expect(r5.value).toBe(1.0);

      // 6. 1.01 -> Rejected
      const r6 = validateSuitLeakageInput('1.01');
      expect(r6.valid).toBe(false);
      expect(r6.message).toContain('cannot exceed 1.00');

      // 7. NaN / Infinity -> Rejected
      const rNan = validateSuitLeakageInput('NaN');
      expect(rNan.valid).toBe(false);
      expect(rNan.message).toContain('must be a finite numeric value');

      const rInf = validateSuitLeakageInput('Infinity');
      expect(rInf.valid).toBe(false);
      expect(rInf.message).toContain('must be a finite numeric value');

      const rNegInf = validateSuitLeakageInput('-Infinity');
      expect(rNegInf.valid).toBe(false);
      expect(rNegInf.message).toContain('must be a finite numeric value');

      // 8. Empty input -> Explicitly handled, no accidental state mutation
      const rEmpty = validateSuitLeakageInput('');
      expect(rEmpty.valid).toBe(false);
      expect(rEmpty.message).toContain('is required');

      const rSpaces = validateSuitLeakageInput('   ');
      expect(rSpaces.valid).toBe(false);
      expect(rSpaces.message).toContain('is required');
    });

    it('should display visible error, preserve state, and suppress recalculation on invalid inputs', () => {
      let stateValue = currentAstronautProfile.suitLeakageRateLpm; // Starts at 0.0
      let recalcCount = 0;

      const onValidChange = (v: number) => {
        stateValue = v;
      };
      const onRecalculate = () => {
        recalcCount++;
      };

      const mockInput = {
        value: '-0.05',
        style: { borderColor: '', background: '' } as Record<string, string>,
      };
      const mockErrorEl = {
        textContent: '',
        style: { display: 'none' } as Record<string, string>,
      };

      // Input: -0.05 -> Rejected, visible error, state unchanged, no recalculation
      const resNeg = applySuitLeakageValidation(
        mockInput.value,
        mockInput as any,
        mockErrorEl as any,
        onValidChange,
        onRecalculate,
      );
      expect(resNeg).toBe(false);
      expect(mockErrorEl.style.display).toBe('block');
      expect(mockErrorEl.textContent).toContain('cannot be negative');
      expect(mockInput.style.borderColor).toBe('var(--critical)');
      expect(stateValue).toBe(0.0);
      expect(recalcCount).toBe(0);

      // Input: -1 -> Rejected, visible error, state unchanged
      mockInput.value = '-1';
      const resNeg1 = applySuitLeakageValidation(
        mockInput.value,
        mockInput as any,
        mockErrorEl as any,
        onValidChange,
        onRecalculate,
      );
      expect(resNeg1).toBe(false);
      expect(mockErrorEl.style.display).toBe('block');
      expect(mockErrorEl.textContent).toContain('cannot be negative');
      expect(stateValue).toBe(0.0);
      expect(recalcCount).toBe(0);

      // Input: 1.01 -> Rejected, visible error, state unchanged
      mockInput.value = '1.01';
      const resHigh = applySuitLeakageValidation(
        mockInput.value,
        mockInput as any,
        mockErrorEl as any,
        onValidChange,
        onRecalculate,
      );
      expect(resHigh).toBe(false);
      expect(mockErrorEl.style.display).toBe('block');
      expect(mockErrorEl.textContent).toContain('cannot exceed 1.00');
      expect(stateValue).toBe(0.0);
      expect(recalcCount).toBe(0);

      // Input: NaN -> Rejected, state unchanged
      mockInput.value = 'NaN';
      const resNan = applySuitLeakageValidation(
        mockInput.value,
        mockInput as any,
        mockErrorEl as any,
        onValidChange,
        onRecalculate,
      );
      expect(resNan).toBe(false);
      expect(stateValue).toBe(0.0);
      expect(recalcCount).toBe(0);

      // Input: Infinity -> Rejected, state unchanged
      mockInput.value = 'Infinity';
      const resInf = applySuitLeakageValidation(
        mockInput.value,
        mockInput as any,
        mockErrorEl as any,
        onValidChange,
        onRecalculate,
      );
      expect(resInf).toBe(false);
      expect(stateValue).toBe(0.0);
      expect(recalcCount).toBe(0);

      // Input: Empty -> Rejected, state unchanged
      mockInput.value = '';
      const resEmpty = applySuitLeakageValidation(
        mockInput.value,
        mockInput as any,
        mockErrorEl as any,
        onValidChange,
        onRecalculate,
      );
      expect(resEmpty).toBe(false);
      expect(mockErrorEl.textContent).toContain('is required');
      expect(stateValue).toBe(0.0);
      expect(recalcCount).toBe(0);

      // Valid value 0.10 -> Accepted, clears error, updates state, triggers recalculation
      mockInput.value = '0.10';
      const resValid = applySuitLeakageValidation(
        mockInput.value,
        mockInput as any,
        mockErrorEl as any,
        onValidChange,
        onRecalculate,
      );
      expect(resValid).toBe(true);
      expect(mockErrorEl.style.display).toBe('none');
      expect(mockErrorEl.textContent).toBe('');
      expect(mockInput.style.borderColor).toBe('var(--line)');
      expect(stateValue).toBe(0.10);
      expect(recalcCount).toBe(1);

      // Valid boundary 0.00 -> Accepted, updates state, triggers recalculation
      mockInput.value = '0';
      const resZero = applySuitLeakageValidation(
        mockInput.value,
        mockInput as any,
        mockErrorEl as any,
        onValidChange,
        onRecalculate,
      );
      expect(resZero).toBe(true);
      expect(mockErrorEl.style.display).toBe('none');
      expect(stateValue).toBe(0.0);
      expect(recalcCount).toBe(2);

      // Valid boundary 1.0 -> Accepted, updates state, triggers recalculation
      mockInput.value = '1.0';
      const resOne = applySuitLeakageValidation(
        mockInput.value,
        mockInput as any,
        mockErrorEl as any,
        onValidChange,
        onRecalculate,
      );
      expect(resOne).toBe(true);
      expect(mockErrorEl.style.display).toBe('none');
      expect(stateValue).toBe(1.0);
      expect(recalcCount).toBe(3);
    });
  });
});
