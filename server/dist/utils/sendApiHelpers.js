"use strict";
/**
 * Helper utilities for the Send API endpoint
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePhoneNumber = validatePhoneNumber;
exports.sanitizeInput = sanitizeInput;
exports.extractVariables = extractVariables;
exports.validateTemplateComponents = validateTemplateComponents;
exports.countTemplateVariables = countTemplateVariables;
exports.validateVariableCount = validateVariableCount;
exports.formatErrorResponse = formatErrorResponse;
exports.logApiRequest = logApiRequest;
exports.generateRateLimitKey = generateRateLimitKey;
exports.validateTemplateCompatibility = validateTemplateCompatibility;
/**
 * Validate phone number format
 * Accepts Meta WhatsApp API format (country code + number, no + prefix)
 * Example: 919398424270 (India), 14155552345 (US)
 */
function validatePhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        return false;
    }
    // Remove any whitespace
    const cleaned = phoneNumber.trim();
    // Meta WhatsApp API format: country code + number (no + prefix)
    // Must start with country code (1-4 digits) followed by local number
    // Total length should be between 8-15 digits (international standard)
    const phoneRegex = /^[1-9]\d{7,14}$/;
    return phoneRegex.test(cleaned);
}
/**
 * Sanitize input to prevent injection attacks
 */
function sanitizeInput(input) {
    if (input === null || input === undefined) {
        return undefined;
    }
    if (typeof input !== 'string') {
        input = String(input);
    }
    // Remove any potentially dangerous characters and trim
    return input
        .replace(/[<>\"'&]/g, '') // Remove HTML/script injection chars
        .replace(/\x00/g, '') // Remove null bytes
        .trim();
}
/**
 * Extract variable parameters (var1, var2, var3, etc.) from request
 */
function extractVariables(source) {
    const variables = {};
    if (!source || typeof source !== 'object') {
        return variables;
    }
    // Extract all parameters that match the pattern 'varN' where N is a number
    Object.keys(source).forEach(key => {
        if (/^var\d+$/.test(key)) {
            const value = sanitizeInput(source[key]);
            if (value !== undefined && value !== '') {
                variables[key] = value;
            }
        }
    });
    return variables;
}
/**
 * Validate template component structure
 */
function validateTemplateComponents(components) {
    if (!Array.isArray(components)) {
        return false;
    }
    // Check if components have required fields
    return components.every(component => {
        return component &&
            typeof component === 'object' &&
            typeof component.type === 'string';
    });
}
/**
 * Count expected variables in template body
 */
function countTemplateVariables(templateComponents) {
    const bodyComponent = templateComponents.find(c => c.type === 'BODY');
    if (!bodyComponent || !bodyComponent.text) {
        return 0;
    }
    // Count {{variable}} placeholders in the text
    const variableMatches = bodyComponent.text.match(/\{\{[^}]+\}\}/g);
    return variableMatches ? variableMatches.length : 0;
}
/**
 * Validate that provided variables match template requirements
 */
function validateVariableCount(params, templateComponents) {
    const expectedCount = countTemplateVariables(templateComponents);
    const providedVars = Object.keys(params)
        .filter(key => /^var\d+$/.test(key) && params[key] !== undefined && params[key] !== '')
        .length;
    if (providedVars !== expectedCount) {
        return {
            isValid: false,
            expectedCount,
            providedCount: providedVars,
            message: `Template requires ${expectedCount} variables, but ${providedVars} were provided`
        };
    }
    return {
        isValid: true,
        expectedCount,
        providedCount: providedVars
    };
}
/**
 * Format error response with consistent structure
 */
function formatErrorResponse(statusCode, error, message, details) {
    const response = {
        error,
        message,
        timestamp: new Date().toISOString()
    };
    if (details) {
        response.details = details;
    }
    return response;
}
/**
 * Log API request for monitoring and debugging
 */
function logApiRequest(method, username, templatename, recipient, status, error) {
    const logData = {
        timestamp: new Date().toISOString(),
        method,
        username,
        templatename,
        recipient: recipient ? `${recipient.slice(0, 3)}***${recipient.slice(-2)}` : 'unknown', // Partially mask number
        status,
        error: error || undefined
    };
    if (status === 'error') {
        console.error('Send API Request Failed:', logData);
    }
    else {
        console.log('Send API Request Success:', logData);
    }
}
/**
 * Rate limiting key generator
 */
function generateRateLimitKey(req) {
    // Use combination of IP and username for more granular rate limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const username = req.body?.username || req.query?.username || 'anonymous';
    return `${ip}:${username}`;
}
/**
 * Validate template is compatible with send API
 */
function validateTemplateCompatibility(template) {
    const issues = [];
    if (!template.components || !Array.isArray(template.components)) {
        issues.push('Template has invalid components structure');
        return { isValid: false, issues };
    }
    // Check for unsupported header types
    const headerComponent = template.components.find((c) => c.type === 'HEADER');
    if (headerComponent && headerComponent.format && headerComponent.format !== 'TEXT') {
        issues.push('Only TEXT headers are supported via the Send API');
    }
    // Check for body component
    const bodyComponent = template.components.find((c) => c.type === 'BODY');
    if (!bodyComponent) {
        issues.push('Template must have a BODY component');
    }
    // Check for unsupported button types
    const buttonComponents = template.components.filter((c) => c.type === 'BUTTONS');
    buttonComponents.forEach((button) => {
        if (button.buttons) {
            button.buttons.forEach((btn) => {
                if (btn.type && btn.type !== 'QUICK_REPLY') {
                    issues.push(`Button type '${btn.type}' is not supported via Send API`);
                }
            });
        }
    });
    return {
        isValid: issues.length === 0,
        issues: issues.length > 0 ? issues : undefined
    };
}
//# sourceMappingURL=sendApiHelpers.js.map