import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";
import type { MuseumRoom } from "../content/layout";
import { defaultCharacter } from "../content/characters";
import type { CharacterId } from "../content/characters";
import { prefersReducedMotion } from "../engine/motion";
import { museum } from "../content/museum";
export type CinematicFeature = "cinema" | "letter" | "envelope";
interface MuseumState {
  feature: CinematicFeature | null;
  openFeature: (feature: CinematicFeature) => void;
  closeFeature: () => void;
  nearCinemaSeat: boolean;
  setNearCinemaSeat: (nearCinemaSeat: boolean) => void;
  sitInCinema: () => void;
  nearLetter: boolean;
  setNearLetter: (nearLetter: boolean) => void;
  openEnvelope: () => void;
  graphics: "low" | "medium" | "high";
  setGraphics: (graphics: MuseumState["graphics"]) => void;
  viewedIds: string[];
  resetProgress: () => void;
  character: CharacterId;
  setCharacter: (character: CharacterId) => void;
  view: "first" | "third";
  toggleView: () => void;
  currentRoom: MuseumRoom["id"];
  setRoom: (id: MuseumRoom["id"]) => void;
  entered: boolean;
  mode: "3d" | "2d";
  activeMemory: string | null;
  nearMemory: string | null;
  settings: boolean;
  moving: boolean;
  reset: number;
  enter: () => void;
  setMode: (mode: "3d" | "2d") => void;
  openMemory: (id: string) => void;
  closeMemory: () => void;
  setNear: (id: string | null) => void;
  setMoving: (moving: boolean) => void;
  toggleSettings: () => void;
  resetPosition: () => void;
}
export const useMuseum = create<MuseumState>()(
  persist(
    (set, get) => ({
      feature: null,
      openFeature: (feature) => {
        document.exitPointerLock?.();
        set({ feature, moving: false });
      },
      closeFeature: () => set({ feature: null }),
      nearCinemaSeat: false,
      setNearCinemaSeat: (nearCinemaSeat) => set({ nearCinemaSeat }),
      sitInCinema: () => {
        const state = get();
        if (
          state.entered &&
          state.mode === "3d" &&
          state.currentRoom === "cinema" &&
          state.nearCinemaSeat &&
          !state.feature &&
          !state.settings &&
          !state.activeMemory
        )
          state.openFeature("cinema");
      },
      nearLetter: false,
      setNearLetter: (nearLetter) => set({ nearLetter }),
      openEnvelope: () => {
        const {
          entered,
          mode,
          nearLetter,
          feature,
          settings,
          activeMemory,
          openFeature,
        } = get();
        if (
          entered &&
          mode === "3d" &&
          nearLetter &&
          !feature &&
          !settings &&
          !activeMemory
        )
          openFeature(prefersReducedMotion() ? "letter" : "envelope");
      },
      graphics: window.matchMedia?.("(pointer: coarse)").matches
        ? "low"
        : "medium",
      setGraphics: (graphics) => set({ graphics }),
      viewedIds: [],
      resetProgress: () => set({ viewedIds: [] }),
      character: defaultCharacter,
      setCharacter: (character) => set({ character }),
      view: "first",
      toggleView: () =>
        set((s) => ({ view: s.view === "first" ? "third" : "first" })),
      currentRoom: "entrance",
      setRoom: (currentRoom) => set({ currentRoom }),
      entered: false,
      mode: "3d",
      activeMemory: null,
      nearMemory: null,
      settings: false,
      moving: false,
      reset: 0,
      enter: () => set({ entered: true, view: "first" }),
      setMode: (mode) =>
        set({
          mode,
          view: "first",
          currentRoom: "entrance",
          activeMemory: null,
          nearMemory: null,
          settings: false,
          feature: null,
          nearCinemaSeat: false,
          nearLetter: false,
        }),
      openMemory: (id) => {
        if (!museum.memories.some((m) => m.id === id)) return;
        document.exitPointerLock?.();
        set((s) => ({
          activeMemory: id,
          moving: false,
          viewedIds: s.viewedIds.includes(id)
            ? s.viewedIds
            : [...s.viewedIds, id],
        }));
      },
      closeMemory: () => set({ activeMemory: null }),
      setNear: (nearMemory) => set({ nearMemory }),
      setMoving: (moving) => set({ moving }),
      toggleSettings: () => {
        document.exitPointerLock?.();
        set((s) => ({ settings: !s.settings }));
      },
      resetPosition: () =>
        set((s) => ({
          reset: s.reset + 1,
          settings: false,
          nearCinemaSeat: false,
          nearLetter: false,
          feature: null,
        })),
    }),
    {
      name: `ofm-progress:${museum.id}`,
      version: 1,
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          if (import.meta.env.VITE_MUSEUM_MODE === "private") return null;
          try {
            return window.localStorage.getItem(name);
          } catch (error) {
            console.warn("Viewed progress could not be read.", error);
            return null;
          }
        },
        setItem: (name, value) => {
          if (import.meta.env.VITE_MUSEUM_MODE === "private") return;
          try {
            window.localStorage.setItem(name, value);
          } catch (error) {
            console.warn("Viewed progress could not be saved.", error);
          }
        },
        removeItem: (name) => {
          if (import.meta.env.VITE_MUSEUM_MODE === "private") return;
          try {
            window.localStorage.removeItem(name);
          } catch (error) {
            console.warn("Viewed progress could not be cleared.", error);
          }
        },
      })),
      partialize: (state) => ({ viewedIds: state.viewedIds }),
      merge: (stored, current) => {
        const result = z
          .object({ viewedIds: z.array(z.string()) })
          .safeParse(stored);
        return {
          ...current,
          viewedIds: result.success
            ? [...new Set(result.data.viewedIds)].filter((id) =>
                museum.memories.some((m) => m.id === id),
              )
            : [],
        };
      },
    },
  ),
);
