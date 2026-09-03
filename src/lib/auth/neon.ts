import { createNeonAuth } from '@neondatabase/neon-js/auth/next/server';
import type { NeonAuth } from '@neondatabase/neon-js/auth/next/server';
import { env } from '@/lib/env';

let cached: NeonAuth | undefined;

/**
 * True when Neon Auth has everything it needs to operate: a base URL and a
 * cookie-signing secret of at least 32 characters. Partial or short config is
 * treated as "disabled" so protected endpoints return 401 instead of crashing
 * the app at boot.
 */
export function isNeonAuthConfigured(): boolean {
  const e = env();
  return Boolean(
    e.NEON_AUTH_BASE_URL && e.NEON_AUTH_COOKIE_SECRET && e.NEON_AUTH_COOKIE_SECRET.length >= 32,
  );
}

/**
 * Build (once) and return the Neon Auth server instance. Throws if not
 * configured — callers must guard with {@link isNeonAuthConfigured} first.
 */
export function getNeonAuth(): NeonAuth {
  if (cached) return cached;
  const e = env();
  if (!e.NEON_AUTH_BASE_URL || !e.NEON_AUTH_COOKIE_SECRET) {
    throw new Error(
      'Neon Auth is not configured. Set NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET.',
    );
  }
  cached = createNeonAuth({
    baseUrl: e.NEON_AUTH_BASE_URL,
    cookies: {
      secret: e.NEON_AUTH_COOKIE_SECRET,
    },
  });
  return cached;
}

/** The configured Neon Auth base URL (for the browser client), or null. */
export function getNeonAuthBaseUrl(): string | null {
  return env().NEON_AUTH_BASE_URL ?? null;
}
