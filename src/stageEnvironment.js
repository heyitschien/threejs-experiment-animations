import * as THREE from 'three';

const FLOOR_HEIGHT = -4.45;

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const floorFragment = /* glsl */ `
  uniform vec3 stageBackground;
  varying vec3 vWorld;

  float falloff(vec2 point, vec2 radius) {
    vec2 d = point / radius;
    return exp(-dot(d, d));
  }

  // Soft bands stand in for reflected softboxes; they use world coordinates.
  float streak(vec2 p, vec2 origin, float slope, float width, float reach) {
    vec2 d = p - origin;
    d.x -= slope * d.y + 0.035 * sin(d.y * 6.0);
    float shape = falloff(d, vec2(width, reach));
    float flow = sin(p.x * 2.7 + p.y * 0.76) * 2.2;
    float ripple = 0.84 + 0.11 * sin(p.y * 12.5 + p.x * 3.8 + flow)
      + 0.05 * sin(p.y * 21.0 - p.x * 4.4 - flow);
    return shape * ripple;
  }

  void main() {
    vec2 p = vWorld.xz;
    float coverage = falloff(p - vec2(0.0, -2.0), vec2(11.5, 15.5));
    float contact = falloff(p - vec2(0.0, 0.5), vec2(3.6, 2.0));
    float neutral = streak(p, vec2(0.2, 0.8), -0.045, 0.78, 6.0);
    float amber = streak(p, vec2(2.4, 0.3), 0.075, 0.56, 5.9);
    float violet = streak(p, vec2(-2.8, -0.6), -0.07, 0.71, 5.5);
    float cool = streak(p, vec2(4.3, -2.9), 0.11, 0.85, 4.6);
    float wash = falloff(p - vec2(-0.5, -3.9), vec2(6.2, 5.0));

    vec3 wet = vec3(0.007, 0.009, 0.016) * (0.70 + 0.42 * wash);
    wet += neutral * vec3(0.11, 0.12, 0.16)
      + amber * vec3(0.30, 0.127, 0.047)
      + violet * vec3(0.108, 0.059, 0.25)
      + cool * vec3(0.025, 0.088, 0.19);
    wet *= 1.0 - 0.60 * contact;

    float edge = smoothstep(0.03, 0.67, coverage);
    float fog = 1.0 - exp(-0.00056 * pow(distance(cameraPosition, vWorld), 2.0));
    gl_FragColor = vec4(mix(stageBackground, wet, edge * (1.0 - fog)), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const hazeFragment = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec2 p = vWorld.xz;
    vec2 d = (p - vec2(0.0, -3.6)) / vec2(8.5, 3.5);
    float veil = exp(-dot(d, d));
    float wisps = 0.67 + 0.22 * sin(p.x * 0.65 + p.y * 1.08)
      + 0.11 * sin(p.x * 1.6 - p.y * 1.48);
    float warm = smoothstep(-3.0, 4.4, p.x);
    vec3 color = mix(vec3(0.19, 0.16, 0.38), vec3(0.34, 0.22, 0.12), warm);
    gl_FragColor = vec4(color, 0.22 * veil * wisps);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createStudioStage(background) {
  const stage = new THREE.Group();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 48),
    new THREE.ShaderMaterial({
      vertexShader, fragmentShader: floorFragment,
      uniforms: {stageBackground: {value: background.clone()}},
      side: THREE.DoubleSide,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR_HEIGHT, -3);
  stage.add(floor);

  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 25),
    new THREE.ShaderMaterial({
      vertexShader, fragmentShader: hazeFragment,
      side: THREE.DoubleSide, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  haze.rotation.x = -Math.PI / 2;
  haze.position.set(0, FLOOR_HEIGHT + 0.45, -3.6);
  stage.add(haze);

  for (let i = 0; i < 2; i++) {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(3.4 + i * 2.6, 0.012, 4, 96, Math.PI * (i ? 1.46 : 1.66)),
      new THREE.MeshBasicMaterial({
        color: i ? 0x7852ec : 0x4595df, transparent: true,
        opacity: i ? 0.23 : 0.19, depthWrite: false, toneMapped: false,
      }),
    );
    arc.rotation.set(Math.PI / 2, 0, 0.35 + i * 1.07);
    arc.position.y = FLOOR_HEIGHT + 0.012;
    stage.add(arc);
  }
  return stage;
}
