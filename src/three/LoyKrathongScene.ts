import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type {
  CameraPresetId,
  KrathongEntry,
  KrathongStyleId,
} from '../types/krathong';
import { buildKrathongVisual, type KrathongVisualRefs } from './krathongGeometry';
import { buildLoyKrathongEnvironment, type EnvironmentRefs } from './sceneEnvironment';
import { createFestivalVisitors, type VisitorsController } from './visitors';

const RIVER_MIN_X = -46;
const RIVER_MAX_X = 46;
const RIVER_FADE_SPAN = 6.5;

const AMBIENT_STYLES: Array<{
  style: KrathongStyleId;
  primaryColor: string;
  accentColor: string;
}> = [
  { style: 'banana-leaf', primaryColor: '#16a34a', accentColor: '#facc15' },
  { style: 'lotus', primaryColor: '#ec4899', accentColor: '#fef08a' },
  { style: 'coconut', primaryColor: '#92400e', accentColor: '#fbbf24' },
  { style: 'bread', primaryColor: '#38bdf8', accentColor: '#f472b6' },
  { style: 'royal-gold', primaryColor: '#eab308', accentColor: '#a855f7' },
  { style: 'lotus', primaryColor: '#f43f5e', accentColor: '#fde047' },
  { style: 'banana-leaf', primaryColor: '#10b981', accentColor: '#fb923c' },
];

