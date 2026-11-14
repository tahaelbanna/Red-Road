import { appState } from "../state/app.state";

export function initRightUI() {
  if (appState.uiOverlayRight) return;
  const uiOverlayRight = document.createElement("div");
  uiOverlayRight.id = "ui-overlay-right";
  uiOverlayRight.style.position = "fixed";
  uiOverlayRight.style.top = "12px";
  uiOverlayRight.style.right = "12px";
  uiOverlayRight.style.bottom = "12px";
  uiOverlayRight.style.display = "flex";
  uiOverlayRight.style.gap = "16px";
  uiOverlayRight.style.pointerEvents = "none";
  uiOverlayRight.style.zIndex = "999";
  appState.uiOverlayRight = uiOverlayRight;

  const createZone = (id: string, width: string) => {
    const z = document.createElement("div");
    z.id = id;
    z.style.display = "flex";
    z.style.flexDirection = "column";
    z.style.alignItems = "flex-end";
    z.style.gap = "12px";
    z.style.width = width;
    z.style.height = "100%";
    z.style.pointerEvents = "none";
    uiOverlayRight.appendChild(z);
    return z;
  };

  appState.zonePriorities = createZone("zone-priorities", "280px");
  appState.zoneFeasibility = createZone("zone-feasibility", "280px");
  appState.zoneCopilot = createZone("zone-copilot", "280px");
  appState.zoneExplorer = createZone("zone-explorer", "340px");

  document.body.appendChild(uiOverlayRight);

  const style = document.createElement("style");
  style.textContent = `
        @media (max-width: 1300px) {
            #ui-overlay-right {
                flex-direction: column;
                width: 320px;
                right: 12px;
            }
            #mission-zone {
                width: 320px;
            }
            #ui-overlay-left {
                width: 320px;
            }
        }
        @media (max-width: 760px) {
            #ui-overlay-right {
                right: 10px;
                top: 80px;
                width: calc(100vw - 20px);
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            }
            #mission-zone, #right-context-zone {
                width: 100% !important;
                align-items: stretch !important;
            }
            #ui-overlay-left {
                left: 10px;
                top: auto;
                bottom: 20px;
                width: calc(100vw - 20px) !important;
                z-index: 100;
            }
            #route-report-panel, #target-details-panel {
                bottom: 20px !important;
                top: auto !important;
                width: calc(100vw - 20px) !important;
                left: 10px !important;
                transform: none !important;
                margin: 0 !important;
            }
            .panel {
                width: 100% !important;
                margin: 0 !important;
            }
        }
    `;
  document.head.appendChild(style);
}
