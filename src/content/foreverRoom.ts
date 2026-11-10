import { foreverRoom, roomCenterZ } from "./layout";

export const letterPedestal = {
  z: -3,
  radius: 2.5,
  openingMs: 520,
};

export function letterInReach(x: number, z: number) {
  return (
    z >= foreverRoom.minZ &&
    z < foreverRoom.maxZ &&
    Math.hypot(x, z - roomCenterZ(foreverRoom) - letterPedestal.z) <=
      letterPedestal.radius
  );
}

export const foreverQuotes = [
  {
    text: "Always and forever.",
  },
  {
    text: "I do love you, you know.",
  },
  {
    text: "love of all my lives",
  },
];
