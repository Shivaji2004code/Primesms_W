export interface SendResult {
    ok: boolean;
    to: string;
    messageId?: string | null;
    error?: any;
}
export interface WhatsAppMessage {
    kind: 'text';
    text: {
        body: string;
        preview_url?: boolean;
    };
}
export interface WhatsAppTemplate {
    kind: 'template';
    template: {
        name: string;
        language_code: string;
        components?: Array<{
            type: 'header' | 'body' | 'button';
            sub_type?: 'url' | 'quick_reply' | 'copy_code';
            index?: string;
            parameters?: Array<{
                type: 'text';
                text: string;
            } | {
                type: 'currency';
                currency: {
                    fallback_value: string;
                    code: string;
                    amount_1000: number;
                };
            } | {
                type: 'date_time';
                date_time: {
                    fallback_value: string;
                };
            } | {
                type: 'image';
                image: {
                    id: string;
                };
            }>;
        }>;
    };
}
export interface BulkMessageVariables {
    [key: string]: string;
}
export declare function sendWhatsAppMessage(opts: {
    version?: string;
    accessToken: string;
    phoneNumberId: string;
    to: string;
    message: WhatsAppMessage | WhatsAppTemplate;
    variables?: BulkMessageVariables;
    maxRetries?: number;
    retryBaseMs?: number;
}): Promise<SendResult>;
//# sourceMappingURL=waSender.d.ts.map