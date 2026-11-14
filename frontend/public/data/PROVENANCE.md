# RED ROAD — Image Asset Provenance

This file documents the provenance of all visual assets copied from the `SAMPLE` prototype into the RED ROAD project. All files represent real scientific data processed by NASA, JPL, and USGS, without artistic alterations other than formatting/scaling for realtime 3D rendering.

## 1. Global / Orbit Assets

### `mars_mdim21_global_color_4k.jpg`
- **Canonical Dataset**: Viking MDIM 2.1 global mosaic (NASA Ames color, 232 m/px)
- **Original Source**: `MDIM21_AMES_recolor_dd360_jpeg_cog.tif`
- **Provider**: NASA / USGS
- **Original Dataset URL**: `https://asc-pds-services.s3.us-west-2.amazonaws.com/wms_basemaps/Mars/MDIM21_AMESColor/MDIM21_AMES_recolor_dd360_jpeg_cog.tif`
- **Transformation**: Downscaled to 4K equirectangular JPEG in `SAMPLE/scripts/build_data.py`.
- **Current Usage**: Visible color map for the global Mars orbit view.

### `mars_mola_global_topography_4k.jpg`
- **Canonical Dataset**: MOLA 128/64 ppd merged DEM (463 m/px)
- **Original Source**: `mola128_mola64_merge_90Nto90S_SimpleC_clon0_cog.tif`
- **Provider**: NASA / MGS (MOLA)
- **Original Dataset URL**: `https://asc-pds-services.s3.us-west-2.amazonaws.com/wms_basemaps/Mars/MOLA/mola128_mola64_merge_90Nto90S_SimpleC_clon0_cog.tif`
- **Transformation**: Downscaled to 4K equirectangular JPEG, representing topography.
- **Current Usage**: Topography overlay for the global Mars orbit view.

### `mars_mola_global_normal_4k.jpg`
- **Canonical Dataset**: MOLA 128/64 ppd merged DEM (463 m/px)
- **Original Source**: Same as topography.
- **Provider**: NASA / MGS (MOLA)
- **Original Dataset URL**: Same as topography.
- **Transformation**: Normal map generated from the MOLA DEM.
- **Current Usage**: Normal mapping for the global Mars orbit view.

### `mars_themis_global_night_ir_4k.jpg`
- **Canonical Dataset**: USGS controlled night-IR mosaic (100 m/px)
- **Original Source**: `THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018_cog.tif`
- **Provider**: NASA / USGS / Odyssey (THEMIS)
- **Original Dataset URL**: `https://asc-pds-services.s3.us-west-2.amazonaws.com/wms_basemaps/Mars/THEMIS_USGS/THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018_cog.tif`
- **Transformation**: Downscaled to 4K equirectangular JPEG.
- **Current Usage**: Thermal layer for the global Mars orbit view.

## 2. Regional Assets (Isidis / Jezero)

### `mars_mdim21_region_color.jpg`
### `mars_mola_region_topography.jpg`
### `mars_mola_region_normal.jpg`
### `mars_themis_region_night_ir.jpg`
- **Original Source**: Same global datasets as above.
- **Transformation**: High-resolution 12x12 degree crop centered around the Jezero/Isidis region, extracted via `SAMPLE/scripts/build_data.py`.
- **Current Usage**: High-resolution regional decals applied during the zoom-in transition on the Landing page.

## 3. Jezero Crater Assets

### `jezero_ctx_orthomosaic_5m.jpg`
- **Canonical Dataset**: Mars 2020 Science Investigation CTX orthomosaic (5 m/px)
- **Original Source**: `M20_JezeroCrater_CTXortho_mosaic_5m.tif`
- **Provider**: NASA / JPL / MRO (CTX)
- **Original Dataset URL**: `https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXortho_mosaic_5m.tif`
- **Transformation**: Converted to Web-friendly JPEG format while maintaining spatial mapping.
- **Current Usage**: Primary albedo (color) texture for the Jezero crater 3D terrain.

### `jezero_ctx_dem_20m_normal.jpg`
- **Canonical Dataset**: Mars 2020 Science Investigation CTX DEM (20 m/px)
- **Original Source**: `M20_JezeroCrater_CTXDEM_20m.tif`
- **Provider**: NASA / JPL / MRO (CTX stereo)
- **Original Dataset URL**: `https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif`
- **Transformation**: Normal map generated directly from the 20m DEM elevations.
- **Current Usage**: Normal mapping for lighting/shading on the Jezero crater 3D terrain.

### `jezero_ctx_orthomosaic_decal.jpg`
- **Canonical Dataset**: Mars 2020 Science Investigation CTX orthomosaic (5 m/px)
- **Original Source**: `M20_JezeroCrater_CTXortho_mosaic_5m.tif`
- **Provider**: NASA / JPL / MRO (CTX)
- **Original Dataset URL**: Same as orthomosaic.
- **Transformation**: Downscaled version of the full CTX orthomosaic, generated in `SAMPLE/scripts/build_data.py`.
- **Current Usage**: High-resolution decal patched over the global globe when descending towards Jezero Crater.
