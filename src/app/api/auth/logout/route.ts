import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth/context';
import { endSession } from '@/lib/services/auth';
import {
  clearSessionCookieOptions,
  getSessionCookieName,
} from '@/lib/auth/cookie';

export const runtime = 'nodejs';

/** POST /api/auth/logout — revoke the current session and clear the cookie. */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const ctx = await requireAuth(request);
  const rawToken = request.cookies.get(getSessionCookieName())?.value;
  if (rawToken) await endSession(rawToken);

  const response = ok({ ok: true, accountId: ctx.accountId });
  response.cookies.set(getSessionCookieName(), '', clearSessionCookieOptions());
  return response;
});
