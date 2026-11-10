import { scheduleImagePreparation } from "../../engine/imagePreparation";
import { useEffect, useMemo, useState } from "react";
import { SRGBColorSpace, CanvasTexture } from "three";
type Media = {
  status: "idle" | "loading" | "ready" | "error";
  texture: CanvasTexture | null;
  aspect: number;
  generation: symbol;
};
export function useMemoryTexture(source: string, enabled: boolean) {
  // Never render a disposed texture while an earlier request is being replaced.
  const generation = useMemo(
    () => Symbol(`${source}:${enabled}`),
    [source, enabled],
  );
  const [media, setMedia] = useState<Media>({
    status: "idle",
    texture: null,
    aspect: 4 / 3,
    generation,
  });
  useEffect(() => {
    if (!enabled) {
      setMedia({ status: "idle", texture: null, aspect: 4 / 3, generation });
      return;
    }
    let cancelled = false;
    let texture: CanvasTexture | null = null;
    let cancelPreparation = () => {};
    const image = new Image();
    image.crossOrigin = "anonymous";
    setMedia({ status: "loading", texture: null, aspect: 4 / 3, generation });
    const fail = () => {
      image.onload = null;
      image.onerror = null;
      image.removeAttribute("src");
      if (!cancelled)
        setMedia({ status: "error", texture: null, aspect: 4 / 3, generation });
    };
    image.onload = () => {
      cancelPreparation = scheduleImagePreparation(() => {
        if (cancelled) return;
        if (!image.naturalWidth || !image.naturalHeight) {
          fail();
          return;
        }
        const canvas = document.createElement("canvas");
        const scale = Math.min(
          1,
          1024 / Math.max(image.naturalWidth, image.naturalHeight),
        );
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          fail();
          return;
        }
        try {
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const aspect = image.naturalWidth / image.naturalHeight;
          texture = new CanvasTexture(canvas);
          texture.colorSpace = SRGBColorSpace;
          image.onload = null;
          image.onerror = null;
          image.removeAttribute("src");
          setMedia({
            status: "ready",
            texture,
            aspect,
            generation,
          });
        } catch (error) {
          console.warn("Display image could not be prepared:", source, error);
          fail();
        }
      });
    };
    image.onerror = fail;
    image.src = source;
    return () => {
      cancelled = true;
      cancelPreparation();
      image.onload = null;
      image.onerror = null;
      image.removeAttribute("src");
      texture?.dispose();
    };
  }, [source, enabled, generation]);
  return media.generation === generation
    ? media
    : {
        status: enabled ? "loading" : "idle",
        texture: null,
        aspect: 4 / 3,
        generation,
      };
}
