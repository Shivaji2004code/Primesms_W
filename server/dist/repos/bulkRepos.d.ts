import { CredsProvider, CampaignLogsRepo, TenantCreds } from '../services/bulkQueue';
export declare class UserBusinessRepo implements CredsProvider {
    getCredsByUserId(userId: string): Promise<TenantCreds>;
}
export declare class BulkCampaignLogsRepo implements CampaignLogsRepo {
    upsertOnSendAck(userId: string, messageId: string, to: string, campaignId?: string | null, meta?: any): Promise<void>;
    private extractTemplateName;
}
export declare const userBusinessRepo: UserBusinessRepo;
export declare const bulkCampaignLogsRepo: BulkCampaignLogsRepo;
//# sourceMappingURL=bulkRepos.d.ts.map