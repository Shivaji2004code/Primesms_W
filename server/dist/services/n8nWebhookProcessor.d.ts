import { UserBusinessInfo } from '../types';
type AnyObj = Record<string, any>;
export interface N8nWebhookProcessorConfig {
    enabled: boolean;
    logLevel: 'minimal' | 'detailed';
    skipValidation?: boolean;
}
export interface ProcessingStats {
    totalEntries: number;
    processedChanges: number;
    inboundMessages: number;
    forwardedToN8n: number;
    errors: number;
    startTime: Date;
    endTime?: Date;
}
export declare class N8nWebhookProcessor {
    private config;
    private stats;
    constructor(config?: Partial<N8nWebhookProcessorConfig>);
    processWebhookForN8n(body: AnyObj, userBusinessLookupFn: (phoneNumberId: string) => Promise<UserBusinessInfo | null>): Promise<ProcessingStats>;
    private processMessagesChange;
    getStats(): ProcessingStats;
    updateConfig(newConfig: Partial<N8nWebhookProcessorConfig>): void;
    isEnabled(): boolean;
    resetStats(): void;
}
export declare function createN8nWebhookProcessor(config?: Partial<N8nWebhookProcessorConfig>): N8nWebhookProcessor;
export declare function processWebhookForN8n(body: AnyObj, userBusinessLookupFn: (phoneNumberId: string) => Promise<UserBusinessInfo | null>, config?: Partial<N8nWebhookProcessorConfig>): Promise<ProcessingStats>;
export declare function createTestUserBusinessInfo(userId?: string, webhookUrl?: string, phoneNumberId?: string): UserBusinessInfo;
export declare function createTestLookupFunction(testUserBusinessInfo: UserBusinessInfo): Promise<(phoneNumberId: string) => Promise<UserBusinessInfo | null>>;
export {};
//# sourceMappingURL=n8nWebhookProcessor.d.ts.map