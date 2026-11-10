import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils, Shape } from "three";
import { Billboard } from "@react-three/drei";
import { characters, defaultCharacter } from "../../content/characters";
import type { CharacterId } from "../../content/characters";
import { Label } from "./Exhibit";
import { playerPose } from "../../engine/chaseCamera";
import { useMuseum } from "../../stores/museum";
import type { RefObject } from "react";
import type { VisitorPose } from "../../private/useSharedVisit";

const star = new Shape();
for (let point = 0; point < 10; point++) {
  const angle = Math.PI / 2 + (point * Math.PI) / 5;
  const radius = point % 2 === 0 ? 0.094 : 0.044;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  if (point === 0) star.moveTo(x, y);
  else star.lineTo(x, y);
}
star.closePath();

const whaleTail = new Shape();
whaleTail.moveTo(-0.025, -0.08);
whaleTail.quadraticCurveTo(-0.022, -0.015, -0.05, -0.008);
whaleTail.quadraticCurveTo(-0.09, 0.001, -0.105, 0.069);
whaleTail.quadraticCurveTo(-0.038, 0.072, 0, 0.036);
whaleTail.quadraticCurveTo(0.038, 0.072, 0.105, 0.069);
whaleTail.quadraticCurveTo(0.09, 0.001, 0.05, -0.008);
whaleTail.quadraticCurveTo(0.022, -0.015, 0.025, -0.08);
whaleTail.closePath();

export function BasicVisitorAvatar({
  remote,
  guestCharacter = defaultCharacter,
}: {
  remote?: RefObject<VisitorPose | null>;
  guestCharacter?: CharacterId;
}) {
  const selected = useMuseum((state) => state.character);
  const character = remote ? guestCharacter : selected;
  const { name, coat, trim } = characters[character];
  const badge = character === "starfish" ? star : whaleTail;
  const root = useRef<Group>(null);
  const leftLeg = useRef<Group>(null),
    rightLeg = useRef<Group>(null),
    leftArm = useRef<Group>(null),
    rightArm = useRef<Group>(null);
  const phase = useRef(0);
  useFrame(({ gl }, delta) => {
    const avatar = root.current;
    if (!avatar) return;
    const pose = remote ? remote.current : playerPose;
    const visible = remote
      ? Boolean(pose)
      : useMuseum.getState().view === "third" &&
        useMuseum.getState().entered &&
        playerPose.cameraDistance > 0.75;
    const wasVisible = avatar.visible;
    avatar.visible = visible;
    if (!remote && import.meta.env.DEV)
      gl.domElement.dataset.visitorCharacter = character;
    if (remote && import.meta.env.DEV) {
      gl.domElement.dataset.peerVisible = String(visible);
      if (visible) {
        gl.domElement.dataset.peerPosition = JSON.stringify(
          avatar.position.toArray(),
        );
        gl.domElement.dataset.peerCharacter = character;
      } else {
        delete gl.domElement.dataset.peerPosition;
        delete gl.domElement.dataset.peerCharacter;
      }
    }
    if (!pose) return;
    if (
      !remote ||
      !wasVisible ||
      Math.hypot(avatar.position.x - pose.x, avatar.position.z - pose.z) > 8
    ) {
      avatar.position.set(pose.x, pose.feetY, pose.z);
      avatar.rotation.y = pose.yaw;
    } else {
      avatar.position.x = MathUtils.damp(avatar.position.x, pose.x, 12, delta);
      avatar.position.y = MathUtils.damp(
        avatar.position.y,
        pose.feetY,
        12,
        delta,
      );
      avatar.position.z = MathUtils.damp(avatar.position.z, pose.z, 12, delta);
      const turn = pose.yaw - avatar.rotation.y;
      avatar.rotation.y +=
        Math.atan2(Math.sin(turn), Math.cos(turn)) *
        (1 - Math.exp(-12 * delta));
    }
    phase.current += Math.min(delta, 0.1) * pose.speed * 3.2;
    const swing = pose.speed > 0.1 ? Math.sin(phase.current) * 0.42 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.7;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.7;
  });
  return (
    <group
      ref={root}
      visible={false}
      name={remote ? "guest-avatar" : "visitor-avatar"}
    >
      {remote && (
        <Billboard position={[0, 2.02, 0]}>
          <Label
            text={name.toUpperCase()}
            position={[0, 0, 0]}
            size={[1.04, 0.22]}
          />
        </Billboard>
      )}
      <mesh position={[0, 1.1, 0]}>
        <capsuleGeometry args={[0.22, 0.48, 5, 12]} />
        <meshStandardMaterial color={coat} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.64, 0]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshStandardMaterial color="#b28c70" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.67, 0]}>
        <sphereGeometry args={[0.185, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3c302a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.4, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.055, 8, 16]} />
        <meshStandardMaterial color={trim} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[0, 1.19, side * 0.224]}
          rotation={[0, side < 0 ? Math.PI : 0, 0]}
        >
          <shapeGeometry args={[badge]} />
          <meshBasicMaterial color={trim} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <group
            ref={side === -1 ? leftLeg : rightLeg}
            position={[side * 0.115, 0.72, 0]}
          >
            <mesh position={[0, -0.3, 0]}>
              <capsuleGeometry args={[0.085, 0.45, 4, 10]} />
              <meshStandardMaterial color="#444b45" roughness={1} />
            </mesh>
            <mesh position={[0, -0.66, -0.055]}>
              <boxGeometry args={[0.17, 0.12, 0.3]} />
              <meshStandardMaterial color="#433a31" roughness={0.9} />
            </mesh>
          </group>
          <group
            ref={side === -1 ? leftArm : rightArm}
            position={[side * 0.26, 1.32, 0]}
          >
            <mesh position={[0, -0.2, 0]}>
              <capsuleGeometry args={[0.075, 0.32, 4, 10]} />
              <meshStandardMaterial color={coat} roughness={0.95} />
            </mesh>
            <mesh position={[0, -0.45, 0]}>
              <sphereGeometry args={[0.075, 10, 8]} />
              <meshStandardMaterial color="#b28c70" roughness={0.9} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
