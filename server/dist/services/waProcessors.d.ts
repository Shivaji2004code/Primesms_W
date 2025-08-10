type AnyObj = Record<string, any>;
export interface UserBusinessInfoRepo {
    getUserByPhoneNumberId(pni: string): Promise<{
        userId: string;
    } | null>;
}
export interface TemplatesRepo {
    updateStatusByNameLang(userId: string, name: string, language: string, status: string, reason?: string | null, reviewedAt?: Date | null): Promise<void>;
}
export interface CampaignLogsRepo {
    upsertOnSendAck(userId: string, messageId: string, to: string, campaignId?: string | null, meta?: AnyObj): Promise<void>;
    markSent(userId: string, messageId: string, meta?: AnyObj): Promise<void>;
    markDelivered(userId: string, messageId: string, meta?: AnyObj): Promise<void>;
    markRead(userId: string, messageId: string, meta?: AnyObj): Promise<void>;
    markFailed(userId: string, messageId: string, error?: AnyObj): Promise<void>;
}
export interface Broadcaster {
    emitReport(userId: string, payload: AnyObj): void;
    emitTemplate(userId: string, payload: AnyObj): void;
}
export declare class WAProcessors {
    private ubiRepo;
    private templatesRepo;
    private logsRepo;
    private broadcaster;
    constructor(ubiRepo: UserBusinessInfoRepo, templatesRepo: TemplatesRepo, logsRepo: CampaignLogsRepo, broadcaster: Broadcaster);
    processWebhook(body: AnyObj): Promise<void>;
    private resolveUserIdFromValue;
    private handleTemplateUpdate;
    private handleMessageStatuses;
}
export declare function createProcessors(broadcaster: Broadcaster): WAProcessors;
export {};
//# sourceMappingURL=waProcessors.d.ts.map