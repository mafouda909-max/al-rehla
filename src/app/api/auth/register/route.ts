import { NextRequest, NextResponse } from 'next/server';
import { created, withErrorHandling } from '@/lib/api-response';
import { parseBody } from '@/lib/api-body';
import { registerSchema } from '@/lib/validation/auth';
import { registerAccount, startSession } from '@/lib/services/auth';
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
      { error: { code: 'rate_limited', message: 'Too many requests' } },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  const input = await parseBody(request, registerSchema);
  const result = await registerAccount(input);

  // Issue a server-side session for the newly registered account.
  const { rawToken } = await startSession(result.accountId);

  const response = created({
    account: {
      id: result.accountId,
      email: result.email,
      role: result.role,
      agentId: result.agentId,
    },
  });

  response.cookies.set(getSessionCookieName(), rawToken, sessionCookieOptions());

  const csrf = generateCsrf();
  response.cookies.set(csrf.cookie.name, csrf.cookie.value, csrf.cookie.options);

  return response;
});
