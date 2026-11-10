import type { Memory } from "../content/museum";
import { exhibitLayout } from "../content/exhibitLayout";
type Point = { x: number; y: number; z: number };
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const plaqueWidth = (memory: Memory) => Math.min(exhibitLayout.plaqueMaxWidth, memory.frame.width);
const plaqueY = (memory: Memory) => -memory.frame.height / 2 - exhibitLayout.plaqueOffset;

/** Reach the visible surface, rather than the centre of a large/high photograph. */
export function memoryInReach(memory: Memory, eye: Point) {
  const dx = eye.x - memory.position[0], dy = eye.y - memory.position[1], dz = eye.z - memory.position[2];
  const sin = Math.sin(memory.rotationY), cos = Math.cos(memory.rotationY);
  const faceDistance = dx * sin + dz * cos;
  if (faceDistance <= .05) return false;
  const normalDistance = faceDistance - exhibitLayout.imageFront;
  const localX = dx * cos - dz * sin;
  const imageDx = localX - clamp(localX, -memory.frame.width / 2, memory.frame.width / 2);
  const imageDy = dy - clamp(dy, -memory.frame.height / 2, memory.frame.height / 2);
  const plaqueDx = localX - clamp(localX, -plaqueWidth(memory) / 2, plaqueWidth(memory) / 2);
  const py = plaqueY(memory), ph = exhibitLayout.plaqueHeight / 2;
  const plaqueDy = dy - clamp(dy, py-ph, py+ph);
  return Math.min(Math.hypot(normalDistance, imageDx, imageDy), Math.hypot(normalDistance, plaqueDx, plaqueDy)) <= memory.activationRadius;
}
/** Intersect the displayed frame/plaque surface and pick the nearest hit. */
export function pickMemory(
  memories: Memory[],
  eye: Point,
  gaze: Point,
): { memory: Memory; distance: number } | null {
  let best: { memory: Memory; distance: number } | null = null;
  for (const memory of memories) {
    if (!memoryInReach(memory, eye)) continue;
    const sin = Math.sin(memory.rotationY),
      cos = Math.cos(memory.rotationY);
    const denominator = gaze.x * sin + gaze.z * cos;
    if (denominator >= -0.01) continue;
    const t =
      ((memory.position[0] + sin * exhibitLayout.imageFront - eye.x) * sin +
        (memory.position[2] + cos * exhibitLayout.imageFront - eye.z) * cos) /
      denominator;
    if (t <= 0) continue;
    const dx = eye.x + gaze.x * t - memory.position[0],
      dy = eye.y + gaze.y * t - memory.position[1],
      dz = eye.z + gaze.z * t - memory.position[2];
    const localX = dx * cos - dz * sin, padding = exhibitLayout.selectionPadding;
    const onImage = Math.abs(localX) <= memory.frame.width / 2 + padding && Math.abs(dy) <= memory.frame.height / 2 + padding;
    const onPlaque = Math.abs(localX) <= plaqueWidth(memory) / 2 + padding && Math.abs(dy - plaqueY(memory)) <= exhibitLayout.plaqueHeight / 2 + padding;
    if (!onImage && !onPlaque) continue;
    if (!best || t < best.distance) best = { memory, distance: t };
  }
  return best;
}
export function containImage(aspect: number, width: number, height: number) {
  if (aspect <= 0 || !Number.isFinite(aspect)) return { width, height };
  return aspect > width / height
    ? { width, height: width / aspect }
    : { width: height * aspect, height };
}
