"use strict";
/**
 * WhatsApp Template Helper Utilities
 * Handles template introspection and payload building
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTemplate = analyzeTemplate;
exports.buildTemplatePayload = buildTemplatePayload;
exports.validateTemplateVariables = validateTemplateVariables;
/**
 * Analyzes template structure to determine requirements
 */
function analyzeTemplate(template) {
    const analysis = {
        hasImageHeader: false,
        isImageDynamic: false,
        requiresImageUrl: false,
        hasBodyVariables: false,
        hasButtonVariables: false,
        expectedVariables: []
    };
    for (const component of template.components) {
        if (component.type === 'HEADER' && component.format === 'IMAGE') {
            analysis.hasImageHeader = true;
            // If header text has variables or is empty (expecting dynamic content)
            if (component.text?.includes('{{') || component.text === '' || !component.text) {
                analysis.isImageDynamic = true;
                analysis.requiresImageUrl = true;
                if (component.text?.includes('{{')) {
                    const matches = component.text.match(/\{\{(\d+)\}\}/g);
                    if (matches) {
                        analysis.expectedVariables.push(...matches.map((m) => m.replace(/[{}]/g, '')));
                    }
                }
                else {
                    // Empty text suggests variable index 1 by default
                    analysis.expectedVariables.push('1');
                }
            }
        }
        if (component.type === 'BODY' && component.text?.includes('{{')) {
            analysis.hasBodyVariables = true;
            const matches = component.text.match(/\{\{(\d+)\}\}/g);
            if (matches) {
                analysis.expectedVariables.push(...matches.map((m) => m.replace(/[{}]/g, '')));
            }
        }
        if (component.type === 'BUTTONS' && component.buttons) {
            for (const button of component.buttons) {
                if (button.url?.includes('{{')) {
                    analysis.hasButtonVariables = true;
                    const matches = button.url.match(/\{\{(\d+)\}\}/g);
                    if (matches) {
                        analysis.expectedVariables.push(...matches.map((m) => m.replace(/[{}]/g, '')));
                    }
                }
            }
        }
    }
    // Remove duplicates and sort
    analysis.expectedVariables = [...new Set(analysis.expectedVariables)].sort((a, b) => parseInt(a) - parseInt(b));
    return analysis;
}
/**
 * Builds template payload components based on analysis
 * FIXED: Properly handles static vs dynamic image templates
 */
function buildTemplatePayload(templateName, language, components, variables = {}, headerMediaId) {
    const templateComponents = [];
    for (const component of components) {
        if (component.type === 'HEADER') {
            if (component.format === 'IMAGE') {
                // Check if this is a dynamic or static image template
                const hasVariableInText = component.text && component.text.includes('{{');
                if (hasVariableInText) {
                    // DYNAMIC IMAGE: Template has {{1}} in header text - user must provide URL
                    const matches = component.text.match(/\{\{(\d+)\}\}/g);
                    if (matches && matches.length > 0) {
                        const variableIndex = parseInt(matches[0].replace(/[{}]/g, ''));
                        const imageUrl = variables[variableIndex.toString()];
                        if (imageUrl) {
                            templateComponents.push({
                                type: "header",
                                parameters: [{
                                        type: "image",
                                        image: {
                                            link: imageUrl
                                        }
                                    }]
                            });
                        }
                    }
                }
                else if (headerMediaId) {
                    // STATIC IMAGE: Template has pre-uploaded media - NO header component needed
                    console.log(`✅ Static image template - skipping header component (handled by WhatsApp)`);
                }
                else {
                    // FALLBACK: Treat as dynamic if unclear
                    const imageUrl = variables['1'] || 'https://via.placeholder.com/400x200/0066cc/ffffff?text=Image+Required';
                    templateComponents.push({
                        type: "header",
                        parameters: [{
                                type: "image",
                                image: {
                                    link: imageUrl
                                }
                            }]
                    });
                }
            }
            else if (component.text && component.text.includes('{{')) {
                // Text header with variables
                const headerParams = [];
                const matches = component.text.match(/\{\{(\d+)\}\}/g);
                if (matches) {
                    matches.forEach((match) => {
                        const variableIndex = parseInt(match.replace(/[{}]/g, ''));
                        if (variables[variableIndex.toString()]) {
                            headerParams.push({
                                type: "text",
                                text: variables[variableIndex.toString()]
                            });
                        }
                    });
                }
                if (headerParams.length > 0) {
                    templateComponents.push({
                        type: "header",
                        parameters: headerParams
                    });
                }
            }
        }
        else if (component.type === 'BODY' && component.text) {
            // Handle body variables
            const matches = component.text.match(/\{\{(\d+)\}\}/g);
            if (matches) {
                const bodyParams = [];
                matches.forEach((match) => {
                    const variableIndex = parseInt(match.replace(/[{}]/g, ''));
                    if (variables[variableIndex.toString()]) {
                        bodyParams.push({
                            type: "text",
                            text: variables[variableIndex.toString()]
                        });
                    }
                });
                if (bodyParams.length > 0) {
                    templateComponents.push({
                        type: "body",
                        parameters: bodyParams
                    });
                }
            }
        }
        else if (component.type === 'BUTTONS' && component.buttons) {
            // Handle button variables (dynamic URLs)
            component.buttons.forEach((button, buttonIndex) => {
                if (button.type === 'URL' && button.url && button.url.includes('{{')) {
                    const matches = button.url.match(/\{\{(\d+)\}\}/g);
                    if (matches) {
                        const buttonParams = [];
                        matches.forEach((match) => {
                            const variableIndex = parseInt(match.replace(/[{}]/g, ''));
                            if (variables[variableIndex.toString()]) {
                                buttonParams.push({
                                    type: "text",
                                    text: variables[variableIndex.toString()]
                                });
                            }
                        });
                        if (buttonParams.length > 0) {
                            templateComponents.push({
                                type: "button",
                                sub_type: "url",
                                index: buttonIndex.toString(),
                                parameters: buttonParams
                            });
                        }
                    }
                }
            });
        }
    }
    // Build the final payload
    const templatePayload = {
        name: templateName,
        language: {
            code: language,
            policy: "deterministic"
        }
    };
    // Only add components if we have any to include
    if (templateComponents.length > 0) {
        templatePayload.components = templateComponents;
    }
    return templatePayload;
}
/**
 * Validates that all required variables are provided
 */
function validateTemplateVariables(analysis, variables) {
    const errors = [];
    const missingVariables = [];
    // Check for required image URL
    if (analysis.requiresImageUrl && !variables['1'] && Object.keys(variables).length === 0) {
        errors.push('Image template requires an image URL in variable 1');
        missingVariables.push('1');
    }
    // Check for missing variables
    for (const varIndex of analysis.expectedVariables) {
        if (!variables[varIndex]) {
            missingVariables.push(varIndex);
        }
    }
    // Validate image URLs
    if (analysis.requiresImageUrl) {
        const imageUrl = variables['1'] || variables[Object.keys(variables)[0]];
        if (imageUrl && !isValidImageUrl(imageUrl)) {
            errors.push('Invalid image URL format');
        }
    }
    return {
        isValid: errors.length === 0,
        missingVariables,
        errors
    };
}
/**
 * Basic image URL validation
 */
function isValidImageUrl(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=template-helper.js.map