import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { requireRole } from '@/lib/auth/context';
import { listAgentVerificationQueue } from '@/lib/services/admin';

export const runtime = 'nodejs';

/** GET /api/admin/agents — agents awaiting admin verification. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireRole(request, 'admin');
  const queue = await listAgentVerificationQueue();
  return ok({ queue });
});
