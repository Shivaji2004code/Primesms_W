export declare class LogCleanupService {
    private static instance;
    private cronJob;
    private constructor();
    static getInstance(): LogCleanupService;
    cleanupOldLogs(): Promise<{
        messageLogsDeleted: number;
        campaignLogsDeleted: number;
    }>;
    startScheduledCleanup(): void;
    stopScheduledCleanup(): void;
    getOldLogsStats(): Promise<{
        messageLogsCount: number;
        campaignLogsCount: number;
    }>;
}
export declare const logCleanupService: LogCleanupService;
//# sourceMappingURL=logCleanup.d.ts.map