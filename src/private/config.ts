export function readMuseumConfig(
  env: Record<string, string | boolean | undefined>,
) {
  const mode = env.VITE_MUSEUM_MODE;
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const museum = env.VITE_MUSEUM_ID;
  if ((!mode || mode === "demo") && !url && !key && !museum) return null;

  if (
    mode !== "private" ||
    typeof url !== "string" ||
    typeof key !== "string" ||
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) ||
    typeof museum !== "string" ||
    !/^[a-z0-9-]{1,64}$/.test(museum)
  )
    throw new Error(
      "Private mode needs a Supabase URL, a publishable key, and a museum ID.",
    );

  const parsed = new URL(url);
  const local =
    env.DEV &&
    parsed.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(parsed.hostname);
  if (
    (!local && parsed.protocol !== "https:") ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  )
    throw new Error("Use the Supabase project origin for the private museum.");

  return { origin: parsed.origin, key, museum };
}
export type PrivateConfig = NonNullable<ReturnType<typeof readMuseumConfig>>;
