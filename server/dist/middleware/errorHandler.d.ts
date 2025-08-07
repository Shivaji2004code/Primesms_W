import { Request, Response, NextFunction } from 'express';
interface ErrorResponse {
    success: false;
    error: string;
    code?: string;
    timestamp?: string;
    path?: string;
}
export declare class AppError extends Error {
    statusCode: number;
    code?: string;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: any);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, originalError?: Error);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
declare const isOperationalError: (error: any) => boolean;
declare const createErrorResponse: (error: any, req: Request) => ErrorResponse;
export declare const errorHandler: (error: any, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
export declare const setupGlobalErrorHandlers: () => void;
export { isOperationalError, createErrorResponse };
//# sourceMappingURL=errorHandler.d.ts.map