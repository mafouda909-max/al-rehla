import type { AccountRole } from '@/lib/db/schema';

/**
 * The authenticated principal derived ONLY from the Neon Auth session,
 * mapped onto the internal `accounts` table (which preserves the role).
 */
export interface AuthContext {
  /** Internal account id (from the `accounts` table). */
  accountId: string;
  email: string;
  role: AccountRole;
  displayName: string | null;
  /** Neon Auth session id. */
  sessionId: string;
  /** Neon Auth user id (the identity provider subject). */
  neonUserId: string;
}
