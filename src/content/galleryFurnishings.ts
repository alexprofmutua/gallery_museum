import { galleryRoom, type MuseumRoom } from "./layout";

export type GallerySeat = {
  position: [number, number, number];
  rotationY: number;
  halfWidth: number;
  halfDepth: number;
};
export const caseHalfSize = [1.06, 0.79, 0.56] as const;
export const seatHalfSize = [1.48, 0.65, 0.64] as const;

export function createGalleryFurnishings(room: MuseumRoom) {
  const depth = room.maxZ - room.minZ;
  const at = (fraction: number) => room.maxZ - depth * fraction;
  const cases = [0.15, 0.32, 0.49, 0.66, 0.83].map(
    (fraction, index): [number, number, number] => [index % 2 ? 2.3 : -2.3, 0, at(fraction)],
  );
  const longGallery = depth >= 32;
  const seats: GallerySeat[] = [
    { position: [2.65, 0, at(longGallery ? 0.545 : 0.49)], rotationY: -Math.PI / 2, halfWidth: seatHalfSize[0], halfDepth: seatHalfSize[2] },
    { position: [-2.65, 0, at(longGallery ? 0.74 : 0.625)], rotationY: Math.PI / 2, halfWidth: seatHalfSize[0], halfDepth: seatHalfSize[2] },
  ];
  if (longGallery) {
    const seat = seats[1];
    // Look across the open floor toward the large portrait opposite this pocket.
    seat.rotationY = Math.atan2(room.halfWidth - 0.06 - seat.position[0], at(0.81818) - seat.position[2]);
  }
  const lightZones = [0.2, 0.5, 0.8].map(at);
  return { cases, seats, lightZones };
}

export function seatFootprint(seat: GallerySeat) {
  const c = Math.abs(Math.cos(seat.rotationY)), s = Math.abs(Math.sin(seat.rotationY));
  return { halfX: c * seat.halfWidth + s * seat.halfDepth, halfZ: s * seat.halfWidth + c * seat.halfDepth };
}
export const galleryFurnishings = createGalleryFurnishings(galleryRoom);
