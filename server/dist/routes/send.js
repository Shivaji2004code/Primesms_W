"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const axios_1 = __importDefault(require("axios"));
const index_1 = require("../index");
const sendApiHelpers_1 = require("../utils/sendApiHelpers");
const router = express_1.default.Router();
// Rate limiting middleware - 100 requests per 15 minutes per IP
const sendRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply rate limiting to all routes in this router
router.use(sendRateLimit);
/**
 * Client-facing WhatsApp Template Message API
 * Supports both GET and POST requests
 *
 * Required parameters:
 * - username: Client username for authentication
 * - templatename: Name of the template to use
 * - recipient_number: WhatsApp number to send to
 *
 * Optional parameters:
 * - header_text: Text content for TEXT headers (auto-detected from template)
 * - var1, var2, var3, etc.: Template body variables
 * - button_payload: Payload for quick reply buttons (only when template has quick reply buttons)
 * - button_text: Dynamic text for URL buttons (when template has dynamic URL buttons)
 * - button_url: Dynamic URL for URL buttons (when template has dynamic URL buttons)
 */
/**
 * Template Analysis Endpoint
 * Analyzes a template and returns what parameters are needed for the send API
 */
router.get('/template-info/:username/:templatename', async (req, res) => {
    try {
        const { username, templatename } = req.params;
        // Authenticate user and fetch credentials
        const authResult = await authenticateAndFetchCredentials(username);
        if (!authResult.success) {
            return res.status(authResult.statusCode || 500).json({
                error: authResult.error,
                message: authResult.message
            });
        }
        const { userId } = authResult.data;
        // Fetch template
        const templateResult = await fetchTemplate(userId, templatename);
        if (!templateResult.success) {
            return res.status(templateResult.statusCode || 500).json({
                error: templateResult.error,
                message: templateResult.message
            });
        }
        const template = templateResult.data;
        const analysis = analyzeTemplate(template);
        res.json({
            success: true,
            template: {
                name: template.name,
                language: template.language,
                status: template.status
            },
            requirements: analysis
        });
    }
    catch (error) {
        console.error('Template analysis error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to analyze template'
        });
    }
});
router.all('/send', async (req, res) => {
    try {
        // Extract parameters from both GET and POST requests
        const params = extractParameters(req);
        // Validate required parameters
        const validation = validateRequiredParams(params);
        if (!validation.isValid) {
            return res.status(400).json({
                error: 'Bad Request',
                message: validation.message,
                details: validation.details
            });
        }
        // Step 1: Authenticate user and fetch credentials
        const authResult = await authenticateAndFetchCredentials(params.username);
        if (!authResult.success) {
            return res.status(authResult.statusCode || 500).json({
                error: authResult.error,
                message: authResult.message
            });
        }
        const { userId, businessInfo } = authResult.data;
        // Step 2: Fetch message template
        const templateResult = await fetchTemplate(userId, params.templatename);
        if (!templateResult.success) {
            return res.status(templateResult.statusCode || 500).json({
                error: templateResult.error,
                message: templateResult.message
            });
        }
        const template = templateResult.data;
        // Step 3: Validate recipient number
        if (!(0, sendApiHelpers_1.validatePhoneNumber)(params.recipient_number)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid recipient phone number format',
                details: 'Phone number must be in Meta WhatsApp API format (country code + number, no + prefix, e.g., 919398424270 for India, 14155552345 for US)'
            });
        }
        // Step 4: Construct Meta API payload
        const payload = constructMetaAPIPayload(params, template, businessInfo);
        // Step 5: Send message via Meta WhatsApp Cloud API
        const sendResult = await sendWhatsAppMessage(payload, businessInfo);
        if (!sendResult.success) {
            return res.status(sendResult.statusCode || 500).json({
                error: sendResult.error,
                message: sendResult.message
            });
        }
        // Step 6: Log successful send and return response
        await logMessageSend(userId, template.id, params.recipient_number, sendResult.data.message_id, template.name);
        return res.status(200).json({
            success: true,
            message: 'Message sent successfully',
            message_id: sendResult.data.message_id,
            recipient: params.recipient_number,
            template: params.templatename
        });
    }
    catch (error) {
        console.error('Send API Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while processing your request'
        });
    }
});
/**
 * Extract parameters from both GET (query) and POST (body) requests
 */
