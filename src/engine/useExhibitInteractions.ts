import { useRapier } from "@react-three/rapier";
import { museum } from "../content/museum";
import type { Memory } from "../content/museum";
import { useMuseum } from "../stores/museum";
import { playerPose } from "./chaseCamera";
import { memoryInReach, pickMemory } from "./interactions";
type Point = { x: number; y: number; z: number };
/** One reach/occlusion policy for keyboard prompts and direct frame clicks. */
export function useExhibitInteractions() {
  const { world, rapier } = useRapier();
  const clear = (eye: Point, gaze: Point, distance: number) =>
    !world.castRay(
      new rapier.Ray(eye, gaze),
      Math.max(0, distance - 0.08),
      true,
      rapier.QueryFilterFlags.EXCLUDE_DYNAMIC,
    );
  return {
    resolve: (eye: Point, gaze: Point) => {
      const hit = pickMemory(museum.memories, eye, gaze);
      return hit && clear(eye, gaze, hit.distance) ? hit.memory.id : null;
    },
    activate: (memory: Memory, point: Point) => {
      const state = useMuseum.getState();
      if (
        !state.entered ||
        state.settings ||
        state.activeMemory ||
        state.feature ||
        !memoryInReach(memory, playerPose)
      )
        return;
      const dx = point.x - playerPose.x,
        dy = point.y - playerPose.y,
        dz = point.z - playerPose.z;
      const distance = Math.hypot(dx, dy, dz);
      if (!distance) return;
      if (
        clear(
          playerPose,
          { x: dx / distance, y: dy / distance, z: dz / distance },
          distance,
        )
      )
        state.openMemory(memory.id);
    },
  };
}
