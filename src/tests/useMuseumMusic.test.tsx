import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMuseumMusic } from "../components/ui/useMuseumMusic";

class FakeAudio {
  static instances: FakeAudio[] = [];
  loop = false;
  volume = 1;
  paused = true;
  currentTime = 0;
  play = vi.fn(() => { this.paused = false; return Promise.resolve(); });
  pause = vi.fn(() => { this.paused = true; });
  constructor(public src: string) { FakeAudio.instances.push(this); }
}
beforeEach(() => { FakeAudio.instances = []; vi.stubGlobal("Audio", FakeAudio); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("museum background music", () => {
  it("loads only on entry/start and preserves an explicit mute on later entries", () => {
    const { result } = renderHook(() => useMuseumMusic(false));
    expect(FakeAudio.instances).toHaveLength(0);
    act(() => result.current.start());
    const track = FakeAudio.instances[0];
    expect(track.loop).toBe(true);
    expect(result.current.enabled).toBe(true);
    act(() => result.current.start());
    expect(FakeAudio.instances).toHaveLength(1);
    expect(track.play).toHaveBeenCalledTimes(1);
    act(() => result.current.toggle());
    act(() => result.current.start());
    expect(track.paused).toBe(true);
    expect(result.current.enabled).toBe(false);
  });
  it("pauses during a film and resumes the same track and playback position", () => {
    const { result, rerender } = renderHook(({ suspended }) => useMuseumMusic(suspended), { initialProps: { suspended: false } });
    act(() => result.current.start());
    const track = FakeAudio.instances[0];track.currentTime = 19;
    rerender({ suspended: true });
    expect(track.paused).toBe(true);
    expect(result.current.enabled).toBe(true);
    rerender({ suspended: false });
    expect(track.paused).toBe(false);
    expect(track.currentTime).toBe(19);
    expect(FakeAudio.instances).toHaveLength(1);
  });
  it("updates volume and pauses the audio when the visit unmounts", () => {
    const { result, unmount } = renderHook(() => useMuseumMusic(false));
    act(() => result.current.start());
    const track = FakeAudio.instances[0];
    act(() => result.current.changeVolume(0.2));
    expect(track.volume).toBe(0.2);
    unmount();expect(track.paused).toBe(true);
  });
});
