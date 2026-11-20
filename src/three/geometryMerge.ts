import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function bakeMeshWithColor(
  mesh: THREE.Mesh,
  rootMatrixInverse: THREE.Matrix4
): THREE.BufferGeometry | null {
  const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  const baseColor =
    mat && 'color' in mat && mat.color instanceof THREE.Color
      ? mat.color
      : new THREE.Color('#ffffff');

  const rawGeo = mesh.geometry;
  const nonIndexed = rawGeo.index ? rawGeo.toNonIndexed() : rawGeo.clone();
  nonIndexed.deleteAttribute('uv');
  if (!nonIndexed.getAttribute('normal')) {
    nonIndexed.computeVertexNormals();
  }

  const relativeMatrix = new THREE.Matrix4().multiplyMatrices(
    rootMatrixInverse,
    mesh.matrixWorld
  );
  nonIndexed.applyMatrix4(relativeMatrix);

  const posAttr = nonIndexed.getAttribute('position');
  if (!posAttr) return null;

  const colors = new Float32Array(posAttr.count * 3);
  for (let i = 0; i < posAttr.count; i += 1) {
    colors[i * 3] = baseColor.r;
    colors[i * 3 + 1] = baseColor.g;
    colors[i * 3 + 2] = baseColor.b;
  }
  nonIndexed.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return nonIndexed;
}

/**
 * Merges all static child meshes of a temporary Group into one vertex-colored Mesh
 * to drastically reduce WebGL draw calls.
 */
export function mergeGroupToSingleMesh(
  sourceGroup: THREE.Group,
  material: THREE.Material
): THREE.Mesh {
  sourceGroup.updateMatrixWorld(true);
  const rootInverse = new THREE.Matrix4().copy(sourceGroup.matrixWorld).invert();

  const geometries: THREE.BufferGeometry[] = [];
  sourceGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry) {
      const baked = bakeMeshWithColor(obj, rootInverse);
      if (baked) geometries.push(baked);
    }
  });

  if (geometries.length === 0) {
    return new THREE.Mesh(new THREE.BufferGeometry(), material);
  }

  const merged = mergeGeometries(geometries, false);
  for (const g of geometries) g.dispose();

  return new THREE.Mesh(merged, material);
}
