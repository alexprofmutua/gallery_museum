import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { assetUrl, museum, formatMemoryNumber } from "../../content/museum";
import type { Memory } from "../../content/museum";
import { useMuseum } from "../../stores/museum";
import { input } from "../../engine/input";
import { playerPose } from "../../engine/chaseCamera";
import { containImage } from "../../engine/interactions";
import { useExhibitInteractions } from "../../engine/useExhibitInteractions";
import { useMemoryTexture } from "./useMemoryTexture";
import { Label } from "./Exhibit";
import { PictureLights } from "./PictureLights";
import { ExhibitionFrame } from "./ExhibitionFrame";
function MemoryFrame({ memory }: { memory: Memory }) {
  const [load, setLoad] = useState(false);
  const selected = useMuseum((s) => s.nearMemory === memory.id);
  const media = useMemoryTexture(assetUrl(memory.image), load);
  useFrame(() => {
    const distance = Math.hypot(
      playerPose.x - memory.position[0],
      playerPose.z - memory.position[2],
    );
    // Prefetch before a doorway, without decoding the whole 44-metre gallery
    // at once. Hysteresis avoids churn when walking past the load boundary.
    if (!load && distance < 20) setLoad(true);
    else if (load && distance > 28) setLoad(false);
  });
  const { width: w, height: h } = memory.frame;
  const inset = Math.min(0.25, w * 0.28, h * 0.28);
  const fitted = containImage(media.aspect, w - inset, h - inset);
  const { activate } = useExhibitInteractions();
  return (
    <group
      name={`exhibit-${memory.id}`}
      position={memory.position}
      rotation={[0, memory.rotationY, 0]}
      userData={{ mediaStatus: media.status }}
      onClick={(e) => {
        e.stopPropagation();
        if (!input.suppressClick) activate(memory, e.point);
      }}
    >
      <ExhibitionFrame
        width={w}
        height={h}
        selected={selected}
        accent={w >= 1.4}
        title={memory.title}
        number={formatMemoryNumber(memory)}
      />
      {media.texture && media.status === "ready" ? (
        <mesh position={[0, 0, 0.135]}>
          <planeGeometry args={[fitted.width, fitted.height]} />
          {/* Neutral print illumination keeps the original photo colors and exposure
              consistent between room light pools; the frame and mat stay shaded. */}
          <meshBasicMaterial map={media.texture} toneMapped={false} />
        </mesh>
      ) : (
        <Label
          text={
            media.status === "error"
              ? "IMAGE UNAVAILABLE"
              : media.status === "loading"
                ? "LOADING IMAGE…"
                : "PHOTO PREVIEW"
          }
          position={[0, 0, 0.135]}
          size={[w - inset, Math.min(0.2, h / 3)]}
        />
      )}
    </group>
  );
}
export function GalleryExhibits({
  roomId = "gallery",
}: {
  roomId?: Memory["roomId"];
}) {
  const group = useRef<Group>(null);
  const memories = useMemo(() => museum.memories.filter(memory => memory.roomId === roomId), [roomId]);
  useFrame(({ gl }) => {
    if (import.meta.env.DEV && group.current) {
      gl.domElement.setAttribute(`data-exhibit-count-${roomId}`, String(group.current.children.length));
      gl.domElement.dataset.renderedExhibits = String(
        group.current.children.length,
      );
      for (const child of group.current.children)
        gl.domElement.setAttribute(
          `data-media-${child.name.replace("exhibit-", "")}`,
          String(child.userData.mediaStatus),
        );
    }
  });
  return (
    <>
      <group ref={group} name="memory-exhibits">
        {memories.map(memory => <MemoryFrame key={memory.id} memory={memory} />)}
      </group>
      <PictureLights memories={memories} roomId={roomId} />
    </>
  );
}
