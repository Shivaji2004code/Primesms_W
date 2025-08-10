import pool from '../db';
import * as cron from 'node-cron';

export class LogCleanupService {
  private static instance: LogCleanupService;
  private cronJob: cron.ScheduledTask | null = null;

  private constructor() {}

  public static getInstance(): LogCleanupService {
    if (!LogCleanupService.instance) {
      LogCleanupService.instance = new LogCleanupService();
    }
    return LogCleanupService.instance;
  }

  /**
   * Delete logs older than 90 days from campaign_logs table
   */
  public async cleanupOldLogs(): Promise<{ campaignLogsDeleted: number }> {
    const client = await pool.connect();
    
    try {
      // Calculate threshold date (90 days ago)
      const threshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const thresholdISO = threshold.toISOString();

      console.log(`🧹 Starting log cleanup for records older than: ${threshold.toISOString()}`);

      // Start transaction
      await client.query('BEGIN');

      // Delete old campaign logs
      const campaignLogsResult = await client.query(
        'DELETE FROM campaign_logs WHERE created_at < $1',
        [thresholdISO]
      );

      // Commit transaction
      await client.query('COMMIT');

      const campaignLogsDeleted = campaignLogsResult.rowCount || 0;

      console.log(`✅ Log cleanup completed successfully:`);
      console.log(`   - Campaign logs deleted: ${campaignLogsDeleted}`);

      return { campaignLogsDeleted };

    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('❌ Error during log cleanup:', error);
      throw new Error(`Log cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Start the scheduled cron job for log cleanup
   * Runs daily at 2:00 AM UTC
   */
  public startScheduledCleanup(): void {
    if (this.cronJob) {
      console.log('📅 Log cleanup cron job is already running');
      return;
    }

    // Schedule to run daily at 2:00 AM UTC
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      try {
        console.log('🕐 Starting scheduled log cleanup...');
        await this.cleanupOldLogs();
      } catch (error) {
        console.error('❌ Scheduled log cleanup failed:', error);
      }
    }, {
      timezone: 'UTC'
    });

    console.log('📅 Log cleanup cron job started - runs daily at 2:00 AM UTC');
  }

  /**
   * Stop the scheduled cron job
   */
  public stopScheduledCleanup(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🛑 Log cleanup cron job stopped');
    }
  }

  /**
   * Get statistics about old logs that would be deleted
   */
  public async getOldLogsStats(): Promise<{ campaignLogsCount: number }> {
    const client = await pool.connect();
    
    try {
      const threshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const thresholdISO = threshold.toISOString();

      const campaignLogsResult = await client.query(
        'SELECT COUNT(*) as count FROM campaign_logs WHERE created_at < $1',
        [thresholdISO]
      );

      return {
        campaignLogsCount: parseInt(campaignLogsResult.rows[0].count)
      };

    } finally {
      client.release();
    }
  }
}

// Export singleton instance
export const logCleanupService = LogCleanupService.getInstance();