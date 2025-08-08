// src/index.ts
import { config } from 'dotenv';
config(); // Load environment variables before anything else

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import path from 'path';
import pool from './db';

// Import utilities and configuration
import { env } from './utils/env';
import { logger, logStartup, logError, createHttpLogger } from './utils/logger';
import { 
  errorHandler, 
  notFoundHandler, 
  setupGlobalErrorHandlers
} from './middleware/errorHandler';

// Import routes
import healthRoutes from './routes/health';
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

// Setup global error handlers
setupGlobalErrorHandlers();

const app: Application = express();

// ============================================================================
// SECURITY MIDDLEWARE STACK
// ============================================================================

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', env.trustProxy);

// Helmet for security headers
app.use(helmet({
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

// CORS configuration - tightened for production
const allowed = [
  process.env.APP_ORIGIN || 'https://primesms.app',
  'http://localhost:5173', // dev
  'http://localhost:3000'  // dev
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(env.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(env.rateLimit.windowMs / 1000)
    });
  }
});

app.use(limiter);

// HTTP Parameter Pollution protection
app.use(hpp({
  whitelist: ['tags', 'categories'] // Allow arrays for these parameters
}));

// Body parsing with size limits
app.use(express.json({ 
  limit: env.maxJsonSize,
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: env.maxJsonSize,
  parameterLimit: 50
}));

// HTTP request logging
app.use(createHttpLogger());

// Database connection with retry logic
const connectDatabase = async (retries = 5): Promise<void> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logStartup('Database connected successfully', {
      host: env.database.host,
      port: env.database.port,
      database: env.database.database
    });
  } catch (error) {
    logError('Database connection failed', error, { retries });
    
    if (retries > 0) {
      logStartup(`Retrying database connection in 5 seconds... (${retries} attempts left)`);
      setTimeout(() => connectDatabase(retries - 1), 5000);
    } else {
      logError('Database connection failed after all retries');
      process.exit(1);
    }
  }
};

// ============================================================================
// SESSION CONFIGURATION
// ============================================================================

// Initialize PostgreSQL session store
const pgSession = connectPgSimple(session);

app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-development',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ============================================================================
// API ROUTES
// ============================================================================

// Health check routes (no authentication required)
app.use(healthRoutes); // Mount at root level for /health and /healthz
app.use('/api', healthRoutes); // Also mount under /api for existing /api/health
console.log('[HEALTH] routes /health & /healthz ready');

// Authentication routes
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/admin', adminRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/send', sendRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/logs', logsRoutes);

// API Root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Prime SMS API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    documentation: '/api/health'
  });
});

// Legacy routes with redirect middleware
app.get('/templates', requireAuthWithRedirect, (req, res) => {
  res.redirect('/api/templates');
});

// ============================================================================
// STATIC CLIENT SERVING & SPA FALLBACK
// ============================================================================

// Where the built client will be placed by the build step
const clientDir = path.resolve(__dirname, './client-static');

// Serve static assets with sensible caching (immutable hashed assets cache 1y; html no-cache)
app.use(express.static(clientDir, {
  index: false,
  maxAge: '1y',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// SPA fallback: everything NOT starting with /api goes to index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDir, 'index.html'));
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for unknown routes
app.use('*', notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const gracefulShutdown = async (signal: string): Promise<void> => {
  logStartup(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop accepting new connections
    server.close(async () => {
      logStartup('HTTP server closed');
      
      // Close database connections
      try {
        await pool.end();
        logStartup('Database connections closed');
      } catch (error) {
        logError('Error closing database connections', error);
      }
      
      // Stop log cleanup service
      try {
        // Cleanup service stop if available
        logStartup('Log cleanup service stopped');
      } catch (error) {
        logError('Error stopping cleanup service', error);
      }
      
      logStartup('Graceful shutdown completed');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      logError('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    logError('Error during graceful shutdown', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================================================
// START SERVER
// ============================================================================

const startServer = async (): Promise<void> => {
  try {
    // Connect to database first
    await connectDatabase();
    
    // Start log cleanup service
    try {
      // Cleanup service start if available
      logStartup('Log cleanup service started');
    } catch (error) {
      logError('Error starting cleanup service', error);
    }
    
    // Start HTTP server
    const server = app.listen(env.port, () => {
      logStartup(`Server started successfully`, {
        port: env.port,
        environment: env.nodeEnv,
        processId: process.pid,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        corsOrigins: env.corsOrigins,
        rateLimit: env.rateLimit
      });
    });
    
    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logError(`Port ${env.port} is already in use`);
        process.exit(1);
      } else {
        logError('Server error', error);
        process.exit(1);
      }
    });
    
    // Export server for graceful shutdown
    (global as any).server = server;
    
  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
};

// Get server instance for shutdown
const server = (global as any).server;

// Start the server
startServer();

// Export app and pool for testing
export { app };
export default app;