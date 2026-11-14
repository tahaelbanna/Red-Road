import rasterio
import numpy as np
import json

REGION_NAME = "jezero_crater"
path = "../data/M20_JezeroCrater_CTXDEM_20m.tif"
CELL_SIZE_METERS = 100
MAX_WALKABLE_SLOPE_DEG = 20

with rasterio.open(path) as dataset:
    elevation = dataset.read(1)
    nodata = dataset.nodata
    transform = dataset.transform
    src_res = dataset.res[0]
    crs = str(dataset.crs)
    bounds = list(dataset.bounds)

factor = int(CELL_SIZE_METERS / src_res)
rows, cols = elevation.shape
new_rows = rows // factor
new_cols = cols // factor

elev_grid = np.full((new_rows, new_cols), np.nan)
for r in range(new_rows):
    for c in range(new_cols):
        block = elevation[r*factor:(r+1)*factor, c*factor:(c+1)*factor]
        valid = block[block != nodata]
        if valid.size > 0:
            elev_grid[r, c] = np.mean(valid)

def compute_slope_degrees(grid, r, c, cell_size):
    center = grid[r, c]
    if np.isnan(center):
        return np.nan
    max_slope = 0.0
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < grid.shape[0] and 0 <= nc < grid.shape[1]:
            neighbor_val = grid[nr, nc]
            if not np.isnan(neighbor_val):
                slope_deg = np.degrees(np.arctan(abs(center - neighbor_val) / cell_size))
                max_slope = max(max_slope, slope_deg)
    return max_slope

slope_grid = np.full((new_rows, new_cols), np.nan)
for r in range(new_rows):
    for c in range(new_cols):
        slope_grid[r, c] = compute_slope_degrees(elev_grid, r, c, CELL_SIZE_METERS)

hazard_grid = np.ones((new_rows, new_cols))
valid_mask = ~np.isnan(slope_grid)
hazard_grid[valid_mask] = np.clip(slope_grid[valid_mask] / MAX_WALKABLE_SLOPE_DEG, 0, 1)

elevation_flat = [None if np.isnan(v) else round(float(v), 2) for v in elev_grid.flatten()]
slope_flat = [None if np.isnan(v) else round(float(v), 2) for v in slope_grid.flatten()]
hazard_flat = [round(float(v), 3) for v in hazard_grid.flatten()]

origin_x, origin_y = transform * (factor / 2, factor / 2)

output = {
    "region": REGION_NAME,
    "cell_size_meters": CELL_SIZE_METERS,
    "grid_rows": new_rows,
    "grid_cols": new_cols,
    "origin_x": round(float(origin_x), 1),
    "origin_y": round(float(origin_y), 1),
    "crs": crs,
    "source_bounds": bounds,
    "max_walkable_slope_deg": MAX_WALKABLE_SLOPE_DEG,
    "elevation": elevation_flat,
    "slope": slope_flat,
    "hazard": hazard_flat
}

with open(f"terrain_{REGION_NAME}.json", "w") as f:
    json.dump(output, f)

print(f"Total cells: {new_rows * new_cols}")
print(f"Saved to terrain_{REGION_NAME}.json")