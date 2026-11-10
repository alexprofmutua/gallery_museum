import {
  cinemaRoom,
  corridorBays,
  foreverRoom,
  roomCenterZ,
} from "../src/content/layout";
import { test, expect } from "@playwright/test";
import { enter, position, travel } from "./helpers";
test("all five rooms are continuously reachable and doors stay open on the return trip", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await enter(page);
  await page.waitForTimeout(400);
  const initialResources = JSON.parse(
    (await page.locator("canvas").getAttribute("data-gpu-resources")) || "{}",
  ) as { textures: number; geometries: number };
  await page.keyboard.down("ShiftLeft");
  for (const [room, z] of [
    ["gallery", 5],
    ["corridor", corridorBays[corridorBays.length - 1]],
    ["cinema", roomCenterZ(cinemaRoom) + 1],
    ["forever", foreverRoom.maxZ - 6],
  ] as const) {
    await travel(page, "KeyW", 2, z);
    await expect(page.locator("canvas")).toHaveAttribute("data-room", room);
    expect((await position(page))[1]).toBeCloseTo(1.65, 1);
    await page.screenshot({
      path: `docs/screenshots/${room}-architecture.png`,
    });
  }
  for (const door of [
    "entrance-gallery",
    "gallery-corridor",
    "corridor-cinema",
    "cinema-forever",
  ])
    await expect(page.locator("canvas")).toHaveAttribute(
      `data-door-${door}`,
      "open",
    );
  await page.keyboard.up("ShiftLeft");
  const frames = await page.evaluate(
    () =>
      new Promise<{ fps: number; p95: number }>((resolve) => {
        const times: number[] = [];
        let previous = performance.now();
        function frame(now: number) {
          times.push(now - previous);
          previous = now;
          if (times.length === 120) {
            const sorted = times.slice(10).sort((a, b) => a - b);
            resolve({
              fps: 1000 / (sorted.reduce((a, b) => a + b, 0) / sorted.length),
              p95: sorted[Math.floor(sorted.length * 0.95)],
            });
          } else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }),
  );
  console.log(
    "Software WebGL frame sample in Forever Room:",
    frames,
    "draw calls:",
    await page.locator("canvas").getAttribute("data-draw-calls"),
  );
  await page.keyboard.down("ShiftLeft");
  for (const [room, z] of [
    ["cinema", roomCenterZ(cinemaRoom)],
    ["corridor", -16],
    ["gallery", 4],
    ["entrance", 20],
  ] as const) {
    await travel(page, "KeyS", 2, z, false);
    await expect(page.locator("canvas")).toHaveAttribute("data-room", room);
  }
  await page.keyboard.up("ShiftLeft");
  await page.waitForTimeout(500);
  const finalResources = JSON.parse(
    (await page.locator("canvas").getAttribute("data-gpu-resources")) || "{}",
  ) as { textures: number; geometries: number };
  console.log(
    "GPU resource counts before/after round trip:",
    initialResources,
    finalResources,
  );
  // The unopened doors hide adjacent rooms at startup. Compare warmed returns
  // after both doors have opened and their exhibits have rendered.
  await page.keyboard.down("ShiftLeft");
  await travel(page, "KeyW", 2, -15);
  await travel(page, "KeyW", 2, foreverRoom.maxZ - 6);
  await travel(page, "KeyS", 2, -15, false);
  await travel(page, "KeyS", 2, 20, false);
  await page.keyboard.up("ShiftLeft");
  await page.waitForTimeout(500);
  const secondLap = JSON.parse(
    (await page.locator("canvas").getAttribute("data-gpu-resources")) || "{}",
  ) as { textures: number; geometries: number };
  console.log("GPU resource counts after second round trip:", secondLap);
  expect(secondLap.textures).toBeLessThanOrEqual(finalResources.textures);
  expect(secondLap.geometries).toBeLessThanOrEqual(finalResources.geometries);
  expect(errors).toEqual([]);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Enter the museum", exact: true }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveAttribute("data-room", "entrance");
});
test("outer walls and narrow corridor contain the player", async ({ page }) => {
  test.setTimeout(60000);
  await enter(page);
  await page.keyboard.down("ShiftLeft");
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(1600);
  await page.keyboard.up("KeyS");
  expect((await position(page))[2]).toBeLessThan(23.75);
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(2500);
  await page.keyboard.up("KeyA");
  expect((await position(page))[0]).toBeGreaterThan(-6.8);
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Reset walking position" }).click();
  await page.keyboard.down("ShiftLeft");
  await travel(page, "KeyW", 2, -16);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1500);
  await page.keyboard.up("KeyD");
  expect((await position(page))[0]).toBeLessThan(2.75);
  expect((await position(page))[0]).toBeGreaterThan(2.4);
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(2200);
  await page.keyboard.up("KeyA");
  expect((await position(page))[0]).toBeGreaterThan(-2.75);
  expect((await position(page))[0]).toBeLessThan(-2.4);
  await page.keyboard.up("ShiftLeft");
});
