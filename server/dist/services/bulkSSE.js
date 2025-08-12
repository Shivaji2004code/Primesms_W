"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkSSE = exports.BulkSSE = void 0;
const logger_1 = require("../utils/logger");
class BulkSSE {
    constructor() {
        this.connections = new Map();
        this.connectionCount = 0;
    }
    attach(req, res, jobId) {
        this.connectionCount++;
        const connectionId = `bulk-${jobId}-${this.connectionCount}`;
        logger_1.logger.info('[BULK-SSE] New connection', { jobId, connectionId });
        res.status(200).set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'X-Accel-Buffering': 'no'
        });
        res.write(`data: ${JSON.stringify({
            type: 'connection',
            status: 'connected',
            jobId,
            at: new Date().toISOString()
        })}\n\n`);
        let connectionSet = this.connections.get(jobId);
        if (!connectionSet) {
            connectionSet = new Set();
            this.connections.set(jobId, connectionSet);
        }
        connectionSet.add(res);
        logger_1.logger.info('[BULK-SSE] Connection established', {
            jobId,
            connectionId,
            totalConnections: this.getTotalConnections()
        });
        const keepAlive = setInterval(() => {
            try {
                res.write(': ping\n\n');
            }
            catch (error) {
                logger_1.logger.info('[BULK-SSE] Keep-alive failed, cleaning up', { connectionId });
                clearInterval(keepAlive);
                this.cleanup(jobId, res);
            }
        }, 25000);
        const cleanup = () => {
            logger_1.logger.info('[BULK-SSE] Client disconnected', { connectionId });
            clearInterval(keepAlive);
            this.cleanup(jobId, res);
        };
        res.on('close', cleanup);
        res.on('error', cleanup);
        if (req) {
            req.on('close', cleanup);
            req.on('aborted', cleanup);
        }
    }
    emit(jobId, payload) {
        const connectionSet = this.connections.get(jobId);
        if (!connectionSet || connectionSet.size === 0) {
            logger_1.logger.debug('[BULK-SSE] No connections for job', { jobId });
            return;
        }
        const data = `data: ${JSON.stringify(payload)}\n\n`;
        let successCount = 0;
        let failureCount = 0;
        const failedConnections = [];
        for (const res of connectionSet) {
            try {
                res.write(data);
                successCount++;
            }
            catch (error) {
                logger_1.logger.warn('[BULK-SSE] Failed to send event', { jobId, error });
                failureCount++;
                failedConnections.push(res);
            }
        }
        for (const res of failedConnections) {
            connectionSet.delete(res);
            try {
                res.end();
            }
            catch (endError) {
            }
        }
        if (connectionSet.size === 0) {
            this.connections.delete(jobId);
        }
        if (successCount > 0 || failureCount > 0) {
            logger_1.logger.debug('[BULK-SSE] Event sent', {
                jobId,
                eventType: payload.type,
                success: successCount,
                failed: failureCount
            });
        }
    }
    cleanup(jobId, res) {
        const connectionSet = this.connections.get(jobId);
        if (connectionSet) {
            connectionSet.delete(res);
            if (connectionSet.size === 0) {
                this.connections.delete(jobId);
            }
        }
        try {
            if (!res.destroyed && !res.headersSent) {
                res.end();
            }
        }
        catch (error) {
        }
        logger_1.logger.debug('[BULK-SSE] Connection cleaned up', {
            jobId,
            totalConnections: this.getTotalConnections()
        });
    }
    getTotalConnections() {
        let total = 0;
        for (const set of this.connections.values()) {
            total += set.size;
        }
        return total;
    }
    getConnectionStats() {
        const jobs = {};
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
    hasConnections(jobId) {
        const connectionSet = this.connections.get(jobId);
        return connectionSet ? connectionSet.size > 0 : false;
    }
    sendTestEvent(jobId) {
        const testPayload = {
            type: 'test',
            message: 'Test bulk progress event',
            jobId,
            at: new Date().toISOString()
        };
        this.emit(jobId, testPayload);
        return this.hasConnections(jobId);
    }
    closeJobConnections(jobId) {
        const connectionSet = this.connections.get(jobId);
        if (!connectionSet)
            return;
        logger_1.logger.info('[BULK-SSE] Closing all connections for job', {
            jobId,
            connections: connectionSet.size
        });
        for (const res of connectionSet) {
            try {
                res.write(`data: ${JSON.stringify({
                    type: 'connection_closing',
                    jobId,
                    message: 'Job completed, closing connection',
                    at: new Date().toISOString()
                })}\n\n`);
                res.end();
            }
            catch (error) {
            }
        }
        this.connections.delete(jobId);
    }
}
exports.BulkSSE = BulkSSE;
exports.bulkSSE = new BulkSSE();
setInterval(() => {
    const stats = exports.bulkSSE.getConnectionStats();
    if (stats.totalConnections > 0) {
        logger_1.logger.info('[BULK-SSE] Connection stats', stats);
    }
}, 60000);
//# sourceMappingURL=bulkSSE.js.map