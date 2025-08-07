"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDuplicateCacheStats = exports.checkAndHandleDuplicate = exports.getDuplicateResponse = exports.isDuplicateRequest = exports.duplicateDetectionMiddleware = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const crypto_1 = __importDefault(require("crypto"));
const index_1 = require("../index");
// In-memory cache with 5 minute TTL for duplicate detection
const duplicateCache = new node_cache_1.default({ stdTTL: 300 }); // 5 minutes = 300 seconds
/**
 * Generate a unique hash for a message based on template, phone, and variables
 */
function generateMessageHash(templateName, phone, variables) {
    // Normalize phone number to E.164 format
    const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    // Create a deterministic string from variables
    const variablesString = variables ? JSON.stringify(variables, Object.keys(variables).sort()) : '';
    // Generate SHA256 hash
    const hashInput = `${templateName}|${normalizedPhone}|${variablesString}`;
    return crypto_1.default.createHash('sha256').update(hashInput).digest('hex');
}
/**
 * Log a duplicate message attempt with variables
 */
async function logDuplicateAttempt(userId, templateName, phone, variables, messageHash, campaignId) {
    try {
        const variablesJson = variables ? JSON.stringify(variables) : null;
        if (campaignId) {
            // Update existing campaign with failed send
            await index_1.pool.query(`UPDATE campaign_logs 
         SET failed_sends = failed_sends + 1, 
             total_recipients = total_recipients + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [campaignId]);
            // Log the individual duplicate message
            await index_1.pool.query(`INSERT INTO message_logs (campaign_id, recipient_number, message_id, status, error_message, variables_used, sent_at) 
         VALUES ($1, $2, $3, 'duplicate', $4, $5, CURRENT_TIMESTAMP)`, [campaignId, phone, `duplicate_${messageHash.substring(0, 8)}`, `Duplicate message blocked - hash: ${messageHash}`, variablesJson]);
        }
        else {
            // Create new campaign log for standalone duplicate
            const campaignResult = await index_1.pool.query(`INSERT INTO campaign_logs (user_id, campaign_name, template_used, total_recipients, successful_sends, failed_sends, status, error_message) 
         VALUES ($1, $2, $3, 1, 0, 1, 'failed', $4) RETURNING id`, [userId, `Duplicate Block: ${templateName}`, templateName, `Duplicate blocked - Variables: ${variablesJson || 'none'}`]);
            const newCampaignId = campaignResult.rows[0].id;
            // Log the individual duplicate message
            await index_1.pool.query(`INSERT INTO message_logs (campaign_id, recipient_number, message_id, status, error_message, variables_used, sent_at) 
         VALUES ($1, $2, $3, 'duplicate', $4, $5, CURRENT_TIMESTAMP)`, [newCampaignId, phone, `duplicate_${messageHash.substring(0, 8)}`, `Duplicate message blocked - hash: ${messageHash}`, variablesJson]);
        }
        console.log(`[DUPLICATE DETECTION] Blocked duplicate message for user ${userId}, template ${templateName}, phone ${phone}, variables: ${variablesJson}, hash: ${messageHash}`);
    }
    catch (error) {
        console.error('[DUPLICATE DETECTION] Error logging duplicate attempt:', error);
    }
}
/**
 * Middleware to detect and block duplicate messages
 */
const duplicateDetectionMiddleware = (req, res, next) => {
    try {
        // Extract message details from request body
        const payload = req.body;
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
        }
        else {
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
    }
    catch (error) {
        console.error('[DUPLICATE DETECTION] Error in duplicate detection middleware:', error);
        // Continue with normal flow if duplicate detection fails
        next();
    }
};
exports.duplicateDetectionMiddleware = duplicateDetectionMiddleware;
/**
 * Helper function to check if request is marked as duplicate
 */
const isDuplicateRequest = (req) => {
    return req.body._isDuplicate === true;
};
exports.isDuplicateRequest = isDuplicateRequest;
/**
 * Helper function to get duplicate response
 */
const getDuplicateResponse = (res) => {
    return res.locals.duplicateResponse;
};
exports.getDuplicateResponse = getDuplicateResponse;
/**
 * Check if a specific message is a duplicate and handle it
 * This is the main function to use in message sending loops
 */
const checkAndHandleDuplicate = async (userId, templateName, phone, variables, campaignId) => {
    try {
        const messageHash = generateMessageHash(templateName, phone, variables);
        const cacheKey = `msg_${messageHash}`;
        const isDuplicate = duplicateCache.get(cacheKey);
        if (isDuplicate) {
            console.log(`[DUPLICATE DETECTION] Duplicate message detected: Template="${templateName}", Phone="${phone}", Variables=${JSON.stringify(variables)}, Hash="${messageHash}"`);
            // Log the duplicate attempt with full details
            await logDuplicateAttempt(userId, templateName, phone, variables, messageHash, campaignId);
            return { isDuplicate: true, hash: messageHash };
        }
        else {
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
    }
    catch (error) {
        console.error('[DUPLICATE DETECTION] Error in duplicate check:', error);
        return { isDuplicate: false, hash: '' };
    }
};
exports.checkAndHandleDuplicate = checkAndHandleDuplicate;
/**
 * Get cache statistics for monitoring
 */
const getDuplicateCacheStats = () => {
    const keys = duplicateCache.keys();
    const stats = duplicateCache.getStats();
    return {
        totalCachedMessages: keys.length,
        cacheHits: stats.hits,
        cacheMisses: stats.misses,
        cacheKeys: keys.slice(0, 10) // Show first 10 keys for debugging
    };
};
exports.getDuplicateCacheStats = getDuplicateCacheStats;
//# sourceMappingURL=duplicateDetection.js.map