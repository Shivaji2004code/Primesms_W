// src/utils/logger.ts
import winston from 'winston';

// Create custom log format for production
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      logMessage += `\nStack: ${stack}`;
    }
    
    // Add metadata if present
    const metaStr = Object.keys(meta).length > 0 ? `\nMeta: ${JSON.stringify(meta, null, 2)}` : '';
    
    return logMessage + metaStr;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'prime-sms' },
  transports: [
    // Console transport only (as per requirements)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ],
  // Exit on handled exceptions
  exitOnError: true
});

// Create HTTP request logger
export const createHttpLogger = () => {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Override res.end to capture response time and status
    const originalEnd = res.end;
    res.end = function(chunk: any, encoding: any) {
      const duration = Date.now() - startTime;
      
      // Log HTTP request details
      logger.info('HTTP Request', {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
      });
      
      // Call original end method
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
};

// Helper functions for different log levels
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | any, meta?: any) => {
  if (error instanceof Error) {
    logger.error(message, { 
      error: error.message, 
      stack: error.stack,
      ...meta 
    });
  } else if (error && typeof error === 'object') {
    logger.error(message, { error, ...meta });
  } else {
    logger.error(message, meta);
  }
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Database operation logger
export const logDatabase = (operation: string, query?: string, duration?: number, error?: Error) => {
  if (error) {
    logger.error(`Database Error - ${operation}`, {
      operation,
      query: query ? query.substring(0, 200) + (query.length > 200 ? '...' : '') : undefined,
      error: error.message,
      stack: error.stack
    });
  } else {
    logger.info(`Database Operation - ${operation}`, {
      operation,
      query: query ? query.substring(0, 100) + (query.length > 100 ? '...' : '') : undefined,
      duration: duration ? `${duration}ms` : undefined
    });
  }
};

// Security event logger
export const logSecurity = (event: string, details: any, severity: 'info' | 'warn' | 'error' = 'warn') => {
  logger[severity](`Security Event: ${event}`, {
    securityEvent: event,
    ...details
  });
};

// Application startup logger
export const logStartup = (message: string, config?: any) => {
  logger.info(`🚀 ${message}`, config);
};

// Application shutdown logger
export const logShutdown = (message: string, reason?: string) => {
  logger.info(`🔒 ${message}`, { reason });
};

export { logger };
export default logger;