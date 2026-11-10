import { expect, it, vi } from "vitest";
import { scheduleImagePreparation } from "../engine/imagePreparation";

it("prepares one image per frame and removes cancelled requests", () => {
  const callbacks: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callbacks.push(callback); return callbacks.length; });
  const first = vi.fn(), cancelled = vi.fn(), last = vi.fn();
  scheduleImagePreparation(first);
  const cancel = scheduleImagePreparation(cancelled);
  scheduleImagePreparation(last);
  cancel();
  expect(first).not.toHaveBeenCalled();
  callbacks.shift()!(0);
  expect(first).toHaveBeenCalledOnce();
  expect(last).not.toHaveBeenCalled();
  callbacks.shift()!(16);
  expect(last).toHaveBeenCalledOnce();
  expect(cancelled).not.toHaveBeenCalled();
  expect(callbacks).toHaveLength(0);
  vi.unstubAllGlobals();
});
