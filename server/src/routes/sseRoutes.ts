// [Claude AI] SSE Routes for Real-time Updates — Aug 2025
import { Router, Request, Response, NextFunction } from 'express';
import { sseHub } from '../services/sseBroadcaster';
import pool from '../db';

const sseRouter = Router();

// ====== AUTHENTICATION MIDDLEWARE FOR SSE ======

const requireAuthForSSE = async (req: Request, res: Response, next: NextFunction) => {
  const session = req.session as any;
  
  console.log('🔐 [SSE] Auth check:', {
    path: req.path,
    hasSession: Boolean(req.session),
    sessionId: req.sessionID?.substring(0, 8),
    userId: session?.userId,
    userAgent: req.get('User-Agent')?.substring(0, 30)
  });
  
  if (!session?.userId) {
    console.log('❌ [SSE] Auth failed: No session or userId');
    res.status(401).json({ 
      error: 'Authentication required for SSE connection',
      message: 'Please log in to receive real-time updates'
    });
    return;
  }

  // Verify user exists in database
  try {
    const result = await pool.query(
      'SELECT id, name, username, role FROM users WHERE id = $1 LIMIT 1',
      [session.userId]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ [SSE] Auth failed: User not found for userId:', session.userId);
      res.status(401).json({ 
        error: 'User not found',
        message: 'Your session is invalid. Please log in again.'
      });
      return;
    }

    // Add user info to request for use in route handlers
    const user = result.rows[0];
    req.user = user;
    console.log(`✅ [SSE] Auth success: ${user.username} (${user.id})`);
    next();
  } catch (error) {
    console.error('❌ [SSE] Database error during auth:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      message: 'Please try again later'
    });
  }
};

// ====== USER ID VALIDATION MIDDLEWARE ======

const validateUserAccess = (req: Request, res: Response, next: NextFunction) => {
  const requestedUserId = req.params.userId;
  const authenticatedUserId = req.user?.id;
  
  // Users can only access their own real-time streams
  // Admins can access any user's stream
  if (authenticatedUserId !== requestedUserId && req.user?.role !== 'admin') {
    console.log(`❌ [SSE] Access denied: User ${authenticatedUserId} tried to access ${requestedUserId}`);
    res.status(403).json({ 
      error: 'Access denied',
      message: 'You can only access your own real-time updates'
    });
    return;
  }
  
  console.log(`✅ [SSE] Access granted: User ${authenticatedUserId} accessing ${requestedUserId}`);
  next();
};

// ====== SSE ROUTE HANDLERS ======

// SSE: Campaign reports real-time updates for a user
sseRouter.get('/realtime/reports/:userId', requireAuthForSSE, validateUserAccess, (req: Request, res: Response) => {
  const userId = req.params.userId;
  
  try {
    console.log(`📡 [SSE] Starting reports stream for user ${userId}`);
    sseHub.attachReports(req, res, userId);
    
    // Connection is now handled by SSE hub
    // Response will stay open until client disconnects
  } catch (error) {
    console.error(`❌ [SSE] Error starting reports stream for ${userId}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to start real-time updates',
        message: 'Please try refreshing the page'
      });
    }
  }
});

// SSE: Template status real-time updates for a user
sseRouter.get('/realtime/templates/:userId', requireAuthForSSE, validateUserAccess, (req: Request, res: Response) => {
  const userId = req.params.userId;
  
  try {
    console.log(`📡 [SSE] Starting templates stream for user ${userId}`);
    sseHub.attachTemplates(req, res, userId);
    
    // Connection is now handled by SSE hub
    // Response will stay open until client disconnects
  } catch (error) {
    console.error(`❌ [SSE] Error starting templates stream for ${userId}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to start real-time updates',
        message: 'Please try refreshing the page'
      });
    }
  }
});

// ====== DEBUG/MONITORING ENDPOINTS ======

// Get current SSE connection stats (admin only or webhook debug token)
sseRouter.get('/realtime/stats', (req: Request, res: Response) => {
  const session = req.session as any;
  const debugToken = req.header('authorization')?.replace('Bearer ', '');
  const isAdmin = session?.userId && req.user?.role === 'admin';
  const validDebugToken = debugToken === process.env.WEBHOOK_DEBUG_TOKEN;
  
  if (!isAdmin && !validDebugToken) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const stats = sseHub.getConnectionStats();
  res.json({
    connections: stats,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test SSE connection for a user (admin only or own user)
sseRouter.post('/realtime/test/:userId', requireAuthForSSE, validateUserAccess, (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { eventType } = req.body || {};
  
  if (!['reports', 'templates'].includes(eventType)) {
    return res.status(400).json({ 
      error: 'Invalid event type',
      message: 'eventType must be "reports" or "templates"'
    });
  }
  
  const success = sseHub.sendTestEvent(userId, eventType);
  
  res.json({
    success,
    message: success 
      ? `Test ${eventType} event sent to user ${userId}`
      : `No active ${eventType} connections for user ${userId}`,
    hasConnections: sseHub.hasConnectionsForUser(userId),
    userId,
    eventType
  });
});

// Health check endpoint for SSE service
sseRouter.get('/realtime/health', (req: Request, res: Response) => {
  const stats = sseHub.getConnectionStats();
  res.json({
    status: 'healthy',
    service: 'SSE Real-time Updates',
    connections: stats,
    timestamp: new Date().toISOString()
  });
});

// ====== TYPE DECLARATIONS ======

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        username: string;
        role: string;
      };
    }
  }
}

export default sseRouter;
export { sseHub };