import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, MeshBasicMaterial, SRGBColorSpace, VideoTexture } from "three";
import { assetUrl, museum } from "../../content/museum";
import { useReducedMotion } from "../../engine/motion";
import { useMuseum } from "../../stores/museum";
import { Box } from "./Exhibit";
import { useMemoryTexture } from "./useMemoryTexture";

export function EntranceMemory() {
  const entrance = museum.entrance;
  if (!entrance) return null;
  return <EntranceAnimation {...entrance} />;
}

function EntranceAnimation({
  source,
  poster,
  aspectRatio,
}: NonNullable<typeof museum.entrance>) {
  const still = useMemoryTexture(assetUrl(poster), true);
  const material = useRef<MeshBasicMaterial>(null);
  const surface = useRef<Mesh>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const active = useMuseum((state) => state.currentRoom === "entrance");
  const reduced = useReducedMotion();
  const height = 3.2;
  const width = height * aspectRatio;

  useEffect(() => {
    const player = document.createElement("video");
    player.muted = true;
    player.loop = true;
    player.playsInline = true;
    player.preload = "metadata";
    player.crossOrigin = "anonymous";
    player.src = assetUrl(source);
    video.current = player;
    const map = new VideoTexture(player);
    map.colorSpace = SRGBColorSpace;
    const target = material.current!;
    target.map = map;
    target.needsUpdate = true;
    return () => {
      player.pause();
      player.removeAttribute("src");
      player.load();
      video.current = null;
      target.map = null;
      target.needsUpdate = true;
      map.dispose();
    };
  }, [source]);

  useEffect(() => {
    const player = video.current;
    if (!player) return;
    const play = () => {
      if (active && !reduced && !document.hidden)
        void player.play().catch(() => {});
      else player.pause();
    };
    play();
    document.addEventListener("visibilitychange", play);
    return () => {
      player.pause();
      document.removeEventListener("visibilitychange", play);
    };
  }, [active, reduced, source]);

  useFrame(() => {
    if (surface.current)
      surface.current.visible =
        !reduced &&
        Boolean(
          video.current &&
            video.current.readyState >= 2 &&
            !video.current.error,
        );
  });

  return (
    <group position={[4.56, 3.03, 10.56]}>
      <Box
        position={[0, 0, 0]}
        size={[width + 0.22, height + 0.22, 0.12]}
        color="#674a32" surface="wood"
      />
      <Box position={[0, 0, 0.065]} size={[width + 0.07, height + 0.07, 0.016]}
        color="#e9e1d5" surface="fabric" />
      {still.texture && (
        <mesh position={[0, 0, 0.08]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={still.texture} toneMapped={false} />
        </mesh>
      )}
      <mesh ref={surface} position={[0, 0, 0.086]} visible={false}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial ref={material} toneMapped={false} />
      </mesh>
    </group>
  );
}
