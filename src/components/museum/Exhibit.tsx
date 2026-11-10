import { useMemo, useEffect } from "react";
import {
  MeshStandardMaterial,
  CanvasTexture,
  SRGBColorSpace,
  type Texture,
} from "three";
import { beveledBox } from "./beveledGeometry";
import { surfaceTexture } from "./surfaceTextures";

const materials = new Map<string, MeshStandardMaterial>();
export function Box({
  position,
  size,
  color = "#e4dccb",
  metalness = 0,
  surface,
  map,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  metalness?: number;
  surface?: "wood" | "fabric" | "plaster";
  map?: Texture;
}) {
  const key = `${color}:${metalness}:${surface ?? "plain"}:${map?.uuid ?? "solid"}`;
  let material = materials.get(key);
  if (!material) {
    material = new MeshStandardMaterial({
      color,
      map,
      roughness: metalness ? 0.28 : surface === "wood" ? 0.36 : 0.86,
      bumpMap: surface ? surfaceTexture(surface) : null,
      bumpScale: surface === "plaster" ? 0.018 : 0.009,
      metalness,
    });
    materials.set(key, material);
  }
  return (
    <mesh
      position={position}
      geometry={beveledBox(size)}
      material={material}
      receiveShadow
      castShadow
      dispose={null}
    />
  );
}
export function Label({
  text,
  position,
  size = [3, 0.4] as [number, number],
  color = "#665846",
  paper = "#e8e0d1",
  emphasis = false,
}: {
  text: string;
  position: [number, number, number];
  size?: [number, number];
  color?: string;
  paper?: string;
  emphasis?: boolean;
}) {
  const [width, height] = size;
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = Math.ceil(Math.min(1536, Math.max(384, width * 256)) / 64) * 64;
    c.height = Math.max(64, Math.round((c.width * height) / width));
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let fontSize = Math.min(emphasis ? 256 : 90, c.height * 0.6);
    ctx.font = `${emphasis ? "bold " : ""}${fontSize}px Georgia`;
    while (ctx.measureText(text).width > c.width - 100 && fontSize > 18) {
      fontSize -= 2;
      ctx.font = `${emphasis ? "bold " : ""}${fontSize}px Georgia`;
    }
    let visible = text;
    if (ctx.measureText(visible).width > c.width - 60) {
      const letters = Array.from(text);
      while (
        letters.length &&
        ctx.measureText(`${letters.join("")}…`).width > c.width - 60
      )
        letters.pop();
      visible = `${letters.join("")}…`;
    }
    ctx.fillText(visible, c.width / 2, c.height / 2);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [text, color, paper, width, height, emphasis]);
  useEffect(() => {
    texture.needsUpdate = true;
    return () => texture.dispose();
  }, [texture]);
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        map={texture}
        alphaTest={paper === "transparent" ? 0.025 : 0}
      />
    </mesh>
  );
}
