import * as THREE from 'three';
import { apertureSurface, armorStrip, createMantle } from './mantleGeometry.js';

const torus = (radius, tube, material) =>
  new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 6, 48), material);

function apertureTrim(opening, thickness, material, inset = 0) {
  const path = new THREE.CatmullRomCurve3(
    opening.map(point => point.clone().add(new THREE.Vector3(0, 0, inset))), true,
  );
  return new THREE.Mesh(new THREE.TubeGeometry(path, 102, thickness, 7, true), material);
}

function buildReactor(materials) {
  const {chrome, darkChrome, gold, glow, purple, core} = materials;
  const chamber = new THREE.Group();
  chamber.position.set(0.37, 0.94, 0.25);
  chamber.rotation.set(0.08, 0.38, -0.14);

  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.35, 0.17, 12), darkChrome);
  mount.rotation.x = Math.PI / 2;
  mount.position.z = -0.12;
  chamber.add(mount);

  const housing = torus(0.285, 0.041, chrome);
  housing.position.z = -0.042;
  const bevel = torus(0.248, 0.020, gold);
  bevel.position.z = 0.001;
  const conductor = torus(0.198, 0.009, purple);
  conductor.position.z = -0.006;
  chamber.add(housing, bevel, conductor);

  const rotor = new THREE.Group();
  chamber.add(rotor);
  const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.081, 0.026, 0.044), gold, 12);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < fins.count; i++) {
    const angle = i * Math.PI / 6;
    matrix.makeRotationZ(angle + 0.27).setPosition(0.221 * Math.cos(angle), 0.221 * Math.sin(angle), 0.014);
    fins.setMatrixAt(i, matrix);
  }

  const cradle = torus(0.127, 0.024, gold);
  cradle.position.z = 0.044;
  const filament = torus(0.158, 0.009, glow);
  filament.position.z = 0.030;
  const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), core);
  nucleus.scale.set(1, 1, 0.58);
  nucleus.position.z = 0.059;
  rotor.add(fins, cradle, filament, nucleus);
  return {chamber, rotor};
}

function buildOptic({darkChrome, gold, glow, core}) {
  const optic = new THREE.Group();
  optic.position.set(-0.24, -0.29, 0.55);
  optic.rotation.set(0.07, -0.20, 0);
  const seat = new THREE.Mesh(new THREE.SphereGeometry(0.20, 24, 14), darkChrome);
  seat.scale.z = 0.47;
  const bezel = torus(0.147, 0.023, gold);
  bezel.position.z = 0.082;
  const iris = torus(0.090, 0.012, glow);
  iris.position.z = 0.093;
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.044, 16, 10), core);
  pupil.scale.z = 0.46;
  pupil.position.z = 0.099;
  optic.add(seat, bezel, iris, pupil);
  return optic;
}

export function buildMantle(materials) {
  const {chrome, darkChrome, gold, glass} = materials;
  const head = new THREE.Group();
  const {shell, opening} = createMantle();
  head.add(new THREE.Mesh(shell, chrome));

  // Long plates follow the same loft, leaving dark channels along the back and cheek.
  for (const [from, to, path, spread, offset, material] of [
    [3, 37, u => 47 + 1.8 * u, 5.4, 0.058, darkChrome],
    [4, 37, u => 44 - 1.4 * Math.sin(Math.PI * u), 1.55, 0.081, chrome],
    [8, 38, u => 2.4 + 1.3 * Math.sin(Math.PI * u), 1.24, 0.076, chrome],
    [8, 35, u => 7.5 + 2.7 * u, 3.4, 0.053, darkChrome],
    [5, 36, u => 39.7 - 1.7 * u, 3.5, 0.068, chrome],
  ]) {
    head.add(new THREE.Mesh(armorStrip(from, to, path, spread, offset), material));
  }

  // Three small service latches articulate the rear spine without a second focal point.
  for (const [from, to] of [[12, 15], [18, 21], [24, 27]]) {
    const latch = armorStrip(from, to, u => 48.2 - 0.35 * u, 1.55, 0.082);
    head.add(new THREE.Mesh(latch, gold));
  }

  const bulkhead = apertureSurface(opening, new THREE.Vector3(0.28, 0.8, -0.36),
    [[1, -0.006], [0.94, -0.19], [0.73, -0.15], [0.40, -0.08]]);
  head.add(new THREE.Mesh(bulkhead, darkChrome));
  head.add(apertureTrim(opening, 0.036, darkChrome), apertureTrim(opening, 0.013, gold, 0.025));

  // One convex glazing surface over the recessed assembly, with an opaque throat behind it.
  const glazing = new THREE.Mesh(apertureSurface(opening, new THREE.Vector3(0.38, 0.94, 0.58),
    [[1, -0.014], [0.83, 0.018], [0.62, 0.032], [0.38, 0.027], [0.17, 0.015]]), glass);
  head.add(glazing);

  const {chamber, rotor} = buildReactor(materials);
  head.add(chamber, buildOptic(materials));

  const collar = new THREE.Group();
  collar.name = 'Mantle bearing';
  const bearing = new THREE.Mesh(new THREE.SphereGeometry(0.69, 32, 16), darkChrome);
  bearing.scale.set(1.02, 0.56, 0.73);
  bearing.position.set(0, -0.31, -0.15);
  const flange = torus(0.565, 0.041, chrome);
  flange.scale.set(1, 0.79, 0.67);
  flange.position.set(0, -0.31, -0.27);
  collar.add(bearing, flange);
  return {head, collar, rotor};
}
