import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { reviews, contactRequests, agents } from '@/lib/db/schema';
import { HttpError } from '@/lib/api-response';
import type { ReviewCreateInput } from '@/lib/validation/review';

/**
 * Reviews are gated by an eligible completed interaction.
 * A traveler may review an agent only if:
 *   - they own a contact request against that agent,
 *   - that contact request is `closed` (the interaction completed),
 *   - they have not already reviewed that contact request.
 */

interface Eligibility {
  eligible: boolean;
  reason?: string;
  contactRequestId?: string;
}

export async function getReviewEligibility(
  reviewerAccountId: string,
  opts: { agentId?: string; contactRequestId?: string },
): Promise<Eligibility> {
  const conditions = [
    eq(contactRequests.travelerAccountId, reviewerAccountId),
    eq(contactRequests.status, 'closed'),
  ];
  if (opts.contactRequestId) {
    conditions.push(eq(contactRequests.id, opts.contactRequestId));
  }
  if (opts.agentId) {
    conditions.push(eq(contactRequests.agentId, opts.agentId));
  }

  const rows = await db()
    .select({ id: contactRequests.id, agentId: contactRequests.agentId })
    .from(contactRequests)
    .where(and(...conditions))
    .orderBy(contactRequests.closedAt)
    .limit(1);

  if (!rows.length) {
    return {
      eligible: false,
      reason: 'No eligible completed interaction with this agent',
    };
  }

  const completed = rows[0];
  const already = await db()
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.contactRequestId, completed.id))
    .limit(1);

  if (already.length) {
    return {
      eligible: false,
      reason: 'You have already reviewed this interaction',
      contactRequestId: completed.id,
    };
  }

  return { eligible: true, contactRequestId: completed.id };
}

/** Create a gated review. Throws if the traveler is not eligible. */
export async function createReview(reviewerAccountId: string, input: ReviewCreateInput) {
  // Verify the contact request belongs to THIS traveler and is closed.
  const eligible = await getReviewEligibility(reviewerAccountId, {
    contactRequestId: input.contactRequestId,
  });
  if (!eligible.eligible) {
    throw new HttpError(
      403,
      'review_not_eligible',
      eligible.reason ?? 'You are not eligible to review this agent',
    );
  }

  // Ensure the contact request's agent matches the reviewed agent.
  const contactRows = await db()
    .select({ agentId: contactRequests.agentId })
    .from(contactRequests)
    .where(eq(contactRequests.id, input.contactRequestId))
    .limit(1);
  if (!contactRows.length || contactRows[0].agentId !== input.agentId) {
    throw new HttpError(400, 'agent_mismatch', 'The contact request does not match this agent');
  }

  // Ensure the target agent is verified.
  const agentExists = await db()
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.id, input.agentId))
    .limit(1);
  if (!agentExists.length) {
    throw new HttpError(404, 'agent_not_found', 'Agent not found');
  }

  // Unique index on contactRequestId makes the double-review atomic-safe.
  const rows = await db()
    .insert(reviews)
    .values({
      agentId: input.agentId,
      reviewerAccountId,
      contactRequestId: input.contactRequestId,
      rating: input.rating,
      comment: input.comment ?? null,
      createdAt: new Date(),
    })
    .onConflictDoNothing({ target: reviews.contactRequestId })
    .returning();

  if (!rows.length) {
    throw new HttpError(409, 'review_exists', 'You have already reviewed this interaction');
  }

  return rows[0];
}

export async function listReviewsForAgent(agentId: string) {
  return db()
    .select()
    .from(reviews)
    .where(eq(reviews.agentId, agentId))
    .orderBy(reviews.createdAt);
}
