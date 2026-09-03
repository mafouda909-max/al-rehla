import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth/context';
import { getReviewEligibility } from '@/lib/services/reviews';

export const runtime = 'nodejs';

/**
 * GET /api/reviews/eligibility?agentId=&contactRequestId=
 * Returns whether the authenticated traveler may review the given agent.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const ctx = await requireAuth(request);
  const agentId = request.nextUrl.searchParams.get('agentId') ?? undefined;
  const contactRequestId = request.nextUrl.searchParams.get('contactRequestId') ?? undefined;

  const eligibility = await getReviewEligibility(ctx.accountId, { agentId, contactRequestId });
  return ok({ eligibility });
});
