import { RateLimitRequestHandler } from 'express-rate-limit';
import type { Request } from 'express';
export declare const globalLimiter: RateLimitRequestHandler;
export declare const authLimiter: RateLimitRequestHandler;
export declare const adminLimiter: RateLimitRequestHandler;
export declare const loginLimiter: RateLimitRequestHandler;
export declare const otpLimiter: RateLimitRequestHandler;
export declare const resetLimiter: RateLimitRequestHandler;
export declare const writeLimiter: RateLimitRequestHandler;
export declare const readLimiter: RateLimitRequestHandler;
export declare const noLimiter: (req: Request, res: any, next: any) => any;
//# sourceMappingURL=rateLimit.d.ts.map