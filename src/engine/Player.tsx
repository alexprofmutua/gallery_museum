import { useEffect, useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, useRapier } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import { Euler, Object3D, PerspectiveCamera, Vector3 } from "three";
import { input, clearInput, movementVector, approachVelocity } from "./input";
import { nearestPortrait, portraitInRange } from "./portraitReach";
import { usePortraitVisit } from "../stores/portraitVisit";
import { letterInReach } from "../content/foreverRoom";
import { useMuseum } from "../stores/museum";
import { museum } from "../content/museum";
import { useExhibitInteractions } from "./useExhibitInteractions";
import { VisitorAvatar } from "../components/museum/VisitorAvatar";
import { safeCameraDistance, playerPose } from "./chaseCamera";
import {
  SPAWN,
  cinemaRoom,
  cinemaSeatInReach,
  cinemaViewPosition,
  roomAt,
  roomCenterZ,
} from "../content/layout";
const direction = new Vector3();
const interpolated = new Vector3();
const eye = new Vector3(),
  anchor = new Vector3(),
  offset = new Vector3();
const viewRotation = new Euler(0, 0, 0, "YXZ");
export function Player() {
  const body = useRef<RapierRigidBody>(null);
  const visualBody = useRef<Object3D>(null);
  const projectionSize = useRef("");
  const rotation = useRef({ yaw: 0, pitch: 0 });
  const { camera, gl, size } = useThree();
  const { world, rapier } = useRapier();
  const { resolve } = useExhibitInteractions();
  const cameraShape = useMemo(() => new rapier.Ball(0.18), [rapier]);
  const previous = useRef({ x: SPAWN.x, z: SPAWN.z });
  const reset = useMuseum((s) => s.reset);
  useEffect(() => {
    body.current?.setTranslation(SPAWN, true);
    body.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rotation.current = { yaw: 0, pitch: 0 };
    previous.current = { x: SPAWN.x, z: SPAWN.z };
    Object.assign(playerPose, {
      x: SPAWN.x,
      y: SPAWN.y + 0.8,
      z: SPAWN.z,
      feetY: SPAWN.y - 0.85,
      yaw: 0,
      speed: 0,
      cameraDistance: 0,
    });
  }, [reset]);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (
        event.code === "KeyV" &&
        !event.repeat &&
        !(event.target as HTMLElement)?.closest(
          "input,textarea,select,[contenteditable]",
        )
      ) {
        const state = useMuseum.getState();
        if (
          state.entered &&
          !state.activeMemory &&
          !state.feature &&
          !state.settings &&
          !document.querySelector("dialog[open]")
        ) {
          event.preventDefault();
          state.toggleView();
        }
        return;
      }
      if (
        (event.target as HTMLElement)?.closest(
          "input,select,textarea,[contenteditable]",
        ) ||
        document.querySelector("dialog[open]")
      )
        return;
      const key = event.code;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        ].includes(key)
      )
        event.preventDefault();
      input.keys.add(key);
      const state = useMuseum.getState();
      if (
        key !== "KeyE" ||
        event.repeat ||
        !state.entered ||
        state.settings ||
        state.activeMemory ||
        state.feature
      )
        return;
      if (state.currentRoom === "corridor") {
        if (state.nearMemory) {
          state.openMemory(state.nearMemory);
          return;
        }
        const { nearby, activate } = usePortraitVisit.getState();
        if (nearby) activate(nearby, "corridor");
      } else if (state.currentRoom === "cinema") state.sitInCinema();
      else if (state.currentRoom === "forever") state.openEnvelope();
      else if (state.nearMemory) state.openMemory(state.nearMemory);
    };
    const up = (event: KeyboardEvent) => input.keys.delete(event.code);
    let dragging = false;
    let dragDistance = 0;
    let touch: { id: number; x: number; y: number } | null = null;
    const canLook = () => {
      const state = useMuseum.getState();
      return state.entered && !state.activeMemory && !state.feature && !state.settings && !document.querySelector("dialog[open]");
    };
    const dragStart = (event: PointerEvent) => {
      input.suppressClick = false;
      if (!canLook()) return;
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        if (touch) return;
        touch = { id: event.pointerId, x: event.clientX, y: event.clientY };
        dragDistance = 0;
        gl.domElement.setPointerCapture(event.pointerId);
      } else if (event.pointerType === "mouse") {
        dragging = true;
        dragDistance = 0;
        gl.domElement.focus();
      }
    };
    const dragEnd = (event: PointerEvent) => {
      dragging = false;
      if (touch?.id === event.pointerId) touch = null;
    };
    const touchLook = (event: PointerEvent) => {
      if (!touch || touch.id !== event.pointerId || !canLook()) return;
      const dx = event.clientX - touch.x, dy = event.clientY - touch.y;
      dragDistance += Math.hypot(dx, dy);
      if (dragDistance > 6) input.suppressClick = true;
      input.look.x += dx * 1.5;
      input.look.y += dy * 1.5;
      touch = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const scrollLook = (event: WheelEvent) => {
      // Preserve browser pinch-to-zoom and scrolling on UI outside the canvas.
      if (!canLook() || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? gl.domElement.clientHeight : 1;
      const dx = Math.max(-140, Math.min(140, event.deltaX * units));
      const dy = Math.max(-140, Math.min(140, event.deltaY * units));
      input.look.x += (event.shiftKey && dx === 0 ? dy : dx) * .8;
      input.look.y += (event.shiftKey && dx === 0 ? 0 : dy) * .8;
    };
    const look = (event: MouseEvent) => {
      if (canLook() && (
        document.pointerLockElement === gl.domElement ||
        (dragging && event.buttons === 1)
      )) {
        if (dragging && event.buttons === 1) {
          dragDistance += Math.hypot(event.movementX, event.movementY);
          if (dragDistance > 6) input.suppressClick = true;
        }
        input.look.x += event.movementX;
        input.look.y += event.movementY;
      }
    };
    const capture = () => {
      const state = useMuseum.getState();
      if (
        !input.suppressClick &&
        state.entered &&
        !state.activeMemory &&
        !state.feature &&
        !state.settings &&
        matchMedia("(pointer:fine)").matches
      ) {
        void gl.domElement.requestPointerLock?.()?.catch((error: unknown) => {
          console.warn(
            "Pointer lock was unavailable. Drag in the room or use the arrow keys to turn.",
            error,
          );
        });
      }
    };
    gl.domElement.addEventListener("click", capture);
    gl.domElement.addEventListener("pointerdown", dragStart);
    gl.domElement.addEventListener("pointermove", touchLook);
    gl.domElement.addEventListener("lostpointercapture", dragEnd);
    gl.domElement.addEventListener("wheel", scrollLook, { passive: false });
    window.addEventListener("pointerup", dragEnd);
    window.addEventListener("pointercancel", dragEnd);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clearInput);
    document.addEventListener("mousemove", look);
    return () => {
      clearInput();
      gl.domElement.removeEventListener("click", capture);
      gl.domElement.removeEventListener("pointerdown", dragStart);
      gl.domElement.removeEventListener("pointermove", touchLook);
      gl.domElement.removeEventListener("lostpointercapture", dragEnd);
      gl.domElement.removeEventListener("wheel", scrollLook);
      window.removeEventListener("pointerup", dragEnd);
      window.removeEventListener("pointercancel", dragEnd);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clearInput);
      document.removeEventListener("mousemove", look);
    };
  }, [gl]);
  useFrame((_, delta) => {
    if (!body.current) return;
    const state = useMuseum.getState();
    const enabled =
      state.entered && !state.activeMemory && !state.settings && !state.feature;
    if (enabled) {
      rotation.current.yaw -= input.look.x * 0.0023;
      rotation.current.pitch = Math.max(
        -1.1,
        Math.min(1.1, rotation.current.pitch - input.look.y * 0.0023),
      );
      if (input.keys.has("ArrowLeft"))
        rotation.current.yaw += Math.min(delta, 0.05) * 1.3;
      if (input.keys.has("ArrowRight"))
        rotation.current.yaw -= Math.min(delta, 0.05) * 1.3;
    }
    input.look.x = 0;
    input.look.y = 0;
    const x = enabled
      ? Number(input.keys.has("KeyD")) -
        Number(input.keys.has("KeyA")) +
        input.move.x
      : 0;
    const z = enabled
      ? Number(input.keys.has("KeyS") || input.keys.has("ArrowDown")) -
        Number(input.keys.has("KeyW") || input.keys.has("ArrowUp")) +
        input.move.y
      : 0;
    const velocity = movementVector(
      x,
      z,
      rotation.current.yaw,
      input.keys.has("ShiftLeft") || input.keys.has("ShiftRight") ? 6.5 : 4.2,
    );
    const currentVelocity = body.current.linvel();
    body.current.setLinvel(
      { x: enabled ? approachVelocity(currentVelocity.x, velocity.x, delta) : 0,
        y: currentVelocity.y,
        z: enabled ? approachVelocity(currentVelocity.z, velocity.z, delta) : 0 },
      true,
    );
    const p = body.current.translation();
    if (p.y < -3) {
      state.resetPosition();
      return;
    }
    if (import.meta.env.DEV) {
      gl.domElement.dataset.playerPosition = JSON.stringify([
        p.x,
        p.y + 0.8,
        p.z,
      ]);
      gl.domElement.dataset.playerYaw = String(rotation.current.yaw);
      gl.domElement.dataset.playerPitch = String(rotation.current.pitch);
    }
    const room = roomAt(p.z);
    const nearCinemaSeat =
      state.entered && room.id === "cinema" && cinemaSeatInReach(p.x, p.z);
    if (state.nearCinemaSeat !== nearCinemaSeat)
      state.setNearCinemaSeat(nearCinemaSeat);
    const nearLetter =
      state.entered && room.id === "forever" && letterInReach(p.x, p.z);
    if (state.nearLetter !== nearLetter) state.setNearLetter(nearLetter);
    if (state.currentRoom !== room.id) state.setRoom(room.id);
    if (import.meta.env.DEV) {
      gl.domElement.dataset.room = room.id;
      gl.domElement.dataset.drawCalls = String(gl.info.render.calls);
      gl.domElement.dataset.gpuResources = JSON.stringify(gl.info.memory);
    }
    // Rapier interpolates this child between fixed physics ticks. Follow that
    // presentation pose directly, without smoothing mouse input or collision state.
    if (visualBody.current) visualBody.current.getWorldPosition(interpolated);
    else interpolated.set(p.x, p.y, p.z);
    eye.copy(interpolated).y += 0.8;
    viewRotation.set(rotation.current.pitch, rotation.current.yaw, 0, "YXZ");
    direction.set(0, 0, -1).applyEuler(viewRotation);
    const screening = state.feature === "cinema";
    if (camera instanceof PerspectiveCamera) {
      const zoom = screening ? Math.min(1, camera.aspect * 1.12) : 1;
      if (camera.zoom !== zoom) {
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
      }
    }
    if (screening) {
      // Leave space below the screen for captions and wrapped controls.
      const aimOffset =
        size.width < size.height
          ? Math.min(1.3, Math.max(0, (770 - size.height) / 100))
          : 0;
      camera.position.set(...cinemaViewPosition);
      camera.lookAt(-6.57, 2.24 - aimOffset, roomCenterZ(cinemaRoom));
      const projectionKey = `${size.width}:${size.height}:${aimOffset}`;
      if (projectionSize.current !== projectionKey) {
        camera.updateMatrixWorld();
        const corners = [-4, 4].flatMap(z => [0.27, 4.77].map(y =>
          new Vector3(-6.57, y, roomCenterZ(cinemaRoom) + z).project(camera)));
        const left = (Math.min(...corners.map(p => p.x)) + 1) * size.width / 2;
        const right = (Math.max(...corners.map(p => p.x)) + 1) * size.width / 2;
        const bottom = (Math.min(...corners.map(p => p.y)) + 1) * size.height / 2;
        const style = gl.domElement.closest("main")?.style;
        style?.setProperty("--film-left", `${Math.max(12, left)}px`);
        style?.setProperty("--film-width", `${right - left}px`);
        style?.setProperty("--film-bottom", `${Math.max(12, bottom)}px`);
        projectionSize.current = projectionKey;
      }
      playerPose.cameraDistance = 0;
    } else if (state.view === "third" && state.entered) {
      anchor.copy(interpolated).y += 0.45;
      offset
        .set(0, 0, 3.4)
        .applyEuler(
          viewRotation.set(
            Math.max(-0.8, Math.min(0.5, rotation.current.pitch)),
            rotation.current.yaw,
            0,
            "YXZ",
          ),
        );
      offset.y += 0.8;
      const desired = offset.length();
      offset.normalize();
      const hit = world.castShape(
        anchor,
        { x: 0, y: 0, z: 0, w: 1 },
        offset,
        cameraShape,
        0,
        desired,
        true,
        undefined,
        undefined,
        undefined,
        body.current,
      );
      const distance = safeCameraDistance(desired, hit?.time_of_impact);
      camera.position.copy(anchor).addScaledVector(offset, distance);
      camera.lookAt(anchor);
      playerPose.cameraDistance = distance;
    } else {
      camera.position.copy(eye);
      if (state.entered) camera.rotation.copy(viewRotation);
      else camera.rotation.set(0.13, 0, 0, "YXZ");
      playerPose.cameraDistance = 0;
    }
    const dx = p.x - previous.current.x,
      dz = p.z - previous.current.z;
    playerPose.speed = Math.min(6.5, Math.hypot(dx, dz) / Math.max(0.001, delta));
    if (Math.hypot(dx, dz) > 0.001) playerPose.yaw = Math.atan2(-dx, -dz);
    Object.assign(playerPose, { x: p.x, y: eye.y, z: p.z, feetY: p.y - 0.85 });
    previous.current = { x: p.x, z: p.z };
    if (import.meta.env.DEV) {
      gl.domElement.dataset.cameraPosition = JSON.stringify(
        camera.position.toArray(),
      );
      gl.domElement.dataset.cameraView = state.view;
      gl.domElement.dataset.avatarVisible = String(
        state.view === "third" &&
          state.entered &&
          playerPose.cameraDistance > 0.75,
      );
    }
    const visit = usePortraitVisit.getState();
    const inCorridor =
      enabled &&
      room.id === "corridor" &&
      !museum.memories.some((memory) => memory.roomId === "corridor");
    visit.setNearby(inCorridor ? nearestPortrait(eye) : null);
    if (
      visit.session?.location === "corridor" &&
      (!inCorridor || !portraitInRange(visit.session.portrait.id, eye))
    )
      visit.close();
    const near = enabled ? resolve(eye, direction) : null;
    if (state.nearMemory !== near) state.setNear(near);
    const moving = Math.hypot(x, z) > 0.05;
    if (state.moving !== moving) state.setMoving(moving);
  });
  return (
    <>
      <VisitorAvatar />
      <RigidBody
        ref={body}
        position={[SPAWN.x, SPAWN.y, SPAWN.z]}
        colliders={false}
        enabledRotations={[false, false, false]}
        linearDamping={0}
        friction={0}
        ccd
      >
        <CapsuleCollider args={[0.55, 0.3]} friction={0} />
        <group ref={visualBody} />
      </RigidBody>
    </>
  );
}
