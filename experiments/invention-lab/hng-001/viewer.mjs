import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { assemblyNodes, fromCad, measurePose } from './assembly.mjs';
import { demand } from '../session-0.1/geometry.mjs';

const el = (id) => document.getElementById(id);
const canvas = el('model');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14212c);
const camera = new THREE.PerspectiveCamera(35, 1, 0.001, 10);
const controls = new OrbitControls(camera, canvas);
const grid = new THREE.GridHelper(0.16, 16, 0x506273, 0x2c4053);
grid.position.y = -0.0004;
scene.add(grid, new THREE.HemisphereLight(0xd9eaff, 0x899caf, 2.25));
const light = new THREE.DirectionalLight(0xfff3df, 2.65);
light.position.set(0.07, 0.16, 0.09);
const guide = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, -0.005, 0), new THREE.Vector3(0, 0.034, 0),
]), new THREE.LineDashedMaterial({ color: 0x8bddc1, dashSize: 0.002, gapSize: 0.001, depthTest: false }));
guide.computeLineDistances();
guide.renderOrder = 2;
scene.add(light, guide);
const loader = new GLTFLoader();
let current, meshes, fixture, runId;
let pending = 0;
let playing = false;
let playStart = 0;
let width = 0, height = 0;

function reset() {
  camera.position.set(0.087, 0.095, 0.108);
  controls.target.set(0, 0.009, 0);
  controls.update();
}

function status(text, state) {
  el('status').textContent = text;
  el('status').dataset.state = state;
}

function setAngle(angle) {
  const [low, high] = fixture.joint.limits_deg;
  demand(meshes && angle >= low && angle <= high, 'Joint angle out of range');
  meshes.moving.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(angle));
  const probe = meshes.moving.localToWorld(new THREE.Vector3(...fromCad(fixture.parts.moving.witness))).multiplyScalar(1000);
  const values = [probe.x, -probe.z, probe.y];
  el('witness').textContent = values.map((v) => v.toFixed(3)).join(', ') + ' mm';
  el('angle').value = angle;
  el('angle-value').textContent = Number(angle.toFixed(1)) + '°';
  for (const button of el('poses').querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.angle) === angle));
  }
}

function stop() {
  playing = false;
  el('play').textContent = 'Play motion';
}

async function fetchOk(url) {
  const response = await fetch(url, { cache: 'no-store' });
  demand(response.ok, `${url} returned HTTP ${response.status}`);
  return response;
}

function disposeModel(model) {
  model?.traverse((node) => {
    if (node.isMesh) {
      node.geometry.dispose();
      for (const material of [node.material].flat()) material.dispose();
    }
  });
}

async function loadPose(id) {
  const request = ++pending;
  stop();
  status('Checking assembly', 'loading');
  let gltf;
  try {
    const payload = await (await fetchOk(`/assets/${id}.glb`)).arrayBuffer();
    const receipt = await (await fetchOk('/geometry.json')).json();
    demand(receipt.schema === 1 && receipt.passed === true && receipt.run_id === runId &&
      JSON.stringify(receipt.fixture) === JSON.stringify(fixture), 'Stale or mismatched run receipt');
    const pose = fixture.poses.find((p) => p.id === id);
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', payload)),
      (b) => b.toString(16).padStart(2, '0')).join('');
    demand(pose && receipt.poses[id]?.sha256 === digest, 'GLB hash does not match the run receipt');
    gltf = await loader.parseAsync(payload, '');
    const verified = measurePose(gltf, fixture, pose);
    const validateNames = Object.keys(verified).sort().join(',');
    demand(validateNames === Object.values(fixture.parts).map((p) => p.id).sort().join(','), 'Unexpected part IDs');
    const air = [receipt.fit.radial_gap_mm, ...receipt.fit.axial_gaps_mm];
    demand(air.length === 3 && air.every(Number.isFinite), 'Invalid clearance receipt');
    const clearance = air[0].toFixed(2) + ' / ' + air.slice(1).map((gap) => gap.toFixed(2)).join(', ') + ' mm';
    if (request !== pending) return;
    const nextMeshes = assemblyNodes(gltf, fixture, pose);
    if (current) {
      scene.remove(current);
      disposeModel(current);
    }
    current = gltf.scene;
    gltf = null;
    meshes = nextMeshes;
    scene.add(current);
    canvas.dataset.pose = id;
    el('components').textContent = Object.keys(verified).join(' / ');
    setAngle(pose.angle_deg);
    el('clearance').textContent = clearance;
    el('angle').disabled = el('play').disabled = el('missing').disabled = false;
    status('Verified geometry', 'ready');
  } catch (error) {
    if (request === pending) status(`Load failed. ${error.message}`, 'error');
  } finally {
    disposeModel(gltf?.scene);
  }
}

reset();
renderer.setAnimationLoop((now) => {
  if (canvas.clientWidth !== width || canvas.clientHeight !== height) {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  if (playing) {
    const cycle = ((now - playStart) / 3000) % 2;
    setAngle(Math.max(0, Math.min(90, (cycle <= 1 ? cycle : 2 - cycle) * 90)));
  }
  canvas.dataset.camera = camera.position.toArray().join(',');
  renderer.render(scene, camera);
});
el('reset').addEventListener('click', reset);
el('angle').addEventListener('input', (event) => { stop(); setAngle(Number(event.target.value)); });
el('missing').addEventListener('click', () => loadPose('missing'));
el('play').addEventListener('click', () => {
  if (playing) return stop();
  playing = true;
  playStart = performance.now();
  el('play').textContent = 'Pause motion';
});
try {
  const config = await (await fetchOk('/run.json')).json();
  fixture = config.fixture;
  runId = config.run_id;
  el('joint').textContent = fixture.joint.id + ' · +Z CAD / +Y GLB';
  for (const pose of fixture.poses) {
    const button = document.createElement('button');
    button.textContent = pose.angle_deg + '°';
    button.dataset.angle = pose.angle_deg;
    button.addEventListener('click', () => loadPose(pose.id));
    el('poses').append(button);
  }
  await loadPose(fixture.poses[0].id);
} catch (error) {
  status(`Load failed. ${error.message}`, 'error');
}
