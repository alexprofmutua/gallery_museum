import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, useGLTF } from "@react-three/drei";
import { AnimationMixer, Group, MathUtils, Mesh } from "three";
import type { AnimationAction } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { playerPose } from "../../engine/chaseCamera";
import { useMuseum } from "../../stores/museum";
import type { VisitorPose } from "../../private/useSharedVisit";
import { Label } from "./Exhibit";
import { characters, defaultCharacter } from "../../content/characters";
import type { CharacterId } from "../../content/characters";

const personalModels = {
  "blue-whale": { url: "/characters/alex.glb?v=taper-1", id: "alex-taper" },
  starfish: { url: "/characters/starfish.glb?v=1", id: "starfish-braids" },
} satisfies Record<CharacterId, { url: string; id: string }>;

const nominalSpeeds = { Idle: 0, Walk: 1.5, Run: 4.2, Sprint: 6.5 };
type Gait = keyof typeof nominalSpeeds;

/** Visual replacement only: the existing Player capsule remains authoritative. */
export function PersonalizedVisitorAvatar({ remote, character = defaultCharacter }: {
  remote?: RefObject<VisitorPose | null>;
  character?: CharacterId;
}) {
  const asset = personalModels[character];
  const source = useGLTF(asset.url);
  const root = useRef<Group>(null);
  const active = useRef<AnimationAction | null>(null);
  const gait = useRef<Gait>("Idle");
  const speed = useRef(0);
  const initialized = useRef(false);
  const animation = useRef<{ mixer: AnimationMixer; actions: Record<string, AnimationAction> } | null>(null);
  const model = useMemo(() => {
    // Each visitor needs independent bones and a mixer; geometry/materials stay shared.
    const model = clone(source.scene);
    model.traverse(object => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.frustumCulled = false;
      }
    });
    return model;
  }, [source.scene]);
  useEffect(() => {
    // Fresh bindings on every effect setup also support React Strict Mode replay.
    const mixer = new AnimationMixer(model);
    const actions = Object.fromEntries(source.animations.map(clip => [clip.name, mixer.clipAction(clip)]));
    animation.current = { mixer, actions };
    const idle = actions.Idle;
    idle?.reset().play();
    active.current = idle ?? null;
    gait.current = "Idle";
    initialized.current = false;
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      if (animation.current?.mixer === mixer) animation.current = null;
    };
  }, [model, source.animations]);
  useFrame(({ gl }, dt) => {
    const avatar = root.current;
    const rig = animation.current;
    if (!avatar || !rig) return;
    const pose = remote ? remote.current : playerPose;
    const state = useMuseum.getState();
    const visible = remote ? Boolean(pose) : state.entered && state.view === "third" && playerPose.cameraDistance > .75;
    avatar.visible = visible;
    if (remote && import.meta.env.DEV) {
      gl.domElement.dataset.peerVisible = String(visible);
      if (!visible) {
        delete gl.domElement.dataset.peerPosition;
        delete gl.domElement.dataset.peerCharacter;
      }
    }
    if (!pose || !visible) return;
    const delta = Math.min(dt, .05);
    const teleport = !initialized.current || Math.hypot(avatar.position.x-pose.x, avatar.position.z-pose.z) > 8;
    if (!remote || teleport) avatar.position.set(pose.x, pose.feetY, pose.z);
    else {
      avatar.position.x = MathUtils.damp(avatar.position.x, pose.x, 12, delta);
      avatar.position.y = MathUtils.damp(avatar.position.y, pose.feetY, 12, delta);
      avatar.position.z = MathUtils.damp(avatar.position.z, pose.z, 12, delta);
    }
    const turn = Math.atan2(Math.sin(pose.yaw-avatar.rotation.y), Math.cos(pose.yaw-avatar.rotation.y));
    avatar.rotation.y = teleport ? pose.yaw : avatar.rotation.y + turn*(1-Math.exp(-14*delta));
    initialized.current = true;
    speed.current = MathUtils.damp(speed.current, pose.speed, 16, delta);
    const desired: Gait = speed.current < .12 ? "Idle" : speed.current < 2.6 ? "Walk" : speed.current < 5.35 ? "Run" : "Sprint";
    if (desired !== gait.current) {
      const next = rig.actions[desired];
      if (next) {
        next.reset().setEffectiveWeight(1).play();
        active.current?.crossFadeTo(next, .18, false);
        active.current = next;
        gait.current = desired;
      }
    }
    active.current?.setEffectiveTimeScale(desired === "Idle" ? 1 : MathUtils.clamp(speed.current / nominalSpeeds[desired], .2, 1.5));
    rig.mixer.update(delta);
    if (import.meta.env.DEV) {
      if (!remote) {
        gl.domElement.dataset.visitorCharacter = character;
        gl.domElement.dataset.avatarModel = asset.id;
        gl.domElement.dataset.avatarAction = gait.current;
      } else {
        gl.domElement.dataset.peerVisible = "true";
        gl.domElement.dataset.peerPosition = JSON.stringify(avatar.position.toArray());
        gl.domElement.dataset.peerCharacter = character;
      }
    }
  });
  return <group ref={root} visible={false} name={remote ? "guest-avatar" : "visitor-avatar"}>
    {remote && <Billboard position={[0,2.02,0]}><Label text={characters[character].name.toUpperCase()} position={[0,0,0]} size={[1.04,.22]} /></Billboard>}
    {/* GLB faces +Z; the museum controller defines forward as -Z. */}
    <primitive object={model} rotation={[0,Math.PI,0]} dispose={null} />
  </group>;
}
