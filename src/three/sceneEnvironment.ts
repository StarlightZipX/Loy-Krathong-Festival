import * as THREE from 'three';
import { mergeGroupToSingleMesh } from './geometryMerge';

export interface EnvironmentRefs {
  update: (elapsed: number) => void;
}

function createMoonGlowTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 250, 210, 0.95)');
  grad.addColorStop(0.28, 'rgba(255, 224, 130, 0.45)');
  grad.addColorStop(0.65, 'rgba(186, 200, 255, 0.14)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function addThaiHouse(
  litGroup: THREE.Group,
  glowGroup: THREE.Group,
  x: number,
  z: number,
  rotationY: number,
  scale = 1,
  wallColor = '#5c3a21',
  roofColor = '#7c2d12'
): void {
  const houseLit = new THREE.Group();
  houseLit.position.set(x, 1.5, z);
  houseLit.rotation.y = rotationY;
  houseLit.scale.setScalar(scale);

  const houseGlow = new THREE.Group();
  houseGlow.position.copy(houseLit.position);
  houseGlow.rotation.copy(houseLit.rotation);
  houseGlow.scale.copy(houseLit.scale);

  const woodMat = new THREE.MeshBasicMaterial({ color: '#452715' });
  const wallMat = new THREE.MeshBasicMaterial({ color: wallColor });
  const roofMat = new THREE.MeshBasicMaterial({ color: roofColor });
  const trimGoldMat = new THREE.MeshBasicMaterial({ color: '#eab308' });
  const warmWinMat = new THREE.MeshBasicMaterial({ color: '#fde047' });

  const postGeo = new THREE.CylinderGeometry(0.13, 0.15, 2.2, 6);
  for (const px of [-2.0, 0, 2.0]) {
    for (const pz of [-1.5, 1.5]) {
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(px, 1.0, pz);
      houseLit.add(post);
    }
  }

  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.24, 4.4), woodMat);
  deck.position.y = 2.1;
  houseLit.add(deck);

  const rail = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.1, 0.1), woodMat);
  rail.position.set(0, 2.75, 2.1);
  houseLit.add(rail);

  const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 3.0), wallMat);
  body.position.set(0, 3.3, -0.3);
  houseLit.add(body);

  for (const wx of [-1.1, 1.1]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.9, 0.08), warmWinMat);
    win.position.set(wx, 3.35, 1.22);
    houseGlow.add(win);
  }

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.55, 0.08), warmWinMat);
  door.position.set(0, 3.02, 1.22);
  houseGlow.add(door);

  const slopeGeo = new THREE.BoxGeometry(4.9, 0.14, 2.55);
  const leftSlope = new THREE.Mesh(slopeGeo, roofMat);
  leftSlope.position.set(0, 5.15, -1.25);
  leftSlope.rotation.x = -0.68;
  houseLit.add(leftSlope);

  const rightSlope = new THREE.Mesh(slopeGeo, roofMat);
  rightSlope.position.set(0, 5.15, 0.65);
  rightSlope.rotation.x = 0.68;
  houseLit.add(rightSlope);

  const ridge = new THREE.Mesh(new THREE.BoxGeometry(5.05, 0.18, 0.22), trimGoldMat);
  ridge.position.set(0, 5.95, -0.3);
  houseLit.add(ridge);

  for (const gx of [-2.42, 2.42]) {
    const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), trimGoldMat);
    hornL.position.set(gx, 6.18, -0.3);
    hornL.rotation.x = 0.45;
    houseLit.add(hornL);

    const hornR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), trimGoldMat);
    hornR.position.set(gx, 6.18, -0.3);
    hornR.rotation.x = -0.45;
    houseLit.add(hornR);
  }

  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), warmWinMat);
  lantern.position.set(1.7, 3.7, 1.75);
  houseGlow.add(lantern);

  litGroup.add(houseLit);
  glowGroup.add(houseGlow);
}

