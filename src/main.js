import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Octopus } from './octopus.js';
import './style.css';

const mount = document.getElementById('viewport');
const fallback = document.getElementById('fallback');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: false, powerPreference: 'high-performance'});
} catch (error) {
  fallback.hidden = false;
  mount.textContent = 'WebGL unavailable';
  console.error('Could not initialize WebGL', error);
  throw error;
}

const compact = window.matchMedia('(max-width: 1000px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(mount.clientWidth, mount.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.94;
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040713);
scene.fog = new THREE.FogExp2(0x040713, 0.026);

const camera = new THREE.PerspectiveCamera(43, mount.clientWidth / mount.clientHeight, 0.1, 100);
const defaultCamera = new THREE.Vector3();
const defaultTarget = new THREE.Vector3(-0.08, -0.33, 0);
function frameCamera() {
  const aspect = mount.clientWidth / mount.clientHeight;
  const visibleWidth = compact.matches ? 9.3 : 15.5;
  const span = Math.max(compact.matches ? 6.9 : 8.2, visibleWidth / aspect);
  const distance = span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) + 1.25;
  defaultCamera.set(0.70, 0.63, distance);
}
frameCamera();
camera.position.copy(defaultCamera);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(defaultTarget);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5.8;
controls.maxDistance = 22;
controls.maxPolarAngle = Math.PI * 0.76;
controls.enablePan = false;
controls.update();

const pmrem = new THREE.PMREMGenerator(renderer);
const environment = new THREE.Scene();
environment.background = new THREE.Color(0x222e4d);
const panelGeometry = new THREE.PlaneGeometry();
const reflectors = [
  [0xd4e5ff, 3.2, -3, 6, 3, 5, 1.25],
  [0x8d75ff, 1.8, -5, 0, 2, 1.1, 5.5],
  [0xffbe7c, 2.0, 5, 1, 2, 1.6, 4.6],
  [0x59b2ff, 3.4, 2, 4, -5, 3.8, 2.3],
  [0xcddeff, 0.65, 0, -2, 6, 5.3, 2.4],
];
for (const [color, intensity, x, y, z, width, height] of reflectors) {
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(intensity),
    toneMapped: false,
  });
  const panel = new THREE.Mesh(panelGeometry, material);
  panel.position.set(x, y, z);
  panel.scale.set(width, height, 1);
  panel.lookAt(0, 0, 0);
  environment.add(panel);
}
scene.environment = pmrem.fromScene(environment, 0.025).texture;
environment.children.forEach(panel => panel.material.dispose());
panelGeometry.dispose();
pmrem.dispose();

scene.add(new THREE.HemisphereLight(0x9ab1ff, 0x25102b, 0.9));
const lights = [
  [0xa084ff, 42, -4.8, 2.6, 3.5],
  [0xffbf87, 44, 3.8, 1.8, 4.2],
  [0x72baff, 65, 1.5, 3.8, -3.4],
  [0xffcf9c, 19, -1.4, -2.8, 4.7],
];
lights.forEach(([color, intensity, x, y, z]) => {
  const light = new THREE.PointLight(color, intensity, 18, 2);
  light.position.set(x, y, z);
  scene.add(light);
});

const octopus = new Octopus(scene);

// Radiant orbit rings and atmospheric specks: all generated in code.
const ambientGroup = new THREE.Group();
scene.add(ambientGroup);
const orbitColors = [0x7954ff, 0xffbc7c, 0x4fa9ff];
for (let i = 0; i < 3; i++) {
  const radius = 3.8 + i * 0.58;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, i === 1 ? 0.014 : 0.011, 5, 180, Math.PI * (i === 0 ? 1.65 : 1.93)),
    new THREE.MeshBasicMaterial({
      color: orbitColors[i], transparent: true, opacity: i === 1 ? 0.36 : 0.21,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    }),
  );
  ring.rotation.set(0.18 + i * 0.42, 0.22 + i * 0.55, 0.12 - i * 0.26);
  ring.position.z = -1.0 - i * 0.8;
  ambientGroup.add(ring);
}

const starCount = 530;
const stars = new Float32Array(starCount * 3);
const rng = (() => {
  let seed = 1441;
  return () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
})();
for (let i = 0; i < starCount; i++) {
  stars[i * 3] = (rng() - 0.5) * 29;
  stars[i * 3 + 1] = (rng() - 0.5) * 18;
  stars[i * 3 + 2] = -4 - rng() * 10;
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(stars, 3));
const starField = new THREE.Points(starGeometry, new THREE.PointsMaterial({
  color: 0xb4b2ff, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false,
}));
scene.add(starField);

