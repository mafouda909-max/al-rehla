import { getNeonAuth, isNeonAuthConfigured } from '@/lib/auth/neon';

export const runtime = 'nodejs';

type Params = { path: string[] };
type RouteContext = { params: Promise<Params> };
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

function notConfigured() {
  return new Response(
    JSON.stringify({
      error: { code: 'auth_unconfigured', message: 'Neon Auth is not configured' },
    }),
    { status: 503, headers: { 'content-type': 'application/json' } },
  );
}

/**
 * Proxy for the Neon Auth server. Mount at `/api/auth/[...path]` so the
 * browser can sign in/out and refresh sessions through the app (same-origin,
 * no CORS), while the Neon server owns the actual credentials.
 *
 * When Neon Auth env vars are missing, every method returns 503 so the rest of
 * the app degrades to "unauthenticated" (protected endpoints → 401) instead of
 * crashing.
 */
async function dispatch(method: Method, request: Request, ctx: RouteContext) {
  if (!isNeonAuthConfigured()) return notConfigured();
  const handler = getNeonAuth().handler();
  return handler[method](request, ctx);
}

export const GET = (request: Request, ctx: RouteContext) => dispatch('GET', request, ctx);
export const POST = (request: Request, ctx: RouteContext) => dispatch('POST', request, ctx);
export const PUT = (request: Request, ctx: RouteContext) => dispatch('PUT', request, ctx);
export const DELETE = (request: Request, ctx: RouteContext) => dispatch('DELETE', request, ctx);
export const PATCH = (request: Request, ctx: RouteContext) => dispatch('PATCH', request, ctx);
