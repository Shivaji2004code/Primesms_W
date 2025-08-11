export interface ForwardContext {
    userId: string | number;
    wabaId?: string | null;
    phoneNumberId: string;
    webhookUrl: string;
    webhookVerifyToken?: string;
}
export type N8NInboundEvent = {
    kind: 'message_in';
    payload: any;
};
export declare function forwardInboundToN8N(ctx: ForwardContext, event: N8NInboundEvent): Promise<void>;
export declare function validateForwardContext(ctx: ForwardContext): {
    isValid: boolean;
    errors: string[];
};
export declare function createTestForwardContext(userId?: string, webhookUrl?: string, phoneNumberId?: string): ForwardContext;
export declare function createTestInboundEvent(from?: string, text?: string): N8NInboundEvent;
//# sourceMappingURL=n8nForwarder.d.ts.map