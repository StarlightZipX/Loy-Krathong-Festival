import * as THREE from 'three';
import type { KrathongEntry } from '../types/krathong';
import { mergeGroupToSingleMesh } from './geometryMerge';

let sharedGlowTexture: THREE.Texture | null = null;
let sharedFlameGeo: THREE.ConeGeometry | null = null;
let sharedFlameMat: THREE.MeshBasicMaterial | null = null;
let sharedHitGeo: THREE.CylinderGeometry | null = null;
let sharedHitMat: THREE.MeshBasicMaterial | null = null;
let sharedRingGeo: THREE.RingGeometry | null = null;
let sharedBodyMatDefault: THREE.MeshLambertMaterial | null = null;
let sharedBodyMatUser: THREE.MeshLambertMaterial | null = null;

function getGlowTexture(): THREE.Texture {
  if (sharedGlowTexture) return sharedGlowTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(48, 48, 3, 48, 48, 48);
  grad.addColorStop(0, 'rgba(255, 240, 170, 1)');
  grad.addColorStop(0.28, 'rgba(255, 180, 50, 0.72)');
  grad.addColorStop(0.62, 'rgba(255, 110, 10, 0.22)');
  grad.addColorStop(1, 'rgba(255, 90, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 96, 96);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  sharedGlowTexture = tex;
  return tex;
}

function getSharedAssets() {
  if (!sharedFlameGeo) {
    sharedFlameGeo = new THREE.ConeGeometry(0.045, 0.14, 6);
    sharedFlameMat = new THREE.MeshBasicMaterial({ color: '#fff3a8' });
    sharedHitGeo = new THREE.CylinderGeometry(0.88, 0.88, 1.3, 10);
    sharedHitMat = new THREE.MeshBasicMaterial({ visible: false });
    sharedRingGeo = new THREE.RingGeometry(0.68, 0.84, 24);
    sharedBodyMatDefault = new THREE.MeshLambertMaterial({
      vertexColors: true,
    });
    sharedBodyMatUser = new THREE.MeshLambertMaterial({
      vertexColors: true,
      emissive: '#422006',
      emissiveIntensity: 0.28,
    });
  }
  return {
    flameGeo: sharedFlameGeo!,
    flameMat: sharedFlameMat!,
    hitGeo: sharedHitGeo!,
    hitMat: sharedHitMat!,
    ringGeo: sharedRingGeo!,
    bodyMatDefault: sharedBodyMatDefault!,
    bodyMatUser: sharedBodyMatUser!,
  };
}

export interface KrathongVisualRefs {
  group: THREE.Group;
  flame: THREE.Mesh;
  glowSprite: THREE.Sprite;
  highlightRing: THREE.Mesh;
  hitMesh?: THREE.Mesh;
  photoBadge?: THREE.Sprite;
  basePosition: { x: number; z: number };
  currentX: number;
  driftSpeed: number;
  baseScale: number;
  baseGlowOpacity: number;
  baseGlowScale: number;
  isUserCreated: boolean;
  spinSpeed: number;
  phaseOffset: number;
}

export interface KrathongBuildOptions {
  isAmbient?: boolean;
  scale?: number;
}

function createUserPhotoBadgeSprite(photoUrl: string, name: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 148;
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const drawBadge = (img?: HTMLImageElement) => {
    ctx.clearRect(0, 0, 128, 148);

    ctx.beginPath();
    ctx.moveTo(54, 114);
    ctx.lineTo(74, 114);
    ctx.lineTo(64, 134);
    ctx.closePath();
    ctx.fillStyle = '#fbbf24';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(64, 64, 44, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (img) {
      const side = Math.min(img.width, img.height) || 1;
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 20, 20, 88, 88);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(20, 20, 88, 88);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((name.trim().charAt(0) || 'ก').toUpperCase(), 64, 66);
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(64, 64, 44, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();

    texture.needsUpdate = true;
  };

  drawBadge();

  if (photoUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => drawBadge(img);
    img.src = photoUrl;
  }

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    })
  );
  sprite.position.set(0, 1.5, 0);
  sprite.scale.set(0.92, 1.06, 1);
  return sprite;
}

function addPetalRing(
  group: THREE.Group,
  count: number,
  radius: number,
  petalGeo: THREE.BufferGeometry,
  material: THREE.Material,
  y: number,
  tiltX: number,
  scale = 1
): void {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, material);
    petal.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    petal.rotation.y = -angle + Math.PI / 2;
    petal.rotation.x = tiltX;
    petal.scale.setScalar(scale);
    group.add(petal);
  }
}

