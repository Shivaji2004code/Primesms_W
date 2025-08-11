// [Claude AI] n8n Webhook Forwarder Service — Aug 2025
import crypto from 'crypto';
import axios from 'axios';

// ====== INTERFACES ======
export interface ForwardContext {
  userId: string;
  wabaId?: string | null;
  phoneNumberId: string;
  webhookUrl: string;            // from user_business_info.webhook_url
  webhookVerifyToken?: string;   // from user_business_info.webhook_verify_token
}

export type N8NInboundEvent = { kind: 'message_in'; payload: any };

// ====== CONFIGURATION ======
const N8N_TIMEOUT_MS = parseInt(process.env.N8N_TIMEOUT_MS || '5000', 10);
const N8N_MAX_RETRIES = parseInt(process.env.N8N_MAX_RETRIES || '3', 10);

// ====== UTILITY FUNCTIONS ======
function hmacSha256Hex(secret: string, body: string): string {
  return crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

// ====== MAIN FORWARDER FUNCTION ======
export async function forwardInboundToN8N(ctx: ForwardContext, event: N8NInboundEvent): Promise<void> {
  try {
    console.log(`📤 [N8N_FORWARDER] Preparing to forward inbound message to n8n for user ${ctx.userId}`);
    
    // Build the n8n payload
    const bodyObj = {
      source: 'whatsapp',
      event: 'message_in',
      tenant: { 
        userId: ctx.userId, 
        wabaId: ctx.wabaId || null, 
        phoneNumberId: ctx.phoneNumberId 
      },
      ...event.payload,
      receivedAt: new Date().toISOString()
    };
    
    const body = JSON.stringify(bodyObj);
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Prime-UserId': ctx.userId,
      'X-Prime-PhoneNumberId': ctx.phoneNumberId,
      'X-Prime-Event': 'message_in',
      'User-Agent': 'PrimeSMS-n8n-Forwarder/1.0'
    };
    
    // Add HMAC signature if webhook verify token is available
    if (ctx.webhookVerifyToken) {
      const signature = hmacSha256Hex(ctx.webhookVerifyToken, body);
      headers['X-PrimeSig'] = `sha256=${signature}`;
      console.log(`🔐 [N8N_FORWARDER] Added HMAC signature for user ${ctx.userId}`);
    } else {
      console.log(`⚠️  [N8N_FORWARDER] No webhook verify token configured for user ${ctx.userId}, skipping signature`);
    }

    console.log(`📋 [N8N_FORWARDER] Payload preview for user ${ctx.userId}:`, {
      source: bodyObj.source,
      event: bodyObj.event,
      tenant: bodyObj.tenant,
      messageType: bodyObj.message?.type || 'unknown',
      from: bodyObj.message?.from || 'unknown',
      textPreview: bodyObj.message?.text ? bodyObj.message.text.substring(0, 50) + '...' : 'no text',
      receivedAt: bodyObj.receivedAt
    });

    // Attempt to forward with retries
    await forwardWithRetry(ctx.webhookUrl, body, headers, ctx.userId);
    
    console.log(`✅ [N8N_FORWARDER] Successfully forwarded inbound message to n8n for user ${ctx.userId}`);
    
  } catch (error) {
    console.error(`❌ [N8N_FORWARDER] Critical error forwarding inbound message for user ${ctx.userId}:`, {
      error: error instanceof Error ? error.message : String(error),
      webhookUrl: ctx.webhookUrl,
      phoneNumberId: ctx.phoneNumberId
    });
    // Don't throw - we don't want to break the webhook processing
  }
}

