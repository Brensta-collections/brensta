/**
 * Lightweight in-memory rate limiter.
 * NOT suitable for horizontally-scaled production — swap for Upstash Redis in prod.
 * Good enough for local dev and single-instance deploys.
 */
type Bucket = { tokens: number; last: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; retryAfterSec: number };

export function rateLimit(key: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  const refillRate = limit / (windowSec * 1000); // tokens per ms
  const b = buckets.get(key) ?? { tokens: limit, last: now };
  const elapsed = now - b.last;
  b.tokens = Math.min(limit, b.tokens + elapsed * refillRate);
  b.last = now;
  if (b.tokens < 1) {
    const needed = 1 - b.tokens;
    const waitMs = Math.ceil(needed / refillRate);
    buckets.set(key, b);
    return { allowed: false, retryAfterSec: Math.ceil(waitMs / 1000) };
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return { allowed: true, retryAfterSec: 0 };
}

export function ipFromRequest(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local"
  );
}
