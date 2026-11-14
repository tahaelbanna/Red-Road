import { type ScientificTarget } from "../interfaces/index";
import { sound } from "../main";
import { focusTarget } from "../scene/camera-controller";
import { appState } from "../state/app.state";
import { getTargetPresentation } from "../utils/target-format.util";
import { showTargetDetails } from "./target-details.ui";

export function buildScientificExplorer(): void {
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "btn-explorer-toggle";
  toggleBtn.innerHTML = "SCIENTIFIC EXPLORER";
  toggleBtn.className = "btn";
  toggleBtn.style.pointerEvents = "auto";
  appState.zoneExplorer!.appendChild(toggleBtn);

  const panel = document.createElement("div");
  panel.id = "explorer-panel";
  panel.className = "panel";
  panel.style.display = "none";
  panel.style.flexDirection = "column";
  panel.style.pointerEvents = "auto";
  panel.style.flex = "1";
  panel.style.minHeight = "0";
  panel.style.width = "100%";
  panel.style.position = "relative";
  panel.style.top = "auto";
  panel.style.maxHeight = "none";
  appState.zoneExplorer!.appendChild(panel);

  const header = document.createElement("div");
  header.className = "sec sec-h";
  header.style.marginBottom = "0";

  const title = document.createElement("div");
  title.innerHTML = "SCIENTIFIC EXPLORER";
  header.appendChild(title);

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "×";
  closeBtn.className = "btn ghost small";
  closeBtn.onclick = () => {
    appState.isExplorerOpen = false;
    panel.style.display = "none";
    toggleBtn.className = "btn";
  };
  header.appendChild(closeBtn);
  panel.appendChild(header);

  const searchDiv = document.createElement("div");
  searchDiv.className = "sec";
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search scientific target...";
  searchInput.style.width = "100%";
  searchInput.style.padding = "4px 8px";
  searchInput.style.background = "rgba(0,0,0,0.5)";
  searchInput.style.color = "var(--text)";
  searchInput.style.border = "1px solid var(--line)";
  searchInput.style.fontFamily = "var(--ui)";
  searchDiv.appendChild(searchInput);
  panel.appendChild(searchDiv);

  const listContainer = document.createElement("div");
  listContainer.className = "rows";
  listContainer.style.flex = "1";
  listContainer.style.minHeight = "0";
  listContainer.style.overflowY = "auto";
  listContainer.style.padding = "8px";
  panel.appendChild(listContainer);

  const renderList = (query: string = "") => {
    listContainer.innerHTML = "";
    const q = query.toLowerCase();

    const regions = appState.loadedTargets.filter(
      (t) => t.category === "region" && t.name.toLowerCase().includes(q),
    );
    const points = appState.loadedTargets.filter(
      (t) => t.category === "point" && t.name.toLowerCase().includes(q),
    );

    if (regions.length === 0 && points.length === 0) {
      listContainer.innerHTML = `<div class="sub muted" style="text-align:center;padding:20px">No scientific targets found.</div>`;
      return;
    }

    const createItem = (t: ScientificTarget) => {
      const item = document.createElement("div");
      const isSelected = t.id === appState.selectedTargetId;
      item.className = "row" + (isSelected ? " sel" : "");

      const { explorerSubtitle: dsText } = getTargetPresentation(t);

      item.innerHTML = `
              <div class="nm" style="flex:1">${t.name} ${isSelected ? "✓" : ""}</div>
              <div class="ds">${dsText}</div>
          `;

      item.onclick = () => {
        focusTarget(t);
        showTargetDetails(t);
        renderList(searchInput.value);
      };
      return item;
    };

    if (regions.length > 0) {
      const h = document.createElement("div");
      h.innerHTML = "Regions & Areas";
      h.className = "sub muted";
      h.style.padding = "4px 8px";
      listContainer.appendChild(h);
      regions.forEach((t) => listContainer.appendChild(createItem(t)));
    }

    if (points.length > 0) {
      const h = document.createElement("div");
      h.innerHTML = "Point Targets";
      h.className = "sub muted";
      h.style.padding = "4px 8px";
      listContainer.appendChild(h);
      points.forEach((t) => listContainer.appendChild(createItem(t)));
    }
  };

  searchInput.addEventListener("input", (e) => {
    renderList((e.target as HTMLInputElement).value);
  });

  toggleBtn.addEventListener("click", () => {
    sound.click();
    appState.isExplorerOpen = !appState.isExplorerOpen;
    if (appState.isExplorerOpen) {
      panel.style.display = "flex";
      toggleBtn.className = "btn on";
      renderList(searchInput.value);
    } else {
      panel.style.display = "none";
      toggleBtn.className = "btn";
    }
  });

  (window as any).refreshScientificExplorer = (_query: string) => {
    if (appState.isExplorerOpen) renderList(searchInput.value);
  };
}
