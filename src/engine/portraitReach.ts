import { placedPortraits } from "../content/portraits";
import type { PlacedPortrait } from "../content/portraits";

type Point = { x: number; y: number; z: number };

const distance = (portrait: PlacedPortrait, eye: Point) =>
  Math.hypot(eye.x - portrait.x, eye.y - portrait.y, eye.z - portrait.z);

export function portraitInRange(id: string, eye: Point) {
  const placement = placedPortraits.find(({ portrait }) => portrait.id === id);
  return Boolean(
    placement &&
      distance(placement, eye) <= placement.portrait.interactionRadius,
  );
}

export function nearestPortrait(eye: Point) {
  let nearest: string | null = null;
  let best = Infinity;
  for (const placement of placedPortraits) {
    const reach = distance(placement, eye);
    if (reach <= placement.portrait.interactionRadius && reach < best) {
      nearest = placement.portrait.id;
      best = reach;
    }
  }
  return nearest;
}
