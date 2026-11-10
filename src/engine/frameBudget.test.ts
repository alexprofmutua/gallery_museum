import { describe, expect, it } from "vitest";
import { budgetDecision } from "./frameBudget";

describe("adaptive render budget", () => {
  it("does not reduce quality after a single slow window", () => {
    expect(budgetDecision(0, 0, 30, 1.5, 1, 1.5)).toEqual({
      dpr: 1.5,
      slow: 1,
      fast: 0,
    });
  });

  it("reduces DPR after three consecutive slow windows", () => {
    const result = budgetDecision(2, 0, 30, 1.5, 1, 1.5);
    expect(result.dpr).toBe(1.35);
    expect(result.slow).toBe(0);
  });

  it("recovers DPR only after five fast windows", () => {
    expect(budgetDecision(0, 3, 12, 1, 0.8, 1.5).dpr).toBe(1);
    expect(budgetDecision(0, 4, 12, 1, 0.8, 1.5).dpr).toBe(1.1);
  });

  it("respects the minimum and maximum quality limits", () => {
    expect(budgetDecision(2, 0, 30, 1, 1, 1.5).dpr).toBe(1);
    expect(budgetDecision(0, 4, 12, 1.5, 1, 1.5).dpr).toBe(1.5);
  });

  it("resets streaks when frame time returns to the neutral band", () => {
    expect(budgetDecision(2, 4, 20, 1.2, 1, 1.5)).toEqual({
      dpr: 1.2,
      slow: 0,
      fast: 0,
    });
  });

  it("ignores invalid or missing timing measurements", () => {
    expect(budgetDecision(2, 4, Number.NaN, 1.2, 0.8, 1.5)).toEqual({
      dpr: 1.2, slow: 0, fast: 0,
    });
    expect(budgetDecision(2, 4, Infinity, 1.2, 0.8, 1.5).dpr).toBe(1.2);
    expect(budgetDecision(2, 4, 0, 1.2, 0.8, 1.5).dpr).toBe(1.2);
  });

  it("clamps an out-of-range DPR without overshooting quality bounds", () => {
    expect(budgetDecision(0, 0, 20, 2, 0.8, 1.5).dpr).toBe(1.5);
    expect(budgetDecision(0, 0, 20, 0.5, 0.8, 1.5).dpr).toBe(0.8);
  });

});
