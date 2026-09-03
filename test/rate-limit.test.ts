import { describe, it, expect } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rate limiter', () => {
  it('allows requests under the limit', () => {
    for (let i = 0; i < 3; i += 1) {
      const result = rateLimit({ limit: 3, windowSec: 60, key: 'k1' });
      expect(result.ok).toBe(true);
      expect(result.remaining).toBe(3 - (i + 1));
    }
  });

  it('blocks requests over the limit', () => {
    for (let i = 0; i < 3; i += 1) rateLimit({ limit: 3, windowSec: 60, key: 'k2' });
    const blocked = rateLimit({ limit: 3, windowSec: 60, key: 'k2' });
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('isolates different keys', () => {
    for (let i = 0; i < 10; i += 1) rateLimit({ limit: 3, windowSec: 60, key: 'a' });
    const other = rateLimit({ limit: 3, windowSec: 60, key: 'b' });
    expect(other.ok).toBe(true);
  });
});
