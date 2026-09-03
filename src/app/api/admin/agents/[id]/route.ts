import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, withErrorHandling } from '@/lib/api-response';
import { parseBody } from '@/lib/api-body';
import { requireRole } from '@/lib/auth/context';
import { approveAgent, rejectAgent } from '@/lib/services/admin';

export const runtime = 'nodejs';

const decisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().trim().max(1000).optional(),
});

/** POST /api/admin/agents/:id — approve or reject an agent verification. */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const ctx = await requireRole(request, 'admin');
  const input = await parseBody(request, decisionSchema);

  if (input.decision === 'approve') {
    const agent = await approveAgent(ctx.accountId, id, input.reason);
    return ok({ agent });
  }
  const agent = await rejectAgent(ctx.accountId, id, input.reason ?? 'Rejected by admin');
  return ok({ agent });
});
