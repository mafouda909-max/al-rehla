import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { requireRole } from '@/lib/auth/context';
import { listOfferModerationQueue } from '@/lib/services/admin';

export const runtime = 'nodejs';

/** GET /api/admin/offers — offers awaiting admin moderation. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireRole(request, 'admin');
  const queue = await listOfferModerationQueue();
  return ok({ queue });
});
