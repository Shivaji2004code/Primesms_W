// src/middleware/validateRequest.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from './errorHandler';

// Validation targets
type ValidationTarget = 'body' | 'query' | 'params' | 'headers';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

// Custom error formatter for Zod validation errors
const formatZodError = (error: ZodError): string => {
  const errors = error.errors.map(err => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
  
  return `Validation failed: ${errors.join(', ')}`;
};

// Main validation middleware
export const validateRequest = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate body
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          throw new ValidationError(formatZodError(result.error));
        }
        req.body = result.data;
      }

      // Validate query parameters
      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          throw new ValidationError(formatZodError(result.error));
        }
        req.query = result.data;
      }

      // Validate route parameters
      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          throw new ValidationError(formatZodError(result.error));
        }
        req.params = result.data;
      }

      // Validate headers
      if (schemas.headers) {
        const result = schemas.headers.safeParse(req.headers);
        if (!result.success) {
          throw new ValidationError(formatZodError(result.error));
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  // UUID parameter validation
  uuidParam: z.object({
    id: z.string().uuid('Invalid UUID format')
  }),

  // Pagination query validation
  paginationQuery: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
  }).refine(data => data.page >= 1, { message: 'Page must be >= 1' })
    .refine(data => data.limit >= 1 && data.limit <= 100, { message: 'Limit must be between 1 and 100' }),

  // Email validation
  email: z.string().email('Invalid email format').min(5).max(255),

  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  // Username validation
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

  // Phone number validation
  phoneNumber: z.string()
    .regex(/^\+[1-9]\d{10,14}$/, 'Phone number must be in international format (+1234567890)'),

  // Template name validation
  templateName: z.string()
    .min(1, 'Template name is required')
    .max(255, 'Template name must be at most 255 characters')
    .regex(/^[a-z0-9_]+$/, 'Template name must be lowercase letters, numbers, or underscores only'),

  // Template category validation
  templateCategory: z.enum(['UTILITY', 'MARKETING', 'AUTHENTICATION'], {
    errorMap: () => ({ message: 'Category must be UTILITY, MARKETING, or AUTHENTICATION' })
  }),

  // Language code validation
  languageCode: z.string()
    .regex(/^[a-z]{2}(_[A-Z]{2})?$/, 'Language code must be in format: en or en_US')
    .default('en_US'),

  // Credit amount validation
  creditAmount: z.number()
    .positive('Credit amount must be positive')
    .max(1000000, 'Credit amount cannot exceed 1,000,000'),
};

// Authentication schemas
export const authSchemas = {
  login: z.object({
    username: commonSchemas.username,
    password: z.string().min(1, 'Password is required')
  }),

  signup: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255),
    email: commonSchemas.email,
    username: commonSchemas.username,
    password: commonSchemas.password,
    phoneNumber: commonSchemas.phoneNumber.optional()
  }),

  updateProfile: z.object({
    name: z.string().min(2).max(255).optional(),
    email: commonSchemas.email.optional(),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: commonSchemas.password
  })
};

// Template schemas
export const templateSchemas = {
  create: z.object({
    name: commonSchemas.templateName,
    category: commonSchemas.templateCategory,
    language: commonSchemas.languageCode,
    headerText: z.string().max(60).optional(),
    bodyText: z.string().min(1, 'Body text is required').max(1024),
    footerText: z.string().max(60).optional(),
    buttons: z.string().optional(), // JSON string
    variableExamples: z.string().optional(), // JSON string
    submit_to_whatsapp: z.boolean().optional().default(false)
  }),

  update: z.object({
    name: commonSchemas.templateName.optional(),
    category: commonSchemas.templateCategory.optional(),
    language: commonSchemas.languageCode.optional(),
    headerText: z.string().max(60).optional(),
    bodyText: z.string().min(1).max(1024).optional(),
    footerText: z.string().max(60).optional()
  }),

  filter: z.object({
    status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
    category: commonSchemas.templateCategory.optional(),
    language: z.string().optional()
  })
};

// Message sending schemas
export const messageSchemas = {
  send: z.object({
    templateName: commonSchemas.templateName,
    language: commonSchemas.languageCode,
    phoneNumberId: z.string().min(1, 'Phone number ID is required'),
    recipients: z.array(z.object({
      number: commonSchemas.phoneNumber,
      variables: z.record(z.string()).optional()
    })).min(1, 'At least one recipient is required').max(1000, 'Maximum 1000 recipients allowed')
  }),

  quickSend: z.object({
    templateName: commonSchemas.templateName,
    language: commonSchemas.languageCode,
    phoneNumberId: z.string().min(1, 'Phone number ID is required'),
    variableMapping: z.string().optional() // JSON string
  })
};

// Admin schemas
export const adminSchemas = {
  createUser: z.object({
    name: z.string().min(2).max(255),
    email: commonSchemas.email,
    username: commonSchemas.username,
    password: commonSchemas.password,
    role: z.enum(['user', 'admin']).default('user'),
    phoneNumber: commonSchemas.phoneNumber.optional(),
    creditBalance: z.number().min(0).default(1000)
  }),

  updateUser: z.object({
    name: z.string().min(2).max(255).optional(),
    email: commonSchemas.email.optional(),
    role: z.enum(['user', 'admin']).optional(),
    phoneNumber: commonSchemas.phoneNumber.optional(),
    creditBalance: z.number().min(0).optional()
  }),

  creditOperation: z.object({
    userId: z.string().uuid('Invalid user ID'),
    amount: commonSchemas.creditAmount,
    description: z.string().min(1).max(500)
  })
};

// Export validation helper for custom validations
export const createCustomValidator = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(formatZodError(result.error));
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};