/**
 * WhatsApp Template Helper Utilities
 * Handles template introspection and payload building
 */
export interface TemplateComponent {
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    text?: string;
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    buttons?: any[];
}
export interface TemplateInfo {
    name: string;
    category: string;
    language: string;
    status: string;
    components: TemplateComponent[];
}
/**
 * Analyzes template structure to determine requirements
 */
export declare function analyzeTemplate(template: TemplateInfo): {
    hasImageHeader: boolean;
    isImageDynamic: boolean;
    requiresImageUrl: boolean;
    hasBodyVariables: boolean;
    hasButtonVariables: boolean;
    expectedVariables: string[];
};
/**
 * Builds template payload components based on analysis
 * FIXED: Properly handles static vs dynamic image templates
 */
export declare function buildTemplatePayload(templateName: string, language: string, components: TemplateComponent[], variables?: Record<string, string>, headerMediaId?: string): any;
/**
 * Validates that all required variables are provided
 */
export declare function validateTemplateVariables(analysis: ReturnType<typeof analyzeTemplate>, variables: Record<string, string>): {
    isValid: boolean;
    missingVariables: string[];
    errors: string[];
};
//# sourceMappingURL=template-helper.d.ts.map