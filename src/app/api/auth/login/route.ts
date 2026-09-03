import { NextRequest, NextResponse } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { parseBody } from '@/lib/api-body';
import { loginSchema } from '@/lib/validation/auth';
import { authenticate } from '@/lib/services/auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * POST /api/auth/login — authenticate via Neon Auth.
 *
 * The Neon Auth server method sets its own session cookie on the response
 * (the old internal `rehla_session` cookie and bcrypt verification are no
 * longer used). A fresh email sign-in auto-links a `traveler` account.
 */
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

  return ok({
    account: {
      id: account.accountId,
      email: account.email,
      role: account.role,
      displayName: account.displayName,
    },
  });
});
