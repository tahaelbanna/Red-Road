import {
  currentAstronautProfile,
  currentOxygenConfig,
  currentTraversalConfig,
} from "../state/app.state";
import type { EvaFeasibilityResult } from "../interfaces/eva-feasibility.interface";

let isFeasibilityOpen = false;
let feasibilityPanel: HTMLDivElement | null = null;

export function formatEvaDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m < 10 ? "0" : ""}${m}m`;
}

export function getFeasibilityStatusStyle(status: string): { bg: string; border: string; text: string } {
  if (status === "MARGINAL") {
    return {
      bg: "rgba(250, 178, 25, 0.2)",
      border: "var(--warning)",
      text: "var(--warning)",
    };
  }
  if (status === "CRITICAL" || status === "INFEASIBLE") {
    return {
      bg: "rgba(208, 59, 59, 0.2)",
      border: "var(--critical)",
      text: "var(--critical)",
    };
  }
  return {
    bg: "rgba(12, 163, 12, 0.2)",
    border: "var(--good)",
    text: "var(--good)",
  };
}

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
  panel.style.maxHeight = "80vh";
  panel.style.overflowY = "auto";
  feasibilityPanel = panel;

  toggleBtn.addEventListener("click", () => {
    if (typeof window !== "undefined") {
      (window as any).__RED_ROAD_SOUND__?.click?.();
    }
    isFeasibilityOpen = !isFeasibilityOpen;
    panel.style.display = isFeasibilityOpen ? "block" : "none";
    toggleBtn.className = isFeasibilityOpen ? "btn on" : "btn";
  });

  const content = document.createElement("div");
  content.className = "sec";

  // Section 1: Astronaut & Suit Profile
  const astroHeader = document.createElement("div");
  astroHeader.className = "sec-h";
  astroHeader.innerHTML = `<span>ASTRONAUT & SUIT PROFILE</span>`;
  content.appendChild(astroHeader);

  const astroBox = document.createElement("div");
  astroBox.className = "kv";

  const mkInput = (
    label: string,
    value: number,
    step: string,
    min: string,
    max: string,
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
    inp.min = min;
    inp.max = max;
    inp.value = String(value);
    inp.style.width = "70px";
    inp.style.background = "rgba(0,0,0,0.5)";
    inp.style.color = "var(--text)";
    inp.style.border = "1px solid var(--line)";
    inp.style.textAlign = "right";
    inp.style.padding = "2px 4px";
    inp.style.borderRadius = "3px";

    inp.addEventListener("change", () => {
      onChange(Number(inp.value));
      onConfigChange();
    });

    row.appendChild(lbl);
    row.appendChild(inp);
    return row;
  };

  astroBox.appendChild(
    mkInput(
      "Crew Mass (kg)",
      currentAstronautProfile.crewMassKg,
      "1.0",
      "40",
      "150",
      (v) => (currentAstronautProfile.crewMassKg = v),
    ),
  );
  astroBox.appendChild(
    mkInput(
      "Suit Mass (kg)",
      currentAstronautProfile.suitMassKg,
      "1.0",
      "50",
      "200",
      (v) => (currentAstronautProfile.suitMassKg = v),
    ),
  );
  astroBox.appendChild(
    mkInput(
      "Payload (kg)",
      currentAstronautProfile.payloadMassKg,
      "0.5",
      "0",
      "100",
      (v) => (currentAstronautProfile.payloadMassKg = v),
    ),
  );
  astroBox.appendChild(
    mkInput(
      "Usable O2 (g)",
      currentAstronautProfile.usableOxygenGrams,
      "10",
      "200",
      "3000",
      (v) => {
        currentAstronautProfile.usableOxygenGrams = v;
        currentOxygenConfig.supplyKg = v / 1000.0;
      },
    ),
  );
  astroBox.appendChild(
    mkInput(
      "O2 Reserve (%)",
      currentAstronautProfile.oxygenReserveFraction * 100,
      "1",
      "10",
      "50",
      (v) => {
        currentAstronautProfile.oxygenReserveFraction = v / 100.0;
        currentOxygenConfig.reserveFraction = v / 100.0;
      },
    ),
  );
  astroBox.appendChild(
    mkInput(
      "Max EVA (h)",
      currentAstronautProfile.maxEvaDurationMinutes / 60.0,
      "0.5",
      "1",
      "12",
      (v) => (currentAstronautProfile.maxEvaDurationMinutes = v * 60.0),
    ),
  );

  content.appendChild(astroBox);

  // Section 2: Traversal & Operational Parameters
  const travHeader = document.createElement("div");
  travHeader.className = "sec-h";
  travHeader.style.marginTop = "15px";
  travHeader.innerHTML = `<span>TRAVERSAL & SCIENCE TIME</span>`;
  content.appendChild(travHeader);

  const travBox = document.createElement("div");
  travBox.className = "kv";
  travBox.appendChild(
    mkInput(
      "Stationary Time (h)",
      currentTraversalConfig.stationaryTimeHours,
      "0.25",
      "0",
      "8",
      (v) => (currentTraversalConfig.stationaryTimeHours = v),
    ),
  );
  travBox.appendChild(
    mkInput(
      "Base Speed (km/h)",
      currentTraversalConfig.baseSpeedKmh,
      "0.1",
      "0.5",
      "5",
      (v) => (currentTraversalConfig.baseSpeedKmh = v),
    ),
  );
  content.appendChild(travBox);

  // Section 3: Feasibility & Bioenergetics Results
  const resultArea = document.createElement("div");
  resultArea.id = "feasibility-result";
  resultArea.style.marginTop = "15px";
  resultArea.innerHTML = `<div class="sub muted">Select start and end points to compute route and bioenergetics...</div>`;
  content.appendChild(resultArea);

  panel.appendChild(content);
  panelParent.appendChild(panel);
}

export function updateFeasibilityResultUI(result: EvaFeasibilityResult | any) {
  if (!feasibilityPanel) return;
  const resultArea = document.getElementById("feasibility-result");
  if (!resultArea) return;

  if (!result) {
    resultArea.innerHTML = `<div class="sub muted">Awaiting route calculation...</div>`;
    return;
  }

  // Handle rich EvaFeasibilityResult
  if (result.outbound && result.totalMissionDurationHours !== undefined) {
    const eva = result as EvaFeasibilityResult;

    const { bg: badgeBg, border: badgeBorder, text: badgeText } = getFeasibilityStatusStyle(eva.status);

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; border: 1px solid ${badgeBorder}; background: ${badgeBg}; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px;">
        <span style="font-weight: 700; font-size: 14px; letter-spacing: 1px;">EVA STATUS:</span>
        <span style="font-weight: 800; font-size: 15px; color: ${badgeText};">${eva.status}</span>
      </div>

      <div class="stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
        <div class="stat" style="background: rgba(0,0,0,0.3); padding: 6px; border-radius: 3px;">
          <div class="k" style="font-size: 11px;">ROUND-TRIP DURATION</div>
          <div class="v" style="font-size: 15px; color: ${eva.isDurationFeasible ? "var(--good)" : "var(--critical)"}">${formatEvaDuration(eva.totalMissionDurationMinutes)}</div>
          <div style="font-size: 10px; color: var(--text-3);">Limit: ${(eva.totalMissionDurationHours).toFixed(1)} / ${(currentAstronautProfile.maxEvaDurationMinutes / 60).toFixed(1)} h</div>
        </div>

        <div class="stat" style="background: rgba(0,0,0,0.3); padding: 6px; border-radius: 3px;">
          <div class="k" style="font-size: 11px;">O2 DRAW (ROUND-TRIP)</div>
          <div class="v" style="font-size: 15px; color: ${eva.isOxygenFeasible ? "var(--good)" : "var(--critical)"}">${(eva.totalMissionOxygenDrawGrams / 1000).toFixed(2)} <small>kg</small></div>
          <div style="font-size: 10px; color: var(--text-3);">Draw: ${eva.totalMissionOxygenDrawGrams.toFixed(0)}g / ${currentAstronautProfile.usableOxygenGrams.toFixed(0)}g</div>
        </div>

        <div class="stat" style="background: rgba(0,0,0,0.3); padding: 6px; border-radius: 3px;">
          <div class="k" style="font-size: 11px;">TOTAL ENERGY</div>
          <div class="v" style="font-size: 15px;">${eva.totalMissionEnergyKcal.toFixed(0)} <small>kcal</small></div>
          <div style="font-size: 10px; color: var(--text-3);">${(eva.totalMissionEnergyKJ).toFixed(0)} kJ total</div>
        </div>

        <div class="stat" style="background: rgba(0,0,0,0.3); padding: 6px; border-radius: 3px;">
          <div class="k" style="font-size: 11px;">O2 REMAINING MARGIN</div>
          <div class="v" style="font-size: 15px; color: ${eva.remainingOxygenGrams >= eva.configuredOxygenReserveGrams ? "var(--good)" : "var(--warning)"}">${(eva.remainingOxygenGrams - eva.configuredOxygenReserveGrams).toFixed(0)} <small>g</small></div>
          <div style="font-size: 10px; color: var(--text-3);">30% Reserve: ${eva.configuredOxygenReserveGrams.toFixed(0)}g</div>
        </div>
      </div>

      <div style="margin-bottom: 12px; font-size: 11px; background: rgba(255,154,60,0.06); border: 1px solid var(--line); border-radius: 4px; padding: 8px;">
        <div style="font-weight: 700; margin-bottom: 6px; color: var(--hud);">TRAVERSAL ASYMMETRY (OUTBOUND vs RETURN)</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>Outbound Traverse:</span>
          <span>${eva.outbound.totalTraversalDistance3DMeters.toFixed(0)}m | +${eva.outbound.totalElevationGainMeters.toFixed(0)}m / -${eva.outbound.totalElevationLossMeters.toFixed(0)}m | ${formatEvaDuration(eva.outbound.totalDurationMinutes)} | ${eva.outbound.estimatedTotalOxygenDrawGrams.toFixed(0)}g O2</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>Return Traverse:</span>
          <span>${eva.returnTraversal.totalTraversalDistance3DMeters.toFixed(0)}m | +${eva.returnTraversal.totalElevationGainMeters.toFixed(0)}m / -${eva.returnTraversal.totalElevationLossMeters.toFixed(0)}m | ${formatEvaDuration(eva.returnTraversal.totalDurationMinutes)} | ${eva.returnTraversal.estimatedTotalOxygenDrawGrams.toFixed(0)}g O2</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: var(--text-2); font-size: 10px; margin-top: 4px; border-top: 1px dashed rgba(255,154,60,0.2); padding-top: 4px;">
          <span>Metabolic Power:</span>
          <span>Mean ${eva.outbound.averageMetabolicPowerWatts.toFixed(0)} W | Peak ${Math.max(eva.outbound.peakMetabolicPowerWatts, eva.returnTraversal.peakMetabolicPowerWatts).toFixed(0)} W</span>
        </div>
      </div>

      <div style="margin-bottom: 10px; font-size: 11px; padding: 6px 8px; border-radius: 4px; background: ${eva.pointOfSafeReturnViolated ? "rgba(208, 59, 59, 0.15)" : "rgba(12, 163, 12, 0.1)"}; border: 1px solid ${eva.pointOfSafeReturnViolated ? "var(--critical)" : "var(--good)"};">
        <strong>POINT OF SAFE RETURN AUDIT:</strong><br/>
        ${eva.pointOfSafeReturnViolated 
          ? `⚠️ <span style="color:var(--critical);">Point of Safe Return breached at Waypoint #${eva.firstBreachIndex}! Reverse walkback exceeds emergency O2 reserves.</span>` 
          : `✓ <span style="color:var(--good);">Safe walkback to habitat verified at all ${eva.safeReturnTrace.length} waypoints.</span>`}
      </div>
    `;

    if (eva.constraintBreaches.length > 0) {
      html += `
        <div style="font-size: 11px; color: var(--critical); margin-bottom: 8px; background: rgba(208, 59, 59, 0.1); padding: 6px; border-radius: 3px;">
          <strong>CRITICAL BREACHES:</strong><br/>
          ${eva.constraintBreaches.map((c) => `• ${c}`).join("<br/>")}
        </div>
      `;
    }

    if (eva.warnings.length > 0) {
      html += `
        <div style="font-size: 11px; color: var(--warning); margin-bottom: 8px; background: rgba(250, 178, 25, 0.1); padding: 6px; border-radius: 3px;">
          <strong>OPERATIONAL ADVISORIES:</strong><br/>
          ${eva.warnings.map((w) => `• ${w}`).join("<br/>")}
        </div>
      `;
    }

    if (eva.reasons.length > 0) {
      html += `
        <div style="font-size: 11px; color: var(--text-2); margin-bottom: 8px;">
          <strong>ASSESSMENT SUMMARY:</strong><br/>
          ${eva.reasons.map((r) => `• ${r}`).join("<br/>")}
        </div>
      `;
    }

    html += `
      <div style="font-size: 9px; color: var(--text-3); margin-top: 10px; border-top: 1px solid var(--line); padding-top: 6px; font-style: italic;">
        <strong>SCIENTIFIC NOTICE:</strong> ${eva.uncertaintyNotice || "Bioenergetic estimates derived from Minetti (2002) Mars-adjusted polynomial and Tobler walking speeds. Does NOT represent certified NASA flight clearance. Suit leakage (100 sccm) is unverified."}
      </div>
    `;

    resultArea.innerHTML = html;
    return;
  }

  // Graceful fallback for legacy feasibility results
  const { status, oxygen, environment, reasons, warnings, uncertainties } = result;

  let statusColor = "var(--good)";
  if (status === "INFEASIBLE") statusColor = "var(--critical)";
  if (status === "CONDITIONAL") statusColor = "var(--warning)";

  let html = `
    <div class="sec-h" style="color: ${statusColor}; border-bottom-color: ${statusColor}">STATUS: ${status}</div>
    <div class="stats" style="margin-top: 10px; margin-bottom: 10px;">
      <div class="stat"><div class="k">O2 REMAINING</div><div class="v" style="color:${oxygen?.isSufficient ? "var(--good)" : "var(--critical)"}">${oxygen?.remainingKg?.toFixed(1) ?? "--"}<small>kg</small></div></div>
      <div class="stat"><div class="k">O2 MARGIN</div><div class="v">${oxygen?.marginAfterReserveKg?.toFixed(1) ?? "--"}<small>kg</small></div></div>
      <div class="stat"><div class="k">SURFACE TEMP</div><div class="v" style="color:${environment?.isWithinLimits ? "var(--good)" : "var(--critical)"}">${environment?.conditions?.surfaceTemperatureC ?? "--"}<small>°C</small></div></div>
    </div>
    <div class="sub" style="font-size:12px; margin-bottom: 5px;">
      <strong>REASONS:</strong><br/>
      ${(reasons || []).map((r: string) => `• ${r}`).join("<br/>")}
    </div>
  `;

  if (warnings && warnings.length > 0) {
    html += `<div class="sub" style="font-size:12px; color: var(--warning); margin-bottom: 5px;">
      <strong>WARNINGS:</strong><br/>
      ${warnings.map((w: string) => `• ${w}`).join("<br/>")}
    </div>`;
  }

  if (uncertainties && uncertainties.length > 0) {
    html += `<div class="sub muted" style="font-size:10px; margin-top: 10px;">
      <strong>UNCERTAINTIES:</strong><br/>
      ${uncertainties.map((u: string) => `• ${u}`).join("<br/>")}
    </div>`;
  }

  resultArea.innerHTML = html;
}
