import * as THREE from 'three';
import { PANEL_COUNT, TentacleSweep } from './tentacleSweep.js';

export class SculptedTentacles {
  constructor(root, materials, firstArm, armCount) {
    this.firstArm = firstArm;
    this.arms = Array.from({length: armCount}, () => {
      const sweep = new TentacleSweep();
      const mesh = new THREE.Mesh(sweep.geometry, [materials.chrome, materials.darkChrome]);
      // Bounds are animated. The eight small meshes share the octopus's visible region.
      mesh.frustumCulled = false;
      root.add(mesh);
      return sweep;
    });

    this.housing = this.buildEmitters(root, new THREE.TorusGeometry(1, 0.14, 5, 14), materials.gold);
    this.emitter = this.buildEmitters(root, new THREE.TorusGeometry(0.73, 0.12, 5, 14), materials.glow);
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

  update(time) {
    for (let arm = 0; arm < this.arms.length; arm++) {
      const sweep = this.arms[arm];
      sweep.update(this.firstArm + arm, time);
      for (let panel = 0; panel < PANEL_COUNT; panel++) {
        const ring = panel * 5 + 2;
        const {centers, radii, sides, tangents, undersides} = sweep;
        const under = undersides[ring];
        const radius = radii[ring];
        const size = radius * 0.38;
        const instance = arm * PANEL_COUNT + panel;
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
