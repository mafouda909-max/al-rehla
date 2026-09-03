import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/api-response';
import { parseBody } from '@/lib/api-body';
import { contactRequestRespondSchema } from '@/lib/validation/contact-request';
import { requireRole } from '@/lib/auth/context';
import { getAgentByAccountId } from '@/lib/services/agents';
import { respondToContact } from '@/lib/services/contacts';

export const runtime = 'nodejs';

/** POST /api/contacts/:id/respond — agent responds to a lead. */
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
  const input = await parseBody(request, contactRequestRespondSchema);
  const contact = await respondToContact(agent.id, id, input.response);
  return ok({ contact });
});
