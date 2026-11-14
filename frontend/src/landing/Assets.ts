import * as THREE from 'three';

export async function loadLandingAssets(renderer: THREE.WebGLRenderer, onProgress?: (p: number) => void) {
  const manifest = await fetch('/data/manifest.json').then(r => r.json());
  const texLoader = new THREE.TextureLoader();
  const tex: Record<string, THREE.Texture> = {};

  const texturesToLoad = [
    { key: 'g_color', file: 'mars_mdim21_global_color_4k.jpg', srgb: true },
    { key: 'g_normal', file: 'mars_mola_global_normal_4k.jpg', srgb: false },
    { key: 'g_topo', file: 'mars_mola_global_topography_4k.jpg', srgb: true },
    { key: 'g_thermal', file: 'mars_themis_global_night_ir_4k.jpg', srgb: true },
    { key: 'r_color', file: 'mars_mdim21_region_color.jpg', srgb: true },
    { key: 'r_normal', file: 'mars_mola_region_normal.jpg', srgb: false },
    { key: 'r_topo', file: 'mars_mola_region_topography.jpg', srgb: true },
    { key: 'r_thermal', file: 'mars_themis_region_night_ir.jpg', srgb: true },
    { key: 'c_decal', file: 'jezero_ctx_orthomosaic_decal.jpg', srgb: true },
  ];

  let done = 0;
  await Promise.all(texturesToLoad.map(async (t) => {
    const texture = await texLoader.loadAsync(`/data/${t.file}`);
    texture.colorSpace = t.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    if (t.key.startsWith('g_')) texture.wrapS = THREE.RepeatWrapping;
    tex[t.key] = texture;
    done++;
    if (onProgress) onProgress(done / texturesToLoad.length);
  }));

  return { manifest, tex };
}