function smoothstep01(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

interface CameraFlight {
  targetPos: THREE.Vector3;
  targetLookAt: THREE.Vector3;
  active: boolean;
}

export class LoyKrathongScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private env: EnvironmentRefs;
  private visitors: VisitorsController;
  private krathongMap = new Map<string, KrathongVisualRefs>();
  private krathongGroup = new THREE.Group();
  private hitTargets: THREE.Mesh[] = [];
  private ambientKrathongs: KrathongVisualRefs[] = [];
  private ambientGroup = new THREE.Group();
  private raycaster = new THREE.Raycaster();
  private pointerDownPos: { x: number; y: number } | null = null;
  private activePointers = 0;
  private lastHoverCheck = 0;
  private selectedId: string | null = null;
  private animFrameId: number | null = null;
  private clock = new THREE.Clock();
  private resizeObserver: ResizeObserver;
  private onSelectKrathong: (id: string) => void;
  private flight: CameraFlight = {
    targetPos: new THREE.Vector3(),
    targetLookAt: new THREE.Vector3(),
    active: false,
  };

  constructor(container: HTMLElement, onSelectKrathong: (id: string) => void) {
    this.container = container;
    this.onSelectKrathong = onSelectKrathong;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.2, 220);
    this.camera.position.set(0, 12.5, 25);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.8, -6);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 4.5;
    this.controls.maxDistance = 64;
    this.controls.minPolarAngle = 0.18;
    this.controls.maxPolarAngle = Math.PI * 0.465;
    this.controls.rotateSpeed = 0.78;
    this.controls.zoomSpeed = 0.95;
    this.controls.panSpeed = 0.75;
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    // Stop camera auto-flight immediately if user interacts manually
    this.controls.addEventListener('start', () => {
      this.flight.active = false;
    });

    this.env = buildLoyKrathongEnvironment(this.scene);
    this.visitors = createFestivalVisitors(this.scene);
    this.initAmbientKrathongs();
    this.scene.add(this.ambientGroup);
    this.scene.add(this.krathongGroup);

    this.bindEvents();

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    this.animate();
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.handlePointerDown);
    dom.addEventListener('pointerup', this.handlePointerUp);
    dom.addEventListener('pointercancel', this.handlePointerCancel);
    dom.addEventListener('pointermove', this.handlePointerMove);
  }

  private unbindEvents(): void {
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.handlePointerDown);
    dom.removeEventListener('pointerup', this.handlePointerUp);
    dom.removeEventListener('pointercancel', this.handlePointerCancel);
    dom.removeEventListener('pointermove', this.handlePointerMove);
  }

  private handlePointerDown = (e: PointerEvent): void => {
    this.activePointers += 1;
    if (this.activePointers === 1) {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
    } else {
      // Multi-touch (pinch zoom) - cancel tap detection
      this.pointerDownPos = null;
    }
  };

  private handlePointerCancel = (): void => {
    this.activePointers = Math.max(0, this.activePointers - 1);
    this.pointerDownPos = null;
  };

  private handlePointerUp = (e: PointerEvent): void => {
    this.activePointers = Math.max(0, this.activePointers - 1);
    if (!this.pointerDownPos) return;

    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    this.pointerDownPos = null;

    // Distinguish tap/click from drag/orbit
    if (dx * dx + dy * dy > 64) return;

    const hitId = this.raycastKrathong(e.clientX, e.clientY);
    if (hitId) {
      this.onSelectKrathong(hitId);
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse' || this.pointerDownPos) return;
    const now = performance.now();
    if (now - this.lastHoverCheck < 75) return;
    this.lastHoverCheck = now;
    const hitId = this.raycastKrathong(e.clientX, e.clientY);
    this.renderer.domElement.style.cursor = hitId ? 'pointer' : 'grab';
  };

  private raycastKrathong(clientX: number, clientY: number): string | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height || this.hitTargets.length === 0) return null;

    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.hitTargets, false);
    if (hits.length > 0) {
      return (hits[0].object.userData.krathongId as string | undefined) ?? null;
    }
    return null;
  }

  public syncKrathongs(entries: KrathongEntry[]): void {
    const incomingIds = new Set(entries.map((e) => e.id));
    let dirtyTargets = false;

    // Remove krathongs no longer present
    for (const [id, refs] of this.krathongMap.entries()) {
      if (!incomingIds.has(id)) {
        this.krathongGroup.remove(refs.group);
        this.krathongMap.delete(id);
        dirtyTargets = true;
      }
    }

    // Add newly created krathongs
    for (const entry of entries) {
      if (!this.krathongMap.has(entry.id)) {
        const refs = buildKrathongVisual(entry);
        this.krathongMap.set(entry.id, refs);
        this.krathongGroup.add(refs.group);
        dirtyTargets = true;
      }
    }

    if (dirtyTargets) {
      this.hitTargets = Array.from(this.krathongMap.values())
        .map((r) => r.hitMesh)
        .filter((m): m is THREE.Mesh => Boolean(m));
    }
  }

  public setSelectedKrathong(id: string | null): void {
    this.selectedId = id;
  }

  public focusKrathong(id: string): void {
    const refs = this.krathongMap.get(id);
    if (!refs) return;
    const pos = refs.group.position;
    this.flight.targetLookAt.set(pos.x, 0.4, pos.z);
    this.flight.targetPos.set(pos.x + 2.8, 3.6, pos.z + 5.8);
    this.flight.active = true;
  }

  public setCameraPreset(preset: CameraPresetId): void {
    if (preset === 'overview') {
      this.flight.targetPos.set(0, 12.5, 25);
      this.flight.targetLookAt.set(0, 1.8, -6);
    } else if (preset === 'river') {
      this.flight.targetPos.set(2, 4.6, 13.5);
      this.flight.targetLookAt.set(0, 0.5, -2);
    } else {
      // temple & chedi view
      this.flight.targetPos.set(-14, 9.5, 5);
      this.flight.targetLookAt.set(-20, 3.8, -24);
    }
    this.flight.active = true;
  }

  private handleResize(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private initAmbientKrathongs(): void {
    const AMBIENT_COUNT = 10;
    const zLanes = [-6.8, -4.4, -1.8, 0.8, 3.6, 6.4, 9.2];
    for (let i = 0; i < AMBIENT_COUNT; i += 1) {
      const palette = AMBIENT_STYLES[i % AMBIENT_STYLES.length];
      const startX =
        RIVER_MIN_X + (i / AMBIENT_COUNT) * (RIVER_MAX_X - RIVER_MIN_X);
      const startZ = zLanes[(i * 3) % zLanes.length] + ((i % 3) - 1) * 0.45;
      const refs = buildKrathongVisual(
        {
          id: `ambient-${i}`,
          name: '',
          wish: '',
          style: palette.style,
          primaryColor: palette.primaryColor,
          accentColor: palette.accentColor,
          photoUrl: '',
          votes: 0,
          position: { x: startX, z: startZ },
          createdAt: '',
        },
        {
          isAmbient: true,
          scale: 0.66 + (i % 4) * 0.045,
        }
      );
      this.ambientKrathongs.push(refs);
      this.ambientGroup.add(refs.group);
    }
  }

  private updateFloatingKrathong(
    refs: KrathongVisualRefs,
    delta: number,
    elapsed: number,
    isSelected: boolean
  ): void {
    const p = refs.phaseOffset;
    const speedFactor = isSelected ? 0.2 : 1;
    refs.currentX += refs.driftSpeed * speedFactor * delta;

    if (refs.currentX > RIVER_MAX_X) {
      refs.currentX = RIVER_MIN_X + (refs.currentX - RIVER_MAX_X);
    }

    // Gentle lateral meander along the river current while staying clear of the wooden pier
    const meanderZ = Math.sin(elapsed * 0.18 + p) * 0.65;
    let targetZ = Math.max(-8.4, Math.min(11.0, refs.basePosition.z + meanderZ));
    if (Math.abs(refs.currentX) < 4.6 && targetZ < -7.2) {
      targetZ = -7.2;
    }

    // Smoothly emerge from upstream fog and fade out downstream
    const enterT = smoothstep01((refs.currentX - RIVER_MIN_X) / RIVER_FADE_SPAN);
    const exitT = smoothstep01((RIVER_MAX_X - refs.currentX) / RIVER_FADE_SPAN);
    const edgeFactor = Math.min(enterT, exitT);

    const bobY = Math.sin(elapsed * 1.9 + p) * 0.045;
    refs.group.position.x = refs.currentX;
    refs.group.position.z = targetZ;
    refs.group.position.y = THREE.MathUtils.lerp(-0.1, 0.05 + bobY, edgeFactor);
    refs.group.scale.setScalar(refs.baseScale * (0.04 + 0.96 * edgeFactor));

    refs.group.rotation.z = Math.sin(elapsed * 1.4 + p) * 0.045;
    refs.group.rotation.x = Math.cos(elapsed * 1.2 + p) * 0.04;
    refs.group.rotation.y += delta * refs.spinSpeed;

    // Flickering candle flame & soft glow scaled by edge visibility
    const flicker = 0.88 + Math.sin(elapsed * 15 + p * 5) * 0.14;
    refs.flame.scale.set(flicker, 0.9 + Math.cos(elapsed * 18 + p) * 0.18, flicker);
    refs.glowSprite.scale.setScalar(
      refs.baseGlowScale *
        (0.94 + Math.sin(elapsed * 10 + p) * 0.1) *
        (0.2 + 0.8 * edgeFactor)
    );
    (refs.glowSprite.material as THREE.SpriteMaterial).opacity =
      refs.baseGlowOpacity * edgeFactor;

    if (refs.photoBadge) {
      refs.photoBadge.position.y = 1.48 + Math.sin(elapsed * 2.2 + p) * 0.06;
      (refs.photoBadge.material as THREE.SpriteMaterial).opacity = edgeFactor;
    }
  }

  private animate = (): void => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.getElapsedTime();

    this.env.update(elapsed);
    this.visitors.update(delta, elapsed);

    // Animate ambient passing krathongs from upstream
    for (const refs of this.ambientKrathongs) {
      this.updateFloatingKrathong(refs, delta, elapsed, false);
    }

    // Animate contestant krathongs
    for (const [id, refs] of this.krathongMap.entries()) {
      const isSelected = this.selectedId === id;
      this.updateFloatingKrathong(refs, delta, elapsed, isSelected);

      // Highlight ring: brightest when selected, gentle golden pulse for real users
      const ringMat = refs.highlightRing.material as THREE.MeshBasicMaterial;
      if (isSelected) {
        ringMat.opacity = 0.82 + Math.sin(elapsed * 5) * 0.18;
        refs.highlightRing.scale.setScalar(1.1 + Math.sin(elapsed * 4) * 0.08);
      } else if (refs.isUserCreated) {
        ringMat.opacity = 0.42 + Math.sin(elapsed * 3 + refs.phaseOffset) * 0.14;
        refs.highlightRing.scale.setScalar(1.02 + Math.sin(elapsed * 2.5) * 0.05);
      } else {
        ringMat.opacity *= 0.9;
      }
    }

    // Smooth camera flight
    if (this.flight.active) {
      const lerpAlpha = Math.min(1, delta * 3.8);
      this.camera.position.lerp(this.flight.targetPos, lerpAlpha);
      this.controls.target.lerp(this.flight.targetLookAt, lerpAlpha);
      if (
        this.camera.position.distanceTo(this.flight.targetPos) < 0.15 &&
        this.controls.target.distanceTo(this.flight.targetLookAt) < 0.15
      ) {
        this.flight.active = false;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.resizeObserver.disconnect();
    this.unbindEvents();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
