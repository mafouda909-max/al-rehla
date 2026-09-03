import { env } from '@/lib/env';

export const SESSION_COOKIE_NAME = 'rehla_session';

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function isProduction(): boolean {
  return env().NODE_ENV === 'production';
}

/** Cookie options shared by session set/clear. HttpOnly + SameSite always. */
export function sessionCookieOptions() {
  const ttl = env().SESSION_TTL_SECONDS;
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProduction(),
    path: '/',
    maxAge: ttl,
  };
}

export function clearSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProduction(),
    path: '/',
    maxAge: 0,
  };
}
