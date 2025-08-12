// Bulk Queue Engine for WhatsApp Messages
// Handles batching, sequential processing, and concurrency control
import { randomUUID } from 'crypto';
import { sendWhatsAppMessage, WhatsAppMessage, WhatsAppTemplate, SendResult, BulkMessageVariables } from './waSender';
import { logger } from '../utils/logger';
import pool from '../db';

export type BulkMessage = WhatsAppMessage | WhatsAppTemplate;

export interface BulkJobInput {
  userId: string;
  campaignId?: string | null;
  recipients: string[];
  message: BulkMessage;
  variables?: BulkMessageVariables; // Static variables for quick send
  recipientVariables?: Array<{ recipient: string; variables: BulkMessageVariables }>; // Per-recipient variables for customize
}

export type JobState = 'queued' | 'running' | 'completed' | 'failed' | 'canceled';

export interface BulkJob {
  jobId: string;
  userId: string;
  campaignId?: string | null;
  totalRecipients: number;
  batchSize: number;
  totalBatches: number;
  createdAt: string;
  state: JobState;
  sent: number;
  failed: number;
  results: Array<{ to: string; ok: boolean; messageId?: string | null; error?: any }>;
}

export interface TenantCreds {
  phoneNumberId: string;
  accessToken: string;
}

export interface CredsProvider {
  getCredsByUserId(userId: string): Promise<TenantCreds>;
}

export interface CampaignLogsRepo {
  upsertOnSendAck(userId: string, messageId: string, to: string, campaignId?: string | null, meta?: any): Promise<void>;
}

export type SSEEmitter = (jobId: string, payload: any) => void;

// Utility functions
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class BulkQueue {
  private jobs = new Map<string, BulkJob>();

  constructor(
    private creds: CredsProvider,
    private logs: CampaignLogsRepo,
    private emitSSE: SSEEmitter
  ) {}

  enqueue(input: BulkJobInput): BulkJob {
    const BATCH_SIZE = parseInt(process.env.BULK_BATCH_SIZE || '50', 10);
    const HARD_CAP = parseInt(process.env.BULK_HARD_CAP || '50000', 10);

    // Validation
    if (!input.recipients?.length) {
      throw new Error('No recipients provided');
    }
    
    if (input.recipients.length > HARD_CAP) {
      throw new Error(`Recipients exceed hard cap of ${HARD_CAP}`);
    }

    const jobId = randomUUID();
    const totalBatches = Math.ceil(input.recipients.length / BATCH_SIZE);

    const job: BulkJob = {
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

    logger.info('[BULK] Job enqueued', {
      jobId,
      userId: input.userId,
      recipients: input.recipients.length,
      batches: totalBatches
    });

    // Start job processing (fire-and-forget)
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
      logger.error('[BULK] Job crashed', { jobId, error });
    });

    return job;
  }

  getJob(jobId: string): BulkJob | null {
    return this.jobs.get(jobId) || null;
  }

  private async processJob(jobId: string, input: BulkJobInput): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.state = 'running';
      logger.info('[BULK] Job started', { jobId, userId: input.userId });

      // Get user credentials
      const { phoneNumberId, accessToken } = await this.creds.getCredsByUserId(input.userId);

      // Split recipients into batches
      const batches = chunk(input.recipients, job.batchSize);
      
      const CONCURRENCY = Math.max(1, parseInt(process.env.BULK_CONCURRENCY || '5', 10));
      const PAUSE_MS = parseInt(process.env.BULK_PAUSE_MS || '1000', 10);

      // Process batches sequentially
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        logger.info('[BULK] Batch started', { jobId, batchIndex, size: batch.length });
        
        this.emitSSE(jobId, {
          type: 'batch_started',
          jobId,
          batchIndex,
          size: batch.length
        });

        // Process batch with controlled concurrency
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

        logger.info('[BULK] Batch completed', { 
          jobId, 
          batchIndex, 
          sent: job.sent, 
          failed: job.failed 
        });

        // Pause between batches (except for the last one)
        if (batchIndex < batches.length - 1) {
          await sleep(PAUSE_MS);
        }
      }

      // Job completed
      job.state = job.failed > 0 && job.sent === 0 ? 'failed' : 'completed';
      
      this.emitSSE(jobId, {
        type: 'job_completed',
        jobId,
        state: job.state,
        sent: job.sent,
        failed: job.failed
      });

      logger.info('[BULK] Job completed', {
        jobId,
        state: job.state,
        sent: job.sent,
        failed: job.failed
      });

    } catch (error) {
      logger.error('[BULK] Job processing error', { jobId, error });
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

  private async processBatch(
    job: BulkJob,
    recipients: string[],
    options: {
      userId: string;
      campaignId: string | null;
      phoneNumberId: string;
      accessToken: string;
      message: BulkMessage;
      batchIndex: number;
      concurrency: number;
    },
    staticVariables?: BulkMessageVariables,
    recipientVariables?: Array<{ recipient: string; variables: BulkMessageVariables }>
  ): Promise<void> {
    const { concurrency } = options;
    
    // Simple concurrency control using worker pool
    let index = 0;
    const workers: Promise<void>[] = [];

    const processNext = async (): Promise<void> => {
      while (index < recipients.length) {
        const currentIndex = index++;
        const recipient = recipients[currentIndex];
        
        try {
          // Get variables for this recipient
          let variables = staticVariables;
          if (recipientVariables) {
            const recipientData = recipientVariables.find(rv => rv.recipient === recipient);
            variables = recipientData?.variables || staticVariables;
          }
          
          await this.sendSingleMessage(job, recipient, options, variables);
        } catch (error) {
          logger.error('[BULK] Message processing error', {
            jobId: job.jobId,
            recipient,
            error
          });
        }
      }
    };

    // Start worker pool
    for (let i = 0; i < Math.min(concurrency, recipients.length); i++) {
      workers.push(processNext());
    }

    // Wait for all workers to complete
    await Promise.all(workers);
  }

  private async sendSingleMessage(
    job: BulkJob,
    to: string,
    options: {
      userId: string;
      campaignId: string | null;
      phoneNumberId: string;
      accessToken: string;
      message: BulkMessage;
      batchIndex: number;
    },
    variables?: BulkMessageVariables
  ): Promise<void> {
    const result = await sendWhatsAppMessage({
      accessToken: options.accessToken,
      phoneNumberId: options.phoneNumberId,
      to,
      message: options.message,
      variables
    });

    // Update job statistics and results
    if (result.ok) {
      job.sent++;
      job.results.push({
        to: result.to,
        ok: true,
        messageId: result.messageId || null
      });

      // Log to campaign_logs if we have a messageId
      if (result.messageId) {
        try {
          await this.logs.upsertOnSendAck(
            options.userId,
            result.messageId,
            to,
            options.campaignId,
            {
              source: 'bulk',
              jobId: job.jobId,
              batchIndex: options.batchIndex
            }
          );
        } catch (logError) {
          logger.error('[BULK] Failed to log successful send', {
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

    } else {
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