"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const bulkQueue_1 = require("../services/bulkQueue");
const bulkRepos_1 = require("../repos/bulkRepos");
const bulkSSE_1 = require("../services/bulkSSE");
const logger_1 = require("../utils/logger");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
const bulkQueue = new bulkQueue_1.BulkQueue(bulkRepos_1.userBusinessRepo, bulkRepos_1.bulkCampaignLogsRepo, (jobId, payload) => bulkSSE_1.bulkSSE.emit(jobId, payload));
const bulkRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        error: 'Too many bulk requests',
        message: 'Bulk operations are limited to 10 per hour. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const requireAuth = async (req, res, next) => {
    const session = req.session;
    if (!session?.userId) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Please log in to access bulk messaging'
        });
    }
    try {
        const result = await db_1.default.query('SELECT id, name, username, role FROM users WHERE id = $1 LIMIT 1', [session.userId]);
        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'User not found',
                message: 'Your session is invalid. Please log in again.'
            });
        }
        req.user = result.rows[0];
        next();
    }
    catch (error) {
        logger_1.logger.error('[BULK-API] Auth error', { error });
        res.status(500).json({
            error: 'Authentication error',
            message: 'Please try again later'
        });
    }
};
const validateJobAccess = (req, res, next) => {
    const requestedJobId = req.params.jobId;
    const authenticatedUserId = req.user?.id;
    const job = bulkQueue.getJob(requestedJobId);
    if (!job) {
        return res.status(404).json({
            error: 'Job not found',
            message: 'The requested bulk job does not exist'
        });
    }
    if (job.userId !== authenticatedUserId && req.user?.role !== 'admin') {
        return res.status(403).json({
            error: 'Access denied',
            message: 'You can only access your own bulk jobs'
        });
    }
    req.bulkJob = job;
    next();
};
router.post('/send', bulkRateLimit, requireAuth, async (req, res) => {
    try {
        const { userId, campaignId, recipients, message } = req.body || {};
        const authenticatedUserId = req.user?.id;
        if (!userId || !Array.isArray(recipients) || !recipients.length || !message?.kind) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Missing required fields: userId, recipients (array), message.kind',
                details: {
                    userId: userId ? 'present' : 'missing',
                    recipients: Array.isArray(recipients) ? `${recipients.length} items` : 'invalid or missing',
                    messageKind: message?.kind || 'missing'
                }
            });
        }
        if (userId !== authenticatedUserId && req.user?.role !== 'admin') {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only create bulk jobs for yourself'
            });
        }
        if (!['text', 'template'].includes(message.kind)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'message.kind must be either "text" or "template"'
            });
        }
        if (message.kind === 'text') {
            if (!message.text?.body) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'text messages require message.text.body'
                });
            }
        }
        if (message.kind === 'template') {
            if (!message.template?.name || !message.template?.language_code) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'template messages require message.template.name and message.template.language_code'
                });
            }
        }
        const invalidRecipients = recipients.filter((r) => {
            if (typeof r !== 'string')
                return true;
            return !/^\d{7,15}$/.test(r.trim());
        });
        if (invalidRecipients.length > 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid recipient phone numbers detected',
                details: {
                    invalidRecipients: invalidRecipients.slice(0, 5),
                    total: invalidRecipients.length,
                    note: 'Phone numbers must be in E.164 format (digits only, 7-15 digits)'
                }
            });
        }
        const jobInput = {
            userId,
            campaignId: campaignId || null,
            recipients: recipients.map((r) => r.trim()),
            message
        };
        const job = bulkQueue.enqueue(jobInput);
        logger_1.logger.info('[BULK-API] Job created', {
            jobId: job.jobId,
            userId,
            recipients: job.totalRecipients,
            batches: job.totalBatches,
            requester: authenticatedUserId
        });
        res.status(201).json({
            success: true,
            jobId: job.jobId,
            totalRecipients: job.totalRecipients,
            batchSize: job.batchSize,
            totalBatches: job.totalBatches,
            state: job.state,
            createdAt: job.createdAt
        });
    }
    catch (error) {
        logger_1.logger.error('[BULK-API] Job creation failed', { error, userId: req.user?.id });
        res.status(400).json({
            error: 'Job Creation Failed',
            message: error.message || 'An error occurred while creating the bulk job'
        });
    }
});
router.get('/jobs/:jobId', requireAuth, validateJobAccess, (req, res) => {
    const job = req.bulkJob;
    logger_1.logger.debug('[BULK-API] Job status requested', {
        jobId: job.jobId,
        requester: req.user?.id
    });
    res.json({
        jobId: job.jobId,
        userId: job.userId,
        state: job.state,
        totalRecipients: job.totalRecipients,
        sent: job.sent,
        failed: job.failed,
        batchSize: job.batchSize,
        totalBatches: job.totalBatches,
        createdAt: job.createdAt,
        campaignId: job.campaignId,
        progress: job.totalRecipients > 0 ? {
            percentage: Math.round(((job.sent + job.failed) / job.totalRecipients) * 100),
            completed: job.sent + job.failed,
            remaining: job.totalRecipients - job.sent - job.failed
        } : null
    });
});
router.get('/realtime/:jobId', requireAuth, validateJobAccess, (req, res) => {
    const job = req.bulkJob;
    logger_1.logger.info('[BULK-API] SSE connection requested', {
        jobId: job.jobId,
        requester: req.user?.id
    });
    try {
        bulkSSE_1.bulkSSE.attach(req, res, job.jobId);
    }
    catch (error) {
        logger_1.logger.error('[BULK-API] SSE connection failed', {
            jobId: job.jobId,
            error
        });
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Failed to establish real-time connection',
                message: 'Please try refreshing the page'
            });
        }
    }
});
router.get('/jobs', requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const offset = Math.max(parseInt(req.query.offset) || 0, 0);
        const allJobs = Array.from(bulkQueue['jobs'].values())
            .filter(job => job.userId === userId || req.user?.role === 'admin')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(offset, offset + limit);
        const total = Array.from(bulkQueue['jobs'].values())
            .filter(job => job.userId === userId || req.user?.role === 'admin').length;
        res.json({
            jobs: allJobs.map(job => ({
                jobId: job.jobId,
                userId: job.userId,
                state: job.state,
                totalRecipients: job.totalRecipients,
                sent: job.sent,
                failed: job.failed,
                createdAt: job.createdAt,
                campaignId: job.campaignId
            })),
            pagination: {
                limit,
                offset,
                total,
                hasMore: offset + limit < total
            }
        });
    }
    catch (error) {
        logger_1.logger.error('[BULK-API] Failed to list jobs', { error, userId: req.user?.id });
        res.status(500).json({
            error: 'Failed to retrieve jobs',
            message: 'Please try again later'
        });
    }
});
router.get('/stats', requireAuth, (req, res) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            error: 'Admin access required',
            message: 'Only administrators can view bulk messaging statistics'
        });
    }
    const allJobs = Array.from(bulkQueue['jobs'].values());
    const sseStats = bulkSSE_1.bulkSSE.getConnectionStats();
    const stats = {
        totalJobs: allJobs.length,
        jobsByState: allJobs.reduce((acc, job) => {
            acc[job.state] = (acc[job.state] || 0) + 1;
            return acc;
        }, {}),
        totalMessages: {
            sent: allJobs.reduce((sum, job) => sum + job.sent, 0),
            failed: allJobs.reduce((sum, job) => sum + job.failed, 0),
            pending: allJobs.reduce((sum, job) => sum + (job.totalRecipients - job.sent - job.failed), 0)
        },
        connections: sseStats,
        timestamp: new Date().toISOString()
    };
    res.json(stats);
});
exports.default = router;
//# sourceMappingURL=bulk.js.map