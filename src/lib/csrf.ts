import { createHash, randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { allowedOriginSet } from '@/lib/env';

/**
 * CSRF defense via the double-submit cookie pattern.
 *
 *  - A non-HttpOnly `csrf` cookie holds a random token.
 *  - State-changing requests must send the SAME token in the
 *    `x-csrf-token` header.
 *  - Additionally, for cross-origin requests we validate the Origin/Referer
 *    against ALLOWED_ORIGINS.
 *
 * Because the session cookie is SameSite=Lax, most cross-site POSTs are
 * blocked by the browser; this adds defense in depth for programmatic clients.
 */

const CSRF_COOKIE = 'rehla_csrf';
const CSRF_HEADER = 'x-csrf-token';

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function randomToken(): string {
  return randomBytes(24).toString('base64url');
}

export function csrfCookieName(): string {
  return CSRF_COOKIE;
}

export function csrfHeaderName(): string {
  return CSRF_HEADER;
}

/** Read the CSRF token from the request cookie (client provides it as header). */
export function getCsrfFromRequest(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE)?.value ?? null;
}

/** Create a fresh CSRF token and its cookie options. */
export function generateCsrf(): { token: string; cookie: { name: string; value: string; options: Record<string, unknown> } } {
  const token = randomToken();
  return {
    token,
    cookie: {
      name: CSRF_COOKIE,
      value: token,
      options: {
        httpOnly: false,
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      },
    },
  };
}

/** Validate the double-submit token plus same-origin check for mutating requests. */
export function validateCsrf(request: NextRequest): { ok: boolean; reason?: string } {
  const cookie = getCsrfFromRequest(request);
  const header = request.headers.get(CSRF_HEADER);

  if (!cookie || !header) {
    return { ok: false, reason: 'Missing CSRF token' };
  }
  if (tokenHash(cookie) !== tokenHash(header)) {
    return { ok: false, reason: 'CSRF token mismatch' };
  }

  // Cross-origin defense: if an Origin/Referer is present, it must be allowed.
  const origin = request.headers.get('origin') ?? request.headers.get('referer');
  const allowed = allowedOriginSet();
  if (allowed && origin) {
    const host = new URL(origin).origin;
    if (!allowed.has(host)) {
      return { ok: false, reason: 'Origin not allowed' };
    }
  }

  return { ok: true };
}

/** Throw a typed error if the CSRF check fails. */
export function assertCsrf(request: NextRequest): void {
  const result = validateCsrf(request);
  if (!result.ok) {
    const err = new Error(result.reason ?? 'CSRF validation failed') as Error & {
      status: number;
    };
    err.status = 403;
    throw err;
  }
}
