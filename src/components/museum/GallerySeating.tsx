import { useEffect, useMemo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { galleryFurnishings, seatHalfSize } from "../../content/galleryFurnishings";
import { Box } from "./Exhibit";
import { surfaceTexture } from "./surfaceTextures";

export function GallerySeating() {
  const cushion = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 3, 0.12), []);
  useEffect(() => () => cushion.dispose(), [cushion]);
  return <>{galleryFurnishings.seats.map((seat, index) => (
    <group key={index} name={`gallery-seating-pocket-${index + 1}`} position={seat.position} rotation={[0, seat.rotationY, 0]}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[...seatHalfSize]} position={[0, 0.65, 0]} />
      </RigidBody>
      <Box position={[0, 0.36, 0]} size={[2.92, 0.28, 1.18]} color="#483126" surface="wood" />
      {[-1.1, 1.1].flatMap(x => [-0.39, 0.39].map(z => (
        <Box key={`${x}:${z}`} position={[x, 0.16, z]} size={[0.12, 0.32, 0.12]} color="#755a3a" metalness={0.35} />
      )))}
      <Box position={[0, 0.94, -0.49]} size={[2.88, 0.75, 0.15]} color="#483126" surface="wood" />
      {[-0.68, 0.68].map(x => (
        <group key={x}>
          <mesh geometry={cushion} position={[x, 0.59, 0.05]} scale={[1.3, 0.25, 1.01]}>
            <meshStandardMaterial color="#617063" roughness={0.96} bumpMap={surfaceTexture("fabric")} bumpScale={0.008} />
          </mesh>
          <mesh geometry={cushion} position={[x, 1.02, -0.35]} scale={[1.3, 0.65, 0.2]} rotation={[-0.08, 0, 0]}>
            <meshStandardMaterial color="#617063" roughness={0.96} bumpMap={surfaceTexture("fabric")} bumpScale={0.008} />
          </mesh>
        </group>
      ))}
      {[-1.4, 1.4].map(x => <Box key={x} position={[x, 0.75, 0]} size={[0.14, 0.56, 1.2]} color="#483126" surface="wood" />)}
    </group>
  ))}</>;
}
