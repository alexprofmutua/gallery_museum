import { describe, expect, it } from "vitest";
import { safeCameraDistance } from "../engine/chaseCamera";
import { useMuseum } from "../stores/museum";
describe("third-person camera", () => {
  it("keeps the requested distance in open space", () =>
    expect(safeCameraDistance(3.5)).toBe(3.5));
  it("pulls inside a collision and never moves beyond the desired distance", () => {
    expect(safeCameraDistance(3.5, 1)).toBeCloseTo(0.92);
    expect(safeCameraDistance(3.5, 8)).toBe(3.5);
    expect(safeCameraDistance(3.5, 0)).toBe(0);
  });
  it("switches view without resetting the visit or current memory", () => {
    useMuseum.setState({
      view: "first",
      currentRoom: "gallery",
      activeMemory: "first-memory",
      reset: 0,
    });
    useMuseum.getState().toggleView();
    expect(useMuseum.getState().view).toBe("third");
    expect(useMuseum.getState().activeMemory).toBe("first-memory");
    expect(useMuseum.getState().currentRoom).toBe("gallery");
    expect(useMuseum.getState().reset).toBe(0);
    useMuseum.getState().toggleView();
    expect(useMuseum.getState().view).toBe("first");
  });
});
