import * as THREE from 'three';
import { buildMantle } from './mantle.js';
import { ARM_COUNT, armPoint } from './tentacleMath.js';
import { SculptedTentacles } from './sculptedTentacles.js';

function torus(radius, tube, material, segments = 48) {
  return new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, segments), material);
}
function sphere(radius, material, detail = 24) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, detail, 16), material);
}

/** Self-contained, asset-free, animated procedural robot. Geometry is built once. */
export class Octopus {
  constructor(scene) {
    this.root = new THREE.Group();
    this.root.name = 'OCTO / synthetic octopod';
    scene.add(this.root);
    this._buildMaterials();
    this._buildHead();
    this._buildArms();
  }

  _buildMaterials() {
    this.chrome = new THREE.MeshPhysicalMaterial({
      color: 0xc9d4ee, metalness: 0.96, roughness: 0.16,
      clearcoat: 0.32, clearcoatRoughness: 0.14,
      envMapIntensity: 1.6,
    });
    this.darkChrome = new THREE.MeshPhysicalMaterial({
      color: 0x293551, metalness: 0.91, roughness: 0.25,
      clearcoat: 0.3, envMapIntensity: 1.7,
    });
    this.gold = new THREE.MeshPhysicalMaterial({
      color: 0xeab77d, metalness: 0.89, roughness: 0.22,
      clearcoat: 1, envMapIntensity: 1.55,
    });
    this.glass = new THREE.MeshPhysicalMaterial({
      color: 0xd3d7dc, metalness: 0, roughness: 0.12,
      specularIntensity: 0.85, clearcoat: 0.18, clearcoatRoughness: 0.11,
      transparent: true, opacity: 0.23, depthWrite: false, envMapIntensity: 0.8,
    });
    this.glow = new THREE.MeshBasicMaterial({color: new THREE.Color(0xffac58).multiplyScalar(1.55), toneMapped: false});
    this.purple = new THREE.MeshBasicMaterial({color: 0x9a7aff, toneMapped: false});
    this.blue = new THREE.MeshBasicMaterial({color: 0x4dbbff, toneMapped: false});
    this.core = new THREE.MeshBasicMaterial({color: new THREE.Color(0xffe9c4).multiplyScalar(2.2), toneMapped: false});
  }

  _buildHead() {
    const {head, collar, rotor} = buildMantle(this);
    this.head = head;
    this.reactor = rotor;
    this.head.position.set(0.22, 0.53, 0.14);
    this.root.add(collar, this.head);
  }

  _buildArms() {
    for (let arm = 0; arm < ARM_COUNT; arm++) {
      // Socket that makes the procedural geometry visually connect to the head.
      const mount = new THREE.Group();
      const point = armPoint(arm, 0, 0);
      mount.position.set(...point);
      const socket = sphere(0.32, this.chrome);
      socket.scale.z = 0.8;
      mount.add(socket);
      const bolt = torus(0.23, 0.038, this.gold, 36);
      bolt.position.z = 0.21;
      mount.add(bolt);
      this.root.add(mount);
    }
    this.sculpted = new SculptedTentacles(this.root, this);
    this.update(0);
  }

  update(time) {
    this.root.position.y = Math.sin(time * 0.59) * 0.12;
    this.root.rotation.y = Math.sin(time * 0.17) * 0.075;
    this.head.rotation.z = -0.34 + Math.sin(time * 0.42) * 0.038;
    this.head.rotation.y = Math.sin(time * 0.28) * 0.09;

    this.reactor.rotation.z = time * 0.22;
    this.sculpted.update(time);
  }

  dispose() {
    const geometries = new Set();
    const materials = new Set();
    this.root.traverse(obj => {
      if (obj.geometry) geometries.add(obj.geometry);
      if (obj.material) [obj.material].flat().forEach(material => materials.add(material));
    });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
    this.root.parent?.remove(this.root);
  }
}
