import type { ContactRequestStatus } from '@/lib/db/schema';

/**
 * Gated review eligibility rules (pure, DB-free).
 *
 * A traveler may review an agent only after the interaction completed:
 * the contact request must be `closed`, and they must not have already
 * reviewed that interaction.
 */

export interface ReviewEligibilityDecision {
  eligible: boolean;
  reason?: string;
}

/** Decide eligibility from the interaction status and whether it was reviewed. */
export function decideReviewEligibility(input: {
  contactStatus?: ContactRequestStatus | string | null;
  alreadyReviewed: boolean;
}): ReviewEligibilityDecision {
  if (input.alreadyReviewed) {
    return { eligible: false, reason: 'You have already reviewed this interaction' };
  }
  if (input.contactStatus !== 'closed') {
    return {
      eligible: false,
      reason: 'You can only review after the interaction is closed',
    };
  }
  return { eligible: true };
}
