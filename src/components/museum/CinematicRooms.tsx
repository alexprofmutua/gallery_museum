import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PointsMaterial,
  SRGBColorSpace,
  VideoTexture,
} from "three";
import { prefersReducedMotion } from "../../engine/motion";
import { playerPose } from "../../engine/chaseCamera";
import { containImage } from "../../engine/interactions";
import { useMuseum } from "../../stores/museum";
import { Box } from "./Exhibit";

function seededRandom(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function GalaxyCeiling() {
  const graphics = useMuseum((state) => state.graphics);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 896;
    const ctx = canvas.getContext("2d")!;
    const { width, height } = canvas;
    const random = seededRandom(147);
    ctx.fillStyle = "#05050d";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-0.56);
    ctx.scale(0.45, 1.4);
    for (const [x, y, size, color] of [
      [-60, 25, 270, "#33204c"],
      [55, -90, 230, "#181d47"],
      [15, 90, 165, "#30193e"],
    ] as const) {
      const cloud = ctx.createRadialGradient(x, y, 0, x, y, size);
      cloud.addColorStop(0, color);
      cloud.addColorStop(1, color + "00");
      ctx.fillStyle = cloud;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }
    ctx.restore();
    const count = graphics === "low" ? 500 : graphics === "medium" ? 900 : 1600;
    for (let i = 0; i < count; i++) {
      const y = random() * height;
      const x =
        i % 3
          ? random() * width
          : width / 2 + (y - height / 2) * 0.58 + (random() - random()) * 230;
      const bright = random();
      const radius = 0.32 + bright ** 5 * 1.55;
      ctx.globalAlpha = 0.28 + bright * 0.72;
      ctx.fillStyle = ["#fff3d2", "#becdff", "#f6e9ff"][i % 3];
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      if (bright > 0.994) {
        ctx.globalAlpha = 0.38;
        ctx.fillRect(x - 4, y - 0.4, 8, 0.8);
        ctx.fillRect(x - 0.4, y - 4, 0.8, 8);
      }
    }
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return map;
  }, [graphics]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[0, 4.97, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[14, 16]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

export function ProjectionScreen({
  video,
}: {
  video: HTMLVideoElement | null;
}) {
  const projection = useRef<Mesh>(null);
  const screen = useRef<MeshBasicMaterial>(null);
  const idleScreen = useRef<Mesh>(null);
  const filmTitle = video?.getAttribute("aria-label") ?? "CHOOSE A FILM";
  const idleTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 576;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#18131c");
    gradient.addColorStop(1, "#30232c");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#a48763";
    ctx.lineWidth = 2;
    ctx.strokeRect(31, 31, 962, 514);
    ctx.fillStyle = "#a48763";
    ctx.fillRect(452, 200, 120, 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8d6b6";
    ctx.font = "59px Georgia, serif";
    ctx.fillText("OUR LITTLE CINEMA", 512, 293, 850);
    ctx.font = "25px Georgia, serif";
    ctx.fillText(filmTitle.toUpperCase(), 512, 353, 800);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return map;
  }, [filmTitle]);
  useEffect(() => () => idleTexture.dispose(), [idleTexture]);
  useEffect(() => {
    const material = screen.current;
    if (!video || !material) return;
    const map = new VideoTexture(video);
    map.colorSpace = SRGBColorSpace;
    material.map = map;
    material.needsUpdate = true;
    return () => {
      material.map = null;
      material.needsUpdate = true;
      map.dispose();
    };
  }, [video]);
  useFrame(() => {
    const ready = Boolean(
      video && video.readyState >= 2 && video.currentTime > 0 && !video.error,
    );
    if (projection.current) {
      projection.current.visible = ready;
      if (ready && video) {
        const { width, height } = containImage(
          video.videoWidth / video.videoHeight,
          ...projectionSize,
        );
        projection.current.scale.set(width, height, 1);
      }
    }
    if (idleScreen.current) idleScreen.current.visible = !ready;
  });
  return (
    <group position={[-6.7, 2.52, 0]} rotation={[0, Math.PI / 2, 0]}>
      <Box
        position={[0, 0, -0.055]}
        size={[8.45, 4.73, 0.17]}
        color="#341d23"
      />
      <Box position={[0, 0, 0.035]} size={[8.18, 4.66, 0.09]} color="#9b754e" />
      <Box
        position={[0, 0, 0.072]}
        size={[8.08, 4.56, 0.055]}
        color="#09080a"
      />
      <mesh ref={idleScreen} position={[0, 0, 0.103]}>
        <planeGeometry args={projectionSize} />
        <meshBasicMaterial map={idleTexture} toneMapped={false} />
      </mesh>
      {video && (
        <mesh ref={projection} position={[0, 0, 0.132]} visible={false}>
          <planeGeometry />
          <meshBasicMaterial ref={screen} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

const projectionSize: [number, number] = [8, 4.5];

export function Motes({ z }: { z: number }) {
  const graphics = useMuseum((state) => state.graphics);
  const group = useRef<Group>(null);
  const material = useRef<PointsMaterial>(null);
  const points = useMemo(() => {
    const random = seededRandom(Math.round(-z * 13));
    const total = graphics === "low" ? 20 : graphics === "medium" ? 46 : 80;
    return new Float32Array(
      Array.from({ length: total * 3 }, (_, i) => {
        switch (i % 3) {
          case 0:
            return (random() * 2 - 1) * 2.35;
          case 1:
            return 0.75 + random() * 3.0;
          default:
            return (random() * 2 - 1) * 1.42;
        }
      }),
    );
  }, [graphics, z]);
  useFrame(({ clock }, delta) => {
    const state = useMuseum.getState();
    const reduced = prefersReducedMotion();
    const target = Number(
      state.currentRoom === "corridor" && playerPose.z < z + 2.7,
    );
    if (!material.current || !group.current) return;
    material.current.opacity = reduced
      ? target
      : MathUtils.damp(material.current.opacity, target, 2.5, delta);
    group.current.visible = material.current.opacity > 0.015;
    group.current.position.y =
      !reduced && graphics !== "low"
        ? Math.sin(clock.elapsedTime * 0.74 - z) * 0.19
        : 0;
  });
  return (
    <group ref={group} visible={false}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[points, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={material}
          color="#ffcf86"
          size={0.045}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
          onBeforeCompile={(shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <map_particle_fragment>",
              "diffuseColor.a *= 1.0 - smoothstep(0.12, 0.48, length(gl_PointCoord - vec2(0.5)));",
            );
          }}
        />
      </points>
    </group>
  );
}
