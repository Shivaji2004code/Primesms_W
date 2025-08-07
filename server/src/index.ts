import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import pino from 'pino';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import path from 'path';

// Load environment variables only in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

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
const PORT = Number(process.env.PORT) || 5050;

// Setup pino HTTP logging
app.use(pinoHttp({ logger }));

// Compression middleware
app.use(compression());

// Database connection - supports both DATABASE_URL and individual variables
export const pool = new Pool(
  process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5431'),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    logger.error({ err }, 'Error connecting to database');
  } else {
    logger.info('Connected to PostgreSQL database');
    release();
  }
});

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

// Session configuration
app.use(session({
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
  logger.info(`Server listening on ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start log cleanup service
  logCleanupService.startScheduledCleanup();
});