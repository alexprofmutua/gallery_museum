import { test, expect } from "@playwright/test";
import { enter, travel } from "./helpers";

test("photo 1 opens with E when looking at its caption plaque", async ({ page }) => {
  test.skip(process.env.PERSONAL_PREVIEW !== "1", "Requires the numbered personal collection.");
  test.setTimeout(45000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await enter(page);
  await page.keyboard.down("ShiftLeft");
  try {
    await travel(page, "KeyW", 2, 7.7);
    await travel(page, "KeyA", 0, -4.75);
  } finally { await page.keyboard.up("ShiftLeft"); }
  // Face back toward the entrance wall at normal eye height: the centre heart
  // sits on photo 1's caption, below its high landscape image.
  await page.mouse.move(1400, 500);
  await page.mouse.down();
  await page.mouse.move(34, 500, { steps: 24 });
  await page.mouse.up();
  await expect(page.locator("canvas")).toHaveAttribute("data-player-yaw", /.+/);
  await expect(page.getByRole("button", { name: "View memory" })).toBeVisible({ timeout: 3000 });
  await page.keyboard.press("KeyE");
  await expect(page.getByRole("dialog", { name: "Above the City", exact: true })).toBeVisible();
  await expect(page.getByText("ICC, on top of the World", { exact: true })).toBeVisible();
  await page.screenshot({ path: ".local-museum/review/photo-1-keyboard-open.png" });
});
