import { MISSION_DEFAULT_PRIORITIES } from "../config/index";
import { type Priorities } from "../interfaces/index";
import { requestAndDrawRoute, sound } from "../main";
import { sendCopilotMessage } from "../services/api.service";
import {
  appState,
  currentOxygenConfig,
  currentTraversalConfig,
} from "../state/app.state";
import { appendChatMessage, buildCopilotUI } from "./copilot.ui";
import { buildMissionFeasibilityUI } from "./feasibility.ui";

let isSuppressingSliderReplan = false;
let sliderDebounceTimer: number = 0;

export function loadMissionDefaults(mission: string) {
  const defaults = MISSION_DEFAULT_PRIORITIES[mission];
  if (!defaults) return;
  appState.currentPriorities = { ...defaults };
  isSuppressingSliderReplan = true;
  for (const key of Object.keys(defaults) as Array<keyof Priorities>) {
    if (appState.sliderElements[key]) {
      const pct = Math.round(defaults[key] * 100);
      appState.sliderElements[key].slider.value = String(pct);
      appState.sliderElements[key].valueLabel.textContent = `${pct}%`;
    }
  }
  isSuppressingSliderReplan = false;
}

export function normalizeAndSync(changedKey: keyof Priorities) {
  const changedValue = parseInt(
    appState.sliderElements[changedKey].slider.value,
    10,
  );
  const otherKeys = (
    Object.keys(appState.currentPriorities) as Array<keyof Priorities>
  ).filter((k) => k !== changedKey);

  const remainder = 100 - changedValue;
  const otherSum = otherKeys.reduce(
    (sum, k) => sum + parseInt(appState.sliderElements[k].slider.value, 10),
    0,
  );

  if (otherSum === 0) {
    const each = Math.floor(remainder / otherKeys.length);
    let leftover = remainder - each * otherKeys.length;
    for (const k of otherKeys) {
      const v = each + (leftover > 0 ? 1 : 0);
      leftover--;
      appState.sliderElements[k].slider.value = String(v);
      appState.sliderElements[k].valueLabel.textContent = `${v}%`;
      appState.currentPriorities[k] = v / 100;
    }
  } else {
    let assigned = 0;
    for (let i = 0; i < otherKeys.length; i++) {
      const k = otherKeys[i];
      const oldVal = parseInt(appState.sliderElements[k].slider.value, 10);
      let newVal: number;
      if (i === otherKeys.length - 1) {
        newVal = remainder - assigned;
      } else {
        newVal = Math.round((oldVal / otherSum) * remainder);
      }
      newVal = Math.max(0, Math.min(100, newVal));
      assigned += newVal;
      appState.sliderElements[k].slider.value = String(newVal);
      appState.sliderElements[k].valueLabel.textContent = `${newVal}%`;
      appState.currentPriorities[k] = newVal / 100;
    }
  }

  appState.currentPriorities[changedKey] = changedValue / 100;
}

