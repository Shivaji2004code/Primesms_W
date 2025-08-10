import NodeCache from 'node-cache';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import pool from '../db';

// In-memory cache with 5 minute TTL for duplicate detection
const duplicateCache = new NodeCache({ stdTTL: 300 }); // 5 minutes = 300 seconds

interface MessagePayload {
  template_name: string;
  phone: string;
  variables?: any;
  recipient_number?: string; // Alternative field name
}

/**
 * Generate a unique hash for a message based on template, phone, and variables
 */
function generateMessageHash(templateName: string, phone: string, variables: any): string {
  // Normalize phone number to E.164 format
  const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  
  // Create a deterministic string from variables
  const variablesString = variables ? JSON.stringify(variables, Object.keys(variables).sort()) : '';
  
  // Generate SHA256 hash
  const hashInput = `${templateName}|${normalizedPhone}|${variablesString}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Log a duplicate message attempt with variables
 */
async function logDuplicateAttempt(
  userId: string, 
  templateName: string, 
  phone: string, 
  variables: any,
  messageHash: string,
  campaignId?: string
): Promise<void> {
  try {
    const variablesJson = variables ? JSON.stringify(variables) : null;
    
    if (campaignId) {
      // Update existing campaign with failed send and duplicate error message
      await pool.query(
        `UPDATE campaign_logs 
         SET failed_sends = failed_sends + 1, 
             total_recipients = total_recipients + 1,
             status = 'failed',
             error_message = 'duplicate msg',
             sent_at = COALESCE(sent_at, CURRENT_TIMESTAMP),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [campaignId]
      );
    } else {
      // Create new campaign log for standalone duplicate
      const campaignResult = await pool.query(
        `INSERT INTO campaign_logs (user_id, campaign_name, template_used, total_recipients, successful_sends, failed_sends, status, error_message, sent_at, created_at, updated_at) 
         VALUES ($1, $2, $3, 1, 0, 1, 'failed', 'duplicate msg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`,
        [userId, `Duplicate Block: ${templateName}`, templateName]
      );
      
      const newCampaignId = campaignResult.rows[0].id;
      
      // Store duplicate info directly in campaign_logs (no more message_logs table)
      await pool.query(
        `UPDATE campaign_logs SET 
           recipient_number = $1, 
           message_id = $2,
           campaign_data = jsonb_build_object(
             'duplicate', true, 
             'hash', $3, 
             'variables', $4::jsonb,
             'blocked_at', CURRENT_TIMESTAMP
           ),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [phone, `duplicate_${messageHash.substring(0, 8)}`, messageHash, variablesJson || '{}', newCampaignId]
      );
    }

    console.log(`[DUPLICATE DETECTION] Blocked duplicate message for user ${userId}, template ${templateName}, phone ${phone}, variables: ${variablesJson}, hash: ${messageHash}`);
  } catch (error) {
    console.error('[DUPLICATE DETECTION] Error logging duplicate attempt:', error);
  }
}

/**
 * Middleware to detect and block duplicate messages
 */
export const duplicateDetectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract message details from request body
    const payload: MessagePayload = req.body;
    
    // Get template name from various possible fields
    const templateName = payload.template_name || req.body.template_name || req.body.templateName;
    
    // Get phone number from various possible fields
    const phone = payload.phone || payload.recipient_number || req.body.recipient_number;
    
    // Get variables from various possible fields
    const variables = payload.variables || req.body.variables || {};
    
    // Skip duplicate detection if essential fields are missing
    if (!templateName || !phone) {
      return next();
    }

    // Generate message hash
    const messageHash = generateMessageHash(templateName, phone, variables);
    
    // Check if this exact message was sent recently
    const cacheKey = `msg_${messageHash}`;
    const isDuplicate = duplicateCache.get(cacheKey);
    
    if (isDuplicate) {
      console.log(`[DUPLICATE DETECTION] Duplicate message detected: ${cacheKey}`);
      
      // Log the duplicate attempt
      if (req.session?.user?.id) {
        logDuplicateAttempt(req.session.user.id, templateName, phone, variables, messageHash);
      }
      
      // Still deduct credits but don't send message
      req.body._isDuplicate = true;
      req.body._duplicateHash = messageHash;
      
      // Set response for duplicate
      res.locals.duplicateResponse = {
        success: false,
        duplicate: true,
        message: 'Duplicate message blocked - same template and variables sent to this number within 5 minutes',
        template: templateName,
        phone: phone,
        hash: messageHash
      };
    } else {
      // Store in cache to prevent duplicates for 5 minutes
      duplicateCache.set(cacheKey, {
        timestamp: Date.now(),
        templateName,
        phone,
        userId: req.session?.user?.id || 'unknown'
      });
      
      console.log(`[DUPLICATE DETECTION] Message cached for duplicate detection: ${cacheKey}`);
    }
    
    next();
  } catch (error) {
    console.error('[DUPLICATE DETECTION] Error in duplicate detection middleware:', error);
    // Continue with normal flow if duplicate detection fails
    next();
  }
};

/**
 * Helper function to check if request is marked as duplicate
 */
export const isDuplicateRequest = (req: Request): boolean => {
  return req.body._isDuplicate === true;
};

/**
 * Helper function to get duplicate response
 */
export const getDuplicateResponse = (res: Response): any => {
  return res.locals.duplicateResponse;
};

/**
 * Check if a specific message is a duplicate and handle it
 * This is the main function to use in message sending loops
 */
export const checkAndHandleDuplicate = async (
  userId: string,
  templateName: string,
  phone: string,
  variables: any,
  campaignId?: string
): Promise<{ isDuplicate: boolean; hash: string }> => {
  try {
    const messageHash = generateMessageHash(templateName, phone, variables);
    const cacheKey = `msg_${messageHash}`;
    const isDuplicate = duplicateCache.get(cacheKey);
    
    if (isDuplicate) {
      console.log(`[DUPLICATE DETECTION] Duplicate message detected: Template="${templateName}", Phone="${phone}", Variables=${JSON.stringify(variables)}, Hash="${messageHash}"`);
      
      // Log the duplicate attempt with full details
      await logDuplicateAttempt(userId, templateName, phone, variables, messageHash, campaignId);
      
      return { isDuplicate: true, hash: messageHash };
    } else {
      // Store in cache to prevent duplicates for 5 minutes
      duplicateCache.set(cacheKey, {
        timestamp: Date.now(),
        templateName,
        phone,
        variables,
        userId
      });
      
      console.log(`[DUPLICATE DETECTION] Message cached: Template="${templateName}", Phone="${phone}", Variables=${JSON.stringify(variables)}, Hash="${messageHash}"`);
      return { isDuplicate: false, hash: messageHash };
    }
  } catch (error) {
    console.error('[DUPLICATE DETECTION] Error in duplicate check:', error);
    return { isDuplicate: false, hash: '' };
  }
};

/**
 * Get cache statistics for monitoring
 */
export const getDuplicateCacheStats = () => {
  const keys = duplicateCache.keys();
  const stats = duplicateCache.getStats();
  
  return {
    totalCachedMessages: keys.length,
    cacheHits: stats.hits,
    cacheMisses: stats.misses,
    cacheKeys: keys.slice(0, 10) // Show first 10 keys for debugging
  };
};