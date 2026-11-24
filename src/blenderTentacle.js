import { DynamicDrawUsage, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import assetUrl from './assets/blender-tentacle.glb?url';
import { PANEL_SPACING, RING_STEPS } from './tentacleSweep.js';

const LENGTH = 4.35;
const ringOffsets = Array.from({length: RING_STEPS + 1}, (_, ring) =>
  Math.floor(ring / 5) * 5 + PANEL_SPACING[ring % 5]);

export async function loadBlenderTentacle() {
  const start = performance.now();
  const response = await fetch(assetUrl);
  if (!response.ok) throw new Error('Tentacle asset unavailable');
  const bytes = await response.arrayBuffer();
  const fetched = performance.now();
  const {scene} = await new GLTFLoader().parseAsync(bytes, '');
  const meshes = [];
  const side = new Vector3();
  const under = new Vector3();
  const tangent = new Vector3();

  const dispose = () => scene.traverse(mesh => {
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  try {
    scene.traverse(mesh => {
      if (!mesh.isMesh) return;
      const {position, normal} = mesh.geometry.attributes;
      if (!position || !normal || position.count !== normal.count) throw new Error('Invalid tentacle mesh');
      mesh.frustumCulled = false;
      position.setUsage(DynamicDrawUsage);
      normal.setUsage(DynamicDrawUsage);
      const rest = position.array.slice();
      const restNormals = normal.array.slice();
      const rings = new Uint8Array(position.count);
      const blends = new Float32Array(position.count);
      for (let i = 0; i < position.count; i++) {
        const offset = rest[i * 3 + 1] / LENGTH * RING_STEPS;
        if (!Number.isFinite(offset) || offset < -0.001 || offset > RING_STEPS + 0.001) {
          throw new Error('Tentacle vertex outside bind span');
        }
        const next = ringOffsets.findIndex(value => value > offset);
        const ring = Math.max(0, next === -1 ? RING_STEPS - 1 : next - 1);
        rings[i] = ring;
        blends[i] = Math.max(0, Math.min(1, (offset - ringOffsets[ring]) / (ringOffsets[ring + 1] - ringOffsets[ring])));
      }
      meshes.push({mesh, position, normal, rest, restNormals, rings, blends});
    });
    if (meshes.length !== 5) throw new Error('Incomplete tentacle asset');
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    scene, dispose,
    metrics: {bytes: bytes.byteLength, fetchMs: fetched - start, parseAndBindMs: performance.now() - fetched},
    inspectGeometry() {
      const spine = meshes.find(({mesh}) => mesh.name === 'Recessed_mechanical_spine');
      const rootVertices = [];
      const vertex = new Vector3();
      for (let i = 0; i < spine.position.count; i++) {
        if (spine.rest[i * 3 + 1] !== 0) continue;
        vertex.fromBufferAttribute(spine.position, i);
        rootVertices.push(scene.parent.worldToLocal(spine.mesh.localToWorld(vertex)).toArray());
      }
      return {
        rootVertices,
        meshes: meshes.map(({position, normal}) => ({
          positions: Array.from(position.array), normals: Array.from(normal.array),
        })),
      };
    },
    update({centers, sides, undersides}) {
      for (const {position, normal, rest, restNormals, rings, blends} of meshes) {
        const p = position.array;
        const n = normal.array;
        for (let i = 0; i < rings.length; i++) {
          const ring = rings[i];
          const next = ring + 1;
          const mix = blends[i];
          const offset = i * 3;
          side.lerpVectors(sides[ring], sides[next], mix).normalize();
          under.lerpVectors(undersides[ring], undersides[next], mix).normalize();
          tangent.crossVectors(under, side);
          for (const [axis, key] of AXES) {
            p[offset + axis] = centers[ring][key] + (centers[next][key] - centers[ring][key]) * mix
              + side[key] * rest[offset] + under[key] * rest[offset + 2];
            n[offset + axis] = side[key] * restNormals[offset] + tangent[key] * restNormals[offset + 1]
              + under[key] * restNormals[offset + 2];
          }
        }
        position.needsUpdate = true;
        normal.needsUpdate = true;
      }
    },
  };
}

const AXES = [[0, 'x'], [1, 'y'], [2, 'z']];
