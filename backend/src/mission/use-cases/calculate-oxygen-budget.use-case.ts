import { Injectable, BadRequestException } from '@nestjs/common';
import { OxygenBudgetConfig, OxygenBudgetResult } from '../interfaces/index.js';

@Injectable()
export class CalculateOxygenBudgetUseCase {
    execute(
        config: OxygenBudgetConfig,
        durationHours: number,
    ): OxygenBudgetResult {
        if (config.supplyKg < 0)
            throw new BadRequestException('Oxygen supply cannot be negative.');
        if (config.consumptionRateKgPerHour <= 0)
            throw new BadRequestException(
                'Oxygen consumption rate must be positive.',
            );
        if (config.reserveFraction < 0 || config.reserveFraction >= 1)
            throw new BadRequestException(
                'Reserve fraction must be between 0 and 1.',
            );
        if (durationHours < 0)
            throw new BadRequestException(
                'Mission duration cannot be negative.',
            );

        const consumedKg = config.consumptionRateKgPerHour * durationHours;
        const remainingKg = config.supplyKg - consumedKg;
        const requiredReserveKg = config.supplyKg * config.reserveFraction;
        const marginAfterReserveKg = remainingKg - requiredReserveKg;

        const isSufficient = marginAfterReserveKg >= 0;
        const remainingPercentage = (remainingKg / config.supplyKg) * 100;
        const maxDurationHours =
            (config.supplyKg * (1 - config.reserveFraction)) /
            config.consumptionRateKgPerHour;

        let additionalOxygenNeededKg = 0;
        if (!isSufficient) {
            additionalOxygenNeededKg = Math.abs(marginAfterReserveKg);
        }

        return {
            supplyKg: config.supplyKg,
            consumedKg,
            remainingKg,
            requiredReserveKg,
            marginAfterReserveKg,
            isSufficient,
            remainingPercentage,
            maxDurationHours,
            additionalOxygenNeededKg,
        };
    }
}
