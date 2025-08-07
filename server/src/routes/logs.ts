import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { logCleanupService } from '../services/logCleanup';

const router = express.Router();

// Get statistics about old logs that would be deleted
router.get('/cleanup/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = await logCleanupService.getOldLogsStats();
    
    res.json({
      success: true,
      stats: {
        messageLogsCount: stats.messageLogsCount,
        campaignLogsCount: stats.campaignLogsCount,
        totalCount: stats.messageLogsCount + stats.campaignLogsCount,
        thresholdDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting log cleanup stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get log cleanup statistics' 
    });
  }
});

// Manual cleanup of old logs (admin only)
router.post('/cleanup', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await logCleanupService.cleanupOldLogs();
    
    res.json({
      success: true,
      message: 'Log cleanup completed successfully',
      deleted: {
        messageLogsDeleted: result.messageLogsDeleted,
        campaignLogsDeleted: result.campaignLogsDeleted,
        totalDeleted: result.messageLogsDeleted + result.campaignLogsDeleted
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error during manual log cleanup:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to cleanup logs' 
    });
  }
});

// Get cleanup service status
router.get('/cleanup/status', requireAuth, requireAdmin, (req, res) => {
  res.json({
    success: true,
    status: {
      cronJobActive: true, // The service starts automatically
      cleanupThreshold: '90 days',
      scheduleTime: '02:00 UTC daily',
      timezone: 'UTC'
    }
  });
});

export default router;