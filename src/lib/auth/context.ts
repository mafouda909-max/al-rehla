import type { NextRequest } from 'next/server';
import { resolveAuthContext } from '@/lib/services/auth';
import type { AuthContext } from '@/lib/auth/types';
import type { AccountRole } from '@/lib/db/schema';

export type { AuthContext };
export type { AccountRole };

export async function getAuth(request: NextRequest): Promise<AuthContext | null> {
  // `request` is retained for signature compatibility; the Neon Auth session is
  // resolved from the request context (next/headers) rather than the cookie jar.
  void request;
  return resolveAuthContext();
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
