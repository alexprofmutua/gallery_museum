import { useCallback, useEffect, useRef, useState } from "react";
import { assetUrl, cinematics } from "../../content/museum";

export function useMuseumMusic(suspended: boolean) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const requested = useRef(false);
  const initialised = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [error, setError] = useState(false);

  const play = useCallback((element: HTMLAudioElement) => {
    void element.play().catch((failure: unknown) => {
      if (failure instanceof DOMException && failure.name === "AbortError")
        return;
      requested.current = false;
      setEnabled(false);
      setError(true);
    });
  }, []);

  useEffect(() => {
    if (!audio.current || !requested.current) return;
    if (suspended) audio.current.pause();
    else play(audio.current);
  }, [suspended, play]);

  useEffect(() => {
    return () => {
      audio.current?.pause();
      audio.current = null;
      requested.current = false;
      initialised.current = false;
    };
  }, []);

  const start = useCallback(() => {
    if (initialised.current) return;
    initialised.current = true;
    const element = audio.current ?? new Audio(assetUrl(cinematics.music));
    audio.current = element;
    element.loop = true;
    element.volume = volume;
    requested.current = true;
    setEnabled(true);
    setError(false);
    if (!suspended) play(element);
  }, [play, suspended, volume]);

  const toggle = useCallback(() => {
    initialised.current = true;
    const element = audio.current ?? new Audio(assetUrl(cinematics.music));
    audio.current = element;
    element.loop = true;
    element.volume = volume;
    requested.current = !requested.current;
    setEnabled(requested.current);
    setError(false);
    if (!requested.current) element.pause();
    else if (!suspended) play(element);
  }, [play, suspended, volume]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.code !== "KeyM" ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        suspended ||
        (event.target as HTMLElement | null)?.closest(
          "input,textarea,select,[contenteditable]",
        )
      )
        return;
      toggle();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [suspended, toggle]);

  return {
    enabled,
    error,
    volume,
    toggle,
    start,
    changeVolume: (value: number) => {
      setVolume(value);
      if (audio.current) audio.current.volume = value;
    },
  };
}
