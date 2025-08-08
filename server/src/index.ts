import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import dotenv from 'dotenv';
import pino from 'pino';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import path from 'path';
// @ts-ignore types may vary
import pgSimple from 'connect-pg-simple';

// Load environment variables (always load for local testing)
dotenv.config();

// Import database pool
import { pool } from './db';

const PgSession = pgSimple(session);

// Import routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import templateRoutes from './routes/templates';
import whatsappRoutes from './routes/whatsapp';
import sendRoutes from './routes/send';
import creditsRoutes from './routes/credits';
import logsRoutes from './routes/logs';

// Import middleware
import { requireAuthWithRedirect } from './middleware/auth';

// Import services
import { logCleanupService } from './services/logCleanup';

// Setup logger
const logger = pino({
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

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Setup pino HTTP logging
app.use(pinoHttp({ logger }));

// Compression middleware
app.use(compression());

// Export pool for other modules
export { pool };

// Trust proxy for Coolify deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
app.use(rateLimit({ 
  windowMs: 60_000, 
  max: 300, // 300 requests per minute per IP
  message: { error: 'Too many requests, please try again later' }
}));

// CORS - only needed for development
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  }));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration with PostgreSQL store
app.use(session({
  store: new PgSession({ 
    pool, 
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

console.log('[SESSION] using connect-pg-simple');

// Serve static files from client build
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist, { maxAge: '7d', etag: true }));

// API routes (use regular auth middleware, return JSON)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api', sendRoutes);

// Health check endpoints with database connectivity
app.get('/healthz', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).send('ok');
  } catch (e) {
    res.status(500).send('db down');
  }
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ 
      status: 'ok', 
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (e) {
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
    await pool.query('SELECT 1');
    res.json({ status: 'Server is running', timestamp: new Date().toISOString(), database: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'Server running but database disconnected', timestamp: new Date().toISOString() });
  }
});

// Centralized error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  (req as any).log?.error({ err }, 'Unhandled error');
  const status = err.statusCode || 500;
  const message = status === 500 ? 'Internal Server Error' : err.message;
  res.status(status).json({ error: message });
});

// SPA fallback - serve React app for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Graceful shutdown handler
const shutdown = async (signal: string) => {
  try {
    logger.info(`${signal} received, shutting down...`);
    // Close HTTP server
    if (server && server.close) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    // Close database pool
    await pool.end();
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (e) {
    logger.error({ e }, 'Error during shutdown');
    process.exit(1);
  }
};

// Register shutdown handlers
['SIGTERM', 'SIGINT'].forEach(signal => 
  process.on(signal, () => shutdown(signal))
);

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on http://0.0.0.0:${PORT} (env=${process.env.NODE_ENV})`);
  
  // Start log cleanup service
  logCleanupService.startScheduledCleanup();
});