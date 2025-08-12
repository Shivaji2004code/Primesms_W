"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsAppMessage = sendWhatsAppMessage;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const template_helper_1 = require("../utils/template-helper");
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function processTemplateComponents(components, variables) {
    if (!components || components.length === 0) {
        return (0, template_helper_1.buildTemplatePayload)('', '', [], variables);
    }
    return components.map(component => {
        if (component.parameters) {
            const processedParameters = component.parameters.map((param) => {
                if (param.type === 'text' && param.text && variables) {
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
async function sendWhatsAppMessage(opts) {
    const { version = process.env.GRAPH_API_VERSION || 'v22.0', accessToken, phoneNumberId, to, message, variables = {}, maxRetries = parseInt(process.env.BULK_MAX_RETRIES || '3', 10), retryBaseMs = parseInt(process.env.BULK_RETRY_BASE_MS || '500', 10), } = opts;
    const isTestToken = !accessToken ||
        accessToken.startsWith('test_') ||
        accessToken === 'test' ||
        accessToken === 'mock_token';
    const isTestMode = process.env.NODE_ENV === 'test' || isTestToken;
    if (isTestMode) {
        logger_1.logger.info('🧪 [BULK] Test mode: Mock sending message', {
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
            const response = await axios_1.default.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });
            if (response.status === 200 && response.data.messages && response.data.messages[0]) {
                const wamid = response.data.messages[0].id || null;
                return { ok: true, to, messageId: wamid };
            }
            else {
                throw new Error('Unexpected response format from Meta API');
            }
        }
        catch (error) {
            attempt++;
            const status = error?.response?.status;
            const retryAfter = parseInt(error?.response?.headers?.['retry-after'] || '0', 10) * 1000;
            const retriable = !status || status >= 500 || status === 429;
            if (!retriable || attempt > maxRetries) {
                logger_1.logger.error('[BULK] WhatsApp API error (final)', {
                    to,
                    attempt,
                    status,
                    error: error?.response?.data || String(error)
                });
                return { ok: false, to, error: error?.response?.data || String(error) };
            }
            const backoff = retryAfter || Math.min(8000, retryBaseMs * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 250);
            logger_1.logger.warn('[BULK] WhatsApp API error, retrying', {
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
    return { ok: false, to, error: 'Exhausted retries' };
}
//# sourceMappingURL=waSender.js.map