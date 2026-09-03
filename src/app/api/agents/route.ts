import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { ok, created, withErrorHandling } from '@/lib/api-response';
import { parseBody } from '@/lib/api-body';
import { agentProfileSchema } from '@/lib/validation/agent';
import { requireRole } from '@/lib/auth/context';
import {
  createAgentProfile,
  updateAgentProfile,
  toPublicAgent,
} from '@/lib/services/agents';

export const runtime = 'nodejs';

/** GET /api/agents — public list of verified agents. */
export const GET = withErrorHandling(async () => {
  const rows = await db()
    .select()
    .from(agents)
    .where(eq(agents.verificationStatus, 'verified'))
    .orderBy(agents.joinedAt);
  return ok({ agents: rows.map(toPublicAgent) });
});

/** POST /api/agents — agent creates their own profile (must be an agent account). */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const ctx = await requireRole(request, 'agent');
  const input = await parseBody(request, agentProfileSchema);
  const agent = await createAgentProfile(ctx.accountId, input);
  return created({ agent: toPublicAgent(agent) });
});

/** PATCH /api/agents — agent updates their own profile. */
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const ctx = await requireRole(request, 'agent');
  const input = await parseBody(request, agentProfileSchema);
  const agent = await updateAgentProfile(ctx.accountId, input);
  return ok({ agent: toPublicAgent(agent) });
});
