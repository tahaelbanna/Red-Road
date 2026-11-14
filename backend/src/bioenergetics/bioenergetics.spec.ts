import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BioenergeticsService } from './bioenergetics.service.js';
import { BioenergeticsController } from './bioenergetics.controller.js';
import { CalculateEdgeBioenergeticsUseCase } from './use-cases/calculate-edge-bioenergetics.use-case.js';
import { CalculateRouteBioenergeticsUseCase } from './use-cases/calculate-route-bioenergetics.use-case.js';
import { EvaluateSafeReturnUseCase } from './use-cases/evaluate-safe-return.use-case.js';
import { EvaluateEvaFeasibilityUseCase } from './use-cases/evaluate-eva-feasibility.use-case.js';
import { TerrainService } from '../terrain/terrain.service.js';
import { DEFAULT_ASTRONAUT_PROFILE } from './constants/default-profile.constants.js';

describe('Bioenergetics Domain Engine', () => {
    let service: BioenergeticsService;
    let edgeUseCase: CalculateEdgeBioenergeticsUseCase;

    // Lightweight mock for TerrainService
    const mockTerrainService = {
        getRegion: (_name: string) => ({
            name: 'jezero_crater',
            cell_size_meters: 100.0,
            grid_rows: 10,
            grid_cols: 10,
        }),
        getCell: (_name: string, row: number, _col: number) => {
            // Slope scenario: elevation rises by 10m per row
            return {
                row,
                col: _col,
                elevation: 100 + row * 10,
                slope: 5.7,
                hazard: 0.1,
            };
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BioenergeticsService,
                CalculateEdgeBioenergeticsUseCase,
                CalculateRouteBioenergeticsUseCase,
                EvaluateSafeReturnUseCase,
                EvaluateEvaFeasibilityUseCase,
                { provide: TerrainService, useValue: mockTerrainService },
            ],
        }).compile();

        service = module.get<BioenergeticsService>(BioenergeticsService);
        edgeUseCase = module.get<CalculateEdgeBioenergeticsUseCase>(CalculateEdgeBioenergeticsUseCase);
    });

    describe('Level 1: Mathematical Unit Tests', () => {
        it('should evaluate the Minetti polynomial accurately at benchmark gradients', () => {
            const p = DEFAULT_ASTRONAUT_PROFILE;

            // Level terrain (i = 0)
            const levelEdge = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: 0 }, p);
            expect(levelEdge.terrestrialCostOfTransportJoulePerKgM).toBeCloseTo(2.50000, 4);
            expect(levelEdge.martianCostOfTransportJoulePerKgM).toBeCloseTo(1.56747, 4);

            // Optimal slope (i = -0.05)
            const down5Edge = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: -5 }, p);
            expect(down5Edge.terrestrialCostOfTransportJoulePerKgM).toBeCloseTo(1.65890, 3);
            expect(down5Edge.martianCostOfTransportJoulePerKgM).toBeCloseTo(1.24927, 3);

            // Steeper descent (i = -0.10)
            const down10Edge = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: -10 }, p);
            expect(down10Edge.terrestrialCostOfTransportJoulePerKgM).toBeCloseTo(1.12712, 3);
            expect(down10Edge.martianCostOfTransportJoulePerKgM).toBeCloseTo(1.04809, 3);

            // Polynomial minimum (i = -0.1525)
            const minEdge = edgeUseCase.execute({ horizontalDistanceMeters: 10000, elevationDeltaMeters: -1525 }, p);
            expect(minEdge.terrestrialCostOfTransportJoulePerKgM).toBeCloseTo(0.9355, 3);
            expect(minEdge.martianCostOfTransportJoulePerKgM).toBeCloseTo(0.9756, 3);
        });

        it('should calculate gross metabolic power for level regolith walk matching benchmark 475.55 W', () => {
            const p = DEFAULT_ASTRONAUT_PROFILE;
            // i = 0, v = 1.0 m/s, eta = 1.15
            const res = edgeUseCase.execute(
                { horizontalDistanceMeters: 100, elevationDeltaMeters: 0, terrainImpedance: 1.15 },
                p,
            );
            expect(res.walkingSpeedMps).toBeCloseTo(1.000, 3);
            expect(res.locomotionPowerWatts).toBeCloseTo(314.55, 1);
            expect(res.suitJointPowerWatts).toBeCloseTo(65.00, 1);
            expect(res.basalPowerWatts).toBeCloseTo(96.00, 1);
            expect(res.grossMetabolicPowerWatts).toBeCloseTo(475.55, 1);
        });

        it('should calculate gross metabolic power for level bedrock walk matching benchmark 434.52 W', () => {
            const p = DEFAULT_ASTRONAUT_PROFILE;
            // i = 0, v = 1.0 m/s, eta = 1.00
            const res = edgeUseCase.execute(
                { horizontalDistanceMeters: 100, elevationDeltaMeters: 0, terrainImpedance: 1.00 },
                p,
            );
            expect(res.locomotionPowerWatts).toBeCloseTo(273.52, 1);
            expect(res.suitJointPowerWatts).toBeCloseTo(65.00, 1);
            expect(res.basalPowerWatts).toBeCloseTo(96.00, 1);
            expect(res.grossMetabolicPowerWatts).toBeCloseTo(434.52, 1);
        });

        it('should yield exactly basal standing power 96.00 W during stationary pause', () => {
            const p = DEFAULT_ASTRONAUT_PROFILE;
            const res = edgeUseCase.execute(
                {
                    horizontalDistanceMeters: 0,
                    elevationDeltaMeters: 0,
                    isStationary: true,
                    stationaryDurationSeconds: 1800,
                    terrainImpedance: 1.80, // Heavy terrain must NOT elevate basal rate
                },
                p,
            );
            expect(res.walkingSpeedMps).toBe(0);
            expect(res.locomotionPowerWatts).toBe(0);
            expect(res.suitJointPowerWatts).toBe(0);
            expect(res.basalPowerWatts).toBe(96.0);
            expect(res.grossMetabolicPowerWatts).toBe(96.0);
            expect(res.traversalDurationSeconds).toBe(1800);
            // Energy: 96 W * 1800 s = 172,800 Joules = 172.8 kJ
            expect(res.estimatedEnergyJoules).toBe(172800);
            expect(res.estimatedEnergyKJ).toBe(172.8);
        });

        it('should evaluate caloric oxygen equivalence exactly (335 W -> 1.000 L/min)', () => {
            const p = { ...DEFAULT_ASTRONAUT_PROFILE, basalMetabolicRatePerKg: 335.0 / 80.0 };
            const res = edgeUseCase.execute(
                {
                    horizontalDistanceMeters: 0,
                    elevationDeltaMeters: 0,
                    isStationary: true,
                    stationaryDurationSeconds: 60,
                },
                p,
            );
            expect(res.grossMetabolicPowerWatts).toBeCloseTo(335.0, 3);
            expect(res.oxygenUptakeRateLpm).toBeCloseTo(1.000, 3);
            expect(res.estimatedMetabolicOxygenEquivalentLiters).toBeCloseTo(1.000, 3);
            expect(res.estimatedMetabolicOxygenEquivalentGrams).toBeCloseTo(1.429, 3);
        });

        it('should calculate 60-min oxygen tank draw including structural leakage (66.0 L / 94.31 g)', () => {
            const p = {
                ...DEFAULT_ASTRONAUT_PROFILE,
                basalMetabolicRatePerKg: 335.0 / 80.0,
                suitLeakageRateLpm: 0.10,
            };
            const res = edgeUseCase.execute(
                {
                    horizontalDistanceMeters: 0,
                    elevationDeltaMeters: 0,
                    isStationary: true,
                    stationaryDurationSeconds: 3600, // 60 minutes
                },
                p,
            );
            expect(res.estimatedMetabolicOxygenEquivalentLiters).toBeCloseTo(60.0, 2);
            expect(res.estimatedStructuralLeakageLiters).toBeCloseTo(6.0, 2);
            expect(res.estimatedTotalOxygenDrawLiters).toBeCloseTo(66.0, 2);
            expect(res.estimatedTotalOxygenDrawGrams).toBeCloseTo(66.0 * 1.429, 2);
        });
    });

    describe('Level 2: Dimensional Analysis & Units', () => {
        it('should verify dimensional consistency across power, energy, and mass flow', () => {
            const p = DEFAULT_ASTRONAUT_PROFILE;
            const res = edgeUseCase.execute(
                { horizontalDistanceMeters: 100, elevationDeltaMeters: 10, terrainImpedance: 1.15 },
                p,
            );

            // [J/s] * [s] = [J]
            expect(res.estimatedEnergyJoules).toBeCloseTo(
                res.grossMetabolicPowerWatts * res.traversalDurationSeconds,
                4,
            );
            // [J] / 1000 = [kJ]
            expect(res.estimatedEnergyKJ).toBeCloseTo(res.estimatedEnergyJoules / 1000.0, 4);
            // [J] / 4184 = [kcal]
            expect(res.estimatedEnergyKcal).toBeCloseTo(res.estimatedEnergyJoules / 4184.0, 4);
            // [L] * [g/L] = [g]
            expect(res.estimatedTotalOxygenDrawGrams).toBeCloseTo(
                res.estimatedTotalOxygenDrawLiters * 1.429,
                4,
            );
        });
    });

    describe('Level 3: Physical Plausibility Checks', () => {
        it('should exhibit the downhill energy dip where -5% slope costs less than level ground', () => {
            const p = DEFAULT_ASTRONAUT_PROFILE;
            const level = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: 0 }, p);
            const down5 = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: -5 }, p);

            // Downhill at -5% slope has higher speed (~1.19 m/s) but lower cost of transport
            expect(down5.martianCostOfTransportJoulePerKgM).toBeLessThan(
                level.martianCostOfTransportJoulePerKgM,
            );
            expect(down5.locomotionPowerWatts / down5.walkingSpeedMps).toBeLessThan(
                level.locomotionPowerWatts / level.walkingSpeedMps,
            );
        });

        it('should show eccentric muscular braking rise where steep slope costs more than minimum', () => {
            const p = DEFAULT_ASTRONAUT_PROFILE;
            const minEdge = edgeUseCase.execute({ horizontalDistanceMeters: 10000, elevationDeltaMeters: -1525 }, p); // i = -0.1525 (minimum)
            const down25 = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: -25 }, p);      // i = -0.25
            const down35 = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: -35 }, p);      // i = -0.35
            const down5 = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: -5 }, p);        // i = -0.05

            // As downhill gradient steepens past -15.25%, eccentric braking causes cost of transport to rise
            expect(down25.martianCostOfTransportJoulePerKgM).toBeGreaterThan(
                minEdge.martianCostOfTransportJoulePerKgM,
            );
            expect(down35.martianCostOfTransportJoulePerKgM).toBeGreaterThan(
                down5.martianCostOfTransportJoulePerKgM,
            );
        });

        it('should monotonically scale locomotion power with terrain impedance without affecting resting basal rate', () => {
            const p = DEFAULT_ASTRONAUT_PROFILE;
            const bedrock = edgeUseCase.execute(
                { horizontalDistanceMeters: 100, elevationDeltaMeters: 0, terrainImpedance: 1.05 },
                p,
            );
            const regolith = edgeUseCase.execute(
                { horizontalDistanceMeters: 100, elevationDeltaMeters: 0, terrainImpedance: 1.15 },
                p,
            );
            const sand = edgeUseCase.execute(
                { horizontalDistanceMeters: 100, elevationDeltaMeters: 0, terrainImpedance: 1.80 },
                p,
            );

            expect(sand.locomotionPowerWatts).toBeGreaterThan(regolith.locomotionPowerWatts);
            expect(regolith.locomotionPowerWatts).toBeGreaterThan(bedrock.locomotionPowerWatts);

            // Basal power must be identical across all surfaces
            expect(bedrock.basalPowerWatts).toBe(96.0);
            expect(regolith.basalPowerWatts).toBe(96.0);
            expect(sand.basalPowerWatts).toBe(96.0);
        });

        it('should safely clamp extreme slope gradients at +/- 0.40 without throwing or generating NaN', () => {
            const p = DEFAULT_ASTRONAUT_PROFILE;
            const extremeAscent = edgeUseCase.execute(
                { horizontalDistanceMeters: 100, elevationDeltaMeters: 80 }, // i = 0.80
                p,
            );
            expect(extremeAscent.clampedSlopeGradient).toBe(0.40);
            expect(Number.isFinite(extremeAscent.grossMetabolicPowerWatts)).toBe(true);
            expect(Number.isNaN(extremeAscent.grossMetabolicPowerWatts)).toBe(false);

            const extremeDescent = edgeUseCase.execute(
                { horizontalDistanceMeters: 100, elevationDeltaMeters: -80 }, // i = -0.80
                p,
            );
            expect(extremeDescent.clampedSlopeGradient).toBe(-0.40);
            expect(Number.isFinite(extremeDescent.grossMetabolicPowerWatts)).toBe(true);
            expect(Number.isNaN(extremeDescent.grossMetabolicPowerWatts)).toBe(false);
        });
    });

    describe('Level 4: Edge Cases & Invalid Inputs', () => {
        it('should handle zero-distance / single-point path gracefully', () => {
            const singlePoint = [{ row: 0, col: 0 }];
            const summary = service.calculateRoute('jezero_crater', singlePoint);
            expect(summary.edges.length).toBe(0);
            expect(summary.totalHorizontalDistanceMeters).toBe(0);
            expect(summary.totalDurationSeconds).toBe(0);
            expect(summary.estimatedTotalEnergyJoules).toBe(0);
            expect(summary.estimatedTotalOxygenDrawGrams).toBe(0);
        });

        it('should trigger duration constraint breach when traversal duration exceeds 480 minutes', () => {
            const path = [
                { row: 0, col: 0 },
                { row: 1, col: 0 },
            ];

            // Set stationary time to 9.0 hours (exceeding 8.0h limit)
            const feasibility = service.evaluateEvaFeasibility(
                'jezero_crater',
                path,
                undefined,
                9.0,
            );

            expect(feasibility.status).toBe('CRITICAL');
            expect(feasibility.isDurationFeasible).toBe(false);
            expect(
                feasibility.constraintBreaches.some(b => b.includes('EXCEEDS_CONFIGURED_EVA_DURATION')),
            ).toBe(true);
        });

        it('should reject invalid empty path arrays at the controller level', () => {
            const controller = new BioenergeticsController(service);

            expect(() => controller.calculateRouteBioenergetics({ region: 'jezero_crater', path: [] })).toThrow();
            expect(() => controller.assessEvaFeasibility({ region: 'jezero_crater', path: [] })).toThrow();
        });

        it('should return authoritative default profile via controller', () => {
            const controller = new BioenergeticsController(service);

            const profile = controller.getDefaultProfile();
            expect(profile.crewMassKg).toBe(80.0);
            expect(profile.suitMassKg).toBe(120.0);
            expect(profile.payloadMassKg).toBe(15.0);
            expect(profile.usableOxygenGrams).toBe(1000.0);
            expect(profile.oxygenReserveFraction).toBe(0.30);
            expect(profile.maxEvaDurationMinutes).toBe(480.0);
            expect(profile.suitLeakageRateLpm).toBe(0.0);
        });
    });

    describe('Level 5: Sensitivity Analysis Bounds', () => {
        it('should reflect sensitivity of internal work fraction alpha within documented +/-6.6% range', () => {
            const pNom = DEFAULT_ASTRONAUT_PROFILE;
            const pLowAlpha = { ...pNom, internalWorkFraction: 0.30 };
            const pHighAlpha = { ...pNom, internalWorkFraction: 0.50 };

            const nom = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: 0, terrainImpedance: 1.15 }, pNom);
            const low = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: 0, terrainImpedance: 1.15 }, pLowAlpha);
            const high = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: 0, terrainImpedance: 1.15 }, pHighAlpha);

            expect(nom.grossMetabolicPowerWatts).toBeCloseTo(475.55, 1);
            expect(low.grossMetabolicPowerWatts).toBeCloseTo(444.36, 1);
            expect(high.grossMetabolicPowerWatts).toBeCloseTo(506.74, 1);
        });

        it('should reflect sensitivity of effective mass factor kappa_load within documented range', () => {
            const pNom = DEFAULT_ASTRONAUT_PROFILE;
            const pLowKappa = { ...pNom, effectiveMassFactor: 0.50 };
            const pHighKappa = { ...pNom, effectiveMassFactor: 1.00 };

            const nom = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: 0, terrainImpedance: 1.15 }, pNom);
            const low = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: 0, terrainImpedance: 1.15 }, pLowKappa);
            const high = edgeUseCase.execute({ horizontalDistanceMeters: 100, elevationDeltaMeters: 0, terrainImpedance: 1.15 }, pHighKappa);

            expect(low.grossMetabolicPowerWatts).toBeCloseTo(426.88, 1);
            expect(nom.grossMetabolicPowerWatts).toBeCloseTo(475.55, 1);
            expect(high.grossMetabolicPowerWatts).toBeCloseTo(548.56, 1);
        });
    });

    describe('Integration & EVA Feasibility Evaluation', () => {
        it('should correctly evaluate outbound route bioenergetics', () => {
            const path = [
                { row: 0, col: 0 },
                { row: 1, col: 0 },
                { row: 2, col: 0 },
                { row: 3, col: 0 },
            ];

            const summary = service.calculateRoute('jezero_crater', path);
            expect(summary.edges.length).toBe(3);
            expect(summary.totalHorizontalDistanceMeters).toBe(300);
            expect(summary.totalDurationMinutes).toBeGreaterThan(0);
            expect(summary.estimatedTotalOxygenDrawGrams).toBeGreaterThan(0);
        });

        it('should demonstrate directional asymmetry between outbound and return journeys', () => {
            // Path ascends 30m outbound (from row 0 to 3)
            const path = [
                { row: 0, col: 0 },
                { row: 1, col: 0 },
                { row: 2, col: 0 },
                { row: 3, col: 0 },
            ];

            const outbound = service.calculateRoute('jezero_crater', path, undefined, false);
            const returnTrav = service.calculateRoute('jezero_crater', path, undefined, true);

            // Outbound is climbing (+30m); return is descending (-30m)
            expect(outbound.totalElevationGainMeters).toBe(30);
            expect(returnTrav.totalElevationLossMeters).toBe(30);

            // Climbing uphill requires higher average metabolic power than descending downhill
            expect(outbound.averageMetabolicPowerWatts).toBeGreaterThan(
                returnTrav.averageMetabolicPowerWatts,
            );
        });

        it('should classify a feasible short mission as FEASIBLE with positive margins', () => {
            const shortPath = [
                { row: 0, col: 0 },
                { row: 1, col: 0 },
            ];

            const feasibility = service.evaluateEvaFeasibility('jezero_crater', shortPath);
            expect(feasibility.status).toBe('FEASIBLE');
            expect(feasibility.isDurationFeasible).toBe(true);
            expect(feasibility.isOxygenFeasible).toBe(true);
            expect(feasibility.pointOfSafeReturnViolated).toBe(false);
            expect(feasibility.constraintBreaches.length).toBe(0);
        });

        it('should trigger CRITICAL and flag Point of Safe Return violation when oxygen capacity is too small', () => {
            const path = [
                { row: 0, col: 0 },
                { row: 1, col: 0 },
                { row: 2, col: 0 },
                { row: 3, col: 0 },
            ];

            // Constrain usable oxygen to only 5.0 grams (severely insufficient)
            const constrainedProfile = {
                ...DEFAULT_ASTRONAUT_PROFILE,
                usableOxygenGrams: 5.0,
            };

            const feasibility = service.evaluateEvaFeasibility(
                'jezero_crater',
                path,
                constrainedProfile,
            );

            expect(feasibility.status).toBe('CRITICAL');
            expect(feasibility.isOxygenFeasible).toBe(false);
            expect(feasibility.pointOfSafeReturnViolated).toBe(true);
            expect(feasibility.constraintBreaches.some(b => b.includes('EXCEEDS_CONFIGURED_PLSS_OXYGEN_BUDGET'))).toBe(true);
        });
    });

    describe('Oxygen Accounting & Leakage Separation Regression', () => {
        const path = [
            { row: 0, col: 0 },
            { row: 1, col: 0 },
            { row: 2, col: 0 },
        ];

        it('Test A (Zero-Leakage Baseline): default profile produces zero leakage and total draw equals metabolic equivalent', () => {
            const defaultProfile = service.getDefaultProfile();
            expect(defaultProfile.suitLeakageRateLpm).toBe(0.0);

            // Single edge evaluation
            const edge = edgeUseCase.execute(
                { horizontalDistanceMeters: 100, elevationDeltaMeters: 0 },
                defaultProfile,
            );
            expect(edge.estimatedStructuralLeakageLiters).toBe(0);
            expect(edge.estimatedStructuralLeakageGrams).toBe(0);
            expect(edge.estimatedTotalOxygenDrawGrams).toBeCloseTo(edge.estimatedMetabolicOxygenEquivalentGrams, 6);

            // EVA feasibility evaluation
            const feasibility = service.evaluateEvaFeasibility('jezero_crater', path, defaultProfile, 1.0);
            expect(feasibility.totalMissionStructuralLeakageGrams).toBe(0);
            expect(feasibility.totalMissionOxygenDrawGrams).toBeCloseTo(feasibility.totalMissionMetabolicOxygenEquivalentGrams, 4);
        });

        it('Test B (Explicit Leakage Scenario): 0.10 L/min leakage over 60 min yields exactly 6.0 L and 8.574 g O2', () => {
            const scenarioProfile = {
                ...DEFAULT_ASTRONAUT_PROFILE,
                suitLeakageRateLpm: 0.10, // 100 sccm
            };

            const stationaryEdge = edgeUseCase.execute(
                {
                    horizontalDistanceMeters: 0,
                    elevationDeltaMeters: 0,
                    isStationary: true,
                    stationaryDurationSeconds: 3600, // 60 minutes
                },
                scenarioProfile,
            );

            // 0.10 L/min * 60 min = 6.0 L
            expect(stationaryEdge.estimatedStructuralLeakageLiters).toBeCloseTo(6.0, 4);
            // 6.0 L * 1.429 g/L = 8.574 g
            expect(stationaryEdge.estimatedStructuralLeakageGrams).toBeCloseTo(8.574, 4);
            // Total draw equals metabolic equivalent + structural leakage
            expect(stationaryEdge.estimatedTotalOxygenDrawGrams).toBeCloseTo(
                stationaryEdge.estimatedMetabolicOxygenEquivalentGrams + 8.574,
                4,
            );
        });

        it('Test C (Route Aggregation): mission totals equal sum of outbound and return traversal components', () => {
            const scenarioProfile = {
                ...DEFAULT_ASTRONAUT_PROFILE,
                suitLeakageRateLpm: 0.10,
            };
            const stationaryHours = 0.5;

            const feasibility = service.evaluateEvaFeasibility(
                'jezero_crater',
                path,
                scenarioProfile,
                stationaryHours,
            );

            // Metabolic oxygen equivalent sum
            const expectedMetabolicGrams =
                feasibility.outbound.estimatedTotalMetabolicOxygenEquivalentGrams +
                feasibility.returnTraversal.estimatedTotalMetabolicOxygenEquivalentGrams;
            expect(feasibility.totalMissionMetabolicOxygenEquivalentGrams).toBeCloseTo(expectedMetabolicGrams, 4);

            // Structural leakage sum (including stationary pause embedded in outbound route)
            const expectedLeakageGrams =
                feasibility.outbound.estimatedTotalStructuralLeakageGrams +
                feasibility.returnTraversal.estimatedTotalStructuralLeakageGrams;
            expect(feasibility.totalMissionStructuralLeakageGrams).toBeCloseTo(expectedLeakageGrams, 4);

            // Total draw equals metabolic + leakage
            expect(feasibility.totalMissionOxygenDrawGrams).toBeCloseTo(
                feasibility.totalMissionMetabolicOxygenEquivalentGrams + feasibility.totalMissionStructuralLeakageGrams,
                4,
            );
        });

        it('Test D (Invalid Inputs): rejects negative, NaN, and infinite leakage values at service and controller levels', () => {
            const controller = new BioenergeticsController(service);

            // Service level validation via mergeProfile
            expect(() => service.mergeProfile({ suitLeakageRateLpm: -0.05 })).toThrow(
                /Invalid suitLeakageRateLpm/,
            );
            expect(() => service.mergeProfile({ suitLeakageRateLpm: NaN })).toThrow(
                /Invalid suitLeakageRateLpm/,
            );
            expect(() => service.mergeProfile({ suitLeakageRateLpm: Infinity })).toThrow(
                /Invalid suitLeakageRateLpm/,
            );

            // Edge use case validation
            expect(() =>
                edgeUseCase.execute(
                    { horizontalDistanceMeters: 100, elevationDeltaMeters: 0 },
                    { ...DEFAULT_ASTRONAUT_PROFILE, suitLeakageRateLpm: -1 },
                ),
            ).toThrow(/Must be a finite non-negative number/);

            // Controller level validation
            expect(() =>
                controller.calculateRouteBioenergetics({
                    region: 'jezero_crater',
                    path,
                    profile: { suitLeakageRateLpm: -0.1 },
                }),
            ).toThrow(/suitLeakageRateLpm must be a finite, non-negative number/);

            expect(() =>
                controller.assessEvaFeasibility({
                    region: 'jezero_crater',
                    path,
                    profile: { suitLeakageRateLpm: NaN },
                }),
            ).toThrow(/suitLeakageRateLpm must be a finite, non-negative number/);
        });

        it('Test F (Backwards Compatibility): legacy totalMissionOxygenDraw fields and remaining balance remain consistent', () => {
            const feasibility = service.evaluateEvaFeasibility('jezero_crater', path);

            expect(typeof feasibility.totalMissionOxygenDrawGrams).toBe('number');
            expect(typeof feasibility.totalMissionOxygenDrawLiters).toBe('number');
            expect(feasibility.totalMissionOxygenDrawGrams).toBeGreaterThan(0);
            expect(feasibility.totalMissionOxygenDrawLiters).toBeCloseTo(
                feasibility.totalMissionOxygenDrawGrams / 1.429,
                3,
            );
            expect(feasibility.remainingOxygenGrams).toBeCloseTo(
                DEFAULT_ASTRONAUT_PROFILE.usableOxygenGrams - feasibility.totalMissionOxygenDrawGrams,
                4,
            );
        });
    });
});
