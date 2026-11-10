import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { LatheGeometry, Shape, Vector2, TextureLoader, SRGBColorSpace } from "three";
import { museum } from "../../content/museum";
import { Box, Label } from "./Exhibit";
import { SolidBox } from "./RoomShell";
import { FloorContactShadows } from "./FloorContactShadows";
import { EntranceMemory } from "./EntranceMemory";

const arch = new Shape();
for (const outside of [true, false]) {
  for (let step = 0; step <= 32; step++) {
    const angle = ((outside ? step : 32 - step) * Math.PI) / 32;
    const x = (outside ? 2.27 : 1.96) * Math.cos(angle);
    const y = (outside ? 1.51 : 1.2) * Math.sin(angle);
    if (outside && step === 0) arch.moveTo(x, y);
    else arch.lineTo(x, y);
  }
}
arch.closePath();

export function EntrancePortalSurround() {
  return (
    <>
      <mesh position={[0, 4, 0.33]}>
        <extrudeGeometry
          args={[
            arch,
            {
              depth: 0.105,
              bevelEnabled: true,
              bevelSegments: 1,
              bevelSize: 0.017,
              bevelThickness: 0.018,
              curveSegments: 8,
            },
          ]}
        />
        <meshStandardMaterial color="#d4c0a1" roughness={0.58} />
      </mesh>
      <Box position={[0, 4.2, 0.39]} size={[3.68, 0.25, 0.08]} color="#a28054" />
      <Label
        text="LOOK TO YOUR RIGHT →"
        position={[0, 4.2, 0.438]}
        size={[3.52, 0.19]}
        paper="#eee4d2"
        color="#59452e"
      />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 2.11, 0, 0.36]}>
          <Box
            position={[0, 1.99, 0]}
            size={[0.29, 3.98, 0.21]}
            color="#cab596"
          />
          <Box
            position={[0, 1.98, 0.116]}
            size={[0.084, 3.8, 0.02]}
            color="#8b6c4b"
          />
          <Box
            position={[0, 0.19, 0.013]}
            size={[0.41, 0.38, 0.29]}
            color="#a58a6b"
          />
          <Box
            position={[0, 3.99, 0.02]}
            size={[0.44, 0.15, 0.28]}
            color="#e1ccb0"
          />
        </group>
      ))}
    </>
  );
}

const urnContacts = [[-4.56, 10.36, 1.85, 1.85], [4.56, 10.36, 1.85, 1.85]] as const;

