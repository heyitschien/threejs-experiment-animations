import * as THREE from 'three';
import { sampleArmPoint, TAU } from './tentacleMath.js';

export const PANEL_COUNT = 12;
export const RING_STEPS = PANEL_COUNT * 5;
export const SIDES = 12;
const CENTER_SAMPLES = 144;
const RING_VERTICES = (RING_STEPS + 1) * SIDES;
const UNDER = new THREE.Vector3(0, 0, 1);
const PANEL_SPACING = [0, 0.46, 1.6, 2.73, 4.02];
const GROOVES = [0.94, 1, 1.025, 1.01, 0.98];

export function sweepRadius(u) {
  // A substantial shoulder, long taper, and a small closed tip.
  return 0.018 + 0.274 * (1 - u) ** 1.08;
}

const vecs = count => Array.from({length: count}, () => new THREE.Vector3());
const vertex = (ring, side) => ring * SIDES + (side + SIDES) % SIDES;
const cosines = Array.from({length: SIDES}, (_, i) => Math.cos(i * TAU / SIDES));
const sines = Array.from({length: SIDES}, (_, i) => Math.sin(i * TAU / SIDES));

export class TentacleSweep {
  constructor() {
    this.samples = vecs(CENTER_SAMPLES + 1);
    this.arc = new Float64Array(CENTER_SAMPLES + 1);
    this.centers = vecs(RING_STEPS + 1);
    this.tangents = vecs(RING_STEPS + 1);
    this.undersides = vecs(RING_STEPS + 1);
    this.sides = vecs(RING_STEPS + 1);
    this.radii = new Float64Array(RING_STEPS + 1);
    this.transport = new THREE.Quaternion();

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array((RING_VERTICES + 2) * 3);
    this.normals = new Float32Array(this.positions.length);
    for (const [name, data] of [['position', this.positions], ['normal', this.normals]]) {
      this.geometry.setAttribute(name, new THREE.BufferAttribute(data, 3).setUsage(THREE.DynamicDrawUsage));
    }

    const armor = [];
    const core = [];
    for (let ring = 0; ring < RING_STEPS; ring++) {
      for (let side = 0; side < SIDES; side++) {
        const underside = side === 0 || side === SIDES - 1;
        const seam = ring % 5 === 0;
        const triangles = underside || seam ? core : armor;
        const a = vertex(ring, side);
        const b = vertex(ring, side + 1);
        const c = vertex(ring + 1, side);
        const d = vertex(ring + 1, side + 1);
        triangles.push(a, b, c, b, d, c);
      }
    }
    for (let side = 0; side < SIDES; side++) {
      core.push(RING_VERTICES, vertex(0, side + 1), vertex(0, side));
      core.push(RING_VERTICES + 1, vertex(RING_STEPS, side), vertex(RING_STEPS, side + 1));
    }
    this.geometry.setIndex([...armor, ...core]);
    this.geometry.addGroup(0, armor.length, 0);
    this.geometry.addGroup(armor.length, core.length, 1);
    this.angular = new THREE.Vector3();
    this.axial = new THREE.Vector3();
    this.radial = new THREE.Vector3();
  }

  update(arm, time) {
    const {arc, centers, samples, tangents, undersides, sides, radii, positions, normals} = this;
    for (let i = 0; i <= CENTER_SAMPLES; i++) {
      sampleArmPoint(samples[i], arm, i / CENTER_SAMPLES, time);
      if (i > 0) arc[i] = arc[i - 1] + samples[i].distanceTo(samples[i - 1]);
    }

    let sample = 1;
    for (let ring = 0; ring <= RING_STEPS; ring++) {
      const offset = Math.floor(ring / 5) * 5 + PANEL_SPACING[ring % 5];
      const distance = arc[CENTER_SAMPLES] * offset / RING_STEPS;
      while (sample < CENTER_SAMPLES && arc[sample] < distance) sample++;
      const width = arc[sample] - arc[sample - 1];
      const blend = width > 0 ? (distance - arc[sample - 1]) / width : 0;
      centers[ring].lerpVectors(samples[sample - 1], samples[sample], blend);
    }

    for (let ring = 0; ring <= RING_STEPS; ring++) {
      const previous = Math.max(0, ring - 1);
      const next = Math.min(RING_STEPS, ring + 1);
      const tangent = tangents[ring].subVectors(centers[next], centers[previous]).normalize();
      if (tangent.lengthSq() === 0) tangent.copy(tangents[previous]);
      const under = undersides[ring];
      if (ring === 0) {
        // The seated root has a fixed, mostly horizontal tangent.
        under.copy(UNDER).addScaledVector(tangent, -UNDER.dot(tangent)).normalize();
      } else {
        this.transport.setFromUnitVectors(tangents[previous], tangent);
        under.copy(undersides[previous]).applyQuaternion(this.transport);
      }
      const side = sides[ring].crossVectors(tangent, under).normalize();
      under.crossVectors(side, tangent);
      const radius = sweepRadius(ring / RING_STEPS) * GROOVES[ring % 5];
      radii[ring] = radius;
      const center = centers[ring];

      for (let angle = 0; angle < SIDES; angle++) {
        this.radial.copy(center)
          .addScaledVector(under, radius * cosines[angle] * 0.88)
          .addScaledVector(side, radius * sines[angle])
          .toArray(positions, vertex(ring, angle) * 3);
      }
    }

    // Differentiate the deformed surface in both directions, including the taper.
    for (let ring = 0; ring <= RING_STEPS; ring++) {
      const previous = Math.max(0, ring - 1);
      const next = Math.min(RING_STEPS, ring + 1);
      for (let angle = 0; angle < SIDES; angle++) {
        this.angular.fromArray(positions, vertex(ring, angle + 1) * 3)
          .sub(this.radial.fromArray(positions, vertex(ring, angle - 1) * 3));
        this.axial.fromArray(positions, vertex(next, angle) * 3)
          .sub(this.radial.fromArray(positions, vertex(previous, angle) * 3));
        this.angular.cross(this.axial).normalize().toArray(normals, vertex(ring, angle) * 3);
      }
    }
    centers[0].toArray(positions, RING_VERTICES * 3);
    centers[RING_STEPS].toArray(positions, (RING_VERTICES + 1) * 3);
    this.radial.copy(tangents[0]).negate().toArray(normals, RING_VERTICES * 3);
    tangents[RING_STEPS].toArray(normals, (RING_VERTICES + 1) * 3);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
  }
}
