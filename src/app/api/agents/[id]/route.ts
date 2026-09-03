import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { ok, fail, withErrorHandling } from '@/lib/api-response';
import { toPublicAgent } from '@/lib/services/agents';

export const runtime = 'nodejs';

/** GET /api/agents/:id — public agent profile. */
export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const rows = await db()
    .select()
    .from(agents)
    .where(eq(agents.id, id))
    .limit(1);

  if (!rows.length) {
    return fail(404, 'agent_not_found', 'Agent not found');
  }
  return ok({ agent: toPublicAgent(rows[0]) });
});
