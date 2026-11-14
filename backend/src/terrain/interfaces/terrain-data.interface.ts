export interface TerrainData {
    region: string;
    cell_size_meters: number;
    grid_rows: number;
    grid_cols: number;
    origin_x: number;
    origin_y: number;
    crs: string;
    source_bounds: number[];
    max_walkable_slope_deg: number;
    elevation: (number | null)[];
    slope: (number | null)[];
    hazard: number[];
}