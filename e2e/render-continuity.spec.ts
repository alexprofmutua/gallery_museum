import { test, expect } from "@playwright/test";
import { enter } from "./helpers";

test("adaptive resolution survives movement and UI rerenders without snapping to full DPR", async ({ page }) => {
  test.setTimeout(45000);
  await enter(page);
  await page.evaluate(async () => {
    const url = performance.getEntriesByType("resource").map(e => e.name).find(n => n.includes("/@react-three_fiber.js"))!;
    const fiber = await import(/* @vite-ignore */ url);
    const state = fiber._roots.get(document.querySelector("canvas")).store;
    const clock = state.getState().clock;
    const original = clock.getDelta.bind(clock);
    // Exercise the real adaptive component's sustained-slow-frame path without
    // depending on the test machine/GPU actually being slow.
    clock.getDelta = () => .04;
    Object.assign(window, { __resolutionAudit: { state, restore: () => { clock.getDelta = original; original(); } } });
  });
  await page.waitForFunction(() => (window as unknown as { __resolutionAudit: { state: { getState: () => { gl: { getPixelRatio: () => number } } } } }).__resolutionAudit.state.getState().gl.getPixelRatio() < .99, null, { timeout: 15000 });
  const reduced = await page.evaluate(() => {
    const audit = (window as unknown as { __resolutionAudit: { restore: () => void; state: { getState: () => { gl: { getPixelRatio: () => number } } } } }).__resolutionAudit;
    audit.restore();
    return audit.state.getState().gl.getPixelRatio();
  });
  const start = JSON.parse(await page.locator("canvas").getAttribute("data-player-position") || "[]") as number[];
  await page.keyboard.down("KeyW");
  await expect.poll(async () => (JSON.parse(await page.locator("canvas").getAttribute("data-player-position") || "[]") as number[])[2]).toBeLessThan(start[2] - .1);
  await page.keyboard.up("KeyW");
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("dialog", { name: "Museum settings" }).getByRole("button", { name: "Close dialog" }).click();
  expect(await page.evaluate(() => (window as unknown as { __resolutionAudit: { state: { getState: () => { gl: { getPixelRatio: () => number } } } } }).__resolutionAudit.state.getState().gl.getPixelRatio())).toBeCloseTo(reduced, 2);
});

test("canvas resize is followed by a main-scene redraw before the next paint", async ({ page }) => {
  await enter(page);
  await page.evaluate(async () => {
    const url = performance.getEntriesByType("resource").map(e => e.name).find(n => n.includes("/@react-three_fiber.js"))!;
    const fiber = await import(/* @vite-ignore */ url);
    const { gl } = fiber._roots.get(document.querySelector("canvas")).store.getState();
    const audit = { changes: 0, blank: 0 };
    Object.assign(window, { __resizeAudit: audit });
    const original = gl.setSize.bind(gl);
    gl.setSize = (...args: Parameters<typeof gl.setSize>) => {
      const before = `${gl.domElement.width}:${gl.domElement.height}`;
      const result = original(...args);
      if (before !== `${gl.domElement.width}:${gl.domElement.height}`) {
        audit.changes++;
        queueMicrotask(() => {
          const ctx = gl.getContext(), sample = new Uint8Array(4);
          ctx.readPixels(10, 10, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, sample);
          if (sample[3] === 0) audit.blank++;
        });
      }
      return result;
    };
  });
  await page.setViewportSize({ width: 1110, height: 760 });
  await expect.poll(() => page.evaluate(() => (window as unknown as { __resizeAudit: { changes: number } }).__resizeAudit.changes)).toBeGreaterThan(0);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => (window as unknown as { __resizeAudit: { blank: number } }).__resizeAudit.blank)).toBe(0);
});
