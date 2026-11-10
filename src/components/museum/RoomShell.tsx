import { RoyalCorridorShell } from "./RoyalCorridorShell";
import { RoomArchitectureDetails } from "./RoomArchitectureDetails";
import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, type Texture } from "three";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { CinemaShell } from "./CinemaInterior";
import { ClassicInteriors } from "./ClassicInteriors";
import { stoneFloorTexture, surfaceTexture } from "./surfaceTextures";
import { Box } from "./Exhibit";
import type { MuseumRoom } from "../../content/layout";
export function SolidBox({
  position,
  size,
  color,
  map,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  map?: Texture;
}) {
  return (
    <>
      <Box position={position} size={size} color={color} map={map} />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          position={position}
          args={[size[0] / 2, size[1] / 2, size[2] / 2]}
        />
      </RigidBody>
    </>
  );
}
export function RoomShell({
  room,
  visible,
}: {
  room: MuseumRoom;
  visible: boolean;
}) {
  const { halfWidth: w, minZ, maxZ, height: h } = room;
  const classic = room.id === "entrance" || room.id === "gallery";
  const cinema = room.id === "cinema";
  const forever = room.id === "forever";
  const corridor = room.id === "corridor";
  const columnSides = cinema ? [1] : [-1, 1];
  const depth = maxZ - minZ,
    center = (minZ + maxZ) / 2;
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[w, 0.12, depth / 2]}
          position={[0, h + 0.12, center]}
        />
        <CuboidCollider
          args={[w + 0.3, 0.2, depth / 2]}
          position={[0, -0.2, center]}
        />
        {[-1, 1].map((side) => (
          <CuboidCollider
            key={side}
            args={[0.2, h / 2, depth / 2]}
            position={[side * (w + 0.2), h / 2, center]}
          />
        ))}
        {forever && (
          <CuboidCollider
            args={[w + 0.2, h / 2, 0.18]}
            position={[0, h / 2, minZ - 0.1]}
          />
        )}
      </RigidBody>
      {visible && <RoomArchitectureDetails room={room} />}
      {visible && classic && <ClassicInteriors room={room} />}
      {visible && cinema && (
        <group position={[0, 0, center]}>
          <CinemaShell />
        </group>
      )}
      {visible && corridor && <RoyalCorridorShell />}
      {visible && forever && (
        <group>
          <ConservatoryFloor width={w * 2} depth={depth} center={center} />
        </group>
      )}
      {/* Column colliders remain mounted when decorative meshes are culled. */}
      {!corridor &&
        !forever &&
        Array.from(
          { length: Math.floor(depth / 4) },
          (_, i) => minZ + 2 + i * 4,
        ).flatMap((z) =>
          columnSides.map((side) => (
            <RigidBody key={`${side}-${z}`} type="fixed" colliders={false}>
              <CuboidCollider
                args={[0.4, h / 2, 0.4]}
                position={[side * (w - 0.65), h / 2, z]}
              />
            </RigidBody>
          )),
        )}
    </>
  );
}

function ConservatoryFloor({ width, depth, center }: { width: number; depth: number; center: number }) {
  const marble = useLoader(TextureLoader, "/materials/white_marble-diffuse.webp");
  const floor = useMemo(
    () => stoneFloorTexture(marble, width, depth),
    [depth, marble, width],
  );
  useEffect(() => () => floor.dispose(), [floor]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, center]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial map={floor} color="#d6d8de" roughness={0.48} bumpMap={surfaceTexture("plaster")} bumpScale={0.004} />
    </mesh>
  );
}
