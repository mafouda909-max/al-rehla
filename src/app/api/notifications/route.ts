import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth/context';
import { listNotifications, listUnreadNotifications } from '@/lib/services/notifications';

export const runtime = 'nodejs';

/** GET /api/notifications — authenticated user's notifications. ?unread=1 for unread only. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const ctx = await requireAuth(request);
  const unreadOnly = request.nextUrl.searchParams.get('unread') === '1';
  const notifications = unreadOnly
    ? await listUnreadNotifications(ctx.accountId)
    : await listNotifications(ctx.accountId);
  return ok({ notifications });
});
