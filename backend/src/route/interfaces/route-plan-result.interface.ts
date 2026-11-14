import { Priorities } from './priorities.interface.js';
import { RouteMetrics } from './route-metrics.interface.js';

export interface RoutePlanResult {
    found: boolean;
    path: Array<{ row: number; col: number; x: number; y: number }>;
    metrics: RouteMetrics;
    prioritiesUsed: Priorities;
    explanation?: any; // Will be populated by RouteController using RouteExplanationService
}