import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { requireRole } from '@/lib/auth/context';
import { getAgentByAccountId } from '@/lib/services/agents';
import { listAgentInbox } from '@/lib/services/contacts';

export const runtime = 'nodejs';

/** GET /api/contacts/inbox — leads received by the authenticated agent. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const ctx = await requireRole(request, 'agent');
  const agent = await getAgentByAccountId(ctx.accountId);
  if (!agent) {
    const err = new Error('No agent profile for this account') as Error & { status: number };
    err.status = 404;
    throw err;
  }
  const inbox = await listAgentInbox(agent.id);
  return ok({ contacts: inbox });
});
