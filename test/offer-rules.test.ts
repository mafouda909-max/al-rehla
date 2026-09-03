import { describe, it, expect } from 'vitest';
import {
  canTransition,
  allowedTransitions,
  transitionError,
  canEditOffer,
  canSubmitOffer,
  canPublishOffer,
} from '@/lib/offers/rules';

describe('offer lifecycle transitions', () => {
  it('submits a draft to pending_review', () => {
    expect(canTransition('draft', 'pending_review')).toBe(true);
  });

  it('does not allow publishing an unapproved draft', () => {
    expect(canTransition('draft', 'published')).toBe(false);
    expect(canTransition('pending_review', 'published')).toBe(false);
  });

  it('allows approve -> approved, then publish -> published', () => {
    expect(canTransition('pending_review', 'approved')).toBe(true);
    expect(canTransition('approved', 'published')).toBe(true);
    expect(canTransition('pending_review', 'rejected')).toBe(true);
  });

  it('allows a rejected offer to be re-edited back to draft', () => {
    expect(canTransition('rejected', 'draft')).toBe(true);
  });

  it('allows published/expired to be archived, and archived is terminal', () => {
    expect(canTransition('published', 'expired')).toBe(true);
    expect(canTransition('published', 'archived')).toBe(true);
    expect(canTransition('expired', 'archived')).toBe(true);
    expect(allowedTransitions('archived')).toEqual([]);
  });

  it('rejects an illegal transition with a reason', () => {
    const err = transitionError('approved', 'pending_review');
    expect(err).toBeTypeOf('string');
    expect(canTransition('approved', 'pending_review')).toBe(false);
  });

  it('returns null for a legal transition', () => {
    expect(transitionError('draft', 'pending_review')).toBeNull();
  });
});

describe('offer authorization guards', () => {
  it('owner can edit only draft/rejected', () => {
    expect(canEditOffer('draft')).toBe(true);
    expect(canEditOffer('rejected')).toBe(true);
    expect(canEditOffer('pending_review')).toBe(false);
    expect(canEditOffer('approved')).toBe(false);
    expect(canEditOffer('published')).toBe(false);
  });

  it('owner can submit only draft/rejected', () => {
    expect(canSubmitOffer('draft')).toBe(true);
    expect(canSubmitOffer('rejected')).toBe(true);
    expect(canSubmitOffer('pending_review')).toBe(false);
    expect(canSubmitOffer('approved')).toBe(false);
  });

  it('owner can publish only approved', () => {
    expect(canPublishOffer('approved')).toBe(true);
    expect(canPublishOffer('draft')).toBe(false);
    expect(canPublishOffer('pending_review')).toBe(false);
    expect(canPublishOffer('published')).toBe(false);
  });
});
