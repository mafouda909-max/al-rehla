import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { accounts, agents } from '@/lib/db/schema';
import type { AccountRole } from '@/lib/db/schema';
import { HttpError } from '@/lib/api-response';
import { getNeonAuth, isNeonAuthConfigured } from '@/lib/auth/neon';
import type { AuthContext } from '@/lib/auth/types';
import type { RegisterInput } from '@/lib/validation/auth';
import type { LoginInput } from '@/lib/validation/auth';

/**
 * Map a Neon Auth user to an internal `accounts` row, auto-provisioning a
 * `traveler` account on first sign-in (by email). Roles (traveler / agent /
 * admin) live on the internal account so the existing authorization rules
 * (`requireAuth` / `requireRole`) are preserved unchanged.
 *
 * Returns `null` when Neon Auth is not configured (protected endpoints then
 * 401) or when there is no session.
 */
export async function resolveAuthContext(): Promise<AuthContext | null> {
  if (!isNeonAuthConfigured()) return null;

  const auth = getNeonAuth();
  const { data } = await auth.getSession();
  if (!data?.user) return null;

  const user = data.user;
  const session = data.session;
  const account = await findOrProvisionAccount(user.email, user.name ?? null);

  return {
    accountId: account.id,
    email: account.email,
    role: account.role,
    displayName: account.displayName,
    sessionId: session?.id ?? '',
    neonUserId: user.id,
  };
}

/**
 * Find the account for `email`, or create a `traveler` account if none exists.
 * Uses the UNIQUE email constraint + `onConflictDoNothing` so concurrent
 * first-sign-ins don't produce duplicate accounts.
 */
async function findOrProvisionAccount(
  email: string,
  displayName: string | null,
): Promise<{ id: string; email: string; role: AccountRole; displayName: string | null }> {
  const existing = await db()
    .select({
      id: accounts.id,
      email: accounts.email,
      role: accounts.role,
      displayName: accounts.displayName,
    })
    .from(accounts)
    .where(eq(accounts.email, email))
    .limit(1);

  if (existing.length) return existing[0];

  const inserted = await db()
    .insert(accounts)
    .values({
      email,
      passwordHash: null,
      role: 'traveler',
      displayName,
    })
    .onConflictDoNothing({ target: accounts.email })
    .returning({
      id: accounts.id,
      email: accounts.email,
      role: accounts.role,
      displayName: accounts.displayName,
    });

  if (inserted.length) return inserted[0];

  // Lost a race — another request created it. Re-select.
  const after = await db()
    .select({
      id: accounts.id,
      email: accounts.email,
      role: accounts.role,
      displayName: accounts.displayName,
    })
    .from(accounts)
    .where(eq(accounts.email, email))
    .limit(1);
  if (!after.length) {
    throw new HttpError(500, 'account_provision_failed', 'Failed to provision account');
  }
  return after[0];
}

/**
 * Sign up a new user with Neon Auth (creates the identity + session), then
 * provision the matching internal account. Agent requests also create the
 * agent profile (role `agent`, unverified). Admin is never self-assignable.
 */
export async function registerAccount(input: RegisterInput): Promise<{
  accountId: string;
  role: string;
  agentId: string | null;
  email: string;
}> {
  if (input.role === 'admin') {
    throw new HttpError(403, 'forbidden_role', 'Admins cannot self-register');
  }
  if (!isNeonAuthConfigured()) {
    throw new HttpError(503, 'auth_unconfigured', 'Neon Auth is not configured');
  }

  const auth = getNeonAuth();
  const { data, error } = await auth.signUp.email({
    email: input.email,
    password: input.password,
    name: input.displayName,
  });

  if (error || !data?.user) {
    throw new HttpError(400, 'signup_failed', error?.message ?? 'Sign-up failed');
  }

  const email = data.user.email;
  const desiredRole: AccountRole = input.role === 'agent' ? 'agent' : 'traveler';

  // Provision (or adopt an existing) account with the desired role.
  const account = await upsertAccountRole(email, desiredRole, input.displayName, {
    agent: input.agent,
  });

  return {
    accountId: account.accountId,
    role: desiredRole,
    agentId: account.agentId,
    email,
  };
}

/**
 * Verify credentials via Neon Auth and return the linked account. Throws 401
 * on invalid credentials or an unlinked session.
 */
export async function authenticate(input: LoginInput): Promise<{
  accountId: string;
  email: string;
  role: string;
  displayName: string | null;
}> {
  if (!isNeonAuthConfigured()) {
    throw new HttpError(503, 'auth_unconfigured', 'Neon Auth is not configured');
  }

  const auth = getNeonAuth();
  const { data, error } = await auth.signIn.email({
    email: input.email,
    password: input.password,
  });

  if (error || !data?.user) {
    throw new HttpError(401, 'invalid_credentials', 'Invalid email or password');
  }

  // The sign-in set the session cookie on the response; provision/link the
  // internal account directly from the returned user because `getSession()`
  // can't see the freshly-set cookie within this same request.
  const account = await findOrProvisionAccount(data.user.email, data.user.name ?? null);

  return {
    accountId: account.id,
    email: account.email,
    role: account.role,
    displayName: account.displayName,
  };
}

/**
 * Create or adopt an internal account with the given role. For `agent` roles
 * this also creates the agent profile (unverified) if it does not exist.
 */
async function upsertAccountRole(
  email: string,
  role: AccountRole,
  displayName: string | null,
  opts: { agent?: RegisterInput['agent'] },
): Promise<{ accountId: string; agentId: string | null }> {
  const found = await db()
    .select({ id: accounts.id, role: accounts.role })
    .from(accounts)
    .where(eq(accounts.email, email))
    .limit(1);

  let accountId: string;
  if (found.length) {
    accountId = found[0].id;
    if (found[0].role !== role) {
      await db()
        .update(accounts)
        .set({ role })
        .where(eq(accounts.id, accountId));
    }
  } else {
    const inserted = await db()
      .insert(accounts)
      .values({ email, passwordHash: null, role, displayName })
      .onConflictDoNothing({ target: accounts.email })
      .returning({ id: accounts.id });
    if (!inserted.length) {
      const after = await db()
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.email, email))
        .limit(1);
      if (!after.length) {
        throw new HttpError(500, 'account_provision_failed', 'Failed to provision account');
      }
      accountId = after[0].id;
    } else {
      accountId = inserted[0].id;
    }
  }

  let agentId: string | null = null;
  if (role === 'agent') {
    const existingProfile = await db()
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.accountId, accountId))
      .limit(1);

    if (!existingProfile.length) {
      const agentInput = opts.agent;
      const profileRows = await db()
        .insert(agents)
        .values({
          accountId,
          displayName: displayName ?? agentInput?.city ?? 'Agent',
          city: agentInput?.city ?? null,
          country: agentInput?.country ?? null,
          contactPhone: agentInput?.phone ?? null,
          bio: agentInput?.bio ?? null,
          licenseType: agentInput?.licenseType ?? null,
          verificationStatus: 'unverified',
          totalTrips: 0,
        })
        .returning({ id: agents.id });
      agentId = profileRows[0]?.id ?? null;
    } else {
      agentId = existingProfile[0].id;
    }
  }

  return { accountId, agentId };
}

/**
 * Sign out of the Neon Auth session (clears the session cookie set by the
 * Neon server method / proxy). Gracefully no-ops when Neon Auth is not active.
 */
export async function endNeonSession(): Promise<void> {
  if (!isNeonAuthConfigured()) return;
  const auth = getNeonAuth();
  await auth.signOut();
}
