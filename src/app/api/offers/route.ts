import { NextRequest } from 'next/server';
import { ok, created, withErrorHandling } from '@/lib/api-response';
import { parseBody } from '@/lib/api-body';
import { offerCreateSchema } from '@/lib/validation/offer';
import { requireAuth } from '@/lib/auth/context';
import { listPublishedOffers, createOffer } from '@/lib/services/offers';
import { getAgentByAccountId } from '@/lib/services/agents';

export const runtime = 'nodejs';

/** GET /api/offers — public published offers. */
export const GET = withErrorHandling(async () => {
  const offers = await listPublishedOffers();
  return ok({ offers });
});

/**
 * POST /api/offers — an authenticated agent creates an offer (as draft).
 * The agentId in the payload must equal the authenticated agent's own id.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const ctx = await requireAuth(request);

  // Only verified (or at least pending) agent accounts can create offers.
  const agent = await getAgentByAccountId(ctx.accountId);
  if (!agent) {
    // Not an agent account.
    const err = new Error('Only agents can create offers') as Error & { status: number };
    err.status = 403;
    throw err;
  }

  const input = await parseBody(request, offerCreateSchema);
  const offer = await createOffer(agent!.id, input);
  return created({ offer });
});
