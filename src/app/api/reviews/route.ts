import { NextRequest } from 'next/server';
import { ok, created, withErrorHandling } from '@/lib/api-response';
import { parseBody } from '@/lib/api-body';
import { reviewCreateSchema } from '@/lib/validation/review';
import { requireAuth, requireRole } from '@/lib/auth/context';
import { createReview } from '@/lib/services/reviews';

export const runtime = 'nodejs';

/** GET /api/reviews?agentId= — public reviews for an agent (optional). */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const agentId = request.nextUrl.searchParams.get('agentId');
  if (!agentId) {
    return ok({ reviews: [] });
  }
  const { listReviewsForAgent } = await import('@/lib/services/reviews');
  const reviews = await listReviewsForAgent(agentId);
  return ok({ reviews });
});

/** POST /api/reviews — create a gated review (traveler must be eligible). */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const ctx = await requireRole(request, 'traveler');
  const input = await parseBody(request, reviewCreateSchema);
  const review = await createReview(ctx.accountId, input);
  return created({ review });
});
