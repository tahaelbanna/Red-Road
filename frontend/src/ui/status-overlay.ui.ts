import { type RoutePlanResponse } from "../interfaces/index";
import { appState } from "../state/app.state";

export function buildStatusOverlay(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "chip";
  el.style.position = "fixed";
  el.style.top = "18px";
  el.style.left = "350px";
  el.style.pointerEvents = "none";
  el.style.zIndex = "999";
  document.body.appendChild(el);
  return el;
}

export function updateStatusText(metrics?: RoutePlanResponse["metrics"]) {
  if (appState.statusEl) {
    if (!appState.selectedStart) {
      appState.statusEl.innerHTML = `<div class="k">STATUS</div><div class="v">AWAITING START</div>`;
    } else if (!appState.selectedEnd) {
      appState.statusEl.innerHTML = `<div class="k">STATUS</div><div class="v">AWAITING END</div>`;
    } else if (metrics) {
      appState.statusEl.innerHTML = `<div class="k">ROUTE</div><div class="v" style="color:var(--good)">${metrics.distanceMeters}m</div>`;
    } else {
      appState.statusEl.innerHTML = `<div class="k">ROUTE</div><div class="v" style="color:var(--critical)">NOT FOUND</div>`;
    }
  }
}
