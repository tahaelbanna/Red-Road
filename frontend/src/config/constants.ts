import { Priorities } from "../interfaces/index";

export const HEIGHTMAP_PATH = "/data/heightmap_jezero_crater.png";
export const META_PATH = "/data/heightmap_jezero_crater_meta.json";
export const BACKEND_URL = "http://localhost:3000";

export const MESH_RESOLUTION = 256;
export const TERRAIN_SIZE_UNITS = 100;
export const VERTICAL_EXAGGERATION = 2.0;

export const TERRAIN_GRID_ROWS = 1013;
export const TERRAIN_GRID_COLS = 891;

export const CLICK_DRAG_THRESHOLD_PX = 5;
export const MIN_ZOOM_DISTANCE = 8;
export const MAX_ZOOM_DISTANCE = 150;

export const MISSION_DEFAULT_PRIORITIES: Record<string, Priorities> = {
  HUMAN_EXPLORATION: { safety: 0.4, slope: 0.3, distance: 0.2, science: 0.1 },
  SCIENTIFIC_RESEARCH: { safety: 0.2, slope: 0.2, distance: 0.2, science: 0.4 },
  RAPID_TRANSIT: { safety: 0.3, slope: 0.2, distance: 0.45, science: 0.05 },
};
