import { BACKEND_URL, META_PATH } from "../config/index";
import {
  type AstronautProfile,
  type EvaFeasibilityResult,
  type FeasibilityRequest,
  type HeightmapMeta,
  type RouteBioenergeticsSummary,
  type RoutePlanRequest,
  type RoutePlanResponse,
  type ScientificTarget,
} from "../interfaces/index";

export async function fetchHeightmapMeta(): Promise<HeightmapMeta> {
  const res = await fetch(META_PATH);
  return res.json();
}

export async function fetchScientificTargets(
  region: string,
): Promise<ScientificTarget[]> {
  const res = await fetch(`${BACKEND_URL}/terrain/${region}/targets`);
  return res.json();
}

export async function planRoute(
  request: RoutePlanRequest,
): Promise<RoutePlanResponse> {
  const res = await fetch(`${BACKEND_URL}/route/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return res.json();
}

export async function fetchDefaultAstronautProfile(): Promise<AstronautProfile> {
  const res = await fetch(`${BACKEND_URL}/api/bioenergetics/profile/default`);
  return res.json();
}

export async function fetchRouteBioenergetics(dto: {
  region: string;
  path: Array<{ row: number; col: number }>;
  profile?: Partial<AstronautProfile>;
  reverse?: boolean;
  stationaryTimeHours?: number;
}): Promise<RouteBioenergeticsSummary> {
  const res = await fetch(`${BACKEND_URL}/api/bioenergetics/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return res.json();
}

export async function fetchEvaAssessment(dto: {
  region: string;
  path: Array<{ row: number; col: number }>;
  profile?: Partial<AstronautProfile>;
  stationaryTimeHours?: number;
}): Promise<EvaFeasibilityResult> {
  const res = await fetch(`${BACKEND_URL}/api/bioenergetics/eva-assessment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return res.json();
}

export async function fetchFeasibility(request: FeasibilityRequest) {
  const res = await fetch(`${BACKEND_URL}/api/mission/feasibility`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return res.json();
}

export async function sendCopilotMessage(message: string, context: any) {
  const res = await fetch(`${BACKEND_URL}/api/ai/copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context }),
  });
  return res.json();
}
