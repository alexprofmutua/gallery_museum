import { describe, expect, it } from "vitest";
import {
  cinemaRoom,
  corridorBays,
  corridorRoom,
  doorProgress,
  foreverRoom,
  portals,
  roomAt,
  roomCenterZ,
  rooms,
  SPAWN,
} from "../content/layout";
describe("connected museum layout", () => {
  it("spawns in the entrance and connects all five rooms without floor gaps", () => {
    expect(roomAt(SPAWN.z).id).toBe("entrance");
    expect(rooms).toHaveLength(5);
    for (let i = 1; i < rooms.length; i++)
      expect(rooms[i - 1].minZ).toBe(rooms[i].maxZ);
    expect(portals).toHaveLength(4);
  });
  it("classifies thresholds and both ends deterministically", () => {
    expect(roomAt(10).id).toBe("entrance");
    expect(roomAt(9.99).id).toBe("gallery");
    expect(roomAt(-16).id).toBe("corridor");
    expect(roomAt(roomCenterZ(cinemaRoom)).id).toBe("cinema");
    expect(roomAt(roomCenterZ(foreverRoom)).id).toBe("forever");
  });
  it("fits five evenly spaced bays in the 20-metre corridor", () => {
    expect(corridorRoom.maxZ - corridorRoom.minZ).toBe(20);
    expect(corridorBays).toEqual([-12, -16, -20, -24, -28]);
    expect(corridorBays.map((z) => roomAt(z).id)).toEqual(
      Array(5).fill("corridor"),
    );
  });
  it("keeps every doorway wider than the player diameter", () => {
    for (const room of rooms) expect(room.halfWidth).toBeGreaterThan(1.8 + 0.3);
  });
  it("allows the seat-side approach position through the internal doorways", () => {
    for (const portal of portals.slice(1)) {
      expect(portal.openingHalfWidth - 0.3).toBeGreaterThan(1.65);
      expect(portal.openingHalfWidth).toBeLessThan(corridorRoom.halfWidth);
    }
  });
});
describe("door motion", () => {
  it("stays closed before proximity and opens only after a trigger", () => {
    expect(doorProgress(0, 0.1, false, false)).toBe(0);
    expect(doorProgress(0, 0.1, true, false)).toBeGreaterThan(0);
  });
  it("clamps long frames and never closes or overshoots", () => {
    expect(doorProgress(0, 10, true, false)).toBeLessThan(0.1);
    expect(doorProgress(0.99, 0.1, true, false)).toBe(1);
    expect(doorProgress(1, 0.1, true, false)).toBe(1);
  });
  it("opens immediately with reduced motion", () =>
    expect(doorProgress(0, 0.016, true, true)).toBe(1));
});
