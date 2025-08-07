"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const logCleanup_1 = require("../services/logCleanup");
const router = express_1.default.Router();
// Get statistics about old logs that would be deleted
router.get('/cleanup/stats', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const stats = await logCleanup_1.logCleanupService.getOldLogsStats();
        res.json({
            success: true,
            stats: {
                messageLogsCount: stats.messageLogsCount,
                campaignLogsCount: stats.campaignLogsCount,
                totalCount: stats.messageLogsCount + stats.campaignLogsCount,
                thresholdDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error getting log cleanup stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get log cleanup statistics'
        });
    }
});
// Manual cleanup of old logs (admin only)
router.post('/cleanup', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const result = await logCleanup_1.logCleanupService.cleanupOldLogs();
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
    }
    catch (error) {
        console.error('Error during manual log cleanup:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to cleanup logs'
        });
    }
});
// Get cleanup service status
router.get('/cleanup/status', auth_1.requireAuth, auth_1.requireAdmin, (req, res) => {
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
exports.default = router;
//# sourceMappingURL=logs.js.map