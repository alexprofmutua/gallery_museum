import { corridorBays, corridorRoom } from "./layout";

export interface Portrait {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  video: string;
  frameStyle: "gilded" | "antique";
  aspectRatio: number;
  wall: "left" | "right";
  displayOrder: number;
  interactionRadius: number;
}

function artwork(
  id: string,
  title: string,
  description: string,
  wall: Portrait["wall"],
  displayOrder: number,
  landscape: boolean,
): Portrait {
  return {
    id,
    title,
    description,
    wall,
    displayOrder,
    frameStyle: landscape ? "antique" : "gilded",
    aspectRatio: landscape ? 16 / 9 : 3 / 4,
    thumbnail: `/media/portraits/${id}.jpg`,
    video: `/media/portraits/${id}.mp4`,
    interactionRadius: 2.55,
  };
}

export const portraits: readonly Portrait[] = [
  artwork(
    "moon-gate",
    "The Moon Gate",
    "Moonlight falls through a distant gate in a violet valley.",
    "left",
    1,
    false,
  ),
  artwork(
    "swan-water",
    "The Swan Lake",
    "A swan crosses the blue water beneath a rising moon.",
    "right",
    2,
    true,
  ),
  artwork(
    "amber-keep",
    "The Amber Keep",
    "The last of the sunlight catches the towers of a hilltop keep.",
    "left",
    3,
    true,
  ),
  artwork(
    "rose-tower",
    "The Rose Tower",
    "A rose-colored tower looks out over layers of quiet hills.",
    "right",
    4,
    false,
  ),
  artwork(
    "star-garden",
    "The Star Garden",
    "A crescent moon hangs over a garden of golden flowers.",
    "left",
    5,
    false,
  ),
  artwork(
    "last-lantern",
    "The Last Lantern",
    "A lantern glows beside a path winding into the mountains.",
    "right",
    6,
    true,
  ),
];

export function placePortraits(items: readonly Portrait[]) {
  return (["left", "right"] as const).flatMap((wall) => {
    const row = items
      .filter((item) => item.wall === wall)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    const side = wall === "left" ? -1 : 1;
    const slots = corridorBays
      .slice(1)
      .map((z, i) => (z + corridorBays[i]) / 2);
    const bayWidth = Math.abs(corridorBays[0] - corridorBays[1]) - 0.6;
    return slots.flatMap((center, bay) => {
      const entries =
        row.length <= slots.length
          ? row.filter(
              (_, index) =>
                bay ===
                (row.length === 1
                  ? 1
                  : Math.round(
                      (index * (slots.length - 1)) / (row.length - 1),
                    )),
            )
          : row.slice(
              Math.ceil((bay * row.length) / slots.length),
              Math.ceil(((bay + 1) * row.length) / slots.length),
            );
      const spacing = bayWidth / entries.length;
      return entries.map((portrait, index) => ({
        portrait,
        side,
        x: side * (corridorRoom.halfWidth - 0.12),
        y: 2.17,
        z:
          entries.length === 1
            ? center + side * 0.22
            : center + bayWidth / 2 - spacing * (index + 0.5),
        width: Math.min(1.64 * portrait.aspectRatio, 2.28, spacing * 0.78),
      }));
    });
  });
}

export const placedPortraits = placePortraits(portraits);
export type PlacedPortrait = (typeof placedPortraits)[number];
