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
export declare function analyzeTemplate(template: TemplateInfo): {
    hasImageHeader: boolean;
    isImageDynamic: boolean;
    requiresImageUrl: boolean;
    hasBodyVariables: boolean;
    hasButtonVariables: boolean;
    expectedVariables: string[];
};
export declare function buildTemplatePayload(templateName: string, language: string, components: TemplateComponent[], variables?: Record<string, string>, headerMediaId?: string): any;
export declare function validateTemplateVariables(analysis: ReturnType<typeof analyzeTemplate>, variables: Record<string, string>): {
    isValid: boolean;
    missingVariables: string[];
    errors: string[];
};
//# sourceMappingURL=template-helper.d.ts.map