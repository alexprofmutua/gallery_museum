import { CraftedSurfaces } from "./CraftedSurfaces";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import {
  BackSide,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  MathUtils,
  MeshStandardMaterial,
  Object3D,
  Points,
  type PointsMaterial,
  Triangle,
  TextureLoader,
  SRGBColorSpace,
  Vector3,
} from "three";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { foreverQuotes, letterPedestal } from "../../content/foreverRoom";
import { cinematics } from "../../content/museum";
import { prefersReducedMotion } from "../../engine/motion";
import { useMuseum } from "../../stores/museum";
import { surfaceTexture } from "./surfaceTextures";
import { Box, Label } from "./Exhibit";
import { FloorContactShadows } from "./FloorContactShadows";
import { SolidBox } from "./RoomShell";

type Point = [number, number, number];
type Piece = {
  position: Point;
  scale: Point;
  color: string;
  rotation?: Point;
};

function Pieces({
  pieces,
  shape = "box",
  emissive = false,
  finish = "stone",
}: {
  pieces: Piece[];
  shape?: "box" | "petal" | "stem";
  emissive?: boolean;
  finish?: "stone" | "metal";
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const transform = new Object3D();
    const color = new Color();
    pieces.forEach((piece, index) => {
      transform.position.set(...piece.position);
      transform.scale.set(...piece.scale);
      transform.rotation.set(...(piece.rotation ?? [0, 0, 0]));
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
      mesh.setColorAt(index, color.set(piece.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [pieces, shape, emissive, finish]);
  const rigidPieces = useMemo(() => pieces.map(piece => ({ ...piece, size: piece.scale })), [pieces]);
  if (shape === "box" && !emissive)
    return <CraftedSurfaces pieces={rigidPieces} finish={finish} />;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pieces.length]}>
      {shape === "box" ? <boxGeometry /> : shape === "stem" ? <cylinderGeometry args={[1, 1, 1, 8]} /> : <sphereGeometry args={[1, 16, 10]} />}
      {emissive ? (
        <meshBasicMaterial toneMapped={false} />
      ) : (
        <meshStandardMaterial
          metalness={finish === "metal" ? 0.48 : 0}
          roughness={finish === "metal" ? 0.36 : shape === "box" ? 0.78 : 0.88}
          bumpMap={finish !== "metal" && shape === "box" ? surfaceTexture("plaster") : undefined}
          bumpScale={0.008}
        />
      )}
    </instancedMesh>
  );
}

const brass = "#c49a60";
const ivory = "#e5dccc";
const width = 6.94;
const eave = 4.85;
const rise = 3.65;
const sections = 12;
const bays = [-7.94, -5.3, -2.65, 0, 2.65, 5.3, 7.94];

function arch(index: number, z: number): Point {
  const angle = (index * Math.PI) / sections;
  return [width * Math.cos(angle), eave + rise * Math.sin(angle), z];
}

const framing: Piece[] = [];
const lights: Piece[] = [];
const glassVertices: number[] = [];

function glassPane(a: Point, b: Point, c: Point, d: Point) {
  glassVertices.push(...a, ...b, ...c, ...a, ...c, ...d);
}

function roofBar(a: Point, b: Point, thickness: number) {
  const offset = new Vector3().fromArray(b).sub(new Vector3().fromArray(a));
  framing.push({
    position: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2]],
    rotation: [0, 0, Math.atan2(offset.y, offset.x)],
    scale: [offset.length() + thickness / 2, thickness, thickness],
    color: brass,
  });
}

for (const z of bays) {
  for (let index = 0; index < sections; index++) {
    roofBar(arch(index, z), arch(index + 1, z), 0.085);
  }
  for (const side of [-1, 1]) {
    framing.push(
      {
        position: [side * 6.82, eave / 2, z],
        scale: [0.2, eave, 0.22],
        color: ivory,
      },
      { position: [side * 6.8, 0.42, z], scale: [0.4, 0.2, 0.4], color: brass },
      {
        position: [side * 6.8, eave - 0.2, z],
        scale: [0.34, 0.22, 0.34],
        color: brass,
      },
    );
  }
}

for (let index = 0; index <= sections; index++) {
  const [x, y] = arch(index, 0);
  framing.push({
    position: [x, y, 0],
    scale: [0.065, 0.065, 15.88],
    color: brass,
  });
  if (index === sections) continue;
  const a = arch(index, bays[0]);
  const b = arch(index + 1, bays[0]);
  const c = arch(index + 1, bays[bays.length - 1]);
  const d = arch(index, bays[bays.length - 1]);
  glassPane(a, b, c, d);
  for (const z of [bays[0], bays[bays.length - 1]]) {
    const [ax, ay] = arch(index, z);
    const [bx, by] = arch(index + 1, z);
    glassPane([ax, eave, z], [ax, ay, z], [bx, by, z], [bx, eave, z]);
  }
}

