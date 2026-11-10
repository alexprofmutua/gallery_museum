import { useEffect, useMemo } from "react";
import type { RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  DepthTexture, HalfFloatType, LinearFilter, Matrix4, Mesh, PerspectiveCamera,
  Plane, Texture, Vector3, Vector4, WebGLRenderTarget,
} from "three";
import { BlurPass } from "@react-three/drei/materials/BlurPass.js";
import { MeshReflectorMaterial } from "@react-three/drei/materials/MeshReflectorMaterial.js";

// Planar-camera and oblique-clipping math adapted from Drei 10.7.7 (MIT).
// See docs/third-party-reflection-license.txt. Unlike its component wrapper,
// this owner releases every render target, blur material, and screen geometry.
export function ReflectiveFloorMaterial({ floor, resolution, map, normalMap, color, roughness }: {
  floor: RefObject<Mesh | null>; resolution: number; map: Texture;
  normalMap?: Texture; color: string; roughness: number;
}) {
  const { gl, scene } = useThree();
  const resources = useMemo(() => {
    const parameters = { minFilter: LinearFilter, magFilter: LinearFilter, type: HalfFloatType };
    const sharp = new WebGLRenderTarget(resolution, resolution, parameters);
    sharp.depthTexture = new DepthTexture(resolution, resolution);
    const blurred = new WebGLRenderTarget(resolution, resolution, parameters);
    const blur = new BlurPass({ gl, resolution, width: 128, height: 64, depthScale: 0 });
    const matrix = new Matrix4();
    const material = new MeshReflectorMaterial({ map, normalMap, color, roughness });
    material.normalScale.set(0.24, 0.24);
    Object.assign(material, {
      tDiffuse: sharp.texture, tDepth: sharp.depthTexture, tDiffuseBlur: blurred.texture,
      textureMatrix: matrix, hasBlur: true, mirror: 0.2, mixBlur: 1, mixStrength: 0.85,
      depthScale: 0, mixContrast: 1, depthToBlurRatioBias: 0.25,
    });
    Object.assign(material, { defines: { USE_BLUR: "" } });
    return { sharp, blurred, blur, matrix, material, camera: new PerspectiveCamera(),
      plane: new Plane(), normal: new Vector3(), origin: new Vector3(), eye: new Vector3(),
      rotation: new Matrix4(), look: new Vector3(), view: new Vector3(), target: new Vector3(),
      clip: new Vector4(), q: new Vector4() };
  }, [gl, resolution, map, normalMap, color, roughness]);
  useEffect(() => () => {
    const r = resources;
    r.sharp.depthTexture?.dispose();
    r.sharp.dispose(); r.blurred.dispose();
    r.blur.renderTargetA.dispose(); r.blur.renderTargetB.dispose();
    r.blur.convolutionMaterial.dispose(); r.blur.screen.geometry.dispose();
    r.material.dispose();
  }, [resources]);
  useFrame(({ camera }) => {
    const parent = floor.current;
    if (!parent || !(camera instanceof PerspectiveCamera)) return;
    const r = resources;
    parent.updateWorldMatrix(true, false);
    r.origin.setFromMatrixPosition(parent.matrixWorld);
    r.eye.setFromMatrixPosition(camera.matrixWorld);
    r.rotation.extractRotation(parent.matrixWorld);
    r.normal.set(0, 0, 1).applyMatrix4(r.rotation);
    r.origin.addScaledVector(r.normal, 0.015);
    r.view.subVectors(r.origin, r.eye);
    if (r.view.dot(r.normal) > 0) return;
    r.view.reflect(r.normal).negate().add(r.origin);
    r.rotation.extractRotation(camera.matrixWorld);
    r.look.set(0, 0, -1).applyMatrix4(r.rotation).add(r.eye);
    r.target.subVectors(r.origin, r.look).reflect(r.normal).negate().add(r.origin);
    r.camera.position.copy(r.view);
    r.camera.up.set(0, 1, 0).applyMatrix4(r.rotation).reflect(r.normal);
    r.camera.lookAt(r.target);
    r.camera.far = camera.far;
    r.camera.updateMatrixWorld();
    r.camera.projectionMatrix.copy(camera.projectionMatrix);
    r.matrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
      .multiply(r.camera.projectionMatrix).multiply(r.camera.matrixWorldInverse).multiply(parent.matrixWorld);
    r.plane.setFromNormalAndCoplanarPoint(r.normal, r.origin).applyMatrix4(r.camera.matrixWorldInverse);
    r.clip.set(r.plane.normal.x, r.plane.normal.y, r.plane.normal.z, r.plane.constant);
    const projection = r.camera.projectionMatrix.elements;
    r.q.set((Math.sign(r.clip.x) + projection[8]) / projection[0],
      (Math.sign(r.clip.y) + projection[9]) / projection[5], -1, (1 + projection[10]) / projection[14]);
    r.clip.multiplyScalar(2 / r.clip.dot(r.q));
    projection[2] = r.clip.x; projection[6] = r.clip.y;
    projection[10] = r.clip.z + 1; projection[14] = r.clip.w;
    const visible = parent.visible, xr = gl.xr.enabled, shadows = gl.shadowMap.autoUpdate;
    const previousTarget = gl.getRenderTarget();
    try {
      parent.visible = false;
      gl.xr.enabled = false;
      gl.shadowMap.autoUpdate = false;
      gl.setRenderTarget(r.sharp);
      gl.state.buffers.depth.setMask(true);
      gl.clear();
      gl.render(scene, r.camera);
      r.blur.render(gl, r.sharp, r.blurred);
    } finally {
      parent.visible = visible;
      gl.xr.enabled = xr;
      gl.shadowMap.autoUpdate = shadows;
      gl.setRenderTarget(previousTarget);
    }
  });
  return <primitive object={resources.material} attach="material" dispose={null} />;
}
