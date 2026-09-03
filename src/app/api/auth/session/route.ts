import { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth/context';
import { ok, withErrorHandling } from '@/lib/api-response';

export const runtime = 'nodejs';

/** GET /api/auth/session — return the current authenticated account, if any. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const ctx = await getAuth(request);
  if (!ctx) {
    return ok({ authenticated: false });
  }
  return ok({
    authenticated: true,
    account: {
      accountId: ctx.accountId,
      email: ctx.email,
      role: ctx.role,
      displayName: ctx.displayName,
    },
  });
});
