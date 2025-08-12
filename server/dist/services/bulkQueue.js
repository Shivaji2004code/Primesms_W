"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkQueue = void 0;
const crypto_1 = require("crypto");
const waSender_1 = require("./waSender");
const logger_1 = require("../utils/logger");
function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) {
        out.push(arr.slice(i, i + size));
    }
    return out;
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class BulkQueue {
    constructor(creds, logs, emitSSE) {
        this.creds = creds;
        this.logs = logs;
        this.emitSSE = emitSSE;
        this.jobs = new Map();
    }
    enqueue(input) {
        const BATCH_SIZE = parseInt(process.env.BULK_BATCH_SIZE || '50', 10);
        const HARD_CAP = parseInt(process.env.BULK_HARD_CAP || '50000', 10);
        if (!input.recipients?.length) {
            throw new Error('No recipients provided');
        }
        if (input.recipients.length > HARD_CAP) {
            throw new Error(`Recipients exceed hard cap of ${HARD_CAP}`);
        }
        const jobId = (0, crypto_1.randomUUID)();
        const totalBatches = Math.ceil(input.recipients.length / BATCH_SIZE);
        const job = {
            jobId,
            userId: input.userId,
            campaignId: input.campaignId || null,
            totalRecipients: input.recipients.length,
            batchSize: BATCH_SIZE,
            totalBatches,
            createdAt: new Date().toISOString(),
            state: 'queued',
            sent: 0,
            failed: 0,
            results: []
        };
        this.jobs.set(jobId, job);
        logger_1.logger.info('[BULK] Job enqueued', {
            jobId,
            userId: input.userId,
            recipients: input.recipients.length,
            batches: totalBatches
        });
        this.processJob(jobId, input).catch(error => {
            const currentJob = this.jobs.get(jobId);
            if (currentJob) {
                currentJob.state = 'failed';
                this.emitSSE(jobId, {
                    type: 'job_completed',
                    jobId,
                    state: currentJob.state,
                    sent: currentJob.sent,
                    failed: currentJob.failed,
                    error: String(error)
                });
            }
            logger_1.logger.error('[BULK] Job crashed', { jobId, error });
        });
        return job;
    }
    getJob(jobId) {
        return this.jobs.get(jobId) || null;
    }
    async processJob(jobId, input) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        try {
            job.state = 'running';
            logger_1.logger.info('[BULK] Job started', { jobId, userId: input.userId });
            const { phoneNumberId, accessToken } = await this.creds.getCredsByUserId(input.userId);
            const batches = chunk(input.recipients, job.batchSize);
            const CONCURRENCY = Math.max(1, parseInt(process.env.BULK_CONCURRENCY || '5', 10));
            const PAUSE_MS = parseInt(process.env.BULK_PAUSE_MS || '1000', 10);
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                logger_1.logger.info('[BULK] Batch started', { jobId, batchIndex, size: batch.length });
                this.emitSSE(jobId, {
                    type: 'batch_started',
                    jobId,
                    batchIndex,
                    size: batch.length
                });
                await this.processBatch(job, batch, {
                    userId: input.userId,
                    campaignId: input.campaignId || null,
                    phoneNumberId,
                    accessToken,
                    message: input.message,
                    batchIndex,
                    concurrency: CONCURRENCY
                }, input.variables, input.recipientVariables);
                this.emitSSE(jobId, {
                    type: 'batch_completed',
                    jobId,
                    batchIndex,
                    sent: job.sent,
                    failed: job.failed
                });
                logger_1.logger.info('[BULK] Batch completed', {
                    jobId,
                    batchIndex,
                    sent: job.sent,
                    failed: job.failed
                });
                if (batchIndex < batches.length - 1) {
                    await sleep(PAUSE_MS);
                }
            }
            job.state = job.failed > 0 && job.sent === 0 ? 'failed' : 'completed';
            this.emitSSE(jobId, {
                type: 'job_completed',
                jobId,
                state: job.state,
                sent: job.sent,
                failed: job.failed
            });
            logger_1.logger.info('[BULK] Job completed', {
                jobId,
                state: job.state,
                sent: job.sent,
                failed: job.failed
            });
        }
        catch (error) {
            logger_1.logger.error('[BULK] Job processing error', { jobId, error });
            job.state = 'failed';
            this.emitSSE(jobId, {
                type: 'job_completed',
                jobId,
                state: job.state,
                sent: job.sent,
                failed: job.failed,
                error: String(error)
            });
        }
    }
    async processBatch(job, recipients, options, staticVariables, recipientVariables) {
        const { concurrency } = options;
        let index = 0;
        const workers = [];
        const processNext = async () => {
            while (index < recipients.length) {
                const currentIndex = index++;
                const recipient = recipients[currentIndex];
                try {
                    let variables = staticVariables;
                    if (recipientVariables) {
                        const recipientData = recipientVariables.find(rv => rv.recipient === recipient);
                        variables = recipientData?.variables || staticVariables;
                    }
                    await this.sendSingleMessage(job, recipient, options, variables);
                }
                catch (error) {
                    logger_1.logger.error('[BULK] Message processing error', {
                        jobId: job.jobId,
                        recipient,
                        error
                    });
                }
            }
        };
        for (let i = 0; i < Math.min(concurrency, recipients.length); i++) {
            workers.push(processNext());
        }
        await Promise.all(workers);
    }
    async sendSingleMessage(job, to, options, variables) {
        const result = await (0, waSender_1.sendWhatsAppMessage)({
            accessToken: options.accessToken,
            phoneNumberId: options.phoneNumberId,
            to,
            message: options.message,
            variables
        });
        if (result.ok) {
            job.sent++;
            job.results.push({
                to: result.to,
                ok: true,
                messageId: result.messageId || null
            });
            if (result.messageId) {
                try {
                    await this.logs.upsertOnSendAck(options.userId, result.messageId, to, options.campaignId, {
                        source: 'bulk',
                        jobId: job.jobId,
                        batchIndex: options.batchIndex
                    });
                }
                catch (logError) {
                    logger_1.logger.error('[BULK] Failed to log successful send', {
                        jobId: job.jobId,
                        messageId: result.messageId,
                        to,
                        error: logError
                    });
                }
            }
            this.emitSSE(job.jobId, {
                type: 'message_sent',
                jobId: job.jobId,
                batchIndex: options.batchIndex,
                to,
                messageId: result.messageId || null,
                sent: job.sent,
                failed: job.failed
            });
        }
        else {
            job.failed++;
            job.results.push({
                to: result.to,
                ok: false,
                error: result.error
            });
            this.emitSSE(job.jobId, {
                type: 'message_failed',
                jobId: job.jobId,
                batchIndex: options.batchIndex,
                to,
                error: result.error,
                sent: job.sent,
                failed: job.failed
            });
        }
    }
}
exports.BulkQueue = BulkQueue;
//# sourceMappingURL=bulkQueue.js.map