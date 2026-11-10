import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useMuseum } from "../stores/museum";
import { budgetDecision } from "./frameBudget";

export function AdaptiveResolution() {
  const graphics = useMuseum(state => state.graphics);
  const { gl, setDpr } = useThree();
  const samples = useRef({ elapsed: 0, frames: 0, warmup: 6, slow: 0, fast: 0 });
  useEffect(() => {
    samples.current = { elapsed: 0, frames: 0, warmup: 6, slow: 0, fast: 0 };
  }, [graphics]);
  useFrame((_, delta) => {
    const sample = samples.current;
    if (document.hidden || delta > 0.25) {
      sample.elapsed = sample.frames = sample.slow = sample.fast = 0;
      return;
    }
    if (sample.warmup > 0) { sample.warmup -= delta; return; }
    sample.elapsed += delta;
    sample.frames++;
    if (sample.elapsed < 1.5) return;
    const max = Math.min(window.devicePixelRatio, graphics === "high" ? 1.5 : 1);
    const min = Math.min(max, graphics === "high" ? 1 : 0.8);
    const result = budgetDecision(sample.slow, sample.fast, sample.elapsed * 1000 / sample.frames,
      gl.getPixelRatio(), min, max);
    if (result.dpr !== gl.getPixelRatio()) setDpr(result.dpr);
    Object.assign(sample, { slow: result.slow, fast: result.fast, elapsed: 0, frames: 0 });
  });
  return null;
}
