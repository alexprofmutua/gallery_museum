import { expect, test } from "@playwright/test";
import { enter, position } from "./helpers";

for (const character of [
  { name: "Blue Whale", model: "alex-taper", other: "Starfish", otherModel: "starfish-braids" },
  { name: "Starfish", model: "starfish-braids", other: "Blue Whale", otherModel: "alex-taper" },
]) test(`${character.name} animates, remounts and switches identity`, async ({ page }) => {
  test.skip(process.env.PERSONAL_PREVIEW !== "1", "Requires the private local character asset and personal Vite server.");
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await enter(page);
  await page.getByRole("button", { name: "Open settings" }).click();
  const settings = page.getByRole("dialog", { name: "Museum settings" });
  await settings.getByText(character.name, { exact: true }).click();
  await settings.getByRole("button", { name: "Show visitor character" }).click();
  await settings.getByRole("button", { name: "Close dialog" }).click();
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveAttribute("data-avatar-model", character.model, { timeout: 30000 });
  await expect(canvas).toHaveAttribute("data-avatar-action", "Idle");
  const before = await position(page);
  await page.keyboard.down("KeyW");
  try {
    await expect(canvas).toHaveAttribute("data-avatar-action", "Run");
    await expect.poll(async () => (await position(page))[2]).toBeLessThan(before[2] - .5);
  } finally {
    await page.keyboard.up("KeyW");
  }
  await expect(canvas).toHaveAttribute("data-avatar-action", "Idle");
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press("KeyV");
    await expect(canvas).toHaveAttribute("data-avatar-visible", "false");
    await page.keyboard.press("KeyV");
    await expect(canvas).toHaveAttribute("data-avatar-visible", "true");
    await expect(canvas).toHaveAttribute("data-avatar-action", "Idle");
  }
  if (character.name === "Starfish") {
    await page.keyboard.down("KeyS");
    await page.waitForTimeout(180);
    await page.keyboard.up("KeyS");
    await expect(canvas).toHaveAttribute("data-avatar-action", "Idle");
    await page.screenshot({ path: ".local-museum/girlfriend-preview/museum-starfish.png" });
  }
  await page.getByRole("button", { name: "Open settings" }).click();
  await settings.getByText(character.other, { exact: true }).click();
  await settings.getByRole("button", { name: "Close dialog" }).click();
  await expect(canvas).toHaveAttribute("data-avatar-model", character.otherModel, { timeout: 30000 });
  await expect(canvas).toHaveAttribute("data-avatar-action", "Idle");
  expect(errors).toEqual([]);
});
