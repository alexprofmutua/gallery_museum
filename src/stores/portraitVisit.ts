import { create } from "zustand";
import { portraits } from "../content/portraits";
import type { Portrait } from "../content/portraits";
import { playerPose } from "../engine/chaseCamera";
import { portraitInRange } from "../engine/portraitReach";

type Session = {
  portrait: Portrait;
  video: HTMLVideoElement;
  location: "corridor" | "collection";
};

interface PortraitVisit {
  nearby: string | null;
  session: Session | null;
  message: string;
  setNearby: (nearby: string | null) => void;
  activate: (id: string, location: Session["location"]) => void;
  close: () => void;
}

export const usePortraitVisit = create<PortraitVisit>((set, get) => ({
  nearby: null,
  session: null,
  message: "",
  setNearby: (nearby) => {
    if (get().nearby !== nearby) set({ nearby, message: "" });
  },
  close: () => {
    const { session } = get();
    if (!session) return;
    set({ session: null });
    session.video.onended = null;
    session.video.onerror = null;
    session.video.pause();
    session.video.removeAttribute("src");
    session.video.load();
  },
  activate: (id, location) => {
    if (
      location === "corridor" &&
      (get().nearby !== id || !portraitInRange(id, playerPose))
    )
      return;
    const portrait = portraits.find((item) => item.id === id);
    if (!portrait || get().session?.portrait.id === id) return;
    get().close();
    if (document.pointerLockElement) document.exitPointerLock();

    const video = document.createElement("video");
    video.playsInline = true;
    video.preload = "none";
    video.muted = true;
    video.setAttribute("aria-label", portrait.title);
    const fail = () => {
      if (get().session?.video !== video) return;
      get().close();
      set({
        message:
          location === "corridor"
            ? `“${portrait.title}” couldn’t play. Try again or open it in the accessible gallery.`
            : `“${portrait.title}” couldn’t play. This browser may not support the video or the file is unavailable.`,
      });
    };
    video.onended = () => {
      if (get().session?.video === video) get().close();
    };
    video.onerror = fail;
    set({ session: { portrait, video, location }, message: "" });
    // Keep play() in the keyboard or button event's user activation.
    video.src = portrait.video;
    void video.play().catch(fail);
  },
}));
