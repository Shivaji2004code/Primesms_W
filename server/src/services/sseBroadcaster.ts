// [Claude AI] SSE Broadcaster Service — Aug 2025
import { Response, Request } from 'express';

type AnyObj = Record<string, any>;

export class SSEHub {
  // userId -> Set<Response> for different event types
  private reports = new Map<string, Set<Response>>();
  private templates = new Map<string, Set<Response>>();
  
  // Keep track of connections for monitoring
  private connectionCount = 0;

  // ====== CONNECTION MANAGEMENT ======
  
  attachReports(req: Request, res: Response, userId: string): void {
    console.log(`📡 [SSE] New reports connection for user ${userId}`);
    this.attach(this.reports, res, userId, 'reports');
  }

  attachTemplates(req: Request, res: Response, userId: string): void {
    console.log(`📡 [SSE] New templates connection for user ${userId}`);
    this.attach(this.templates, res, userId, 'templates');
  }

  // ====== EVENT EMISSION ======
  
  emitReport(userId: string, payload: AnyObj): void {
    this.emit(this.reports, userId, payload, 'report');
  }

  emitTemplate(userId: string, payload: AnyObj): void {
    this.emit(this.templates, userId, payload, 'template');
  }

  // ====== INTERNAL METHODS ======
  
  private attach(bucket: Map<string, Set<Response>>, res: Response, userId: string, type: string): void {
    this.connectionCount++;
    const connectionId = `${type}-${userId}-${this.connectionCount}`;
    
    // Set SSE headers
    res.status(200);
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({
      type: 'connection',
      status: 'connected',
      userId,
      connectionType: type,
      at: new Date().toISOString()
    })}\n\n`);

    // Add to user's connection set
    let connectionSet = bucket.get(userId);
    if (!connectionSet) {
      connectionSet = new Set<Response>();
      bucket.set(userId, connectionSet);
    }
    connectionSet.add(res);

    console.log(`✅ [SSE] Connected ${connectionId}, total connections: ${this.getTotalConnections()}`);

    // Set up keep-alive ping every 30 seconds to prevent connection timeout
    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (error) {
        console.log(`💔 [SSE] Keep-alive failed for ${connectionId}, cleaning up`);
        clearInterval(keepAlive);
        this.cleanup(bucket, userId, res);
      }
    }, 30_000);

    // Handle client disconnect
    const cleanup = () => {
      console.log(`🔌 [SSE] Disconnect ${connectionId}`);
      clearInterval(keepAlive);
      this.cleanup(bucket, userId, res);
    };

    res.on('close', cleanup);
    res.on('error', cleanup);
    
    // For some clients, we might need to handle request close
    if (res.req) {
      res.req.on('close', cleanup);
      res.req.on('aborted', cleanup);
    }
  }

  private emit(bucket: Map<string, Set<Response>>, userId: string, payload: AnyObj, eventType: string): void {
    const connectionSet = bucket.get(userId);
    if (!connectionSet || connectionSet.size === 0) {
      console.log(`📡 [SSE] No ${eventType} connections for user ${userId}`);
      return;
    }

    const data = `data: ${JSON.stringify(payload)}\n\n`;
    let successCount = 0;
    let failureCount = 0;

    for (const res of connectionSet) {
      try {
        res.write(data);
        successCount++;
      } catch (error) {
        console.log(`❌ [SSE] Failed to send ${eventType} event to user ${userId}:`, error);
        failureCount++;
        // Remove failed connection
        connectionSet.delete(res);
        try {
          res.end();
        } catch (endError) {
          // Ignore errors when ending failed connections
        }
      }
    }

    console.log(`📡 [SSE] Sent ${eventType} event to user ${userId}: ${successCount} success, ${failureCount} failed`);
  }

  private cleanup(bucket: Map<string, Set<Response>>, userId: string, res: Response): void {
    const connectionSet = bucket.get(userId);
    if (connectionSet) {
      connectionSet.delete(res);
      
      // Remove empty sets to prevent memory leaks
      if (connectionSet.size === 0) {
        bucket.delete(userId);
      }
    }

    try {
      if (!res.destroyed && !res.headersSent) {
        res.end();
      }
    } catch (error) {
      // Ignore errors when ending connections
    }

    console.log(`🧹 [SSE] Cleaned up connection for user ${userId}, total connections: ${this.getTotalConnections()}`);
  }

  // ====== MONITORING ======
  
  getTotalConnections(): number {
    let total = 0;
    for (const set of this.reports.values()) {
      total += set.size;
    }
    for (const set of this.templates.values()) {
      total += set.size;
    }
    return total;
  }

  getConnectionStats(): { reports: number; templates: number; total: number } {
    let reportsCount = 0;
    let templatesCount = 0;

    for (const set of this.reports.values()) {
      reportsCount += set.size;
    }
    
    for (const set of this.templates.values()) {
      templatesCount += set.size;
    }

    return {
      reports: reportsCount,
      templates: templatesCount,
      total: reportsCount + templatesCount
    };
  }

  // ====== HEALTH CHECK METHODS ======
  
  hasConnectionsForUser(userId: string): boolean {
    const reportsConnections = this.reports.get(userId)?.size || 0;
    const templatesConnections = this.templates.get(userId)?.size || 0;
    return reportsConnections > 0 || templatesConnections > 0;
  }

  // Send a test event (useful for debugging)
  sendTestEvent(userId: string, eventType: 'reports' | 'templates'): boolean {
    const testPayload = {
      type: 'test',
      message: `Test ${eventType} event`,
      userId,
      at: new Date().toISOString()
    };

    if (eventType === 'reports') {
      this.emitReport(userId, testPayload);
    } else {
      this.emitTemplate(userId, testPayload);
    }

    return this.hasConnectionsForUser(userId);
  }

  // Broadcast to all connected users (for system-wide notifications)
  broadcastToAll(payload: AnyObj, eventType: 'reports' | 'templates' = 'reports'): void {
    const bucket = eventType === 'reports' ? this.reports : this.templates;
    let userCount = 0;
    
    for (const userId of bucket.keys()) {
      this.emit(bucket, userId, payload, eventType);
      userCount++;
    }
    
    console.log(`📢 [SSE] Broadcasted ${eventType} event to ${userCount} users`);
  }
}

// Export singleton instance
export const sseHub = new SSEHub();

// Log connection stats periodically (for monitoring in production)
setInterval(() => {
  const stats = sseHub.getConnectionStats();
  if (stats.total > 0) {
    console.log(`📊 [SSE] Connection stats: ${stats.reports} reports, ${stats.templates} templates (${stats.total} total)`);
  }
}, 60_000); // Every minute