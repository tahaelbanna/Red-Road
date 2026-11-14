export type EdgeCostFn = (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
) => number;