import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, withErrorHandling } from '@/lib/api-response';
import { parseBody } from '@/lib/api-body';
import { requireRole } from '@/lib/auth/context';
import { approveOffer, rejectOffer } from '@/lib/services/admin';

export const runtime = 'nodejs';

const decisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().trim().max(1000).optional(),
});

/** POST /api/admin/offers/:id — approve or reject an offer for moderation. */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const ctx = await requireRole(request, 'admin');
  const input = await parseBody(request, decisionSchema);

  if (input.decision === 'approve') {
    const offer = await approveOffer(ctx.accountId, id, input.reason);
    return ok({ offer });
  }
  const offer = await rejectOffer(ctx.accountId, id, input.reason ?? 'Rejected by admin');
  return ok({ offer });
});
