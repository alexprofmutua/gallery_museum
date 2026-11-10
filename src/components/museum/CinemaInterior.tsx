import { CraftedSurfaces } from "./CraftedSurfaces";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import {
  CanvasTexture,
  Color,
  Euler,
  InstancedMesh,
  Matrix4,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { surfaceTexture } from "./surfaceTextures";
import { cinemaSeats } from "../../content/layout";
import { FloorContactShadows } from "./FloorContactShadows";
import { GalaxyCeiling, ProjectionScreen } from "./CinematicRooms";

type Piece = {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  tilt?: number;
};

function SurfaceBatch({
  pieces,
  padded = false,
  luminous = false,
  finish = "wood",
}: {
  pieces: Piece[];
  padded?: boolean;
  luminous?: boolean;
  finish?: "wood" | "metal" | "fabric";
}) {
  const ref = useRef<InstancedMesh>(null);
  const cushion = useMemo(
    () => (padded ? new RoundedBoxGeometry(1, 1, 1, 2, 0.14) : null),
    [padded],
  );
  useEffect(() => () => cushion?.dispose(), [cushion]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    const position = new Vector3();
    const scale = new Vector3();
    const rotation = new Quaternion();
    const euler = new Euler();
    const color = new Color();
    pieces.forEach((part, i) => {
      rotation.setFromEuler(euler.set(0, 0, part.tilt ?? 0));
      matrix.compose(
        position.set(...part.position),
        rotation,
        scale.set(...part.size),
      );
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, color.set(part.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [pieces, padded, luminous, finish]);
  const rigidPieces = useMemo(() => pieces.map(piece => ({
    ...piece, rotation: [0, 0, piece.tilt ?? 0] as [number, number, number],
  })), [pieces]);
  if (!padded && !luminous && finish !== "fabric")
    return <CraftedSurfaces pieces={rigidPieces} finish={finish} />;
  return (
    <instancedMesh
      ref={ref}
      args={[cushion ?? undefined, undefined, pieces.length]}
      castShadow receiveShadow
    >
      {!cushion && <boxGeometry />}
      {luminous ? (
        <meshBasicMaterial toneMapped={false} />
      ) : (
        <meshStandardMaterial
          metalness={finish === "metal" ? 0.5 : 0}
          roughness={padded || finish === "fabric" ? 0.96 : finish === "metal" ? 0.36 : 0.58}
          bumpMap={finish === "metal" ? undefined : surfaceTexture(padded || finish === "fabric" ? "fabric" : "wood")}
          bumpScale={padded || finish === "fabric" ? 0.007 : 0.005}
        />
      )}
    </instancedMesh>
  );
}

const walnut = "#302125";
const bronze = "#9a6d45";
const walls: Piece[] = [];
const lights: Piece[] = [];
const sconces: Array<{ side: number; z: number }> = [];

for (const side of [-1, 1]) {
  walls.push(
    { position: [side * 7.09, 2.5, 0], size: [0.18, 5, 16], color: "#663e42" },
    { position: [side * 6.96, 0.62, 0], size: [0.12, 1.16, 16], color: walnut },
    { position: [side * 6.88, 1.2, 0], size: [0.2, 0.1, 16], color: bronze },
    { position: [side * 6.87, 4.73, 0], size: [0.24, 0.18, 16], color: walnut },
    { position: [side * 6.77, 4.61, 0], size: [0.12, 0.07, 16], color: bronze },
    { position: [side * 6.42, 4.91, 0], size: [0.1, 0.09, 16], color: bronze },
    {
      position: [side * 1.23, 0.009, 0],
      size: [0.07, 0.016, 15.5],
      color: "#744a47",
    },
  );
  lights.push({
    position: [side * 6.62, 4.79, 0],
    size: [0.028, 0.026, 15.7],
    color: "#b58555",
  });
  for (const z of [-6.5, -4.5, -2.5, -0.5, 1.5, 3.5, 5.5, 7.1]) {
    lights.push({
      position: [side * 1.23, 0.022, z],
      size: [0.068, 0.012, 0.38],
      color: "#c38c5a",
    });
  }
  for (const z of side > 0 ? [-6, -2, 2, 6] : [-6.25, 6.25]) {
    sconces.push({ side, z });
    walls.push(
      {
        position: [side * 6.95, 2.91, z],
        size: [0.1, 3.12, 2.62],
        color: bronze,
      },
      {
        position: [side * 6.88, 2.91, z],
        size: [0.08, 2.98, 2.46],
        color: "#743e46",
      },
    );
    if (side > 0) {
      // The right pilasters match the existing room-shell column colliders.
      walls.push(
        { position: [6.36, 2.5, z], size: [0.76, 5, 0.77], color: walnut },
        {
          position: [5.965, 2.64, z],
          size: [0.04, 3.91, 0.57],
          color: "#704748",
        },
        {
          position: [6.32, 0.13, z],
          size: [0.86, 0.26, 0.87],
          color: "#2d2024",
        },
        { position: [6.32, 4.68, z], size: [0.87, 0.17, 0.86], color: bronze },
      );
    }
    const x = side === 1 ? 5.92 : -6.79;
    walls.push(
      { position: [x, 2.82, z], size: [0.1, 0.65, 0.34], color: "#362329" },
      {
        position: [x - side * 0.1, 2.57, z],
        size: [0.18, 0.07, 0.28],
        color: bronze,
      },
      {
        position: [x - side * 0.1, 3.08, z],
        size: [0.18, 0.07, 0.28],
        color: bronze,
      },
    );
    lights.push({
      position: [x - side * 0.12, 2.82, z],
      size: [0.15, 0.43, 0.15],
      color: "#f7ca8d",
    });
  }
  for (const z of [-7.57, 7.57]) {
    const inward = -Math.sign(z);
    if (side === 1) {
      walls.push({
        position: [0, 4.81, z],
        size: [13.83, 0.18, 0.18],
        color: walnut,
      });
    }
    walls.push(
      {
        position: [side * 4.82, 0.67, z],
        size: [4.06, 1.24, 0.14],
        color: walnut,
      },
      {
        position: [side * 4.82, 1.31, z],
        size: [4.06, 0.075, 0.19],
        color: bronze,
      },
      {
        position: [side * 4.82, 3.04, z],
        size: [3.7, 2.91, 0.12],
        color: bronze,
      },
      {
        position: [side * 4.82, 3.04, z + inward * 0.069],
        size: [3.54, 2.74, 0.052],
        color: "#6f4146",
      },
      {
        position: [side * 2.88, 2.82, z + inward * 0.11],
        size: [0.33, 0.65, 0.13],
        color: bronze,
      },
    );
    lights.push({
      position: [side * 2.88, 2.82, z + inward * 0.22],
      size: [0.14, 0.43, 0.16],
      color: "#f7ca8d",
    });
    for (const offset of [-1.38, 1.38]) {
      walls.push({
        position: [side * 4.82 + offset, 3.04, z + inward * 0.106],
        size: [0.025, 2.34, 0.021],
        color: bronze,
      });
    }
  }
}

const woodWalls = walls.filter(({ color }) => color === walnut || color === "#362329" || color === "#2d2024");
const metalWalls = walls.filter(({ color }) => color === bronze);
const acousticWalls = walls.filter(part => !woodWalls.includes(part) && !metalWalls.includes(part));
const seatContacts = cinemaSeats.map(([x, z]) => [x, z, 1.7, 1.8] as const);

const cushions: Piece[] = [];
const bases: Piece[] = [];
for (const [x, z] of cinemaSeats) {
  bases.push({
    position: [x, 0.19, z],
    size: [1.13, 0.37, 1.18],
    color: "#35252a",
  });
  cushions.push(
    {
      position: [x - 0.13, 0.55, z],
      size: [1.04, 0.32, 1.17],
      color: "#71394d",
    },
    {
      position: [x + 0.42, 0.99, z],
      size: [0.34, 1.2, 1.17],
      color: "#5a283d",
      tilt: -0.17,
    },
    {
      position: [x + 0.35, 1.47, z],
      size: [0.39, 0.33, 0.99],
      color: "#7e4154",
      tilt: -0.17,
    },
    {
      position: [x - 0.04, 0.81, z - 0.62],
      size: [1.07, 0.23, 0.18],
      color: "#432233",
    },
    {
      position: [x - 0.04, 0.81, z + 0.62],
      size: [1.07, 0.23, 0.18],
      color: "#692b3f",
    },
  );
  // Small metallic seams articulate the chairs without adding per-seat meshes.
  bases.push(
    { position: [x - 0.62, 0.48, z - 0.59], size: [0.04, 0.04, 0.08], color: "#c69b66" },
    { position: [x - 0.62, 0.48, z + 0.59], size: [0.04, 0.04, 0.08], color: "#c69b66" },
  );
}

function carpetMap() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(128, 128);
  let seed = 2344;
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const fiber = ((seed >>> 25) % 13) - 6;
      const weave = (x + 2 * y) % 4 === 0 ? 4 : 0;
      const i = 4 * (y * 128 + x);
      pixels.data.set(
        [80 + fiber + weave, 45 + fiber + weave, 55 + fiber + weave, 255],
        i,
      );
    }
  ctx.putImageData(pixels, 0, 0);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;
  map.repeat.set(9, 10);
  return map;
}

function sconceMap() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const light = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
  light.addColorStop(0, "#f2ae7077");
  light.addColorStop(0.43, "#e49b4f35");
  light.addColorStop(1, "#e49b4f00");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function CinemaShell() {
  const carpet = useMemo(carpetMap, []);
  const wash = useMemo(sconceMap, []);
  const wallWashes = useRef<InstancedMesh>(null);
  useEffect(
    () => () => {
      carpet.dispose();
      wash.dispose();
    },
    [carpet, wash],
  );
  useLayoutEffect(() => {
    const mesh = wallWashes.current;
    if (!mesh) return;
    const transform = new Matrix4();
    const scale = new Matrix4().makeScale(2.17, 2.95, 1);
    sconces.forEach(({ side, z }, i) => {
      transform
        .makeRotationY((-side * Math.PI) / 2)
        .multiply(scale)
        .setPosition(side * 6.825, 2.95, z);
      mesh.setMatrixAt(i, transform);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 16]} />
        <meshStandardMaterial map={carpet} roughness={0.98} bumpMap={surfaceTexture("fabric")} bumpScale={0.008} />
      </mesh>
      <SurfaceBatch pieces={woodWalls} />
      <SurfaceBatch pieces={metalWalls} finish="metal" />
      <SurfaceBatch pieces={acousticWalls} finish="fabric" />
      <SurfaceBatch pieces={lights} luminous />
      <instancedMesh
        ref={wallWashes}
        args={[undefined, undefined, sconces.length]}
      >
        <planeGeometry />
        <meshBasicMaterial map={wash} transparent depthWrite={false} />
      </instancedMesh>
    </>
  );
}

export function CinemaFurnishings({
  video,
}: {
  video: HTMLVideoElement | null;
}) {
  return (
    <>
      <FloorContactShadows contacts={seatContacts} />
      <GalaxyCeiling />
      <ProjectionScreen video={video} />
      <SurfaceBatch pieces={bases} />
      <SurfaceBatch pieces={cushions} padded />
      <RigidBody type="fixed" colliders={false}>
        {cinemaSeats.map(([x, z]) => (
          <CuboidCollider
            key={`${x},${z}`}
            args={[0.69, 0.81, 0.71]}
            position={[x, 0.81, z]}
          />
        ))}
      </RigidBody>
    </>
  );
}
