"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const xlsx_1 = __importDefault(require("xlsx"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for Excel files
    },
    fileFilter: (req, file, cb) => {
        // Allow Excel and CSV files for recipient import
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
            'text/plain' // .txt
        ];
        if (allowedMimes.includes(file.mimetype) ||
            file.originalname.match(/\.(xlsx|xls|csv|txt)$/i)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only Excel (.xlsx, .xls), CSV (.csv), and text (.txt) files are allowed'));
        }
    }
});
/**
 * Uploads a media file to the WhatsApp Cloud API to get a media ID.
 * @param imageUrl The URL to the image file to download and upload.
 * @param phoneNumberId The WhatsApp phone number ID.
 * @param accessToken The WhatsApp access token.
 * @returns The media ID string on success, or null on failure.
 */
async function uploadWhatsappMedia(imageUrl, phoneNumberId, accessToken) {
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/media`;
    try {
        console.log(`🔄 Downloading image from: ${imageUrl}`);
        // Step 1: Download the image from the URL
        const imageResponse = await axios_1.default.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data);
        const mimeType = imageResponse.headers['content-type'] || 'image/png';
        console.log(`📁 Downloaded image: ${imageBuffer.length} bytes, type: ${mimeType}`);
        // Step 2: Create FormData and upload to WhatsApp
        const formData = new form_data_1.default();
        formData.append('messaging_product', 'whatsapp');
        formData.append('file', imageBuffer, {
            contentType: mimeType,
            filename: 'header_image.png'
        });
        console.log(`🚀 Uploading to WhatsApp Media API: ${url}`);
        const response = await axios_1.default.post(url, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (response.data && response.data.id) {
            console.log(`✅ Media uploaded successfully. Received Media ID: ${response.data.id}`);
            return response.data.id;
        }
        console.error('❌ Media upload response did not contain an ID.', response.data);
        return null;
    }
    catch (error) {
        const errorData = error.response?.data || error.message;
        console.error('❌ Failed to upload media to WhatsApp API:', JSON.stringify(errorData, null, 2));
        return null;
    }
}
const router = express_1.default.Router();
// Upload configuration is defined above with multer.diskStorage
// Utility function to validate phone numbers (Meta WhatsApp API format)
const validatePhoneNumber = (phone) => {
    // Remove all non-digit characters including +
    const cleaned = phone.replace(/[^\d]/g, '');
    // Meta WhatsApp API format: country code + number (no + prefix)
    // Must start with country code (1-4 digits) followed by local number
    // Total length should be between 8-15 digits (international standard)
    return /^[1-9]\d{7,14}$/.test(cleaned);
};
// Utility function to format phone number for Meta WhatsApp API
const formatPhoneNumber = (phone) => {
    // Remove all non-digits and + symbols
    let cleaned = phone.replace(/[^\d]/g, '');
    // Remove leading zeros if present
    cleaned = cleaned.replace(/^0+/, '');
    // Ensure it starts with country code (not 0)
    if (cleaned.length > 0 && cleaned[0] === '0') {
        cleaned = cleaned.substring(1);
    }
    return cleaned;
};
// GET /api/whatsapp/numbers - Fetch all WhatsApp numbers for authenticated user
router.get('/numbers', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const result = await index_1.pool.query(`SELECT 
        id,
        whatsapp_number_id as phone_number_id,
        whatsapp_number as phone_number,
        business_name,
        is_active
      FROM user_business_info 
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC`, [userId]);
        const numbers = result.rows.map(row => ({
            id: row.id,
            phone_number_id: row.phone_number_id,
            phone_number: row.phone_number,
            display_name: row.business_name || 'WhatsApp Business',
            label: `${row.business_name || 'WhatsApp Business'} (+${row.phone_number})`
        }));
        res.json({
            success: true,
            data: numbers
        });
    }
    catch (error) {
        console.error('Error fetching WhatsApp numbers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch WhatsApp numbers'
        });
    }
});
// GET /api/whatsapp/templates - Fetch templates for authenticated user
router.get('/templates', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { language } = req.query;
        let query = `
      SELECT 
        id,
        name,
        category,
        language,
        status,
        components
      FROM templates 
      WHERE user_id = $1
    `;
        const params = [userId];
        if (language) {
            query += ` AND language = $2`;
            params.push(language);
        }
        query += ` ORDER BY name, language`;
        const result = await index_1.pool.query(query, params);
        const templates = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            language: row.language,
            category: row.category,
            status: row.status,
            components: row.components,
            hasVariables: JSON.stringify(row.components).includes('{{'),
            hasButtons: row.components.some((comp) => comp.type === 'BUTTONS')
        }));
        res.json({
            success: true,
            data: templates
        });
    }
    catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch templates'
        });
    }
});
// GET /api/whatsapp/languages - Return supported languages
router.get('/languages', auth_1.requireAuth, async (req, res) => {
    try {
        // Common WhatsApp Business API supported languages
        const languages = [
            { code: 'af', name: 'Afrikaans' },
            { code: 'sq', name: 'Albanian' },
            { code: 'ar', name: 'Arabic' },
            { code: 'az', name: 'Azerbaijani' },
            { code: 'bn', name: 'Bengali' },
            { code: 'bg', name: 'Bulgarian' },
            { code: 'ca', name: 'Catalan' },
            { code: 'zh_CN', name: 'Chinese (Simplified)' },
            { code: 'zh_HK', name: 'Chinese (Traditional)' },
            { code: 'hr', name: 'Croatian' },
            { code: 'cs', name: 'Czech' },
            { code: 'da', name: 'Danish' },
            { code: 'nl', name: 'Dutch' },
            { code: 'en', name: 'English' },
            { code: 'en_GB', name: 'English (UK)' },
            { code: 'en_US', name: 'English (US)' },
            { code: 'et', name: 'Estonian' },
            { code: 'fil', name: 'Filipino' },
            { code: 'fi', name: 'Finnish' },
            { code: 'fr', name: 'French' },
            { code: 'de', name: 'German' },
            { code: 'el', name: 'Greek' },
            { code: 'gu', name: 'Gujarati' },
            { code: 'ha', name: 'Hausa' },
            { code: 'he', name: 'Hebrew' },
            { code: 'hi', name: 'Hindi' },
            { code: 'hu', name: 'Hungarian' },
            { code: 'id', name: 'Indonesian' },
            { code: 'ga', name: 'Irish' },
            { code: 'it', name: 'Italian' },
            { code: 'ja', name: 'Japanese' },
            { code: 'kn', name: 'Kannada' },
            { code: 'kk', name: 'Kazakh' },
            { code: 'ko', name: 'Korean' },
            { code: 'lo', name: 'Lao' },
            { code: 'lv', name: 'Latvian' },
            { code: 'lt', name: 'Lithuanian' },
            { code: 'mk', name: 'Macedonian' },
            { code: 'ms', name: 'Malay' },
            { code: 'ml', name: 'Malayalam' },
            { code: 'mr', name: 'Marathi' },
            { code: 'nb', name: 'Norwegian' },
            { code: 'fa', name: 'Persian' },
            { code: 'pl', name: 'Polish' },
            { code: 'pt_BR', name: 'Portuguese (Brazil)' },
            { code: 'pt_PT', name: 'Portuguese (Portugal)' },
            { code: 'pa', name: 'Punjabi' },
            { code: 'ro', name: 'Romanian' },
            { code: 'ru', name: 'Russian' },
            { code: 'sk', name: 'Slovak' },
            { code: 'sl', name: 'Slovenian' },
            { code: 'es', name: 'Spanish' },
            { code: 'es_AR', name: 'Spanish (Argentina)' },
            { code: 'es_ES', name: 'Spanish (Spain)' },
            { code: 'es_MX', name: 'Spanish (Mexico)' },
            { code: 'sw', name: 'Swahili' },
            { code: 'sv', name: 'Swedish' },
            { code: 'ta', name: 'Tamil' },
            { code: 'te', name: 'Telugu' },
            { code: 'th', name: 'Thai' },
            { code: 'tr', name: 'Turkish' },
            { code: 'uk', name: 'Ukrainian' },
            { code: 'ur', name: 'Urdu' },
            { code: 'uz', name: 'Uzbek' },
            { code: 'vi', name: 'Vietnamese' },
            { code: 'zu', name: 'Zulu' }
        ];
        res.json({
            success: true,
            data: languages
        });
    }
    catch (error) {
        console.error('Error fetching languages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch languages'
        });
    }
});
// POST /api/whatsapp/template-details - Get complete template structure
router.post('/template-details', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { template_name, language = 'en_US' } = req.body;
        if (!template_name) {
            return res.status(400).json({
                success: false,
                error: 'template_name is required'
            });
        }
        const result = await index_1.pool.query(`SELECT 
        id,
        name,
        language,
        category,
        components,
        status
      FROM templates 
      WHERE user_id = $1 AND name = $2 AND language = $3`, [userId, template_name, language]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }
        const template = result.rows[0];
        // Parse template components to extract variables and buttons
        const components = template.components;
        const variables = [];
        const buttons = [];
        let hasButtons = false;
        let templateTypeInfo = {
            hasStaticImage: false,
            hasDynamicImage: false,
            hasTextHeader: false,
            imageRequired: false,
            description: ''
        };
        for (const component of components) {
            if (component.type === 'HEADER') {
                if (component.format === 'IMAGE') {
                    const hasHeaderHandle = component.example && component.example.header_handle;
                    const hasVariableInText = component.text && component.text.includes('{{');
                    if (hasVariableInText) {
                        // DYNAMIC IMAGE: Template has explicit {{1}} variable in header text
                        templateTypeInfo.hasDynamicImage = true;
                        templateTypeInfo.imageRequired = true;
                        templateTypeInfo.description = 'Dynamic image template (requires image URL at runtime)';
                        // Extract header variable
                        const matches = component.text.match(/\{\{(\d+)\}\}/g);
                        if (matches) {
                            matches.forEach((match) => {
                                const variableIndex = parseInt(match.replace(/[{}]/g, ''));
                                variables.push({
                                    index: variableIndex,
                                    component: 'HEADER',
                                    placeholder: 'Image URL (https://example.com/image.jpg)',
                                    required: true,
                                    type: 'image_url'
                                });
                            });
                        }
                    }
                    else if (hasHeaderHandle) {
                        // STATIC IMAGE: Template has pre-uploaded media with header_handle
                        templateTypeInfo.hasStaticImage = true;
                        templateTypeInfo.imageRequired = false;
                        templateTypeInfo.description = 'Static image template (uses pre-uploaded image - no URL needed)';
                    }
                    else {
                        // UNKNOWN: Image template without header_handle or variables - treat as dynamic
                        templateTypeInfo.hasDynamicImage = true;
                        templateTypeInfo.imageRequired = true;
                        templateTypeInfo.description = 'Dynamic image template (requires image URL)';
                        variables.push({
                            index: 1,
                            component: 'HEADER',
                            placeholder: 'Image URL (https://example.com/image.jpg)',
                            required: true,
                            type: 'image_url'
                        });
                    }
                }
                else if (component.format === 'TEXT') {
                    templateTypeInfo.hasTextHeader = true;
                    const text = component.text || '';
                    const matches = text.match(/\{\{(\d+)\}\}/g);
                    if (matches) {
                        matches.forEach((match) => {
                            const variableIndex = parseInt(match.replace(/[{}]/g, ''));
                            variables.push({
                                index: variableIndex,
                                component: 'HEADER',
                                placeholder: `Header text for variable ${variableIndex}`,
                                required: true,
                                type: 'text'
                            });
                        });
                    }
                }
            }
            else if (component.type === 'BODY' || component.type === 'FOOTER') {
                const text = component.text || '';
                const matches = text.match(/\{\{(\d+)\}\}/g);
                if (matches) {
                    matches.forEach((match) => {
                        const variableIndex = parseInt(match.replace(/[{}]/g, ''));
                        variables.push({
                            index: variableIndex,
                            component: component.type,
                            placeholder: `${component.type.toLowerCase()} text for variable ${variableIndex}`,
                            required: true,
                            type: 'text'
                        });
                    });
                }
            }
            if (component.type === 'BUTTONS') {
                hasButtons = true;
                component.buttons?.forEach((button, index) => {
                    buttons.push({
                        index: index,
                        type: button.type,
                        text: button.text,
                        url: button.url,
                        phone_number: button.phone_number,
                        copy_code: button.copy_code
                    });
                    // Check for dynamic URL buttons
                    if (button.type === 'URL' && button.url && button.url.includes('{{')) {
                        const matches = button.url.match(/\{\{(\d+)\}\}/g);
                        if (matches) {
                            matches.forEach((match) => {
                                const variableIndex = parseInt(match.replace(/[{}]/g, ''));
                                variables.push({
                                    index: variableIndex,
                                    component: 'BUTTON',
                                    placeholder: `URL parameter for button: ${button.text}`,
                                    required: true,
                                    type: 'url_param'
                                });
                            });
                        }
                    }
                });
            }
        }
        // Remove duplicates and sort variables
        const uniqueVariables = variables.filter((v, i, arr) => arr.findIndex(item => item.index === v.index && item.component === v.component) === i).sort((a, b) => a.index - b.index);
        res.json({
            success: true,
            data: {
                id: template.id,
                name: template.name,
                language: template.language,
                category: template.category,
                components: components,
                variables: uniqueVariables,
                buttons: buttons,
                hasVariables: uniqueVariables.length > 0,
                hasButtons: hasButtons,
                templateTypeInfo: templateTypeInfo,
                preview: generateTemplatePreview(components, {})
            }
        });
    }
    catch (error) {
        console.error('Error fetching template details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch template details'
        });
    }
});
// Helper function to generate template preview
function generateTemplatePreview(components, variables) {
    let preview = '';
    components.forEach(component => {
        if (component.type === 'HEADER') {
            if (component.format === 'IMAGE') {
                if (variables['1']) {
                    preview += `📷 *Image:* ${variables['1']}\n\n`;
                }
                else {
                    preview += `📷 *[Static Image]*\n\n`;
                }
            }
            else if (component.text) {
                preview += `*${replaceVariables(component.text, variables)}*\n\n`;
            }
        }
        else if (component.type === 'BODY') {
            preview += `${replaceVariables(component.text, variables)}\n\n`;
        }
        else if (component.type === 'FOOTER' && component.text) {
            preview += `_${replaceVariables(component.text, variables)}_\n`;
        }
        else if (component.type === 'BUTTONS') {
            preview += '\n*Buttons:*\n';
            component.buttons?.forEach((button) => {
                preview += `• ${button.text}\n`;
            });
        }
    });
    return preview.trim();
}
function replaceVariables(text, variables) {
    return text.replace(/\{\{(\d+)\}\}/g, (match, index) => {
        return variables[index] || `{{${index}}}`;
    });
}
// POST /api/whatsapp/import-recipients - Handle Excel file upload
router.post('/import-recipients', auth_1.requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }
        const filePath = req.file.path;
        const fileExtension = path_1.default.extname(req.file.originalname).toLowerCase();
        let phoneNumbers = [];
        try {
            if (fileExtension === '.csv') {
                // Handle CSV files
                const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
                const lines = fileContent.split('\n');
                phoneNumbers = lines
                    .map(line => line.split(',')[0]?.trim())
                    .filter(phone => phone && phone !== '');
            }
            else {
                // Handle Excel files
                const workbook = xlsx_1.default.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = xlsx_1.default.utils.sheet_to_json(worksheet, { header: 1 });
                phoneNumbers = jsonData
                    .map((row) => row[0]?.toString().trim())
                    .filter(phone => phone && phone !== '');
            }
            // Validate and format phone numbers
            const validNumbers = [];
            const invalidNumbers = [];
            phoneNumbers.forEach(phone => {
                if (validatePhoneNumber(phone)) {
                    validNumbers.push(formatPhoneNumber(phone));
                }
                else {
                    invalidNumbers.push(phone);
                }
            });
            // Remove duplicates
            const uniqueValidNumbers = [...new Set(validNumbers)];
            res.json({
                success: true,
                data: {
                    valid_numbers: uniqueValidNumbers,
                    invalid_numbers: invalidNumbers,
                    total_processed: phoneNumbers.length,
                    valid_count: uniqueValidNumbers.length,
                    invalid_count: invalidNumbers.length
                }
            });
        }
        catch (parseError) {
            console.error('Error parsing file:', parseError);
            res.status(400).json({
                success: false,
                error: 'Failed to parse file. Please ensure it\'s a valid Excel or CSV file.'
            });
        }
        finally {
            // Clean up uploaded file
            fs_1.default.unlink(filePath, (err) => {
                if (err)
                    console.error('Error deleting temp file:', err);
            });
        }
    }
    catch (error) {
        console.error('Error importing recipients:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to import recipients'
        });
    }
});
// POST /api/whatsapp/preview-campaign - Generate campaign preview
router.post('/preview-campaign', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { template_name, language = 'en_US', variables = {}, recipients_text = '' } = req.body;
        if (!template_name) {
            return res.status(400).json({
                success: false,
                error: 'template_name is required'
            });
        }
        // Get template details including media ID, header type, and media URL
        const templateResult = await index_1.pool.query('SELECT components, header_media_id, header_type, header_media_url, header_handle, media_id FROM templates WHERE user_id = $1 AND name = $2 AND language = $3', [userId, template_name, language]);
        if (templateResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }
        const components = templateResult.rows[0].components;
        // Parse recipients
        const phoneNumbers = recipients_text
            .split('\n')
            .map((num) => num.trim())
            .filter((num) => num.length > 0);
        const formattedNumbers = phoneNumbers.map((num) => formatPhoneNumber(num));
        const validRecipients = formattedNumbers.filter((num) => validatePhoneNumber(num));
        const invalidRecipients = formattedNumbers.filter((num) => !validatePhoneNumber(num));
        // Generate preview
        const preview = generateTemplatePreview(components, variables);
        res.json({
            success: true,
            data: {
                template_name,
                language,
                preview,
                components,
                variables,
                recipient_stats: {
                    total_provided: phoneNumbers.length,
                    valid_recipients: validRecipients.length,
                    invalid_recipients: invalidRecipients.length,
                    valid_numbers: validRecipients.slice(0, 5), // Show first 5 for preview
                    invalid_numbers: invalidRecipients
                }
            }
        });
    }
    catch (error) {
        console.error('Error generating campaign preview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate campaign preview'
        });
    }
});
// POST /api/whatsapp/quick-send - Handle quick message sending
router.post('/quick-send', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        console.log(`🔍 DEBUG QUICK-SEND: userId from session = ${userId}`);
        const { phone_number_id, template_name, language = 'en_US', variables = {}, recipients_text = '', campaign_name } = req.body;
        console.log(`🔍 DEBUG QUICK-SEND: Request body:`, { phone_number_id, template_name, language, recipients_text, campaign_name });
        // Validation
        if (!phone_number_id || !template_name || !recipients_text.trim()) {
            console.log(`❌ DEBUG QUICK-SEND: Validation failed - missing fields`);
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: phone_number_id, template_name, recipients_text'
            });
        }
        console.log(`✅ DEBUG QUICK-SEND: Validation passed`);
        // Parse recipients from text input
        const phoneNumbers = recipients_text
            .split('\n')
            .map((num) => num.trim())
            .filter((num) => num.length > 0);
        // Format and validate recipients for Meta API
        const formattedNumbers = phoneNumbers.map((num) => formatPhoneNumber(num));
        const validRecipients = formattedNumbers.filter((num) => validatePhoneNumber(num));
        console.log(`🔍 DEBUG QUICK-SEND: Phone validation - formatted: ${formattedNumbers}, valid: ${validRecipients}`);
        if (validRecipients.length === 0) {
            console.log(`❌ DEBUG QUICK-SEND: No valid phone numbers found`);
            return res.status(400).json({
                success: false,
                error: 'No valid phone numbers found. Please use Meta WhatsApp API format (919398424270, no + prefix)'
            });
        }
        console.log(`✅ DEBUG QUICK-SEND: Phone validation passed`);
        // Get WhatsApp number details and verify ownership
        const numberResult = await index_1.pool.query('SELECT access_token, business_name FROM user_business_info WHERE user_id = $1 AND whatsapp_number_id = $2 AND is_active = true', [userId, phone_number_id]);
        if (numberResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'WhatsApp number not found or access denied'
            });
        }
        const { access_token } = numberResult.rows[0];
        // Get template details including media ID, header type, and media URL
        const templateResult = await index_1.pool.query('SELECT components, header_media_id, header_type, header_media_url, header_handle, media_id FROM templates WHERE user_id = $1 AND name = $2 AND language = $3', [userId, template_name, language]);
        if (templateResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }
        // CRITICAL FIX: Validate template variables match requirements
        const components = templateResult.rows[0].components;
        const requiredVariables = new Set();
        // Extract all required variables from template components
        for (const component of components) {
            if (component.text) {
                const matches = component.text.match(/\{\{(\d+)\}\}/g) || [];
                matches.forEach((match) => {
                    const variableIndex = match.replace(/[{}]/g, '');
                    requiredVariables.add(variableIndex);
                });
            }
            // Check button URLs for variables
            if (component.type === 'BUTTONS' && component.buttons) {
                component.buttons.forEach((button) => {
                    if (button.url && button.url.includes('{{')) {
                        const matches = button.url.match(/\{\{(\d+)\}\}/g) || [];
                        matches.forEach((match) => {
                            const variableIndex = match.replace(/[{}]/g, '');
                            requiredVariables.add(variableIndex);
                        });
                    }
                });
            }
        }
        const requiredVariablesList = Array.from(requiredVariables).sort((a, b) => parseInt(a) - parseInt(b));
        const providedVariablesList = Object.keys(variables).sort((a, b) => parseInt(a) - parseInt(b));
        // Log template analysis for debugging
        console.log(`🔍 Template "${template_name}" Analysis:`);
        console.log(`   Required variables: [${requiredVariablesList.join(', ')}]`);
        console.log(`   Provided variables: [${providedVariablesList.join(', ')}]`);
        console.log(`   Variables object:`, variables);
        // Check if variables count matches
        if (requiredVariablesList.length !== providedVariablesList.length) {
            return res.status(400).json({
                success: false,
                error: `Template "${template_name}" requires ${requiredVariablesList.length} variables (${requiredVariablesList.join(', ')}), but ${providedVariablesList.length} were provided (${providedVariablesList.join(', ')})`
            });
        }
        // Ensure all required variables are provided with correct indices
        const missingVariables = requiredVariablesList.filter(reqVar => !variables[reqVar]);
        const unexpectedVariables = providedVariablesList.filter(provVar => !requiredVariablesList.includes(provVar));
        if (missingVariables.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required variables for template "${template_name}": ${missingVariables.join(', ')}`
            });
        }
        if (unexpectedVariables.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Template "${template_name}" requires variables [${requiredVariablesList.join(', ')}], but unexpected variables were provided: [${unexpectedVariables.join(', ')}]`
            });
        }
        // Create campaign log
        const campaignResult = await index_1.pool.query(`INSERT INTO campaign_logs 
       (user_id, campaign_name, template_used, phone_number_id, language_code, total_recipients, status, campaign_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`, [
            userId,
            campaign_name || `Quick Send - ${template_name} - ${new Date().toISOString()}`,
            template_name,
            phone_number_id,
            language,
            validRecipients.length,
            'processing',
            JSON.stringify({ variables, template_components: templateResult.rows[0].components })
        ]);
        const campaignId = campaignResult.rows[0].id;
        // Send messages
        let successCount = 0;
        let failCount = 0;
        const messagePromises = validRecipients.map((recipient) => sendTemplateMessage(phone_number_id, access_token, recipient, template_name, language, variables, templateResult.rows[0].components, campaignId, templateResult.rows[0].header_media_id, templateResult.rows[0].header_type, templateResult.rows[0].header_media_url, templateResult.rows[0].header_handle, templateResult.rows[0].media_id).then(() => {
            successCount++;
        }).catch((error) => {
            failCount++;
            console.error(`Failed to send to ${recipient}:`, error.message);
        }));
        await Promise.allSettled(messagePromises);
        // Update campaign status
        await index_1.pool.query('UPDATE campaign_logs SET status = $1, successful_sends = $2, failed_sends = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4', ['completed', successCount, failCount, campaignId]);
        res.json({
            success: true,
            data: {
                campaign_id: campaignId,
                total_recipients: validRecipients.length,
                successful_sends: successCount,
                failed_sends: failCount,
                invalid_numbers: phoneNumbers.length - validRecipients.length,
                status: 'completed'
            }
        });
    }
    catch (error) {
        console.error('Error in quick send:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send messages'
        });
    }
});
// POST /api/whatsapp/send-bulk - Handle bulk message sending
router.post('/send-bulk', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { phone_number_id, template_name, language = 'en_US', variables = {}, recipients = [], buttons = {}, campaign_name } = req.body;
        // Validation
        if (!phone_number_id || !template_name || !recipients || recipients.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: phone_number_id, template_name, recipients'
            });
        }
        // Validate recipients are phone numbers
        const validRecipients = recipients.filter((phone) => validatePhoneNumber(phone));
        if (validRecipients.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid phone numbers provided'
            });
        }
        // Get WhatsApp number details and verify ownership
        const numberResult = await index_1.pool.query('SELECT access_token, business_name FROM user_business_info WHERE user_id = $1 AND whatsapp_number_id = $2 AND is_active = true', [userId, phone_number_id]);
        if (numberResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'WhatsApp number not found or access denied'
            });
        }
        const { access_token } = numberResult.rows[0];
        // Get template details including media ID, header type, and media URL
        const templateResult = await index_1.pool.query('SELECT components, header_media_id, header_type, header_media_url, header_handle, media_id FROM templates WHERE user_id = $1 AND name = $2 AND language = $3', [userId, template_name, language]);
        if (templateResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }
        // CRITICAL FIX: Validate template variables match requirements (same as quick-send)
        const components = templateResult.rows[0].components;
        const requiredVariables = new Set();
        // Extract all required variables from template components
        for (const component of components) {
            if (component.text) {
                const matches = component.text.match(/\{\{(\d+)\}\}/g) || [];
                matches.forEach((match) => {
                    const variableIndex = match.replace(/[{}]/g, '');
                    requiredVariables.add(variableIndex);
                });
            }
            // Check button URLs for variables
            if (component.type === 'BUTTONS' && component.buttons) {
                component.buttons.forEach((button) => {
                    if (button.url && button.url.includes('{{')) {
                        const matches = button.url.match(/\{\{(\d+)\}\}/g) || [];
                        matches.forEach((match) => {
                            const variableIndex = match.replace(/[{}]/g, '');
                            requiredVariables.add(variableIndex);
                        });
                    }
                });
            }
        }
        const requiredVariablesList = Array.from(requiredVariables).sort((a, b) => parseInt(a) - parseInt(b));
        const providedVariablesList = Object.keys(variables).sort((a, b) => parseInt(a) - parseInt(b));
        // Log template analysis for debugging
        console.log(`🔍 Bulk Template "${template_name}" Analysis:`);
        console.log(`   Required variables: [${requiredVariablesList.join(', ')}]`);
        console.log(`   Provided variables: [${providedVariablesList.join(', ')}]`);
        console.log(`   Variables object:`, variables);
        // Check if variables count matches
        if (requiredVariablesList.length !== providedVariablesList.length) {
            return res.status(400).json({
                success: false,
                error: `Template "${template_name}" requires ${requiredVariablesList.length} variables (${requiredVariablesList.join(', ')}), but ${providedVariablesList.length} were provided (${providedVariablesList.join(', ')})`
            });
        }
        // Ensure all required variables are provided with correct indices
        const missingVariables = requiredVariablesList.filter(reqVar => !variables[reqVar]);
        const unexpectedVariables = providedVariablesList.filter(provVar => !requiredVariablesList.includes(provVar));
        if (missingVariables.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required variables for template "${template_name}": ${missingVariables.join(', ')}`
            });
        }
        if (unexpectedVariables.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Template "${template_name}" requires variables [${requiredVariablesList.join(', ')}], but unexpected variables were provided: [${unexpectedVariables.join(', ')}]`
            });
        }
        // Create campaign log
        const campaignResult = await index_1.pool.query(`INSERT INTO campaign_logs 
       (user_id, campaign_name, template_used, phone_number_id, language_code, total_recipients, status, campaign_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`, [
            userId,
            campaign_name || `Campaign - ${template_name} - ${new Date().toISOString()}`,
            template_name,
            phone_number_id,
            language,
            validRecipients.length,
            'processing',
            JSON.stringify({ variables, buttons, template_components: templateResult.rows[0].components })
        ]);
        const campaignId = campaignResult.rows[0].id;
        // Start sending messages (in a real app, this would be a background job)
        // For demo purposes, we'll simulate the sending process
        let successCount = 0;
        let failCount = 0;
        // Process messages in batches to respect rate limits
        const batchSize = 10;
        const batches = [];
        for (let i = 0; i < validRecipients.length; i += batchSize) {
            batches.push(validRecipients.slice(i, i + batchSize));
        }
        const messagePromises = [];
        for (const batch of batches) {
            for (const recipient of batch) {
                const messagePromise = sendTemplateMessage(phone_number_id, access_token, recipient, template_name, language, variables, templateResult.rows[0].components, campaignId, templateResult.rows[0].header_media_id, templateResult.rows[0].header_type, templateResult.rows[0].header_media_url, templateResult.rows[0].header_handle, templateResult.rows[0].media_id);
                messagePromises.push(messagePromise);
            }
            // Wait between batches to respect rate limits
            if (batches.indexOf(batch) < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        // Execute all message sending promises
        const results = await Promise.allSettled(messagePromises);
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                successCount++;
            }
            else {
                failCount++;
            }
        });
        // Update campaign status
        await index_1.pool.query('UPDATE campaign_logs SET status = $1, successful_sends = $2, failed_sends = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4', ['completed', successCount, failCount, campaignId]);
        res.json({
            success: true,
            data: {
                campaign_id: campaignId,
                total_recipients: validRecipients.length,
                successful_sends: successCount,
                failed_sends: failCount,
                status: 'completed'
            }
        });
    }
    catch (error) {
        console.error('Error sending bulk messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send bulk messages'
        });
    }
});
// Function to send individual template message
async function sendTemplateMessage(phoneNumberId, accessToken, recipient, templateName, language, variables, components, campaignId, headerMediaId, headerType, headerMediaUrl, headerHandle, mediaId) {
    try {
        const templateComponents = [];
        console.log(`🚀 Processing template "${templateName}" with header_type: ${headerType || 'UNKNOWN'}`);
        // SIMPLIFIED LOGIC: Only handle STATIC_IMAGE, TEXT, and NONE
        for (const component of components) {
            if (component.type === 'HEADER') {
                // Handle IMAGE templates (both STATIC_IMAGE and dynamic) - Use stored media_id for sending
                if (component.format === 'IMAGE' || headerType === 'STATIC_IMAGE') {
                    console.log(`📸 IMAGE template detected - using stored media_id for sending`);
                    console.log(`🔍 Available data:`);
                    console.log(`   header_handle: ${headerHandle ? headerHandle.substring(0, 50) + '...' : 'Not set'}`);
                    console.log(`   media_id: ${mediaId || 'Not set'}`);
                    // CORRECT LOGIC: Use the stored media_id for message sending
                    if (mediaId) {
                        console.log(`✅ Using stored media_id for sending: ${mediaId}`);
                        const headerComponent = {
                            type: "header",
                            parameters: [{
                                    type: "image",
                                    image: {
                                        id: mediaId // Use the stored media_id from template creation
                                    }
                                }]
                        };
                        templateComponents.push(headerComponent);
                        console.log(`✅ Added header component with stored media_id: ${mediaId}`);
                    }
                    else {
                        // Fallback: If no media_id stored, upload image to get one
                        console.log(`⚠️ No stored media_id found. Performing fallback upload...`);
                        const imageUrl = headerMediaUrl;
                        if (!imageUrl) {
                            throw new Error(`Template '${templateName}' has no stored media_id and no header_media_url for fallback upload.`);
                        }
                        const freshMediaId = await uploadWhatsappMedia(imageUrl, phoneNumberId, accessToken);
                        if (!freshMediaId) {
                            throw new Error(`Fallback media upload failed for template ${templateName}.`);
                        }
                        console.log(`🔄 Fallback upload successful. Got media_id: ${freshMediaId}`);
                        const headerComponent = {
                            type: "header",
                            parameters: [{
                                    type: "image",
                                    image: {
                                        id: freshMediaId
                                    }
                                }]
                        };
                        templateComponents.push(headerComponent);
                        console.log(`✅ Added header component with fallback media_id: ${freshMediaId}`);
                    }
                }
                // Handle TEXT headers with variables
                else if (headerType === 'TEXT' && component.text && component.text.includes('{{')) {
                    console.log(`📝 TEXT header with variables detected`);
                    const headerParams = [];
                    const matches = component.text.match(/\{\{(\d+)\}\}/g);
                    if (matches) {
                        // CRITICAL FIX: Always send ALL required parameters, even if empty
                        matches.forEach((match) => {
                            const variableIndex = parseInt(match.replace(/[{}]/g, ''));
                            const value = variables[variableIndex.toString()] || `[Header Variable ${variableIndex} not provided]`;
                            headerParams.push({
                                type: "text",
                                text: value
                            });
                        });
                        // Always add header component if template has variables (Meta requirement)
                        templateComponents.push({
                            type: "header",
                            parameters: headerParams
                        });
                        console.log(`   ✅ Added text header with ${headerParams.length} parameters (${matches.length} required)`);
                    }
                }
            }
            else if (component.type === 'BODY' && component.text) {
                // Handle body variables
                const matches = component.text.match(/\{\{(\d+)\}\}/g);
                if (matches) {
                    const bodyParams = [];
                    // CRITICAL FIX: Always send ALL required parameters, even if empty
                    matches.forEach((match) => {
                        const variableIndex = parseInt(match.replace(/[{}]/g, ''));
                        const value = variables[variableIndex.toString()] || `[Variable ${variableIndex} not provided]`;
                        bodyParams.push({
                            type: "text",
                            text: value
                        });
                    });
                    // Always add body component if template has variables (Meta requirement)
                    templateComponents.push({
                        type: "body",
                        parameters: bodyParams
                    });
                    console.log(`   ✅ Sending body component with ${bodyParams.length} parameters (${matches.length} required)`);
                }
            }
            else if (component.type === 'BUTTONS' && component.buttons) {
                // Handle button variables (dynamic URLs)
                component.buttons.forEach((button, buttonIndex) => {
                    if (button.type === 'URL' && button.url && button.url.includes('{{')) {
                        const matches = button.url.match(/\{\{(\d+)\}\}/g);
                        if (matches) {
                            const buttonParams = [];
                            matches.forEach((match) => {
                                const variableIndex = parseInt(match.replace(/[{}]/g, ''));
                                const value = variables[variableIndex.toString()];
                                if (value) {
                                    buttonParams.push({
                                        type: "text",
                                        text: value
                                    });
                                }
                            });
                            if (buttonParams.length > 0) {
                                templateComponents.push({
                                    type: "button",
                                    sub_type: "url",
                                    index: buttonIndex.toString(),
                                    parameters: buttonParams
                                });
                                console.log(`   ✅ Sending button component for button ${buttonIndex}`);
                            }
                        }
                    }
                });
            }
        }
        // Build the template payload
        const templatePayload = {
            name: templateName,
            language: {
                code: language,
                policy: "deterministic"
            }
        };
        // Only add components if we have variables to populate
        if (templateComponents.length > 0) {
            templatePayload.components = templateComponents;
        }
        // Prepare WhatsApp API request payload
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipient.replace('+', ''),
            type: "template",
            template: templatePayload
        };
        console.log('📤 Sending WhatsApp message payload:', JSON.stringify(payload, null, 2));
        // Make actual WhatsApp API call
        const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const responseData = await response.json();
        console.log('📥 WhatsApp API response:', JSON.stringify(responseData, null, 2));
        // Enhanced error handling for common WhatsApp API errors
        if (!response.ok) {
            const errorCode = responseData.error?.code;
            const errorMessage = responseData.error?.message || 'Unknown error';
            console.error(`❌ WhatsApp API Error [${response.status}]:`, {
                code: errorCode,
                message: errorMessage,
                details: responseData.error?.error_data,
                template: templateName,
                recipient: recipient
            });
            // Handle specific error codes
            switch (errorCode) {
                case 132012:
                    throw new Error(`Template parameter mismatch: ${errorMessage}`);
                case 131026:
                    throw new Error(`Message undeliverable to ${recipient}: ${errorMessage}`);
                case 131000:
                    throw new Error(`WhatsApp service error: ${errorMessage}`);
                case 368:
                    throw new Error(`Account restriction: ${errorMessage}`);
                default:
                    throw new Error(`WhatsApp API Error [${errorCode}]: ${errorMessage}`);
            }
        }
        if (responseData.messages && responseData.messages[0]) {
            const messageId = responseData.messages[0].id;
            console.log(`✅ Message sent successfully to ${recipient}, ID: ${messageId}`);
            // Log successful message
            await index_1.pool.query(`INSERT INTO message_logs (campaign_id, recipient_number, message_id, status, api_response, sent_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`, [campaignId, recipient, messageId, 'sent', JSON.stringify(responseData)]);
            return { success: true, messageId, recipient };
        }
        else {
            const errorMessage = responseData.error?.message || responseData.error?.error_data?.details || JSON.stringify(responseData);
            console.error(`❌ Message failed to ${recipient}:`, errorMessage);
            // Log failed message
            await index_1.pool.query(`INSERT INTO message_logs (campaign_id, recipient_number, status, error_message, api_response)
         VALUES ($1, $2, $3, $4, $5)`, [campaignId, recipient, 'failed', errorMessage, JSON.stringify(responseData)]);
            throw new Error(errorMessage);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Log failed message if not already logged
        await index_1.pool.query(`INSERT INTO message_logs (campaign_id, recipient_number, status, error_message)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (campaign_id, recipient_number) DO NOTHING`, [campaignId, recipient, 'failed', errorMessage]);
        throw error;
    }
}
// POST /api/whatsapp/parse-excel - Parse Excel file and return columns and sample data
router.post('/parse-excel', auth_1.requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }
        const filePath = req.file.path;
        const fileExtension = path_1.default.extname(req.file.originalname).toLowerCase();
        let data = [];
        let columns = [];
        try {
            if (fileExtension === '.csv') {
                // Handle CSV files
                const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
                const lines = fileContent.split('\n').filter(line => line.trim());
                if (lines.length > 0) {
                    columns = lines[0].split(',').map(col => col.trim());
                    for (let i = 1; i < lines.length; i++) {
                        const row = lines[i].split(',').map(cell => cell.trim());
                        const rowObject = {};
                        columns.forEach((col, index) => {
                            rowObject[col] = row[index] || '';
                        });
                        data.push(rowObject);
                    }
                }
            }
            else {
                // Handle Excel files
                const workbook = xlsx_1.default.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                data = xlsx_1.default.utils.sheet_to_json(worksheet);
                if (data.length > 0) {
                    columns = Object.keys(data[0]);
                }
            }
            res.json({
                success: true,
                data: {
                    rows: data,
                    columns: columns,
                    totalRows: data.length,
                    totalColumns: columns.length
                }
            });
        }
        catch (parseError) {
            console.error('Error parsing file:', parseError);
            res.status(400).json({
                success: false,
                error: 'Failed to parse file. Please ensure it\'s a valid Excel or CSV file.'
            });
        }
        finally {
            // Clean up uploaded file
            fs_1.default.unlink(filePath, (err) => {
                if (err)
                    console.error('Error deleting temp file:', err);
            });
        }
    }
    catch (error) {
        console.error('Error parsing Excel file:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to parse Excel file'
        });
    }
});
// POST /api/whatsapp/preview-custom - Generate preview for custom campaign
router.post('/preview-custom', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { templateName, language = 'en_US', recipientColumn, variableMappings = {}, sampleData = [] } = req.body;
        if (!templateName || !recipientColumn || !sampleData.length) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: templateName, recipientColumn, sampleData'
            });
        }
        // Get template details
        const templateResult = await index_1.pool.query('SELECT components FROM templates WHERE user_id = $1 AND name = $2 AND language = $3', [userId, templateName, language]);
        if (templateResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }
        const components = templateResult.rows[0].components;
        // Generate previews for sample data
        const previews = sampleData.slice(0, 2).map((row, index) => {
            const recipient = row[recipientColumn];
            if (!recipient) {
                return {
                    recipient: 'No phone number',
                    message: 'No recipient phone number found in this row'
                };
            }
            // Replace variables in template
            let message = generateCustomTemplatePreview(components, variableMappings, row);
            return {
                recipient: recipient,
                message: message
            };
        });
        res.json({
            success: true,
            data: {
                templateName,
                language,
                recipientColumn,
                variableMappings,
                previews
            }
        });
    }
    catch (error) {
        console.error('Error generating custom preview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate preview'
        });
    }
});
// POST /api/whatsapp/custom-send - Handle custom campaign submission
router.post('/custom-send', auth_1.requireAuth, upload.single('file'), async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { wabaId, templateName, language = 'en_US', recipientColName, variableMappings = '{}', campaignName } = req.body;
        // Validation
        if (!req.file || !recipientColName || !wabaId || !templateName) {
            return res.status(400).json({
                success: false,
                error: 'File, recipient column name, WhatsApp number, and template are required.'
            });
        }
        // Parse the uploaded file
        const filePath = req.file.path;
        const fileExtension = path_1.default.extname(req.file.originalname).toLowerCase();
        let data = [];
        try {
            if (fileExtension === '.csv') {
                const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
                const lines = fileContent.split('\n').filter(line => line.trim());
                if (lines.length > 0) {
                    const columns = lines[0].split(',').map(col => col.trim());
                    for (let i = 1; i < lines.length; i++) {
                        const row = lines[i].split(',').map(cell => cell.trim());
                        const rowObject = {};
                        columns.forEach((col, index) => {
                            rowObject[col] = row[index] || '';
                        });
                        data.push(rowObject);
                    }
                }
            }
            else {
                const workbook = xlsx_1.default.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                data = xlsx_1.default.utils.sheet_to_json(worksheet);
            }
            if (data.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'The uploaded file contains no data.'
                });
            }
            // Parse variable mappings
            const parsedVariableMappings = JSON.parse(variableMappings);
            // Get WhatsApp number details and verify ownership
            const numberResult = await index_1.pool.query('SELECT access_token, business_name FROM user_business_info WHERE user_id = $1 AND whatsapp_number_id = $2 AND is_active = true', [userId, wabaId]);
            if (numberResult.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: 'WhatsApp number not found or access denied'
                });
            }
            // Get template details
            const templateResult = await index_1.pool.query('SELECT components, header_media_id, header_type, header_media_url, header_handle, media_id FROM templates WHERE user_id = $1 AND name = $2 AND language = $3', [userId, templateName, language]);
            if (templateResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            }
            // Create campaign record
            const campaignResult = await index_1.pool.query(`INSERT INTO campaign_logs 
         (user_id, campaign_name, template_used, phone_number_id, language_code, total_recipients, status, campaign_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`, [
                userId,
                campaignName || `Custom Campaign - ${templateName} - ${new Date().toISOString()}`,
                templateName,
                wabaId,
                language,
                data.length,
                'processing',
                JSON.stringify({
                    variableMappings: parsedVariableMappings,
                    recipientColumn: recipientColName,
                    template_components: templateResult.rows[0].components
                })
            ]);
            const campaignId = campaignResult.rows[0].id;
            // Send messages to each recipient
            let successCount = 0;
            let failCount = 0;
            const messagePromises = data.map((row) => {
                const recipientNumber = row[recipientColName];
                if (!recipientNumber) {
                    failCount++;
                    return Promise.resolve();
                }
                // Build variables object for this row
                const rowVariables = {};
                Object.keys(parsedVariableMappings).forEach(templateVar => {
                    const columnName = parsedVariableMappings[templateVar];
                    if (columnName && row[columnName]) {
                        // Extract the number from the template variable (e.g., "{{1}}" -> "1")
                        const variableIndex = templateVar.replace(/[{}]/g, '');
                        rowVariables[variableIndex] = row[columnName].toString();
                    }
                });
                return sendTemplateMessage(wabaId, numberResult.rows[0].access_token, formatPhoneNumber(recipientNumber.toString()), templateName, language, rowVariables, templateResult.rows[0].components, campaignId, templateResult.rows[0].header_media_id, templateResult.rows[0].header_type, templateResult.rows[0].header_media_url, templateResult.rows[0].header_handle, templateResult.rows[0].media_id).then(() => {
                    successCount++;
                }).catch((error) => {
                    failCount++;
                    console.error(`Failed to send to ${recipientNumber}:`, error.message);
                });
            });
            await Promise.allSettled(messagePromises);
            // Update campaign status
            await index_1.pool.query('UPDATE campaign_logs SET status = $1, successful_sends = $2, failed_sends = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4', ['completed', successCount, failCount, campaignId]);
            res.status(202).json({
                success: true,
                message: 'Campaign has been processed.',
                data: {
                    campaignId: campaignId,
                    totalRecipients: data.length,
                    successfulSends: successCount,
                    failedSends: failCount
                }
            });
        }
        catch (parseError) {
            console.error('Error parsing file:', parseError);
            res.status(400).json({
                success: false,
                error: 'Failed to parse file. Please ensure it\'s a valid Excel or CSV file.'
            });
        }
        finally {
            // Clean up uploaded file
            fs_1.default.unlink(filePath, (err) => {
                if (err)
                    console.error('Error deleting temp file:', err);
            });
        }
    }
    catch (error) {
        console.error('Error in custom send:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process custom campaign'
        });
    }
});
// Helper function to generate custom template preview
function generateCustomTemplatePreview(components, variableMappings, rowData) {
    let preview = '';
    components.forEach(component => {
        if (component.type === 'HEADER') {
            if (component.format === 'IMAGE') {
                preview += `📷 *[Image]*\n\n`;
            }
            else if (component.text) {
                preview += `*${replaceCustomVariables(component.text, variableMappings, rowData)}*\n\n`;
            }
        }
        else if (component.type === 'BODY') {
            preview += `${replaceCustomVariables(component.text, variableMappings, rowData)}\n\n`;
        }
        else if (component.type === 'FOOTER' && component.text) {
            preview += `_${replaceCustomVariables(component.text, variableMappings, rowData)}_\n`;
        }
        else if (component.type === 'BUTTONS') {
            preview += '\n*Buttons:*\n';
            component.buttons?.forEach((button) => {
                preview += `• ${button.text}\n`;
            });
        }
    });
    return preview.trim();
}
function replaceCustomVariables(text, variableMappings, rowData) {
    return text.replace(/{{\s*(\d+)\s*}}/g, (match, index) => {
        const templateVar = `{{${index}}}`;
        const columnName = variableMappings[templateVar];
        if (columnName && rowData[columnName]) {
            return rowData[columnName].toString();
        }
        return match; // Keep original if no mapping found
    });
}
// GET /api/whatsapp/reports - Get detailed message reports
router.get('/reports', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { page = 1, limit = 50, dateFrom = '', dateTo = '', recipientNumber = '', template = '', status = 'all', export: exportCsv = 'false' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        // Build WHERE conditions
        let whereConditions = 'WHERE cl.user_id = $1';
        const params = [userId];
        let paramCount = 1;
        // Date range filter
        if (dateFrom && dateFrom.toString().trim()) {
            paramCount++;
            whereConditions += ` AND ml.created_at >= $${paramCount}`;
            params.push(dateFrom.toString());
        }
        if (dateTo && dateTo.toString().trim()) {
            paramCount++;
            whereConditions += ` AND ml.created_at <= $${paramCount}::date + interval '1 day'`;
            params.push(dateTo.toString());
        }
        // Recipient number filter
        if (recipientNumber && recipientNumber.toString().trim()) {
            paramCount++;
            whereConditions += ` AND ml.recipient_number ILIKE $${paramCount}`;
            params.push(`%${recipientNumber.toString().trim()}%`);
        }
        // Template filter
        if (template && template.toString().trim()) {
            paramCount++;
            whereConditions += ` AND cl.template_used = $${paramCount}`;
            params.push(template.toString());
        }
        // Status filter
        if (status && status !== 'all') {
            paramCount++;
            whereConditions += ` AND ml.status = $${paramCount}`;
            params.push(status.toString());
        }
        // Main query for reports
        const reportsQuery = `
      SELECT 
        ml.id,
        cl.campaign_name,
        cl.template_used,
        COALESCE(ubi.whatsapp_number, cl.phone_number_id) as from_number,
        ml.recipient_number,
        ml.status,
        ml.error_message,
        ml.sent_at,
        ml.delivered_at,
        ml.read_at,
        ml.created_at
      FROM campaign_logs cl
      JOIN message_logs ml ON cl.id = ml.campaign_id
      LEFT JOIN user_business_info ubi ON cl.phone_number_id = ubi.whatsapp_number_id AND cl.user_id = ubi.user_id
      ${whereConditions}
      ORDER BY ml.created_at DESC
      ${exportCsv === 'true' ? '' : `LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`}
    `;
        if (exportCsv !== 'true') {
            params.push(Number(limit), offset);
        }
        const reportsResult = await index_1.pool.query(reportsQuery, params);
        // If exporting CSV
        if (exportCsv === 'true') {
            const csvHeaders = [
                'Campaign Name',
                'Template',
                'From Number',
                'Recipient Number',
                'Status',
                'Sent At',
                'Delivered At',
                'Read At',
                'Failure Reason'
            ];
            const csvRows = reportsResult.rows.map(row => [
                `"${row.campaign_name}"`,
                `"${row.template_used}"`,
                `"${row.from_number}"`,
                `"${row.recipient_number}"`,
                `"${row.status}"`,
                `"${row.sent_at || ''}"`,
                `"${row.delivered_at || ''}"`,
                `"${row.read_at || ''}"`,
                `"${row.error_message || ''}"`
            ]);
            const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="whatsapp_reports.csv"');
            return res.send(csvContent);
        }
        // Get total count for pagination
        const countQuery = `
      SELECT COUNT(*) as total
      FROM campaign_logs cl
      JOIN message_logs ml ON cl.id = ml.campaign_id
      LEFT JOIN user_business_info ubi ON cl.phone_number_id = ubi.whatsapp_number_id AND cl.user_id = ubi.user_id
      ${whereConditions}
    `;
        const countResult = await index_1.pool.query(countQuery, params.slice(0, paramCount));
        const total = parseInt(countResult.rows[0].total);
        res.json({
            success: true,
            data: {
                reports: reportsResult.rows,
                total: total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reports'
        });
    }
});
// GET /api/whatsapp/reports/summary - Get campaign summary statistics
router.get('/reports/summary', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const summaryQuery = `
      SELECT 
        COUNT(DISTINCT cl.id) as total_campaigns,
        COUNT(ml.id) as total_messages,
        COUNT(CASE WHEN ml.status IN ('sent', 'delivered', 'read') THEN 1 END) as successful_messages,
        COUNT(CASE WHEN ml.status = 'failed' THEN 1 END) as failed_messages,
        ROUND(
          (COUNT(CASE WHEN ml.status IN ('sent', 'delivered', 'read') THEN 1 END) * 100.0) / 
          NULLIF(COUNT(ml.id), 0), 
          2
        ) as success_rate
      FROM campaign_logs cl
      LEFT JOIN message_logs ml ON cl.id = ml.campaign_id
      WHERE cl.user_id = $1
    `;
        const result = await index_1.pool.query(summaryQuery, [userId]);
        const summary = result.rows[0];
        res.json({
            success: true,
            data: {
                total_campaigns: parseInt(summary.total_campaigns) || 0,
                total_messages: parseInt(summary.total_messages) || 0,
                successful_messages: parseInt(summary.successful_messages) || 0,
                failed_messages: parseInt(summary.failed_messages) || 0,
                success_rate: parseFloat(summary.success_rate) || 0
            }
        });
    }
    catch (error) {
        console.error('Error fetching reports summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reports summary'
        });
    }
});
// GET /api/whatsapp/campaigns - Get user's campaigns
router.get('/campaigns', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const result = await index_1.pool.query(`SELECT 
        id,
        campaign_name,
        template_used,
        total_recipients,
        successful_sends,
        failed_sends,
        status,
        created_at,
        updated_at
      FROM campaign_logs 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3`, [userId, limit, offset]);
        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: result.rows.length
            }
        });
    }
    catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch campaigns'
        });
    }
});
// GET /api/whatsapp/reports/templates - Get available templates for filter dropdown
router.get('/reports/templates', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const templatesQuery = `
      SELECT DISTINCT cl.template_used
      FROM campaign_logs cl
      WHERE cl.user_id = $1
      ORDER BY cl.template_used
    `;
        const result = await index_1.pool.query(templatesQuery, [userId]);
        const templates = result.rows.map(row => row.template_used);
        res.json({
            success: true,
            data: templates
        });
    }
    catch (error) {
        console.error('Error fetching templates for filter:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch templates'
        });
    }
});
// POST /api/whatsapp/send-custom-messages - Send personalized messages using Excel data
router.post('/send-custom-messages', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { templateName, language = 'en_US', phoneNumberId, recipientColumn, variableMappings = {}, data = [] } = req.body;
        if (!templateName || !phoneNumberId || !recipientColumn || !data.length) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: templateName, phoneNumberId, recipientColumn, data'
            });
        }
        // Get user's business info
        const businessResult = await index_1.pool.query('SELECT access_token, whatsapp_number_id FROM user_business_info WHERE user_id = $1 AND whatsapp_number_id = $2 AND is_active = true', [userId, phoneNumberId]);
        if (businessResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'WhatsApp Business API credentials not configured for this phone number'
            });
        }
        const businessInfo = businessResult.rows[0];
        // Get template details
        const templateResult = await index_1.pool.query('SELECT components FROM templates WHERE user_id = $1 AND name = $2 AND language = $3', [userId, templateName, language]);
        if (templateResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }
        const template = templateResult.rows[0];
        // Create campaign log entry
        const campaignResult = await index_1.pool.query(`INSERT INTO campaign_logs 
       (user_id, campaign_name, template_used, total_recipients, status, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id`, [userId, `Custom Campaign - ${templateName}`, templateName, data.length, 'IN_PROGRESS']);
        const campaignId = campaignResult.rows[0].id;
        let successfulSends = 0;
        let failedSends = 0;
        const errors = [];
        // Process each recipient
        for (const row of data) {
            try {
                const recipient = row[recipientColumn];
                if (!recipient) {
                    failedSends++;
                    errors.push(`Missing recipient for row: ${JSON.stringify(row)}`);
                    continue;
                }
                // Prepare variables for this recipient
                const variables = {};
                Object.keys(variableMappings).forEach(variable => {
                    const columnName = variableMappings[variable];
                    if (row[columnName]) {
                        variables[variable] = row[columnName];
                    }
                });
                // Send the message
                await sendTemplateMessage(businessInfo.whatsapp_number_id, businessInfo.access_token, recipient, templateName, language, variables, template.components, campaignId.toString());
                successfulSends++;
                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            catch (error) {
                failedSends++;
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Failed to send to ${row[recipientColumn]}: ${errorMsg}`);
            }
        }
        // Update campaign log
        await index_1.pool.query(`UPDATE campaign_logs 
       SET successful_sends = $1, failed_sends = $2, status = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`, [successfulSends, failedSends, 'COMPLETED', campaignId]);
        res.json({
            success: true,
            data: {
                campaign_id: campaignId,
                sent_count: successfulSends,
                failed_count: failedSends,
                total_count: data.length,
                errors: errors.slice(0, 10) // Return first 10 errors
            }
        });
    }
    catch (error) {
        console.error('Error sending custom messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send custom messages'
        });
    }
});
exports.default = router;
//# sourceMappingURL=whatsapp.js.map