// ====== RETRY LOGIC ======
async function forwardWithRetry(
  webhookUrl: string, 
  body: string, 
  headers: Record<string, string>, 
  userId: string
): Promise<void> {
  let attempt = 0;
  let delay = 500; // Start with 500ms delay

  while (attempt < N8N_MAX_RETRIES) {
    try {
      attempt++;
      console.log(`🔄 [N8N_FORWARDER] Attempt ${attempt}/${N8N_MAX_RETRIES} to forward to n8n for user ${userId}`);
      
      const response = await axios.post(webhookUrl, body, { 
        headers, 
        timeout: N8N_TIMEOUT_MS,
        // Don't follow redirects to avoid potential issues
        maxRedirects: 0
      });
      
      console.log(`✅ [N8N_FORWARDER] n8n responded with status ${response.status} for user ${userId}`);
      
      // Log response data if it exists (but limit size)
      if (response.data) {
        const responsePreview = typeof response.data === 'string' 
          ? response.data.substring(0, 200)
          : JSON.stringify(response.data).substring(0, 200);
        console.log(`📥 [N8N_FORWARDER] n8n response preview: ${responsePreview}${responsePreview.length >= 200 ? '...' : ''}`);
      }
      
      return; // Success - exit the retry loop
      
    } catch (err: any) {
      const status = err?.response?.status;
      const isNetworkError = !status;
      const isServerError = status && status >= 500 && status <= 599;
      const isTimeout = err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT';
      
      // Determine if this error is retriable
      const retriable = isNetworkError || isServerError || isTimeout;
      
      console.log(`⚠️  [N8N_FORWARDER] Attempt ${attempt} failed for user ${userId}:`, {
        status,
        error: err?.response?.data ? 
          (typeof err.response.data === 'string' ? err.response.data.substring(0, 200) : JSON.stringify(err.response.data).substring(0, 200)) :
          err?.message || String(err),
        retriable,
        isNetworkError,
        isServerError,
        isTimeout
      });
      
      // If not retriable or we've exhausted retries, give up
      if (!retriable || attempt >= N8N_MAX_RETRIES) {
        console.error(`❌ [N8N_FORWARDER] Failed to forward to n8n for user ${userId} after ${attempt} attempts:`, {
          finalStatus: status,
          finalError: err?.response?.data || err?.message || String(err),
          webhookUrl: webhookUrl.substring(0, 50) + '...' // Hide full URL in logs for security
        });
        return; // Don't throw - we handle this gracefully
      }
      
      // Wait before retrying with exponential backoff
      if (attempt < N8N_MAX_RETRIES) {
        console.log(`⏳ [N8N_FORWARDER] Waiting ${delay}ms before retry ${attempt + 1} for user ${userId}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, 5000); // Cap at 5 seconds
      }
    }
  }
}

// ====== VALIDATION HELPERS ======
export function validateForwardContext(ctx: ForwardContext): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!ctx.userId || typeof ctx.userId !== 'string' || ctx.userId.trim() === '') {
    errors.push('userId is required and must be a non-empty string');
  }
  
  if (!ctx.phoneNumberId || typeof ctx.phoneNumberId !== 'string' || ctx.phoneNumberId.trim() === '') {
    errors.push('phoneNumberId is required and must be a non-empty string');
  }
  
  if (!ctx.webhookUrl || typeof ctx.webhookUrl !== 'string' || ctx.webhookUrl.trim() === '') {
    errors.push('webhookUrl is required and must be a non-empty string');
  }
  
  // Validate webhook URL format
  if (ctx.webhookUrl) {
    try {
      const url = new URL(ctx.webhookUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('webhookUrl must use http or https protocol');
      }
    } catch (e) {
      errors.push('webhookUrl must be a valid URL');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ====== TESTING HELPERS (for development) ======
export function createTestForwardContext(
  userId: string = 'test_user',
  webhookUrl: string = 'https://n8n.example.com/webhook/test',
  phoneNumberId: string = 'test_phone_123'
): ForwardContext {
  return {
    userId,
    phoneNumberId,
    webhookUrl,
    webhookVerifyToken: 'test_secret',
    wabaId: 'test_waba_123'
  };
}

export function createTestInboundEvent(
  from: string = '15550001111',
  text: string = 'Hello from test'
): N8NInboundEvent {
  return {
    kind: 'message_in',
    payload: {
      message: {
        wamid: `wamid.test.${Date.now()}`,
        from,
        to: '15551234567',
        type: 'text',
        text,
        interactive: null
      },
      raw: {
        messaging_product: 'whatsapp',
        metadata: {
          display_phone_number: '15551234567',
          phone_number_id: 'test_phone_123'
        },
        contacts: [{ profile: { name: 'Test User' }, wa_id: from }],
        messages: [{
          from,
          id: `wamid.test.${Date.now()}`,
          timestamp: Math.floor(Date.now() / 1000).toString(),
          type: 'text',
          text: { body: text }
        }]
      }
    }
  };
}