// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger';
import { env } from '../utils/env';

// Standard error response interface
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  timestamp?: string;
  path?: string;
}

// Custom error class for application errors
export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error class
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// Database error class
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

// Authentication error class
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

// Authorization error class
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

// Rate limit error class
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

// Helper function to determine if error is operational
const isOperationalError = (error: any): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

// Helper function to create standardized error response
const createErrorResponse = (error: any, req: Request): ErrorResponse => {
  const response: ErrorResponse = {
    success: false,
    error: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.url
  };

  // Handle different error types
  if (error instanceof AppError) {
    response.error = error.message;
    response.code = error.code;
  } else if (error.name === 'ValidationError') {
    response.error = 'Validation failed';
    response.code = 'VALIDATION_ERROR';
  } else if (error.code === '23505') {
    // PostgreSQL unique constraint violation
    response.error = 'Resource already exists';
    response.code = 'DUPLICATE_RESOURCE';
  } else if (error.code === '23503') {
    // PostgreSQL foreign key constraint violation
    response.error = 'Referenced resource not found';
    response.code = 'FOREIGN_KEY_ERROR';
  } else if (error.name === 'JsonWebTokenError') {
    response.error = 'Invalid token';
    response.code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    response.error = 'Token expired';
    response.code = 'TOKEN_EXPIRED';
  } else if (error.type === 'entity.parse.failed') {
    response.error = 'Invalid JSON payload';
    response.code = 'INVALID_JSON';
  } else if (error.type === 'entity.too.large') {
    response.error = 'Payload too large';
    response.code = 'PAYLOAD_TOO_LARGE';
  }

  return response;
};

// Main error handling middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error with full details
  logError('Application Error', error, {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Determine status code
  let statusCode = 500;
  if (error instanceof AppError) {
    statusCode = error.statusCode;
  } else if (error.statusCode) {
    statusCode = error.statusCode;
  } else if (error.status) {
    statusCode = error.status;
  }

  // Create error response
  const errorResponse = createErrorResponse(error, req);

  // In development, include stack trace
  if (env.isDevelopment) {
    (errorResponse as any).stack = error.stack;
    (errorResponse as any).details = error;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for unknown routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

// Global process error handlers
export const setupGlobalErrorHandlers = (): void => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logError('Uncaught Exception - Server shutting down', error);
    
    // Give ongoing requests time to complete
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logError('Unhandled Rejection - Server shutting down', new Error(String(reason)), {
      promise: promise.toString()
    });
    
    // Give ongoing requests time to complete
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle SIGTERM for graceful shutdown
  process.on('SIGTERM', () => {
    logError('SIGTERM received - Server shutting down gracefully');
    process.exit(0);
  });

  // Handle SIGINT (Ctrl+C) for graceful shutdown
  process.on('SIGINT', () => {
    logError('SIGINT received - Server shutting down gracefully');
    process.exit(0);
  });
};

// Export all error classes and handlers
export {
  isOperationalError,
  createErrorResponse
};