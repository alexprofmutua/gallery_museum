import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  TextureLoader,
  Shape,
  SRGBColorSpace,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { corridorBays, corridorRoom, roomCenterZ } from "../../content/layout";
import { stoneFloorTexture, surfaceTexture } from "./surfaceTextures";
import { beveledBox } from "./beveledGeometry";
import { Box } from "./Exhibit";

const center = roomCenterZ(corridorRoom);
const depth = corridorRoom.maxZ - corridorRoom.minZ;
const spring = 2.56;
const gold = "#aa793f";
const cream = "#e0d5c8";

function rib(inner: number, outer: number, thickness: number) {
  const arch = new Shape();
  arch.moveTo(outer, 0);
  arch.absarc(0, 0, outer, 0, Math.PI, false);
  arch.lineTo(-inner, 0);
  arch.absarc(0, 0, inner, Math.PI, 0, true);
  arch.closePath();
  return new ExtrudeGeometry(arch, {
    steps: 1,
    depth: thickness,
    bevelEnabled: true,
    bevelSize: 0.009,
    bevelThickness: 0.009,
    bevelSegments: 2,
    curveSegments: 28,
  }).translate(0, spring, -thickness / 2);
}

function mergedDetails() {
  const solids: BufferGeometry[] = [];
  const lamps: BufferGeometry[] = [];
  const metals: BufferGeometry[] = [];
  const add = (
    geometry: BufferGeometry,
    paint: string,
    x: number,
    y: number,
    z: number,
    target = solids,
  ) => {
    const piece = geometry.index ? geometry.toNonIndexed() : geometry;
    if (piece !== geometry) geometry.dispose();
    piece.translate(x, y, z);
    const color = new Color(paint);
    const colors = new Float32Array(piece.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) color.toArray(colors, i);
    piece.setAttribute("color", new BufferAttribute(colors, 3));
    const destination = target === solids && (paint === gold || paint === "#ead0ab") ? metals : target;
    destination.push(piece);
  };
  for (const side of [-1, 1]) {
    for (const [y, width, height, paint] of [
      [0.18, 0.16, 0.36, "#372443"],
      [0.41, 0.19, 0.09, gold],
      [1.01, 0.1, 0.08, "#865a47"],
      [2.57, 0.22, 0.14, cream],
      [2.68, 0.12, 0.045, gold],
    ] as const)
      add(beveledBox([width, height, depth], 0.012).clone(), paint, side * 2.96, y, center);
    for (const x of [0.71, 0.82, 2.45]) {
      add(
        beveledBox([x === 0.82 ? 0.065 : 0.022, 0.004, depth], 0.012).clone(),
        x === 0.82 ? "#63506d" : gold,
        x * side,
        0.004,
        center,
      );
    }
  }
  for (const z of [
    corridorRoom.minZ + 0.36,
    ...corridorBays,
    corridorRoom.maxZ - 0.36,
  ]) {
    add(rib(2.67, 3.02, 0.22), cream, 0, 0, z);
    add(rib(2.665, 2.708, 0.27), gold, 0, 0, z);
    add(rib(2.79, 2.825, 0.25), "#ead0ab", 0, 0, z);
    for (const side of [-1, 1]) {
      const x = side * 2.81;
      add(beveledBox([0.46, 0.23, 0.58], 0.012).clone(), "#ac8c86", x, 0.12, z);
      add(new CylinderGeometry(0.15, 0.2, 2.06, 12), cream, x, 1.29, z);
      add(new CylinderGeometry(0.205, 0.17, 0.12, 12), gold, x, 2.34, z);
      add(beveledBox([0.45, 0.16, 0.51], 0.012).clone(), cream, x, 2.48, z);
      add(
        beveledBox([0.05, 0.52, 0.23], 0.012).clone(),
        "#58354b",
        side * 2.96,
        2.07,
        z + 0.62,
      );
      add(beveledBox([0.28, 0.06, 0.26], 0.012).clone(), gold, side * 2.83, 1.95, z + 0.62);
      add(
        new CylinderGeometry(0.067, 0.052, 0.26, 8),
        "#ffe4af",
        side * 2.78,
        2.09,
        z + 0.62,
        lamps,
      );
    }
  }
  const structure = mergeGeometries(solids);
  const candles = mergeGeometries(lamps);
  const brass = mergeGeometries(metals);
  [...solids, ...lamps, ...metals].forEach((geometry) => geometry.dispose());
  return { structure, candles, brass };
}

function candleWash() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const glow = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
  glow.addColorStop(0, "#ffb66c72");
  glow.addColorStop(0.36, "#f4a05739");
  glow.addColorStop(1, "#f4a05700");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  return map;
}

export function RoyalCorridorShell() {
  const details = useMemo(mergedDetails, []);
  const marble = useLoader(TextureLoader, "/materials/white_marble-diffuse.webp");
  const floor = useMemo(() => stoneFloorTexture(marble, 6, depth), [marble]);
  const wash = useMemo(candleWash, []);
  useEffect(
    () => () => {
      details.structure.dispose();
      details.candles.dispose();
      details.brass.dispose();
      floor.dispose();
      wash.dispose();
    },
    [details, floor, wash],
  );
  return (
    <>
      <mesh position={[0, spring, center]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry
          args={[3, 3, depth, 40, 1, true, -Math.PI / 2, Math.PI]}
        />
        <meshStandardMaterial side={BackSide} color="#463e51" roughness={0.92} bumpMap={surfaceTexture("plaster")} bumpScale={0.018} />
      </mesh>
      <mesh position={[0, 0, center]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, depth]} />
        <meshStandardMaterial map={floor} color="#d8d5dc" roughness={0.3} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            position={[side * 3.1, 1.29, center]}
            size={[0.2, 2.58, depth]}
            color="#433b50" surface="plaster"
          />
          <Box
            position={[side * 3.004, 0.7, center]}
            size={[0.04, 1.14, depth]}
            color="#2e2939" surface="wood"
          />
          {corridorBays.map((z) => (
            <mesh
              key={z}
              position={[side * 2.974, 2.19, z + 0.62]}
              rotation={[0, (-side * Math.PI) / 2, 0]}
            >
              <planeGeometry args={[1.48, 1.95]} />
              <meshBasicMaterial
                map={wash}
                opacity={0.65}
                transparent
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      ))}
      <mesh geometry={details.structure} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.78} bumpMap={surfaceTexture("plaster")} bumpScale={0.012} />
      </mesh>
      <mesh geometry={details.brass} castShadow receiveShadow>
        <meshStandardMaterial vertexColors metalness={0.65} roughness={0.28} />
      </mesh>
      <mesh geometry={details.candles}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>
    </>
  );
}
