export const desktop = {viewport: {width: 1440, height: 900}, deviceScaleFactor: 1};
export const mobile = {
  viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
};

const target = [-0.08, -0.33, 0];
const up = [0, 1, 0];
const camera = (position, aim = target, fov = 43) => ({position, target: aim, up, fov});
export const shots = [
  {name: 'hero-desktop', pose: 3.4},
  {name: 'hero-mobile', pose: 3.4, mobile: true},
  {name: 'front', pose: 3.4, camera: camera([-0.08, -0.33, 13.6])},
  {name: 'three-quarter', pose: 3.4, camera: camera([7.5, 1.6, 11.5])},
  {name: 'side', pose: 3.4, camera: camera([13.5, -0.33, 0])},
  {name: 'rear', pose: 3.4, camera: camera([-0.08, 0.65, -13.6])},
  {name: 'mantle-detail', pose: 3.4, camera: camera([1.35, 1.45, 6.1], [0.2, 0.75, 0.18], 27)},
  {name: 'front-pose-0', pose: 0, camera: camera([-0.08, -0.33, 13.6])},
  {name: 'front-pose-6-8', pose: 6.8, camera: camera([-0.08, -0.33, 13.6])},
];
