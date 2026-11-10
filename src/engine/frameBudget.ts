/** Hysteresis prevents a single asset load or long frame from changing quality.
 * All DPR values are bounded; invalid timing samples never change resolution.
 */
export function budgetDecision(
  slowWindows: number,
  fastWindows: number,
  averageMs: number,
  dpr: number,
  min: number,
  max: number,
) {
  if (!Number.isFinite(averageMs) || averageMs <= 0 ||
      !Number.isFinite(dpr) || !Number.isFinite(min) ||
      !Number.isFinite(max) || min <= 0 || max < min) {
    return { dpr, slow: 0, fast: 0 };
  }

  const current = Math.min(max, Math.max(min, dpr));
  const slow = averageMs > 24 ? slowWindows + 1 : 0;
  const fast = averageMs < 18 ? fastWindows + 1 : 0;
  const next = slow >= 3
    ? Math.max(min, current - 0.15)
    : fast >= 5
      ? Math.min(max, current + 0.1)
      : current;
  const bounded = Math.min(max, Math.max(min, Number(next.toFixed(2))));
  return {
    dpr: bounded,
    slow: bounded !== current ? 0 : slow,
    fast: bounded !== current ? 0 : fast,
  };
}
