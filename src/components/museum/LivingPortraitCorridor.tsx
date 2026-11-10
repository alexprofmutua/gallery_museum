import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  TextureLoader,
  VideoTexture,
} from "three";
import type { Texture } from "three";
import { corridorBays } from "../../content/layout";
import { placedPortraits } from "../../content/portraits";
import type { PlacedPortrait } from "../../content/portraits";
import { prefersReducedMotion } from "../../engine/motion";
import { usePortraitVisit } from "../../stores/portraitVisit";
import { Box, Label } from "./Exhibit";
import { Motes } from "./CinematicRooms";
import { museum } from "../../content/museum";
import { GalleryExhibits } from "./GalleryExhibits";

const margin = 0.14;

function frameFace({ portrait, width }: PlacedPortrait) {
  const height = width / portrait.aspectRatio;
  const pixels = 240;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil((width + 2 * margin) * pixels);
  canvas.height = Math.ceil((height + 2 * margin) * pixels);
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;
  const rail = margin * pixels;
  const gilding = ctx.createLinearGradient(0, 0, w, h);
  gilding.addColorStop(0, "#f9da8c");
  gilding.addColorStop(
    0.35,
    portrait.frameStyle === "antique" ? "#996038" : "#aa733b",
  );
  gilding.addColorStop(0.63, "#edc37a");
  gilding.addColorStop(1, "#80502d");
  ctx.fillStyle = gilding;
  ctx.fillRect(0, 0, w, h);
  for (const [inset, paint, lineWidth] of [
    [2, "#4a2d30", 4],
    [8, "#fae0a4", 2],
    [13, "#79502e", 1],
    [rail - 6, "#754a2e", 2],
    [rail - 2, "#f6d89b", 2],
  ] as const) {
    ctx.strokeStyle = paint;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(inset, inset, w - 2 * inset, h - 2 * inset);
  }
  const jewel = (x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#784c37";
    ctx.fillRect(-5, -5, 10, 10);
    ctx.strokeStyle = "#ffe5aa";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-4, -4, 8, 8);
    ctx.restore();
  };
  for (let x = 20; x < w - 14; x += 19) {
    jewel(x, rail / 2);
    jewel(x, h - rail / 2);
  }
  for (let y = 39; y < h - 24; y += 19) {
    jewel(rail / 2, y);
    jewel(w - rail / 2, y);
  }
  ctx.fillStyle = "#272033";
  ctx.fillRect(rail, rail, w - 2 * rail, h - 2 * rail);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  return map;
}

function MovingImage({
  video,
  width,
  height,
}: {
  video: HTMLVideoElement;
  width: number;
  height: number;
}) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<MeshBasicMaterial>(null);
  const age = useRef(0);
  useEffect(() => {
    const surface = material.current;
    if (!surface) return;
    const map = new VideoTexture(video);
    map.colorSpace = SRGBColorSpace;
    surface.map = map;
    surface.needsUpdate = true;
    return () => {
      surface.map = null;
      map.dispose();
    };
  }, [video]);
  useFrame((_, delta) => {
    if (!mesh.current || !material.current || video.readyState < 2) return;
    const aspect = video.videoWidth / video.videoHeight;
    if (!Number.isFinite(aspect) || aspect <= 0) return;
    mesh.current.scale.set(
      Math.min(width, height * aspect),
      Math.min(height, width / aspect),
      1,
    );
    age.current += delta;
    const remaining = video.duration - video.currentTime;
    // Fade to the still just before the end without delaying media cleanup.
    material.current.opacity = prefersReducedMotion()
      ? 1
      : Math.min(
          1,
          age.current / 0.28,
          Number.isFinite(remaining) ? Math.max(0, remaining / 0.32) : 1,
        );
    mesh.current.visible = true;
  });
  return (
    <mesh ref={mesh} position={[0, 0, 0.077]} visible={false}>
      <planeGeometry />
      <meshBasicMaterial
        ref={material}
        toneMapped={false}
        transparent
        depthWrite={false}
        opacity={0}
      />
    </mesh>
  );
}

function PortraitFrame({ placement }: { placement: PlacedPortrait }) {
  const { portrait, x, y, z, side, width } = placement;
  const height = width / portrait.aspectRatio;
  const selected = usePortraitVisit((state) => state.nearby === portrait.id);
  const video = usePortraitVisit((state) =>
    state.session?.portrait.id === portrait.id ? state.session.video : null,
  );
  const face = useMemo(() => frameFace(placement), [placement]);
  const [thumbnail, setThumbnail] = useState<{
    map: Texture;
    aspect: number;
  } | null>(null);
  const highlight = useRef<MeshBasicMaterial>(null);
  const activeAge = useRef(0);
  useEffect(() => () => face.dispose(), [face]);
  useEffect(() => {
    let current = true;
    const map = new TextureLoader().load(
      portrait.thumbnail,
      (loaded) => {
        if (!current) return;
        loaded.colorSpace = SRGBColorSpace;
        setThumbnail({
          map: loaded,
          aspect: loaded.image.width / loaded.image.height,
        });
      },
      undefined,
      () => map.dispose(),
    );
    return () => {
      current = false;
      map.dispose();
    };
  }, [portrait.thumbnail]);
  useFrame((_, delta) => {
    if (!highlight.current) return;
    activeAge.current = video ? activeAge.current + delta : 0;
    const reduced = prefersReducedMotion();
    const shimmer =
      video && !reduced ? Math.max(0, 1 - activeAge.current / 0.6) * 0.42 : 0;
    const target = (selected ? 0.56 : 0.16) + shimmer;
    highlight.current.opacity = reduced
      ? target
      : MathUtils.damp(highlight.current.opacity, target, 8, delta);
  });
  return (
    <group position={[x, y, z]} rotation={[0, (-side * Math.PI) / 2, 0]}>
      <Box
        position={[0, 0, 0]}
        size={[width + 0.35, height + 0.35, 0.12]}
        color="#6f4737"
      />
      <mesh position={[0, 0, 0.061]}>
        <planeGeometry args={[width + 2 * margin, height + 2 * margin]} />
        <meshBasicMaterial map={face} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.071]}>
        <planeGeometry args={[width + 0.32, height + 0.32]} />
        <meshBasicMaterial
          ref={highlight}
          color="#d3a35f"
          transparent
          depthWrite={false}
        />
      </mesh>
      {thumbnail && (
        <mesh position={[0, 0, 0.074]}>
          <planeGeometry
            args={[
              Math.min(width, height * thumbnail.aspect),
              Math.min(height, width / thumbnail.aspect),
            ]}
          />
          <meshBasicMaterial map={thumbnail.map} toneMapped={false} />
        </mesh>
      )}
      {video && <MovingImage video={video} width={width} height={height} />}
    </group>
  );
}

export function LivingPortraitCorridor() {
  return (
    <>
      {museum.memories.some((memory) => memory.roomId === "corridor") ? (
        <GalleryExhibits roomId="corridor" />
      ) : (
        import.meta.env.MODE !== "personal" && placedPortraits.map((placement) => (
          <PortraitFrame key={placement.portrait.id} placement={placement} />
        ))
      )}
      {museum.memories.some(memory => memory.section === "graduation") && (
        <group position={[2.68, 3.67, corridorBays[0] - 2]} rotation={[0, -Math.PI / 2, 0]}>
          <Label text="THE GRADUATE" position={[0, 0, 0]} size={[2.8, 0.27]} paper="#252739" color="#f4dfb0" />
        </group>
      )}
      {corridorBays
        .filter((_, index) => index % 2 === 0)
        .map((z) => (
          <Motes key={z} z={z} />
        ))}
    </>
  );
}
