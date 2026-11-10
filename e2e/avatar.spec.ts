import { cinemaRoom, foreverRoom, roomCenterZ } from "../src/content/layout";
import { test, expect } from "@playwright/test";
import { enter, position, travel } from "./helpers";
async function cameraPosition(
  page: import("@playwright/test").Page,
): Promise<number[]> {
  return JSON.parse(
    (await page.locator("canvas").getAttribute("data-camera-position")) || "[]",
  ) as number[];
}
test("visible visitor, view toggle, wall-safe chase camera, memories, and all doors", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await enter(page);
  const spawn = await position(page);
  await page.keyboard.press("KeyV");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-camera-view",
    "third",
  );
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-avatar-visible",
    "true",
  );
  expect((await position(page))[2]).toBeCloseTo(spawn[2], 1);
  expect((await cameraPosition(page))[2]).toBeGreaterThan(spawn[2] + 2);
  await page.screenshot({ path: "docs/screenshots/third-person-entrance.png" });
  await page.keyboard.press("KeyV");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-camera-view",
    "first",
  );
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-avatar-visible",
    "false",
  );
  await page.keyboard.press("KeyV");
  await page.keyboard.down("ShiftLeft");
  await travel(page, "KeyS", 2, 23.5, false);
  await page.keyboard.up("ShiftLeft");
  expect((await cameraPosition(page))[2]).toBeLessThan(23.9);
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Reset walking position" }).click();
  await page.keyboard.down("ShiftLeft");
  await travel(page, "KeyW", 2, 13.4);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-door-entrance-gallery",
    /opening|open/,
  );
  await travel(page, "KeyW", 2, -5);
  await travel(page, "KeyA", 0, -3.65);
  await travel(page, "KeyW", 2, -6.5);
  await page.keyboard.up("ShiftLeft");
  await expect(page.getByRole("button", { name: "View memory" })).toBeVisible();
  await page.keyboard.press("KeyE");
  await expect(
    page.getByRole("dialog", { name: "A moment to keep" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.down("ShiftLeft");
  await travel(page, "KeyD", 0, -0.1, false);
  for (const [room, z] of [
    ["corridor", -16],
    ["cinema", roomCenterZ(cinemaRoom) + 1],
    ["forever", foreverRoom.maxZ - 6],
  ] as const) {
    await travel(page, "KeyW", 2, z);
    await expect(page.locator("canvas")).toHaveAttribute("data-room", room);
  }
  await page.keyboard.up("ShiftLeft");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-avatar-visible",
    "true",
  );
  await page.screenshot({
    path: "docs/screenshots/third-person-sanctuary.png",
  });
  expect(errors).toEqual([]);
});
test("touch visitors can toggle and walk in character view", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await enter(page);
  await page.getByRole("button", { name: "Open settings" }).tap();
  const settings = page.getByRole("dialog", { name: "Museum settings" });
  await settings.getByRole("button", { name: "Show visitor character" }).tap();
  await settings.getByRole("button", { name: "Close dialog" }).tap();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-avatar-visible",
    "true",
  );
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
  await page.screenshot({ path: "docs/screenshots/third-person-mobile.png" });
  await context.close();
});
test('third-person camera stays below the low corridor ceiling', async ({page}) => {
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await enter(page);await page.keyboard.press('KeyV');await page.keyboard.down('ShiftLeft');await travel(page,'KeyW',2,-16);await page.keyboard.up('ShiftLeft');
 await page.mouse.move(700,300);await page.mouse.down();await page.mouse.move(700,650,{steps:10});await page.mouse.up();await page.keyboard.press('Escape');await page.waitForTimeout(200);
 const camera=await cameraPosition(page);expect(camera[1]).toBeLessThan(4.33);expect(camera[1]).toBeGreaterThan(3.5);
 await page.screenshot({path:'docs/screenshots/third-person-corridor-ceiling.png'});
});
