import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
export async function position(page: Page): Promise<number[]> {
  return JSON.parse(
    (await page.locator("canvas").getAttribute("data-player-position")) || "[]",
  ) as number[];
}
export async function enter(page: Page) {
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
export async function travel(
  page: Page,
  key: string,
  axis: 0 | 2,
  target: number,
  less = true,
) {
  await page.keyboard.down(key);
  try {
    await expect
      .poll(
        async () => {
          const value = (await position(page))[axis];
          return less ? value < target : value > target;
        },
        { timeout: 20000, intervals: [50, 100] },
      )
      .toBe(true);
  } finally {
    await page.keyboard.up(key);
  }
}
export async function gallery(page: Page) {
  await page.keyboard.down("ShiftLeft");
  await travel(page, "KeyW", 2, 6.5);
  await page.keyboard.up("ShiftLeft");
}
