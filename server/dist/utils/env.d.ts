interface RequiredEnvVars {
    NODE_ENV: string;
    PORT: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    SESSION_SECRET: string;
}
interface OptionalEnvVars {
    CORS_ORIGINS?: string;
    RATE_LIMIT_WINDOW_MS?: string;
    RATE_LIMIT_MAX_REQUESTS?: string;
    LOG_LEVEL?: string;
    MAX_JSON_SIZE?: string;
    TRUST_PROXY?: string;
}
declare class EnvValidator {
    private requiredVars;
    private optionalVars;
    constructor();
    private validateAndLoadEnv;
    private validateFormats;
    get nodeEnv(): string;
    get port(): number;
    get isProduction(): boolean;
    get isDevelopment(): boolean;
    get database(): {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
    };
    get sessionSecret(): string;
    get corsOrigins(): string[];
    get rateLimit(): {
        windowMs: number;
        maxRequests: number;
    };
    get logLevel(): string;
    get maxJsonSize(): string;
    get trustProxy(): number;
    isReady(): {
        ready: boolean;
        message?: string;
    };
}
export declare const env: EnvValidator;
export type { RequiredEnvVars, OptionalEnvVars };
//# sourceMappingURL=env.d.ts.map