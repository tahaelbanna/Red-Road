export interface OxygenBudgetResult {
    supplyKg: number;
    consumedKg: number;
    remainingKg: number;
    requiredReserveKg: number;
    marginAfterReserveKg: number;
    isSufficient: boolean;
    remainingPercentage: number;
    maxDurationHours: number;
    additionalOxygenNeededKg: number;
}