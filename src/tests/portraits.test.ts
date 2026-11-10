import { afterEach, describe, expect, it, vi } from "vitest";
import {
  placedPortraits,
  placePortraits,
  portraits,
} from "../content/portraits";
import { nearestPortrait, portraitInRange } from "../engine/portraitReach";
import { playerPose } from "../engine/chaseCamera";
import { usePortraitVisit } from "../stores/portraitVisit";

const left = placedPortraits.find(
  ({ portrait }) => portrait.id === "moon-gate",
)!;
const right = placedPortraits.find(
  ({ portrait }) => portrait.id === "swan-water",
)!;

afterEach(() => {
  usePortraitVisit.getState().close();
  usePortraitVisit.setState({ nearby: null, message: "" });
  vi.restoreAllMocks();
});

describe("living portrait placement", () => {
  it("has unique, ordered portrait configurations on both walls", () => {
    expect(new Set(portraits.map(({ id }) => id)).size).toBe(6);
    expect(new Set(portraits.map(({ wall }) => wall)).size).toBe(2);
    expect(new Set(portraits.map(({ aspectRatio }) => aspectRatio)).size).toBe(
      2,
    );
    expect(
      placePortraits([
        ...portraits,
        { ...left.portrait, id: "extra", displayOrder: 10 },
      ]),
    ).toHaveLength(7);
  });

  it("selects one nearest in-range portrait without making the center lane an activation zone", () => {
    expect(nearestPortrait({ x: 0, y: 1.65, z: left.z })).toBeNull();
    expect(nearestPortrait({ x: -1, y: 1.65, z: left.z })).toBe(
      left.portrait.id,
    );
    expect(nearestPortrait({ x: 1, y: 1.65, z: right.z })).toBe(
      right.portrait.id,
    );
    expect(portraitInRange(left.portrait.id, { x: -1, y: 1.65, z: -29 })).toBe(
      false,
    );
  });
});

describe("portrait media lifecycle", () => {
  const media = () => ({
    play: vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined),
    pause: vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => {}),
    load: vi
      .spyOn(HTMLMediaElement.prototype, "load")
      .mockImplementation(() => {}),
  });

  it("creates no media from proximity and plays synchronously only for an eligible action", () => {
    const { play } = media();
    const visit = usePortraitVisit.getState();
    const original = { ...playerPose };
    try {
      Object.assign(playerPose, { x: 0, y: 1.65, z: left.z });
      visit.setNearby(left.portrait.id);
      visit.activate(left.portrait.id, "corridor");
      expect(play).not.toHaveBeenCalled();
      expect(usePortraitVisit.getState().session).toBeNull();

      playerPose.x = -1;
      visit.activate(right.portrait.id, "corridor");
      expect(play).not.toHaveBeenCalled();
      visit.activate(left.portrait.id, "corridor");
      expect(play).toHaveBeenCalledOnce();
      expect(usePortraitVisit.getState().session?.video.autoplay).toBe(false);
      expect(usePortraitVisit.getState().session?.video.muted).toBe(true);
    } finally {
      Object.assign(playerPose, original);
    }
  });

  it("releases old audio on replacement and restores the idle state when the new clip ends", () => {
    const { play, pause, load } = media();
    const visit = usePortraitVisit.getState();
    visit.activate(left.portrait.id, "collection");
    const previous = usePortraitVisit.getState().session!.video;
    visit.activate(right.portrait.id, "collection");
    const current = usePortraitVisit.getState().session!.video;
    expect(play).toHaveBeenCalledTimes(2);
    expect(pause.mock.invocationCallOrder[0]).toBeLessThan(
      play.mock.invocationCallOrder[1],
    );
    expect(previous.getAttribute("src")).toBeNull();
    current.dispatchEvent(new Event("ended"));
    expect(usePortraitVisit.getState().session).toBeNull();
    expect(current.getAttribute("src")).toBeNull();
    expect(load).toHaveBeenCalledTimes(2);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("cleans up unsupported media and shows a useful error", async () => {
    const { play } = media();
    play.mockRejectedValueOnce(
      new DOMException("Unsupported", "NotSupportedError"),
    );
    usePortraitVisit.getState().activate(left.portrait.id, "collection");
    await Promise.resolve();
    expect(usePortraitVisit.getState().session).toBeNull();
    expect(usePortraitVisit.getState().message).toContain(
      "may not support the video",
    );
  });
});
