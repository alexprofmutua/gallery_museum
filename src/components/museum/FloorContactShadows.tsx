import { useLayoutEffect, useRef } from "react";
import { InstancedMesh, Matrix4 } from "three";
import { frameShadowTexture } from "./surfaceTextures";

export type FloorContact = readonly [x: number, z: number, width: number, depth: number];

// Baked contact shading anchors furnishings without another shadow-map pass.
export function FloorContactShadows({ contacts }: { contacts: readonly FloorContact[] }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    const scale = new Matrix4();
    contacts.forEach(([x, z, width, depth], index) => {
      matrix.makeRotationX(-Math.PI / 2)
        .multiply(scale.makeScale(width, depth, 1))
        .setPosition(x, 0.008, z);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [contacts]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, contacts.length]} renderOrder={1}>
      <planeGeometry />
      <meshBasicMaterial map={frameShadowTexture()} transparent opacity={0.22} depthWrite={false} />
    </instancedMesh>
  );
}
