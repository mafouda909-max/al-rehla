import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth/context';
import { markNotificationRead } from '@/lib/services/notifications';

export const runtime = 'nodejs';

/** POST /api/notifications/:id/read — mark one of the user's notifications read. */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const ctx = await requireAuth(request);
  const notification = await markNotificationRead(ctx.accountId, id);
  return ok({ notification });
});