for (const side of [-1, 1]) {
  const x = side * width;
  glassPane(
    [x, 0.35, -7.94],
    [x, eave, -7.94],
    [x, eave, 7.94],
    [x, 0.35, 7.94],
  );
  framing.push({
    position: [side * 2.04, 0.012, 0],
    scale: [0.035, 0.01, 15.8],
    color: brass,
  });
  for (const y of [0.35, 1.85, 3.4, eave]) {
    framing.push({
      position: [side * width, y, 0],
      scale: [0.11, 0.09, 15.88],
      color: brass,
    });
  }
  for (const z of [-6.65, -4, -1.33, 1.33, 4, 6.65]) {
    framing.push(
      {
        position: [side * 6.6, 2.7, z],
        scale: [0.24, 0.065, 0.23],
        color: brass,
      },
      {
        position: [side * 6.6, 2.32, z],
        scale: [0.24, 0.065, 0.23],
        color: brass,
      },
    );
    lights.push({
      position: [side * 6.6, 2.51, z],
      scale: [0.15, 0.32, 0.15],
      color: "#ffcf93",
    });
  }
  for (let index = 0; index < 32; index++) {
    const z = -7.75 + index * 0.5;
    lights.push({
      position: [side * 6.7, 4.54 - 0.22 * Math.abs(Math.sin(z * 1.18)), z],
      scale: [0.038, 0.042, 0.038],
      color: index % 3 === 0 ? "#ffe0aa" : "#d4a478",
    });
  }
}

glassPane(
  [-width, 2.45, -7.94],
  [-width, eave, -7.94],
  [width, eave, -7.94],
  [width, 2.45, -7.94],
);
for (const x of [-4.65, -2.35, 0, 2.35, 4.65]) {
  framing.push({
    position: [x, (2.45 + eave) / 2, -7.89],
    scale: [0.095, eave - 2.45, 0.11],
    color: brass,
  });
}
framing.push(
  { position: [0, eave, -7.89], scale: [2 * width, 0.11, 0.11], color: brass },
  { position: [0, 3.32, -7.85], scale: [4.25, 0.65, 0.08], color: brass },
);
const panes = new Float32Array(glassVertices);
const brassFraming = framing.filter(piece => piece.color === brass);
const stoneFraming = framing.filter(piece => piece.color !== brass);

function Glass() {
  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[panes, 3]} />
      </bufferGeometry>
      <meshBasicMaterial
        color="#a2cbef"
        opacity={0.105}
        transparent
        depthWrite={false}
        side={DoubleSide}
        forceSinglePass
      />
    </mesh>
  );
}

const planters = [-5.8, 5.8].flatMap((x) =>
  [-5.5, -1.6, 2.3, 5.6].map((z) => ({ x, z })),
);
const gardenContacts = planters.map(({ x, z }) => [x, z, 1.45, 2.15] as const);
const pedestalContact = [[0, letterPedestal.z, 1.85, 1.73]] as const;
const planterPieces: Piece[] = planters.flatMap(({ x, z }) => [
  { position: [x, 0.28, z], scale: [0.94, 0.56, 1.64], color: "#c1ada0" },
  { position: [x, 0.55, z], scale: [1.02, 0.09, 1.72], color: "#e0cfb6" },
  { position: [x, 0.6, z], scale: [0.87, 0.026, 1.53], color: "#35473b" },
]);

