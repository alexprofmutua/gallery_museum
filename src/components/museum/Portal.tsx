import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Group } from "three";
import { EntrancePortalSurround } from "./GrandEntrance";
import { Box, Label } from "./Exhibit";
import { playerPose } from "../../engine/chaseCamera";
import { doorProgress, rooms } from "../../content/layout";
import type { portals } from "../../content/layout";
import { prefersReducedMotion } from "../../engine/motion";
export function Portal({
  portal,
  onReveal,
}: {
  portal: (typeof portals)[number];
  onReveal?: () => void;
}) {
  const left = useRef<Group>(null),
    right = useRef<Group>(null);
  const progress = useRef(0),
    triggered = useRef(false);
  const [open, setOpen] = useState(false);
  const opening = portal.openingHalfWidth;
  useFrame(({ gl }, delta) => {
    if (Math.abs(playerPose.z - portal.z) < 4 && Math.abs(playerPose.x) < 2.8)
      triggered.current = true;
    const reduced = prefersReducedMotion();
    const next = doorProgress(
      progress.current,
      delta,
      triggered.current,
      reduced,
    );
    if (progress.current === 0 && next > 0) onReveal?.();
    progress.current = next;
    const smooth = next * next * (3 - 2 * next);
    const leafCenter = opening / 2 + (opening + 0.2) * smooth;
    if (left.current) left.current.position.x = -leafCenter;
    if (right.current) right.current.position.x = leafCenter;
    if (next === 1 && !open) setOpen(true);
    if (import.meta.env.DEV)
      gl.domElement.setAttribute(
        `data-door-${portal.id}`,
        next === 1 ? "open" : next === 0 ? "closed" : "opening",
      );
  });
  const grand = portal.id === "entrance-gallery";
  const galleryExit = portal.id === "gallery-corridor";
  const classic = grand || galleryExit;
  const extension = rooms[0].height - 6;
  const faceColor = (z: number) => {
    if (portal.id === "corridor-cinema") return z < 0 ? "#563337" : "#433b50";
    if (portal.id === "cinema-forever") return z < 0 ? "#303043" : "#563337";
    if (portal.id === "gallery-corridor" && z < 0) return "#433b50";
    return classic ? "#ded5c4" : "#e4dccb";
  };
  const wing = portal.halfWidth - opening,
    x = opening + wing / 2;
  return (
    <group position={[0, 0, portal.z]}>
      <RigidBody type="fixed" colliders={false}>
        {[-1, 1].map((side) => (
          <CuboidCollider
            key={side}
            args={[wing / 2, 3, 0.32]}
            position={[side * x, 3, 0]}
          />
        ))}
        <CuboidCollider args={[opening, 1, 0.32]} position={[0, 5, 0]} />
        {!open && (
          <CuboidCollider args={[opening, 2, 0.1]} position={[0, 2, 0]} />
        )}
      </RigidBody>
      {grand && (
        <>
          <Box
            position={[0, 6 + extension / 2, 0.27]}
            size={[portal.halfWidth * 2, extension, 0.12]}
            color="#b6a48a"
          />
          <Box
            position={[0, 5.72, 0.34]}
            size={[portal.halfWidth * 2, 0.09, 0.11]}
            color="#9b8060"
          />
          <EntrancePortalSurround />
        </>
      )}
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Two wall faces surround the pocket. The leaf travels inside the cavity. */}
          {[-0.27, 0.27].map((z) => (
            <Box
              key={z}
              position={[side * x, 3, z]}
              size={[wing, 6, 0.1]}
              color={faceColor(z)}
            />
          ))}
          <Box
            position={[side * (opening + 0.02), 2, 0.32]}
            size={[0.14, 4.1, 0.12]}
            color={classic ? "#a28054" : "#b69b68"}
          />
        </group>
      ))}
      {[-0.28, 0.28].map((z) => (
        <Box
          key={z}
          position={[0, 5, z]}
          size={[opening * 2, 2, 0.08]}
          color={faceColor(z)}
        />
      ))}
      <Box
        position={[0, 4.04, 0.34]}
        size={[opening * 2 + 0.2, 0.12, 0.12]}
        color={classic ? "#a28054" : "#b69b68"}
      />
      {[left, right].map((ref, i) => (
        <group
          ref={ref}
          key={i}
          position={[((i === 0 ? -1 : 1) * opening) / 2, 0, 0]}
        >
          <Box
            position={[0, 2, 0]}
            size={[opening - 0.02, 3.96, 0.12]}
            color={classic ? "#30231c" : "#35272b"} surface="wood"
          />
          <Box
            position={[0, 2, 0.075]}
            size={[opening - 0.26, 3.65, 0.04]}
            color={classic ? "#79583c" : "#97774e"} surface="wood"
          />
          <Box
            position={[0, 2, 0.105]}
            size={[opening - 0.42, 3.48, 0.03]}
            color={classic ? "#503728" : "#49313d"} surface="wood"
          />
          {classic &&
            [0.93, 2.99].map((y) => (
              <group key={y}>
                <Box
                  position={[0, y, 0.13]}
                  size={[1.29, 1.35, 0.027]}
                  color="#79583c" surface="wood"
                />
                <Box
                  position={[0, y, 0.15]}
                  size={[1.2, 1.26, 0.02]}
                  color="#3b291f" surface="wood"
                />
              </group>
            ))}
          <Box
            position={[(i === 0 ? 1 : -1) * (opening / 2 - 0.26), 1.9, 0.14]}
            size={[0.04, 0.55, 0.06]}
            color="#8b6c3e"
          />
        </group>
      ))}
      <Label
        text={portal.next.toUpperCase()}
        position={[0, grand ? 4.47 : 4.24, 0.35]}
        paper={classic ? "#4c392a" : undefined}
        color={classic ? "#f5e5c9" : undefined}
        size={[3.5, 0.28]}
      />
      <group position={[0, 0, -0.34]} rotation={[0, Math.PI, 0]}>
        <Label
          text={portal.previous.toUpperCase()}
          position={[0, 4.24, 0]}
          size={[3.5, 0.28]}
        />
      </group>
    </group>
  );
}
