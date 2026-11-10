import { WarmShaders } from "../../engine/WarmShaders";
import { AdaptiveResolution } from "../../engine/AdaptiveResolution";
import { RenderEnvironment } from "../../engine/RenderEnvironment";
import { Suspense, useLayoutEffect, useState } from "react";
import { RenderContinuity } from "../../engine/RenderContinuity";
import type { RefObject } from "react";
import type { CharacterId } from "../../content/characters";
import type { VisitorPose } from "../../private/useSharedVisit";
import { VisitorAvatar } from "./VisitorAvatar";
import { Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Architecture } from "./Architecture";
import { Player } from "../../engine/Player";
import { useMuseum } from "../../stores/museum";
export function World({
  video,
  remote,
  guestCharacter,
}: {
  video: HTMLVideoElement | null;
  remote?: RefObject<VisitorPose | null>;
  guestCharacter: CharacterId;
}) {
  const graphics = useMuseum((state) => state.graphics);
  // Canvas configuration and adaptive quality must share a single DPR value.
  // Otherwise any parent update silently resets an adaptive reduction to max.
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio, graphics === "high" ? 1.5 : 1));
  useLayoutEffect(() => {
    setDpr(Math.min(window.devicePixelRatio, graphics === "high" ? 1.5 : 1));
  }, [graphics]);
  return (
    <Canvas
      fallback={
        <div className="scene-error">
          <h2>3D isn’t available in this browser.</h2>
          <button
            className="primary"
            onClick={() => useMuseum.getState().setMode("2d")}
          >
            Open accessible gallery
          </button>
        </div>
      }
      shadows
      dpr={dpr}
      camera={{ position: [0, 1.65, 20], fov: 57, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.domElement.setAttribute(
          "aria-label",
          "Interactive 3D museum. Use W A S D to walk and arrow keys to turn.",
        );
        gl.domElement.setAttribute("tabindex", "0");
        gl.domElement.title = "Blinded by your love ❤️";
      }}
    >
      <color attach="background" args={["#e4dccb"]} />
      <fog attach="fog" args={["#e4dccb", 65, 115]} />
      <RenderEnvironment />
      <AdaptiveResolution onDprChange={setDpr} />
      <RenderContinuity />
      <Suspense
        fallback={
          <Html center>
            <span className="scene-loading">Preparing your gallery…</span>
          </Html>
        }
      >
        <WarmShaders />
        <Physics timeStep={1 / 60}>
          <Architecture video={video} />
          <Player />
          {remote && (
            <VisitorAvatar remote={remote} guestCharacter={guestCharacter} />
          )}
        </Physics>
      </Suspense>
    </Canvas>
  );
}
