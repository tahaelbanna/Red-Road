import { type ScientificTarget } from "../interfaces/index";
import { requestAndDrawRoute, sound } from "../main";
import { gridCellToScenePosition } from "../scene/coordinates";
import {
  buildMarker,
  clearEndMarker,
  clearRouteLine,
  clearStartMarker,
} from "../scene/terrain-builder";
import { appState } from "../state/app.state";
import { getTargetPresentation } from "../utils/target-format.util";
import { showExplanationEmptyState } from "./explanation-panel.ui";
import { disableFocusMode } from "./focus-mode.ui";
import { hideRouteReport } from "./route-report.ui";
import { updateStatusText } from "./status-overlay.ui";

export function showTargetDetails(target: ScientificTarget) {
  if (!appState.targetDetailsPanelEl) {
    const el = document.createElement("div");
    el.id = "target-details-panel";
    el.className = "panel";
    el.style.width = "340px";
    el.style.flexShrink = "0";
    el.style.pointerEvents = "auto";
    el.style.marginTop = "auto";
    el.style.position = "relative";
    el.style.top = "auto";
    el.style.maxHeight = "none";
    appState.zoneExplorer!.appendChild(el);
    appState.targetDetailsPanelEl = el;
  }

  const { isRegion, icon, color: accColor } = getTargetPresentation(target);
  const accText =
    target.position_accuracy === "published"
      ? "Published Coordinate"
      : "Representative Location";

  let btnAction = "SET AS START";
  let btnId = "btn-set-start";
  if (appState.selectedStart && !appState.selectedEnd) {
    btnAction = "SET AS DESTINATION";
    btnId = "btn-set-end";
  }

  appState.targetDetailsPanelEl.innerHTML = `
    <div class="sec">
      <div class="sec-h" style="margin-bottom:0;align-items:center">
        <div class="wp" style="padding:0">
          <div class="n" style="color:${accColor};border-color:${accColor}"><span>${icon}</span></div>
          <div class="nm" style="font-size:15px">${target.name}</div>
        </div>
        <button id="close-target-details" class="btn ghost small" style="margin-left:auto">×</button>
      </div>
    </div>
    
    <div class="sec">
      <div class="kv" style="margin-bottom:16px">
        <div class="k">CATEGORY</div><div class="v" style="text-align:left">${isRegion ? "Geological Feature / Campaign Area" : "Point Target"}</div>
        <div class="k">TYPE</div><div class="v" style="text-align:left">${target.type}</div>
        <div class="k">LOCATION ACCURACY</div><div class="v" style="text-align:left;color:${accColor}">${accText}</div>
        <div class="k">SOURCE</div><div class="v" style="text-align:left">NASA/JPL<br><span class="sub muted">${target.source}</span></div>
      </div>
      <button id="${btnId}" class="btn on" style="width:100%">${btnAction}</button>
    </div>
  `;

  appState.targetDetailsPanelEl.style.display = "block";
  appState.selectedTargetId = target.id;

  const closeBtn = appState.targetDetailsPanelEl.querySelector(
    "#close-target-details",
  );
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      sound.click();
      if (appState.targetDetailsPanelEl)
        appState.targetDetailsPanelEl.style.display = "none";
      appState.selectedTargetId = null;
      disableFocusMode();
    });
  }

  const actionBtn = appState.targetDetailsPanelEl.querySelector(`#${btnId}`);
  if (actionBtn) {
    actionBtn.addEventListener("click", async () => {
      sound.go();
      const cell = { row: target.row, col: target.col };
      if (btnId === "btn-set-start") {
        appState.selectedStart = cell;
        appState.selectedEnd = null;
        clearStartMarker();
        clearEndMarker();
        clearRouteLine();
        hideRouteReport();
        showExplanationEmptyState();
        appState.startMarker = buildMarker(
          gridCellToScenePosition(cell),
          0x00ff00,
        );
        appState.scene.add(appState.startMarker);
        updateStatusText();
      } else {
        appState.selectedEnd = cell;
        clearEndMarker();
        appState.endMarker = buildMarker(
          gridCellToScenePosition(cell),
          0xff0000,
        );
        appState.scene.add(appState.endMarker);
        await requestAndDrawRoute();
      }
      if (appState.targetDetailsPanelEl)
        appState.targetDetailsPanelEl.style.display = "none";
    });
  }
}