function extractParameters(req) {
    const isPost = req.method === 'POST';
    const source = isPost ? req.body : req.query;
    // Extract all parameters
    const params = {
        username: (0, sendApiHelpers_1.sanitizeInput)(source.username),
        templatename: (0, sendApiHelpers_1.sanitizeInput)(source.templatename),
        recipient_number: (0, sendApiHelpers_1.sanitizeInput)(source.recipient_number),
        header_text: source.header_text ? (0, sendApiHelpers_1.sanitizeInput)(source.header_text) : undefined,
        button_payload: source.button_payload ? (0, sendApiHelpers_1.sanitizeInput)(source.button_payload) : undefined,
        button_text: source.button_text ? (0, sendApiHelpers_1.sanitizeInput)(source.button_text) : undefined,
        button_url: source.button_url ? (0, sendApiHelpers_1.sanitizeInput)(source.button_url) : undefined
    };
    // Extract all variable parameters (var1, var2, var3, etc.)
    const variables = (0, sendApiHelpers_1.extractVariables)(source);
    Object.assign(params, variables);
    return params;
}
/**
 * Validate required parameters
 */
function validateRequiredParams(params) {
    const required = ['username', 'templatename', 'recipient_number'];
    const missing = [];
    for (const param of required) {
        if (!params[param] || typeof params[param] !== 'string' || params[param].trim() === '') {
            missing.push(param);
        }
    }
    if (missing.length > 0) {
        return {
            isValid: false,
            message: 'Missing required parameters',
            details: missing.map(param => `${param} is required`)
        };
    }
    return { isValid: true };
}
/**
 * Authenticate user and fetch business credentials
 */
async function authenticateAndFetchCredentials(username) {
    try {
        const query = `
      SELECT 
        u.id as user_id,
        u.username,
        ubi.whatsapp_number_id,
        ubi.access_token,
        ubi.is_active,
        ubi.business_name
      FROM users u
      INNER JOIN user_business_info ubi ON u.id = ubi.user_id
      WHERE u.username = $1 AND ubi.is_active = true
    `;
        const result = await index_1.pool.query(query, [username]);
        if (result.rows.length === 0) {
            return {
                success: false,
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Invalid username or inactive WhatsApp Business account'
            };
        }
        const row = result.rows[0];
        // Validate required business info
        if (!row.whatsapp_number_id || !row.access_token) {
            return {
                success: false,
                statusCode: 401,
                error: 'Unauthorized',
                message: 'WhatsApp Business API not properly configured for this user'
            };
        }
        return {
            success: true,
            data: {
                userId: row.user_id,
                businessInfo: {
                    whatsapp_number_id: row.whatsapp_number_id,
                    access_token: row.access_token,
                    business_name: row.business_name
                }
            }
        };
    }
    catch (error) {
        console.error('Authentication error:', error);
        return {
            success: false,
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Failed to authenticate user'
        };
    }
}
/**
 * Fetch template by name for specific user
 */
async function fetchTemplate(userId, templateName) {
    try {
        const query = `
      SELECT 
        id,
        name,
        language,
        components,
        status,
        template_id,
        header_media_id,
        header_type,
        media_id
      FROM templates 
      WHERE user_id = $1 AND name = $2 AND status IN ('APPROVED', 'ACTIVE')
    `;
        const result = await index_1.pool.query(query, [userId, templateName]);
        if (result.rows.length === 0) {
            return {
                success: false,
                statusCode: 404,
                error: 'Not Found',
                message: `Template '${templateName}' not found or not active`
            };
        }
        return {
            success: true,
            data: result.rows[0]
        };
    }
    catch (error) {
        console.error('Template fetch error:', error);
        return {
            success: false,
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Failed to fetch template'
        };
    }
}
/**
 * Construct Meta WhatsApp Cloud API payload with intelligent template detection
 */
