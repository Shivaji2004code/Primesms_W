// WhatsApp Sender Service for Bulk Messages
// Handles individual message sending with retry logic and rate limiting
import axios from 'axios';
import { logger } from '../utils/logger';
import { buildTemplatePayload } from '../utils/template-helper';

export interface SendResult {
  ok: boolean;
  to: string;
  messageId?: string | null;
  error?: any;
}

export interface WhatsAppMessage {
  kind: 'text';
  text: { body: string; preview_url?: boolean };
}

export interface WhatsAppTemplate {
  kind: 'template';
  template: {
    name: string;
    language_code: string;
    components?: Array<{
      type: 'header' | 'body' | 'button';
      sub_type?: 'url' | 'quick_reply' | 'copy_code';
      index?: string;
      parameters?: Array<
        | { type: 'text'; text: string }
        | { type: 'currency'; currency: { fallback_value: string; code: string; amount_1000: number } }
        | { type: 'date_time'; date_time: { fallback_value: string } }
        | { type: 'image'; image: { id: string } }
      >;
    }>;
  };
}

export interface BulkMessageVariables {
  [key: string]: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function processTemplateComponents(components: any[], variables: BulkMessageVariables): any[] {
  if (!components || components.length === 0) {
    // If no pre-built components, use buildTemplatePayload to create them
    return buildTemplatePayload('', '', [], variables);
  }
  
  return components.map(component => {
    if (component.parameters) {
      // Replace parameters with dynamic values from variables
      const processedParameters = component.parameters.map((param: any) => {
        if (param.type === 'text' && param.text && variables) {
          // Check if the text is a variable key (like "1", "2", etc.)
          const variableKey = param.text;
          if (variables[variableKey]) {
            return { ...param, text: variables[variableKey] };
          }
        }
        return param;
      });
      
      return { ...component, parameters: processedParameters };
    }
    
    return component;
  });
}

export async function sendWhatsAppMessage(opts: {
  version?: string;
  accessToken: string;
  phoneNumberId: string;
  to: string;
  message: WhatsAppMessage | WhatsAppTemplate;
  variables?: BulkMessageVariables;
  maxRetries?: number;
  retryBaseMs?: number;
}): Promise<SendResult> {
  const {
    version = process.env.GRAPH_API_VERSION || 'v22.0',
    accessToken,
    phoneNumberId,
    to,
    message,
    variables = {},
    maxRetries = parseInt(process.env.BULK_MAX_RETRIES || '3', 10),
    retryBaseMs = parseInt(process.env.BULK_RETRY_BASE_MS || '500', 10),
  } = opts;

  // Check for test mode
  const isTestToken = !accessToken || 
                     accessToken.startsWith('test_') ||
                     accessToken === 'test' ||
                     accessToken === 'mock_token';
  
  const isTestMode = process.env.NODE_ENV === 'test' || isTestToken;
  
  if (isTestMode) {
    logger.info('🧪 [BULK] Test mode: Mock sending message', {
      to,
      messageType: message.kind,
      reason: isTestToken ? 'Invalid/Test Access Token' : 'NODE_ENV=test'
    });
    
    return {
      ok: true,
      to,
      messageId: `test_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

  const payload = message.kind === 'text'
    ? {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: Boolean(message.text.preview_url),
          body: message.text.body
        }
      }
    : {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: message.template.name,
          language: { code: message.template.language_code },
          components: processTemplateComponents(message.template.components || [], variables)
        }
      };

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      });

      if (response.status === 200 && response.data.messages && response.data.messages[0]) {
        const wamid = response.data.messages[0].id || null;
        return { ok: true, to, messageId: wamid };
      } else {
        throw new Error('Unexpected response format from Meta API');
      }

    } catch (error: any) {
      attempt++;
      const status = error?.response?.status;
      const retryAfter = parseInt(error?.response?.headers?.['retry-after'] || '0', 10) * 1000;
      
      // Determine if error is retriable
      const retriable = !status || status >= 500 || status === 429;
      
      if (!retriable || attempt > maxRetries) {
        logger.error('[BULK] WhatsApp API error (final)', {
          to,
          attempt,
          status,
          error: error?.response?.data || String(error)
        });
        return { ok: false, to, error: error?.response?.data || String(error) };
      }

      // Calculate backoff with jitter
      const backoff = retryAfter || Math.min(8000, retryBaseMs * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 250);
      
      logger.warn('[BULK] WhatsApp API error, retrying', {
        to,
        attempt,
        status,
        retryAfter: retryAfter || 'none',
        backoffMs: backoff,
        error: error?.response?.data?.error?.message || error?.message
      });

      await sleep(backoff);
    }
  }

  // This should never be reached, but just in case
  return { ok: false, to, error: 'Exhausted retries' };
}