export function buildControlPanel(): void {
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "btn-priorities-toggle";
  toggleBtn.className = "btn";
  toggleBtn.innerHTML = "PRIORITIES";
  toggleBtn.style.pointerEvents = "auto";
  appState.zonePriorities!.appendChild(toggleBtn);

  const panel = document.createElement("div");
  panel.id = "control-panel";
  panel.className = "panel";
  panel.style.display = "none";
  panel.style.pointerEvents = "auto";
  appState.zonePriorities!.appendChild(panel);

  toggleBtn.addEventListener("click", () => {
    sound.click();
    appState.isPrioritiesOpen = !appState.isPrioritiesOpen;
    panel.style.display = appState.isPrioritiesOpen ? "block" : "none";
    toggleBtn.className = appState.isPrioritiesOpen ? "btn on" : "btn";
  });

  const content = document.createElement("div");
  content.className = "sec";

  const header = document.createElement("div");
  header.className = "sec-h";
  header.innerHTML = `<span>RED ROAD</span><span class="tag">MARS ROUTE PLANNER</span>`;
  content.appendChild(header);

  const missionLabel = document.createElement("div");
  missionLabel.className = "sub muted";
  missionLabel.textContent = "MISSION TYPE";
  missionLabel.style.fontSize = "10px";
  missionLabel.style.fontWeight = "700";
  missionLabel.style.letterSpacing = "0.1em";
  content.appendChild(missionLabel);

  const select = document.createElement("select");
  select.id = "mission-select";
  select.style.width = "100%";
  select.style.padding = "4px 8px";
  select.style.background = "rgba(0,0,0,0.5)";
  select.style.color = "var(--text)";
  select.style.border = "1px solid var(--line)";
  select.style.marginBottom = "16px";
  select.style.marginTop = "6px";
  select.style.fontFamily = "var(--ui)";

  const options: Array<{ value: string; label: string }> = [
    { value: "HUMAN_EXPLORATION", label: "Human Exploration" },
    { value: "SCIENTIFIC_RESEARCH", label: "Scientific Research" },
    { value: "RAPID_TRANSIT", label: "Rapid Transit" },
  ];

  for (const opt of options) {
    const optionEl = document.createElement("option");
    optionEl.value = opt.value;
    optionEl.textContent = opt.label;
    if (opt.value === appState.selectedMission) optionEl.selected = true;
    select.appendChild(optionEl);
  }

  select.addEventListener("change", async (e) => {
    appState.selectedMission = (e.target as HTMLSelectElement).value;
    loadMissionDefaults(appState.selectedMission);
    if (appState.selectedStart && appState.selectedEnd) {
      await requestAndDrawRoute();
    }
  });
  content.appendChild(select);

  const pLabel = document.createElement("div");
  pLabel.className = "sub muted";
  pLabel.textContent = "PRIORITY WEIGHTS";
  pLabel.style.fontSize = "10px";
  pLabel.style.fontWeight = "700";
  pLabel.style.letterSpacing = "0.1em";
  content.appendChild(pLabel);

  const defs = [
    { key: "safety", label: "Safety (Terrain)" },
    { key: "slope", label: "Slope/Incline" },
    { key: "distance", label: "Distance" },
    { key: "science", label: "Scientific Value" },
  ];

  for (const def of defs) {
    const row = document.createElement("div");
    row.className = "ctl";

    const nameEl = document.createElement("label");
    nameEl.textContent = def.label;

    const valueEl = document.createElement("output");
    valueEl.textContent = `${Math.round(appState.currentPriorities[def.key as keyof Priorities] * 100)}%`;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = String(
      Math.round(appState.currentPriorities[def.key as keyof Priorities] * 100),
    );

    appState.sliderElements[def.key] = { slider, valueLabel: valueEl };

    slider.addEventListener("input", () => {
      normalizeAndSync(def.key as keyof Priorities);
      if (
        !isSuppressingSliderReplan &&
        appState.selectedStart &&
        appState.selectedEnd
      ) {
        clearTimeout(sliderDebounceTimer);
        sliderDebounceTimer = window.setTimeout(() => {
          requestAndDrawRoute();
        }, 400);
      }
    });

    row.appendChild(nameEl);
    row.appendChild(valueEl);
    row.appendChild(slider);
    content.appendChild(row);
  }

  const resetBtn = document.createElement("button");
  resetBtn.id = "reset-priorities";
  resetBtn.className = "btn ghost";
  resetBtn.style.width = "100%";
  resetBtn.style.marginTop = "10px";
  resetBtn.textContent = "RESET TO DEFAULTS";
  resetBtn.addEventListener("click", async () => {
    sound.click();
    loadMissionDefaults(appState.selectedMission);
    if (appState.selectedStart && appState.selectedEnd) {
      await requestAndDrawRoute();
    }
  });
  content.appendChild(resetBtn);
  panel.appendChild(content);

  buildMissionFeasibilityUI(
    appState.zoneFeasibility!,
    appState.zoneFeasibility!,
    async () => {
      if (appState.selectedStart && appState.selectedEnd) {
        await requestAndDrawRoute();
      }
    },
  );

  buildCopilotUI(
    appState.zoneCopilot!,
    appState.zoneCopilot!,
    async (msg: string) => {
      try {
        const data = await sendCopilotMessage(msg, {
          priorities: appState.currentPriorities,
          oxygenConfig: currentOxygenConfig,
          traversalConfig: currentTraversalConfig,
          route:
            appState.selectedStart && appState.selectedEnd
              ? {
                  start: appState.selectedStart,
                  destination: appState.selectedEnd,
                  distanceKm:
                    (window as any).currentRouteMetrics?.distanceKm || null,
                  status: "calculated",
                }
              : { status: "No route currently selected" },
        });

        appendChatMessage("AI", data.text);

        let changed = false;
        if (data.updates) {
          if (data.updates.priorities) {
            Object.assign(appState.currentPriorities, data.updates.priorities);
            for (const key of Object.keys(appState.currentPriorities)) {
              if (appState.sliderElements[key]) {
                appState.sliderElements[key].slider.value = String(
                  Math.round(
                    appState.currentPriorities[key as keyof Priorities] * 100,
                  ),
                );
                appState.sliderElements[key].valueLabel.textContent =
                  `${Math.round(appState.currentPriorities[key as keyof Priorities] * 100)}%`;
              }
            }
            changed = true;
          }
          if (data.updates.oxygenConfig) {
            Object.assign(currentOxygenConfig, data.updates.oxygenConfig);
            changed = true;
          }
          if (data.updates.traversalConfig) {
            Object.assign(currentTraversalConfig, data.updates.traversalConfig);
            changed = true;
          }
        }

        if (
          (changed || data.action === "createRoute") &&
          appState.selectedStart &&
          appState.selectedEnd
        ) {
          const success = await requestAndDrawRoute();
          if (!success && changed) {
            appendChatMessage(
              "SYSTEM",
              "Failed to calculate a valid route with the new configuration.",
            );
          } else if (success && data.action === "createRoute") {
            appendChatMessage("SYSTEM", "Route calculated successfully.");
          } else if (!success && data.action === "createRoute") {
            appendChatMessage(
              "SYSTEM",
              "Could not find a valid path between the selected points.",
            );
          }
        } else if (data.action === "createRoute") {
          appendChatMessage(
            "SYSTEM",
            "Please select both a start and destination point on the map first to calculate a route.",
          );
        }
      } catch (e) {
        console.error("Copilot error:", e);
        appendChatMessage(
          "AI",
          "Sorry, an error occurred while connecting to the copilot.",
        );
      }
    },
  );
}
