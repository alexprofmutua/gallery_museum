import { createClient } from "npm:@supabase/supabase-js@2.119.0";

const bucket = "museum-private";
const slug = /^[a-z0-9-]{1,64}$/;
const mediaPath =
  /^\/(?:images|media)\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:svg|png|jpe?g|webp|avif|mp4|mp3|vtt)$/i;

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("Invalid catalog");
  return value as Record<string, unknown>;
}

export async function handleMuseumAccess(request: Request) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    Vary: "Origin",
  });
  const respond = (status: number, data: unknown) =>
    new Response(JSON.stringify(data), { status, headers });
  const origin = request.headers.get("Origin");
  if (origin && origin !== Deno.env.get("MUSEUM_ORIGIN"))
    return respond(403, { error: "Access denied" });
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  if (request.method === "OPTIONS") {
    headers.set(
      "Access-Control-Allow-Headers",
      "authorization, apikey, content-type, x-client-info",
    );
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST")
    return respond(405, { error: "Method not allowed" });

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer "))
      return respond(401, { error: "Sign in required" });
    const url = Deno.env.get("SUPABASE_URL")!;
    const options = {
      auth: { autoRefreshToken: false, persistSession: false },
    };
    const visitor = createClient(url, Deno.env.get("MUSEUM_PUBLISHABLE_KEY")!, {
      ...options,
      global: { headers: { Authorization: authorization } },
    });
    const { data: identity, error: identityError } = await visitor.auth.getUser(
      authorization.slice(7),
    );
    if (identityError || !identity.user)
      return respond(401, { error: "Sign in required" });

    const museum = new URL(request.url).searchParams.get("museum");
    if (!museum || !slug.test(museum))
      return respond(400, { error: "Invalid request" });
    const requestedAt = Date.now();
    const { data: grant, error: grantError } = await visitor.rpc(
      "ofm_grant_access",
      { museum_id: museum },
    );
    if (grantError)
      return respond(503, { error: "Access temporarily unavailable" });
    if (grant === "limited")
      return respond(429, { error: "Try again in a minute" });
    const duration = Number(grant);
    if (!Number.isInteger(duration) || duration < 30 || duration > 1800)
      return respond(403, { error: "This visit requires an invitation" });

    const admin = createClient(
      url,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      options,
    );
    const storage = admin.storage.from(bucket);
    const { data: file, error: downloadError } = await storage.download(
      `${museum}/museum.json`,
    );
    if (downloadError || !file || file.size > 512_000)
      throw new Error("Catalog unavailable");
    const catalog = record(JSON.parse(await file.text()));
    const collection = record(catalog.museum);
    const cinemas = record(catalog.cinematics);
    const additionalFilms =
      cinemas.additionalFilms === undefined ? [] : cinemas.additionalFilms;
    if (
      collection.id !== museum ||
      !Array.isArray(collection.memories) ||
      collection.memories.length > 100 ||
      !Array.isArray(additionalFilms) ||
      additionalFilms.length > 30
    )
      throw new Error("Invalid catalog");
    const paths: unknown[] = [
      ...collection.memories.map((item: unknown) => record(item).image),
      ...(collection.entrance === undefined
        ? []
        : [
            record(collection.entrance).source,
            record(collection.entrance).poster,
          ]),
      cinemas.music,
      ...[cinemas.film, ...additionalFilms].flatMap((item: unknown) => {
        const { source, poster, captions } = record(item);
        return [source, poster, captions];
      }),
    ];
    if (
      !paths.every(
        (path): path is string =>
          typeof path === "string" && mediaPath.test(path),
      )
    )
      throw new Error("Invalid media reference");
    const keys = [...new Set(paths)].map((path) => museum + path);
    const signingAt = Date.now();
    const remaining =
      duration - Math.ceil((signingAt - requestedAt) / 1000) - 5;
    if (remaining < 15) return respond(403, { error: "Invitation expired" });
    const { data: links, error: signError } = await storage.createSignedUrls(
      keys,
      remaining,
    );
    if (
      signError ||
      links?.length !== keys.length ||
      Date.now() - signingAt >= 5000
    )
      throw new Error("Media unavailable");
    const assets: Record<string, string> = {};
    for (const link of links) {
      if (
        !link.path ||
        !keys.includes(link.path) ||
        !link.signedUrl ||
        link.error
      )
        throw new Error("Media unavailable");
      assets[link.path.slice(museum.length)] = link.signedUrl;
    }
    if (Object.keys(assets).length !== keys.length)
      throw new Error("Media unavailable");
    return respond(200, {
      catalog,
      assets,
      visitorId: identity.user.id,
      topic: `ofm:${museum}`,
      expiresAt: signingAt + (remaining - 5) * 1000,
    });
  } catch {
    return respond(503, {
      error: "The private museum is temporarily unavailable",
    });
  }
}
