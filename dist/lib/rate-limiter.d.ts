interface RateLimiterOptions {
    windowMs: number;
    maxRequests: number;
}
/**
 * Very small sliding-window rate limiter keyed by tool or cluster/tool combination.
 */
export declare class RateLimiter {
    private readonly windowMs;
    private readonly maxRequests;
    private readonly buckets;
    constructor(options: RateLimiterOptions);
    consume(key: string): void;
    describe(): RateLimiterOptions;
}
export {};
