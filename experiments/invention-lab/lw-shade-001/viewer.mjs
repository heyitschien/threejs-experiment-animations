import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (id) => document.getElementById(id);
const state = { angle: 0, pose: null, gltf: null, playing: false, exploded: false };

async function loadGeometry() {
  const res = await fetch('/geometry.json');
  const g = await res.json();
  state.geometry = g;
  const run = await fetch('/run.json').then(r => r.json());
  state.run = run;
  // pose buttons
  const bar = $('poses');
  for (const p of g.fixture.poses) {
    const b = document.createElement('button');
    b.textContent = p.angle_deg + '°';
    b.addEventListener('click', () => loadPose(p.id));
    bar.appendChild(b);
  }
  $('angle').max = 60;
  $('angle').value = 0;
  updateLabels();
}

async function loadPose(id) {
  const url = '/assets/' + id + '.glb';
  const loader = new GLTFLoader();
  const gltf = await new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
  if (state.gltf) {
    // remove old
    scene.remove(state.gltf.scene);
  }
  state.gltf = gltf;
  state.pose = id;
  const root = gltf.scene;
  root.scale.set(1,1,1);
  scene.add(root);
  // store pose angle from geometry
  const pose = state.geometry.fixture.poses.find(p => p.id === id);
  state.angle = pose ? pose.angle_deg : 0;
  $('angle').value = state.angle;
  applyAngle(state.angle);
  updateLabels();
  setStatus('ready');
}

function applyAngle(angle) {
  if (!state.gltf) return;
  const root = state.gltf.scene;
  const rad = angle * Math.PI / 180;
  root.traverse((o) => {
    if (!o.isMesh) return;
    const id = o.userData.part_id;
    if (id === 'shade.slat_lower' || id === 'shade.crank_lower') {
      o.rotation.x = -rad;
    } else if (id === 'shade.slat_upper' || id === 'shade.crank_upper') {
      // pivot at z=0.08
      o.rotation.x = -rad;
    } else if (id === 'shade.coupler') {
      const c = Math.cos(rad), sn = Math.sin(rad);
      o.position.set(0, 0.02 * c, -0.02 * sn);
    }
  });
  // explode
  if (state.exploded) applyExplode();
  updateLabels();
}

function applyExplode() {
  if (!state.gltf) return;
  state.gltf.scene.traverse((o) => {
    if (o.isMesh) {
      o.position.x += state.exploded ? 0.05 : 0;
    }
  });
}

function updateLabels() {
  $('angle-value').textContent = state.angle.toFixed(1) + '°';
  $('status').dataset.state = 'ready';
  $('status').textContent = 'ready';
  if (state.gltf) {
    $('model').dataset.pose = state.pose;
    $('model').dataset.camera = cameraState();
  }
  $('components').textContent = Object.values(state.geometry.fixture.parts).map(p => p.id).join(' / ');
  $('joint').textContent = state.geometry.fixture.joint.id + ' · +X CAD';
}

function cameraState() { return renderer ? renderer.info.render.frame.toString() : '0'; }

let scene, camera, renderer, controls;
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.001, 100);
  camera.position.set(0.3, 0.3, 0.3);
  // canvas
  const canvas = $('c');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize($('model').clientWidth, $('model').clientHeight);
  controls = new OrbitControls(camera, renderer.domElement);
  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(1,1,1);
  scene.add(dir);
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  if (state.playing) {
    state.angle = Math.min(60, state.angle + 0.5);
    if (state.angle >= 60) state.playing = false;
    $('angle').value = state.angle;
    applyAngle(state.angle);
  }
}

function setStatus(s) {
  const el = $('status');
  el.dataset.state = s;
  el.textContent = s;
}

window.addEventListener('DOMContentLoaded', async () => {
  init();
  await loadGeometry();
  const poses = state.geometry.fixture.poses;
  if (poses.length) await loadPose(poses[0].id);

  $('angle').addEventListener('input', (e) => {
    state.angle = parseFloat(e.target.value);
    applyAngle(state.angle);
  });
  $('play').addEventListener('click', () => { state.playing = !state.playing; });
  $('reset').addEventListener('click', () => {
    state.angle = 0; state.exploded = false; $('angle').value = 0;
    applyAngle(0);
  });
  $('explode').addEventListener('click', () => {
    state.exploded = !state.exploded;
    applyAngle(state.angle);
  });
});

// missing button not required
