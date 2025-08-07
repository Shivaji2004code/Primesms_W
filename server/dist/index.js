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
const pg_1 = require("pg");
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const path_1 = __importDefault(require("path"));
// Load environment variables only in development
if (process.env.NODE_ENV !== 'production') {
    dotenv_1.default.config();
}
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
const PORT = Number(process.env.PORT) || 5050;
// Setup pino HTTP logging
app.use((0, pino_http_1.default)({ logger }));
// Compression middleware
app.use((0, compression_1.default)());
// Database connection
exports.pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5431'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});
// Test database connection
exports.pool.connect((err, client, release) => {
    if (err) {
        logger.error({ err }, 'Error connecting to database');
    }
    else {
        logger.info('Connected to PostgreSQL database');
        release();
    }
});
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
// Session configuration
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
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
// Health check endpoint for Coolify
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});
// Legacy health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
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
        await exports.pool.end();
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
    logger.info(`Server listening on ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    // Start log cleanup service
    logCleanup_1.logCleanupService.startScheduledCleanup();
});
//# sourceMappingURL=index.js.map