import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth/context';
import { endNeonSession } from '@/lib/services/auth';

export const runtime = 'nodejs';

/**
 * POST /api/auth/logout — sign out of the Neon Auth session and clear its
 * session cookie.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const ctx = await requireAuth(request);
  await endNeonSession();
  return ok({ ok: true, accountId: ctx.accountId });
});
