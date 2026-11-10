/** Leave a small gap between the camera sphere and the surface it swept into. */
export function safeCameraDistance(desired: number, hitDistance?: number) {
  return hitDistance === undefined
    ? desired
    : Math.max(0, Math.min(desired, hitDistance - 0.08));
}
export const playerPose = {
  x: 0,
  y: 1.65,
  z: 20,
  feetY: 0,
  yaw: 0,
  speed: 0,
  cameraDistance: 0,
};