function constructMetaAPIPayload(params, template, businessInfo) {
    const payload = {
        messaging_product: "whatsapp",
        to: params.recipient_number,
        type: "template",
        template: {
            name: template.name,
            language: {
                code: template.language || 'en_US'
            },
            components: []
        }
    };
    const components = [];
    const templateComponents = template.components || [];
    // 1. Auto-detect and Handle Headers
    const headerComponent = templateComponents.find((c) => c.type === 'HEADER');
    if (headerComponent) {
        if (headerComponent.format === 'TEXT' && params.header_text) {
            // TEXT header with dynamic content
            components.push({
                type: "header",
                parameters: [{
                        type: "text",
                        text: params.header_text
                    }]
            });
        }
        else if (headerComponent.format === 'IMAGE') {
            // Static IMAGE header - use stored media_id from template
            const mediaId = template.media_id || template.header_media_id;
            if (mediaId) {
                // For IMAGE templates, we need to include the media_id in the header component
                components.push({
                    type: "header",
                    parameters: [{
                            type: "image",
                            image: {
                                id: mediaId
                            }
                        }]
                });
            }
        }
        else if (headerComponent.format === 'VIDEO' && headerComponent.example?.header_handle) {
            // Static VIDEO header - no parameters needed
        }
        else if (headerComponent.format === 'DOCUMENT' && headerComponent.example?.header_handle) {
            // Static DOCUMENT header - no parameters needed
        }
        // Note: Dynamic media headers would require media_id parameter, but most templates use static media
    }
    // 2. Handle Body Variables
    const bodyComponent = templateComponents.find((c) => c.type === 'BODY');
    if (bodyComponent) {
        // Extract all 'varX' parameters from the request and sort them numerically
        const vars = Object.keys(params)
            .filter(k => k.startsWith('var'))
            .sort((a, b) => {
            const numA = parseInt(a.slice(3)) || 0;
            const numB = parseInt(b.slice(3)) || 0;
            return numA - numB;
        })
            .map(k => params[k])
            .filter(v => v !== undefined && v !== null && v.toString().trim() !== '');
        if (vars.length > 0) {
            components.push({
                type: "body",
                parameters: vars.map(v => ({ type: "text", text: v.toString() }))
            });
        }
    }
    // 3. Intelligent Button Handling
    const buttonComponent = templateComponents.find((c) => c.type === 'BUTTONS');
    if (buttonComponent && buttonComponent.buttons) {
        const buttons = buttonComponent.buttons;
        // Handle different button types
        buttons.forEach((button, index) => {
            if (button.type === 'QUICK_REPLY' && params.button_payload) {
                // Quick reply button - needs payload from user
                components.push({
                    type: "button",
                    sub_type: "quick_reply",
                    index: index.toString(),
                    parameters: [{
                            type: "payload",
                            payload: params.button_payload
                        }]
                });
            }
            else if (button.type === 'URL') {
                // URL button handling
                if (button.url && button.url.includes('{{1}}') && params.button_url) {
                    // Dynamic URL button - user provides the URL parameter
                    components.push({
                        type: "button",
                        sub_type: "url",
                        index: index.toString(),
                        parameters: [{
                                type: "text",
                                text: params.button_url
                            }]
                    });
                }
                // Static URL buttons don't need parameters - Meta uses the URL from template
            }
            else if (button.type === 'PHONE_NUMBER') {
                // Phone number buttons don't typically need dynamic parameters
                // The phone number is usually static in the template
            }
        });
    }
    payload.template.components = components;
    return payload;
}
/**
 * Send message via Meta WhatsApp Cloud API
 */
