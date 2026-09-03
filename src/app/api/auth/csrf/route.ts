import { ok } from '@/lib/api-response';
import { generateCsrf } from '@/lib/csrf';

export const runtime = 'nodejs';

/**
 * GET /api/auth/csrf
 * Returns a fresh CSRF token and sets the double-submit cookie.
 * Clients should send the token back in the `x-csrf-token` header on any
 * state-changing request (POST/PATCH/DELETE).
 */
export async function GET() {
  const csrf = generateCsrf();
  const response = ok({ csrfToken: csrf.token });
  response.cookies.set(csrf.cookie.name, csrf.cookie.value, csrf.cookie.options);
  return response;
}
