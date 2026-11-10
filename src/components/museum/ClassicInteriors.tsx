import { CraftedSurfaces, type CraftedPiece } from "./CraftedSurfaces";
import { ReflectiveFloorMaterial } from "./ReflectiveFloorMaterial";
import type { RefObject } from "react";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useLoader } from "@react-three/fiber";
import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Float32BufferAttribute,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
} from "three";
import { createGalleryFurnishings, seatFootprint } from "../../content/galleryFurnishings";
import type { MuseumRoom } from "../../content/layout";
import { roomCenterZ } from "../../content/layout";
import { useMuseum } from "../../stores/museum";

type Trim = [
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  color: string,
];
type Contact = [x: number, z: number, width: number, depth: number];

const ivory = "#ded7ca";
const lightStone = "#e7e1d5";
const bronze = "#826747";
const dark = "#382e28";
const entranceCrown = 8.15;
const entranceSpring = 5.56;

function TrimBatch({ pieces }: { pieces: Trim[] }) {
  const groups = useMemo(() => {
    const plaster: CraftedPiece[] = [], metal: CraftedPiece[] = [], wood: CraftedPiece[] = [];
    pieces.forEach(([x, y, z, w, h, d, color]) => {
      const target = color === bronze ? metal : color === dark ? wood : plaster;
      target.push({ position: [x, y, z], size: [w, h, d], color });
    });
    return { plaster, metal, wood };
  }, [pieces]);
  return <>{Object.entries(groups).map(([finish, parts]) =>
    <CraftedSurfaces key={finish} pieces={parts} finish={finish as "plaster" | "metal" | "wood"} />)}</>;
}

function floorShadow() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 96;
  const context = canvas.getContext("2d")!;
  const shade = context.createRadialGradient(48, 48, 4, 48, 48, 47);
  shade.addColorStop(0, "#33281de0");
  shade.addColorStop(0.53, "#33281d64");
  shade.addColorStop(1, "#33281d00");
  context.fillStyle = shade;
  context.fillRect(0, 0, 96, 96);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  return map;
}
let shadowMap: CanvasTexture | undefined;

function FloorContacts({ contacts }: { contacts: Contact[] }) {
  const ref = useRef<InstancedMesh>(null);
  shadowMap ??= floorShadow();
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    const scale = new Matrix4();
    contacts.forEach(([x, z, w, d], i) => {
      matrix
        .makeRotationX(-Math.PI / 2)
        .multiply(scale.makeScale(w, d, 1))
        .setPosition(x, 0.005, z);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [contacts]);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, contacts.length]}
      renderOrder={1}
    >
      <planeGeometry />
      <meshBasicMaterial
        map={shadowMap}
        transparent
        opacity={0.63}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </instancedMesh>
  );
}

const stone = "/materials/white_marble-diffuse.webp";
const floors = {
  entrance: "/materials/floor_tiles_06",
  gallery: "/materials/herringbone_parquet",
};

function InteriorFloor({
  room,
  entrance,
}: {
  room: MuseumRoom;
  entrance: boolean;
}) {
  const floorRef = useRef<Mesh>(null);
  const high = useMuseum((state) => state.graphics !== "low");
  const source = entrance ? floors.entrance : floors.gallery;
  const map = useLoader(TextureLoader, `${source}-diffuse.webp`);
  const depth = room.maxZ - room.minZ;
  const tile = 3.4;
  map.wrapS = map.wrapT = RepeatWrapping;
  map.repeat.set((room.halfWidth * 2) / tile, depth / tile);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 4;
  const roughness = entrance ? 0.3 : 0.34;
  const color = entrance ? "#ffffff" : "#e0d6c8";
  const flat = (
    <FloorFinish map={map} color={color} roughness={roughness} floorId={room.id} floor={floorRef} />
  );
  return (
    <mesh
      ref={floorRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, roomCenterZ(room)]}
      receiveShadow
    >
      <planeGeometry args={[room.halfWidth * 2, depth]} />
      {high ? (
        <Suspense fallback={flat}>
          <ReliefFloor
            source={source}
            map={map}
            roughness={roughness}
            color={color}
            floor={floorRef}
            floorId={room.id}
          />
        </Suspense>
      ) : (
        flat
      )}
    </mesh>
  );
}

function ReliefFloor({
  source,
  map,
  roughness,
  color,
  floorId,
  floor,
}: {
  floor: RefObject<Mesh | null>;
  floorId: string;
  source: string;
  map: Texture;
  roughness: number;
  color: string;
}) {
  const normalMap = useLoader(TextureLoader, `${source}-nor_gl.webp`);
  normalMap.wrapS = normalMap.wrapT = RepeatWrapping;
  normalMap.repeat.copy(map.repeat);
  return (
    <FloorFinish map={map} color={color} normalMap={normalMap} roughness={roughness} floorId={floorId} floor={floor} />
  );
}

