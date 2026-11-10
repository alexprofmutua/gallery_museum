import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useMuseum } from "../stores/museum";
import { budgetDecision } from "./frameBudget";

const WARMUP_SECONDS = 3;
const SAMPLE_SECONDS = 1.5;

/** Adapt render resolution using sustained frame-time trends, not isolated hitches.
 * Suspended tabs and long stalls must not be interpreted as GPU overload.
 */
export function AdaptiveResolution({ onDprChange }: { onDprChange: (dpr: number) => void }) {
  const graphics = useMuseum((state) => state.graphics);
  const { gl } = useThree();
  const samples = useRef({
    elapsed: 0,
    frames: 0,
    warmup: WARMUP_SECONDS,
    slow: 0,
    fast: 0,
  });

  useEffect(() => {
    samples.current = {
      elapsed: 0,
      frames: 0,
      warmup: WARMUP_SECONDS,
      slow: 0,
      fast: 0,
    };
  }, [graphics]);

  useEffect(() => {
    const resume = () => {
      if (document.hidden) return;
      samples.current = {
        elapsed: 0,
        frames: 0,
        warmup: WARMUP_SECONDS,
        slow: 0,
        fast: 0,
      };
    };
    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, []);

  useFrame((_, delta) => {
    const sample = samples.current;
    if (document.hidden) return;
    if (delta > 0.25) {
      // A long frame is usually an asset load or browser interruption.
      // Discard only this measurement window: restarting warmup here
      // could indefinitely disable adaptation during repeated hitches.
      sample.elapsed = 0;
      sample.frames = 0;
      return;
    }

    if (sample.warmup > 0) {
      sample.warmup = Math.max(0, sample.warmup - delta);
      return;
    }

    sample.elapsed += delta;
    sample.frames += 1;
    if (sample.elapsed < SAMPLE_SECONDS) return;

    const max = Math.min(window.devicePixelRatio, graphics === "high" ? 1.5 : 1);
    const min = Math.min(max, graphics === "high" ? 1 : 0.8);
    const current = gl.getPixelRatio();
    const result = budgetDecision(
      sample.slow,
      sample.fast,
      (sample.elapsed * 1000) / sample.frames,
      current,
      min,
      max,
    );

    if (Math.abs(result.dpr - current) >= 0.01) onDprChange(result.dpr);
    sample.slow = result.slow;
    sample.fast = result.fast;
    sample.elapsed = 0;
    sample.frames = 0;
  });
  return null;
}
