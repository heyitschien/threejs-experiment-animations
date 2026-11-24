import * as THREE from 'three';
import { ARM_COUNT } from './tentacleMath.js';
import { PANEL_COUNT, TentacleSweep } from './tentacleSweep.js';

const FOREGROUND_ARM = 3;

export class SculptedTentacles {
  constructor(root, materials) {
    this.root = root;
    this.meshes = [];
    this.variant = {mode: 'procedural'};
    this.arms = Array.from({length: ARM_COUNT}, () => {
      const sweep = new TentacleSweep();
      const mesh = new THREE.Mesh(sweep.geometry, [materials.chrome, materials.darkChrome]);
      // Bounds are animated. The eight small meshes share the octopus's visible region.
      mesh.frustumCulled = false;
      root.add(mesh);
      this.meshes.push(mesh);
      return sweep;
    });

    this.housing = this.buildEmitters(root, new THREE.TorusGeometry(1, 0.14, 5, 14), materials.gold);
    this.emitter = this.buildEmitters(root, new THREE.TorusGeometry(0.77, 0.12, 5, 14), materials.glow);
    this.matrix = new THREE.Matrix4();
    this.position = new THREE.Vector3();
    this.scale = new THREE.Vector3();
  }

  buildEmitters(root, geometry, material) {
    const mesh = new THREE.InstancedMesh(geometry, material, this.arms.length * PANEL_COUNT);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(mesh);
    return mesh;
  }

  async enableBlender() {
    this.variant = {mode: 'loading'};
    try {
      const {loadBlenderTentacle} = await import('./blenderTentacle.js');
      const arm = await loadBlenderTentacle();
      if (!this.root.parent) {
        arm.dispose();
        return;
      }
      arm.update(this.arms[FOREGROUND_ARM]);
      this.root.add(arm.scene);
      this.blenderArm = arm;
      this.meshes[FOREGROUND_ARM].visible = false;
      // Keep the compact batches in the original order, excluding the replaced arm.
      for (const batch of [this.housing, this.emitter]) {
        batch.count -= PANEL_COUNT;
        for (let slot = FOREGROUND_ARM * PANEL_COUNT; slot < batch.count; slot++) {
          batch.getMatrixAt(slot + PANEL_COUNT, this.matrix);
          batch.setMatrixAt(slot, this.matrix);
        }
        batch.instanceMatrix.needsUpdate = true;
      }
      this.variant = {mode: 'blender', arm: FOREGROUND_ARM, ...arm.metrics};
    } catch {
      this.variant = {mode: 'fallback'};
    }
  }

  update(time) {
    for (let arm = 0; arm < this.arms.length; arm++) {
      const sweep = this.arms[arm];
      sweep.update(arm, time);
      if (this.blenderArm && arm === FOREGROUND_ARM) {
        this.blenderArm.update(sweep);
        continue;
      }
      for (let panel = 0; panel < PANEL_COUNT; panel++) {
        const ring = panel * 5 + 2;
        const {centers, radii, sides, tangents, undersides} = sweep;
        const under = undersides[ring];
        const radius = radii[ring];
        const size = radius * 0.42;
        const slot = this.blenderArm && arm > FOREGROUND_ARM ? arm - 1 : arm;
        const instance = slot * PANEL_COUNT + panel;
        this.position.copy(centers[ring]).addScaledVector(under, radius * 0.88 + 0.002);
        this.scale.set(size, size * 0.76, size * 0.58);
        this.matrix.makeBasis(sides[ring], tangents[ring], under).scale(this.scale);
        this.housing.setMatrixAt(instance, this.matrix.setPosition(this.position));
        this.position.addScaledVector(under, size * 0.075);
        this.emitter.setMatrixAt(instance, this.matrix.setPosition(this.position));
      }
    }
    this.housing.instanceMatrix.needsUpdate = true;
    this.emitter.instanceMatrix.needsUpdate = true;
  }
}
