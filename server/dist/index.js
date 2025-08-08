"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const hpp_1 = __importDefault(require("hpp"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./db"));
const env_1 = require("./utils/env");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const health_1 = __importDefault(require("./routes/health"));
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const templates_1 = __importDefault(require("./routes/templates"));
const whatsapp_1 = __importDefault(require("./routes/whatsapp"));
const send_1 = __importDefault(require("./routes/send"));
const credits_1 = __importDefault(require("./routes/credits"));
const logs_1 = __importDefault(require("./routes/logs"));
const auth_2 = require("./middleware/auth");
(0, errorHandler_1.setupGlobalErrorHandlers)();
const app = (0, express_1.default)();
exports.app = app;
app.set('trust proxy', 1);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const allowedOrigins = [
    'https://primesms.app',
    'http://localhost:5173',
    'http://localhost:3000'
];
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        if (!origin)
            return cb(null, true);
        return cb(null, allowedOrigins.includes(origin));
    },
    credentials: true
}));
app.use((0, compression_1.default)());
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.rateLimit.windowMs,
    max: env_1.env.rateLimit.maxRequests,
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(env_1.env.rateLimit.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn('Rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path
        });
        res.status(429).json({
            success: false,
            error: 'Too many requests, please try again later.',
            retryAfter: Math.ceil(env_1.env.rateLimit.windowMs / 1000)
        });
    }
});
app.use(limiter);
app.use((0, hpp_1.default)({
    whitelist: ['tags', 'categories']
}));
app.use((0, logger_1.createHttpLogger)());
const connectDatabase = async (retries = 5) => {
    try {
        const client = await db_1.default.connect();
        await client.query('SELECT NOW()');
        client.release();
        (0, logger_1.logStartup)('Database connected successfully', {
            host: env_1.env.database.host,
            port: env_1.env.database.port,
            database: env_1.env.database.database
        });
        await createAdminUser();
    }
    catch (error) {
        (0, logger_1.logError)('Database connection failed', error, { retries });
        if (retries > 0) {
            (0, logger_1.logStartup)(`Retrying database connection in 5 seconds... (${retries} attempts left)`);
            setTimeout(() => connectDatabase(retries - 1), 5000);
        }
        else {
            (0, logger_1.logError)('Database connection failed after all retries');
            process.exit(1);
        }
    }
};
const createAdminUser = async () => {
    try {
        const client = await db_1.default.connect();
        const adminCheck = await client.query('SELECT id FROM users WHERE username = $1 LIMIT 1', ['primesms']);
        if (adminCheck.rows.length === 0) {
            await client.query('INSERT INTO users (name, email, username, password, role, credit_balance) VALUES ($1, $2, $3, $4, $5, $6)', ['Prime SMS Admin', 'admin@primesms.app', 'primesms', 'Primesms', 'admin', 999999]);
            (0, logger_1.logStartup)('✅ Admin user created successfully', {
                username: 'primesms',
                email: 'admin@primesms.app'
            });
        }
        else {
            (0, logger_1.logStartup)('ℹ️  Admin user already exists');
        }
        client.release();
    }
    catch (error) {
        (0, logger_1.logError)('Failed to create admin user', error);
    }
};
const ConnectPgSimple = (0, connect_pg_simple_1.default)(express_session_1.default);
const isProd = process.env.NODE_ENV === 'production';
app.use((0, express_session_1.default)({
    store: new ConnectPgSimple({
        pool: db_1.default,
        tableName: 'session',
        createTableIfMissing: true
    }),
    name: 'psid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: isProd ? 'lax' : 'lax',
        secure: isProd,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));
app.use(health_1.default);
app.use('/api', health_1.default);
console.log('[HEALTH] routes /health & /healthz ready');
app.use('/api/auth', auth_1.default);
app.get('/api/debug/session', (req, res) => {
    const s = req.session;
    res.json({
        hasSession: Boolean(req.session),
        userId: s?.userId ?? null
    });
});
app.use('/api/admin', admin_1.default);
app.use('/api/templates', templates_1.default);
app.use('/api/whatsapp', whatsapp_1.default);
app.use('/api/send', send_1.default);
app.use('/api/credits', credits_1.default);
app.use('/api/logs', logs_1.default);
app.get('/api', (req, res) => {
    res.json({
        message: 'Prime SMS API',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        documentation: '/api/health'
    });
});
app.get('/templates', auth_2.requireAuthWithRedirect, (req, res) => {
    res.redirect('/api/templates');
});
const clientDir = path_1.default.resolve(__dirname, './client-static');
app.use(express_1.default.static(clientDir, {
    index: false,
    maxAge: '1y',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
        else {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api'))
        return next();
    res.sendFile(path_1.default.join(clientDir, 'index.html'));
});
app.use('*', errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const gracefulShutdown = async (signal) => {
    (0, logger_1.logStartup)(`Received ${signal}. Starting graceful shutdown...`);
    try {
        server.close(async () => {
            (0, logger_1.logStartup)('HTTP server closed');
            try {
                await db_1.default.end();
                (0, logger_1.logStartup)('Database connections closed');
            }
            catch (error) {
                (0, logger_1.logError)('Error closing database connections', error);
            }
            try {
                (0, logger_1.logStartup)('Log cleanup service stopped');
            }
            catch (error) {
                (0, logger_1.logError)('Error stopping cleanup service', error);
            }
            (0, logger_1.logStartup)('Graceful shutdown completed');
            process.exit(0);
        });
        setTimeout(() => {
            (0, logger_1.logError)('Forcing shutdown after timeout');
            process.exit(1);
        }, 10000);
    }
    catch (error) {
        (0, logger_1.logError)('Error during graceful shutdown', error);
        process.exit(1);
    }
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
const startServer = async () => {
    try {
        await connectDatabase();
        try {
            (0, logger_1.logStartup)('Log cleanup service started');
        }
        catch (error) {
            (0, logger_1.logError)('Error starting cleanup service', error);
        }
        const server = app.listen(env_1.env.port, () => {
            (0, logger_1.logStartup)(`Server started successfully`, {
                port: env_1.env.port,
                environment: env_1.env.nodeEnv,
                processId: process.pid,
                nodeVersion: process.version,
                memory: process.memoryUsage(),
                corsOrigins: env_1.env.corsOrigins,
                rateLimit: env_1.env.rateLimit
            });
        });
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                (0, logger_1.logError)(`Port ${env_1.env.port} is already in use`);
                process.exit(1);
            }
            else {
                (0, logger_1.logError)('Server error', error);
                process.exit(1);
            }
        });
        global.server = server;
    }
    catch (error) {
        (0, logger_1.logError)('Failed to start server', error);
        process.exit(1);
    }
};
const server = global.server;
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map