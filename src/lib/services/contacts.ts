import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contactRequests } from '@/lib/db/schema';
import { HttpError } from '@/lib/api-response';
import { getPublicOffer } from '@/lib/services/offers';
import { getVerifiedAgent } from '@/lib/services/agents';
import { createNotification } from '@/lib/services/notifications';
import type { ContactRequestCreateInput } from '@/lib/validation/contact-request';

/**
 * Create a contact request (lead).
 *
 * The agent is derived from the offer when present (authoritative), so the
 * client cannot aim a lead at an unrelated agent. Without an offer, the target
 * must be an existing verified agent.
 */
export async function createContactRequest(
  input: ContactRequestCreateInput,
  opts: { travelerAccountId?: string | null },
) {
  let agentId = input.agentId;
  const linkedOfferId = input.offerId ?? null;
  let targetAgent;

  if (input.offerId) {
    const offer = await getPublicOffer(input.offerId);
    if (!offer) {
      throw new HttpError(400, 'offer_not_published', 'The referenced offer is not available');
    }
    agentId = offer.agentId;
    targetAgent = await getVerifiedAgent(agentId);
  } else {
    targetAgent = await getVerifiedAgent(agentId);
  }

  if (!targetAgent) {
    throw new HttpError(400, 'agent_not_verified', 'The target agent is not available');
  }

  const rows = await db()
    .insert(contactRequests)
    .values({
      offerId: linkedOfferId,
      travelerAccountId: opts.travelerAccountId ?? null,
      travelerName: input.name,
      travelerEmail: input.email,
      travelerPhone: input.phone,
      agentId,
      message: input.message,
      status: 'new',
      createdAt: new Date(),
    })
    .returning();

  const created = rows[0];

  // Notify the agent's account about the new lead (best-effort).
  try {
    await createNotification(targetAgent.accountId, {
      type: 'new_lead',
      title: 'طلب جديد',
      body: `لديك طلب جديد من ${input.name}`,
      details: { contactRequestId: created.id },
    });
  } catch {
    // Notification is best-effort and must never block accepting the lead.
  }

  return created;
}

/** Agent inbox: all leads for their own agent profile. */
export async function listAgentInbox(agentId: string) {
  return db()
    .select()
    .from(contactRequests)
    .where(eq(contactRequests.agentId, agentId))
    .orderBy(contactRequests.createdAt);
}

export async function getOwnedContactRequest(agentId: string, id: string) {
  const rows = await db()
    .select()
    .from(contactRequests)
    .where(and(eq(contactRequests.id, id), eq(contactRequests.agentId, agentId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function markContactViewed(agentId: string, id: string) {
  const existing = await getOwnedContactRequest(agentId, id);
  if (!existing) throw new HttpError(404, 'contact_not_found', 'Contact request not found');
  const rows = await db()
    .update(contactRequests)
    .set({ status: 'viewed', viewedAt: existing.viewedAt ?? new Date() })
    .where(and(eq(contactRequests.id, id), eq(contactRequests.agentId, agentId)))
    .returning();
  return rows[0];
}

export async function respondToContact(agentId: string, id: string, response: string) {
  const existing = await getOwnedContactRequest(agentId, id);
  if (!existing) throw new HttpError(404, 'contact_not_found', 'Contact request not found');
  if (existing.status === 'closed' || existing.status === 'cancelled') {
    throw new HttpError(409, 'contact_closed', 'This contact request is closed');
  }

  const rows = await db()
    .update(contactRequests)
    .set({
      status: 'responded',
      respondedAt: existing.respondedAt ?? new Date(),
    })
    .where(and(eq(contactRequests.id, id), eq(contactRequests.agentId, agentId)))
    .returning();

  const updated = rows[0];

  // Notify the traveler account (best-effort) if they have one.
  if (existing.travelerAccountId) {
    try {
      await createNotification(existing.travelerAccountId, {
        type: 'agent_response',
        title: 'رد من الوكيل',
        body: response,
        details: { contactRequestId: id },
      });
    } catch {
      // best-effort
    }
  }

  return updated;
}

export async function closeContact(agentId: string, id: string) {
  const existing = await getOwnedContactRequest(agentId, id);
  if (!existing) throw new HttpError(404, 'contact_not_found', 'Contact request not found');
  const rows = await db()
    .update(contactRequests)
    .set({ status: 'closed', closedAt: existing.closedAt ?? new Date() })
    .where(and(eq(contactRequests.id, id), eq(contactRequests.agentId, agentId)))
    .returning();
  return rows[0];
}
