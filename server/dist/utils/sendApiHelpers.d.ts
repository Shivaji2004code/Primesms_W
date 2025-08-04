/**
 * Helper utilities for the Send API endpoint
 */
/**
 * Validate phone number format
 * Accepts Meta WhatsApp API format (country code + number, no + prefix)
 * Example: 919398424270 (India), 14155552345 (US)
 */
export declare function validatePhoneNumber(phoneNumber: string): boolean;
/**
 * Sanitize input to prevent injection attacks
 */
export declare function sanitizeInput(input: any): string | undefined;
/**
 * Extract variable parameters (var1, var2, var3, etc.) from request
 */
export declare function extractVariables(source: any): {
    [key: string]: string;
};
/**
 * Validate template component structure
 */
export declare function validateTemplateComponents(components: any[]): boolean;
/**
 * Count expected variables in template body
 */
export declare function countTemplateVariables(templateComponents: any[]): number;
/**
 * Validate that provided variables match template requirements
 */
export declare function validateVariableCount(params: any, templateComponents: any[]): {
    isValid: boolean;
    expectedCount: number;
    providedCount: number;
    message?: string;
};
/**
 * Format error response with consistent structure
 */
export declare function formatErrorResponse(statusCode: number, error: string, message: string, details?: any): any;
/**
 * Log API request for monitoring and debugging
 */
export declare function logApiRequest(method: string, username: string, templatename: string, recipient: string, status: 'success' | 'error', error?: string): void;
/**
 * Rate limiting key generator
 */
export declare function generateRateLimitKey(req: any): string;
/**
 * Validate template is compatible with send API
 */
export declare function validateTemplateCompatibility(template: any): {
    isValid: boolean;
    issues?: string[];
};
//# sourceMappingURL=sendApiHelpers.d.ts.map