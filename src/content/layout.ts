import { z } from "zod";
const corridorExtension = import.meta.env?.MODE === "personal" ? 16 : 0;
// The personal collection uses one continuous, numbered perimeter gallery.
const galleryExtension = import.meta.env?.MODE === "personal" ? 24 : 0;
const roomSchema = z.object({
  id: z.enum(["entrance", "gallery", "corridor", "cinema", "forever"]),
  title: z.string().min(1),
  minZ: z.number(),
  maxZ: z.number(),
  halfWidth: z.number().min(2.5),
  height: z.number().min(4),
});
export const rooms = z
  .array(roomSchema)
  .length(5)
  .superRefine((items, ctx) => {
    if (new Set(items.map((r) => r.id)).size !== items.length)
      ctx.addIssue({ code: "custom", message: "Room IDs must be unique" });
    items.forEach((r, i) => {
      if (r.maxZ <= r.minZ)
        ctx.addIssue({
          code: "custom",
          message: "Room depth must be positive",
        });
      if (i > 0 && items[i - 1].minZ !== r.maxZ)
        ctx.addIssue({
          code: "custom",
          message: "Rooms must share an exact threshold",
        });
    });
  })
  .parse([
    {
      id: "entrance",
      title: "The Grand Entrance",
      minZ: 10,
      maxZ: 24,
      halfWidth: 7,
      height: 8.25,
    },
    {
      id: "gallery",
      title: "The Gallery of Us",
      minZ: -10 - galleryExtension,
      maxZ: 10,
      halfWidth: 7,
      height: 6,
    },
    {
      id: "corridor",
      title: "Living Portrait Corridor",
      minZ: -30 - corridorExtension - galleryExtension,
      maxZ: -10 - galleryExtension,
      halfWidth: 3,
      height: 4.5,
    },
    {
      id: "cinema",
      title: "Our Little Cinema",
      minZ: -46 - corridorExtension - galleryExtension,
      maxZ: -30 - corridorExtension - galleryExtension,
      halfWidth: 7,
      height: 5,
    },
    {
      id: "forever",
      title: "The Forever Room ∞",
      minZ: -62 - corridorExtension - galleryExtension,
      maxZ: -46 - corridorExtension - galleryExtension,
      halfWidth: 7,
      height: 6,
    },
  ]);
export type MuseumRoom = z.infer<typeof roomSchema>;
export const roomCenterZ = (room: MuseumRoom) => (room.minZ + room.maxZ) / 2;
export const [, galleryRoom, corridorRoom, cinemaRoom, foreverRoom] = rooms;
export const cinemaSeats = [2.85, 4.57].flatMap((x) =>
  [-2.22, -0.74, 0.74, 2.22].map((z) => [x, z] as const),
);
export function cinemaSeatInReach(x: number, z: number) {
  const roomZ = z - roomCenterZ(cinemaRoom);
  return cinemaSeats.some(
    ([seatX, seatZ]) => Math.hypot(x - seatX, roomZ - seatZ) <= 1.65,
  );
}
export const cinemaViewPosition = [
  2.9,
  1.43,
  roomCenterZ(cinemaRoom) + 0.74,
] as const;
const bayCount = Math.max(
  1,
  Math.round((corridorRoom.maxZ - corridorRoom.minZ) / 4),
);
const bayDepth = (corridorRoom.maxZ - corridorRoom.minZ) / bayCount;
export const corridorBays = Array.from(
  { length: bayCount },
  (_, index) => corridorRoom.maxZ - (index + 0.5) * bayDepth,
);
export const SPAWN = { x: 0, y: 0.9, z: 20 };
export const portals = rooms.slice(0, -1).map((r, i) => ({
  id: `${r.id}-${rooms[i + 1].id}`,
  z: r.minZ,
  halfWidth: Math.max(r.halfWidth, rooms[i + 1].halfWidth),
  openingHalfWidth: r.id === "entrance" ? 1.8 : 2.6,
  next: rooms[i + 1].title,
  previous: r.title,
}));
export function roomAt(z: number) {
  return (
    rooms.find((r) => z >= r.minZ && z <= r.maxZ) ??
    (z > rooms[0].maxZ ? rooms[0] : foreverRoom)
  );
}
export function doorProgress(
  current: number,
  delta: number,
  triggered: boolean,
  reducedMotion: boolean,
) {
  return triggered
    ? Math.min(1, current + (reducedMotion ? 1 : Math.min(delta, 0.1) / 1.2))
    : current;
}
