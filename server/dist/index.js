"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const path_1 = __importDefault(require("path"));
// @ts-ignore types may vary
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
// Load environment variables (always load for local testing)
dotenv_1.default.config();
// Import database pool
const db_1 = require("./db");
Object.defineProperty(exports, "pool", { enumerable: true, get: function () { return db_1.pool; } });
const PgSession = (0, connect_pg_simple_1.default)(express_session_1.default);
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const templates_1 = __importDefault(require("./routes/templates"));
const whatsapp_1 = __importDefault(require("./routes/whatsapp"));
const send_1 = __importDefault(require("./routes/send"));
const credits_1 = __importDefault(require("./routes/credits"));
const logs_1 = __importDefault(require("./routes/logs"));
// Import services
const logCleanup_1 = require("./services/logCleanup");
// Setup logger
const logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'password',
            'db.password',
            '*.token',
            '*.secret',
            'authorization',
        ],
        remove: true
    }
});
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3000;
// Setup pino HTTP logging
app.use((0, pino_http_1.default)({ logger }));
// Compression middleware
app.use((0, compression_1.default)());
// Trust proxy for Coolify deployment
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// Rate limiting
app.use((0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 300, // 300 requests per minute per IP
    message: { error: 'Too many requests, please try again later' }
}));
// CORS - only needed for development
if (process.env.NODE_ENV !== 'production') {
    app.use((0, cors_1.default)({
        origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
        credentials: true
    }));
}
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Session configuration with PostgreSQL store
app.use((0, express_session_1.default)({
    store: new PgSession({
        pool: db_1.pool,
        tableName: 'session',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    }
}));
// Serve static files from client build
const clientDist = path_1.default.join(__dirname, '../../client/dist');
app.use(express_1.default.static(clientDist, { maxAge: '7d', etag: true }));
// API routes (use regular auth middleware, return JSON)
app.use('/api/auth', auth_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/whatsapp', whatsapp_1.default);
app.use('/api/templates', templates_1.default);
app.use('/api/credits', credits_1.default);
app.use('/api/logs', logs_1.default);
app.use('/api', send_1.default);
// Health check endpoints with database connectivity
app.get('/healthz', async (req, res) => {
    try {
        await db_1.pool.query('SELECT 1');
        res.status(200).send('ok');
    }
    catch (e) {
        res.status(500).send('db down');
    }
});
app.get('/health', async (req, res) => {
    try {
        await db_1.pool.query('SELECT 1');
        res.status(200).json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    }
    catch (e) {
        res.status(500).json({
            status: 'error',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: 'disconnected'
        });
    }
});
// Legacy health check
app.get('/api/health', async (req, res) => {
    try {
        await db_1.pool.query('SELECT 1');
        res.json({ status: 'Server is running', timestamp: new Date().toISOString(), database: 'connected' });
    }
    catch (e) {
        res.status(500).json({ status: 'Server running but database disconnected', timestamp: new Date().toISOString() });
    }
});
// Centralized error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    req.log?.error({ err }, 'Unhandled error');
    const status = err.statusCode || 500;
    const message = status === 500 ? 'Internal Server Error' : err.message;
    res.status(status).json({ error: message });
});
// SPA fallback - serve React app for all non-API routes
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api'))
        return next();
    res.sendFile(path_1.default.join(clientDist, 'index.html'));
});
// 404 handler for API routes only
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
});
// Graceful shutdown handler
const shutdown = async (signal) => {
    try {
        logger.info(`${signal} received, shutting down...`);
        // Close HTTP server
        if (server && server.close) {
            await new Promise((resolve) => server.close(() => resolve()));
        }
        // Close database pool
        await db_1.pool.end();
        logger.info('Graceful shutdown complete');
        process.exit(0);
    }
    catch (e) {
        logger.error({ e }, 'Error during shutdown');
        process.exit(1);
    }
};
// Register shutdown handlers
['SIGTERM', 'SIGINT'].forEach(signal => process.on(signal, () => shutdown(signal)));
// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on http://0.0.0.0:${PORT} (env=${process.env.NODE_ENV})`);
    // Start log cleanup service
    logCleanup_1.logCleanupService.startScheduledCleanup();
});
//# sourceMappingURL=index.js.map