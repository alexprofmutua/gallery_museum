import { beforeEach, describe, expect, it } from "vitest";
import { memorySchema, museum, museumSchema } from "../content/museum";
import { useMuseum } from "../stores/museum";
import { clearInput, input, movementVector } from "../engine/input";
beforeEach(() => {
  useMuseum.setState({
    activeMemory: null,
    nearMemory: null,
    entered: false,
    settings: false,
    mode: "3d",
    reset: 0,
  });
  clearInput();
});
describe("content contract", () => {
  it("validates the supplied configuration", () =>
    expect(museumSchema.safeParse(museum).success).toBe(true));
  it("rejects missing captions and remote private media paths", () => {
    expect(
      memorySchema.safeParse({ ...museum.memories[0], caption: "" }).success,
    ).toBe(false);
    expect(
      memorySchema.safeParse({
        ...museum.memories[0],
        image: "https://example.org/private.jpg",
      }).success,
    ).toBe(false);
  });
  it("supports a collection of 30 memories without schema changes", () =>
    expect(
      museumSchema.parse({
        ...museum,
        memories: Array.from({ length: 30 }, (_, i) => ({
          ...museum.memories[0],
          id: `memory-${i}`,
          displayOrder: i + 1,
        })),
      }).memories,
    ).toHaveLength(30));
});
describe("interaction transitions", () => {
  it("opens only a known memory and returns to exploration", () => {
    useMuseum.getState().openMemory("missing");
    expect(useMuseum.getState().activeMemory).toBeNull();
    useMuseum.getState().openMemory("first-memory");
    expect(useMuseum.getState().activeMemory).toBe("first-memory");
    useMuseum.getState().closeMemory();
    expect(useMuseum.getState().activeMemory).toBeNull();
  });
  it("clears active interaction when switching to fallback", () => {
    useMuseum.getState().openMemory("first-memory");
    useMuseum.getState().setMode("2d");
    expect(useMuseum.getState().activeMemory).toBeNull();
    expect(useMuseum.getState().mode).toBe("2d");
  });
  it("increments the reset signal and closes settings", () => {
    useMuseum.getState().toggleSettings();
    useMuseum.getState().resetPosition();
    expect(useMuseum.getState().reset).toBe(1);
    expect(useMuseum.getState().settings).toBe(false);
  });
});
describe("movement", () => {
  it("normalizes diagonal movement", () => {
    const v = movementVector(1, -1, 0, 2.6);
    expect(Math.hypot(v.x, v.z)).toBeCloseTo(2.6);
  });
  it("moves forward relative to camera orientation", () => {
    const v = movementVector(0, -1, Math.PI / 2, 2.6);
    expect(v.x).toBeCloseTo(-2.6);
    expect(v.z).toBeCloseTo(0);
  });
  it("clears held controls after focus loss", () => {
    input.keys.add("KeyW");
    input.move.x = 1;
    clearInput();
    expect(input.keys.size).toBe(0);
    expect(input.move.x).toBe(0);
  });
});
