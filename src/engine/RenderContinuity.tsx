import { useLayoutEffect } from "react";
import { useStore } from "@react-three/fiber";

/** A canvas resize clears its drawing buffer. Fiber's renderer resize subscriber
 * runs before this one, so refill the main target synchronously, without waiting
 * for a React effect or the next animation frame to reveal the light page below.
 */
export function RenderContinuity() {
  const store = useStore();
  useLayoutEffect(() => {
    let previousSize = "";
    const redraw = () => {
      const { gl, scene, camera, size, viewport } = store.getState();
      const nextSize = `${size.width}:${size.height}:${viewport.dpr}`;
      if (nextSize === previousSize) return;
      previousSize = nextSize;
      if (gl.getContext().isContextLost()) return;
      const previousTarget = gl.getRenderTarget();
      try {
        gl.setRenderTarget(null);
        gl.render(scene, camera);
      } finally {
        gl.setRenderTarget(previousTarget);
      }
    };
    redraw();
    return store.subscribe(redraw);
  }, [store]);
  return null;
}
