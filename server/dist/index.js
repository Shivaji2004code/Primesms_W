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
// Load environment variables
dotenv_1.default.config();
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const templates_1 = __importDefault(require("./routes/templates"));
const whatsapp_1 = __importDefault(require("./routes/whatsapp"));
const send_1 = __importDefault(require("./routes/send"));
const credits_1 = __importDefault(require("./routes/credits"));
const logs_1 = __importDefault(require("./routes/logs"));
// Import middleware
const auth_2 = require("./middleware/auth");
// Import services
const logCleanup_1 = require("./services/logCleanup");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5050;
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
        console.error('Error connecting to database:', err.stack);
    }
    else {
        console.log('Connected to PostgreSQL database');
        release();
    }
});
// Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
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
// Page routes (with redirect middleware for expired sessions)
app.get('/dashboard', auth_2.requireAuthWithRedirect, (req, res) => {
    res.send('<h1>User Dashboard</h1><p>Welcome to your dashboard!</p>');
});
app.get('/campaigns', auth_2.requireAuthWithRedirect, (req, res) => {
    res.send('<h1>Campaigns</h1><p>Manage your campaigns here.</p>');
});
app.get('/templates', auth_2.requireAuthWithRedirect, (req, res) => {
    res.send('<h1>Templates</h1><p>Manage your templates here.</p>');
});
// Login page (no auth required)
app.get('/login', (req, res) => {
    res.send('<h1>Login</h1><form><p>Please log in to continue.</p></form>');
});
// API routes (use regular auth middleware, return JSON)
app.use('/api/auth', auth_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/whatsapp', whatsapp_1.default);
app.use('/api/templates', templates_1.default);
app.use('/api/credits', credits_1.default);
app.use('/api/logs', logs_1.default);
app.use('/api', send_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    // Start log cleanup service
    logCleanup_1.logCleanupService.startScheduledCleanup();
});
//# sourceMappingURL=index.js.map