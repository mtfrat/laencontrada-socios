export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
  resetAt: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  hit(key: string, now: number = Date.now()): RateLimitDecision {
    this.prune(now);

    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;
    const allowed = bucket.count <= this.limit;

    return {
      allowed,
      remaining: Math.max(0, this.limit - bucket.count),
      retryAfterSeconds: allowed
        ? 0
        : Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      limit: this.limit,
      resetAt: bucket.resetAt,
    };
  }

  reset(key?: string): void {
    if (key === undefined) {
      this.buckets.clear();
    } else {
      this.buckets.delete(key);
    }
  }

  get size(): number {
    return this.buckets.size;
  }

  private prune(now: number): void {
    this.buckets.forEach((bucket, key) => {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    });
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const socioLoginIpLimiter = new FixedWindowRateLimiter(30, LOGIN_WINDOW_MS);
export const socioLoginDniLimiter = new FixedWindowRateLimiter(5, LOGIN_WINDOW_MS);
export const staffLoginIpLimiter = new FixedWindowRateLimiter(10, LOGIN_WINDOW_MS);
