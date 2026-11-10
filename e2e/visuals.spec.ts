import { cinemaRoom, foreverRoom, roomCenterZ } from "../src/content/layout";
import { test, expect } from "@playwright/test";
import { enter, position, travel } from "./helpers";
import type { Page } from "@playwright/test";
async function drag(page: Page, from: [number, number], to: [number, number]) {
  await page.mouse.move(...from);
  await page.mouse.down();
  await page.mouse.move(...to, { steps: 10 });
  await page.mouse.up();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
}
test("cinema screen, sanctuary roof, and reduced-motion doors are visible", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enter(page);
  await page.keyboard.down("ShiftLeft");
  await travel(page, "KeyW", 2, -18);
  await travel(page, "KeyW", 2, roomCenterZ(cinemaRoom));
  await page.keyboard.up("ShiftLeft");
  await drag(page, [750, 450], [100, 450]);
  await page.screenshot({ path: "docs/screenshots/cinema-screen.png" });
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Reset walking position" }).click();
  await expect.poll(async () => (await position(page))[2]).toBeCloseTo(20, 1);
  await page.keyboard.down("ShiftLeft");
  await travel(page, "KeyW", 2, -18);
  await travel(page, "KeyW", 2, roomCenterZ(cinemaRoom));
  await travel(page, "KeyW", 2, foreverRoom.maxZ - 6);
  await page.keyboard.up("ShiftLeft");
  await drag(page, [700, 650], [700, 250]);
  await page.screenshot({ path: "docs/screenshots/sanctuary-glass-roof.png" });
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-door-cinema-forever",
    "open",
  );
  await page.getByRole("button", { name: "Open settings" }).click();
  await page
    .getByRole("button", { name: "Open accessible 2D gallery" })
    .click();
  await expect(
    page.getByRole("heading", { name: "The Gallery of Us" }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/accessible-from-sanctuary.png",
  });
});
