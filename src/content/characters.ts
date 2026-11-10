export const characterIds = ["starfish", "blue-whale"] as const;
export type CharacterId = (typeof characterIds)[number];
export const defaultCharacter: CharacterId = "blue-whale";

export const characters = {
  starfish: { name: "Starfish", coat: "#b96663", trim: "#ffcc85" },
  "blue-whale": { name: "Blue Whale", coat: "#305f86", trim: "#a9dfed" },
} satisfies Record<CharacterId, { name: string; coat: string; trim: string }>;
