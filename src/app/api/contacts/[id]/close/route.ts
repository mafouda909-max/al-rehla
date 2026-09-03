import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { requireRole } from '@/lib/auth/context';
import { getAgentByAccountId } from '@/lib/services/agents';
import { closeContact } from '@/lib/services/contacts';

export const runtime = 'nodejs';

/** POST /api/contacts/:id/close — agent closes a lead. */
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
  const contact = await closeContact(agent.id, id);
  return ok({ contact });
});
