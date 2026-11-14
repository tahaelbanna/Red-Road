import { ScientificTargetHit } from './scientific-target-hit.interface.js';

export interface RouteMetrics {
    totalCost: number;
    distanceMeters: number;
    maxSlopeDeg: number;
    elevationChangeMeters: number; // total ascent + descent
    minElevationMeters: number;
    maxElevationMeters: number;
    estimatedTravelTimeHours: number; // project estimate, not NASA official
    scientificTargetsNearRoute: ScientificTargetHit[];
    hazardSegments: number; // count of cells with hazard > 0.5
}