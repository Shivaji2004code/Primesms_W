// Bulk Messaging API Routes
// Handles bulk message submission, status checking, and SSE progress streaming
import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { BulkQueue, BulkJobInput } from '../services/bulkQueue';
import { userBusinessRepo, bulkCampaignLogsRepo } from '../repos/bulkRepos';
import { bulkSSE } from '../services/bulkSSE';
import { logger } from '../utils/logger';
import pool from '../db';

const router = Router();

// Create bulk queue instance
const bulkQueue = new BulkQueue(
  userBusinessRepo,
  bulkCampaignLogsRepo,
  (jobId, payload) => bulkSSE.emit(jobId, payload)
);

// Rate limiting for bulk operations
const bulkRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit to 10 bulk operations per hour per IP
  message: {
    error: 'Too many bulk requests',
    message: 'Bulk operations are limited to 10 per hour. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication middleware for bulk operations
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const session = req.session as any;
  
  if (!session?.userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access bulk messaging'
    });
  }

  // Verify user exists in database
  try {
    const result = await pool.query(
      'SELECT id, name, username, role FROM users WHERE id = $1 LIMIT 1',
      [session.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        message: 'Your session is invalid. Please log in again.'
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    logger.error('[BULK-API] Auth error', { error });
    res.status(500).json({
      error: 'Authentication error',
      message: 'Please try again later'
    });
  }
};

// Validate user access to a specific job
const validateJobAccess = (req: Request, res: Response, next: NextFunction) => {
  const requestedJobId = req.params.jobId;
  const authenticatedUserId = req.user?.id;
  
  // Get the job and verify ownership
  const job = bulkQueue.getJob(requestedJobId);
  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      message: 'The requested bulk job does not exist'
    });
  }
  
  // Users can only access their own jobs, admins can access any job
  if (job.userId !== authenticatedUserId && req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only access your own bulk jobs'
    });
  }
  
  // Attach job to request for use in route handlers
  req.bulkJob = job;
  next();
};

// POST /api/bulk/send - Submit a bulk messaging job
router.post('/send', bulkRateLimit, requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, campaignId, recipients, message } = req.body || {};
    const authenticatedUserId = req.user?.id;

    // Validation
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

    // Users can only create jobs for themselves, admins can create for anyone
    if (userId !== authenticatedUserId && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only create bulk jobs for yourself'
      });
    }

    // Validate message format
    if (!['text', 'template'].includes(message.kind)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'message.kind must be either "text" or "template"'
      });
    }

    // Additional validation for text messages
    if (message.kind === 'text') {
      if (!message.text?.body) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'text messages require message.text.body'
        });
      }
    }

    // Additional validation for template messages
    if (message.kind === 'template') {
      if (!message.template?.name || !message.template?.language_code) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'template messages require message.template.name and message.template.language_code'
        });
      }
    }

    // Validate recipients are E.164 format
    const invalidRecipients = recipients.filter((r: any) => {
      if (typeof r !== 'string') return true;
      // Basic E.164 validation (digits only, 7-15 digits)
      return !/^\d{7,15}$/.test(r.trim());
    });

    if (invalidRecipients.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid recipient phone numbers detected',
        details: {
          invalidRecipients: invalidRecipients.slice(0, 5), // Show first 5 invalid numbers
          total: invalidRecipients.length,
          note: 'Phone numbers must be in E.164 format (digits only, 7-15 digits)'
        }
      });
    }

    // Create and enqueue job
    const jobInput: BulkJobInput = {
      userId,
      campaignId: campaignId || null,
      recipients: recipients.map((r: string) => r.trim()),
      message
    };

    const job = bulkQueue.enqueue(jobInput);

    logger.info('[BULK-API] Job created', {
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

  } catch (error: any) {
    logger.error('[BULK-API] Job creation failed', { error, userId: req.user?.id });
    
    res.status(400).json({
      error: 'Job Creation Failed',
      message: error.message || 'An error occurred while creating the bulk job'
    });
  }
});

// GET /api/bulk/jobs/:jobId - Get job status
router.get('/jobs/:jobId', requireAuth, validateJobAccess, (req: Request, res: Response) => {
  const job = req.bulkJob!;
  
  logger.debug('[BULK-API] Job status requested', {
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

// GET /realtime/bulk/:jobId - SSE stream for job progress
router.get('/realtime/:jobId', requireAuth, validateJobAccess, (req: Request, res: Response) => {
  const job = req.bulkJob!;
  
  logger.info('[BULK-API] SSE connection requested', {
    jobId: job.jobId,
    requester: req.user?.id
  });

  try {
    bulkSSE.attach(req, res, job.jobId);
  } catch (error) {
    logger.error('[BULK-API] SSE connection failed', { 
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

// GET /api/bulk/jobs - List user's bulk jobs (with pagination)
router.get('/jobs', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    
    // For now, we only return in-memory jobs
    // In production, you'd want to persist job metadata to database
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
    
  } catch (error) {
    logger.error('[BULK-API] Failed to list jobs', { error, userId: req.user?.id });
    res.status(500).json({
      error: 'Failed to retrieve jobs',
      message: 'Please try again later'
    });
  }
});

// GET /api/bulk/stats - Get bulk messaging statistics (admin only)
router.get('/stats', requireAuth, (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'Only administrators can view bulk messaging statistics'
    });
  }

  const allJobs = Array.from(bulkQueue['jobs'].values());
  const sseStats = bulkSSE.getConnectionStats();
  
  const stats = {
    totalJobs: allJobs.length,
    jobsByState: allJobs.reduce((acc: any, job) => {
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

// Type declarations for request extensions
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        username: string;
        role: string;
      };
      bulkJob?: any;
    }
  }
}

export default router;