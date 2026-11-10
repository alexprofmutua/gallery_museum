import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";

type Surface = "plaster" | "wood" | "fabric";
// Small, immutable bump maps shared for the lifetime of the scene, like Box's
// shared geometry. They carry no color, so photographs keep their own palette.
const textures = new Map<Surface, CanvasTexture>();
export function surfaceTexture(surface: Surface) {
  const cached = textures.get(surface);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(128, 128);
  let seed = 241;
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = (seed / 4294967296 - 0.5) * 28;
      const grain = surface === "wood"
        ? Math.sin(x * 0.55 + Math.sin(y * Math.PI / 64) * 1.8) * 24
        : surface === "fabric"
          ? ((x % 4 < 2 ? 1 : -1) + (y % 4 < 2 ? 1 : -1)) * 18
          : 0;
      const offset = (y * 128 + x) * 4;
      pixels.data[offset] = pixels.data[offset + 1] = pixels.data[offset + 2] = 128 + grain + noise;
      pixels.data[offset + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 4;
  textures.set(surface, texture);
  return texture;
}

let shadow: CanvasTexture | undefined;
export function frameShadowTexture() {
  if (shadow) return shadow;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  // Blur a rectangle rather than a circular blob, preserving the frame shape.
  ctx.filter = "blur(7px)";
  ctx.fillStyle = "#201911";
  ctx.fillRect(14, 14, 100, 100);
  shadow = new CanvasTexture(canvas);
  return shadow;
}

// Keep stone veining quiet at room scale instead of turning the floor into a
// high-contrast repeated pattern. Each room owns and disposes its copy.
export function stoneFloorTexture(source: Texture, width: number, depth: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const context = canvas.getContext("2d")!;
  context.drawImage(source.image as CanvasImageSource, 0, 0, 512, 512);
  context.fillStyle = "rgba(231, 228, 221, 0.58)";
  context.fillRect(0, 0, 512, 512);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(width / 2.5, depth / 2.5);
  texture.anisotropy = 4;
  return texture;
}
