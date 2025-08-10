export declare class LogCleanupService {
    private static instance;
    private cronJob;
    private constructor();
    static getInstance(): LogCleanupService;
    cleanupOldLogs(): Promise<{
        campaignLogsDeleted: number;
    }>;
    startScheduledCleanup(): void;
    stopScheduledCleanup(): void;
    getOldLogsStats(): Promise<{
        campaignLogsCount: number;
    }>;
}
export declare const logCleanupService: LogCleanupService;
//# sourceMappingURL=logCleanup.d.ts.map