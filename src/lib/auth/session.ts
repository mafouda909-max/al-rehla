import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { accounts, sessions } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { getSessionCookieName } from '@/lib/auth/cookie';

const TOKEN_BYTES = 32;

/** Hash a raw session token for storage. We never store the raw token. */
export function hashSessionToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/** Generate a cryptographically-secure random session token. */
export function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export interface SessionAccount {
  accountId: string;
  email: string;
  role: 'traveler' | 'agent' | 'admin';
  displayName: string | null;
  sessionId: string;
  expiresAt: Date;
}

export interface ActiveSession {
  accountId: string;
  email: string;
  role: 'traveler' | 'agent' | 'admin';
  displayName: string | null;
  sessionId: string;
  expiresAt: Date;
}

/**
 * Look up an active session by its raw cookie token.
 * Returns null on missing/expired/revoked/unknown token.
 * Assumes `accountId` is derived only from the server-side session — never
 * from the client.
 */
export async function getSessionByToken(
  rawToken: string,
): Promise<ActiveSession | null> {
  if (!rawToken) return null;
  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();

  const rows = await db()
    .select({
      sessionId: sessions.id,
      accountId: accounts.id,
      email: accounts.email,
      role: accounts.role,
      displayName: accounts.displayName,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(accounts, eq(sessions.accountId, accounts.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
      ),
    )
    .limit(1);

  if (!rows.length) return null;
  const row = rows[0];
  return {
    accountId: row.accountId,
    email: row.email,
    role: row.role,
    displayName: row.displayName,
    sessionId: row.sessionId,
    expiresAt: row.expiresAt,
  };
}

/** Resolve the current authenticated account from a request cookie. */
export async function getSessionFromRequest(
  request: NextRequest,
): Promise<ActiveSession | null> {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) return null;
  return getSessionByToken(token);
}

/**
 * Persist a new session row and return the raw token to set as the cookie.
 * The raw token is only returned here; only its hash is stored.
 */
export async function createSession(
  accountId: string,
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const ttl = env().SESSION_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + ttl * 1000);

  await db().insert(sessions).values({
    accountId,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
  });

  return { rawToken, expiresAt };
}

/** Revoke a session (logout). Returns the revoked count. */
export async function revokeSession(rawToken: string): Promise<void> {
  const tokenHash = hashSessionToken(rawToken);
  await db()
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.tokenHash, tokenHash));
}

/** Revoke every active session for an account (e.g., password change). */
export async function revokeAllSessions(accountId: string): Promise<void> {
  await db()
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.accountId, accountId), isNull(sessions.revokedAt)));
}
