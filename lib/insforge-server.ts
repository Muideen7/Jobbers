import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

const MISSING_ENV_MESSAGE =
  "Missing NEXT_PUBLIC_INSFORGE_URL or NEXT_PUBLIC_INSFORGE_ANON_KEY. " +
  "Copy .env.local.example to .env.local and fill in both values — see README.";

/**
 * The SDK silently falls back to these env vars and throws an opaque
 * "Missing InsForge baseUrl or anonKey" when they are absent. Reading them
 * through one helper keeps that failure message actionable.
 */
export function getInsforgeEnv(): { baseUrl: string; anonKey: string } {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw new Error(MISSING_ENV_MESSAGE);
  }

  return { baseUrl, anonKey };
}

export async function createInsforgeServer() {
  return createServerClient({ ...getInsforgeEnv(), cookies: await cookies() });
}