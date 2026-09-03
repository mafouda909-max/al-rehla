import { NextRequest, NextResponse } from 'next/server';
import { created, withErrorHandling } from '@/lib/api-response';
import { parseBody } from '@/lib/api-body';
import { registerSchema } from '@/lib/validation/auth';
import { registerAccount } from '@/lib/services/auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * POST /api/auth/register — sign up via Neon Auth and provision the internal
 * account.
 *
 * Neon Auth creates the identity + session and sets its own cookie on the
 * response. The `accounts` row (role traveler/agent, plus an unverified agent
 * profile for agents) is created/linked from the Neon user. Admin can never be
 * self-registered.
 */
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

  return created({
    account: {
      id: result.accountId,
      email: result.email,
      role: result.role,
      agentId: result.agentId,
    },
  });
});
