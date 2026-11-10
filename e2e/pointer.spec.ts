import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
async function enter(page: Page) {
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-player-position",
    /.+/,
    { timeout: 30000 },
  );
  await page
    .getByRole("button", { name: "Enter the museum", exact: true })
    .click();
}
test("mouse capture turns the camera and Escape releases it", async ({
  page,
}) => {
  let invalidDocument = false;
  page.on("console", (message) => {
    if (message.text().includes("WrongDocumentError")) invalidDocument = true;
  });
  await enter(page);
  await page.locator("canvas").click({ position: { x: 500, y: 350 } });
  await expect
    .poll(
      async () =>
        invalidDocument ||
        (await page.evaluate(() => Boolean(document.pointerLockElement))),
    )
    .toBe(true);
  test.skip(
    invalidDocument,
    "macOS automated Chrome rejects pointer lock with WrongDocumentError. Manual validation required; see Playwright #20956.",
  );
  const yaw = Number(
    await page.locator("canvas").getAttribute("data-player-yaw"),
  );
  await page.mouse.move(650, 350);
  await expect
    .poll(async () =>
      Number(await page.locator("canvas").getAttribute("data-player-yaw")),
    )
    .not.toBe(yaw);
  await page.keyboard.press("Escape");
  await expect
    .poll(() => page.evaluate(() => Boolean(document.pointerLockElement)))
    .toBe(false);
});
test("mouse drag fallback works when pointer lock is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.requestPointerLock = () =>
      Promise.reject(
        new DOMException("Unavailable for fallback test", "NotSupportedError"),
      );
  });
  await enter(page);
  const yaw = Number(
    await page.locator("canvas").getAttribute("data-player-yaw"),
  );
  await page.mouse.move(500, 350);
  await page.mouse.down();
  await page.mouse.move(650, 350, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () =>
      Number(await page.locator("canvas").getAttribute("data-player-yaw")),
    )
    .toBeLessThan(yaw - 0.1);
});

test("trackpad scrolling looks around the room and leaves dialog scrolling alone", async ({ page }) => {
  await enter(page);
  const canvas = page.locator("canvas");
  const yaw = Number(await canvas.getAttribute("data-player-yaw"));
  const pitch = Number(await canvas.getAttribute("data-player-pitch"));
  await page.mouse.move(600, 400);
  await page.mouse.wheel(140, 70);
  await expect.poll(async () => Number(await canvas.getAttribute("data-player-yaw"))).toBeLessThan(yaw - .1);
  await expect.poll(async () => Number(await canvas.getAttribute("data-player-pitch"))).toBeLessThan(pitch - .05);
  const currentYaw = Number(await canvas.getAttribute("data-player-yaw"));
  const pinchConsumed = await canvas.evaluate(element => {
    const event = new WheelEvent("wheel", { deltaX: 120, ctrlKey: true, cancelable: true });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(pinchConsumed).toBe(false);
  await page.getByRole("button", { name: "Open settings" }).click();
  const dialog = page.getByRole("dialog", { name: "Museum settings" });
  await dialog.hover();
  await page.mouse.wheel(120, 200);
  expect(Number(await canvas.getAttribute("data-player-yaw"))).toBeCloseTo(currentYaw, 3);
  await dialog.getByRole("button", { name: "Close dialog" }).click();
});

test("phone swipes turn the room and the walking joystick still works", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await enter(page);
    const canvas = page.locator("canvas");
    const yaw = Number(await canvas.getAttribute("data-player-yaw"));
    const client = await context.newCDPSession(page);
    // The left side above the joystick reaches the canvas directly.
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 65, y: 330 }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 145, y: 370 }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(async () => Number(await canvas.getAttribute("data-player-yaw"))).toBeLessThan(yaw - .1);
    await expect.poll(async () => Number(await canvas.getAttribute("data-player-pitch"))).toBeLessThan(-.05);
    const before = JSON.parse(await canvas.getAttribute("data-player-position") || "[]") as number[];
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 91, y: 675 }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 91, y: 635 }] });
    try {
      await expect.poll(async () => {
        const after = JSON.parse(await canvas.getAttribute("data-player-position") || "[]") as number[];
        return Math.hypot(after[0]-before[0], after[2]-before[2]);
      }).toBeGreaterThan(.5);
    } finally {
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    }
    await page.screenshot({ path: ".local-museum/review/phone-swipe-controls.png" });
  } finally { await context.close(); }
});
