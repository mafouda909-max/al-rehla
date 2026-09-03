import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { agents, offers, accounts, adminActions } from '@/lib/db/schema';
import { HttpError } from '@/lib/api-response';
import { createNotification } from '@/lib/services/notifications';

async function logAdminAction(
  adminAccountId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>,
) {
  await db().insert(adminActions).values({
    adminAccountId,
    action,
    targetType,
    targetId,
    details: details ?? null,
    createdAt: new Date(),
  });
}

export async function listAgentVerificationQueue() {
  const rows = await db()
    .select({
      agent: agents,
      email: accounts.email,
    })
    .from(agents)
    .innerJoin(accounts, eq(agents.accountId, accounts.id))
    .where(eq(agents.verificationStatus, 'pending'))
    .orderBy(agents.joinedAt);
  return rows;
}

export async function approveAgent(adminAccountId: string, agentId: string, reason?: string) {
  const target = await db()
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.verificationStatus, 'pending')))
    .limit(1);
  if (!target.length) {
    throw new HttpError(409, 'agent_not_pending', 'Agent is not awaiting verification');
  }
  const updated = await db()
    .update(agents)
    .set({ verificationStatus: 'verified', verifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(agents.id, agentId))
    .returning();

  await logAdminAction(adminAccountId, 'approve_agent', 'agent', agentId, { reason });

  try {
    await createNotification(target[0].accountId, {
      type: 'verification_status',
      title: 'تم التحقق من حسابك',
      body: reason ?? 'تمت الموافقة على حسابك كوكيل موثوق.',
      details: { agentId },
    });
  } catch {
    // best-effort
  }

  return updated[0];
}

export async function rejectAgent(adminAccountId: string, agentId: string, reason: string) {
  const updated = await db()
    .update(agents)
    .set({ verificationStatus: 'rejected', updatedAt: new Date() })
    .where(eq(agents.id, agentId))
    .returning();
  if (!updated.length) {
    throw new HttpError(404, 'agent_not_found', 'Agent not found');
  }

  await logAdminAction(adminAccountId, 'reject_agent', 'agent', agentId, { reason });

  try {
    await createNotification(updated[0].accountId, {
      type: 'verification_status',
      title: 'تم رفض طلب التحقق',
      body: reason,
      details: { agentId },
    });
  } catch {
    // best-effort
  }

  return updated[0];
}

export async function listOfferModerationQueue() {
  const rows = await db()
    .select({
      offer: offers,
      agentName: agents.displayName,
    })
    .from(offers)
    .innerJoin(agents, eq(offers.agentId, agents.id))
    .where(eq(offers.status, 'pending_review'))
    .orderBy(offers.createdAt);
  return rows;
}

export async function approveOffer(adminAccountId: string, offerId: string, reason?: string) {
  const updated = await db()
    .update(offers)
    .set({ status: 'approved', updatedAt: new Date() })
    .where(and(eq(offers.id, offerId), eq(offers.status, 'pending_review')))
    .returning();
  if (!updated.length) {
    throw new HttpError(409, 'offer_not_pending', 'Offer is not awaiting moderation');
  }

  await logAdminAction(adminAccountId, 'approve_offer', 'offer', offerId, { reason });

  const offer = updated[0];
  const agentRow = await db()
    .select()
    .from(agents)
    .where(eq(agents.id, offer.agentId))
    .limit(1);
  if (agentRow.length) {
    try {
      await createNotification(agentRow[0].accountId, {
        type: 'offer_moderation',
        title: 'تمت الموافقة على عرضك',
        body: reason ?? 'عرضك جاهز للنشر.',
        details: { offerId },
      });
    } catch {
      // best-effort
    }
  }

  return offer;
}

export async function rejectOffer(adminAccountId: string, offerId: string, reason: string) {
  const updated = await db()
    .update(offers)
    .set({ status: 'rejected', updatedAt: new Date() })
    .where(and(eq(offers.id, offerId), eq(offers.status, 'pending_review')))
    .returning();
  if (!updated.length) {
    throw new HttpError(409, 'offer_not_pending', 'Offer is not awaiting moderation');
  }

  await logAdminAction(adminAccountId, 'reject_offer', 'offer', offerId, { reason });

  const offer = updated[0];
  const agentRow = await db()
    .select()
    .from(agents)
    .where(eq(agents.id, offer.agentId))
    .limit(1);
  if (agentRow.length) {
    try {
      await createNotification(agentRow[0].accountId, {
        type: 'offer_moderation',
        title: 'تم رفض عرضك',
        body: reason,
        details: { offerId },
      });
    } catch {
      // best-effort
    }
  }

  return offer;
}
