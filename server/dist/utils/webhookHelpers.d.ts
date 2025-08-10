export declare function handleSendAcknowledgment(userId: string, messageId: string, recipientNumber: string, campaignId?: string, metadata?: Record<string, any>): Promise<void>;
export declare function simulateWebhookEvent(type: 'status_update' | 'template_update', userId: string, eventData: any): void;
export declare function getUserSSEStatus(userId: string): {
    hasReportConnections: boolean;
    hasTemplateConnections: boolean;
    hasAnyConnections: boolean;
};
//# sourceMappingURL=webhookHelpers.d.ts.map