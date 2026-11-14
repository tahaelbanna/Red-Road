import rasterio
import numpy as np
from PIL import Image
import json

REGION_NAME = "jezero_crater"
path = "../data/M20_JezeroCrater_CTXDEM_20m.tif"
HEIGHTMAP_SIZE = 2048  

with rasterio.open(path) as dataset:
    elevation = dataset.read(1)
    nodata = dataset.nodata

rows, cols = elevation.shape

row_factor = rows / HEIGHTMAP_SIZE
col_factor = cols / HEIGHTMAP_SIZE

resampled = np.zeros((HEIGHTMAP_SIZE, HEIGHTMAP_SIZE), dtype=np.float64)
valid_mask = np.zeros((HEIGHTMAP_SIZE, HEIGHTMAP_SIZE), dtype=bool)

for out_r in range(HEIGHTMAP_SIZE):
    r_start = int(out_r * row_factor)
    r_end = max(r_start + 1, int((out_r + 1) * row_factor))
    for out_c in range(HEIGHTMAP_SIZE):
        c_start = int(out_c * col_factor)
        c_end = max(c_start + 1, int((out_c + 1) * col_factor))
        block = elevation[r_start:r_end, c_start:c_end]
        valid = block[block != nodata]
        if valid.size > 0:
            resampled[out_r, out_c] = np.mean(valid)
            valid_mask[out_r, out_c] = True

min_elev = resampled[valid_mask].min()
resampled[~valid_mask] = min_elev

max_elev = resampled.max()
elev_range = max_elev - min_elev

normalized = ((resampled - min_elev) / elev_range * 65535).astype(np.uint16)

r_channel = (normalized // 256).astype(np.uint8)
g_channel = (normalized % 256).astype(np.uint8)
b_channel = np.zeros_like(r_channel)  

height_image = np.stack([r_channel, g_channel, b_channel], axis=-1)
Image.fromarray(height_image, mode="RGB").save(f"heightmap_{REGION_NAME}.png")

with open(f"heightmap_{REGION_NAME}_meta.json", "w") as f:
    json.dump({
        "region": REGION_NAME,
        "size_pixels": HEIGHTMAP_SIZE,
        "min_elevation_m": round(float(min_elev), 2),
        "max_elevation_m": round(float(max_elev), 2),
    }, f, indent=2)

print(f"Saved heightmap_{REGION_NAME}.png ({HEIGHTMAP_SIZE}x{HEIGHTMAP_SIZE})")
print(f"Elevation range: {min_elev:.1f}m to {max_elev:.1f}m")