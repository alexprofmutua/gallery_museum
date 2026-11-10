import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, Object3D, type InstancedMesh } from "three";
import type { MuseumRoom } from "../../content/layout";

/**
 * Lightweight, room-specific architectural accents. The pieces are decorative
 * only, deliberately placed above head height and away from doors, seating,
 * frames and interactive exhibits. Three instanced meshes for each room.
 */
type Piece = {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
};
type Finish = "stone" | "metal" | "glow";

function Batch({ pieces, finish }: { pieces: Piece[]; finish: Finish }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const object = new Object3D();
    const color = new Color();
    pieces.forEach((piece, index) => {
      object.position.set(...piece.position);
      object.scale.set(...piece.size);
      object.rotation.set(0, 0, 0);
      object.updateMatrix();
      mesh.current!.setMatrixAt(index, object.matrix);
      mesh.current!.setColorAt(index, color.set(piece.color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [pieces]);
  if (!pieces.length) return null;
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, pieces.length]} frustumCulled>
      <boxGeometry />
      {finish === "glow" ? (
        <meshBasicMaterial toneMapped={false} />
      ) : (
        <meshStandardMaterial
          roughness={finish === "metal" ? 0.35 : 0.75}
          metalness={finish === "metal" ? 0.65 : 0.05}
        />
      )}
    </instancedMesh>
  );
}

const schemes = {
  entrance: { stone: "#e7d5b7", metal: "#b68a52", glow: "#ffe1a5" },
  gallery: { stone: "#e6ddcc", metal: "#9c805a", glow: "#f8e6c5" },
  corridor: { stone: "#b9a9ca", metal: "#8f6da9", glow: "#d9baff" },
  cinema: { stone: "#49333e", metal: "#bb8557", glow: "#ffd1a0" },
  forever: { stone: "#e4d9d9", metal: "#c29a79", glow: "#ffe5c5" },
} as const;

function makePieces(room: MuseumRoom) {
  const { stone, metal, glow } = schemes[room.id];
  const pieces: Record<Finish, Piece[]> = { stone: [], metal: [], glow: [] };
  const add = (finish: Finish, position: Piece["position"], size: Piece["size"], color: string) => {
    pieces[finish].push({ position, size, color });
  };
  const depth = room.maxZ - room.minZ;
  const center = (room.minZ + room.maxZ) / 2;
  const w = room.halfWidth;
  const h = room.height;
  // Perimeter cornice: a distinctive layered silhouette in each room.
  // These are near the side walls and above the visitor's sightline.
  for (const side of [-1, 1]) {
    const x = side * (w - 0.12);
    add("stone", [x, h - 0.34, center], [0.34, 0.23, depth - 0.25], stone);
    add("metal", [x - side * 0.03, h - 0.49, center], [0.16, 0.045, depth - 0.35], metal);
    if (room.id !== "cinema") {
      add("glow", [x - side * 0.16, h - 0.59, center], [0.035, 0.025, depth - 0.65], glow);
    }
  }

  if (room.id === "entrance") {
    // A sequence of grand coffered ceiling bays and brass dividers.
    for (const z of [12.2, 15.3, 18.4, 21.5]) {
      for (const x of [-4.8, 4.8]) {
        add("metal", [x, h - 0.22, z], [0.075, 0.07, 2.32], metal);
      }
      add("metal", [0, h - 0.22, z], [9.65, 0.06, 0.065], metal);
    }
  } else if (room.id === "gallery") {
    // Repeating gallery ceiling rails, above and separate from picture frames.
    const count = Math.max(3, Math.floor(depth / 5));
    for (let i = 0; i < count; i++) {
      const z = room.minZ + (i + 0.5) * depth / count;
      add("stone", [0, h - 0.12, z], [8.5, 0.09, 0.38], stone);
      add("metal", [0, h - 0.2, z], [8.3, 0.035, 0.075], metal);
    }
  } else if (room.id === "corridor") {
    // A violet-and-brass rhythm of crown beams between living portraits.
    const count = Math.max(4, Math.floor(depth / 4));
    for (let i = 0; i <= count; i++) {
      const z = room.minZ + 0.4 + i * (depth - 0.8) / count;
      add("stone", [0, h - 0.16, z], [4.85, 0.12, 0.18], stone);
      add("metal", [0, h - 0.24, z], [4.6, 0.04, 0.055], metal);
    }
  } else if (room.id === "cinema") {
    // Art-deco ceiling ribs; no new light sources or projector interference.
    for (const z of [-5.7, -2.85, 0, 2.85, 5.7]) {
      add("metal", [0, h - 0.16, center + z], [8.5, 0.055, 0.09], metal);
      for (const x of [-4.2, 4.2]) {
        add("glow", [x, h - 0.21, center + z], [0.55, 0.025, 0.06], glow);
      }
    }
  } else {
    // The conservatory has a glass roof: keep the sky visible.
    // A thin central floor inlay frames the letter pedestal from a distance.
    for (const x of [-2.15, 2.15]) {
      add("metal", [x, 0.018, center], [0.025, 0.012, depth - 1.2], metal);
    }
    for (const z of [room.minZ + 1.2, room.maxZ - 1.2]) {
      add("metal", [0, 0.018, z], [4.32, 0.012, 0.025], metal);
    }
  }
  return pieces;
}

export function RoomArchitectureDetails({ room }: { room: MuseumRoom }) {
  const pieces = useMemo(() => makePieces(room), [room]);
  return (
    <group>
      <Batch pieces={pieces.stone} finish="stone" />
      <Batch pieces={pieces.metal} finish="metal" />
      <Batch pieces={pieces.glow} finish="glow" />
    </group>
  );
}
