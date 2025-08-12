// Bulk SSE Service for Real-time Progress Updates
// Extends the existing SSE patterns for bulk messaging progress
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export class BulkSSE {
  // jobId -> Set<Response>
  private connections = new Map<string, Set<Response>>();
  private connectionCount = 0;

  attach(req: Request, res: Response, jobId: string): void {
    this.connectionCount++;
    const connectionId = `bulk-${jobId}-${this.connectionCount}`;
    
    logger.info('[BULK-SSE] New connection', { jobId, connectionId });

    // Set SSE headers
    res.status(200).set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({
      type: 'connection',
      status: 'connected',
      jobId,
      at: new Date().toISOString()
    })}\n\n`);

    // Add to job's connection set
    let connectionSet = this.connections.get(jobId);
    if (!connectionSet) {
      connectionSet = new Set<Response>();
      this.connections.set(jobId, connectionSet);
    }
    connectionSet.add(res);

    logger.info('[BULK-SSE] Connection established', { 
      jobId, 
      connectionId, 
      totalConnections: this.getTotalConnections() 
    });

    // Keep-alive ping every 25 seconds
    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (error) {
        logger.info('[BULK-SSE] Keep-alive failed, cleaning up', { connectionId });
        clearInterval(keepAlive);
        this.cleanup(jobId, res);
      }
    }, 25000);

    // Handle client disconnect
    const cleanup = () => {
      logger.info('[BULK-SSE] Client disconnected', { connectionId });
      clearInterval(keepAlive);
      this.cleanup(jobId, res);
    };

    res.on('close', cleanup);
    res.on('error', cleanup);
    
    // Handle request close events
    if (req) {
      req.on('close', cleanup);
      req.on('aborted', cleanup);
    }
  }

  emit(jobId: string, payload: any): void {
    const connectionSet = this.connections.get(jobId);
    if (!connectionSet || connectionSet.size === 0) {
      logger.debug('[BULK-SSE] No connections for job', { jobId });
      return;
    }

    const data = `data: ${JSON.stringify(payload)}\n\n`;
    let successCount = 0;
    let failureCount = 0;
    const failedConnections: Response[] = [];

    for (const res of connectionSet) {
      try {
        res.write(data);
        successCount++;
      } catch (error) {
        logger.warn('[BULK-SSE] Failed to send event', { jobId, error });
        failureCount++;
        failedConnections.push(res);
      }
    }

    // Clean up failed connections
    for (const res of failedConnections) {
      connectionSet.delete(res);
      try {
        res.end();
      } catch (endError) {
        // Ignore errors when ending failed connections
      }
    }

    // Remove empty connection sets
    if (connectionSet.size === 0) {
      this.connections.delete(jobId);
    }

    if (successCount > 0 || failureCount > 0) {
      logger.debug('[BULK-SSE] Event sent', { 
        jobId, 
        eventType: payload.type,
        success: successCount, 
        failed: failureCount 
      });
    }
  }

  private cleanup(jobId: string, res: Response): void {
    const connectionSet = this.connections.get(jobId);
    if (connectionSet) {
      connectionSet.delete(res);
      
      // Remove empty sets to prevent memory leaks
      if (connectionSet.size === 0) {
        this.connections.delete(jobId);
      }
    }

    try {
      if (!res.destroyed && !res.headersSent) {
        res.end();
      }
    } catch (error) {
      // Ignore cleanup errors
    }

    logger.debug('[BULK-SSE] Connection cleaned up', { 
      jobId, 
      totalConnections: this.getTotalConnections() 
    });
  }

  // Get total number of active connections
  getTotalConnections(): number {
    let total = 0;
    for (const set of this.connections.values()) {
      total += set.size;
    }
    return total;
  }

  // Get connection stats for monitoring
  getConnectionStats(): { activeJobs: number; totalConnections: number; jobs: Record<string, number> } {
    const jobs: Record<string, number> = {};
    let totalConnections = 0;

    for (const [jobId, connectionSet] of this.connections) {
      jobs[jobId] = connectionSet.size;
      totalConnections += connectionSet.size;
    }

    return {
      activeJobs: this.connections.size,
      totalConnections,
      jobs
    };
  }

  // Check if a specific job has active connections
  hasConnections(jobId: string): boolean {
    const connectionSet = this.connections.get(jobId);
    return connectionSet ? connectionSet.size > 0 : false;
  }

  // Send a test event (for debugging)
  sendTestEvent(jobId: string): boolean {
    const testPayload = {
      type: 'test',
      message: 'Test bulk progress event',
      jobId,
      at: new Date().toISOString()
    };

    this.emit(jobId, testPayload);
    return this.hasConnections(jobId);
  }

  // Cleanup all connections for a job (when job is completed or failed)
  closeJobConnections(jobId: string): void {
    const connectionSet = this.connections.get(jobId);
    if (!connectionSet) return;

    logger.info('[BULK-SSE] Closing all connections for job', { 
      jobId, 
      connections: connectionSet.size 
    });

    for (const res of connectionSet) {
      try {
        // Send final event before closing
        res.write(`data: ${JSON.stringify({
          type: 'connection_closing',
          jobId,
          message: 'Job completed, closing connection',
          at: new Date().toISOString()
        })}\n\n`);
        
        res.end();
      } catch (error) {
        // Ignore errors when closing connections
      }
    }

    this.connections.delete(jobId);
  }
}

// Export singleton instance
export const bulkSSE = new BulkSSE();

// Log connection stats periodically (for monitoring)
setInterval(() => {
  const stats = bulkSSE.getConnectionStats();
  if (stats.totalConnections > 0) {
    logger.info('[BULK-SSE] Connection stats', stats);
  }
}, 60000); // Every minute