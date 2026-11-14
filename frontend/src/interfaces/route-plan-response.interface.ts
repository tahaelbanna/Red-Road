import { type Priorities } from "./priorities.interface";
import { type RouteCell } from "./route-cell.interface";
import { type RouteExplanation } from "./route-explanation.interface";
import { type RouteMetrics } from "./route-metrics.interface";

export interface RoutePlanResponse {
  found: boolean;
  path: RouteCell[];
  metrics: RouteMetrics;
  prioritiesUsed: Priorities;
  explanation?: RouteExplanation;
}
