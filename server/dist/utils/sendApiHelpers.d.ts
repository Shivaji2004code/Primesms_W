export declare function validatePhoneNumber(phoneNumber: string): boolean;
export declare function sanitizeInput(input: any): string | undefined;
export declare function extractVariables(source: any): {
    [key: string]: string;
};
export declare function validateTemplateComponents(components: any[]): boolean;
export declare function countTemplateVariables(templateComponents: any[]): number;
export declare function validateVariableCount(params: any, templateComponents: any[]): {
    isValid: boolean;
    expectedCount: number;
    providedCount: number;
    message?: string;
};
export declare function formatErrorResponse(statusCode: number, error: string, message: string, details?: any): any;
export declare function logApiRequest(method: string, username: string, templatename: string, recipient: string, status: 'success' | 'error', error?: string): void;
export declare function generateRateLimitKey(req: any): string;
export declare function validateTemplateCompatibility(template: any): {
    isValid: boolean;
    issues?: string[];
};
//# sourceMappingURL=sendApiHelpers.d.ts.map