import { type RoutePlanResponse } from "../interfaces/index";
import { sound } from "../main";
import { appState, currentTraversalConfig } from "../state/app.state";
import { getTargetPresentation } from "../utils/target-format.util";

export function showRouteReport(response: RoutePlanResponse): void {
  if (!appState.reportPanelEl) {
    const el = document.createElement("div");
    el.id = "route-report";
    el.className = "panel left";
    el.style.position = "fixed";
    el.style.top = "calc(50vh + 6px)";
    el.style.left = "18px";
    el.style.width = "340px";
    el.style.maxHeight = "calc(50vh - 18px)";
    el.style.overflowY = "auto";
    el.style.transition = "opacity 0.3s, transform 0.3s";
    document.body.appendChild(el);
    appState.reportPanelEl = el;
  }

  const m = response.metrics;
  const distKm = (m.distanceMeters / 1000).toFixed(2);

  let travelTimeStr: string;
  if (m.estimatedTravelTimeHours < 1) {
    travelTimeStr = `${Math.round(m.estimatedTravelTimeHours * 60)} min`;
  } else {
    const hours = Math.floor(m.estimatedTravelTimeHours);
    const mins = Math.round((m.estimatedTravelTimeHours - hours) * 60);
    travelTimeStr = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  const targetsHtml =
    m.scientificTargetsNearRoute.length > 0
      ? m.scientificTargetsNearRoute
          .map((t) => {
            const fullTarget = appState.loadedTargets.find(
              (lt) => lt.id === t.id,
            );
            const { icon, accuracyText } = getTargetPresentation(fullTarget);

            return `<div class="wp">
            <div class="n" style="color:var(--hud);border-color:var(--hud)"><span>${icon}</span></div>
            <div>
              <div class="nm">${t.name}</div>
              <div class="ds">${accuracyText}</div>
            </div>
            <div class="rt">${t.distanceMeters}m away</div>
          </div>`;
          })
          .join("")
      : '<div class="sub muted">None within 500m of route</div>';

  appState.reportPanelEl.innerHTML = `
    <div class="sec">
      <div class="sec-h" style="margin-bottom:0">ROUTE REPORT <button id="close-report" class="btn ghost small" style="margin-left:auto">×</button></div>
    </div>
    <div class="sec">
      <div class="stats">
        <div class="stat"><div class="k">DISTANCE</div><div class="v" style="color:var(--warning)">${distKm}<small>km</small></div></div>
        <div class="stat"><div class="k">TRAVEL TIME</div><div class="v" style="color:var(--data)">${travelTimeStr}</div></div>
        <div class="stat"><div class="k">MAX SLOPE</div><div class="v" style="color:var(--good)">${m.maxSlopeDeg.toFixed(1)}<small>°</small></div></div>
        <div class="stat"><div class="k">ELEVATION Δ</div><div class="v" style="color:#a855f7">${m.elevationChangeMeters}<small>m</small></div></div>
      </div>
    </div>
    <div class="sec">
      <div class="kv">
        <div class="k">ELEV RANGE</div><div class="v">${m.minElevationMeters}m — ${m.maxElevationMeters}m</div>
        <div class="k">HAZARDS</div><div class="v" style="color:${m.hazardSegments > 10 ? "var(--critical)" : m.hazardSegments > 0 ? "var(--warning)" : "var(--good)"}">
          ${m.hazardSegments > 0 ? `${m.hazardSegments} elevated hazard cells` : "No significant hazards"}
        </div>
      </div>
    </div>
    <div class="sec">
      <div class="sec-h">SCIENTIFIC TARGETS NEAR ROUTE</div>
      <div class="rows">${targetsHtml}</div>
    </div>
    <div class="sec">
      <div class="sub muted" style="font-size:10px">Travel time is a heuristic estimate based on the configured ${currentTraversalConfig.baseSpeedKmh} km/h base speed (with slope penalties), not a validated simulation.</div>
    </div>
  `;

  appState.reportPanelEl.style.opacity = "1";
  appState.reportPanelEl.style.transform = "translateY(0)";

  const closeBtn = appState.reportPanelEl.querySelector("#close-report");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      sound.click();
      hideRouteReport();
    });
  }
}

export function hideRouteReport(): void {
  if (appState.reportPanelEl) {
    appState.reportPanelEl.style.opacity = "0";
    appState.reportPanelEl.style.transform = "translateY(10px)";
    setTimeout(() => {
      if (appState.reportPanelEl) {
        appState.reportPanelEl.remove();
        appState.reportPanelEl = null;
      }
    }, 300);
  }
}
