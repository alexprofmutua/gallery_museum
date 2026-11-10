import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AmbientLight,
  HemisphereLight,
  DirectionalLight,
  PointLight,
  SpotLight,
  Object3D,
  Color,
  MathUtils,
} from "three";
import { letterPedestal } from "../content/foreverRoom";
import { galleryFurnishings } from "../content/galleryFurnishings";
import { useMuseum } from "../stores/museum";
import { prefersReducedMotion } from "./motion";
import {
  cinemaRoom,
  corridorRoom,
  foreverRoom,
  galleryRoom,
  roomCenterZ,
  roomAt,
} from "../content/layout";

const warm = new Color("#fff6e7"),
  night = new Color("#b6c9ee"),
  violet = new Color("#e4d9f4");
const localLight = {
  entrance: {
    y: 5,
    z: 17,
    distance: 20,
    intensity: 42,
    color: new Color("#fff3df"),
  },
  gallery: {
    y: 5,
    z: roomCenterZ(galleryRoom),
    distance: galleryRoom.maxZ - galleryRoom.minZ + 6,
    intensity: 18,
    color: new Color("#fff0d9"),
  },
  corridor: {
    y: 3.55,
    z: roomCenterZ(corridorRoom),
    distance: 9,
    intensity: 20,
    color: new Color("#f6ede9"),
  },
  cinema: {
    y: 4.3,
    z: roomCenterZ(cinemaRoom),
    distance: 19,
    intensity: 70,
    color: new Color("#ffd4a7"),
  },
  forever: {
    y: 5,
    z: roomCenterZ(foreverRoom),
    distance: 22,
    intensity: 34,
    color: new Color("#c9d5ff"),
  },
};
export function Lighting() {
  const room = useMuseum((state) => state.currentRoom);
  const graphics = useMuseum((state) => state.graphics);
  // Snap the moving shadow volume to shadow-map texels to reduce shimmer.
  // The directional shadow camera spans 20 world units horizontally.
  const shadowTexel = 20 / (graphics === "high" ? 2048 : 1024);
  const shadowTarget = useMemo(() => new Object3D(), []);
  // Broad, fixed picture lights wash the walls from above. Only the current
  // room's fittings are mounted, keeping the light count bounded.
  const galleryWashes = useMemo(() => [-1, 1].flatMap((side) =>
    [0.17, 0.5, 0.83].map((fraction) => {
      const z = galleryRoom.minZ + fraction * (galleryRoom.maxZ - galleryRoom.minZ);
      const target = new Object3D();
      target.position.set(side * 6.9, 2.4, z);
      return { side, z, target };
    })), []);
  const areaTargets = useMemo(() => galleryFurnishings.lightZones.map(z => {
    const target = new Object3D();
    target.position.set(0, 0.8, z);
    return target;
  }), []);
  const fillLights = useRef<Array<PointLight | null>>([]);
  const wallLights = useRef<Array<SpotLight | null>>([]);
  const areaLights = useRef<Array<SpotLight | null>>([]);
  const ambient = useRef<AmbientLight>(null),
    sky = useRef<HemisphereLight>(null),
    sun = useRef<DirectionalLight>(null),
    practical = useRef<PointLight>(null);
  useFrame(({ camera }, delta) => {
    const { currentRoom: id, feature } = useMuseum.getState();
    const cinema = id === "cinema";
    const forever = id === "forever";
    const corridor = id === "corridor";
    const classic = id === "entrance" || id === "gallery";
    const alpha = prefersReducedMotion() ? 1 : 1 - Math.exp(-delta * 3);
    // Stable light counts keep shader programs reusable at every doorway.
    wallLights.current.forEach(light => { if (light) light.intensity = id === "gallery" ? 60 : 0; });
    areaLights.current.forEach(light => { if (light) light.intensity = id === "gallery" ? 30 : 0; });
    fillLights.current.forEach((light, index) => {
      if (!light) return;
      light.intensity = 0;
      if (id === "entrance" && index < 2) {
        light.position.set((index === 0 ? -1 : 1) * 4.8, 4.7, 16.5);
        light.color.set("#ffe7c2"); light.distance = 12; light.intensity = 24;
      } else if (id === "corridor") {
        light.position.set(0, 3.6, corridorRoom.minZ + [0.18, 0.5, 0.82][index] * (corridorRoom.maxZ - corridorRoom.minZ));
        light.color.set("#f4eeef"); light.distance = 14; light.intensity = 17;
      } else if (id === "forever") {
        light.position.set(index < 2 ? (index === 0 ? -6.3 : 6.3) : 0, index < 2 ? 2.5 : 2.9,
          roomCenterZ(foreverRoom) + (index < 2 ? -1.33 : letterPedestal.z + 0.75));
        light.color.set(index < 2 ? "#ffe0b8" : "#ffdaa6"); light.distance = index < 2 ? 11 : 10;
        light.intensity = index < 2 ? 22 : 24;
      }
    });
    if (practical.current) {
      const lamp = localLight[id];
      practical.current.position.set(0, lamp.y, lamp.z);
      practical.current.distance = lamp.distance;
      practical.current.color.lerp(lamp.color, alpha);
      const dimCinema = cinema && feature === "cinema";
      const target = dimCinema ? lamp.intensity * 0.36 : lamp.intensity;
      practical.current.intensity = MathUtils.lerp(
        practical.current.intensity,
        target,
        alpha,
      );
    }
    if (ambient.current)
      ambient.current.intensity = MathUtils.lerp(
        ambient.current.intensity,
        cinema
          ? feature === "cinema"
            ? 0.14
            : 0.27
          : forever
            ? 0.23
            : corridor
              ? 0.24
              : classic
                ? id === "gallery" ? 0.16 : 0.24
                : 0.5,
        alpha,
      );
    if (sky.current)
      sky.current.intensity = MathUtils.lerp(
        sky.current.intensity,
        cinema
          ? feature === "cinema"
            ? 0.19
            : 0.5
          : forever
            ? 0.5
            : corridor
              ? 0.62
              : classic
                ? id === "gallery" ? 0.58 : 0.82
                : 1,
        alpha,
      );
    if (sun.current) {
      // A fixed light direction with a snapped local shadow volume follows the
      // visitor, so one small map covers long rooms without swimming shadows.
      const z = Math.round(camera.position.z / shadowTexel) * shadowTexel;
      const height = roomAt(camera.position.z).height;
      shadowTarget.position.set(0, 0, z);
      shadowTarget.updateMatrixWorld();
      sun.current.position.set(2.5, Math.min(height - 0.45, 6), z + 3);
      sun.current.intensity = MathUtils.lerp(
        sun.current.intensity,
        cinema
          ? feature === "cinema"
            ? 0.14
            : 0.36
          : forever
            ? 0.46
            : corridor
              ? 0.55
              : classic
                ? id === "gallery" ? 0.5 : 0.72
                : 1.5,
        alpha,
      );
      sun.current.color.lerp(forever ? night : corridor ? violet : warm, alpha);
    }
  });
  return (
    <>
      {galleryWashes.map(({ side, z, target }, index) => (
        <group key={index}>
          <primitive object={target} />
          <spotLight ref={light => { wallLights.current[index] = light; }} position={[side * 4.8, 5.3, z]} target={target}
            angle={0.95} penumbra={1} color="#fff4e5" intensity={0}
            distance={13} decay={2} />
        </group>
      ))}
      {areaTargets.map((target, index) => (
        <group key={`area-${index}`}>
          <primitive object={target} />
          <group visible={room === "gallery"}>
          <mesh position={[0, 5.68, galleryFurnishings.lightZones[index]]}>
            <cylinderGeometry args={[0.025, 0.025, 0.2, 8]} />
            <meshStandardMaterial color="#65513b" metalness={0.45} roughness={0.4} />
          </mesh>
          <mesh position={[0, 5.53, galleryFurnishings.lightZones[index]]}>
            <cylinderGeometry args={[0.27, 0.3, 0.16, 16]} />
            <meshStandardMaterial color="#65513b" metalness={0.45} roughness={0.4} />
          </mesh>
          <mesh position={[0, 5.443, galleryFurnishings.lightZones[index]]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.24, 16]} />
            <meshBasicMaterial color="#ffe7c5" toneMapped={false} />
          </mesh>
          </group>
          <spotLight ref={light => { areaLights.current[index] = light; }} position={[0, 5.45, galleryFurnishings.lightZones[index]]}
            target={target} color="#ffe7c5" intensity={0} angle={0.88}
            penumbra={1} distance={12} decay={2} />
        </group>
      ))}
      {[0, 1, 2].map(index => <pointLight key={`fill-${index}`} ref={light => { fillLights.current[index] = light; }} intensity={0} decay={2} />)}
      <pointLight
        ref={practical}
        position={[0, 5, 17]}
        intensity={55}
        distance={20}
        color="#ffe4b8"
      />
      <ambientLight ref={ambient} intensity={0.5} color="#fff5e9" />
      <hemisphereLight ref={sky} args={["#f2f3f5", "#665749", 1]} />
      <primitive object={shadowTarget} />
      <directionalLight
        target={shadowTarget}
        ref={sun}
        position={[3, 10, 25]}
        intensity={1.5}
        color="#fff6e7"
        castShadow={graphics === "high"}
        shadow-mapSize={graphics === "high" ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-normalBias={0.035}
        shadow-bias={-0.0003}
        shadow-radius={3}
      />
    </>
  );
}
