import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { accounts, agents } from '@/lib/db/schema';
import { HttpError } from '@/lib/api-response';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, revokeSession } from '@/lib/auth/session';
import type { LoginInput, RegisterInput } from '@/lib/validation/auth';

/**
 * Register a new account. For agents, the agent profile is created atomically
 * with the account. Uses a UNIQUE constraint + onConflictDoNothing so the
 * email-uniqueness check is race-safe (no SELECT-then-INSERT window).
 */
export async function registerAccount(input: RegisterInput): Promise<{
  accountId: string;
  role: string;
  agentId: string | null;
  email: string;
}> {
  const passwordHash = await hashPassword(input.password);

  // Atomic: insert account; if the email already exists, nothing is inserted.
  const inserted = await db()
    .insert(accounts)
    .values({
      email: input.email,
      passwordHash,
      role: input.role,
      displayName: input.displayName,
    })
    .onConflictDoNothing({ target: accounts.email })
    .returning({ id: accounts.id, role: accounts.role, email: accounts.email });

  if (!inserted.length) {
    throw new HttpError(409, 'email_taken', 'An account with this email already exists');
  }

  const account = inserted[0];
  let agentId: string | null = null;

  if (account.role === 'agent') {
    // Create the agent profile in the same transaction as the account.
    await db().transaction(async (tx) => {
      const agentRows = await tx
        .insert(agents)
        .values({
          accountId: account.id,
          displayName: input.displayName,
          city: input.agent?.city ?? null,
          country: input.agent?.country ?? null,
          licenseType: input.agent?.licenseType ?? null,
          verificationStatus: 'unverified',
          totalTrips: 0,
        })
        .returning({ id: agents.id });
      agentId = agentRows[0]?.id ?? null;
    });
  }

  return { accountId: account.id, role: account.role, agentId, email: account.email };
}

/** Verify credentials and return the account. */
export async function authenticate(input: LoginInput): Promise<{
  accountId: string;
  email: string;
  role: string;
  displayName: string | null;
}> {
  const rows = await db()
    .select({
      id: accounts.id,
      email: accounts.email,
      passwordHash: accounts.passwordHash,
      role: accounts.role,
      displayName: accounts.displayName,
    })
    .from(accounts)
    .where(eq(accounts.email, input.email))
    .limit(1);

  if (!rows.length) {
    // Do not reveal which part was wrong.
    throw new HttpError(401, 'invalid_credentials', 'Invalid email or password');
  }

  const account = rows[0];
  const valid = await verifyPassword(input.password, account.passwordHash);
  if (!valid) {
    throw new HttpError(401, 'invalid_credentials', 'Invalid email or password');
  }

  return {
    accountId: account.id,
    email: account.email,
    role: account.role,
    displayName: account.displayName,
  };
}

/** Create a session for the account, returning the raw cookie token. */
export async function startSession(accountId: string) {
  const { rawToken, expiresAt } = await createSession(accountId);
  return { rawToken, expiresAt };
}

/** Revoke a session token string. */
export async function endSession(rawToken: string): Promise<void> {
  await revokeSession(rawToken);
}
