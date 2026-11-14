import { sound } from "../main";
import {
  currentEnvLimits,
  currentOxygenConfig,
  currentTraversalConfig,
} from "../state/app.state";

let isFeasibilityOpen = false;
let feasibilityPanel: HTMLDivElement | null = null;

export function buildMissionFeasibilityUI(
  navParent: HTMLElement,
  panelParent: HTMLElement,
  onConfigChange: () => void,
) {
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "btn-feasibility-toggle";
  toggleBtn.className = "btn";
  toggleBtn.innerHTML = "MISSION FEASIBILITY";
  toggleBtn.style.pointerEvents = "auto";
  navParent.appendChild(toggleBtn);

  const panel = document.createElement("div");
  panel.id = "feasibility-panel";
  panel.className = "panel";
  panel.style.display = "none";
  panel.style.pointerEvents = "auto";
  feasibilityPanel = panel;

  toggleBtn.addEventListener("click", () => {
    sound.click();
    isFeasibilityOpen = !isFeasibilityOpen;
    panel.style.display = isFeasibilityOpen ? "block" : "none";
    toggleBtn.className = isFeasibilityOpen ? "btn on" : "btn";
  });

  const content = document.createElement("div");
  content.className = "sec";

  const header = document.createElement("div");
  header.className = "sec-h";
  header.innerHTML = `<span>OXYGEN & LIFE-SUPPORT</span>`;
  content.appendChild(header);

  const oxyBox = document.createElement("div");
  oxyBox.className = "kv";

  const mkInput = (
    label: string,
    value: number,
    step: string,
    onChange: (v: number) => void,
  ) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.marginBottom = "5px";

    const lbl = document.createElement("div");
    lbl.className = "k";
    lbl.textContent = label;

    const inp = document.createElement("input");
    inp.type = "number";
    inp.step = step;
    inp.value = String(value);
    inp.style.width = "60px";
    inp.style.background = "rgba(0,0,0,0.5)";
    inp.style.color = "var(--text)";
    inp.style.border = "1px solid var(--line)";

    inp.addEventListener("change", () => {
      onChange(Number(inp.value));
      onConfigChange();
    });

    row.appendChild(lbl);
    row.appendChild(inp);
    return row;
  };

  oxyBox.appendChild(
    mkInput(
      "Supply (kg)",
      currentOxygenConfig.supplyKg,
      "0.1",
      (v) => (currentOxygenConfig.supplyKg = v),
    ),
  );
  oxyBox.appendChild(
    mkInput(
      "Cons. (kg/h)",
      currentOxygenConfig.consumptionRateKgPerHour,
      "0.01",
      (v) => (currentOxygenConfig.consumptionRateKgPerHour = v),
    ),
  );
  oxyBox.appendChild(
    mkInput(
      "Reserve %",
      currentOxygenConfig.reserveFraction * 100,
      "5",
      (v) => (currentOxygenConfig.reserveFraction = v / 100),
    ),
  );

  content.appendChild(oxyBox);

  const envHeader = document.createElement("div");
  envHeader.className = "sec-h";
  envHeader.style.marginTop = "15px";
  envHeader.innerHTML = `<span>ENVIRONMENTAL LIMITS</span>`;
  content.appendChild(envHeader);

  const envBox = document.createElement("div");
  envBox.className = "kv";
  envBox.appendChild(
    mkInput(
      "Min Temp (°C)",
      currentEnvLimits.minOperatingTempC,
      "1",
      (v) => (currentEnvLimits.minOperatingTempC = v),
    ),
  );
  envBox.appendChild(
    mkInput(
      "Max Temp (°C)",
      currentEnvLimits.maxOperatingTempC,
      "1",
      (v) => (currentEnvLimits.maxOperatingTempC = v),
    ),
  );
  content.appendChild(envBox);

  const travHeader = document.createElement("div");
  travHeader.className = "sec-h";
  travHeader.style.marginTop = "15px";
  travHeader.innerHTML = `<span>TRAVERSAL MODEL</span>`;
  content.appendChild(travHeader);

  const travBox = document.createElement("div");
  travBox.className = "kv";
  travBox.appendChild(
    mkInput(
      "Speed (km/h)",
      currentTraversalConfig.baseSpeedKmh,
      "0.5",
      (v) => (currentTraversalConfig.baseSpeedKmh = v),
    ),
  );
  travBox.appendChild(
    mkInput(
      "Science Time (h)",
      currentTraversalConfig.stationaryTimeHours,
      "0.5",
      (v) => (currentTraversalConfig.stationaryTimeHours = v),
    ),
  );
  content.appendChild(travBox);

  const resultArea = document.createElement("div");
  resultArea.id = "feasibility-result";
  resultArea.style.marginTop = "15px";
  content.appendChild(resultArea);

  panel.appendChild(content);
  panelParent.appendChild(panel);
}

export function updateFeasibilityResultUI(result: any) {
  if (!feasibilityPanel) return;
  const resultArea = document.getElementById("feasibility-result");
  if (!resultArea) return;

  if (!result) {
    resultArea.innerHTML = `<div class="sub muted">Awaiting route calculation...</div>`;
    return;
  }

  const { status, oxygen, environment, reasons, warnings, uncertainties } =
    result;

  let statusColor = "var(--good)";
  if (status === "INFEASIBLE") statusColor = "var(--critical)";
  if (status === "CONDITIONAL") statusColor = "var(--warning)";

  let html = `
        <div class="sec-h" style="color: ${statusColor}; border-bottom-color: ${statusColor}">STATUS: ${status}</div>
        <div class="stats" style="margin-top: 10px; margin-bottom: 10px;">
            <div class="stat"><div class="k">O2 REMAINING</div><div class="v" style="color:${oxygen.isSufficient ? "var(--good)" : "var(--critical)"}">${oxygen.remainingKg.toFixed(1)}<small>kg</small></div></div>
            <div class="stat"><div class="k">O2 MARGIN</div><div class="v">${oxygen.marginAfterReserveKg.toFixed(1)}<small>kg</small></div></div>
            <div class="stat"><div class="k">SURFACE TEMP</div><div class="v" style="color:${environment.isWithinLimits ? "var(--good)" : "var(--critical)"}">${environment.conditions.surfaceTemperatureC}<small>°C</small></div></div>
        </div>
        <div class="sub" style="font-size:12px; margin-bottom: 5px;">
            <strong>REASONS:</strong><br/>
            ${reasons.map((r: string) => `• ${r}`).join("<br/>")}
        </div>
    `;

  if (warnings.length > 0) {
    html += `<div class="sub" style="font-size:12px; color: var(--warning); margin-bottom: 5px;">
            <strong>WARNINGS:</strong><br/>
            ${warnings.map((w: string) => `• ${w}`).join("<br/>")}
        </div>`;
  }

  html += `<div class="sub muted" style="font-size:10px; margin-top: 10px;">
            <strong>UNCERTAINTIES:</strong><br/>
            ${uncertainties.map((u: string) => `• ${u}`).join("<br/>")}
        </div>`;

  resultArea.innerHTML = html;
}