async function sendWhatsAppMessage(payload, businessInfo) {
    try {
        // Check if we're in test mode or have invalid credentials
        const isTestToken = !businessInfo.access_token ||
            businessInfo.access_token.startsWith('test_') ||
            businessInfo.access_token === 'test' ||
            businessInfo.access_token === 'mock_token';
        const isTestMode = process.env.NODE_ENV === 'test' || isTestToken;
        if (isTestMode) {
            // In test mode, return a mock success response
            console.log('🧪 TEST MODE: Mock sending message:', {
                to: payload.to,
                template: payload.template.name,
                components: payload.template.components,
                reason: isTestToken ? 'Invalid/Test Access Token' : 'NODE_ENV=test',
                access_token_preview: businessInfo.access_token ?
                    businessInfo.access_token.substring(0, 10) + '...' : 'undefined'
            });
            return {
                success: true,
                data: {
                    message_id: `test_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                }
            };
        }
        const url = `https://graph.facebook.com/v19.0/${businessInfo.whatsapp_number_id}/messages`;
        const response = await axios_1.default.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${businessInfo.access_token}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        });
        if (response.status === 200 && response.data.messages && response.data.messages[0]) {
            return {
                success: true,
                data: {
                    message_id: response.data.messages[0].id
                }
            };
        }
        else {
            throw new Error('Unexpected response format from Meta API');
        }
    }
    catch (error) {
        console.error('Meta API Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        // Handle specific Meta API errors
        if (error.response?.status === 400) {
            return {
                success: false,
                statusCode: 400,
                error: 'Bad Request',
                message: 'Invalid template parameters or recipient number'
            };
        }
        else if (error.response?.status === 401) {
            return {
                success: false,
                statusCode: 502,
                error: 'Bad Gateway',
                message: 'WhatsApp API authentication failed'
            };
        }
        else if (error.response?.status === 403) {
            return {
                success: false,
                statusCode: 502,
                error: 'Bad Gateway',
                message: 'WhatsApp API access forbidden'
            };
        }
        else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            return {
                success: false,
                statusCode: 504,
                error: 'Gateway Timeout',
                message: 'WhatsApp API request timed out'
            };
        }
        else {
            return {
                success: false,
                statusCode: 502,
                error: 'Bad Gateway',
                message: 'Failed to send message via WhatsApp API'
            };
        }
    }
}
/**
 * Log successful message send using existing campaign_logs and message_logs structure
 */
async function logMessageSend(userId, templateId, recipient, messageId, templateName) {
    try {
        // First, create or get a campaign log entry for this API send
        const campaignName = `API_SEND_${templateName}_${new Date().toISOString().split('T')[0]}`;
        let campaignId;
        // Check if campaign exists for today
        const existingCampaign = await index_1.pool.query(`
      SELECT id FROM campaign_logs 
      WHERE user_id = $1 AND campaign_name = $2 AND DATE(created_at) = CURRENT_DATE
    `, [userId, campaignName]);
        if (existingCampaign.rows.length > 0) {
            campaignId = existingCampaign.rows[0].id;
            // Update campaign stats
            await index_1.pool.query(`
        UPDATE campaign_logs 
        SET successful_sends = successful_sends + 1,
            total_recipients = total_recipients + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [campaignId]);
        }
        else {
            // Create new campaign log entry
            const campaignResult = await index_1.pool.query(`
        INSERT INTO campaign_logs (
          user_id, campaign_name, template_used, total_recipients, 
          successful_sends, failed_sends, status
        )
        VALUES ($1, $2, $3, 1, 1, 0, 'completed')
        RETURNING id
      `, [userId, campaignName, templateName]);
            campaignId = campaignResult.rows[0].id;
        }
        // Log the individual message
        await index_1.pool.query(`
      INSERT INTO message_logs (
        campaign_id, recipient_number, message_id, status, sent_at
      )
      VALUES ($1, $2, $3, 'sent', CURRENT_TIMESTAMP)
      ON CONFLICT (campaign_id, recipient_number) DO UPDATE SET
        message_id = EXCLUDED.message_id,
        status = EXCLUDED.status,
        sent_at = EXCLUDED.sent_at
    `, [campaignId, recipient, messageId]);
    }
    catch (error) {
        // Log error but don't fail the request
        console.error('Failed to log message send:', error);
    }
}
/**
 * Analyze template structure and return required parameters
 */
function analyzeTemplate(template) {
    const components = template.components || [];
    const analysis = {
        required_params: ['username', 'templatename', 'recipient_number'],
        optional_params: [],
        variable_count: 0,
        has_header: false,
        header_type: null,
        has_buttons: false,
        button_types: [],
        example_request: {
            method: 'POST',
            url: '/api/send',
            body: {
                username: 'your_username',
                templatename: template.name,
                recipient_number: '+1234567890'
            }
        }
    };
    // Analyze header
    const headerComponent = components.find((c) => c.type === 'HEADER');
    if (headerComponent) {
        analysis.has_header = true;
        analysis.header_type = headerComponent.format;
        if (headerComponent.format === 'TEXT') {
            analysis.optional_params.push({
                name: 'header_text',
                description: 'Text content for the header',
                required: false,
                example: 'Welcome Message'
            });
            analysis.example_request.body.header_text = 'Your header text here';
        }
    }
    // Analyze body variables
    const bodyComponent = components.find((c) => c.type === 'BODY');
    if (bodyComponent && bodyComponent.text) {
        const variableMatches = bodyComponent.text.match(/\{\{\d+\}\}/g);
        if (variableMatches) {
            analysis.variable_count = variableMatches.length;
            for (let i = 1; i <= analysis.variable_count; i++) {
                analysis.optional_params.push({
                    name: `var${i}`,
                    description: `Variable ${i} for template body`,
                    required: true,
                    example: `Value ${i}`
                });
                analysis.example_request.body[`var${i}`] = `Value ${i}`;
            }
        }
    }
    // Analyze buttons
    const buttonComponent = components.find((c) => c.type === 'BUTTONS');
    if (buttonComponent && buttonComponent.buttons) {
        analysis.has_buttons = true;
        buttonComponent.buttons.forEach((button, index) => {
            analysis.button_types.push({
                type: button.type,
                text: button.text,
                index: index
            });
            if (button.type === 'QUICK_REPLY') {
                analysis.optional_params.push({
                    name: 'button_payload',
                    description: `Payload for quick reply button: "${button.text}"`,
                    required: false,
                    example: 'CONFIRM_ACTION'
                });
                analysis.example_request.body.button_payload = 'YOUR_PAYLOAD_HERE';
            }
            else if (button.type === 'URL' && button.url && button.url.includes('{{1}}')) {
                analysis.optional_params.push({
                    name: 'button_url',
                    description: `Dynamic URL for button: "${button.text}"`,
                    required: false,
                    example: 'https://example.com/order/12345'
                });
                analysis.example_request.body.button_url = 'https://your-url.com/path';
            }
        });
    }
    return analysis;
}
exports.default = router;
//# sourceMappingURL=send.js.map