function FloorFinish({ map, normalMap, color, roughness, floorId, floor }: {
  floor: RefObject<Mesh | null>;
  floorId: string;
  map: Texture; normalMap?: Texture; color: string; roughness: number;
}) {
  const graphics = useMuseum(state => state.graphics);
  const room = useMuseum(state => state.currentRoom);
  // One active reflecting floor. The adjacent room uses the same physical
  // finish without another scene render. Balanced and Low use the light probe.
  const reflective = graphics === "high" && room === floorId;
  const props = { map, normalMap, color, roughness, normalScale: new Vector2(0.24, 0.24) };
  return reflective ? <ReflectiveFloorMaterial floor={floor} map={map} normalMap={normalMap} color={color} roughness={roughness} resolution={graphics === "high" ? 512 : 256} />
    : <meshStandardMaterial {...props} />;
}

const profile = [
  [0.39, 0],
  [0.39, 0.14],
  [0.35, 0.15],
  [0.35, 0.24],
  [0.3, 0.27],
  [0.3, 0.39],
  [0.263, 0.43],
  [0.267, 0.56],
  [0.254, 1.25],
  [0.231, 3.65],
  [0.219, 4.85],
  [0.244, 4.91],
  [0.243, 4.98],
  [0.3, 5.05],
  [0.334, 5.13],
  [0.35, 5.23],
  [0.39, 5.26],
  [0.39, 5.36],
];

function FlutedColumns({
  room,
  stations,
}: {
  room: MuseumRoom;
  stations: number[];
}) {
  const ref = useRef<InstancedMesh>(null);
  const graphics = useMuseum((state) => state.graphics);
  const marble = useLoader(TextureLoader, stone);
  marble.colorSpace = SRGBColorSpace;
  const geometry = useMemo(() => {
    const fluteCount = graphics === "high" ? 20 : 12;
    const shape = new LatheGeometry(
      profile.map(([r, y]) => new Vector2(r, y)),
      fluteCount * 4,
    );
    const positions = shape.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      if (y < 0.55 || y > 4.9) continue;
      const x = positions.getX(i),
        z = positions.getZ(i);
      const flute =
        1 - 0.063 * (0.5 + 0.5 * Math.cos(fluteCount * Math.atan2(x, z)));
      positions.setXYZ(i, x * flute, y, z * flute);
    }
    shape.computeVertexNormals();
    return shape;
  }, [graphics]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    let index = 0;
    for (const side of [-1, 1])
      for (const z of stations) {
        const height =
          room.id === "entrance" ? entranceSpring : room.height - 0.44;
        mesh.setMatrixAt(
          index++,
          matrix
            .makeScale(1, height / 5.36, 1)
            .setPosition(side * (room.halfWidth - 0.65), 0, z),
        );
      }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [geometry, room, stations]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, stations.length * 2]} castShadow receiveShadow>
      <meshStandardMaterial map={marble} color="#ece6db" roughness={0.43} />
    </instancedMesh>
  );
}

