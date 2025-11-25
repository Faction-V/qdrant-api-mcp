"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
/**
 * Very small sliding-window rate limiter keyed by tool or cluster/tool combination.
 */
class RateLimiter {
    constructor(options) {
        this.windowMs = options.windowMs;
        this.maxRequests = options.maxRequests;
        this.buckets = new Map();
    }
    consume(key) {
        const now = Date.now();
        const bucket = this.buckets.get(key) ?? [];
        const windowStart = now - this.windowMs;
        const recentCalls = bucket.filter((timestamp) => timestamp >= windowStart);
        if (recentCalls.length >= this.maxRequests) {
            throw new Error(`Rate limit exceeded for '${key}'. Max ${this.maxRequests} calls every ${this.windowMs}ms.`);
        }
        recentCalls.push(now);
        this.buckets.set(key, recentCalls);
    }
    describe() {
        return {
            windowMs: this.windowMs,
            maxRequests: this.maxRequests,
        };
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map