import { NextRequest } from 'next/server';
import { created, withErrorHandling } from '@/lib/api-response';
import { parseBody } from '@/lib/api-body';
import { contactRequestCreateSchema } from '@/lib/validation/contact-request';
import { getAuth } from '@/lib/auth/context';
import { createContactRequest } from '@/lib/services/contacts';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/** POST /api/contacts — create a lead (contact request) against an offer/agent. */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const rl = rateLimit({ limit: 20, windowSec: 60, key: clientIp(request) });
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: { code: 'rate_limited', message: 'Too many requests' } }), {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec), 'content-type': 'application/json' },
    });
  }

  const input = await parseBody(request, contactRequestCreateSchema);
  const auth = await getAuth(request);

  const contact = await createContactRequest(input, {
    travelerAccountId: auth?.accountId ?? null,
  });

  return created({ contact });
});
