import * as THREE from 'three';
import { ARM_COUNT, armPoint, TAU } from './tentacleMath.js';
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
      color: 0x6575cb, metalness: 0.37, roughness: 0.08,
      clearcoat: 1, clearcoatRoughness: 0.04,
      transparent: true, opacity: 0.46,
      depthWrite: false, envMapIntensity: 1.15,
    });
    this.glow = new THREE.MeshBasicMaterial({color: new THREE.Color(0xffac58).multiplyScalar(1.55), toneMapped: false});
    this.purple = new THREE.MeshBasicMaterial({color: 0x9a7aff, toneMapped: false});
    this.blue = new THREE.MeshBasicMaterial({color: 0x4dbbff, toneMapped: false});
    this.core = new THREE.MeshBasicMaterial({color: new THREE.Color(0xffe9c4).multiplyScalar(2.2), toneMapped: false});
  }

  _buildHead() {
    this.head = new THREE.Group();
    this.head.position.set(0.22, 0.53, 0.14);
    this.root.add(this.head);

    // Sculptural head silhouette: armored lower mantle and iridescent upper dome.
    const lower = sphere(0.7, this.chrome, 48);
    lower.scale.set(1.16, 1.22, 0.99);
    lower.position.y = -0.35;
    this.head.add(lower);
    const dome = sphere(0.78, this.glass, 64);
    dome.scale.set(1.12, 1.2, 0.91);
    dome.position.y = 0.52;
    this.head.add(dome);

    // Wrap the back of the reactor in a swept chrome shell.
    const mantle = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 48, 28, 2.55, 4.16),
      this.chrome,
    );
    mantle.scale.set(1.09, 1.23, 0.9);
    mantle.rotation.y = 0.29;
    mantle.position.copy(dome.position);
    this.head.add(mantle);

    for (let i = 0; i < 4; i++) {
      const hoop = torus(0.79 - i * 0.035, 0.012, i % 2 ? this.purple : this.gold, 64);
      hoop.scale.y = 1.17;
      hoop.rotation.set(0.10 + i * 0.29, -0.22 - i * 0.26, -0.32);
      hoop.position.copy(dome.position);
      this.head.add(hoop);
    }

    // Equatorial bands and rivets.
    for (let n = 0; n < 3; n++) {
      const band = torus(0.61 + n * 0.085, n === 0 ? 0.06 : 0.018,
        n === 0 ? this.darkChrome : this.gold, 72);
      band.rotation.x = Math.PI / 2;
      band.scale.y = 0.9;
      band.position.y = -0.21 - n * 0.14;
      this.head.add(band);
    }
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * TAU;
      const rivet = sphere(0.029, this.gold, 10);
      rivet.position.set(0.76 * Math.cos(angle), -0.22, 0.69 * Math.sin(angle));
      this.head.add(rivet);
    }

    // Visible inner reactor: layered geometry yields rich specular detail without meshes.
    const halo = new THREE.Group();
    halo.position.set(0.14, 0.52, 0.37);
    this.head.add(halo);
    this.reactor = halo;
    const nucleus = sphere(0.23, this.core, 32);
    halo.add(nucleus);
    const innerCore = sphere(0.30, this.glow, 32);
    innerCore.material = new THREE.MeshBasicMaterial({
      color: 0xffa653, transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false,
    });
    halo.add(innerCore);
    for (let i = 0; i < 4; i++) {
      const r = torus(0.33 + i * 0.11, i % 2 === 0 ? 0.018 : 0.009,
        i === 0 ? this.gold : this.purple);
      r.rotation.set(0.25 + i * 0.37, 0.8 * i, i * 0.47);
      halo.add(r);
    }
    const wiring = new THREE.IcosahedronGeometry(0.55, 1);
    this.innerFrame = new THREE.LineSegments(new THREE.EdgesGeometry(wiring),
      new THREE.LineBasicMaterial({color: 0x6d8dff, transparent: true, opacity: 0.34}));
    wiring.dispose();
    halo.add(this.innerFrame);

    // Single frontal optic / 'eye'.
    const optic = new THREE.Group();
    optic.position.set(0.21, -0.20, 0.70);
    optic.rotation.y = -0.20;
    this.head.add(optic);
    const housing = sphere(0.29, this.darkChrome);
    housing.scale.z = 0.43;
    optic.add(housing);
    for (let n = 0; n < 4; n++) {
      const iris = torus(0.25 - n * 0.048, 0.018 + (n === 0 ? 0.02 : 0),
        n % 2 ? this.glow : this.gold, 56);
      iris.position.z = 0.14 + n * 0.006;
      optic.add(iris);
    }
    const pupil = sphere(0.078, this.core, 24);
    pupil.position.z = 0.19;
    pupil.scale.z = 0.45;
    optic.add(pupil);

    // Decorative gill fins around cheek and central collar.
    for (let k = -1; k <= 1; k += 2) {
      for (let n = 0; n < 4; n++) {
        const fin = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.045, 0.31 - n * 0.038, 6, 12),
          n % 2 === 0 ? this.gold : this.darkChrome,
        );
        fin.position.set(k * (0.43 + n * 0.066), -0.36 - n * 0.11, 0.48 - n * 0.065);
        fin.rotation.z = k * (0.38 + n * 0.1);
        this.head.add(fin);
      }
    }
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
    this.reactor.rotation.y = time * 0.22;
    this.reactor.rotation.z = Math.sin(time * 0.31) * 0.2;
    this.innerFrame.rotation.x = time * 0.09;

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