// The barrel vault and its masonry ribs use the same elliptical section.
function vaultStrip(
  width: number,
  from: number,
  to: number,
  spring: number,
  crown: number,
) {
  const points: number[] = [];
  const indices: number[] = [];
  const segments = 36;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI;
    const x = width * Math.cos(angle);
    const y = spring + (crown - spring) * Math.sin(angle);
    points.push(x, y, from, x, y, to);
    if (i < segments) {
      const j = 2 * i;
      indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function EntranceVault({
  room,
  stations,
}: {
  room: MuseumRoom;
  stations: number[];
}) {
  const shell = useMemo(
    () =>
      vaultStrip(
        room.halfWidth,
        room.minZ,
        room.maxZ,
        entranceSpring,
        entranceCrown,
      ),
    [room],
  );
  const rib = useMemo(
    () =>
      vaultStrip(
        room.halfWidth - 0.14,
        -0.13,
        0.13,
        entranceSpring - 0.025,
        entranceCrown - 0.18,
      ),
    [room],
  );
  const trim = useMemo(
    () =>
      vaultStrip(
        room.halfWidth - 0.2,
        -0.043,
        0.043,
        entranceSpring - 0.04,
        entranceCrown - 0.22,
      ),
    [room],
  );
  useEffect(() => {
    return () => {
      shell.dispose();
      rib.dispose();
      trim.dispose();
    };
  }, [shell, rib, trim]);
  return (
    <>
      <mesh geometry={shell}>
        <meshStandardMaterial
          side={DoubleSide}
          color="#b5a084"
          roughness={0.86}
        />
      </mesh>
      {stations.map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh geometry={rib}>
            <meshStandardMaterial
              side={DoubleSide}
              color="#d0bc9c"
              roughness={0.78}
            />
          </mesh>
          <mesh geometry={trim} position={[0, 0, 0.14]}>
            <meshStandardMaterial
              side={DoubleSide}
              color="#846748"
              roughness={0.69}
            />
          </mesh>
          <mesh geometry={trim} position={[0, 0, -0.14]}>
            <meshStandardMaterial
              side={DoubleSide}
              color="#846748"
              roughness={0.69}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function interiorDetails(
  room: MuseumRoom,
  entrance: boolean,
  stations: number[],
) {
  const pieces: Trim[] = [];
  const depth = room.maxZ - room.minZ;
  const middle = roomCenterZ(room);
  for (const side of [-1, 1]) {
    const edge = side * room.halfWidth;
    // Plinth, dado, cornice and a narrow floor inlay.
    pieces.push(
      [
        edge,
        room.height / 2,
        middle,
        0.08,
        room.height,
        depth,
        entrance ? "#d6cdbc" : "#c4c0b1",
      ],
      [edge - side * 0.052, 0.14, middle, 0.125, 0.28, depth, dark],
      [edge - side * 0.05, 0.31, middle, 0.14, 0.07, depth, lightStone],
      [
        edge - side * 0.018,
        0.62,
        middle,
        0.095,
        0.62,
        depth,
        entrance ? "#a99a83" : "#676c61",
      ],
      [edge - side * 0.052, 0.96, middle, 0.125, 0.055, depth, bronze],
      [edge - side * 0.12, 5.5, middle, 0.31, 0.2, depth, ivory],
      [edge - side * 0.1, 5.37, middle, 0.29, 0.065, depth, bronze],
      [
        edge - side * 0.52,
        0.001,
        middle,
        0.93,
        0.002,
        depth,
        entrance ? "#534238" : "#534031",
      ],
      [edge - side * 1.03, 0.0012, middle, 0.027, 0.002, depth, "#a6855a"],
    );
    for (let i = 0; i < stations.length - 1; i++) {
      const z = (stations[i] + stations[i + 1]) / 2;
      const panelWidth = stations[i + 1] - stations[i] - 0.35;
      pieces.push(
        [
          edge - side * 0.039,
          3.18,
          z,
          0.033,
          3.94,
          panelWidth,
          entrance ? "#dfd5c4" : "#ded9cc",
        ],
        [edge - side * 0.076, 1.19, z, 0.063, 0.042, panelWidth, ivory],
        [edge - side * 0.076, 5.16, z, 0.063, 0.045, panelWidth, ivory],
      );
      for (const border of [-1, 1])
        pieces.push([
          edge - side * 0.076,
          3.18,
          z + (border * panelWidth) / 2,
          0.062,
          3.98,
          0.043,
          ivory,
        ]);
    }
  }
  for (const z of stations) {
    for (const side of [-1, 1]) {
      const x = side * (room.halfWidth - 0.65);
      pieces.push(
        [x, 0.075, z, 0.8, 0.15, 0.8, dark],
        [x, 0.168, z, 0.75, 0.045, 0.75, lightStone],
        [x, 5.47, z, 0.79, 0.12, 0.78, ivory],
        [x, 5.54, z, 0.86, 0.049, 0.84, lightStone],
      );
    }
  }
  if (!entrance) {
    // Recessed plaster coffers with continuous rails.
    pieces.push([0, 6.07, middle, room.halfWidth * 2, 0.14, depth, "#393831"]);
    for (const z of stations) {
      pieces.push(
        [0, 5.77, z, 13.8, 0.26, 0.26, dark],
        [0, 5.61, z, 13.8, 0.065, 0.35, bronze],
      );
    }
    for (const x of [-4.35, 0, 4.35]) {
      pieces.push(
        [x, 5.84, middle, 0.28, 0.19, depth, dark],
        [x, 5.73, middle, 0.32, 0.056, depth, bronze],
      );
    }
  }
  return pieces;
}

let washMap: CanvasTexture | undefined;

function GalleryLightWash({ stations }: { stations: number[] }) {
  const ref = useRef<InstancedMesh>(null);
  if (!washMap) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 96;
    const context = canvas.getContext("2d")!;
    const glow = context.createRadialGradient(48, 48, 1, 48, 48, 47);
    glow.addColorStop(0, "#f8e7bd9e");
    glow.addColorStop(0.52, "#f8e7bd50");
    glow.addColorStop(1, "#f8e7bd00");
    context.fillStyle = glow;
    context.fillRect(0, 0, 96, 96);
    washMap = new CanvasTexture(canvas);
    washMap.colorSpace = SRGBColorSpace;
  }
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    const scale = new Matrix4().makeScale(3.5, 3.96, 1);
    let index = 0;
    for (const side of [-1, 1])
      for (let i = 0; i < stations.length - 1; i++) {
        matrix
          .makeRotationY((-side * Math.PI) / 2)
          .multiply(scale)
          .setPosition(side * 6.925, 3.22, (stations[i] + stations[i + 1]) / 2);
        mesh.setMatrixAt(index++, matrix);
      }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [stations]);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, (stations.length - 1) * 2]}
    >
      <planeGeometry />
      <meshBasicMaterial
        map={washMap}
        transparent
        opacity={0.32}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

function PictureRail({ stations }: { stations: number[] }) {
  const housing = useRef<InstancedMesh>(null);
  const lenses = useRef<InstancedMesh>(null);
  const count = (stations.length - 1) * 2;
  useLayoutEffect(() => {
    if (!housing.current || !lenses.current) return;
    const matrix = new Matrix4();
    const lens = new Matrix4()
      .makeRotationX(Math.PI / 2)
      .setPosition(0, -0.116, 0);
    const bulb = new Matrix4();
    let index = 0;
    for (const side of [-1, 1])
      for (let i = 0; i < stations.length - 1; i++) {
        matrix
          .makeRotationZ(side * -0.37)
          .setPosition(side * 5.62, 5.52, (stations[i] + stations[i + 1]) / 2);
        housing.current.setMatrixAt(index, matrix);
        lenses.current.setMatrixAt(index++, bulb.copy(matrix).multiply(lens));
      }
    for (const mesh of [housing.current, lenses.current]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [stations]);
  return (
    <>
      <instancedMesh ref={housing} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.085, 0.1, 0.22, 12]} />
        <meshStandardMaterial color="#39332d" roughness={0.58} />
      </instancedMesh>
      <instancedMesh ref={lenses} args={[undefined, undefined, count]}>
        <circleGeometry args={[0.081, 12]} />
        <meshBasicMaterial color="#fce2ad" toneMapped={false} />
      </instancedMesh>
    </>
  );
}

function Pendant({ z }: { z: number }) {
  return (
    <group position={[0, 5.56, z]}>
      <mesh position={[0, 1.16, 0]}>
        <cylinderGeometry args={[0.027, 0.03, 2.35, 12]} />
        <meshStandardMaterial
          color="#8c6a46"
          metalness={0.46}
          roughness={0.43}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.57, 0.039, 8, 48]} />
        <meshStandardMaterial
          color="#a58457"
          metalness={0.45}
          roughness={0.38}
        />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI) / 3;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.53, 0.13, Math.sin(a) * 0.53]}
          >
            <cylinderGeometry args={[0.05, 0.064, 0.27, 12]} />
            <meshStandardMaterial
              emissive="#ffd09a"
              emissiveIntensity={1.1}
              color="#e6c198"
              roughness={0.56}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function ClassicInteriors({ room }: { room: MuseumRoom }) {
  const entrance = room.id === "entrance";
  const stations = useMemo(
    () =>
      Array.from(
        { length: Math.floor((room.maxZ - room.minZ) / 4) },
        (_, i) => room.minZ + 2 + i * 4,
      ),
    [room],
  );
  const pieces = useMemo(
    () => interiorDetails(room, entrance, stations),
    [room, entrance, stations],
  );
  const contacts = useMemo<Contact[]>(() => {
    const columnShadows: Contact[] = stations.flatMap((z) =>
      [-1, 1].map(
        (side): Contact => [side * (room.halfWidth - 0.65), z, 1.46, 1.6],
      ),
    );
    if (entrance) return [...columnShadows, [-4, 15, 1.85, 1.85], [4, 15, 1.85, 1.85]];
    const layout = createGalleryFurnishings(room);
    return [
      ...columnShadows,
      ...layout.cases.map(([x, , z]): Contact => [x, z, 2.7, 1.65]),
      ...layout.seats.map(seat => {
        const footprint = seatFootprint(seat);
        return [seat.position[0], seat.position[2], footprint.halfX * 2 + 0.5, footprint.halfZ * 2 + 0.5] as Contact;
      }),
    ];
  }, [room, entrance, stations]);
  return (
    <>
      <InteriorFloor room={room} entrance={entrance} />
      <TrimBatch pieces={pieces} />
      <FlutedColumns room={room} stations={stations} />
      <FloorContacts contacts={contacts} />
      {entrance ? (
        <>
          <EntranceVault room={room} stations={stations} />
          <Pendant z={15.75} />
          <Pendant z={20.5} />
        </>
      ) : (
        <>
          <GalleryLightWash stations={stations} />
          <PictureRail stations={stations} />
        </>
      )}
    </>
  );
}
