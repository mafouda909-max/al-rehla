import { describe, it, expect } from 'vitest';
import { decideReviewEligibility } from '@/lib/reviews/rules';
import { reviewCreateSchema } from '@/lib/validation/review';

describe('gated review eligibility rules', () => {
  it('allows a review after a closed interaction', () => {
    const result = decideReviewEligibility({ contactStatus: 'closed', alreadyReviewed: false });
    expect(result.eligible).toBe(true);
  });

  it('blocks a review if the interaction is not closed', () => {
    for (const status of ['new', 'viewed', 'responded', 'cancelled']) {
      const result = decideReviewEligibility({ contactStatus: status, alreadyReviewed: false });
      expect(result.eligible).toBe(false);
      expect(result.reason).toBeTypeOf('string');
    }
  });

  it('blocks a duplicate review', () => {
    const result = decideReviewEligibility({ contactStatus: 'closed', alreadyReviewed: true });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('already');
  });
});

describe('review validation schema', () => {
  it('accepts a valid review', () => {
    const res = reviewCreateSchema.safeParse({
      agentId: '11111111-1111-1111-1111-111111111111',
      contactRequestId: '22222222-2222-2222-2222-222222222222',
      rating: 5,
      comment: 'تجربة ممتازة',
    });
    expect(res.success).toBe(true);
  });

  it('rejects a rating out of range', () => {
    for (const rating of [0, 6, -1]) {
      const res = reviewCreateSchema.safeParse({
        agentId: '11111111-1111-1111-1111-111111111111',
        contactRequestId: '22222222-2222-2222-2222-222222222222',
        rating,
      });
      expect(res.success).toBe(false);
    }
  });
});
