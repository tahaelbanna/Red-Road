import * as THREE from 'three';
import { OrbitView } from './OrbitView.js';
import { loadLandingAssets } from './Assets';
import { Tweens } from './geo.js';

export class LandingApp {
  public w = window.innerWidth;
  public h = window.innerHeight;
  public tier = { sphere: [64, 64], stars: 1000, name: 'high' };
  public assets: any;
  public orbit: any;
  public labelsContainer!: HTMLDivElement;
  public labelsItems: any[] = [];
  public labels = {
    add: (group: string, config: any) => {
      const el = document.createElement('div');
      el.className = `mk ${config.className || ''}`;
      el.innerHTML = config.html || '';
      el.style.position = 'absolute';
      el.style.pointerEvents = 'auto';
      el.style.transform = 'translate(-50%, -50%)';
      if (config.onClick) el.addEventListener('pointerdown', (e) => { e.stopPropagation(); config.onClick(); });
      
      this.labelsContainer.appendChild(el);
      const item = { ...config, el, hiddenByUser: false, group, world: new THREE.Vector3(), obj: new THREE.Vector3() };
      this.labelsItems.push(item);
      return item;
    },
    setVisible: (group: string, visible: boolean) => {
      for (const item of this.labelsItems) {
        if (item.group === group) item.hiddenByUser = !visible;
      }
    }
  };
  public hud = {
    toast: (msg: string) => console.log('Toast:', msg)
  };
  
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private timer = new THREE.Timer();
  private onEnterJezero: () => void;
  private active = true;
  private destroyed = false;
  public tweens = new Tweens();

  constructor(renderer: THREE.WebGLRenderer, onEnterJezero: () => void) {
    this.renderer = renderer;
    this.canvas = renderer.domElement;
    this.onEnterJezero = onEnterJezero;

    this.labelsContainer = document.createElement('div');
    this.labelsContainer.style.position = 'absolute';
    this.labelsContainer.style.inset = '0';
    this.labelsContainer.style.pointerEvents = 'none';
    this.labelsContainer.style.zIndex = '50';
    document.body.appendChild(this.labelsContainer);

    window.addEventListener('resize', this.onResize);
  }

  resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    const aspect = this.w / this.h;
    if (this.orbit) {
      this.orbit.camera.aspect = aspect;
      if (this.w > 768) {
        this.orbit.camera.setViewOffset(this.w, this.h, -this.w * 0.25, 0, this.w, this.h);
      } else {
        this.orbit.camera.clearViewOffset();
      }
      this.orbit.camera.updateProjectionMatrix();
    }
  }

  async start() {
    this.assets = await loadLandingAssets(this.renderer);
    
    this.orbit = new OrbitView(this);
    this.orbit.build(this.assets);
    
    this.resize();
    this.bindInput();
    
    this.timer.update(performance.now());
    this.frame();
  }
  
  descendToJezero() {
    if (!this.active) return;
    this.active = false; // Prevent double trigger
    
    // Play transition
    this.orbit.flyToJezero(0.26).then(() => {
        // Trigger the real app
        this.onEnterJezero();
    });
  }

  bindInput() {
    let down: any = null;
    
    const onPointerDown = (e: PointerEvent) => {
      if (!this.active) return;
      down = { x: e.clientX, y: e.clientY, moved: false };
    };
    
    const onPointerMove = (e: PointerEvent) => {
      if (!this.active) return;
      this.orbit.onPointerMove(e.clientX, e.clientY);
      if (!down) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      down.x = e.clientX;
      down.y = e.clientY;
      down.moved = true;
      this.orbit.onDrag(dx, dy);
    };
    
    const onPointerUp = (_e: PointerEvent) => {
      if (!this.active) return;
      if (down && !down.moved) {
        // Handle click
        this.orbit.onClick();
      }
      down = null;
    };
    
    const onWheel = (e: WheelEvent) => {
      if (!this.active) return;
      this.orbit.onWheel(e);
    };

    this.canvas.addEventListener('pointerdown', onPointerDown);
    this.canvas.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('wheel', onWheel);
    
    // We should save these handlers to remove them later
    this.cleanupInput = () => {
        this.canvas.removeEventListener('pointerdown', onPointerDown);
        this.canvas.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('wheel', onWheel);
    };
  }
  
  private onResize = this.resize.bind(this);
  
  private cleanupInput = () => {};

  frame(now = performance.now()) {
    if (this.destroyed) return;
    if (!this.active && this.orbit.mode !== 'transit') return; // Stop rendering unless transitioning
    
    this.timer.update(now);
    const dt = Math.min(0.05, this.timer.getDelta());
    
    this.orbit.update(dt);
    this.renderer.render(this.orbit.scene, this.orbit.camera);
    
    // Update labels
    for (const item of this.labelsItems) {
      if (item.hiddenByUser || (item.occlude && item.occlude(item))) {
        item.el.style.display = 'none';
        continue;
      }
      
      const v = item.world.clone().project(this.orbit.camera);
      if (v.z > 1 || v.z < -1) {
        item.el.style.display = 'none';
        continue;
      }
      
      item.el.style.display = 'block';
      const x = (v.x * 0.5 + 0.5) * this.w;
      const y = (-(v.y * 0.5) + 0.5) * this.h;
      item.el.style.left = `${x}px`;
      item.el.style.top = `${y}px`;
    }
    
    requestAnimationFrame((t) => this.frame(t));
  }
  
  destroy() {
      this.destroyed = true;
      this.active = false;
      this.cleanupInput();
      window.removeEventListener('resize', this.onResize);
      if (this.labelsContainer && this.labelsContainer.parentNode) {
          this.labelsContainer.remove();
      }
      this.labelsItems = []; // clear array
      
      if (this.orbit && this.orbit.scene) {
          this.orbit.scene.clear();
      }
  }
}
