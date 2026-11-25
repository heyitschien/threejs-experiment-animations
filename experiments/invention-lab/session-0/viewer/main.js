import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.querySelector('#viewer');
const status = document.querySelector('#status');
const cadDimensions = document.querySelector('#cad-dimensions');
const threeDimensions = document.querySelector('#three-dimensions');
const maxError = document.querySelector('#max-error');
const select = document.querySelector('#model-select');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x09141d);
scene.add(new THREE.HemisphereLight(0xcdeaff, 0x16202a, 2.2));
const key = new THREE.DirectionalLight(0xffffff, 3.8);
key.position.set(2, 3, 4);
scene.add(key);
const grid = new THREE.GridHelper(0.3, 30, 0x2a536f, 0x183347);
scene.add(grid);

const camera = new THREE.PerspectiveCamera(38, 1, 0.001, 10);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 0.08;
controls.maxDistance = 1.2;
const defaultCamera = new THREE.Vector3(0.22, 0.16, 0.22);

const loader = new GLTFLoader();
let currentModel = null;
let requestNumber = 0;

function resetCamera() {
  camera.position.copy(defaultCamera);
  controls.target.set(0, 0.025, 0);
  controls.update();
}

function setStatus(message, state) {
  status.textContent = message;
  status.dataset.state = state;
}

function format(values) {
  return values.map((value) => `${value.toFixed(3)}`).join(' × ') + ' mm';
}

async function loadModel(id) {
  const request = ++requestNumber;
  setStatus('Loading…', 'loading');
  try {
    const [gltf, metricsResponse] = await Promise.all([
      loader.loadAsync(`../artifacts/${id}.glb`),
      fetch('../artifacts/glb-metrics.json'),
    ]);
    if (!metricsResponse.ok) throw new Error(`Metrics HTTP ${metricsResponse.status}`);
    const metrics = await metricsResponse.json();
    if (request !== requestNumber) return;
    if (currentModel) scene.remove(currentModel);
    currentModel = gltf.scene;
    scene.add(currentModel);
    currentModel.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(currentModel);
    const center = box.getCenter(new THREE.Vector3());
    currentModel.position.sub(center);
    currentModel.position.y += box.getSize(new THREE.Vector3()).y / 2;
    currentModel.updateMatrixWorld(true);
    const record = metrics.models.find((entry) => entry.id === id);
    if (!record) throw new Error(`No metrics for ${id}`);
    cadDimensions.textContent = format(record.expected_cad_dimensions_mm_xyz);
    threeDimensions.textContent = format(record.measured_three_dimensions_mm_xyz);
    maxError.textContent = `${record.max_dimension_error_mm.toFixed(6)} mm (limit ${metrics.integration_threshold_mm} mm)`;
    setStatus('Validated and interactive', 'ready');
    window.__pipelineQA = {
      ready: true,
      model: id,
      camera: camera.position.toArray(),
      metrics: record,
      loadModel,
    };
  } catch (error) {
    if (request !== requestNumber) return;
    setStatus(`Load failed: ${error.message}`, 'error');
    window.__pipelineQA = { ready: false, model: id, error: error.message, loadModel };
  }
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function animate() {
  resize();
  controls.update();
  if (window.__pipelineQA) window.__pipelineQA.camera = camera.position.toArray();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

select.addEventListener('change', () => loadModel(select.value));
document.querySelector('#reset-camera').addEventListener('click', resetCamera);
document.querySelector('#test-missing').addEventListener('click', () => loadModel('missing-model'));
resetCamera();
loadModel(select.value);
animate();
