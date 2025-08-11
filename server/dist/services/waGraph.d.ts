export interface TemplateData {
    name: string;
    language: string;
    status?: string;
    category?: string;
    reason?: string;
    reviewedAt?: Date;
}
export declare function fetchTemplateFromGraph(wabaId: string, accessToken: string, name?: string, language?: string): Promise<TemplateData | null>;
export declare function fetchAllTemplatesFromGraph(wabaId: string, accessToken: string): Promise<TemplateData[]>;
//# sourceMappingURL=waGraph.d.ts.map