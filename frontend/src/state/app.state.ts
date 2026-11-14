import * as THREE from "three";
import { MISSION_DEFAULT_PRIORITIES } from "../config/index";
import {
  type AstronautProfile,
  type EnvironmentalLimits,
  type EvaFeasibilityResult,
  type HeightmapMeta,
  type OxygenBudgetConfig,
  type Priorities,
  type ScientificTarget,
  type TraversalConfig,
} from "../interfaces/index";

export const currentAstronautProfile: AstronautProfile = {
  crewMassKg: 80.0,
  suitMassKg: 120.0,
  payloadMassKg: 15.0,
  effectiveMassFactor: 0.70,
  nominalWalkingSpeedMps: 1.00,
  maxWalkingSpeedMps: 1.20,
  minWalkingSpeedMps: 0.30,
  internalWorkFraction: 0.40,
  suitJointWorkNominalWatts: 65.0,
  basalMetabolicRatePerKg: 1.20,
  suitLeakageRateLpm: 0.10,
  usableOxygenGrams: 1000.0,
  oxygenReserveFraction: 0.30,
  maxEvaDurationMinutes: 480.0,
  maxContinuousPowerWatts: 450.0,
  peakRedLinePowerWatts: 650.0,
  defaultTerrainImpedance: 1.15,
};

export const currentOxygenConfig: OxygenBudgetConfig = {
  supplyKg: 0.55,
  reserveFraction: 0.2,
  consumptionRateKgPerHour: 0.086,
};

export const currentEnvLimits: EnvironmentalLimits = {
  minOperatingTempC: -80,
  maxOperatingTempC: -20,
};

export const currentTraversalConfig: TraversalConfig = {
  baseSpeedKmh: 1.5,
  stationaryTimeHours: 0.0,
};

export const appState = {
  renderer: null as unknown as THREE.WebGLRenderer,
  scene: null as unknown as THREE.Scene,
  terrainMesh: null as unknown as THREE.Mesh,
  mainCamera: null as THREE.PerspectiveCamera | null,
  mainControls: null as any,
  jezeroAbortController: null as AbortController | null,
  isJezeroActive: false,

  heightmapPixels: null as unknown as Float32Array,
  heightmapMeta: null as unknown as HeightmapMeta,
  heightScaleUnits: 0,

  loadedTargets: [] as ScientificTarget[],
  targetMeshes: [] as THREE.Mesh[],
  targetLabelsContainer: null as HTMLDivElement | null,
  targetSvgOverlay: null as SVGSVGElement | null,
  targetVisualsPool: [] as {
    callout: HTMLDivElement;
    line: SVGLineElement;
    inUse: boolean;
  }[],
  clusterVisualsPool: [] as { el: HTMLDivElement; inUse: boolean }[],

  selectedStart: null as { row: number; col: number } | null,
  selectedEnd: null as { row: number; col: number } | null,
  selectedTargetId: null as string | null,
  selectedMission: "HUMAN_EXPLORATION",
  currentPriorities: {
    ...MISSION_DEFAULT_PRIORITIES["HUMAN_EXPLORATION"],
  } as Priorities,

  currentPlannedPath: null as Array<{ row: number; col: number }> | null,
  currentEvaFeasibility: null as EvaFeasibilityResult | null,

  startMarker: null as THREE.Mesh | null,
  endMarker: null as THREE.Mesh | null,
  routeLine: null as THREE.Line | null,

  statusEl: null as HTMLDivElement | null,
  reportPanelEl: null as HTMLDivElement | null,
  explanationPanelEl: null as HTMLDivElement | null,
  targetDetailsPanelEl: null as HTMLDivElement | null,
  focusModeIndicator: null as HTMLDivElement | null,

  uiOverlayRight: null as HTMLDivElement | null,
  zonePriorities: null as HTMLDivElement | null,
  zoneFeasibility: null as HTMLDivElement | null,
  zoneCopilot: null as HTMLDivElement | null,
  zoneExplorer: null as HTMLDivElement | null,

  isPrioritiesOpen: false,
  isFocusMode: false,
  nearbyContextOn: false,
  isExplorerOpen: false,
  lastLayoutTime: 0,
  layoutCache: { points: [] as any[], regions: [] as any[] },

  sliderElements: {} as Record<
    string,
    { slider: HTMLInputElement; valueLabel: HTMLSpanElement }
  >,
};
