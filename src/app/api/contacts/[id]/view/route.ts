import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { requireRole } from '@/lib/auth/context';
import { getAgentByAccountId } from '@/lib/services/agents';
import { markContactViewed } from '@/lib/services/contacts';

export const runtime = 'nodejs';

/** POST /api/contacts/:id/view — agent marks a lead as viewed. */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const ctx = await requireRole(request, 'agent');
  const agent = await getAgentByAccountId(ctx.accountId);
  if (!agent) {
    const err = new Error('No agent profile for this account') as Error & { status: number };
    err.status = 404;
    throw err;
  }
  const contact = await markContactViewed(agent.id, id);
  return ok({ contact });
});
