import assert from "node:assert/strict";
import { handleMuseumAccess } from "./handler.ts";

Deno.test(
  "checks identity and invitation before touching storage",
  async () => {
    const originalFetch = globalThis.fetch;
    const origin = "https://museum.example";
    const endpoint =
      "https://project.example/functions/v1/museum-access?museum=test";
    const id = "00000000-0000-4000-8000-000000000001";
    Deno.env.set("MUSEUM_ORIGIN", origin);
    Deno.env.set("SUPABASE_URL", "https://project.example");
    Deno.env.set("MUSEUM_PUBLISHABLE_KEY", "sb_publishable_fixture");
    Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "fixture-service-role");
    let grant = "denied";
    let validIdentity = true;
    let signed = 0;
    let downloaded = 0;
    let invalidMedia = false;
    let includeExtraFilm = false;
    globalThis.fetch = async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname === "/auth/v1/user")
        return validIdentity
          ? Response.json({ id, role: "authenticated" })
          : Response.json({ message: "Unauthorized" }, { status: 401 });
      if (url.pathname === "/rest/v1/rpc/ofm_grant_access") {
        assert.equal(
          new Headers(init?.headers).get("authorization"),
          "Bearer fixture-user",
        );
        return Response.json(grant);
      }
      if (url.pathname.endsWith("/test/museum.json")) {
        downloaded++;
        return Response.json({
          museum: {
            id: "test",
            memories: [
              {
                image: invalidMedia
                  ? "/images/../secret.jpg"
                  : "/images/example.jpg",
              },
            ],
          },
          cinematics: {
            music: "/media/music.mp3",
            film: {
              source: "/media/film.mp4",
              captions: "/media/film.vtt",
              poster: "/media/poster.jpg",
            },
            ...(includeExtraFilm
              ? {
                  additionalFilms: [{
                    source: "/media/second.mp4",
                    poster: "/media/second.jpg",
                    captions: "/media/second.vtt",
                  }],
                }
              : {}),
          },
        });
      }
      if (url.pathname === "/storage/v1/object/sign/museum-private") {
        signed++;
        const body = JSON.parse(String(init?.body));
        assert.ok(body.expiresIn > 0 && body.expiresIn < Number(grant));
        assert.equal(body.paths.length, includeExtraFilm ? 8 : 5);
        assert.ok(body.paths.every((path: string) => path.startsWith("test/")));
        return Response.json(
          body.paths.map((path: string) => ({
            error: null,
            path,
            signedURL: `/object/sign/museum-private/${path}?token=fixture`,
          })),
        );
      }
      throw new Error(`Unexpected fixture route ${url.pathname}`);
    };

    const request = (headers: Record<string, string> = {}) =>
      new Request(endpoint, {
        method: "POST",
        headers: { Origin: origin, ...headers },
      });
    const signedIn = () => request({ Authorization: "Bearer fixture-user" });

    try {
      assert.equal((await handleMuseumAccess(request())).status, 401);
      validIdentity = false;
      assert.equal((await handleMuseumAccess(signedIn())).status, 401);
      validIdentity = true;
      assert.equal((await handleMuseumAccess(signedIn())).status, 403);
      grant = "limited";
      assert.equal((await handleMuseumAccess(signedIn())).status, 429);
      assert.equal(downloaded, 0);
      assert.equal(signed, 0);

      grant = "75";
      invalidMedia = true;
      assert.equal((await handleMuseumAccess(signedIn())).status, 503);
      assert.equal(signed, 0);
      invalidMedia = false;
      const response = await handleMuseumAccess(signedIn());
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      const data = await response.json();
      assert.equal(data.visitorId, id);
      assert.equal(data.topic, "ofm:test");
      assert.equal(signed, 1);
      assert.ok(data.assets["/images/example.jpg"].endsWith("?token=fixture"));
      includeExtraFilm = true;
      const multiple = await handleMuseumAccess(signedIn());
      assert.equal(multiple.status, 200);
      const { assets } = await multiple.json();
      for (const extension of ["mp4", "jpg", "vtt"])
        assert.ok(assets[`/media/second.${extension}`].endsWith("?token=fixture"));
      assert.ok(
        data.expiresAt > Date.now() && data.expiresAt - Date.now() < 75000,
      );
      assert.equal(
        (await handleMuseumAccess(request({ Origin: "https://other.example" })))
          .status,
        403,
      );
    } finally {
      globalThis.fetch = originalFetch;
      for (const name of [
        "MUSEUM_ORIGIN",
        "SUPABASE_URL",
        "MUSEUM_PUBLISHABLE_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
      ])
        Deno.env.delete(name);
    }
  },
);
