import { describe, expect, it } from 'vitest';
import { ResolvePrioritiesUseCase } from './resolve-priorities.use-case.js';
import { MissionType } from '../enums/mission-type.enum.js';
import { MISSION_DEFAULT_PRIORITIES } from '../constants/index.js';

describe('ResolvePrioritiesUseCase', () => {
    const useCase = new ResolvePrioritiesUseCase();

    it('should return mission defaults when no overrides are provided', () => {
        const human = useCase.execute(MissionType.HUMAN_EXPLORATION);
        expect(human).toEqual(
            MISSION_DEFAULT_PRIORITIES[MissionType.HUMAN_EXPLORATION],
        );
        expect(
            human.safety + human.slope + human.distance + human.science,
        ).toBeCloseTo(1.0, 6);

        const science = useCase.execute(MissionType.SCIENTIFIC_RESEARCH);
        expect(science).toEqual(
            MISSION_DEFAULT_PRIORITIES[MissionType.SCIENTIFIC_RESEARCH],
        );

        const transit = useCase.execute(MissionType.RAPID_TRANSIT);
        expect(transit).toEqual(
            MISSION_DEFAULT_PRIORITIES[MissionType.RAPID_TRANSIT],
        );
    });

    it('should normalize valid priority overrides so sum equals 1.0', () => {
        const overrides = {
            safety: 2,
            slope: 1,
            distance: 1,
            science: 0,
        }; // sum = 4
        const result = useCase.execute(
            MissionType.HUMAN_EXPLORATION,
            overrides,
        );

        expect(result.safety).toBeCloseTo(0.5, 6);
        expect(result.slope).toBeCloseTo(0.25, 6);
        expect(result.distance).toBeCloseTo(0.25, 6);
        expect(result.science).toBeCloseTo(0.0, 6);
        expect(
            result.safety + result.slope + result.distance + result.science,
        ).toBeCloseTo(1.0, 6);
    });

    it('should sanitize negative or NaN values and clamp them to zero', () => {
        const overrides = {
            safety: -0.5,
            slope: 0.5,
            distance: NaN as any,
            science: 0.5,
        };
        const result = useCase.execute(
            MissionType.HUMAN_EXPLORATION,
            overrides,
        );

        // Raw values: safety: 0, slope: 0.5, distance: 0.2 (default), science: 0.5. Sum = 1.2
        expect(result.safety).toBe(0);
        expect(result.slope).toBeCloseTo(0.5 / 1.2, 6);
        expect(result.distance).toBeCloseTo(0.2 / 1.2, 6);
        expect(result.science).toBeCloseTo(0.5 / 1.2, 6);
        expect(
            result.safety + result.slope + result.distance + result.science,
        ).toBeCloseTo(1.0, 6);
    });

    it('should fallback to defaults if sum of overrides is zero', () => {
        const overrides = {
            safety: 0,
            slope: 0,
            distance: 0,
            science: 0,
        };
        const result = useCase.execute(
            MissionType.HUMAN_EXPLORATION,
            overrides,
        );
        expect(result).toEqual(
            MISSION_DEFAULT_PRIORITIES[MissionType.HUMAN_EXPLORATION],
        );
    });
});
