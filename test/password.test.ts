import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('password hashing', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('supersecure123');
    expect(hash).not.toEqual('supersecure123');
    expect(await verifyPassword('supersecure123', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('rightpass');
    expect(await verifyPassword('wrongpass', hash)).toBe(false);
  });
});
