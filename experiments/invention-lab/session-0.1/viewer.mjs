import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { demand, measureScene, vectorNear } from './geometry.mjs';

const element = (id) => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ canvas: element('viewer'), antialias: true });
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1620);
const camera = new THREE.PerspectiveCamera(36, 1, 0.001, 10);
const controls = new OrbitControls(camera, renderer.domElement);
const grid = new THREE.GridHelper(0.3, 30, 0x345d78, 0x223f52);
grid.position.y = -0.0002;
scene.add(grid, new THREE.HemisphereLight(0xe3f2ff, 0x638099, 2.2));
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(0.2, 0.4, 0.25);
scene.add(light);
const loader = new GLTFLoader();
let current;
let requestNumber = 0;

function reset() {
  camera.position.set(0.18, 0.19, 0.18);
  controls.target.set(0, 0.008, 0);
  controls.update();
}
reset();
renderer.setAnimationLoop(() => {
  const canvas = renderer.domElement;
  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  canvas.dataset.camera = camera.position.toArray().join(',');
  renderer.render(scene, camera);
});

function status(message, state) {
  element('status').textContent = message;
  element('status').dataset.state = state;
}

const format = (values, separator = ' × ') => values.map((value) => value.toFixed(3)).join(separator) + ' mm';
const load = async (url) => {
  const response = await fetch(url, { cache: 'no-store' });
  demand(response.ok, `${url} returned HTTP ${response.status}`);
  return response;
};
const config = await (await load('/run.json')).json();
for (const id of config.ids) element('model').add(new Option(id.replaceAll('_', ' '), id));

async function show(id) {
  const request = ++requestNumber;
  status('Loading', 'loading');
  let candidate;
  try {
    const buffer = await (await load(`/assets/${id}.glb`)).arrayBuffer();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)),
      (n) => n.toString(16).padStart(2, '0')).join('');
    const receipt = await (await load('/receipt.json')).json();
    demand(receipt.schema === 1 && receipt.passed === true && receipt.run_id === config.run_id &&
      receipt.three === '0.187.0' && THREE.REVISION === '187' &&
      receipt.spec.threshold_mm === 0.5 && receipt.spec.cad_units === 'mm' &&
      receipt.spec.scene_units === 'm' && receipt.spec.cad_to_scene === '[x,z,-y]' &&
      JSON.stringify(receipt.models.map((m) => m.id)) === JSON.stringify(config.ids), 'Stale or invalid run receipt');
    const model = receipt.models.find((entry) => entry.id === id);
    demand(model?.glb_sha256 === hash, 'GLB does not match the run receipt');
    candidate = (await loader.parseAsync(buffer, '')).scene;
    const measured = measureScene(candidate, model, receipt.spec.threshold_mm);
    for (let i = 0; i < 2; i++) {
      vectorNear(measured.bounds_mm[i], model.measured.bounds_mm[i], 1e-5, 'Receipt bounds');
    }
    vectorNear(measured.corner_mm, model.measured.corner_mm, 1e-5, 'Receipt signed landmark');
    demand(measured.triangles === model.measured.triangles, 'Receipt triangle count mismatch');
    if (request !== requestNumber) return;
    if (current) scene.remove(current);
    current = candidate;
    candidate = null;
    scene.add(current);
    element('current').textContent = id;
    element('cad').textContent = format(model.size);
    const [low, high] = measured.bounds_mm;
    element('measured').textContent = format(high.map((value, i) => value - low[i]));
    element('corner').textContent = format(measured.corner_mm, ', ');
    element('error').textContent = `${measured.max_error_mm.toFixed(6)} mm`;
    status('Verified', 'ready');
  } catch (error) {
    if (request === requestNumber) status(`Load failed. ${error.message}`, 'error');
  }
}

element('model').addEventListener('change', (event) => show(event.target.value));
element('missing').addEventListener('click', () => show('missing-model'));
element('reset').addEventListener('click', reset);
await show(config.ids[0]);
