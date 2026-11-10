import { describe, expect, it } from "vitest";
import { approachVelocity } from "../engine/input";
import { budgetDecision } from "../engine/frameBudget";

describe("movement response", () => {
  it("reaches the same velocity at 30 and 120 Hz without overshooting", () => {
    function run(hz: number) { let v = 0; for (let i = 0; i < hz; i++) v = approachVelocity(v, 2.6, 1 / hz); return v; }
    expect(run(30)).toBeCloseTo(run(120), 8);
    expect(run(120)).toBeLessThanOrEqual(2.6);
  });
  it("stops promptly with no residual drift", () => {
    let v = 2.6;
    for (let i = 0; i < 10; i++) v = approachVelocity(v, 0, 1 / 60);
    expect(v).toBe(0);
    expect(approachVelocity(-2, 2, 1 / 60)).toBeGreaterThan(-2);
  });
});

describe("render budget", () => {
  it("ignores isolated slow windows and requires sustained recovery", () => {
    expect(budgetDecision(0, 0, 40, 1.25, 0.8, 1.25).dpr).toBe(1.25);
    const reduced = budgetDecision(2, 0, 30, 1.25, 0.8, 1.25);
    expect(reduced).toEqual({ dpr: 1.1, slow: 0, fast: 0 });
    expect(budgetDecision(0, 3, 16.7, 1.1, 0.8, 1.25).dpr).toBe(1.1);
    expect(budgetDecision(0, 4, 16.7, 1.1, 0.8, 1.25).dpr).toBe(1.2);
  });
  it("respects quality limits and clears opposite history", () => {
    expect(budgetDecision(2, 0, 30, 0.8, 0.8, 1).dpr).toBe(0.8);
    expect(budgetDecision(0, 4, 16, 1.5, 1, 1.5).dpr).toBe(1.5);
    expect(budgetDecision(2, 0, 20, 1, 0.8, 1.5).slow).toBe(0);
  });
});
