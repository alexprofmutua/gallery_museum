export const input = {
  suppressClick: false,
  keys: new Set<string>(),
  move: { x: 0, y: 0 },
  look: { x: 0, y: 0 },
};
export function clearInput() {
  input.keys.clear();
  input.suppressClick = false;
  input.move.x = 0;
  input.move.y = 0;
  input.look.x = 0;
  input.look.y = 0;
}
export function movementVector(
  x: number,
  z: number,
  yaw: number,
  speed: number,
) {
  const length = Math.max(1, Math.hypot(x, z));
  return {
    x: ((x * Math.cos(yaw) + z * Math.sin(yaw)) / length) * speed,
    z: ((-x * Math.sin(yaw) + z * Math.cos(yaw)) / length) * speed,
  };
}
export const ROOM = {
  halfWidth: 7,
  halfDepth: 10,
  height: 6,
  eyeHeight: 1.65,
  radius: 0.3,
};

/** Exponential response is stable across refresh rates; stopping is slightly
 * faster than starting. The small deadband prevents lingering movement.
 */
export function approachVelocity(current: number, target: number, delta: number) {
  const response = target === 0 ? 40 : 28;
  const next = current + (target - current) * (1 - Math.exp(-Math.min(delta, 0.05) * response));
  return target === 0 && Math.abs(next) < 0.01 ? 0 : next;
}
