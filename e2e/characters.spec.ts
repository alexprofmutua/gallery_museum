import { expect, test } from "@playwright/test";

test("choose Starfish before entering and switch to Blue Whale in Settings", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 667 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    const picker = page.getByRole("group", {
      name: "Choose your visitor identity",
    });
    await expect(
      picker.getByRole("radio", { name: "Blue Whale" }),
    ).toBeChecked();
    await picker.getByText("Starfish", { exact: true }).tap();
    await expect(picker.getByRole("radio", { name: "Starfish" })).toBeChecked();
    await page
      .getByRole("button", { name: "Enter the museum", exact: true })
      .tap();
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveAttribute("data-visitor-character", "starfish");
    await expect(canvas).toHaveAttribute("data-camera-view", "first");
    await expect(canvas).toHaveAttribute("data-avatar-visible", "false");
    await page.getByRole("button", { name: "Open settings" }).tap();
    const settings = page.getByRole("dialog", { name: "Museum settings" });
    await settings.getByText("Blue Whale", { exact: true }).tap();
    await settings
      .getByRole("button", { name: "Show visitor character" })
      .tap();
    await settings.getByRole("button", { name: "Close dialog" }).tap();
    await expect(canvas).toHaveAttribute(
      "data-visitor-character",
      "blue-whale",
    );
    await expect(canvas).toHaveAttribute("data-avatar-visible", "true");
    await page.getByRole("button", { name: "Open settings" }).tap();
    await settings
      .getByRole("button", { name: "Open accessible 2D gallery" })
      .tap();
    await page.getByRole("button", { name: "Return to 3D museum" }).tap();
    await expect(canvas).toHaveAttribute("data-camera-view", "first");
    await expect(canvas).toHaveAttribute("data-avatar-visible", "false");
    await expect(canvas).toHaveAttribute(
      "data-visitor-character",
      "blue-whale",
    );
  } finally {
    await context.close();
  }
});
