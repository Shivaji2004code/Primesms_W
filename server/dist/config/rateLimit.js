"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noLimiter = exports.readLimiter = exports.writeLimiter = exports.resetLimiter = exports.otpLimiter = exports.loginLimiter = exports.adminLimiter = exports.authLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const envN = (k, def) => {
    const v = process.env[k];
    if (!v)
        return def;
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
};
const WINDOW_MS = envN('RL_WINDOW_MS', 15 * 60 * 1000);
const GLOBAL_MAX = envN('RL_GLOBAL_MAX', 10000);
const AUTH_MAX = envN('RL_AUTH_MAX', 15000);
const ADMIN_MAX = envN('RL_ADMIN_MAX', 20000);
const LOGIN_MAX = envN('RL_LOGIN_MAX', 100);
const OTP_MAX = envN('RL_OTP_MAX', 50);
const RESET_MAX = envN('RL_RESET_MAX', 50);
const WRITE_MAX = envN('RL_WRITE_MAX', 2000);
const READ_MAX = envN('RL_READ_MAX', 5000);
const keyByUserOrIp = (req) => {
    const userId = req.session?.userId;
    return userId ? `user:${userId}` : `ip:${req.ip}`;
};
const isHealthPath = (path) => {
    return path === '/health' ||
        path === '/healthz' ||
        path === '/api/health' ||
        path === '/api/healthz' ||
        path.startsWith('/api/health/');
};
const stdOpts = {
    windowMs: WINDOW_MS,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
};
exports.globalLimiter = (0, express_rate_limit_1.default)({
    ...stdOpts,
    max: GLOBAL_MAX,
    keyGenerator: keyByUserOrIp,
    skip: (req) => {
        const p = req.path;
        if (isHealthPath(p))
            return true;
        if (p.startsWith('/assets') ||
            p.startsWith('/static') ||
            p.startsWith('/favicon') ||
            p.startsWith('/_vite') ||
            p.includes('.'))
            return true;
        if (req.method === 'GET')
            return true;
        return false;
    },
    message: { error: 'TOO_MANY_REQUESTS_GLOBAL', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    ...stdOpts,
    max: AUTH_MAX,
    keyGenerator: keyByUserOrIp,
    message: { error: 'TOO_MANY_REQUESTS_AUTH', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});
exports.adminLimiter = (0, express_rate_limit_1.default)({
    ...stdOpts,
    max: ADMIN_MAX,
    keyGenerator: keyByUserOrIp,
    skipSuccessfulRequests: true,
    message: { error: 'TOO_MANY_REQUESTS_ADMIN', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});
exports.loginLimiter = (0, express_rate_limit_1.default)({
    ...stdOpts,
    max: LOGIN_MAX,
    keyGenerator: (req) => `ip:${req.ip}`,
    skipSuccessfulRequests: false,
    message: { error: 'TOO_MANY_LOGIN_ATTEMPTS', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});
exports.otpLimiter = (0, express_rate_limit_1.default)({
    ...stdOpts,
    max: OTP_MAX,
    keyGenerator: (req) => `ip:${req.ip}`,
    message: { error: 'TOO_MANY_OTP_REQUESTS', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});
exports.resetLimiter = (0, express_rate_limit_1.default)({
    ...stdOpts,
    max: RESET_MAX,
    keyGenerator: (req) => `ip:${req.ip}`,
    message: { error: 'TOO_MANY_PASSWORD_RESETS', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});
exports.writeLimiter = (0, express_rate_limit_1.default)({
    ...stdOpts,
    max: WRITE_MAX,
    keyGenerator: keyByUserOrIp,
    message: { error: 'TOO_MANY_WRITES', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});
exports.readLimiter = (0, express_rate_limit_1.default)({
    ...stdOpts,
    max: READ_MAX,
    keyGenerator: keyByUserOrIp,
    skipSuccessfulRequests: true,
    message: { error: 'TOO_MANY_READS', retryAfter: Math.ceil(WINDOW_MS / 1000) }
});
const noLimiter = (req, res, next) => next();
exports.noLimiter = noLimiter;
console.log('[RATE LIMIT CONFIG]', {
    windowMs: WINDOW_MS,
    global: GLOBAL_MAX,
    auth: AUTH_MAX,
    admin: ADMIN_MAX,
    login: LOGIN_MAX,
    writes: WRITE_MAX,
    reads: READ_MAX
});
//# sourceMappingURL=rateLimit.js.map