import { galleryFurnishings } from "../../content/galleryFurnishings";
import type { ReactNode } from "react";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { Box, Label } from "./Exhibit";

function GlassCase({
  position,
  title,
  children,
}: {
  position: [number, number, number];
  title: string;
  children: ReactNode;
}) {
  return (
    <group position={position} name={title}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1.06, 0.79, 0.56]} position={[0, 0.79, 0]} />
      </RigidBody>
      <Box position={[0, 0.48, 0]} size={[2, 0.96, 1]} color="#3b2b24" surface="wood" />
      <Box
        position={[0, 0.48, 0.503]}
        size={[1.76, 0.64, 0.035]}
        color="#584131" surface="wood"
      />
      <Box
        position={[0, 0.48, 0.525]}
        size={[1.67, 0.55, 0.022]}
        color="#443026" surface="wood"
      />
      <Box position={[0, 0.09, 0]} size={[2.12, 0.18, 1.12]} color="#29211d" surface="wood" />
      <Box
        position={[0, 0.96, 0]}
        size={[2.12, 0.085, 1.12]}
        color="#a88457"
        metalness={0.4}
      />
      <Box position={[0, 1.025, 0]} size={[1.93, 0.07, 0.93]} color="#4e5b4d" surface="fabric" />
      <Label
        text={title}
        position={[0, 0.74, 0.54]}
        size={[1.31, 0.19]}
        color="#f0dec2"
        paper="#4f4032"
      />
      {[-0.89, 0.89].flatMap(x => [-0.39, 0.39].map(z => (
        <Box key={`${x}:${z}`} position={[x, 0.035, z]} size={[0.13, 0.07, 0.13]}
          color="#a88457" metalness={0.65} />
      )))}
      {children}
      <mesh position={[0, 1.295, 0]} renderOrder={1}>
        <boxGeometry args={[2.03, 0.58, 1.03]} />
        <meshPhysicalMaterial
          color="#ecf2f0"
          opacity={0.08}
          transparent
          depthWrite={false}
          roughness={0.09}
          clearcoat={0.7}
        />

      </mesh>
    </group>
  );
}

