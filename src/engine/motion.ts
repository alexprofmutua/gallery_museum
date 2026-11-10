import { useSyncExternalStore } from "react";

export const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const media = window.matchMedia?.(reducedMotionQuery);
export const prefersReducedMotion = () => media?.matches ?? false;

function subscribe(callback: () => void) {
  media?.addEventListener("change", callback);
  return () => media?.removeEventListener("change", callback);
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion);
}