function Garden() {
  const low = useMuseum((state) => state.graphics === "low");
  const plants = useRef<Group>(null);
  const { ivoryRose, blushRose } = cinematics.conservatory;
  const { flowers, foliage, stems } = useMemo(() => {
    const flowers: Piece[] = [];
    const stems: Piece[] = [];
    const foliage: Piece[] = [];
    for (const side of [-1, 1]) {
      for (const z of [-5.5, -1.6, 2.3, 5.6]) {
        for (let stem = 0; stem < (low ? 8 : 13); stem++) {
          const x = side * 5.8 + Math.sin(stem * 2.4) * 0.36;
          const depth = z + Math.cos(stem * 2.4) * 0.59;
          const y = 0.79 + (stem % 5) * 0.091;
          stems.push({
            position: [x, (y + 0.61) / 2, depth],
            scale: [0.011, y - 0.61, 0.011],
            color: "#36543b",
          });
          foliage.push({
            position: [x + 0.075, y - 0.21, depth],
            scale: [0.22, 0.071, 0.12],
            rotation: [0, stem, 0.46],
            color: stem % 2 ? "#355b45" : "#547450",
          });
          const color = stem % 3 ? ivoryRose : blushRose;
          for (let petal = 0; petal < 5; petal++) {
            const angle = (petal * Math.PI * 2) / 5;
            flowers.push({
              position: [
                x + 0.059 * Math.cos(angle),
                y,
                depth + 0.059 * Math.sin(angle),
              ],
              scale: [0.083, 0.068, 0.062],
              rotation: [0, -angle, 0.62],
              color,
            });
          }
          flowers.push({
            position: [x, y + 0.037, depth],
            scale: [0.056, 0.055, 0.056],
            color,
          });
        }
      }
      for (const z of [-5.3, 0, 5.3]) {
        for (let leaf = 0; leaf < 26; leaf++) {
          foliage.push({
            position: [
              side * 6.66,
              0.65 + leaf * 0.146,
              z + Math.sin(leaf * 0.56) * 0.23,
            ],
            scale: [0.08, 0.095, 0.19],
            rotation: [leaf % 2 ? 0.55 : -0.55, 0, 0],
            color: leaf % 2 ? "#46634c" : "#65815a",
          });
        }
      }
    }
    return { flowers, foliage, stems };
  }, [blushRose, ivoryRose, low]);
  useFrame(({ clock }) => {
    if (plants.current) {
      plants.current.position.x =
        low || prefersReducedMotion()
          ? 0
          : Math.sin(clock.elapsedTime * 0.55) * 0.018;
    }
  });
  return (
    <>
      <FloorContactShadows contacts={gardenContacts} />
      <group ref={plants}>
        <Pieces pieces={stems} shape="stem" />
        <Pieces pieces={foliage} shape="petal" />
        <Pieces pieces={flowers} shape="petal" />
      </group>
      <Pieces pieces={planterPieces} />
      <RigidBody type="fixed" colliders={false}>
        {planters.map(({ x, z }) => (
          <CuboidCollider
            key={`${x}-${z}`}
            position={[x, 0.28, z]}
            args={[0.51, 0.28, 0.86]}
          />
        ))}
      </RigidBody>
    </>
  );
}

const roundPoint: PointsMaterial["onBeforeCompile"] = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <map_particle_fragment>",
    "if (length(gl_PointCoord - vec2(0.5)) > 0.46) discard;",
  );
};