export function GalleryDisplayCases() {
  return (
    <>
      <GlassCase position={galleryFurnishings.cases[0]} title="01 / THE TICKET STUB">
        <group position={[0, 1.16, 0]} rotation={[-0.56, 0, 0.16]}>
          <Box
            position={[-0.26, 0, 0]}
            size={[0.67, 0.35, 0.04]}
            color="#c9b5a0"
          />
          <Box
            position={[0.22, 0.04, 0.03]}
            size={[0.67, 0.35, 0.04]}
            color="#bd737a"
          />
          <Label
            text="ADMIT TWO"
            position={[0.22, 0.04, 0.054]}
            size={[0.51, 0.16]}
          />
        </group>
      </GlassCase>
      <GlassCase position={galleryFurnishings.cases[1]} title="02 / A FLOWER KEPT">
        <group position={[-0.48, 1.15, 0.05]} rotation={[-0.68, 0, 0.19]}>
          <Box position={[0, 0, 0]} size={[0.61, 0.38, 0.04]} color="#e3cca2" />
          <Box
            position={[0, 0.09, 0.024]}
            size={[0.54, 0.12, 0.008]}
            color="#d4b989"
          />
          <mesh position={[0, 0, 0.032]}>
            <circleGeometry args={[0.055, 18]} />
            <meshStandardMaterial color="#8f3848" roughness={0.45} />
          </mesh>
        </group>
        <group
          position={[0.46, 1.085, -0.02]}
          rotation={[-Math.PI / 2, 0, -0.28]}
        >
          <Box
            position={[0, 0, 0]}
            size={[0.65, 0.65, 0.045]}
            color="#d8c49e"
          />
          <Box
            position={[0, -0.06, 0.029]}
            size={[0.022, 0.37, 0.016]}
            color="#687551"
          />
          {Array.from({ length: 6 }, (_, index) => {
            const angle = (index * Math.PI) / 3;
            return (
              <mesh
                key={index}
                position={[
                  0.061 * Math.cos(angle),
                  0.13 + 0.061 * Math.sin(angle),
                  0.038,
                ]}
                rotation={[0, 0, angle]}
                scale={[0.069, 0.044, 0.016]}
              >
                <sphereGeometry args={[1, 10, 8]} />
                <meshStandardMaterial color="#bb6c78" roughness={0.85} />
              </mesh>
            );
          })}
          <mesh position={[0, 0.13, 0.053]} scale={[0.041, 0.041, 0.015]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#dfad63" />
          </mesh>
        </group>
      </GlassCase>
      <GlassCase position={galleryFurnishings.cases[2]} title="03 / THE BRASS KEY">
        <group position={[0, 1.12, 0]} rotation={[-Math.PI / 2, 0, 0.25]}>
          <mesh position={[-0.26, 0, 0]}>
            <torusGeometry args={[0.12, 0.028, 10, 28]} />
            <meshStandardMaterial
              color="#c49c50"
              metalness={0.55}
              roughness={0.4}
            />
          </mesh>
          <Box
            position={[0.02, 0, 0]}
            size={[0.44, 0.065, 0.046]}
            color="#c49c50"
            metalness={0.55}
          />
          <Box
            position={[0.21, -0.065, 0]}
            size={[0.07, 0.18, 0.046]}
            color="#c49c50"
            metalness={0.55}
          />
          <Box
            position={[0.09, -0.045, 0]}
            size={[0.07, 0.13, 0.046]}
            color="#c49c50"
            metalness={0.55}
          />
        </group>
      </GlassCase>
      <GlassCase position={galleryFurnishings.cases[3]} title="04 / THE LITTLE CAMERA">
        <group position={[0, 1.28, 0]} rotation={[0, -0.18, 0]}>
          <Box position={[0, 0, 0]} size={[0.76, 0.44, 0.28]} color="#33343a" />
          <Box
            position={[0, 0.185, 0]}
            size={[0.76, 0.09, 0.29]}
            color="#b4a58e"
            metalness={0.4}
          />
          <Box
            position={[-0.24, 0.135, 0.15]}
            size={[0.115, 0.075, 0.025]}
            color="#797b85"
          />
          <mesh position={[0.055, -0.025, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.17, 0.15, 28]} />
            <meshStandardMaterial color="#55545a" metalness={0.45} />
          </mesh>
          <mesh position={[0.055, -0.025, 0.257]}>
            <circleGeometry args={[0.116, 28]} />
            <meshStandardMaterial color="#3a5267" roughness={0.24} />
          </mesh>
        </group>
      </GlassCase>
      <GlassCase position={galleryFurnishings.cases[4]} title="05 / THE POCKET WATCH">
        <group position={[0, 1.24, 0]} rotation={[-0.56, 0, -0.14]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.205, 0.205, 0.085, 36]} />
            <meshStandardMaterial
              color="#aa8547"
              metalness={0.55}
              roughness={0.38}
            />
          </mesh>
          <mesh position={[0, 0, 0.044]}>
            <circleGeometry args={[0.174, 36]} />
            <meshStandardMaterial color="#ead8ad" />
          </mesh>
          <Box
            position={[0, 0.058, 0.048]}
            size={[0.014, 0.12, 0.008]}
            color="#573d33"
          />
          <Box
            position={[0.045, 0, 0.048]}
            size={[0.09, 0.014, 0.008]}
            color="#573d33"
          />
          <mesh position={[0, 0.237, 0]}>
            <torusGeometry args={[0.037, 0.012, 8, 16]} />
            <meshStandardMaterial
              color="#aa8547"
              metalness={0.55}
              roughness={0.38}
            />
          </mesh>
        </group>
      </GlassCase>
    </>
  );
}
