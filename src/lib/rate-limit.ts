/**
 * Minimal in-memory fixed-window rate limiter for a single-instance deployment.
 *
 * This is a FOUNDATION. In a horizontally-scaled deployment it must be swapped
 * for a shared store (e.g. Redis/Upstash). The interface is kept small so the
 * swap is trivial, and keyed by caller IP by default.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

// Map<key, Bucket>. A Map gives O(1) access + easy eviction sweep.
const buckets = new Map<string, Bucket>();

export interface RateLimitConfig {
  /** Max requests per window. */
  limit: number;
  /** Window size in seconds. */
  windowSec: number;
  /** Optionally vary key by a secondary dimension (e.g. user id). */
  key?: string;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  retryAfterSec: number;
}

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  // Keep the map small: sweep expired buckets when we're over a threshold.
  if (buckets.size > 5_000) sweep(now);

  const key = config.key ?? 'anonymous';
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + config.windowSec * 1000;
    buckets.set(key, { count: 1, resetAt });
    return {
      ok: true,
      remaining: config.limit - 1,
      resetAt,
      limit: config.limit,
      retryAfterSec: 0,
    };
  }

  bucket.count += 1;
  if (bucket.count > config.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      ok: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      limit: config.limit,
      retryAfterSec,
    };
  }

  return {
    ok: true,
    remaining: config.limit - bucket.count,
    resetAt: bucket.resetAt,
    limit: config.limit,
    retryAfterSec: 0,
  };
}

/** Simple client IP extractor that tolerates proxies in dev. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
