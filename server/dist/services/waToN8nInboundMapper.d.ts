type AnyObj = Record<string, any>;
export interface N8nInboundMessage {
    wamid: string | null;
    from: string | null;
    to: string | null;
    type: string | null;
    text: string | null;
    interactive: {
        type: string;
        title: string | null;
    } | null;
    media?: {
        id?: string;
        mime_type?: string;
        sha256?: string;
        caption?: string;
        filename?: string;
    } | null;
    location?: {
        latitude?: number;
        longitude?: number;
        name?: string;
        address?: string;
    } | null;
    contacts?: AnyObj[] | null;
    sticker?: {
        id?: string;
        mime_type?: string;
        sha256?: string;
        animated?: boolean;
    } | null;
}
export interface N8nMappedPayload {
    message: N8nInboundMessage;
    raw: AnyObj;
}
export declare function mapInboundMessage(value: AnyObj): N8nMappedPayload;
export declare function validateInboundMessage(message: N8nInboundMessage): {
    isValid: boolean;
    errors: string[];
};
export declare function createTestWhatsAppMessage(type?: string, from?: string, text?: string): AnyObj;
export declare function logMappedMessage(mapped: N8nMappedPayload, context?: string): void;
export {};
//# sourceMappingURL=waToN8nInboundMapper.d.ts.map