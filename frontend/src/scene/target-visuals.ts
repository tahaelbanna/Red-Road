import * as THREE from "three";
import { type ScientificTarget } from "../interfaces/index";
import { appState } from "../state/app.state";
import { showTargetDetails } from "../ui/target-details.ui";
import { focusCluster, focusTarget } from "./camera-controller";

export function initTargetOverlayPools() {
  const targetSvgOverlay = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  targetSvgOverlay.style.position = "absolute";
  targetSvgOverlay.style.top = "0";
  targetSvgOverlay.style.left = "0";
  targetSvgOverlay.style.width = "100%";
  targetSvgOverlay.style.height = "100%";
  targetSvgOverlay.style.pointerEvents = "none";
  targetSvgOverlay.style.zIndex = "10";
  document.body.appendChild(targetSvgOverlay);
  appState.targetSvgOverlay = targetSvgOverlay;

  const targetLabelsContainer = document.createElement("div");
  targetLabelsContainer.style.position = "absolute";
  targetLabelsContainer.style.top = "0";
  targetLabelsContainer.style.left = "0";
  targetLabelsContainer.style.width = "100%";
  targetLabelsContainer.style.height = "100%";
  targetLabelsContainer.style.pointerEvents = "none";
  targetLabelsContainer.style.zIndex = "11";
  targetLabelsContainer.style.fontFamily =
    "'Inter', 'Segoe UI', system-ui, sans-serif";
  document.body.appendChild(targetLabelsContainer);
  appState.targetLabelsContainer = targetLabelsContainer;

  for (let i = 0; i < 100; i++) {
    const callout = document.createElement("div");
    callout.style.position = "absolute";
    targetLabelsContainer.appendChild(callout);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    targetSvgOverlay.appendChild(line);

    appState.targetVisualsPool.push({ callout, line, inUse: false });

    const cel = document.createElement("div");
    cel.style.position = "absolute";
    targetLabelsContainer.appendChild(cel);
    appState.clusterVisualsPool.push({ el: cel, inUse: false });
  }
}

