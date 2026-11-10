import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { museum, museumSchema, memorySchema } from "../content/museum";
import { containImage, memoryInReach, pickMemory } from "../engine/interactions";
import { useMuseum } from "../stores/museum";
import { corridorRoom } from "../content/layout";
describe("complete memory collection", () => {
  it("contains 30 independently configured artworks", () => {
    expect(museum.memories).toHaveLength(30);
    expect(new Set(museum.memories.map((m) => m.image)).size).toBe(30);
  });
  it("rejects duplicate IDs and display orders", () => {
    expect(
      museumSchema.safeParse({
        ...museum,
        memories: [museum.memories[0], museum.memories[0]],
      }).success,
    ).toBe(false);
    expect(
      museumSchema.safeParse({
        ...museum,
        memories: [
          museum.memories[0],
          { ...museum.memories[1], displayOrder: 1 },
        ],
      }).success,
    ).toBe(false);
  });
  it("rejects invalid placement, image traversal, dates and dimensions", () => {
    for (const changes of [
      { position: [8, 2, 0] },
      { image: "/images/../other.svg" },
      { date: "not-a-date" },
      { frame: { width: -1, height: 1 } },
    ])
      expect(
        memorySchema.safeParse({ ...museum.memories[0], ...changes }).success,
      ).toBe(false);
  });
  it("validates corridor memories against the corridor boundaries", () => {
    const portrait = {
      ...museum.memories[0],
      roomId: "corridor",
      position: [-2.84, 2.17, (corridorRoom.minZ + corridorRoom.maxZ) / 2],
    };
    expect(memorySchema.safeParse(portrait).success).toBe(true);
    expect(
      memorySchema.safeParse({ ...portrait, roomId: "gallery" }).success,
    ).toBe(false);
    expect(
      memorySchema.safeParse({
        ...portrait,
        position: [-6, 2, portrait.position[2]],
      }).success,
    ).toBe(false);
  });
  it("keeps side frames clear of columns and one another", () => {
    const sideFrames = museum.memories.filter(
      (m) => Math.abs(m.position[0]) > 6,
    );
    for (const m of sideFrames) {
      for (const columnZ of [-8, -4, 0, 4, 8])
        expect(
          Math.abs(m.position[2] - columnZ) - m.frame.width / 2,
        ).toBeGreaterThan(0.4);
    }
    for (const [index, a] of sideFrames.entries())
      for (const b of sideFrames.slice(index + 1)) {
        if (a.position[0] !== b.position[0]) continue;
        const horizontalGap =
          Math.abs(a.position[2] - b.position[2]) -
          (a.frame.width + b.frame.width) / 2;
        const verticalGap =
          Math.abs(a.position[1] - b.position[1]) -
          (a.frame.height + b.frame.height) / 2;
        expect(Math.max(horizontalGap, verticalGap)).toBeGreaterThan(0.15);
      }
  });
});
describe("precise exhibit selection", () => {
  it("targets every frame correctly, including upper rows and both walls", () => {
    for (const m of museum.memories) {
      const eye = {
        x: m.position[0] + Math.sin(m.rotationY) * 1.8,
        y: 1.65,
        z: m.position[2] + Math.cos(m.rotationY) * 1.8,
      };
      const direction = new Vector3(...m.position)
        .sub(new Vector3(eye.x, eye.y, eye.z))
        .normalize();
      expect(pickMemory(museum.memories, eye, direction)?.memory.id).toBe(m.id);
    }
  });
  it("opens a high landscape frame when the gaze hits its numbered caption plaque", () => {
    const memory = { ...museum.memories[0], position: [0, 2.7, 0] as [number, number, number], rotationY: 0, frame: { width: 3.5, height: 1.7125 } };
    expect(pickMemory([memory], { x: 0, y: 1.65, z: 2 }, { x: 0, y: 0, z: -1 })?.memory.id).toBe(memory.id);
    // The blank wall beside/below the plaque is not an activation target.
    expect(pickMemory([memory], { x: 1.5, y: 1.65, z: 2 }, { x: 0, y: 0, z: -1 })).toBeNull();
    expect(pickMemory([memory], { x: 0, y: 1.25, z: 2 }, { x: 0, y: 0, z: -1 })).toBeNull();
  });
  it("measures reach to the display surface, including large edges and close-up views", () => {
    const memory = { ...museum.memories[0], position: [0, 2.7, 0] as [number, number, number], rotationY: 0, frame: { width: 5, height: 2.5 }, activationRadius: 3.4 };
    expect(memoryInReach(memory, { x: 2.4, y: 1.65, z: 3.2 })).toBe(true);
    expect(pickMemory([memory], { x: 0, y: 1.65, z: .145 }, { x: 0, y: 0, z: -1 })?.memory.id).toBe(memory.id);
    expect(memoryInReach(memory, { x: 0, y: 1.65, z: -.5 })).toBe(false);
    expect(memoryInReach(memory, { x: 0, y: 1.65, z: 4 })).toBe(false);
  });
  it("does not select a frame from behind, beyond reach, or outside its bounds", () => {
    const m = museum.memories[0];
    expect(
      pickMemory([m], { x: -3.7, y: 1.65, z: -10 }, { x: 0, y: 0, z: 1 }),
    ).toBeNull();
    expect(
      pickMemory([m], { x: -3.7, y: 1.65, z: 0 }, { x: 0, y: 0, z: -1 }),
    ).toBeNull();
    expect(
      pickMemory([m], { x: -1, y: 1.65, z: -8 }, { x: 0, y: 0, z: -1 }),
    ).toBeNull();
  });
  it("fits portrait, square and landscape images without changing their ratios", () => {
    for (const aspect of [3 / 4, 1, 4 / 3, 2]) {
      const fit = containImage(aspect, 1.1, 1.2);
      expect(fit.width / fit.height).toBeCloseTo(aspect);
      expect(fit.width).toBeLessThanOrEqual(1.1);
      expect(fit.height).toBeLessThanOrEqual(1.2);
    }
  });
});
describe("local viewed progress", () => {
  it("records valid memories once, survives rehydration and can be cleared", async () => {
    useMuseum.getState().resetProgress();
    useMuseum.getState().openMemory("memory-02");
    useMuseum.getState().openMemory("memory-02");
    useMuseum.getState().openMemory("invalid");
    expect(useMuseum.getState().viewedIds).toEqual(["memory-02"]);
    useMuseum.setState({ viewedIds: [] });
    window.localStorage.setItem(
      `ofm-progress:${museum.id}`,
      JSON.stringify({
        state: { viewedIds: ["memory-02", "invalid", "memory-02"], mode: "2d" },
        version: 1,
      }),
    );
    await useMuseum.persist.rehydrate();
    expect(useMuseum.getState().viewedIds).toEqual(["memory-02"]);
    expect(useMuseum.getState().mode).toBe("3d");
    useMuseum.getState().resetProgress();
    expect(useMuseum.getState().viewedIds).toEqual([]);
  });
});