function NightGarden() {
  const low = useMuseum((state) => state.graphics === "low");
  const fireflies = useRef<Points>(null);
  const [stars, sparks] = useMemo(() => {
    let seed = 912;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    return [
      new Float32Array(
        Array.from({ length: low ? 155 : 345 }, () => {
          const angle = random() * 2 * Math.PI;
          const y = 2 + random() * 18;
          const radius = Math.sqrt(21 ** 2 - y ** 2);
          return [radius * Math.cos(angle), y, radius * Math.sin(angle)];
        }).flat(),
      ),
      new Float32Array(
        Array.from({ length: low ? 14 : 36 }, (_, i) => [
          (i % 2 ? 1 : -1) * (4.6 + random() * 1.45),
          0.65 + random() * 1.5,
          (random() - 0.5) * 13,
        ]).flat(),
      ),
    ];
  }, [low]);
  useFrame(({ clock }) => {
    if (fireflies.current)
      fireflies.current.position.y = prefersReducedMotion()
        ? 0
        : Math.sin(clock.elapsedTime * 0.46) * 0.22;
  });
  return (
    <>
      <mesh>
        <sphereGeometry args={[22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#101c39" side={BackSide} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#dae6ff"
          size={0.071}
          toneMapped={false}
          onBeforeCompile={roundPoint}
        />
      </points>
      <points ref={fireflies}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparks, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffcd88"
          size={0.035}
          toneMapped={false}
          onBeforeCompile={roundPoint}
        />
      </points>
    </>
  );
}

function Envelope() {
  const flap = useRef<Group>(null);
  const glow = useRef<MeshStandardMaterial>(null);
  const started = useRef<number | null>(null);
  useFrame(({ clock }, delta) => {
    const { feature, nearLetter } = useMuseum.getState();
    const opening = feature === "envelope" || feature === "letter";
    const reduced = prefersReducedMotion();
    if (!flap.current || !glow.current) return;
    if (opening) started.current ??= clock.elapsedTime;
    else started.current = null;
    const progress =
      started.current === null
        ? 0
        : reduced
          ? 1
          : MathUtils.smoothstep(
              (clock.elapsedTime - started.current) * 1000,
              0,
              letterPedestal.openingMs,
            );
    flap.current.rotation.x = -Math.PI * 0.86 * progress;
    glow.current.emissiveIntensity = reduced
      ? Number(nearLetter) * 0.48
      : MathUtils.damp(
          glow.current.emissiveIntensity,
          nearLetter ? 0.48 : 0.035,
          6,
          delta,
        );
  });
  return (
    <group position={[0, 1.4, letterPedestal.z]} rotation={[-1.02, 0, 0]}>
      <mesh>
        <boxGeometry args={[0.75, 0.51, 0.045]} />
        <meshStandardMaterial
          ref={glow}
          color="#fff0d5"
          emissive="#ffb768"
          emissiveIntensity={0.035}
          roughness={0.76}
        />
      </mesh>
      <Box
        position={[0, -0.033, 0.026]}
        size={[0.58, 0.35, 0.014]}
        color="#fff7e7"
      />
      <group ref={flap} position={[0, 0.248, 0.04]}>
        <mesh>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[envelopeFlap, 3]}
            />
            <bufferAttribute
              attach="attributes-normal"
              args={[envelopeFlapNormals, 3]}
            />
          </bufferGeometry>
          <meshStandardMaterial
            color="#f5d6a5"
            roughness={0.78}
            side={DoubleSide}
          />
        </mesh>
        <mesh position={[0, -0.238, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.064, 0.066, 0.019, 16]} />
          <meshStandardMaterial color="#883246" roughness={0.42} />
        </mesh>
        <mesh position={[0, -0.238, 0.026]}>
          <circleGeometry args={[0.033, 12]} />
          <meshBasicMaterial color="#ba6365" />
        </mesh>
      </group>
    </group>
  );
}
const envelopeFlap = new Float32Array([
  -0.374, 0, 0, 0, -0.3, 0.01, 0.374, 0, 0,
]);
const flapNormal = Triangle.getNormal(
  new Vector3().fromArray(envelopeFlap, 0),
  new Vector3().fromArray(envelopeFlap, 3),
  new Vector3().fromArray(envelopeFlap, 6),
  new Vector3(),
).toArray();
const envelopeFlapNormals = new Float32Array([
  ...flapNormal,
  ...flapNormal,
  ...flapNormal,
]);

export function ForeverConservatory() {
  const marble = useLoader(TextureLoader, "/materials/white_marble-diffuse.webp");
  marble.colorSpace = SRGBColorSpace;
  const active = useMuseum((state) => state.currentRoom === "forever");
  return (
    <>
      {active && <NightGarden />}
      <Glass />
      <FloorContactShadows contacts={pedestalContact} />
      <Pieces pieces={stoneFraming} />
      <Pieces pieces={brassFraming} finish="metal" />
      <Pieces pieces={lights} emissive />
      <Garden />
      <SolidBox
        position={[0, 0.63, letterPedestal.z]}
        size={[1.12, 1.26, 1.04]}
        color="#e5e2df" map={marble}
      />
      <Box
        position={[0, 0.09, letterPedestal.z]}
        size={[1.31, 0.18, 1.19]}
        color="#e3dcd1" map={marble}
      />
      <Box
        position={[0, 1.23, letterPedestal.z]}
        size={[1.25, 0.13, 1.16]}
        color="#bf9c6d"
        metalness={0.48}
      />
      <Box
        position={[0, 1.32, letterPedestal.z]}
        size={[1.36, 0.1, 1.27]}
        color="#eee5da" map={marble}
      />
      <Envelope />
      <Box
        position={[0, 1.22, -7.83]}
        size={[14, 2.45, 0.23]}
        color="#303043" surface="plaster"
      />
      <Box
        position={[0, 2.43, -7.68]}
        size={[13.9, 0.13, 0.17]}
        color={brass}
      />
      <Label
        text="THE FOREVER ROOM ∞"
        position={[0, 3.32, -7.799]}
        size={[4.1, 0.53]}
        paper="#21243a"
        color="#f5d9a6"
      />
      {foreverQuotes.map(({ text }, index) => {
        const x = (index - 1) * 4.1;
        return (
          <group key={text} position={[x, 1.81, -7.68]}>
            <Box
              position={[0, 0, 0]}
              size={[3.94, 0.83, 0.115]}
              color={brass}
            />
            <Label
              text={`“${text}”`}
              position={[0, 0, 0.064]}
              size={[3.8, 0.68]}
              paper="#272238"
              color="#fff0d2"
            />
          </group>
        );
      })}
    </>
  );
}
