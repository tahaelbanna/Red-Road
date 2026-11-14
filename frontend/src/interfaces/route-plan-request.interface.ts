import { type Priorities } from "./priorities.interface";

export interface RoutePlanRequest {
  region: string;
  start: { row: number; col: number };
  end: { row: number; col: number };
  mission: string;
  priorities: Priorities;
  baseSpeedKmh?: number;
  stationaryTimeHours?: number;
}