export function updateTargetVisuals(camera: THREE.PerspectiveCamera) {
  if (!appState.targetLabelsContainer) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const camDist = appState.mainControls
    ? appState.mainCamera!.position.distanceTo(appState.mainControls.target)
    : 100;

  const now = performance.now();
  if (now - appState.lastLayoutTime > 50) {
    appState.lastLayoutTime = now;

    const pointTargets: any[] = [];
    const regionTargets: any[] = [];

    let selectedMesh: THREE.Mesh | null = null;
    if (
      appState.isFocusMode &&
      !appState.nearbyContextOn &&
      appState.selectedTargetId
    ) {
      selectedMesh =
        appState.targetMeshes.find(
          (m) =>
            (m.userData.target as ScientificTarget).id ===
            appState.selectedTargetId,
        ) || null;
    }

    appState.targetMeshes.forEach((mesh) => {
      const t = mesh.userData.target as ScientificTarget;
      const pos = mesh.position.clone();
      pos.project(camera);
      if (pos.z > 1) {
        mesh.visible = false;
        return;
      }

      if (selectedMesh && t.id !== appState.selectedTargetId) {
        const dist = mesh.position.distanceTo(selectedMesh.position);
        if (dist < 60) {
          mesh.visible = false;
          return;
        }
      }

      mesh.visible = true;
      const x = (pos.x * 0.5 + 0.5) * w;
      const y = -(pos.y * 0.5 - 0.5) * h;
      const pt = { mesh, target: t, x, y };
      if (t.category === "region") regionTargets.push(pt);
      else pointTargets.push(pt);
    });

    const threshold = camDist > 100 ? 50 : camDist > 40 ? 30 : 15;

    const clusterList = (list: any[]) => {
      const clusters: any[] = [];
      for (const pt of list) {
        let added = false;
        for (const c of clusters) {
          if (Math.hypot(pt.x - c.cx, pt.y - c.cy) < threshold) {
            c.targets.push(pt);
            c.cx =
              c.targets.reduce((s: number, a: any) => s + a.x, 0) /
              c.targets.length;
            c.cy =
              c.targets.reduce((s: number, a: any) => s + a.y, 0) /
              c.targets.length;
            if (pt.target.id === appState.selectedTargetId)
              c.hasSelected = true;
            added = true;
            break;
          }
        }
        if (!added) {
          clusters.push({
            targets: [pt],
            cx: pt.x,
            cy: pt.y,
            hasSelected: pt.target.id === appState.selectedTargetId,
          });
        }
      }
      return clusters;
    };

    appState.layoutCache.points = clusterList(pointTargets);
    appState.layoutCache.regions = clusterList(regionTargets);
  }

  appState.targetVisualsPool.forEach((v) => {
    v.inUse = false;
    v.callout.style.display = "none";
    v.line.style.display = "none";
  });
  appState.clusterVisualsPool.forEach((v) => {
    v.inUse = false;
    v.el.style.display = "none";
  });

  let tvIdx = 0;
  let cvIdx = 0;

  // Render Regions
  for (const c of appState.layoutCache.regions) {
    const isMulti = c.targets.length > 1 && !c.hasSelected;
    if (isMulti) {
      c.targets.forEach((t: any) => (t.mesh.visible = false));
      const v = appState.clusterVisualsPool[cvIdx++];
      if (!v) continue;
      v.inUse = true;
      v.el.style.display = "block";
      v.el.style.left = `${c.cx}px`;
      v.el.style.top = `${c.cy}px`;
      v.el.style.transform = "translate(-50%, -50%)";
      v.el.style.background = "var(--panel)";
      v.el.style.border = "1px solid var(--line)";
      v.el.style.color = "var(--text)";
      v.el.style.borderRadius = "4px";
      v.el.style.padding = "2px 6px";
      v.el.style.fontSize = "10px";
      v.el.style.cursor = "pointer";
      v.el.style.pointerEvents = "auto";
      v.el.innerHTML = `◇ ${c.targets.length}`;
      v.el.onpointerdown = (e) => {
        e.stopPropagation();
        focusCluster(c.targets.map((pt: any) => pt.target));
      };
    } else {
      for (const pt of c.targets) {
        pt.mesh.visible = true;
        const v = appState.targetVisualsPool[tvIdx++];
        if (!v) continue;
        v.inUse = true;
        v.callout.style.display = "block";
        v.line.style.display = "none";
        v.callout.style.left = `${pt.x}px`;
        v.callout.style.top = `${pt.y}px`;
        v.callout.style.transform = "translate(-50%, -50%)";

        const isSelected = pt.target.id === appState.selectedTargetId;
        v.callout.style.background = isSelected
          ? "var(--hud-faint)"
          : "transparent";
        v.callout.style.border = isSelected ? "1px solid var(--hud)" : "none";
        v.callout.style.padding = isSelected ? "4px 8px" : "4px";
        v.callout.style.borderRadius = "4px";
        v.callout.style.color = "var(--text)";
        v.callout.style.fontSize = "11px";
        v.callout.style.cursor = "pointer";
        v.callout.style.pointerEvents = "auto";
        v.callout.style.zIndex = isSelected ? "100" : "10";

        const baseHtml = isSelected
          ? `<div style="font-weight:bold">◇ ${pt.target.name}</div>`
          : `<div style="font-size:16px">◇</div>`;
        v.callout.innerHTML = baseHtml;

        v.callout.onpointerenter = () => {
          v.callout.style.background = "var(--hud-faint)";
          v.callout.innerHTML = `<div style="font-weight:bold">◇ ${pt.target.name}</div><div style="font-size:8px;color:var(--text-3)">Region</div>`;
          v.callout.style.zIndex = "100";
        };
        v.callout.onpointerleave = () => {
          v.callout.style.background = isSelected
            ? "var(--hud-faint)"
            : "transparent";
          v.callout.innerHTML = baseHtml;
          v.callout.style.zIndex = isSelected ? "100" : "10";
        };
        v.callout.onpointerdown = (e) => {
          e.stopPropagation();
          focusTarget(pt.target);
          showTargetDetails(pt.target);
        };
      }
    }
  }

  // Render Points
  for (const c of appState.layoutCache.points) {
    const isMulti = c.targets.length > 1 && !c.hasSelected;
    if (isMulti) {
      c.targets.forEach((t: any) => (t.mesh.visible = false));
      const v = appState.clusterVisualsPool[cvIdx++];
      if (!v) continue;
      v.inUse = true;
      v.el.style.display = "block";
      v.el.style.left = `${c.cx}px`;
      v.el.style.top = `${c.cy}px`;
      v.el.style.transform = "translate(-50%, -50%)";
      v.el.style.background = "var(--panel)";
      v.el.style.border = "1px solid var(--hud-dim)";
      v.el.style.color = "var(--hud)";
      v.el.style.borderRadius = "12px";
      v.el.style.padding = "2px 8px";
      v.el.style.fontSize = "10px";
      v.el.style.cursor = "pointer";
      v.el.style.pointerEvents = "auto";
      v.el.innerHTML = `● ${c.targets.length}`;
      v.el.onpointerdown = (e) => {
        e.stopPropagation();
        focusCluster(c.targets.map((pt: any) => pt.target));
      };
    } else {
      for (const pt of c.targets) {
        pt.mesh.visible = true;
        const v = appState.targetVisualsPool[tvIdx++];
        if (!v) continue;
        v.inUse = true;
        v.callout.style.display = "block";
        v.line.style.display = "none";
        v.callout.style.left = `${pt.x}px`;
        v.callout.style.top = `${pt.y}px`;
        v.callout.style.transform = "translate(-50%, -50%)";

        const isSelected = pt.target.id === appState.selectedTargetId;
        const iconColor =
          pt.target.position_accuracy === "published"
            ? "var(--warning)"
            : "var(--critical)";

        v.callout.style.background = isSelected
          ? "var(--panel)"
          : "transparent";
        v.callout.style.border = isSelected ? "1px solid var(--hud)" : "none";
        v.callout.style.padding = isSelected ? "4px 8px" : "4px";
        v.callout.style.borderRadius = "12px";
        v.callout.style.color = "var(--text)";
        v.callout.style.fontSize = "11px";
        v.callout.style.cursor = "pointer";
        v.callout.style.pointerEvents = "auto";
        v.callout.style.zIndex = isSelected ? "100" : "10";

        const baseHtml = isSelected
          ? `<div style="display:flex;align-items:center;gap:4px"><span style="color:${iconColor}">●</span> <b>${pt.target.name}</b></div>`
          : `<div style="color:${iconColor};font-size:14px;text-shadow: 0 0 4px #000">●</div>`;

        v.callout.innerHTML = baseHtml;

        v.callout.onpointerenter = () => {
          v.callout.style.background = "var(--panel)";
          v.callout.innerHTML = `<div style="display:flex;align-items:center;gap:4px"><span style="color:${iconColor}">●</span> <b>${pt.target.name}</b></div><div style="font-size:8px;color:var(--text-3);margin-top:2px">${pt.target.position_accuracy === "published" ? "Published" : "Representative"}</div>`;
          v.callout.style.zIndex = "100";
        };
        v.callout.onpointerleave = () => {
          v.callout.style.background = isSelected
            ? "var(--panel)"
            : "transparent";
          v.callout.innerHTML = baseHtml;
          v.callout.style.zIndex = isSelected ? "100" : "10";
        };
        v.callout.onpointerdown = (e) => {
          e.stopPropagation();
          focusTarget(pt.target);
          showTargetDetails(pt.target);
        };
      }
    }
  }
}
