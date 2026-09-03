import { describe, it, expect } from 'vitest';
import { hashSessionToken, generateSessionToken } from '@/lib/auth/session';

describe('session token helpers', () => {
  it('generates a URL-safe random token', () => {
    const token = generateSessionToken();
    expect(token).toBeTypeOf('string');
    expect(token.length).toBeGreaterThanOrEqual(20);
    // base64url alphabet (no +/ or =)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('generates distinct tokens on each call', () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toEqual(b);
  });

  it('hashes deterministically and never returns the raw token', () => {
    const token = 'raw-session-token-abc';
    const hash1 = hashSessionToken(token);
    const hash2 = hashSessionToken(token);
    expect(hash1).toEqual(hash2);
    expect(hash1).not.toContain(token);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // sha256 hex
  });
});
