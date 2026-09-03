import type { OfferStatus } from '@/lib/db/schema';

/**
 * Central offer lifecycle rules.
 *
 * These are pure functions (no DB) so the transition + authorization logic can
 * be unit-tested independently of PostgreSQL, and so every service/API
 * enforces exactly the same rules.
 *
 * Lifecycle:
 *   draft --submit--> pending_review --approve--> approved --publish--> published
 *            |                    |
 *            |<--reject----------+
 *            |<--archive/expire--+ (published can expire/archive)
 *   rejected --edit--> draft -> (submit again)
 *   published --expire/archive--> (terminal)
 */

export const OFFER_LIFECYCLE: Record<OfferStatus, OfferStatus[]> = {
  draft: ['pending_review', 'archived'],
  pending_review: ['approved', 'rejected', 'archived'],
  approved: ['published', 'rejected', 'archived'],
  published: ['expired', 'archived'],
  rejected: ['draft', 'archived'],
  expired: ['archived'],
  archived: [],
};

/** Returns true if `to` is a legal next state from `from`. */
export function canTransition(from: OfferStatus, to: OfferStatus): boolean {
  return (OFFER_LIFECYCLE[from] ?? []).includes(to);
}

/** Returns the set of next legal states from `from`. */
export function allowedTransitions(from: OfferStatus): OfferStatus[] {
  return OFFER_LIFECYCLE[from] ?? [];
}

/**
 * Returns a human/machine reason when a transition is disallowed, or null if
 * allowed. Used to keep guard messages consistent across services.
 */
export function transitionError(from: OfferStatus, to: OfferStatus): string | null {
  if (canTransition(from, to)) return null;
  return `Cannot move an offer from '${from}' to '${to}'`;
}

/** Whether an offer's owner may edit it (draft or rejected). */
export function canEditOffer(status: OfferStatus): boolean {
  return status === 'draft' || status === 'rejected';
}

/** Whether an offer's owner may submit it for review. */
export function canSubmitOffer(status: OfferStatus): boolean {
  return status === 'draft' || status === 'rejected';
}

/** Whether an offer's owner may publish it (only after admin approval). */
export function canPublishOffer(status: OfferStatus): boolean {
  return status === 'approved';
}
