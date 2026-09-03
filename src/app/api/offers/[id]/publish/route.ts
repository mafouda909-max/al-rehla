import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth/context';
import { getAgentByAccountId } from '@/lib/services/agents';
import { publishOffer } from '@/lib/services/offers';

export const runtime = 'nodejs';

/** POST /api/offers/:id/publish — agent publishes an approved offer. */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const ctx = await requireAuth(request);
  const agent = await getAgentByAccountId(ctx.accountId);
  if (!agent) {
    const err = new Error('Only agents can publish offers') as Error & { status: number };
    err.status = 403;
    throw err;
  }
  const offer = await publishOffer(agent.id, id);
  return ok({ offer });
});
