import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const memories = JSON.parse(
  readFileSync(
    new URL("../src/content/memories.json", import.meta.url),
    "utf8",
  ),
) as Array<{ id: string; title: string; caption: string; alt: string }>;
import { enter, travel } from "./helpers";
test("all 30 memories open the correct content, keep image proportions, and persist progress", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore the accessible gallery" })
    .click();
  await expect(page.locator(".gallery-item")).toHaveCount(30);
  for (const memory of memories) {
    await page.getByTestId(`memory-card-${memory.id}`).click();
    const dialog = page.getByRole("dialog", { name: memory.title });
    await expect(
      dialog.getByRole("heading", { name: memory.title, exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByText(memory.caption, { exact: true }),
    ).toBeVisible();
    const image = dialog.getByRole("img", { name: memory.alt });
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    const ratio = await image.evaluate((img: HTMLImageElement) => {
      const r = img.getBoundingClientRect(),
        s = getComputedStyle(img);
      return {
        display:
          (r.width -
            parseFloat(s.borderLeftWidth) -
            parseFloat(s.borderRightWidth)) /
          (r.height -
            parseFloat(s.borderTopWidth) -
            parseFloat(s.borderBottomWidth)),
        source: img.naturalWidth / img.naturalHeight,
      };
    });
    expect(ratio.display).toBeCloseTo(ratio.source, 1);
    if (memory.id === "memory-03")
      await page.screenshot({ path: "docs/screenshots/memory-portrait.png" });
    await dialog.getByRole("button", { name: "Close dialog" }).click();
  }
  await expect(page.getByText("30 / 30 viewed", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "Unseen only" }).check();
  await expect(page.getByRole("status")).toContainText("No memories match");
  await page.getByRole("checkbox", { name: "Unseen only" }).uncheck();
  await page
    .getByRole("searchbox", { name: "Search memories" })
    .fill("Memory 30");
  await expect(page.locator(".gallery-item")).toHaveCount(1);
  await page.getByRole("searchbox").fill("");
  await page.screenshot({ path: "docs/screenshots/collection-desktop.png" });
  await page.reload();
  await page
    .getByRole("button", { name: "Explore the accessible gallery" })
    .click();
  await expect(page.getByText("30 / 30 viewed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: /Reset viewed memories/ }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.getByText("0 / 30 viewed", { exact: true })).toBeVisible();
});
test("3D frames load nearby media and a missing image preserves navigation and its memory", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  const images: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("/images/")) images.push(r.url());
  });
  await page.route("**/images/memories/memory-02.svg", (route) =>
    route.abort(),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await enter(page);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-rendered-exhibits",
    "30",
  );
  expect(images).toHaveLength(0);
  await page.keyboard.down("ShiftLeft");
  await travel(page, "KeyW", 2, 13.4);
  await expect.poll(()=>new Set(images).size).toBeGreaterThan(0);
  expect(new Set(images).size).toBeLessThan(30);
  await travel(page, "KeyW", 2, 6.5);
  await page.keyboard.up("ShiftLeft");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-media-first-memory",
    "ready",
  );
  await expect.poll(()=>page.locator('canvas').evaluate(canvas=>Array.from(canvas.attributes).filter(a=>a.name.startsWith('data-media-')&&a.value==='ready').length)).toBe(29);
  const galleryFps=await page.evaluate(()=>new Promise<number>(resolve=>{const start=performance.now();let frames=0;function frame(){if(++frames===90)resolve(frames*1000/(performance.now()-start));else requestAnimationFrame(frame);}requestAnimationFrame(frame);}));
  console.log('Active gallery sample, 29 loaded artworks and one simulated failure:',{fps:galleryFps,drawCalls:await page.locator('canvas').getAttribute('data-draw-calls'),resources:await page.locator('canvas').getAttribute('data-gpu-resources')});
  await page.screenshot({ path: "docs/screenshots/collection-3d.png" });
  await page.keyboard.down("ShiftLeft");
  await travel(page, "KeyW", 2, -5.8);
  await travel(page, "KeyA", 0, -4.7);
  await travel(page, "KeyW", 2, -6.5);
  await page.keyboard.up("ShiftLeft");
  await page.mouse.move(700, 500);
  await page.mouse.down();
  await page.mouse.move(17, 500, { steps: 16 });
  await page.mouse.up();
  await expect
    .poll(async () =>
      Number(await page.locator("canvas").getAttribute("data-player-yaw")),
    )
    .toBeCloseTo(Math.PI / 2, 1);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-media-memory-02",
    "error",
  );
  await expect(page.getByRole("button", { name: "View memory" })).toBeVisible();
  await page.locator("canvas").click({ position: { x: 720, y: 500 } });
  const dialog = page.getByRole("dialog", { name: "Memory 02" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("status")).toContainText("Image unavailable");
  await page.screenshot({ path: "docs/screenshots/memory-unavailable.png" });
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-rendered-exhibits",
    "30",
  );
  expect(errors).toEqual([]);
});
test("mobile collection supports tapping, portrait media and readable close controls", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore the accessible gallery" })
    .tap();
  await page.getByTestId("memory-card-memory-03").tap();
  const dialog = page.getByRole("dialog", { name: "Memory 03" });
  await expect(
    dialog.getByRole("heading", { name: "Memory 03" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      dialog
        .locator("img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.screenshot({ path: "docs/screenshots/memory-mobile.png" });
  await dialog.getByRole("button", { name: "Close dialog" }).tap();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await context.close();
});

test("invalid content opens a recovery screen instead of a blank page", async ({
  page,
}) => {
  await page.route("**/src/content/memories.json*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "export default [];",
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "The collection couldn’t load." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reload museum" }),
  ).toBeVisible();
});
