import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { BufferGeometry } from "three";

// Dimensions are baked into the geometry: a 44-metre rail still has millimetre
// edges, rather than stretching the bevel of a scaled unit cube.
const cache = new Map<string, BufferGeometry>();
export function beveledBox(size: readonly number[], radius = 0.018) {
  const r = Math.min(radius, Math.min(...size) * 0.22);
  const key = [...size, r].join(":");
  let geometry = cache.get(key);
  if (!geometry) {
    geometry = new RoundedBoxGeometry(size[0], size[1], size[2], 1, r);
    cache.set(key, geometry);
  }
  return geometry;
}
