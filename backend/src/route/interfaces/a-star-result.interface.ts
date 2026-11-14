import { GridPosition } from './grid-position.interface.js';

export interface AStarResult {
    found: boolean;
    path: GridPosition[]; // empty if not found
    totalCost: number;
    nodesExpanded?: number;
    executionTimeMs?: number;
}