import { NextRequest, NextResponse } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { parseBody } from '@/lib/api-body';
import { loginSchema } from '@/lib/validation/auth';
import { authenticate, startSession } from '@/lib/services/auth';
import {
  sessionCookieOptions,
  getSessionCookieName,
} from '@/lib/auth/cookie';
import { generateCsrf } from '@/lib/csrf';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const rl = rateLimit({ limit: 10, windowSec: 60, key: clientIp(request) });
  if (!rl.ok) {
    return NextResponse.json(
      { error: { code: 'rate_limited', message: 'Too many attempts' } },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  const input = await parseBody(request, loginSchema);
  const account = await authenticate(input);

  const { rawToken } = await startSession(account.accountId);

  const response = ok({
    account: {
      id: account.accountId,
      email: account.email,
      role: account.role,
      displayName: account.displayName,
    },
  });

  response.cookies.set(getSessionCookieName(), rawToken, sessionCookieOptions());

  const csrf = generateCsrf();
  response.cookies.set(csrf.cookie.name, csrf.cookie.value, csrf.cookie.options);

  return response;
});
