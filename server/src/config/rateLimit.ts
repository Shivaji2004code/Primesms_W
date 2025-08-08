// server/src/config/rateLimit.ts
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import type { Request } from 'express';

type Num = number | undefined;

const envN = (k: string, def: number): number => {
  const v = process.env[k];
  if (!v) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

// Much higher limits to prevent admin "Too many requests" errors
const WINDOW_MS = envN('RL_WINDOW_MS', 15 * 60 * 1000);     // default 15m

// Global caps (very generous for production)
const GLOBAL_MAX = envN('RL_GLOBAL_MAX', 10000);             // 10k per 15min
// Logged-in users (applied in addition to global, but higher)
const AUTH_MAX = envN('RL_AUTH_MAX', 15000);                 // 15k per 15min
// Admin section (very high to prevent admin panel issues)
const ADMIN_MAX = envN('RL_ADMIN_MAX', 20000);               // 20k per 15min

// Sensitive endpoints (reasonable but not too restrictive)
const LOGIN_MAX = envN('RL_LOGIN_MAX', 100);                 // 100 per 15min
const OTP_MAX = envN('RL_OTP_MAX', 50);                      // 50 per 15min
const RESET_MAX = envN('RL_RESET_MAX', 50);                  // 50 per 15min

// Writes (POST/PUT/PATCH/DELETE) baseline
const WRITE_MAX = envN('RL_WRITE_MAX', 2000);                // 2k writes per 15min

// Templates/API reads (high limit for dashboard)
const READ_MAX = envN('RL_READ_MAX', 5000);                  // 5k reads per 15min

// Helpers
const keyByUserOrIp = (req: Request) => {
  const userId = (req.session as any)?.userId;
  return userId ? `user:${userId}` : `ip:${req.ip}`;
};

const stdOpts = {
  windowMs: WINDOW_MS,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for successful requests to reduce false positives
  skipSuccessfulRequests: true
};

export const globalLimiter: RateLimitRequestHandler = rateLimit({
  ...stdOpts,
  max: GLOBAL_MAX,
  keyGenerator: keyByUserOrIp,
  // Never rate-limit health, static assets, or successful GETs
  skip: (req) => {
    const p = req.path;
    // Health endpoints
    if (p.startsWith('/health') || 
        p.startsWith('/api/health') || 
        p.startsWith('/api/healthz')) return true;
    
    // Static assets
    if (p.startsWith('/assets') || 
        p.startsWith('/static') || 
        p.startsWith('/favicon') || 
        p.startsWith('/_vite') ||
        p.includes('.')) return true; // Files with extensions
    
    // Skip successful GET requests to reduce admin panel issues
    if (req.method === 'GET') return true;
    
    return false;
  },
  message: { error: 'TOO_MANY_REQUESTS_GLOBAL', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});

export const authLimiter: RateLimitRequestHandler = rateLimit({
  ...stdOpts,
  max: AUTH_MAX,
  keyGenerator: keyByUserOrIp,
  message: { error: 'TOO_MANY_REQUESTS_AUTH', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});

export const adminLimiter: RateLimitRequestHandler = rateLimit({
  ...stdOpts,
  max: ADMIN_MAX,
  keyGenerator: keyByUserOrIp,
  // Very lenient for admin - only block obvious abuse
  skipSuccessfulRequests: true,
  message: { error: 'TOO_MANY_REQUESTS_ADMIN', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});

export const loginLimiter: RateLimitRequestHandler = rateLimit({
  ...stdOpts,
  max: LOGIN_MAX,
  keyGenerator: (req) => `ip:${req.ip}`,
  skipSuccessfulRequests: false, // Count all login attempts
  message: { error: 'TOO_MANY_LOGIN_ATTEMPTS', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});

export const otpLimiter: RateLimitRequestHandler = rateLimit({
  ...stdOpts,
  max: OTP_MAX,
  keyGenerator: (req) => `ip:${req.ip}`,
  message: { error: 'TOO_MANY_OTP_REQUESTS', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});

export const resetLimiter: RateLimitRequestHandler = rateLimit({
  ...stdOpts,
  max: RESET_MAX,
  keyGenerator: (req) => `ip:${req.ip}`,
  message: { error: 'TOO_MANY_PASSWORD_RESETS', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});

// For write endpoints (generous but still protective)
export const writeLimiter: RateLimitRequestHandler = rateLimit({
  ...stdOpts,
  max: WRITE_MAX,
  keyGenerator: keyByUserOrIp,
  message: { error: 'TOO_MANY_WRITES', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});

// For read-heavy endpoints like templates, campaigns, logs
export const readLimiter: RateLimitRequestHandler = rateLimit({
  ...stdOpts,
  max: READ_MAX,
  keyGenerator: keyByUserOrIp,
  skipSuccessfulRequests: true, // Don't count successful reads
  message: { error: 'TOO_MANY_READS', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});

// No-op limiter for completely exempt routes
export const noLimiter = (req: Request, res: any, next: any) => next();

// Debug info
console.log('[RATE LIMIT CONFIG]', {
  windowMs: WINDOW_MS,
  global: GLOBAL_MAX,
  auth: AUTH_MAX,
  admin: ADMIN_MAX,
  login: LOGIN_MAX,
  writes: WRITE_MAX,
  reads: READ_MAX
});