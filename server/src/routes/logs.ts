import express from 'express';
import pool from '../db';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { logCleanupService } from '../services/logCleanup';

const router = express.Router();

// Get message logs (all logs for now - no user filtering)
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM message_logs');
    const total = parseInt(countResult.rows[0].total);

    // Get paginated message logs
    const logsResult = await pool.query(
      `SELECT 
        id,
        recipient_number,
        status,
        message_id,
        created_at
      FROM message_logs 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const logs = logsResult.rows.map(row => ({
      id: row.id,
      recipientNumber: row.recipient_number,
      status: row.status,
      messageId: row.message_id,
      createdAt: row.created_at
    }));

    res.json({
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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