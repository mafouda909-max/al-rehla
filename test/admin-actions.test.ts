import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// The admin decision schema used by /api/admin/*. Re-declared here (not
// exported from a route file) so the test is a pure unit check without
// importing Next.js route SSR internals.
const decisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().trim().max(1000).optional(),
});

describe('admin moderation decision schema', () => {
  it('accepts an approve decision', () => {
    const res = decisionSchema.safeParse({ decision: 'approve' });
    expect(res.success).toBe(true);
  });

  it('accepts a reject decision with a reason', () => {
    const res = decisionSchema.safeParse({ decision: 'reject', reason: 'missing license' });
    expect(res.success).toBe(true);
  });

  it('rejects an unknown decision', () => {
    const res = decisionSchema.safeParse({ decision: 'maybe' });
    expect(res.success).toBe(false);
  });

  it('rejects a reason that is too long', () => {
    const res = decisionSchema.safeParse({ decision: 'reject', reason: 'x'.repeat(1001) });
    expect(res.success).toBe(false);
  });
});
