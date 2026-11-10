/** Hysteresis prevents a single asset load or long frame from changing quality. */
export function budgetDecision(slowWindows: number, fastWindows: number,
  averageMs: number, dpr: number, min: number, max: number) {
  const slow = averageMs > 24 ? slowWindows + 1 : 0;
  const fast = averageMs < 18 ? fastWindows + 1 : 0;
  const next = slow >= 3 ? Math.max(min, dpr - 0.15)
    : fast >= 5 ? Math.min(max, dpr + 0.1) : dpr;
  return { dpr: Number(next.toFixed(2)), slow: next !== dpr ? 0 : slow, fast: next !== dpr ? 0 : fast };
}
