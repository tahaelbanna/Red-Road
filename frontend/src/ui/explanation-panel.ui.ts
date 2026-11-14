import { type Priorities } from "../interfaces/index";
import { requestAndDrawRoute } from "../main";
import { appState } from "../state/app.state";
import { getTargetPresentation } from "../utils/target-format.util";

export function initExplanationPanel() {
  if (appState.explanationPanelEl) return;

  const el = document.createElement("div");
  el.id = "route-explanation";
  el.className = "panel left";
  el.style.position = "fixed";
  el.style.top = "12px";
  el.style.left = "18px";
  el.style.width = "340px";
  el.style.maxHeight = "calc(50vh - 18px)";
  el.style.overflowY = "auto";
  el.style.transition = "opacity 0.3s";
  el.style.zIndex = "100";
  document.body.appendChild(el);
  appState.explanationPanelEl = el;

  showExplanationEmptyState();
}

function renderPanelHeader() {
  return `
    <div class="sec">
      <div class="sec-h" style="margin-bottom:0">AI ROUTE ANALYSIS <span class="tag">GROUNDED</span></div>
    </div>
  `;
}

export function showExplanationEmptyState() {
  if (!appState.explanationPanelEl) return;
  appState.explanationPanelEl.innerHTML =
    renderPanelHeader() +
    `
    <div class="sec" style="text-align:center;padding:30px 20px">
      <div class="sub muted">Select a start and destination to generate a grounded route analysis.</div>
    </div>
  `;
}

export function showExplanationLoadingState() {
  if (!appState.explanationPanelEl) return;
  appState.explanationPanelEl.innerHTML =
    renderPanelHeader() +
    `
    <div class="sec" style="text-align:center;padding:40px 20px">
      <div class="sec-h" style="justify-content:center;color:var(--data);animation: blink 1.5s infinite">ANALYZING ROUTE...</div>
    </div>
  `;
}

export function showExplanationErrorState() {
  if (!appState.explanationPanelEl) return;
  appState.explanationPanelEl.innerHTML =
    renderPanelHeader() +
    `
    <div class="sec" style="text-align:center;padding:30px 20px">
      <div class="sec-h" style="justify-content:center;color:var(--critical)">ROUTE ANALYSIS UNAVAILABLE</div>
    </div>
    <div class="sec" style="text-align:center">
      <button id="retry-explanation-btn" class="btn on" style="background:rgba(208,59,59,.3);border-color:var(--critical);color:#fff">RETRY</button>
    </div>
  `;
  const retryBtn = appState.explanationPanelEl.querySelector(
    "#retry-explanation-btn",
  );
  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      requestAndDrawRoute();
    });
  }
}

export function showRouteExplanation(
  expl: any,
  priorities: Priorities,
  metrics: any,
  targetsMap: any[],
): void {
  if (!appState.explanationPanelEl) return;

  const tradeoffsHtml =
    expl.tradeoffs.length > 0
      ? expl.tradeoffs
          .map((t: string) => `<li style="margin-bottom:6px">${t}</li>`)
          .join("")
      : "<li>No significant tradeoffs identified.</li>";

  const factorsHtml = expl.keyFactors
    .map((f: string) => {
      const parts = f.split(":");
      if (parts.length === 2) {
        return `
            <div class="kv" style="margin-bottom:8px">
              <div class="k">${parts[0]}</div>
              <div class="v" style="text-align:left">${parts[1].trim()}</div>
            </div>
          `;
      }
      return `<div class="sub muted" style="margin-bottom:4px">${f}</div>`;
    })
    .join("");

  const targetCardsHtml =
    metrics.scientificTargetsNearRoute.length > 0
      ? metrics.scientificTargetsNearRoute
          .map((t: any) => {
            const fullTarget = targetsMap.find((lt: any) => lt.id === t.id);
            const { icon, accuracyText, color } =
              getTargetPresentation(fullTarget);
            return `
          <div class="wp" style="padding:4px 0">
            <div class="n" style="color:${color};border-color:${color}"><span>${icon}</span></div>
            <div>
              <div class="nm" style="color:${color}">${t.name}</div>
              <div class="ds">${accuracyText}</div>
            </div>
          </div>
        `;
          })
          .join("")
      : '<div class="sub muted">No scientific targets nearby.</div>';

  appState.explanationPanelEl.innerHTML =
    renderPanelHeader() +
    `
    <div class="sec">
      <div class="sec-h">MISSION SUMMARY</div>
      <div class="sub">${expl.summary}</div>
      <div class="sub muted" style="font-size:11px;margin-top:6px">${expl.priorityExplanation}</div>
    </div>
    
    <div class="sec">
      <div class="sec-h">CURRENT PRIORITIES</div>
      <div class="hz">
        <div><i style="background:var(--good)"></i> ${Math.round(priorities.safety * 100)}%</div>
        <div><i style="background:var(--warning)"></i> ${Math.round(priorities.slope * 100)}%</div>
        <div><i style="background:var(--data)"></i> ${Math.round(priorities.distance * 100)}%</div>
        <div><i style="background:#a855f7"></i> ${Math.round(priorities.science * 100)}%</div>
      </div>
    </div>

    <div class="sec">
      <div class="sec-h">WHY THIS ROUTE?</div>
      <div>${factorsHtml}</div>
    </div>

    <div class="sec">
      <div class="sec-h">TRADE-OFFS</div>
      <ul class="sub muted" style="margin:0;padding-left:18px">
        ${tradeoffsHtml}
      </ul>
    </div>

    <div class="sec" style="background:rgba(208,59,59,.1)">
      <div class="sec-h" style="color:var(--critical)">SAFETY CONSIDERATIONS</div>
      <div class="sub" style="color:#ff9999">${expl.safetyNote}</div>
      <div class="sub muted" style="margin-top:6px;font-family:var(--mono);color:var(--critical)">
        HAZARDS: ${metrics.hazardSegments} | MAX SLOPE: ${metrics.maxSlopeDeg.toFixed(1)}°
      </div>
    </div>

    <div class="sec">
      <div class="sec-h" style="color:#b088ff">SCIENTIFIC OPPORTUNITIES</div>
      <div class="sub" style="color:#d4bfff;margin-bottom:10px">${expl.scienceNote}</div>
      <div>${targetCardsHtml}</div>
    </div>
  `;
}
