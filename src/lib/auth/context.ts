import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import type { AccountRole } from '@/lib/db/schema';

/** The authenticated principal derived ONLY from the server-side session. */
export interface AuthContext {
  accountId: string;
  email: string;
  role: AccountRole;
  displayName: string | null;
  sessionId: string;
}

export async function getAuth(request: NextRequest): Promise<AuthContext | null> {
  const session = await getSessionFromRequest(request);
  if (!session) return null;
  return {
    accountId: session.accountId,
    email: session.email,
    role: session.role,
    displayName: session.displayName,
    sessionId: session.sessionId,
  };
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = 'Not authenticated') {
    super(message);
  }
}

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = 'Not authorized') {
    super(message);
  }
}

/** Require an authenticated session. Throws 401 if missing. */
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const ctx = await getAuth(request);
  if (!ctx) throw new UnauthorizedError();
  return ctx;
}

/** Require authentication AND a specific role. Throws 401/403 otherwise. */
export async function requireRole(
  request: NextRequest,
  role: AccountRole,
): Promise<AuthContext> {
  const ctx = await requireAuth(request);
  if (ctx.role !== role) throw new ForbiddenError(`Requires role: ${role}`);
  return ctx;
}

/** Require that the authenticated account is one of the given roles. */
export async function requireAnyRole(
  request: NextRequest,
  roles: AccountRole[],
): Promise<AuthContext> {
  const ctx = await requireAuth(request);
  if (!roles.includes(ctx.role)) {
    throw new ForbiddenError(`Requires one of roles: ${roles.join(', ')}`);
  }
  return ctx;
}
