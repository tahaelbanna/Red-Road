import { Injectable } from '@nestjs/common';
import {
    EnvironmentalLimits,
    EnvironmentalAssessment,
    EnvironmentalConditions,
} from '../interfaces/index.js';

@Injectable()
export class AssessEnvironmentUseCase {
    execute(limits: EnvironmentalLimits): EnvironmentalAssessment {
        const conditions: EnvironmentalConditions = {
            surfaceTemperatureC: -55,
            atmosphericTemperatureC: -60,
            timeOfDay: 'Midday',
            season: 'Spring',
            dataSource:
                'Illustrative scenario estimate (not loaded from MEDA dataset)',
            timestamp: 'Static scenario value — no observation timestamp',
        };

        const warnings: string[] = [];
        let isWithinLimits = true;

        if (conditions.surfaceTemperatureC < limits.minOperatingTempC) {
            isWithinLimits = false;
            warnings.push(
                `Surface temperature (${conditions.surfaceTemperatureC}°C) is below minimum operating limit (${limits.minOperatingTempC}°C).`,
            );
        }
        if (conditions.surfaceTemperatureC > limits.maxOperatingTempC) {
            isWithinLimits = false;
            warnings.push(
                `Surface temperature (${conditions.surfaceTemperatureC}°C) exceeds maximum operating limit (${limits.maxOperatingTempC}°C).`,
            );
        }

        return {
            conditions,
            limits,
            isWithinLimits,
            warnings,
        };
    }
}
