import { describe, expect, it } from "vitest";
import { createGalleryFurnishings, caseHalfSize, seatFootprint } from "../content/galleryFurnishings";
import { formatMemoryNumber, memorySectionTitle, memorySchema, museum, museumSchema } from "../content/museum";
import type { MuseumRoom } from "../content/layout";

for (const depth of [20, 44]) {
  describe(`${depth}-metre gallery circulation`, () => {
    const room: MuseumRoom = { id: "gallery", title: "Gallery", halfWidth: 7, height: 6, maxZ: 10, minZ: 10 - depth };
    const layout = createGalleryFurnishings(room);
    const footprints = [
      ...layout.cases.map(([x, , z]) => ({ x, z, halfX: caseHalfSize[0], halfZ: caseHalfSize[2] })),
      ...layout.seats.map(seat => ({ x: seat.position[0], z: seat.position[2], ...seatFootprint(seat) })),
    ];
    it("spreads exactly five cases across the room and provides two seating pockets", () => {
      expect(layout.cases).toHaveLength(5);
      expect(layout.seats).toHaveLength(2);
      const depths = layout.cases.map(p => p[2]);
      expect(Math.max(...depths) - Math.min(...depths)).toBeGreaterThan(depth * 0.6);
    });
    it("keeps two metres clear beside the columns and a continuous central aisle", () => {
      for (const item of footprints) {
        expect(room.halfWidth - 1.05 - (Math.abs(item.x) + item.halfX)).toBeGreaterThanOrEqual(2);
        expect(Math.abs(item.x) - item.halfX).toBeGreaterThan(1);
        expect(item.z - item.halfZ - room.minZ).toBeGreaterThan(2);
        expect(room.maxZ - item.z - item.halfZ).toBeGreaterThan(2);
      }
    });
    it("keeps furnishing footprints separate with room for the player between them", () => {
      for (let i = 0; i < footprints.length; i++) {
        for (const b of footprints.slice(i + 1)) {
          const a = footprints[i];
          const gapX = Math.abs(a.x - b.x) - a.halfX - b.halfX;
          const gapZ = Math.abs(a.z - b.z) - a.halfZ - b.halfZ;
          expect(Math.max(gapX, gapZ)).toBeGreaterThan(0.6);
        }
      }
    });
  });
}

describe("graduation photo labels", () => {
  const graduate = { ...museum.memories[0], section: "graduation", sectionOrder: 1 };
  it("uses separate graduate labels without renumbering existing photographs", () => {
    const memory = memorySchema.parse(graduate);
    expect(formatMemoryNumber(memory)).toBe("G01");
    expect(memorySectionTitle(memory)).toBe("THE GRADUATE");
    expect(formatMemoryNumber(museum.memories[0])).toBe("01");
  });
  it("requires a graduation section and section number together", () => {
    expect(memorySchema.safeParse({ ...graduate, sectionOrder: undefined }).success).toBe(false);
    expect(memorySchema.safeParse({ ...graduate, section: undefined }).success).toBe(false);
  });
  it("rejects duplicate graduate labels", () => {
    expect(museumSchema.safeParse({ ...museum, memories: [graduate, { ...graduate, id: "other-graduate", displayOrder: 2 }] }).success).toBe(false);
  });
});
