import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { placedPortraits } from "../src/content/portraits";
import { enter, travel } from "./helpers";

const left = placedPortraits.find(
  ({ portrait }) => portrait.id === "moon-gate",
)!;
const right = placedPortraits.find(
  ({ portrait }) => portrait.id === "swan-water",
)!;
const prompt = (page: Page, title: string) =>
  page.getByRole("button", { name: `Play Portrait: ${title}` });
const source = (page: Page) => page.locator(".portrait-panel video");

async function corridor(page: Page) {
  await enter(page);
  await page.keyboard.down("ShiftLeft");
  try {
    await travel(page, "KeyW", 2, -12.6);
  } finally {
    await page.keyboard.up("ShiftLeft");
  }
  await expect(page.locator("main")).toHaveAttribute("data-room", "corridor");
}

async function playbackTime(page: Page) {
  return source(page).evaluate((video: HTMLVideoElement) => video.currentTime);
}

test("corridor media is gesture-only and stops when the visitor leaves", async ({
  page,
}) => {
  test.setTimeout(90000);
  const videos = new Set<string>();
  const thumbnails = new Set<string>();
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith("/media/portraits/")) {
      if (path.endsWith(".mp4")) videos.add(path);
      if (path.endsWith(".jpg")) thumbnails.add(path);
    }
  });
  await corridor(page);
  await expect.poll(() => thumbnails.size).toBe(6);
  await page.keyboard.press("KeyE");
  await expect(source(page)).toHaveCount(0);
  await travel(page, "KeyW", 2, left.z - 0.55);
  await expect(source(page)).toHaveCount(0);
  await travel(page, "KeyA", 0, -1);
  await expect(prompt(page, left.portrait.title)).toBeVisible();
  await page.keyboard.down("ArrowLeft");
  try {
    await page.waitForFunction(() =>
      Number(document.querySelector("canvas")?.dataset.playerYaw) > 1.5,
    );
  } finally {
    await page.keyboard.up("ArrowLeft");
  }
  await expect(prompt(page, left.portrait.title)).toBeVisible();
  expect(videos.size).toBe(0);
  await page.keyboard.press("KeyE");
  await expect.poll(() => playbackTime(page)).toBeGreaterThan(0.2);
  expect([...videos]).toEqual([left.portrait.video]);

  const controls = page.getByRole("group", {
    name: "Portrait playback controls",
  });
  await controls.getByRole("button", { name: "Pause", exact: true }).click();
  await expect
    .poll(() =>
      source(page).evaluate((video: HTMLVideoElement) => video.paused),
    )
    .toBe(true);
  await controls.getByRole("button", { name: "Unmute" }).click();
  await expect
    .poll(() => source(page).evaluate((video: HTMLVideoElement) => video.muted))
    .toBe(false);
  await controls.getByRole("button", { name: "Resume" }).click();
  await expect
    .poll(() =>
      source(page).evaluate((video: HTMLVideoElement) => video.paused),
    )
    .toBe(false);
  await controls.getByRole("button", { name: "Replay" }).click();
  await expect.poll(() => playbackTime(page)).toBeLessThan(1);
  await controls.getByRole("button", { name: "Expand video" }).click();
  const expanded = page.getByRole("dialog", { name: left.portrait.title });
  await expect(expanded.locator("video")).toBeVisible();
  await expanded.getByRole("button", { name: "Return to frame" }).click();
  await controls.getByRole("button", { name: "Stop" }).click();
  await expect(source(page)).toHaveCount(0);

  await prompt(page, left.portrait.title).focus();
  await page.keyboard.press("Space");
  await expect.poll(() => playbackTime(page)).toBeGreaterThan(0.2);
  const previous = await source(page).elementHandle();
  await page.keyboard.down("ArrowRight");
  try {
    await page.waitForFunction(() =>
      Number(document.querySelector("canvas")?.dataset.playerYaw) < 0.02,
    );
  } finally {
    await page.keyboard.up("ArrowRight");
  }
  await travel(page, "KeyD", 0, 1.25, false);
  await expect(source(page)).toHaveCount(0);
  expect(
    await previous!.evaluate((video: HTMLVideoElement) => ({
      paused: video.paused,
      src: video.getAttribute("src"),
    })),
  ).toEqual({ paused: true, src: null });
  await expect(prompt(page, right.portrait.title)).toBeVisible();
  await page.keyboard.press("KeyE");
  await expect.poll(() => playbackTime(page)).toBeGreaterThan(0.2);
  await expect(source(page)).toHaveAttribute("src", right.portrait.video);
  await expect(page.locator("video")).toHaveCount(1);
  await source(page).evaluate((video: HTMLVideoElement) => {
    video.currentTime = video.duration - 0.1;
  });
  await expect(source(page)).toHaveCount(0);
  await expect(prompt(page, right.portrait.title)).toBeVisible();
  await travel(page, "KeyA", 0, -1);
  await expect(prompt(page, left.portrait.title)).toBeVisible();
  await expect(source(page)).toHaveCount(0);
});

test.describe("touch and reduced motion", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  test("only tapping Play Portrait starts mobile playback", async ({
    page,
  }) => {
    test.setTimeout(85000);
    await corridor(page);
    await travel(page, "KeyW", 2, left.z + 0.12);
    await travel(page, "KeyA", 0, -1);
    await page.touchscreen.tap(190, 210);
    await expect(source(page)).toHaveCount(0);
    await expect(
      page.getByText("Play Portrait ▶", { exact: true }),
    ).toBeVisible();
    await prompt(page, left.portrait.title).tap();
    await expect.poll(() => playbackTime(page)).toBeGreaterThan(0.2);
    await page.getByRole("button", { name: "Stop", exact: true }).tap();
    await expect(source(page)).toHaveCount(0);
  });
});

test("the accessible gallery plays the same clip with native controls", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore the accessible gallery" })
    .click();
  await page.getByText("Living Portrait Corridor", { exact: true }).click();
  await page.getByRole("button", { name: "Play The Moon Gate" }).press("Enter");
  const dialog = page.getByRole("dialog", { name: "The Moon Gate" });
  const video = dialog.locator("video");
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.currentTime),
    )
    .toBeGreaterThan(0.2);
  await expect(video).toHaveJSProperty("controls", true);
  await page.keyboard.press("Escape");
  await expect(video).toHaveCount(0);
});
