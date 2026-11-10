import { useEffect, useMemo } from "react";
import { Color, Euler, Float32BufferAttribute, Matrix4, Quaternion, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { beveledBox } from "./beveledGeometry";
import { surfaceTexture } from "./surfaceTextures";

export type CraftedPiece = {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  rotation?: [number, number, number];
};

/** One draw per finish, with correctly sized edge profiles and vertex colours. */
export function CraftedSurfaces({ pieces, finish = "plaster" }: {
  pieces: CraftedPiece[];
  finish?: "plaster" | "wood" | "metal" | "stone";
}) {
  const geometry = useMemo(() => {
    if (!pieces.length) return null;
    const matrix = new Matrix4(), rotation = new Quaternion(), position = new Vector3();
    const tint = new Color(), unit = new Vector3(1, 1, 1);
    const parts = pieces.map(piece => {
      const part = beveledBox(piece.size, finish === "stone" ? 0.025 : 0.012).clone();
      matrix.compose(position.set(...piece.position), rotation.setFromEuler(new Euler(...(piece.rotation ?? [0, 0, 0]))), unit);
      part.applyMatrix4(matrix);
      tint.set(piece.color);
      const colors = new Float32Array(part.getAttribute("position").count * 3);
      for (let i = 0; i < colors.length; i += 3) tint.toArray(colors, i);
      part.setAttribute("color", new Float32BufferAttribute(colors, 3));
      return part;
    });
    const merged = mergeGeometries(parts);
    parts.forEach(part => part.dispose());
    merged?.computeBoundingSphere();
    return merged;
  }, [pieces, finish]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return <mesh geometry={geometry} castShadow receiveShadow>
    <meshStandardMaterial vertexColors metalness={finish === "metal" ? 0.65 : 0}
      roughness={finish === "metal" ? 0.28 : finish === "wood" ? 0.38 : finish === "stone" ? 0.42 : 0.84}
      bumpMap={finish === "metal" ? undefined : surfaceTexture(finish === "wood" ? "wood" : "plaster")}
      bumpScale={finish === "plaster" ? 0.009 : 0.004} />
  </mesh>;
}
