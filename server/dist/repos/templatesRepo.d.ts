export interface TemplateUpdateData {
    userId: string;
    name: string;
    language: string;
    status: string;
    category?: string;
    reason?: string | null;
    reviewedAt?: Date | null;
}
export declare const templatesRepo: {
    upsertStatusAndCategory(input: TemplateUpdateData): Promise<void>;
    getByUserNameLanguage(userId: string, name: string, language: string): Promise<any | null>;
    getAllByUserId(userId: string): Promise<any[]>;
};
export declare const userBusinessRepo: {
    getByPhoneNumberIdWithCreds(phoneNumberId: string): Promise<{
        userId: string;
        wabaId?: string;
        accessToken?: string;
    } | null>;
    getByWabaIdWithCreds(wabaId: string): Promise<{
        userId: string;
        wabaId?: string;
        accessToken?: string;
    } | null>;
    getCredsByUserId(userId: string): Promise<{
        wabaId?: string;
        accessToken?: string;
    } | null>;
};
//# sourceMappingURL=templatesRepo.d.ts.map