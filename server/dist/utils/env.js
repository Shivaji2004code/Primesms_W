"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
class EnvValidator {
    constructor() {
        this.validateAndLoadEnv();
    }
    validateAndLoadEnv() {
        const missing = [];
        const requiredEnvKeys = [
            'NODE_ENV',
            'PORT',
            'DB_HOST',
            'DB_PORT',
            'DB_NAME',
            'DB_USER',
            'DB_PASSWORD',
            'SESSION_SECRET'
        ];
        requiredEnvKeys.forEach(key => {
            if (!process.env[key] || (key === 'DB_PASSWORD' && (process.env[key] === 'none' || process.env[key] === ''))) {
                if (key === 'DB_PASSWORD')
                    return;
                missing.push(key);
            }
        });
        if (missing.length > 0) {
            console.error('❌ Missing required environment variables:', missing.join(', '));
            console.error('Please check your .env file and ensure all required variables are set.');
            process.exit(1);
        }
        this.requiredVars = {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            DB_HOST: process.env.DB_HOST,
            DB_PORT: process.env.DB_PORT,
            DB_NAME: process.env.DB_NAME,
            DB_USER: process.env.DB_USER,
            DB_PASSWORD: process.env.DB_PASSWORD === 'none' ? '' : process.env.DB_PASSWORD,
            SESSION_SECRET: process.env.SESSION_SECRET,
        };
        this.optionalVars = {
            CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173',
            RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
            RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
            LOG_LEVEL: process.env.LOG_LEVEL || 'info',
            MAX_JSON_SIZE: process.env.MAX_JSON_SIZE || '100kb',
            TRUST_PROXY: process.env.TRUST_PROXY || '1',
        };
        this.validateFormats();
    }
    validateFormats() {
        const port = parseInt(this.requiredVars.PORT);
        if (isNaN(port) || port < 1 || port > 65535) {
            console.error('❌ PORT must be a valid number between 1 and 65535');
            process.exit(1);
        }
        const dbPort = parseInt(this.requiredVars.DB_PORT);
        if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
            console.error('❌ DB_PORT must be a valid number between 1 and 65535');
            process.exit(1);
        }
        if (this.requiredVars.SESSION_SECRET.length < 32) {
            console.error('❌ SESSION_SECRET must be at least 32 characters long');
            process.exit(1);
        }
        if (!['development', 'production', 'test'].includes(this.requiredVars.NODE_ENV)) {
            console.error('❌ NODE_ENV must be one of: development, production, test');
            process.exit(1);
        }
    }
    get nodeEnv() {
        return this.requiredVars.NODE_ENV;
    }
    get port() {
        return parseInt(this.requiredVars.PORT);
    }
    get isProduction() {
        return this.requiredVars.NODE_ENV === 'production';
    }
    get isDevelopment() {
        return this.requiredVars.NODE_ENV === 'development';
    }
    get database() {
        return {
            host: this.requiredVars.DB_HOST,
            port: parseInt(this.requiredVars.DB_PORT),
            database: this.requiredVars.DB_NAME,
            user: this.requiredVars.DB_USER,
            password: this.requiredVars.DB_PASSWORD,
        };
    }
    get sessionSecret() {
        return this.requiredVars.SESSION_SECRET;
    }
    get corsOrigins() {
        return this.optionalVars.CORS_ORIGINS?.split(',').map(origin => origin.trim()) || [];
    }
    get rateLimit() {
        return {
            windowMs: parseInt(this.optionalVars.RATE_LIMIT_WINDOW_MS || '900000'),
            maxRequests: parseInt(this.optionalVars.RATE_LIMIT_MAX_REQUESTS || '100'),
        };
    }
    get logLevel() {
        return this.optionalVars.LOG_LEVEL || 'info';
    }
    get maxJsonSize() {
        return this.optionalVars.MAX_JSON_SIZE || '100kb';
    }
    get trustProxy() {
        return parseInt(this.optionalVars.TRUST_PROXY || '1');
    }
    isReady() {
        try {
            if (!this.requiredVars.DB_HOST || !this.requiredVars.SESSION_SECRET) {
                return { ready: false, message: 'Critical environment variables not loaded' };
            }
            return { ready: true };
        }
        catch (error) {
            return { ready: false, message: 'Environment validation failed' };
        }
    }
}
exports.env = new EnvValidator();
//# sourceMappingURL=env.js.map