export function buildKrathongVisual(
  entry: KrathongEntry,
  options: KrathongBuildOptions = {}
): KrathongVisualRefs {
  const { isAmbient = false, scale } = options;
  const isRealUser = Boolean(entry.isUserCreated) && !isAmbient;
  const assets = getSharedAssets();

  let hash = 0;
  for (let i = 0; i < entry.id.length; i += 1) {
    hash = (hash * 31 + entry.id.charCodeAt(i)) % 1000;
  }

  const resolvedScale =
    scale ??
    (isRealUser
      ? 1.24
      : isAmbient
      ? 0.66 + (hash % 4) * 0.045
      : 0.84 + (hash % 3) * 0.05);

  const baseGlowOpacity = isRealUser ? 1.0 : isAmbient ? 0.34 : 0.48;
  const baseGlowScale = isRealUser ? 1.65 : isAmbient ? 0.72 : 0.84;

  const mutedPrimary = new THREE.Color(entry.primaryColor);
  const mutedAccent = new THREE.Color(entry.accentColor);
  if (!isRealUser) {
    const dimMix = isAmbient ? 0.38 : 0.25;
    mutedPrimary.lerp(new THREE.Color('#0f172a'), dimMix);
    mutedAccent.lerp(new THREE.Color('#1e293b'), dimMix * 0.85);
  }

  const primaryMat = new THREE.MeshBasicMaterial({ color: mutedPrimary });
  const accentMat = new THREE.MeshBasicMaterial({ color: mutedAccent });

  // Build all static krathong parts in a temporary group, then merge into 1 single Mesh!
  const staticParts = new THREE.Group();

  if (entry.style === 'banana-leaf') {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.54, 0.46, 0.18, 12),
      new THREE.MeshBasicMaterial({ color: '#1b5e36' })
    );
    base.position.y = 0.09;
    staticParts.add(base);

    const petalGeo = new THREE.ConeGeometry(0.14, 0.34, 4);
    addPetalRing(staticParts, 10, 0.52, petalGeo, primaryMat, 0.22, 0.32);

    const flowerGeo = new THREE.SphereGeometry(0.085, 6, 6);
    addPetalRing(staticParts, 8, 0.33, flowerGeo, accentMat, 0.22, 0);
  } else if (entry.style === 'lotus') {
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.52, 0.08, 12),
      new THREE.MeshBasicMaterial({ color: '#15803d' })
    );
    pad.position.y = 0.04;
    staticParts.add(pad);

    const petalGeo = new THREE.SphereGeometry(0.18, 6, 6);
    petalGeo.scale(0.8, 1.55, 0.32);
    addPetalRing(staticParts, 10, 0.44, petalGeo, primaryMat, 0.22, 0.62);

    const innerColor = mutedPrimary.clone().lerp(new THREE.Color('#ffffff'), 0.32);
    const innerMat = new THREE.MeshBasicMaterial({ color: innerColor });
    addPetalRing(staticParts, 8, 0.28, petalGeo, innerMat, 0.28, 0.35, 0.85);

    const stamen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.14, 0.12, 10),
      accentMat
    );
    stamen.position.y = 0.22;
    staticParts.add(stamen);
  } else if (entry.style === 'coconut') {
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 12, 8, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.52),
      primaryMat
    );
    shell.position.y = 0.36;
    staticParts.add(shell);

    const innerGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.3, 0.08, 12),
      new THREE.MeshBasicMaterial({ color: '#f59e0b' })
    );
    innerGlow.position.y = 0.22;
    staticParts.add(innerGlow);

    const beadGeo = new THREE.SphereGeometry(0.06, 6, 6);
    addPetalRing(staticParts, 10, 0.47, beadGeo, accentMat, 0.34, 0);
  } else if (entry.style === 'bread') {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.45, 0.14, 12),
      new THREE.MeshBasicMaterial({ color: '#f3c68f' })
    );
    base.position.y = 0.08;
    staticParts.add(base);

    const rainbowColors = ['#fb7185', '#fbbf24', '#34d399', '#38bdf8', '#a78bfa'];
    const coneGeo = new THREE.ConeGeometry(0.14, 0.3, 8);
    for (let i = 0; i < 10; i += 1) {
      const angle = (i / 10) * Math.PI * 2;
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? mutedPrimary : rainbowColors[i % rainbowColors.length],
      });
      const cone = new THREE.Mesh(coneGeo, mat);
      cone.position.set(Math.cos(angle) * 0.44, 0.22, Math.sin(angle) * 0.44);
      cone.rotation.y = -angle;
      cone.rotation.x = 0.22;
      staticParts.add(cone);
    }

    const centerCake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.14, 10),
      accentMat
    );
    centerCake.position.y = 0.18;
    staticParts.add(centerCake);
  } else {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.44, 0.18, 12),
      new THREE.MeshBasicMaterial({ color: '#b45309' })
    );
    base.position.y = 0.09;
    staticParts.add(base);

    const petalGeo = new THREE.ConeGeometry(0.13, 0.38, 4);
    addPetalRing(staticParts, 10, 0.5, petalGeo, primaryMat, 0.24, 0.35);
    addPetalRing(staticParts, 8, 0.32, petalGeo, accentMat, 0.3, 0.18, 0.8);
  }

  // Central floral cushion + candle + 3 incense sticks
  const cushion = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.1, 8),
    accentMat
  );
  cushion.position.y = 0.23;
  staticParts.add(cushion);

  const candle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.04, 0.36, 6),
    new THREE.MeshBasicMaterial({ color: '#fef08a' })
  );
  candle.position.y = 0.42;
  staticParts.add(candle);

  const incenseMat = new THREE.MeshBasicMaterial({ color: '#78350f' });
  const emberMat = new THREE.MeshBasicMaterial({ color: '#ff5722' });
  for (let i = 0; i < 3; i += 1) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.46, 5),
      incenseMat
    );
    stick.position.set(Math.cos(a) * 0.09, 0.44, Math.sin(a) * 0.09);
    stick.rotation.z = Math.cos(a) * 0.16;
    stick.rotation.x = Math.sin(a) * 0.16;
    staticParts.add(stick);

    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.015, 5, 5), emberMat);
    ember.position.set(Math.cos(a) * 0.125, 0.66, Math.sin(a) * 0.125);
    staticParts.add(ember);
  }

  // Dispose temporary per-part geometries & materials after baking into 1 draw call
  const mergedBody = mergeGroupToSingleMesh(
    staticParts,
    isRealUser ? assets.bodyMatUser : assets.bodyMatDefault
  );
  staticParts.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (obj.material instanceof THREE.Material) obj.material.dispose();
    }
  });

  const group = new THREE.Group();
  group.position.set(entry.position.x, 0.06, entry.position.z);
  group.scale.setScalar(resolvedScale);
  group.add(mergedBody);

  // Candle flame (shared geometry/material)
  const flame = new THREE.Mesh(assets.flameGeo, assets.flameMat);
  flame.position.y = 0.66;
  group.add(flame);

  // Soft flame glow sprite
  const glowSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getGlowTexture(),
      color: isRealUser ? 0xffd56b : 0xffb84d,
      transparent: true,
      opacity: baseGlowOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glowSprite.position.set(0, 0.68, 0);
  glowSprite.scale.set(baseGlowScale, baseGlowScale, baseGlowScale);
  group.add(glowSprite);

  // Highlight ring on water surface
  const highlightRing = new THREE.Mesh(
    assets.ringGeo,
    new THREE.MeshBasicMaterial({
      color: '#fde047',
      transparent: true,
      opacity: isRealUser ? 0.5 : 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  highlightRing.rotation.x = -Math.PI / 2;
  highlightRing.position.y = 0.015;
  group.add(highlightRing);

  let photoBadge: THREE.Sprite | undefined;
  if (isRealUser) {
    photoBadge = createUserPhotoBadgeSprite(entry.photoUrl, entry.name);
    group.add(photoBadge);
  }

  let hitMesh: THREE.Mesh | undefined;
  if (!isAmbient) {
    group.userData.krathongId = entry.id;
    hitMesh = new THREE.Mesh(assets.hitGeo, assets.hitMat);
    hitMesh.position.y = isRealUser ? 0.8 : 0.42;
    if (isRealUser) hitMesh.scale.y = 1.45;
    hitMesh.userData.krathongId = entry.id;
    group.add(hitMesh);
  }

  const channelFactor = 1 - Math.min(1, Math.abs(entry.position.z) / 14) * 0.35;
  const speedVariation = 0.85 + ((hash % 30) / 30) * 0.35;
  const driftSpeed = (0.55 + channelFactor * 0.42) * speedVariation;
  const spinDir = hash % 2 === 0 ? 1 : -1;

  return {
    group,
    flame,
    glowSprite,
    highlightRing,
    hitMesh,
    photoBadge,
    basePosition: { x: entry.position.x, z: entry.position.z },
    currentX: entry.position.x,
    driftSpeed,
    baseScale: resolvedScale,
    baseGlowOpacity,
    baseGlowScale,
    isUserCreated: isRealUser,
    spinSpeed: spinDir * (0.08 + ((hash % 15) / 15) * 0.1),
    phaseOffset: (hash / 1000) * Math.PI * 2,
  };
}
