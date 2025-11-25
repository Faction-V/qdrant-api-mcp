interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

/**
 * Very small sliding-window rate limiter keyed by tool or cluster/tool combination.
 */
export class RateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly buckets: Map<string, number[]>;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.buckets = new Map();
  }

  consume(key: string): void {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? [];
    const windowStart = now - this.windowMs;
    const recentCalls = bucket.filter((timestamp) => timestamp >= windowStart);

    if (recentCalls.length >= this.maxRequests) {
      throw new Error(
        `Rate limit exceeded for '${key}'. Max ${this.maxRequests} calls every ${this.windowMs}ms.`
      );
    }

    recentCalls.push(now);
    this.buckets.set(key, recentCalls);
  }

  describe(): RateLimiterOptions {
    return {
      windowMs: this.windowMs,
      maxRequests: this.maxRequests,
    };
  }
}