// A subtle reflective-looking floor disc and rings, without texture downloads.
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(8.1, 112),
  new THREE.MeshStandardMaterial({color: 0x090e23, metalness: 0.58, roughness: 0.48, envMapIntensity: 0.34, side: THREE.DoubleSide}),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -4.45;
scene.add(floor);
for (let i = 0; i < 4; i++) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6 + i * 1.16, 0.015, 5, 124),
    new THREE.MeshBasicMaterial({color: i % 2 ? 0x4ab8ff : 0x845dff, transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false}));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -4.43;
  scene.add(ring);
}

const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.24, 0.31, 1.35);
composer.addPass(bloom);
composer.addPass(new OutputPass());

let running = !reducedMotion;
let animationTime = 0;
let previousFrame;
function resetView() {
  controls.enableDamping = false;
  controls.reset();
  camera.position.copy(defaultCamera);
  controls.target.copy(defaultTarget);
  controls.update();
  controls.enableDamping = true;
}
const fpsNode = document.getElementById('fps');
const stateNode = document.getElementById('motion-state');
const toggle = document.getElementById('motion-toggle');
function refreshButton() {
  toggle.textContent = running ? '⏸  PAUSE MOTION' : '▶  RESUME MOTION';
  stateNode.textContent = running ? 'ACTIVE' : 'PAUSED';
}
refreshButton();
toggle.addEventListener('click', () => {
  running = !running;
  refreshButton();
});
document.getElementById('reset-view').addEventListener('click', resetView);

let frame = 0;
let fpsElapsed = 0;
let drawnTime;
const qa = import.meta.env.DEV && new URLSearchParams(location.search).has('octo-qa');
let renderedFrames = 0;
function animate(now) {
  requestAnimationFrame(animate);
  const elapsed = previousFrame === undefined ? 0 : (now - previousFrame) / 1000;
  previousFrame = now;
  if (running) animationTime += Math.min(elapsed, 0.05);
  if (animationTime !== drawnTime) {
    octopus.update(animationTime);
    ambientGroup.rotation.z = animationTime * 0.005;
    starField.rotation.y = animationTime * 0.008;
    drawnTime = animationTime;
  }
  controls.update();
  if (qa && !renderer.info.autoReset) renderer.info.reset();
  composer.render();
  if (qa) renderedFrames++;
  frame++;
  fpsElapsed += elapsed;
  if (fpsElapsed > 1.2) {
    fpsNode.textContent = `${Math.round(frame / fpsElapsed)} FPS`;
    frame = 0;
    fpsElapsed = 0;
  }
}
requestAnimationFrame(animate);

function resize() {
  const w = mount.clientWidth;
  const h = mount.clientHeight;
  if (!w || !h) return;
  const atDefault = camera.position.distanceTo(defaultCamera) < 0.001;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  frameCamera();
  if (atDefault) resetView();
  renderer.setSize(w, h);
  composer.setSize(w, h);
}
window.addEventListener('resize', resize);

window.__OCTO_DEBUG__ = {
  freezeAt(time = 0) { running = false; animationTime = time; refreshButton(); },
  resetView,
  getState() {
    return {
      running, animationTime, armCount: 8, renderer: 'WebGL',
      viewOffset: camera.position.distanceTo(defaultCamera),
    };
  },
};

// Local QA opt-in keeps capture and profiling controls out of production builds.
if (qa) Object.assign(window.__OCTO_DEBUG__, {
  setCamera({position, target, up, fov}) {
    resetView();
    camera.position.fromArray(position);
    controls.target.fromArray(target);
    camera.up.fromArray(up);
    camera.fov = fov;
    camera.updateProjectionMatrix();
    controls.update();
  },
  getFrame() {
    return {
      number: renderedFrames,
      pose: drawnTime,
      camera: {
        position: camera.position.toArray(), target: controls.target.toArray(),
        up: camera.up.toArray(), fov: camera.fov, aspect: camera.aspect,
      },
      canvas: [renderer.domElement.width, renderer.domElement.height],
      rendererDpr: renderer.getPixelRatio(),
      composerDpr: composer.renderTarget1.width / mount.clientWidth,
    };
  },
  enableFrameMetrics() { renderer.info.autoReset = false; },
  getFrameMetrics() {
    return {...renderer.info.render, ...renderer.info.memory};
  },
  getRenderTargets() {
    return [composer.renderTarget1, composer.renderTarget2, bloom.renderTargetBright,
      ...bloom.renderTargetsHorizontal, ...bloom.renderTargetsVertical].map(target => ({
      width: target.width, height: target.height, depth: target.depthBuffer,
      stencil: target.stencilBuffer, mipmaps: target.texture.generateMipmaps,
      samples: target.samples,
      colorFormat: target.texture.format === THREE.RGBAFormat
        && target.texture.type === THREE.HalfFloatType ? 'RGBA16F' : 'unknown',
    }));
  },
});
