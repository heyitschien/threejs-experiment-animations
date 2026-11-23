import { MathUtils } from 'three';

export const HERO_FOV = 43;

/** The responsive opening shot. Fixed diagnostic cameras are defined separately in QA. */
export function heroFraming(width, height, compact) {
  const aspect = width / height;
  const visibleWidth = compact ? 9.3 : 15.5;
  const span = Math.max(compact ? 6.9 : 8.2, visibleWidth / aspect);
  const distance = span / (2 * Math.tan(MathUtils.degToRad(HERO_FOV / 2))) + 1.25;
  // Leave room for the copy at intermediate widths and for the tip sweep on tablets.
  const push = compact
    ? MathUtils.smoothstep(width, 300, 360) * (1 - MathUtils.smoothstep(width, 450, 720))
    : MathUtils.smoothstep(width, 1120, 1440);
  const dx = push * (compact ? 0.11 : -0.24);
  const dy = push * (compact ? -0.09 : -0.14);
  const raise = push * (compact ? 0.08 : 0.30);
  const dolly = 1 - push * (compact ? 0.042 : 0.094);
  return {
    target: [-0.08 + dx, -0.33 + dy, 0],
    position: [0.70 + dx, 0.63 + dy + raise, distance * dolly],
  };
}
