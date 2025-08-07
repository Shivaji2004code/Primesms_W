export declare class LogCleanupService {
    private static instance;
    private cronJob;
    private constructor();
    static getInstance(): LogCleanupService;
    /**
     * Delete logs older than 90 days from message_logs and campaign_logs tables
     */
    cleanupOldLogs(): Promise<{
        messageLogsDeleted: number;
        campaignLogsDeleted: number;
    }>;
    /**
     * Start the scheduled cron job for log cleanup
     * Runs daily at 2:00 AM UTC
     */
    startScheduledCleanup(): void;
    /**
     * Stop the scheduled cron job
     */
    stopScheduledCleanup(): void;
    /**
     * Get statistics about old logs that would be deleted
     */
    getOldLogsStats(): Promise<{
        messageLogsCount: number;
        campaignLogsCount: number;
    }>;
}
export declare const logCleanupService: LogCleanupService;
//# sourceMappingURL=logCleanup.d.ts.map