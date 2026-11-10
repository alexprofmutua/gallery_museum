import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/** Prepare mounted geometry once during startup. Room light counts stay fixed,
 * so walking through a doorway no longer needs a different lighting shader.
 */
export function WarmShaders() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    void gl.compileAsync(scene, camera).catch(error => {
      console.warn("Initial shader preparation deferred:", error);
    });
  }, [gl, scene, camera]);
  return null;
}
