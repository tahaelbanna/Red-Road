import { appState } from "../state/app.state";

export function enableFocusMode() {
  appState.isFocusMode = true;
  appState.nearbyContextOn = false;
  appState.lastLayoutTime = 0;

  if (!appState.focusModeIndicator) {
    const indicator = document.createElement("div");
    indicator.className = "topbar";
    indicator.style.background = "none";
    indicator.style.top = "64px";
    indicator.style.justifyContent = "center";
    indicator.style.pointerEvents = "none";
    indicator.style.zIndex = "1000";

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "16px";
    container.style.pointerEvents = "auto";
    container.style.background = "var(--panel)";
    container.style.border = "1px solid var(--hud-dim)";
    container.style.padding = "6px 16px";
    container.style.clipPath =
      "polygon(var(--cut) 0, 100% 0, 100% calc(100% - var(--cut)), calc(100% - var(--cut)) 100%, 0 100%, 0 var(--cut))";

    const label = document.createElement("div");
    label.className = "sec-h";
    label.style.marginBottom = "0";
    label.innerHTML = "FOCUS MODE";

    const toggleContainer = document.createElement("div");
    toggleContainer.className = "layer";
    toggleContainer.style.padding = "4px 8px";
    toggleContainer.innerHTML = `<div class="box"></div><div class="nm">Nearby Context</div>`;

    toggleContainer.onclick = (e) => {
      e.stopPropagation();
      appState.nearbyContextOn = !appState.nearbyContextOn;
      toggleContainer.className = appState.nearbyContextOn
        ? "layer on"
        : "layer";
      appState.lastLayoutTime = 0;
    };

    const exitBtn = document.createElement("button");
    exitBtn.className = "btn ghost small";
    exitBtn.style.color = "var(--critical)";
    exitBtn.innerHTML = "EXIT";

    exitBtn.onclick = () => {
      disableFocusMode();
    };

    container.appendChild(label);
    container.appendChild(toggleContainer);
    container.appendChild(exitBtn);
    indicator.appendChild(container);
    document.body.appendChild(indicator);
    appState.focusModeIndicator = indicator;
  }
  appState.focusModeIndicator.style.display = "flex";

  const toggleContainer = appState.focusModeIndicator.children[0].children[1];
  toggleContainer.className = "layer";
}

export function disableFocusMode() {
  appState.isFocusMode = false;
  appState.nearbyContextOn = false;
  appState.lastLayoutTime = 0;
  if (appState.focusModeIndicator) {
    appState.focusModeIndicator.style.display = "none";
  }
}
