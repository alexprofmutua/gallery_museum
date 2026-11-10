import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping, PMREMGenerator, SRGBColorSpace } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { useMuseum } from "../stores/museum";

/** A single prefiltered indoor light probe, shared by every physical material.
 * It supplies reflected light only; the walkable architecture stays real geometry.
 */
export function RenderEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    gl.outputColorSpace = SRGBColorSpace;
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1;
    const generator = new PMREMGenerator(gl);
    const studio = new RoomEnvironment();
    const probe = generator.fromScene(studio, 0.04);
    const previous = scene.environment;
    const previousIntensity = scene.environmentIntensity;
    scene.environmentIntensity = 0.32;
    scene.environment = probe.texture;
    studio.dispose();
    generator.dispose();
    return () => {
      scene.environment = previous;
      scene.environmentIntensity = previousIntensity;
      probe.dispose();
    };
  }, [gl, scene]);
  useFrame((_, delta) => {
    const state = useMuseum.getState();
    const target = state.currentRoom === "cinema"
      ? state.feature === "cinema" ? 0.025 : 0.12
      : state.currentRoom === "forever" ? 0.26 : state.currentRoom === "gallery" ? 0.24 : 0.32;
    scene.environmentIntensity += (target - scene.environmentIntensity) * (1 - Math.exp(-delta * 4));
  });
  return null;
}
