import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { offers } from '@/lib/db/schema';
import type { OfferStatus } from '@/lib/db/schema';
import { HttpError } from '@/lib/api-response';
import type { OfferCreateInput, OfferUpdateInput } from '@/lib/validation/offer';

function isValidForPublic(offer: {
  status: string;
  validUntil: Date | null;
}) {
  return (
    offer.status === 'published' &&
    (offer.validUntil === null || offer.validUntil > new Date())
  );
}

export async function listPublishedOffers() {
  const now = new Date();
  const rows = await db()
    .select()
    .from(offers)
    .where(
      and(
        eq(offers.status, 'published'),
        or(isNull(offers.validUntil), gt(offers.validUntil, now)),
      ),
    )
    .orderBy(offers.createdAt);
  return rows;
}

export async function getPublicOffer(id: string) {
  const rows = await db()
    .select()
    .from(offers)
    .where(eq(offers.id, id))
    .limit(1);
  if (!rows.length) return null;
  return isValidForPublic(rows[0]) ? rows[0] : null;
}

export async function getOwnedOffer(agentId: string, id: string) {
  const rows = await db()
    .select()
    .from(offers)
    .where(and(eq(offers.id, id), eq(offers.agentId, agentId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createOffer(agentId: string, input: OfferCreateInput) {
  if (input.agentId !== agentId) {
    throw new HttpError(403, 'forbidden', 'You can only create offers for your own agent profile');
  }
  const rows = await db()
    .insert(offers)
    .values({
      agentId,
      title: input.title,
      description: input.description ?? null,
      tripType: input.tripType,
      originCity: input.originCity ?? null,
      destinationCity: input.destinationCity ?? null,
      destinationCountry: input.destinationCountry ?? null,
      priceAmount: input.priceAmount,
      currency: input.currency,
      priceType: input.priceType,
      pricingBasis: input.pricingBasis ?? null,
      validFrom: input.validFrom ? new Date(input.validFrom) : null,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      status: 'draft',
    })
    .returning();
  return rows[0];
}

export async function updateOffer(
  agentId: string,
  id: string,
  input: OfferUpdateInput,
) {
  const existing = await getOwnedOffer(agentId, id);
  if (!existing) {
    throw new HttpError(404, 'offer_not_found', 'Offer not found');
  }
  if (existing.status !== 'draft' && existing.status !== 'rejected') {
    throw new HttpError(409, 'offer_not_editable', 'Only draft or rejected offers can be edited');
  }

  const rows = await db()
    .update(offers)
    .set({
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      tripType: input.tripType ?? existing.tripType,
      originCity: input.originCity ?? existing.originCity,
      destinationCity: input.destinationCity ?? existing.destinationCity,
      destinationCountry: input.destinationCountry ?? existing.destinationCountry,
      priceAmount: input.priceAmount ?? existing.priceAmount,
      currency: input.currency ?? existing.currency,
      priceType: input.priceType ?? existing.priceType,
      pricingBasis: input.pricingBasis ?? existing.pricingBasis,
      validFrom: input.validFrom ? new Date(input.validFrom) : existing.validFrom,
      validUntil: input.validUntil ? new Date(input.validUntil) : existing.validUntil,
      updatedAt: new Date(),
      // Editing clears moderation status back to draft.
      status: 'draft',
    })
    .where(and(eq(offers.id, id), eq(offers.agentId, agentId)))
    .returning();
  return rows[0];
}

export async function submitOfferForReview(agentId: string, offerId: string) {
  const existing = await getOwnedOffer(agentId, offerId);
  if (!existing) {
    throw new HttpError(404, 'offer_not_found', 'Offer not found');
  }
  if (existing.status !== 'draft' && existing.status !== 'rejected') {
    throw new HttpError(409, 'offer_not_submittable', 'Only draft or rejected offers can be submitted');
  }
  const rows = await db()
    .update(offers)
    .set({ status: 'pending_review', updatedAt: new Date() })
    .where(and(eq(offers.id, offerId), eq(offers.agentId, agentId)))
    .returning();
  return rows[0];
}

export async function updateOfferStatus(agentId: string, offerId: string, status: OfferStatus) {
  const existing = await getOwnedOffer(agentId, offerId);
  if (!existing) {
    throw new HttpError(404, 'offer_not_found', 'Offer not found');
  }
  const rows = await db()
    .update(offers)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(offers.id, offerId), eq(offers.agentId, agentId)))
    .returning();
  return rows[0];
}

export async function publishOffer(agentId: string, offerId: string) {
  const existing = await getOwnedOffer(agentId, offerId);
  if (!existing) {
    throw new HttpError(404, 'offer_not_found', 'Offer not found');
  }
  if (existing.status !== 'approved') {
    throw new HttpError(409, 'offer_not_publishable', 'Only approved offers can be published');
  }
  const rows = await db()
    .update(offers)
    .set({ status: 'published', updatedAt: new Date() })
    .where(and(eq(offers.id, offerId), eq(offers.agentId, agentId)))
    .returning();
  return rows[0];
}
