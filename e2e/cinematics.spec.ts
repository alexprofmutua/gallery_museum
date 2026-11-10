import {
  cinemaRoom,
  cinemaViewPosition,
  foreverRoom,
  roomCenterZ,
} from "../src/content/layout";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { enter, position, travel } from "./helpers";

async function walkTo(page: Page, z: number) {
  await page.keyboard.down("ShiftLeft");
  try {
    await travel(page, "KeyW", 2, z);
  } finally {
    await page.keyboard.up("ShiftLeft");
  }
}

test("the cinema projects a gesture-started film with captions and restores the walking view", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  const requested = new Set<string>();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) =>
    requested.add(new URL(request.url()).pathname),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await enter(page);
  await walkTo(page, -15);
  await page.screenshot({ path: "test-results/enchanted-corridor.png" });
  await walkTo(page, roomCenterZ(cinemaRoom));
  const canvas = page.locator("canvas");
  expect(requested.has("/media/sample-film.mp4")).toBe(false);
  expect(requested.has("/media/sample-museum-music.mp3")).toBe(false);

  const sit = page.getByRole("button", { name: /Sit down/ });
  const player = page.getByRole("dialog", { name: "Our Little Cinema" });
  await expect(sit).toHaveCount(0);
  await page.keyboard.press("KeyE");
  await expect(player).toHaveCount(0);
  await travel(page, "KeyD", 0, 1.6, false);
  await expect(sit).toBeVisible();
  await page.keyboard.press("KeyE");
  await expect(player).toBeVisible();
  await expect(canvas).toHaveAttribute(
    "data-camera-position",
    JSON.stringify(cinemaViewPosition),
  );
  const visitorPosition = await position(page);
  const video = player.locator("video");
  await expect(
    player.getByRole("heading", { name: "Choose a film" }),
  ).toBeVisible();
  await expect(video).toHaveCount(0);
  expect([...requested].some((path) => path.endsWith(".mp4"))).toBe(false);
  const films = player.getByRole("list", { name: "Available films" });
  await expect(films.getByRole("listitem")).toHaveCount(3);
  expect(
    await films.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true);
  await player
    .getByRole("button", { name: "Select A Few Quiet Moments" })
    .click();
  await expect
    .poll(() => video.evaluate((element) => element.duration))
    .toBe(15);
  expect(await video.evaluate((element) => element.paused)).toBe(true);
  await player.getByRole("button", { name: "Play", exact: true }).click();
  await expect(
    player.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await expect(
    player.getByText("[Soft piano]", { exact: false }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/cinema-projection.png" });
  await player.getByRole("button", { name: "Pause", exact: true }).click();
  await expect
    .poll(() => video.evaluate((element) => element.paused))
    .toBe(true);
  await player.getByRole("slider", { name: "Film position" }).fill("9");
  await expect
    .poll(() => video.evaluate((element) => element.currentTime))
    .toBeCloseTo(9);
  await player.getByRole("button", { name: "Mute film" }).click();
  await expect
    .poll(() => video.evaluate((element) => element.muted))
    .toBe(true);
  await player.getByRole("button", { name: "Fullscreen", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement?.tagName))
    .toBe("VIDEO");
  await page.evaluate(() => document.exitFullscreen());
  await player.getByRole("button", { name: "Back to films" }).click();
  await expect(video).toHaveCount(0);
  await expect(canvas).toHaveAttribute(
    "data-camera-position",
    JSON.stringify(cinemaViewPosition),
  );
  await player
    .getByRole("button", { name: "Select A Sky Full of Stars" })
    .click();
  await expect(video).toHaveAttribute("src", "/media/sky-full-of-stars.mp4");
  await expect(video).toHaveJSProperty("paused", true);
  await player.getByRole("button", { name: "Play", exact: true }).click();
  await expect
    .poll(() => video.evaluate((element) => element.currentTime))
    .toBeGreaterThan(0.1);
  const playingFilm = await video.elementHandle();
  await player.getByRole("button", { name: "Stand up" }).click();
  expect(
    await playingFilm!.evaluate((element: HTMLVideoElement) => element.paused),
  ).toBe(true);
  await expect(player).toHaveCount(0);
  await expect
    .poll(async () => {
      const restored = JSON.parse(
        (await canvas.getAttribute("data-camera-position")) ?? "[]",
      ) as number[];
      return Math.hypot(
        ...restored.map((value, axis) => value - visitorPosition[axis]),
      );
    })
    .toBeLessThan(0.05);
  expect(errors).toEqual([]);
});

test("the Forever Room letter requires proximity and a deliberate key press", async ({
  page,
}) => {
  test.setTimeout(100000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await enter(page);
  await walkTo(page, -19);
  await walkTo(page, foreverRoom.maxZ - 0.6);
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "forever");
  const trigger = page.getByRole("button", { name: "Open Letter" });
  const letter = page.getByRole("dialog", { name: "The Forever Room letter" });
  await expect(trigger).toHaveCount(0);
  await page.keyboard.press("KeyE");
  await expect(letter).toHaveCount(0);

  await walkTo(page, foreverRoom.maxZ - 8.9);
  await expect(trigger).toBeVisible();
  await expect(letter).toHaveCount(0);
  // Keep walking after reaching the marble plinth. The body must stop on its near side.
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(1100);
  await page.keyboard.up("KeyW");
  expect((await position(page))[2]).toBeGreaterThan(-56.6);
  await page.keyboard.press("KeyE");
  await expect(letter.getByText("With love, always.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(letter).toHaveCount(0);
  await page.keyboard.down("ShiftLeft");
  await travel(page, "KeyD", 0, 2.7, false);
  await travel(page, "KeyW", 2, foreverRoom.minZ + 0.65);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(450);
  await page.keyboard.up("KeyW");
  expect((await position(page))[2]).toBeGreaterThan(foreverRoom.minZ);
  await travel(page, "KeyA", 0, 1.28);
  await travel(page, "KeyS", 2, foreverRoom.maxZ + 1, false);
  await page.keyboard.up("ShiftLeft");
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "cinema");
  await expect(trigger).toHaveCount(0);
});

test("the mobile letter button opens the accessible dialog with reduced motion", async ({
  browser,
}) => {
  test.setTimeout(100000);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    await enter(page);
    await walkTo(page, -19);
    await walkTo(page, foreverRoom.maxZ - 8.9);
    const letter = page.getByRole("dialog", {
      name: "The Forever Room letter",
    });
    await expect(letter).toHaveCount(0);
    await page.getByRole("button", { name: "Open Letter" }).tap();
    await expect(
      letter.getByRole("heading", { name: "For all the days still to come" }),
    ).toBeVisible();
    await letter.getByRole("button", { name: "Return to the museum" }).tap();
    await expect(letter).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Open Letter" }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("the accessible gallery provides the film and letter and handles missing media", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.route("**/media/sample-film.mp4", (route) => route.abort());
    await page.goto("/");
    await page
      .getByRole("button", { name: "Explore the accessible gallery" })
      .tap();
    await page.getByText("Inscriptions from the Forever Room").tap();
    await expect(page.getByText("“Always and forever.”")).toBeVisible();
    await page.getByRole("button", { name: "Browse films" }).tap();
    const cinema = page.getByRole("dialog", { name: "Our Little Cinema" });
    await cinema
      .getByRole("button", { name: "Select A Few Quiet Moments" })
      .tap();
    await expect(cinema.getByRole("alert")).toBeVisible();
    await expect(
      cinema.getByText("A short sample film in three scenes.", {
        exact: false,
      }),
    ).toBeVisible();
    await cinema.getByRole("button", { name: "Return to the museum" }).tap();
    await page.getByRole("button", { name: "Read sample letter" }).tap();
    await expect(
      page.getByRole("heading", { name: "For all the days still to come" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Return to the museum" }).tap();
    await page.unroute("**/media/sample-film.mp4");
    await page.getByRole("button", { name: "Browse films" }).tap();
    await cinema
      .getByRole("button", { name: "Select A Few Quiet Moments" })
      .tap();
    await expect
      .poll(() =>
        cinema.locator("video").evaluate((element) => element.duration),
      )
      .toBe(15);
    expect(
      await cinema
        .locator("video")
        .evaluate((element) => element.controls && element.paused),
    ).toBe(true);
  } finally {
    await context.close();
  }
});

test("music only loads after opt-in and can be muted with M", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open settings" }).click();
  const settings = page.getByRole("dialog", { name: "Museum settings" });
  const music = settings.getByRole("checkbox", { name: "Museum music" });
  await expect(music).not.toBeChecked();
  const request = page.waitForRequest("**/media/sample-museum-music.mp3");
  await music.check();
  await request;
  await expect(music).toBeChecked();
  await expect(
    settings.getByRole("slider", { name: "Music volume" }),
  ).toBeVisible();
  await settings
    .getByRole("combobox", { name: "Graphics" })
    .selectOption("low");
  await page.keyboard.press("Escape");
  await page.keyboard.press("KeyM");
  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(music).not.toBeChecked();
});
