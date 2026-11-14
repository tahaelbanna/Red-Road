import { BACKEND_URL, META_PATH } from "../config/index";
import {
  type FeasibilityRequest,
  type HeightmapMeta,
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
