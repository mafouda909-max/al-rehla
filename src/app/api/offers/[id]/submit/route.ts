import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth/context';
import { getAgentByAccountId } from '@/lib/services/agents';
import { submitOfferForReview } from '@/lib/services/offers';

export const runtime = 'nodejs';

/** POST /api/offers/:id/submit — agent submits a draft for moderation review. */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const ctx = await requireAuth(request);
  const agent = await getAgentByAccountId(ctx.accountId);
  if (!agent) {
    const err = new Error('Only agents can submit offers') as Error & { status: number };
    err.status = 403;
    throw err;
  }
  const offer = await submitOfferForReview(agent.id, id);
  return ok({ offer });
});
