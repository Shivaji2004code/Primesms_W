// src/routes/health.ts
import express, { Request, Response } from 'express';
import pool from '../db';
import { env } from '../utils/env';
import { logInfo, logError } from '../utils/logger';

const router = express.Router();

// Basic health check endpoint
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: env.nodeEnv,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100
      }
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    logError('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Detailed readiness check endpoint
router.get('/ready', async (req: Request, res: Response): Promise<void> => {
  const checks = {
    environment: false,
    database: false,
    memory: false
  };

  const startTime = Date.now();

  try {
    // Check 1: Environment variables
    const envCheck = env.isReady();
    checks.environment = envCheck.ready;

    // Check 2: Database connectivity
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      checks.database = true;
    } catch (dbError) {
      logError('Database readiness check failed', dbError);
      checks.database = false;
    }

    // Check 3: Memory usage (fail if > 90% of heap limit)
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;
    checks.memory = memoryUsagePercent < 90;

    // Determine overall readiness
    const isReady = Object.values(checks).every(check => check === true);
    const duration = Date.now() - startTime;

    const response = {
      status: isReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks,
      responseTime: `${duration}ms`,
      details: {
        environment: checks.environment ? 'OK' : 'Environment variables not properly loaded',
        database: checks.database ? 'Connected' : 'Connection failed',
        memory: checks.memory ? `${Math.round(memoryUsagePercent)}% used` : `${Math.round(memoryUsagePercent)}% used (too high)`
      }
    };

    if (isReady) {
      logInfo('Readiness check passed', { duration: `${duration}ms` });
      res.status(200).json(response);
    } else {
      logError('Readiness check failed', undefined, { checks, duration: `${duration}ms` });
      res.status(503).json(response);
    }

  } catch (error) {
    logError('Readiness check error', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Readiness check encountered an error',
      checks,
      responseTime: `${Date.now() - startTime}ms`
    });
  }
});

// Liveness probe (simple ping)
router.get('/ping', (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'pong',
    timestamp: new Date().toISOString()
  });
});

// System info endpoint (for monitoring)
router.get('/info', (req: Request, res: Response): void => {
  try {
    const systemInfo = {
      application: 'Prime SMS API',
      version: process.env.npm_package_version || '1.0.0',
      environment: env.nodeEnv,
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      uptime: {
        process: process.uptime(),
        system: require('os').uptime()
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };

    // Only show system info in development or to authenticated users
    if (env.isDevelopment) {
      res.status(200).json(systemInfo);
    } else {
      // In production, return limited info
      res.status(200).json({
        application: systemInfo.application,
        version: systemInfo.version,
        environment: systemInfo.environment,
        timestamp: systemInfo.timestamp
      });
    }
  } catch (error) {
    logError('System info endpoint error', error);
    res.status(500).json({
      error: 'Failed to retrieve system information',
      timestamp: new Date().toISOString()
    });
  }
});

// Graceful shutdown endpoint (for deployment scripts)
router.post('/shutdown', (req: Request, res: Response): void => {
  // Only allow in development or with proper authentication
  if (!env.isDevelopment) {
    res.status(403).json({
      error: 'Shutdown endpoint not available in production',
      timestamp: new Date().toISOString()
    });
    return;
  }

  logInfo('Graceful shutdown requested via API');
  
  res.status(200).json({
    message: 'Shutting down gracefully...',
    timestamp: new Date().toISOString()
  });

  // Give response time to send, then shutdown
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

export default router;