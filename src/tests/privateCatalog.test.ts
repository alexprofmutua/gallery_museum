import { afterEach, describe, expect, it } from "vitest";
import {
  assetUrl,
  cinematics,
  cinematicsSchema,
  clearPrivateCatalog,
  installPrivateCatalog,
  museum,
} from "../content/museum";
import { readMuseumConfig } from "../private/config";

const origin = "https://museum.example";
const config = {
  VITE_MUSEUM_MODE: "private",
  VITE_SUPABASE_URL: origin,
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fixture",
  VITE_MUSEUM_ID: "our-forever-museum",
};

describe("private museum bootstrap", () => {
  afterEach(clearPrivateCatalog);

  it("only enables the demo when there is no private configuration", () => {
    expect(readMuseumConfig({})).toBeNull();
    expect(readMuseumConfig(config)?.origin).toBe(origin);
    expect(() => readMuseumConfig({ VITE_SUPABASE_URL: origin })).toThrow();
    expect(() =>
      readMuseumConfig({
        ...config,
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_fixture",
      }),
    ).toThrow();
    expect(() =>
      readMuseumConfig({
        ...config,
        VITE_SUPABASE_URL: "http://museum.example",
      }),
    ).toThrow();
  });

  it("loads legacy one-film manifests with an empty list of additional films", () => {
    const { film, music, letter } = cinematics;
    expect(
      cinematicsSchema.parse({ film, music, letter }).additionalFilms,
    ).toEqual([]);
  });

  it("accepts only signed links bound to the configured origin and exact file", () => {
    const catalog = { museum, cinematics };
    const paths = [
      ...museum.memories.map((memory) => memory.image),
      ...[cinematics.film, ...cinematics.additionalFilms].flatMap(
        ({ source, poster, captions }) => [source, poster, captions],
      ),
      cinematics.music,
    ];
    const links = Object.fromEntries(
      paths.map((path) => [
        path,
        `${origin}/storage/v1/object/sign/museum-private/${museum.id}${path}?token=fixture`,
      ]),
    );
    const photo = paths[0];
    expect(() =>
      installPrivateCatalog(
        catalog,
        { ...links, [photo]: links[paths[1]] },
        origin,
      ),
    ).toThrow();
    expect(() =>
      installPrivateCatalog(
        catalog,
        { ...links, [photo]: "https://other.example/file" },
        origin,
      ),
    ).toThrow();
    expect(assetUrl(photo)).toBe(photo);
    installPrivateCatalog(catalog, links, origin);
    expect(assetUrl(photo)).toBe(links[photo]);
    const extra = cinematics.additionalFilms[0].source;
    const missing = { ...links };
    delete missing[extra];
    expect(() => installPrivateCatalog(catalog, missing, origin)).toThrow();
    clearPrivateCatalog();
    expect(assetUrl(photo)).toBe(photo);
  });
});
