import { NextResponse } from 'next/server';

/**
 * Consistent JSON responses for the API. Never leaks internal error details;
 * stack traces only in dev when DEV_DEBUG is enabled.
 */

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  const body: ApiError = { error: { code, message, details } };
  return NextResponse.json(body, { status });
}

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Wrap a handler so thrown errors become a typed JSON error response.
 * Forwards all arguments (request, route context) so Next route handlers with
 * `{ params }` work unchanged.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return fail(err.status, err.code, err.message, err.details);
      }
      if (
        err instanceof Error &&
        'status' in err &&
        typeof (err as { status: unknown }).status === 'number'
      ) {
        const status = (err as unknown as { status: number }).status;
        const code =
          status === 401
            ? 'unauthorized'
            : status === 403
              ? 'forbidden'
              : 'request_failed';
        return fail(status, code, err.message);
      }
      // Zod / unexpected errors: log internally, return a safe generic message.
      const debug = process.env.DEV_DEBUG === '1' || process.env.DEV_DEBUG === 'true';
      if (debug) {
        // eslint-disable-next-line no-console
        console.error('[api] unhandled error:', err);
      }
      return fail(500, 'internal_error', 'An unexpected error occurred');
    }
  };
}
