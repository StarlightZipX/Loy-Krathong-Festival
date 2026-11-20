import * as THREE from 'three';

interface VisitorActor {
  group: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  waypoints: THREE.Vector3[];
  currentTargetIdx: number;
  speed: number;
  phaseOffset: number;
  pauseTimer: number;
}

export interface VisitorsController {
  update: (delta: number, elapsed: number) => void;
}

const SHIRT_COLORS = [
  '#f43f5e',
  '#38bdf8',
  '#fbbf24',
  '#34d399',
  '#a78bfa',
  '#fb923c',
  '#ec4899',
  '#2dd4bf',
  '#f8fafc',
  '#facc15',
];

const PANTS_COLORS = ['#1e293b', '#334155', '#3f2e26', '#1e3a5f', '#4c1d95'];
const SKIN_TONES = ['#f3cfb3', '#e6b893', '#d49a6e', '#f7d9c0'];

function createSharedVisitorAssets() {
  const torsoGeo = new THREE.BoxGeometry(0.42, 0.56, 0.24);
  const headGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const hairGeo = new THREE.SphereGeometry(0.19, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const armGeo = new THREE.BoxGeometry(0.13, 0.48, 0.13);
  armGeo.translate(0, -0.2, 0);
  const legGeo = new THREE.BoxGeometry(0.16, 0.58, 0.16);
  legGeo.translate(0, -0.28, 0);

  const skinMats = SKIN_TONES.map((color) => new THREE.MeshLambertMaterial({ color }));
  const shirtMats = SHIRT_COLORS.map((color) => new THREE.MeshLambertMaterial({ color }));
  const pantsMats = PANTS_COLORS.map((color) => new THREE.MeshLambertMaterial({ color }));
  const hairMats = [
    new THREE.MeshLambertMaterial({ color: '#3b2417' }),
    new THREE.MeshLambertMaterial({ color: '#111827' }),
  ];

  return {
    torsoGeo,
    headGeo,
    hairGeo,
    armGeo,
    legGeo,
    skinMats,
    shirtMats,
    pantsMats,
    hairMats,
  };
}

function createVisitorMesh(
  index: number,
  assets: ReturnType<typeof createSharedVisitorAssets>
): Omit<
  VisitorActor,
  'waypoints' | 'currentTargetIdx' | 'speed' | 'phaseOffset' | 'pauseTimer'
> {
  const group = new THREE.Group();

  const skinMat = assets.skinMats[index % assets.skinMats.length];
  const shirtMat = assets.shirtMats[index % assets.shirtMats.length];
  const pantsMat = assets.pantsMats[index % assets.pantsMats.length];
  const hairMat = assets.hairMats[index % 4 === 0 ? 0 : 1];

  const torso = new THREE.Mesh(assets.torsoGeo, shirtMat);
  torso.position.y = 0.96;
  group.add(torso);

  const head = new THREE.Mesh(assets.headGeo, skinMat);
  head.position.y = 1.44;
  group.add(head);

  const hair = new THREE.Mesh(assets.hairGeo, hairMat);
  hair.position.y = 1.46;
  group.add(hair);

  const leftArm = new THREE.Mesh(assets.armGeo, shirtMat);
  leftArm.position.set(-0.29, 1.18, 0);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(assets.armGeo, shirtMat);
  rightArm.position.set(0.29, 1.18, 0);
  group.add(rightArm);

  const leftLeg = new THREE.Mesh(assets.legGeo, pantsMat);
  leftLeg.position.set(-0.11, 0.66, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(assets.legGeo, pantsMat);
  rightLeg.position.set(0.11, 0.66, 0);
  group.add(rightLeg);

  return { group, leftArm, rightArm, leftLeg, rightLeg };
}

function buildRouteForVisitor(index: number): THREE.Vector3[] {
  if (index < 12) {
    const startX = -30 + index * 5.4;
    const endX = Math.min(34, startX + (index % 2 === 0 ? 11 : -11));
    const zLane = -16.4 - (index % 4) * 0.85;
    return [
      new THREE.Vector3(startX, 1.58, zLane),
      new THREE.Vector3(endX, 1.58, zLane - 0.5),
      new THREE.Vector3((startX + endX) / 2, 1.58, zLane + 0.4),
    ];
  }

  if (index < 16) {
    const xOffset = -1.8 + (index - 12) * 1.15;
    return [
      new THREE.Vector3(xOffset, 1.5, -14.8),
      new THREE.Vector3(xOffset * 0.85, 1.5, -10.4),
      new THREE.Vector3(xOffset * 0.6, 1.5, -12.6),
    ];
  }

  const templeX = -31 + (index - 16) * 6.5;
  return [
    new THREE.Vector3(templeX, 1.58, -19.5),
    new THREE.Vector3(templeX + 5.5, 1.58, -21.2),
    new THREE.Vector3(templeX + 2.2, 1.58, -17.4),
  ];
}

export function createFestivalVisitors(scene: THREE.Scene): VisitorsController {
  const assets = createSharedVisitorAssets();
  const actors: VisitorActor[] = [];
  const VISITOR_COUNT = 20;

  for (let i = 0; i < VISITOR_COUNT; i += 1) {
    const meshRefs = createVisitorMesh(i, assets);
    const waypoints = buildRouteForVisitor(i);
    meshRefs.group.position.copy(waypoints[0]);
    scene.add(meshRefs.group);

    actors.push({
      ...meshRefs,
      waypoints,
      currentTargetIdx: 1 % waypoints.length,
      speed: 1.05 + (i % 5) * 0.18,
      phaseOffset: i * 0.7,
      pauseTimer: 0,
    });
  }

  const tmpDir = new THREE.Vector3();

  return {
    update(delta: number, elapsed: number) {
      for (const actor of actors) {
        if (actor.pauseTimer > 0) {
          actor.pauseTimer -= delta;
          actor.leftArm.rotation.x *= 0.85;
          actor.rightArm.rotation.x *= 0.85;
          actor.leftLeg.rotation.x *= 0.85;
          actor.rightLeg.rotation.x *= 0.85;
          continue;
        }

        const target = actor.waypoints[actor.currentTargetIdx];
        tmpDir.subVectors(target, actor.group.position);
        tmpDir.y = 0;
        const dist = tmpDir.length();

        if (dist < 0.25) {
          actor.currentTargetIdx = (actor.currentTargetIdx + 1) % actor.waypoints.length;
          if (actor.currentTargetIdx === 1) {
            actor.pauseTimer = 1.2 + (actor.phaseOffset % 1.4);
          }
          continue;
        }

        tmpDir.normalize();
        actor.group.position.addScaledVector(tmpDir, actor.speed * delta);

        const targetAngle = Math.atan2(tmpDir.x, tmpDir.z);
        let angleDiff = targetAngle - actor.group.rotation.y;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        actor.group.rotation.y += angleDiff * Math.min(1, delta * 8);

        const stride = Math.sin(elapsed * 6.5 * (actor.speed * 0.8) + actor.phaseOffset);
        actor.leftLeg.rotation.x = stride * 0.55;
        actor.rightLeg.rotation.x = -stride * 0.55;
        actor.leftArm.rotation.x = -stride * 0.42;
        actor.rightArm.rotation.x = stride * 0.42;
      }
    },
  };
}
