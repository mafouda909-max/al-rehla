import { NextRequest } from 'next/server';
import { ok, fail, withErrorHandling } from '@/lib/api-response';
import { parseBody } from '@/lib/api-body';
import { offerUpdateSchema } from '@/lib/validation/offer';
import { requireAuth } from '@/lib/auth/context';
import { getAgentByAccountId } from '@/lib/services/agents';
import {
  getPublicOffer,
  getOwnedOffer,
  updateOffer,
  updateOfferStatus,
} from '@/lib/services/offers';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedAgent(accountId: string) {
  return getAgentByAccountId(accountId);
}

/** GET /api/offers/:id — public offer detail (published + valid only). */
export const GET = withErrorHandling(async (_req: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const offer = await getPublicOffer(id);
  if (!offer) {
    return fail(404, 'offer_not_found', 'Offer not found or not published');
  }
  return ok({ offer });
});

/** PATCH /api/offers/:id — agent updates their own draft/rejected offer. */
export const PATCH = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const ctx = await requireAuth(request);
  const agent = await getOwnedAgent(ctx.accountId);
  if (!agent) {
    const err = new Error('Only agents can edit offers') as Error & { status: number };
    err.status = 403;
    throw err;
  }
  const input = await parseBody(request, offerUpdateSchema);
  const offer = await updateOffer(agent.id, id, input);
  return ok({ offer });
});

/** DELETE /api/offers/:id — agent archives their own offer. */
export const DELETE = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const { id } = await params;
  const ctx = await requireAuth(request);
  const agent = await getOwnedAgent(ctx.accountId);
  if (!agent) {
    const err = new Error('Only agents can manage offers') as Error & { status: number };
    err.status = 403;
    throw err;
  }
  const existing = await getOwnedOffer(agent.id, id);
  if (!existing) {
    return fail(404, 'offer_not_found', 'Offer not found');
  }
  const offer = await updateOfferStatus(agent.id, id, 'archived');
  return ok({ offer });
});
