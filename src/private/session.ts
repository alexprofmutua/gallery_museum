import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { installPrivateCatalog } from "../content/museum";
import type { PrivateConfig } from "./config";

export type PrivateVisit = {
  client: SupabaseClient;
  visitorId: string;
  topic: string;
  expiresAt: number;
  signOut: () => Promise<void>;
};

const sessionKey = (config: PrivateConfig) =>
  `ofm-private-auth:${new URL(config.origin).host}:${config.museum}`;
const bundleSchema = z.object({
  catalog: z.unknown(),
  assets: z.unknown(),
  visitorId: z.uuid(),
  topic: z.string(),
  expiresAt: z.number().int(),
});

export function createPrivateClient(config: PrivateConfig) {
  return createClient(config.origin, config.key, {
    auth: {
      storage: window.sessionStorage,
      storageKey: sessionKey(config),
      detectSessionInUrl: false,
    },
  });
}

export async function signOut(client: SupabaseClient, config: PrivateConfig) {
  try {
    await client.auth.signOut({ scope: "local" });
  } finally {
    window.sessionStorage.removeItem(sessionKey(config));
    window.location.reload();
  }
}

export async function loadPrivateVisit(
  config: PrivateConfig,
  client: SupabaseClient,
  token: string,
) {
  const endpoint = new URL("/functions/v1/museum-access", config.origin);
  endpoint.searchParams.set("museum", config.museum);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, apikey: config.key },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 401)
    throw new Error("Your sign-in expired. Sign in again.");
  if (response.status === 403)
    throw new Error("This account doesn’t have an active invitation.");
  if (response.status === 429)
    throw new Error("Too many attempts. Try again in a minute.");
  if (!response.ok)
    throw new Error("The private museum is temporarily unavailable.");
  const data = bundleSchema.parse(await response.json());
  if (data.topic !== `ofm:${config.museum}` || data.expiresAt <= Date.now())
    throw new Error("The private visit expired. Try opening it again.");
  installPrivateCatalog(data.catalog, data.assets, config.origin);
  return {
    client,
    visitorId: data.visitorId,
    topic: data.topic,
    expiresAt: data.expiresAt,
    signOut: () => signOut(client, config),
  };
}
