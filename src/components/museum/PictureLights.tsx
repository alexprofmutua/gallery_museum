import { useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { InstancedMesh, Matrix4 } from "three";
import type { Memory } from "../../content/museum";

// Shared geometry keeps a dedicated lamp over every photograph inexpensive.
export function PictureLights({ memories, roomId }: { memories: readonly Memory[]; roomId: Memory["roomId"] }) {
  const housings = useRef<InstancedMesh>(null);
  const lenses = useRef<InstancedMesh>(null);
  const { gl } = useThree();
  useLayoutEffect(() => {
    if (!housings.current || !lenses.current) return;
    const parent = new Matrix4(), part = new Matrix4(), world = new Matrix4();
    memories.forEach((memory, index) => {
      parent.makeRotationY(memory.rotationY).setPosition(...memory.position);
      const width = Math.min(0.8, memory.frame.width * 0.66);
      const y = memory.frame.height / 2 + 0.13;
      const place = (mesh: InstancedMesh, slot: number, x: number, py: number, z: number, w: number, h: number, d: number) => {
        part.makeScale(w, h, d).setPosition(x, py, z);
        mesh.setMatrixAt(slot, world.multiplyMatrices(parent, part));
      };
      place(housings.current!, index * 2, 0, y, 0.11, 0.04, 0.045, 0.22);
      place(housings.current!, index * 2 + 1, 0, y, 0.23, width, 0.055, 0.09);
      place(lenses.current!, index, 0, y - 0.031, 0.23, width * 0.87, 0.008, 0.065);
    });
    for (const mesh of [housings.current, lenses.current]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    if (import.meta.env.DEV)
      gl.domElement.setAttribute(`data-picture-light-count-${roomId}`, String(memories.length));
  }, [gl, memories, roomId]);
  return (
    <group name={`picture-lights-${roomId}`}>
      <instancedMesh ref={housings} args={[undefined, undefined, memories.length * 2]}>
        <boxGeometry />
        <meshStandardMaterial color="#9a7952" metalness={0.35} roughness={0.42} />
      </instancedMesh>
      <instancedMesh ref={lenses} args={[undefined, undefined, memories.length]}>
        <boxGeometry />
        <meshBasicMaterial color="#fff3df" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