function addThaiTemple(
  litGroup: THREE.Group,
  glowGroup: THREE.Group,
  x: number,
  z: number
): void {
  const templeLit = new THREE.Group();
  templeLit.position.set(x, 1.5, z);

  const templeGlow = new THREE.Group();
  templeGlow.position.copy(templeLit.position);

  const marbleMat = new THREE.MeshBasicMaterial({ color: '#f1f5f9' });
  const goldMat = new THREE.MeshBasicMaterial({ color: '#facc15' });
  const roofRedMat = new THREE.MeshBasicMaterial({ color: '#b91c1c' });
  const roofOrangeMat = new THREE.MeshBasicMaterial({ color: '#ea580c' });
  const warmGlowMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });

  const base1 = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.7, 8.2), marbleMat);
  base1.position.y = 0.35;
  templeLit.add(base1);

  const base2 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.6, 7.0), marbleMat);
  base2.position.y = 1.0;
  templeLit.add(base2);

  for (let s = 0; s < 4; s += 1) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 0.6), marbleMat);
    step.position.set(0, 0.15 + s * 0.28, 4.4 - s * 0.45);
    templeLit.add(step);
  }

  const hall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.3, 4.8), marbleMat);
  hall.position.set(0, 2.95, -0.2);
  templeLit.add(hall);

  const pillarGeo = new THREE.CylinderGeometry(0.18, 0.21, 3.4, 8);
  for (const px of [-3.6, -1.8, 1.8, 3.6]) {
    for (const pz of [-2.8, 2.4]) {
      const p = new THREE.Mesh(pillarGeo, goldMat);
      p.position.set(px, 2.95, pz);
      templeLit.add(p);
    }
  }

  const entrance = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.4, 0.14), warmGlowMat);
  entrance.position.set(0, 2.5, 2.22);
  templeGlow.add(entrance);

  for (const wx of [-2.3, 2.3]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.5, 0.12), warmGlowMat);
    win.position.set(wx, 2.9, 2.22);
    templeGlow.add(win);
  }

  const tiers = [
    { w: 9.2, d: 3.8, y: 4.8, angle: 0.56, mat: roofRedMat },
    { w: 8.2, d: 2.8, y: 5.7, angle: 0.62, mat: roofOrangeMat },
    { w: 7.2, d: 1.9, y: 6.45, angle: 0.68, mat: roofRedMat },
  ];

  tiers.forEach((tier, idx) => {
    const planeGeo = new THREE.BoxGeometry(tier.w, 0.18, tier.d);
    const front = new THREE.Mesh(planeGeo, tier.mat);
    front.position.set(0, tier.y, 1.15 - idx * 0.22);
    front.rotation.x = tier.angle;
    templeLit.add(front);

    const back = new THREE.Mesh(planeGeo, tier.mat);
    back.position.set(0, tier.y, -1.55 + idx * 0.22);
    back.rotation.x = -tier.angle;
    templeLit.add(back);
  });

  const topRidge = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.22, 0.24), goldMat);
  topRidge.position.set(0, 7.1, -0.2);
  templeLit.add(topRidge);

  for (const cx of [-3.65, 3.65]) {
    const chofah = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.25, 6), goldMat);
    chofah.position.set(cx, 7.65, -0.2);
    chofah.rotation.z = cx < 0 ? 0.38 : -0.38;
    templeLit.add(chofah);
  }

  litGroup.add(templeLit);
  glowGroup.add(templeGlow);
}

function addThaiChedi(litGroup: THREE.Group, x: number, z: number): void {
  const chedi = new THREE.Group();
  chedi.position.set(x, 1.5, z);

  const goldMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
  const whiteMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });

  const p1 = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.9, 6.6), whiteMat);
  p1.position.y = 0.45;
  chedi.add(p1);

  const p2 = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.9, 5.0), goldMat);
  p2.position.y = 1.35;
  chedi.add(p2);

  const p3 = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 0.8, 12), goldMat);
  p3.position.y = 2.2;
  chedi.add(p3);

  const bell = new THREE.Mesh(
    new THREE.SphereGeometry(2.05, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.65),
    goldMat
  );
  bell.position.y = 2.75;
  chedi.add(bell);

  const throne = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 1.4), goldMat);
  throne.position.y = 4.95;
  chedi.add(throne);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.85, 4.2, 12), goldMat);
  spire.position.y = 7.4;
  chedi.add(spire);

  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), goldMat);
  tip.position.y = 9.65;
  chedi.add(tip);

  litGroup.add(chedi);
}

function addPalmTree(litGroup: THREE.Group, x: number, z: number, scale = 1): void {
  const tree = new THREE.Group();
  tree.position.set(x, 1.4, z);
  tree.scale.setScalar(scale);

  const trunkMat = new THREE.MeshBasicMaterial({ color: '#6b4423' });
  const leafMat = new THREE.MeshBasicMaterial({ color: '#166534' });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.28, 4.4, 6), trunkMat);
  trunk.position.y = 2.2;
  trunk.rotation.z = 0.08;
  tree.add(trunk);

  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.3, 4), leafMat);
    frond.position.set(Math.cos(angle) * 0.85 + 0.16, 4.35, Math.sin(angle) * 0.85);
    frond.rotation.y = -angle;
    frond.rotation.x = 1.25;
    tree.add(frond);
  }

  litGroup.add(tree);
}