export function GrandEntrance() {
  const marble = useLoader(TextureLoader, "/materials/white_marble-diffuse.webp");
  marble.colorSpace = SRGBColorSpace;
  const urn = useMemo(
    () =>
      new LatheGeometry(
        [
          [0.17, 0],
          [0.18, 0.05],
          [0.13, 0.12],
          [0.15, 0.21],
          [0.26, 0.31],
          [0.35, 0.44],
          [0.37, 0.58],
          [0.34, 0.7],
          [0.28, 0.78],
          [0.26, 0.87],
          [0.31, 0.9],
          [0.31, 0.94],
          [0.27, 0.945],
          [0.26, 0.89],
        ].map(([r, y]) => new Vector2(r, y)),
        32,
      ),
    [],
  );
  useEffect(() => () => urn.dispose(), [urn]);
  return (
    <>
      <EntranceMemory />
      {/* Central ceremonial floor inlay draws the eye toward the first gallery. */}
      {[-1.65, 1.65].map((x) => (
        <Box key={x} position={[x, 0.012, 17.15]} size={[0.025, 0.018, 9.8]} color="#b8935c" metalness={0.5} />
      ))}
      <FloorContactShadows contacts={urnContacts} />
      <Box
        position={[0, 6.45, 10.34]}
        size={[6.3, 0.81, 0.11]}
        color="#68513d"
      />
      <Box
        position={[0, 6.45, 10.415]}
        size={[6.13, 0.66, 0.042]}
        color="#3d3229"
      />
      <Label
        text={museum.title.toUpperCase()}
        position={[0, 6.45, 10.44]}
        size={[5.9, 0.51]}
        color="#f4dec1"
        paper="transparent"
      />
      <Label
        text={museum.dedication.toUpperCase()}
        position={[0, 5.91, 10.401]}
        size={[5.45, 0.19]}
        color="#4a382b"
        paper="#beaa8e"
      />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 4.56, 0, 10.36]}>
          <Box
            position={[0, 2.99, 0]}
            size={[3.24, 5.06, 0.09]}
            color="#b6a58d" surface="plaster"
          />
          <Box
            position={[0, 3.03, 0.063]}
            size={[3.08, 4.77, 0.045]}
            color="#ded3c1" surface="plaster"
          />
          <Box
            position={[0, 3.04, 0.092]}
            size={[2.84, 4.48, 0.023]}
            color="#c9beaa" surface="plaster"
          />
          <Box
            position={[0, 0.33, 0.08]}
            size={[3.52, 0.59, 0.2]}
            color="#8d7964"
          />
          <Box
            position={[0, 0.63, 0.13]}
            size={[3.6, 0.065, 0.18]}
            color="#d0bea3"
          />
          {!(side === 1 && museum.entrance) && (
            <group>
              <mesh position={[0, 3.78, 0.116]}>
                <circleGeometry args={[0.38, 40]} />
                <meshStandardMaterial color="#9d8160" roughness={0.65} />
              </mesh>
              <mesh position={[0, 3.78, 0.131]}>
                <ringGeometry args={[0.307, 0.343, 40]} />
                <meshStandardMaterial color="#dac1a0" roughness={0.55} />
              </mesh>
              <Box
                position={[0, 3.68, 0.2]}
                size={[0.091, 0.46, 0.15]}
                color="#7d5d3f"
                metalness={0.35}
              />
              <mesh position={[0, 3.81, 0.275]}>
                <cylinderGeometry args={[0.089, 0.072, 0.22, 14]} />
                <meshStandardMaterial
                  emissive="#ffd296"
                  emissiveIntensity={0.85}
                  color="#e9ce9f"
                />
              </mesh>
            </group>
          )}
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 4, 0, 15]}>
          <SolidBox
            position={[0, 0.7, 0]}
            size={[1.2, 1.4, 1.2]}
            color="#d7ccba" map={marble}
          />
          <Box
            position={[0, 0.102, 0]}
            size={[1.24, 0.2, 1.24]}
            color="#655243"
          />
          <Box
            position={[0, 1.34, 0]}
            size={[1.26, 0.14, 1.26]}
            color="#d2bda0"
          />
          <Box
            position={[0, 0.8, 0.605]}
            size={[0.72, 0.63, 0.028]}
            color="#9e876b"
          />
          <Box
            position={[0, 0.8, 0.623]}
            size={[0.63, 0.53, 0.018]}
            color="#c5af93"
          />
          <mesh position={[0, 1.41, 0]} geometry={urn}>
            <meshPhysicalMaterial
              color="#254e50"
              roughness={0.27}
              metalness={0.06}
              clearcoat={0.65}
              clearcoatRoughness={0.22}
            />
          </mesh>
          <mesh position={[0, 2.315, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.296, 0.017, 8, 32]} />
            <meshStandardMaterial
              color="#d2a66e"
              metalness={0.55}
              roughness={0.34}
            />
          </mesh>
        </group>
      ))}
      <group position={[0, 0, 23.96]} rotation={[0, Math.PI, 0]}>
        <Box position={[0, 3.7, 0]} size={[6.1, 2.42, 0.17]} color="#937c60" />
        <Box
          position={[0, 3.7, 0.105]}
          size={[5.88, 2.19, 0.08]}
          color="#bca487"
        />
        <Label
          text="WELCOME TO OUR FOREVER MUSEUM"
          position={[0, 3.72, 0.151]}
          size={[5.4, 0.39]}
          color="#4c392c"
          paper="transparent"
        />
      </group>
    </>
  );
}
