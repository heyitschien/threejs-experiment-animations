import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $ = (id) => document.getElementById(id);
const app = $('app');
const canvas = $('model');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.001, 10);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
scene.add(new THREE.HemisphereLight(0xc7f0f0, 0x17222d, 2.4));
const key = new THREE.DirectionalLight(0xffe8ca, 3.2);
key.position.set(-0.1, 0.35, 0.3);
scene.add(key);
const rim = new THREE.DirectionalLight(0x66d8cf, 1.8);
rim.position.set(0.3, 0.12, -0.3);
scene.add(rim);
const grid = new THREE.GridHelper(0.42, 21, 0x315461, 0x1a323c);
grid.position.y = -0.055;
scene.add(grid);

let nodes = new Map();
let angle = 25;
let exploded = false;
let playing = false;
let playStart = 0;

function resetCamera() {
  camera.position.set(0.42, 0.24, 0.43);
  controls.target.set(0.015, 0.025, 0);
  controls.update();
}

function node(id) {
  const value = nodes.get(id);
  if (!value) throw new Error(`Missing component ID ${id}`);
  return value;
}

function applyMotion(next) {
  if (!Number.isFinite(next) || next < 0 || next > 60) throw new Error('Angle outside 0–60°');
  angle = next;
  const rad = THREE.MathUtils.degToRad(angle);
  const rotorIds = ['shade.lower_slat_rotor','shade.upper_slat_rotor','shade.lower_washer','shade.upper_washer'];
  rotorIds.forEach((id) => node(id).rotation.x = -rad);
  const coupler = node('shade.coupler');
  coupler.position.y = -20 * Math.sin(rad) / 1000;
  coupler.position.z = -(20 * Math.cos(rad) - 20) / 1000;
  const offsets = exploded ? {
    'shade.fixture': -.035, 'shade.lower_slat_rotor': -.014, 'shade.upper_slat_rotor': -.014,
    'shade.coupler': .018, 'shade.lower_washer': .04, 'shade.upper_washer': .04,
  } : {};
  nodes.forEach((value, id) => value.position.x = offsets[id] ?? 0);
  $('angle').value = angle;
  $('angle-value').textContent = `${Number(angle.toFixed(1))}°`;
  document.querySelectorAll('[data-angle]').forEach((button) =>
    button.setAttribute('aria-pressed', String(Number(button.dataset.angle) === angle)));
  app.dataset.angle = String(angle);
  app.dataset.exploded = String(exploded);
}

function stop() { playing = false; $('play').textContent = 'Autoplay'; }

function resetAll() {
  stop(); exploded = false; $('explode').textContent = 'Explode'; applyMotion(25); resetCamera();
}

async function load() {
  try {
    const params = new URLSearchParams(location.search);
    const asset = params.get('asset') || 'shade.glb';
    const [specResponse, geometryResponse, model] = await Promise.all([
      fetch('./assets/spec.json'), fetch('./assets/geometry.json'),
      new GLTFLoader().loadAsync(`./assets/${asset}`),
    ]);
    if (!specResponse.ok || !geometryResponse.ok) throw new Error('Missing public evidence');
    const spec = await specResponse.json();
    const geometry = await geometryResponse.json();
    if (!geometry.passed || geometry.id !== spec.id) throw new Error('Stale geometry receipt');
    model.scene.traverse((entry) => {
      if (entry.isMesh && entry.userData.part_id) {
        if (nodes.has(entry.userData.part_id)) throw new Error(`Duplicate component ID ${entry.userData.part_id}`);
        nodes.set(entry.userData.part_id, entry);
      }
    });
    const expected = spec.parts.map((part) => part.id).sort();
    if (JSON.stringify([...nodes.keys()].sort()) !== JSON.stringify(expected)) throw new Error('Invalid component IDs');
    scene.add(model.scene);
    applyMotion(25);
    ['angle','play','explode','reset'].forEach((id) => $(id).disabled = false);
    app.dataset.components = String(nodes.size);
    app.dataset.state = 'ready';
    $('status').textContent = 'Verified CAD-derived component GLB';
  } catch (error) {
    app.dataset.state = 'error';
    $('status').textContent = `Load failed: ${error.message}`;
  }
}

resetCamera();
$('angle').addEventListener('input', (event) => { stop(); applyMotion(Number(event.target.value)); });
document.querySelectorAll('[data-angle]').forEach((button) => button.addEventListener('click', () => {
  stop(); applyMotion(Number(button.dataset.angle));
}));
$('play').addEventListener('click', () => {
  if (playing) return stop();
  playing = true; playStart = performance.now(); $('play').textContent = 'Pause';
});
$('explode').addEventListener('click', () => {
  stop(); exploded = !exploded; $('explode').textContent = exploded ? 'Reassemble' : 'Explode'; applyMotion(angle);
});
$('reset').addEventListener('click', resetAll);

let width = 0, height = 0;
renderer.setAnimationLoop((now) => {
  if (playing) {
    const phase = ((now - playStart) / 2600) % 2;
    applyMotion((phase <= 1 ? phase : 2 - phase) * 60);
  }
  if (canvas.clientWidth !== width || canvas.clientHeight !== height) {
    width = canvas.clientWidth; height = canvas.clientHeight;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  controls.update();
  canvas.dataset.camera = camera.position.toArray().map((v) => v.toFixed(5)).join(',');
  renderer.render(scene, camera);
});

window.__LW_SHADE__ = { state: () => ({ angle, exploded, playing,
  lowerRotationX: nodes.get('shade.lower_slat_rotor')?.rotation.x,
  upperRotationX: nodes.get('shade.upper_slat_rotor')?.rotation.x,
  couplerPosition: nodes.get('shade.coupler')?.position.toArray(),
}) };
load();
