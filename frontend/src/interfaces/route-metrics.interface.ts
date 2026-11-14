import { type ScientificTargetHit } from "./scientific-target-hit.interface";

export interface RouteMetrics {
  totalCost: number;
  distanceMeters: number;
  maxSlopeDeg: number;
  elevationChangeMeters: number;
  minElevationMeters: number;
  maxElevationMeters: number;
  estimatedTravelTimeHours: number;
  scientificTargetsNearRoute: ScientificTargetHit[];
  hazardSegments: number;
}
