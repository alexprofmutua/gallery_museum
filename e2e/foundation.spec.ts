import { test, expect } from "@playwright/test";
import { enter, gallery, position, travel } from "./helpers";
test("desktop movement, collision, memory interaction, reset, and fallback", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await enter(page);
  await page.screenshot({ path: "docs/screenshots/entrance-desktop.png" });
  await gallery(page);
  await page.screenshot({ path: "docs/screenshots/gallery-desktop.png" });
  const start = await position(page);
  await travel(page, "KeyD", 0, 2, false);
  expect((await position(page))[0]).toBeGreaterThan(start[0] + 1);
  await page.keyboard.down("ShiftLeft");
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1800);
  await page.keyboard.up("KeyD");
  await page.keyboard.up("ShiftLeft");
  expect((await position(page))[0]).toBeLessThan(6.8);
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Reset walking position" }).click();
  await gallery(page);
  await page.keyboard.down("ShiftLeft");
  await travel(page, "KeyW", 2, -5);
  await travel(page, "KeyA", 0, -3.65);
  await travel(page, "KeyW", 2, -6.5);
  await page.keyboard.up("ShiftLeft");
  await expect(page.getByRole("button", { name: "View memory" })).toBeVisible();
  await page.keyboard.press("KeyE");
  await expect(
    page.getByRole("dialog", { name: "A moment to keep" }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/memory-desktop.png" });
  const paused = await position(page);
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(400);
  await page.keyboard.up("KeyS");
  expect((await position(page))[2]).toBeCloseTo(paused[2], 1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await travel(page, "KeyS", 2, paused[2] + 0.5, false);
  await page.getByRole("button", { name: "Open settings" }).click();
  await page
    .getByRole("button", { name: "Open accessible 2D gallery" })
    .click();
  await expect(
    page.getByRole("heading", { name: "The Gallery of Us" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /01 \/ PLACEHOLDER/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});
test("touch joystick and camera gestures work in the entrance", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await enter(page);
  const start = await position(page);
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 91, y: 675 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 91, y: 635 }],
  });
  await page.waitForTimeout(1000);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect((await position(page))[2]).toBeLessThan(start[2] - 0.5);
  const yaw = Number(
    await page.locator("canvas").getAttribute("data-player-yaw"),
  );
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 280, y: 400 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 330, y: 400 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(async () =>
      Number(await page.locator("canvas").getAttribute("data-player-yaw")),
    )
    .toBeLessThan(yaw - 0.05);
  await page.screenshot({ path: "docs/screenshots/entrance-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await context.close();
});
