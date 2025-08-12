// Repository implementations for bulk messaging
// Connects to existing database schema without changes
import pool from '../db';
import { logger } from '../utils/logger';
import { CredsProvider, CampaignLogsRepo, TenantCreds } from '../services/bulkQueue';

export class UserBusinessRepo implements CredsProvider {
  async getCredsByUserId(userId: string): Promise<TenantCreds> {
    try {
      const query = `
        SELECT 
          whatsapp_number_id,
          access_token
        FROM user_business_info 
        WHERE user_id = $1 AND is_active = true
        LIMIT 1
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error(`No active WhatsApp Business credentials found for user ${userId}`);
      }
      
      const row = result.rows[0];
      
      if (!row.whatsapp_number_id || !row.access_token) {
        throw new Error(`Incomplete WhatsApp Business credentials for user ${userId}`);
      }
      
      return {
        phoneNumberId: row.whatsapp_number_id,
        accessToken: row.access_token
      };
      
    } catch (error) {
      logger.error('[BULK-REPO] Failed to get user credentials', { userId, error });
      throw error;
    }
  }
}

export class BulkCampaignLogsRepo implements CampaignLogsRepo {
  async upsertOnSendAck(
    userId: string, 
    messageId: string, 
    to: string, 
    campaignId?: string | null, 
    meta?: any
  ): Promise<void> {
    try {
      // Validate inputs
      const cleanRecipient = to?.toString().trim();
      if (!cleanRecipient) {
        logger.warn('[BULK-REPO] Skipping log entry: empty recipient', { userId, messageId });
        return;
      }

      if (!messageId) {
        logger.warn('[BULK-REPO] Skipping log entry: empty messageId', { userId, to: cleanRecipient });
        return;
      }

      // Create a unique campaign name for bulk operations
      const campaignName = campaignId || `BULK_${meta?.jobId || 'UNKNOWN'}_${Date.now()}`;
      
      // Get user's phone_number_id for logging
      const phoneNumberQuery = `
        SELECT whatsapp_number_id 
        FROM user_business_info 
        WHERE user_id = $1 AND is_active = true 
        LIMIT 1
      `;
      
      const phoneResult = await pool.query(phoneNumberQuery, [userId]);
      const phoneNumberId = phoneResult.rows[0]?.whatsapp_number_id || null;

      // Insert or update campaign_logs entry
      // Use ON CONFLICT to handle potential duplicate messageId entries
      const insertQuery = `
        INSERT INTO campaign_logs (
          user_id, 
          campaign_name, 
          template_used,
          phone_number_id,
          recipient_number, 
          message_id, 
          status, 
          total_recipients, 
          successful_sends, 
          failed_sends,
          sent_at,
          campaign_data,
          created_at, 
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'sent', 1, 1, 0, CURRENT_TIMESTAMP, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      
      const templateUsed = this.extractTemplateName(meta) || 'BULK_MESSAGE';
      const campaignData = {
        source: 'bulk',
        jobId: meta?.jobId,
        batchIndex: meta?.batchIndex,
        messageType: meta?.messageType || 'unknown',
        timestamp: new Date().toISOString()
      };
      
      const result = await pool.query(insertQuery, [
        userId,
        campaignName,
        templateUsed,
        phoneNumberId,
        cleanRecipient,
        messageId,
        campaignData
      ]);
      
      if (result.rows.length > 0) {
        logger.debug('[BULK-REPO] Campaign log entry created', {
          userId,
          messageId,
          recipient: cleanRecipient,
          recordId: result.rows[0].id,
          campaignName
        });
      } else {
        logger.debug('[BULK-REPO] Campaign log entry already exists (ignored)', {
          userId,
          messageId,
          recipient: cleanRecipient
        });
      }
      
    } catch (error) {
      // Don't throw - just log the error so bulk sending continues
      logger.error('[BULK-REPO] Failed to upsert campaign log', {
        userId,
        messageId,
        to,
        campaignId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private extractTemplateName(meta: any): string | null {
    if (!meta) return null;
    
    // Try to extract template name from meta
    if (meta.templateName) return meta.templateName;
    if (meta.template?.name) return meta.template.name;
    
    return null;
  }
}

// Export instances for use in bulk queue
export const userBusinessRepo = new UserBusinessRepo();
export const bulkCampaignLogsRepo = new BulkCampaignLogsRepo();