export function buildLoyKrathongEnvironment(scene: THREE.Scene): EnvironmentRefs {
  scene.background = new THREE.Color('#04081a');
  scene.fog = new THREE.FogExp2('#070d24', 0.0072);

  // Lightweight lighting (2 PointLights + Directional + Ambient + Hemi)
  scene.add(new THREE.AmbientLight('#8da2db', 0.85));
  scene.add(new THREE.HemisphereLight('#6075c9', '#1e293b', 0.55));

  const moonLight = new THREE.DirectionalLight('#fff2c6', 1.25);
  moonLight.position.set(8, 28, -56);
  scene.add(moonLight);

  const templeLight = new THREE.PointLight('#fbbf24', 36, 42, 1.35);
  templeLight.position.set(-20, 7.5, -21);
  scene.add(templeLight);

  const pierHouseLight = new THREE.PointLight('#fcd34d', 28, 40, 1.35);
  pierHouseLight.position.set(8, 5.5, -16);
  scene.add(pierHouseLight);

  // Starfield
  const starCount = 420;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.44;
    const r = 85 + Math.random() * 25;
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi) + 8;
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 10;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  scene.add(
    new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: '#f8fafc',
        size: 0.45,
        transparent: true,
        opacity: 0.85,
      })
    )
  );

  // Full Moon + Glow halo
  const moonGroup = new THREE.Group();
  moonGroup.position.set(8, 25, -58);
  moonGroup.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(5.2, 20, 20),
      new THREE.MeshBasicMaterial({ color: '#fff8d6' })
    )
  );
  const moonGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createMoonGlowTexture(),
      color: 0xffe8a3,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  moonGlow.scale.set(28, 28, 1);
  moonGroup.add(moonGlow);
  scene.add(moonGroup);

  // River water mesh with 100% GPU vertex-shader wave animation (0 CPU cost per frame!)
  const waterUniforms = { uTime: { value: 0 } };
  const riverGeo = new THREE.PlaneGeometry(140, 29, 48, 14);
  riverGeo.rotateX(-Math.PI / 2);
  const riverMat = new THREE.MeshPhongMaterial({
    color: '#0b2948',
    emissive: '#071830',
    specular: '#fde68a',
    shininess: 75,
    flatShading: true,
  });
  riverMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = waterUniforms.uTime;
    shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      transformed.y += sin(transformed.x * 0.25 - uTime * 1.65) * 0.055 + cos(transformed.z * 0.45 + uTime * 1.1) * 0.04;`
    );
  };
  scene.add(new THREE.Mesh(riverGeo, riverMat));

  // Shimmering moon reflection path on river water
  const shimmerBars: THREE.Mesh[] = [];
  const shimmerGeo = new THREE.PlaneGeometry(2.6, 0.36);
  shimmerGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < 12; i += 1) {
    const bar = new THREE.Mesh(
      shimmerGeo,
      new THREE.MeshBasicMaterial({
        color: '#fef08a',
        transparent: true,
        opacity: 0.2 - i * 0.008,
        depthWrite: false,
      })
    );
    bar.scale.x = 1.2 - i * 0.045;
    bar.position.set(4.5 + (i % 2 === 0 ? 0.3 : -0.3), 0.02, -11.5 + i * 2.1);
    scene.add(bar);
    shimmerBars.push(bar);
  }

  // Merge all static scenery into just 2 draw calls (lit scenery + glowing windows/lamps)
  const staticLitGroup = new THREE.Group();
  const staticGlowGroup = new THREE.Group();

  const grassMat = new THREE.MeshBasicMaterial({ color: '#143322' });
  const stoneMat = new THREE.MeshBasicMaterial({ color: '#334155' });
  const walkwayMat = new THREE.MeshBasicMaterial({ color: '#475569' });
  const woodMat = new THREE.MeshBasicMaterial({ color: '#713f12' });
  const lampMat = new THREE.MeshBasicMaterial({ color: '#fde047' });
  const poleMat = new THREE.MeshBasicMaterial({ color: '#475569' });

  const farGround = new THREE.Mesh(new THREE.BoxGeometry(140, 3.0, 42), grassMat);
  farGround.position.set(0, 0, -35);
  staticLitGroup.add(farGround);

  const farEmbankment = new THREE.Mesh(new THREE.BoxGeometry(140, 1.8, 1.6), stoneMat);
  farEmbankment.position.set(0, 0.7, -14.2);
  staticLitGroup.add(farEmbankment);

  const walkway = new THREE.Mesh(new THREE.BoxGeometry(92, 0.12, 4.6), walkwayMat);
  walkway.position.set(0, 1.52, -17.6);
  staticLitGroup.add(walkway);

  const nearGround = new THREE.Mesh(new THREE.BoxGeometry(140, 2.8, 32), grassMat);
  nearGround.position.set(0, -0.1, 30);
  staticLitGroup.add(nearGround);

  const nearEmbankment = new THREE.Mesh(new THREE.BoxGeometry(140, 1.5, 1.4), stoneMat);
  nearEmbankment.position.set(0, 0.55, 14.3);
  staticLitGroup.add(nearEmbankment);

  // Wooden Pier
  const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.25, 6.2), woodMat);
  pierDeck.position.set(0, 1.35, -12.0);
  staticLitGroup.add(pierDeck);

  const pierPostGeo = new THREE.CylinderGeometry(0.14, 0.16, 2.6, 6);
  for (const px of [-2.8, 0, 2.8]) {
    for (const pz of [-9.3, -12.0, -14.3]) {
      const post = new THREE.Mesh(pierPostGeo, woodMat);
      post.position.set(px, 0.5, pz);
      staticLitGroup.add(post);
    }
  }

  const pierPoleGeo = new THREE.CylinderGeometry(0.08, 0.1, 2.6, 6);
  const pierLampGeo = new THREE.SphereGeometry(0.26, 8, 8);
  for (const px of [-2.8, 2.8]) {
    const pole = new THREE.Mesh(pierPoleGeo, woodMat);
    pole.position.set(px, 2.6, -9.4);
    staticLitGroup.add(pole);

    const lamp = new THREE.Mesh(pierLampGeo, lampMat);
    lamp.position.set(px, 3.9, -9.4);
    staticGlowGroup.add(lamp);
  }

  // Temple, Chedi & Thai Houses
  addThaiTemple(staticLitGroup, staticGlowGroup, -15, -26.5);
  addThaiChedi(staticLitGroup, -29, -25.5);

  addThaiHouse(staticLitGroup, staticGlowGroup, 11, -23.5, 0.08, 1.0, '#6d4124', '#7c2d12');
  addThaiHouse(staticLitGroup, staticGlowGroup, 23, -24.5, -0.1, 1.05, '#5b341b', '#9a3412');
  addThaiHouse(staticLitGroup, staticGlowGroup, 35, -22.5, -0.25, 0.92, '#783f22', '#7f1d1d');
  addThaiHouse(staticLitGroup, staticGlowGroup, -18, 22.5, Math.PI - 0.12, 0.95, '#5c3a21', '#7c2d12');
  addThaiHouse(staticLitGroup, staticGlowGroup, 20, 23.0, Math.PI + 0.15, 0.95, '#6b4226', '#9a3412');

  // Lantern poles merged; colorful lantern orbs kept with shared geometry
  const lanternColors = ['#f43f5e', '#fbbf24', '#38bdf8', '#a855f7', '#34d399', '#fb923c'];
  const lanterns: THREE.Mesh[] = [];
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.09, 3.4, 5);
  const orbGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.45, 7);
  for (let i = -32; i <= 32; i += 4) {
    if (Math.abs(i) < 3) continue;
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(i, 3.2, -15.4);
    staticLitGroup.add(pole);

    const orb = new THREE.Mesh(
      orbGeo,
      new THREE.MeshBasicMaterial({
        color: lanternColors[Math.abs(i / 4) % lanternColors.length],
      })
    );
    orb.position.set(i, 4.95, -15.4);
    scene.add(orb);
    lanterns.push(orb);
  }

  // Palm trees
  const treeCoords: Array<[number, number, number]> = [
    [-38, -18, 1.15],
    [-35, -29, 1.25],
    [-22, -31, 1.05],
    [-4, -24, 1.1],
    [4, -25, 1.0],
    [17, -28, 1.2],
    [30, -27, 1.15],
    [41, -18, 1.05],
    [-32, 18, 1.1],
    [-8, 19, 1.2],
    [8, 18, 1.05],
    [33, 19, 1.15],
  ];
  for (const [tx, tz, ts] of treeCoords) {
    addPalmTree(staticLitGroup, tx, tz, ts);
  }

  scene.add(
    mergeGroupToSingleMesh(
      staticLitGroup,
      new THREE.MeshLambertMaterial({ vertexColors: true })
    )
  );
  scene.add(
    mergeGroupToSingleMesh(
      staticGlowGroup,
      new THREE.MeshBasicMaterial({ vertexColors: true })
    )
  );

  // Dispose temporary scenery geometries/materials
  staticLitGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.geometry.dispose();
  });
  staticGlowGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.geometry.dispose();
  });

  return {
    update(elapsed: number) {
      waterUniforms.uTime.value = elapsed;

      shimmerBars.forEach((bar, idx) => {
        bar.position.x = 4.6 + Math.sin(elapsed * 1.8 + idx * 0.65) * 0.55;
        (bar.material as THREE.MeshBasicMaterial).opacity =
          0.14 + Math.sin(elapsed * 2.5 + idx) * 0.07;
      });

      lanterns.forEach((orb, idx) => {
        orb.rotation.z = Math.sin(elapsed * 1.6 + idx) * 0.08;
      });
    },
  };
}
