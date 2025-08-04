"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
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
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow images for now
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
const router = express_1.default.Router();
// All template routes require authentication
router.use(auth_1.requireAuth);
// WhatsApp Cloud API Media Upload - WORKING IMPLEMENTATION
const uploadMedia = async (phoneNumberId, filePath, accessToken) => {
    console.log('\n🚀 UPLOADING MEDIA TO WHATSAPP CLOUD API');
    console.log('============================================');
    console.log(`📱 Phone Number ID: ${phoneNumberId}`);
    console.log(`📁 File Path: ${filePath}`);
    console.log(`🔑 Token: ${accessToken.substring(0, 20)}...`);
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs_1.default.createReadStream(filePath));
    form.append('type', 'image/png');
    form.append('messaging_product', 'whatsapp');
    console.log('📤 Making upload request...');
    try {
        const resp = await axios_1.default.post(`https://graph.facebook.com/v20.0/${phoneNumberId}/media`, form, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                ...form.getHeaders()
            }
        });
        console.log('✅ Upload successful!');
        console.log('📋 Media ID:', resp.data.id);
        console.log('📥 Full response:', JSON.stringify(resp.data, null, 2));
        return resp.data.id;
    }
    catch (error) {
        console.error('❌ Upload failed!');
        console.error('❌ Error:', error.response?.data || error.message);
        throw error;
    }
};
// WhatsApp Media Upload API helper function (for messaging)
const uploadMediaToWhatsApp = async (filePath, fileName, mimeType, businessInfo) => {
    const { accessToken } = businessInfo;
    if (!accessToken) {
        throw new Error('WhatsApp Business API access token not configured');
    }
    // Get phone number ID from business info
    const phoneNumberId = businessInfo.phoneNumberId || businessInfo.whatsapp_number_id;
    if (!phoneNumberId) {
        throw new Error('WhatsApp phone number ID not configured');
    }
    console.log(`📤 Uploading media to WhatsApp:`);
    console.log(`   - Phone Number ID: ${phoneNumberId}`);
    console.log(`   - File: ${fileName} (${mimeType})`);
    // Create FormData for the upload using the EXACT working pattern
    const FormData = require('form-data');
    const formData = new FormData();
    // Read file as stream (not buffer) - this is key!
    const fileStream = fs_1.default.createReadStream(filePath);
    // Append fields in the exact order from working example
    formData.append('file', fileStream);
    formData.append('type', mimeType);
    formData.append('messaging_product', 'whatsapp');
    console.log(`   - FormData prepared with file stream`);
    console.log(`   - Sending to: https://graph.facebook.com/v20.0/${phoneNumberId}/media`);
    try {
        // Upload to WhatsApp Media API using axios with exact pattern
        const uploadResponse = await axios_1.default.post(`https://graph.facebook.com/v20.0/${phoneNumberId}/media`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${accessToken}`
            }
        });
        console.log(`📥 WhatsApp Media API response status: ${uploadResponse.status}`);
        console.log(`📥 WhatsApp Media API response:`, JSON.stringify(uploadResponse.data, null, 2));
        console.log(`✅ Media uploaded successfully, ID: ${uploadResponse.data.id}`);
        // Return the media ID for template creation
        return uploadResponse.data.id;
    }
    catch (error) {
        console.error(`❌ Media upload failed:`, error.response?.data || error.message);
        throw new Error(`Media upload error: ${error.response?.data?.error?.message || error.message}`);
    }
};
// Create WhatsApp Template - Main function
const createWhatsAppTemplate = async (templateData, businessInfo) => {
    console.log('\n🚀 CREATING WHATSAPP TEMPLATE');
    console.log('==============================');
    console.log(`📋 Template Name: ${templateData.name}`);
    console.log(`📂 Category: ${templateData.category}`);
    console.log(`🌐 Language: ${templateData.language || 'en_US'}`);
    // Get namespace
    const namespace = await getNamespace(businessInfo.wabaId, businessInfo.accessToken);
    // Process components to fix image headers
    const processedComponents = templateData.components.map(component => {
        if (component.type === 'HEADER' && component.format === 'IMAGE') {
            let mediaId = '';
            // Handle different media ID formats
            if (component.media?.id) {
                mediaId = component.media.id;
            }
            else if (component.example?.header_handle) {
                if (Array.isArray(component.example.header_handle)) {
                    mediaId = component.example.header_handle[0] || '';
                }
                else if (typeof component.example.header_handle === 'string') {
                    mediaId = component.example.header_handle;
                }
            }
            return {
                ...component,
                media: undefined, // Remove media property
                example: {
                    header_handle: [mediaId] // Must be array of handles
                }
            };
        }
        return component;
    });
    // Add footer for marketing templates
    const hasFooter = processedComponents.some(c => c.type === 'FOOTER');
    if (templateData.category === 'MARKETING' && !hasFooter) {
        processedComponents.push({
            type: 'FOOTER',
            text: 'This is a promotional message' // Default footer text
        });
    }
    // Build payload
    const payload = {
        name: templateData.name,
        language: templateData.language || 'en_US',
        category: templateData.category,
        namespace,
        components: processedComponents,
        allow_category_change: templateData.allow_category_change ?? true
    };
    if (templateData.message_send_ttl_seconds) {
        payload.message_send_ttl_seconds = templateData.message_send_ttl_seconds;
    }
    console.log('📤 Template creation payload:');
    console.log(JSON.stringify(payload, null, 2));
    try {
        const response = await axios_1.default.post(`https://graph.facebook.com/v20.0/${businessInfo.wabaId}/message_templates`, payload, {
            headers: {
                'Authorization': `Bearer ${businessInfo.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Template created successfully!');
        console.log('📥 Template response:', JSON.stringify(response.data, null, 2));
        return response.data;
    }
    catch (error) {
        console.error('❌ Template creation failed!');
        console.error('❌ Error:', error.response?.data || error.message);
        throw error;
    }
};
// Get namespace helper
const getNamespace = async (wabaId, accessToken) => {
    console.log(`🔍 Getting namespace for WABA: ${wabaId}`);
    try {
        const response = await axios_1.default.get(`https://graph.facebook.com/v20.0/${wabaId}?fields=message_template_namespace`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const namespace = response.data.message_template_namespace;
        console.log(`✅ Got namespace: ${namespace}`);
        return namespace;
    }
    catch (error) {
        console.error('❌ Failed to get namespace:', error.response?.data || error.message);
        throw new Error(`Failed to get namespace: ${error.response?.data?.error?.message || error.message}`);
    }
};
// Get all templates for the authenticated user
router.get('/', async (req, res) => {
    try {
        const userId = req.session.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const category = req.query.category;
        const language = req.query.language;
        // Build the WHERE clause
        let whereClause = 'WHERE user_id = $1';
        const params = [userId];
        let paramCount = 1;
        if (status) {
            paramCount++;
            whereClause += ` AND status = $${paramCount}`;
            params.push(status);
        }
        if (category) {
            paramCount++;
            whereClause += ` AND category = $${paramCount}`;
            params.push(category);
        }
        if (language) {
            paramCount++;
            whereClause += ` AND language = $${paramCount}`;
            params.push(language);
        }
        // Get total count
        const countQuery = `SELECT COUNT(*) FROM templates ${whereClause}`;
        const countResult = await index_1.pool.query(countQuery, params);
        const totalTemplates = parseInt(countResult.rows[0].count);
        // Get templates
        const templatesQuery = `
      SELECT id, user_id, name, category, language, status, components, 
             template_id, message_send_ttl_seconds, allow_category_change, 
             quality_rating, rejection_reason, created_at, updated_at
      FROM templates 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
        const result = await index_1.pool.query(templatesQuery, [...params, limit, offset]);
        const templates = result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            category: row.category,
            language: row.language,
            status: row.status,
            components: row.components,
            templateId: row.template_id,
            messageSendTtlSeconds: row.message_send_ttl_seconds,
            allowCategoryChange: row.allow_category_change,
            qualityRating: row.quality_rating,
            rejectionReason: row.rejection_reason,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
        res.json({
            data: templates,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalTemplates / limit),
                totalTemplates,
                hasNext: page < Math.ceil(totalTemplates / limit),
                hasPrev: page > 1
            }
        });
    }
    catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get specific template by ID
router.get('/:id', async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { id } = req.params;
        const result = await index_1.pool.query(`SELECT id, user_id, name, category, language, status, components, 
              template_id, message_send_ttl_seconds, allow_category_change, 
              quality_rating, whatsapp_response, rejection_reason, created_at, updated_at
       FROM templates 
       WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        const row = result.rows[0];
        const template = {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            category: row.category,
            language: row.language,
            status: row.status,
            components: row.components,
            templateId: row.template_id,
            messageSendTtlSeconds: row.message_send_ttl_seconds,
            allowCategoryChange: row.allow_category_change,
            qualityRating: row.quality_rating,
            whatsappResponse: row.whatsapp_response,
            rejectionReason: row.rejection_reason,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
        res.json({ template });
    }
    catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create new template - WITH IMAGE UPLOAD SUPPORT
router.post('/', upload.single('headerMedia'), async (req, res) => {
    try {
        const userId = req.session.user.id;
        let templateData;
        // Parse template data from request
        if (typeof req.body.templateData === 'string') {
            templateData = JSON.parse(req.body.templateData);
        }
        else {
            templateData = req.body;
        }
        // Validation
        if (!templateData.name || !templateData.category || !templateData.components) {
            return res.status(400).json({
                error: 'Name, category, and components are required'
            });
        }
        // Validate template name format
        if (!/^[a-z0-9_]{1,512}$/.test(templateData.name)) {
            return res.status(400).json({
                error: 'Template name must be 1-512 lowercase characters (a-z), numbers, or underscores'
            });
        }
        // Check for duplicate template name for this user
        const existingTemplate = await index_1.pool.query('SELECT id FROM templates WHERE user_id = $1 AND name = $2', [userId, templateData.name]);
        if (existingTemplate.rows.length > 0) {
            return res.status(409).json({
                error: 'A template with this name already exists'
            });
        }
        // Validate components
        const hasBody = templateData.components.some(c => c.type === 'BODY');
        if (!hasBody) {
            return res.status(400).json({
                error: 'Template must have at least one BODY component'
            });
        }
        // Marketing templates require footer
        const hasFooter = templateData.components.some(c => c.type === 'FOOTER');
        if (templateData.category === 'MARKETING' && !hasFooter) {
            return res.status(400).json({
                error: 'MARKETING templates require a FOOTER component with opt-out text'
            });
        }
        let template_id = null;
        let whatsapp_response = null;
        let status = 'DRAFT';
        let rejection_reason = null;
        // Handle image upload for header if present
        if (req.file) {
            console.log('📄 Processing uploaded header media...');
            // Get user's business info for upload
            const businessResult = await index_1.pool.query('SELECT waba_id, access_token, whatsapp_number_id FROM user_business_info WHERE user_id = $1 AND is_active = true', [userId]);
            if (businessResult.rows.length === 0) {
                // Clean up uploaded file
                fs_1.default.unlinkSync(req.file.path);
                return res.status(400).json({
                    error: 'WhatsApp Business API credentials not configured. Please set up your business information first.'
                });
            }
            const businessInfo = {
                accessToken: businessResult.rows[0].access_token,
                waba_id: businessResult.rows[0].waba_id,
                phoneNumberId: businessResult.rows[0].whatsapp_number_id
            };
            try {
                // Upload media using Cloud API
                const mediaId = await uploadMedia(businessInfo.phoneNumberId, req.file.path, businessInfo.accessToken);
                console.log('✅ Media uploaded successfully, ID:', mediaId);
                // Update image header component with media ID in correct format
                templateData.components = templateData.components.map(component => {
                    if (component.type === 'HEADER' && component.format === 'IMAGE') {
                        return {
                            ...component,
                            media: undefined, // Remove media property
                            example: {
                                header_handle: [mediaId] // Must be array
                            }
                        };
                    }
                    return component;
                });
                // Clean up uploaded file
                fs_1.default.unlinkSync(req.file.path);
            }
            catch (uploadError) {
                console.error('❌ Media upload failed:', uploadError);
                // Clean up uploaded file
                if (fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                return res.status(400).json({
                    error: 'Failed to upload media to WhatsApp',
                    details: uploadError.message
                });
            }
        }
        // If submit_to_whatsapp flag is true, try to create template in WhatsApp
        if (req.body.submit_to_whatsapp || req.body.submit_to_whatsapp) {
            try {
                // Get user's business info
                const businessResult = await index_1.pool.query('SELECT waba_id, access_token FROM user_business_info WHERE user_id = $1 AND is_active = true', [userId]);
                if (businessResult.rows.length === 0) {
                    return res.status(400).json({
                        error: 'WhatsApp Business API credentials not configured. Please set up your business information first.'
                    });
                }
                const businessInfo = {
                    wabaId: businessResult.rows[0].waba_id,
                    accessToken: businessResult.rows[0].access_token
                };
                const whatsappResult = await createWhatsAppTemplate(templateData, businessInfo);
                template_id = whatsappResult.id;
                whatsapp_response = whatsappResult;
                status = 'IN_REVIEW';
            }
            catch (whatsappError) {
                console.error('WhatsApp API error:', whatsappError);
                // Save as draft with rejection reason if WhatsApp submission fails
                rejection_reason = whatsappError.message;
                status = 'REJECTED';
            }
        }
        // Extract media information from components if present
        let header_media_id = null;
        let header_type = 'NONE';
        let header_handle = null;
        let media_id = null;
        for (const component of templateData.components) {
            if (component.type === 'HEADER') {
                if (component.format === 'IMAGE' && component.example?.header_handle) {
                    header_type = 'STATIC_IMAGE';
                    // Store the raw header_handle for future reference
                    if (Array.isArray(component.example.header_handle) && component.example.header_handle.length > 0) {
                        header_handle = component.example.header_handle[0];
                        // Extract the actual media_id from the header_handle
                        // Format: "4::base64data:ARxxxxxx:e:timestamp:app_id:media_id:ARxxxxxx"
                        if (typeof header_handle === 'string' && header_handle.includes(':')) {
                            const parts = header_handle.split(':');
                            if (parts.length >= 7) {
                                media_id = parts[6]; // The media_id is usually at index 6
                                header_media_id = media_id; // Use the extracted media_id
                            }
                            else {
                                // Fallback: use the header_handle as media_id if parsing fails
                                header_media_id = header_handle;
                                media_id = header_handle;
                            }
                        }
                    }
                    else if (typeof component.example.header_handle === 'string') {
                        header_handle = component.example.header_handle;
                        header_media_id = header_handle;
                        media_id = header_handle;
                    }
                }
                else if (component.format === 'TEXT') {
                    header_type = 'TEXT';
                }
                else if (component.format === 'VIDEO') {
                    header_type = 'STATIC_VIDEO';
                }
                else if (component.format === 'DOCUMENT') {
                    header_type = 'STATIC_DOCUMENT';
                }
                break;
            }
        }
        // Save template to database
        const result = await index_1.pool.query(`INSERT INTO templates 
       (user_id, name, category, language, status, components, template_id, 
        message_send_ttl_seconds, allow_category_change, whatsapp_response, rejection_reason, 
        header_media_id, header_type, header_handle, media_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, user_id, name, category, language, status, components, 
                 template_id, message_send_ttl_seconds, allow_category_change, 
                 quality_rating, rejection_reason, header_media_id, header_type, media_id, created_at, updated_at`, [
            userId,
            templateData.name,
            templateData.category,
            templateData.language || 'en_US',
            status,
            JSON.stringify(templateData.components),
            template_id,
            templateData.message_send_ttl_seconds,
            templateData.allow_category_change ?? true,
            whatsapp_response ? JSON.stringify(whatsapp_response) : null,
            rejection_reason,
            header_media_id,
            header_type,
            header_handle,
            media_id
        ]);
        const newTemplate = result.rows[0];
        res.status(201).json({
            message: 'Template created successfully',
            template: {
                id: newTemplate.id,
                userId: newTemplate.user_id,
                name: newTemplate.name,
                category: newTemplate.category,
                language: newTemplate.language,
                status: newTemplate.status,
                components: newTemplate.components,
                templateId: newTemplate.template_id,
                messageSendTtlSeconds: newTemplate.message_send_ttl_seconds,
                allowCategoryChange: newTemplate.allow_category_change,
                qualityRating: newTemplate.quality_rating,
                rejectionReason: newTemplate.rejection_reason,
                createdAt: newTemplate.created_at,
                updatedAt: newTemplate.updated_at
            }
        });
    }
    catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update template
router.put('/:id', async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { id } = req.params;
        const updateData = req.body;
        // Check if template exists and belongs to user
        const existingTemplate = await index_1.pool.query('SELECT * FROM templates WHERE id = $1 AND user_id = $2', [id, userId]);
        if (existingTemplate.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        const template = existingTemplate.rows[0];
        // Can only update DRAFT or REJECTED templates
        if (!['DRAFT', 'REJECTED'].includes(template.status)) {
            return res.status(400).json({
                error: 'Can only edit draft or rejected templates'
            });
        }
        // Build dynamic update query
        const updateFields = [];
        const values = [];
        let paramCount = 0;
        if (updateData.name !== undefined) {
            // Validate template name
            if (!/^[a-z0-9_]{1,512}$/.test(updateData.name)) {
                return res.status(400).json({
                    error: 'Template name must be 1-512 lowercase characters (a-z), numbers, or underscores'
                });
            }
            // Check for duplicate name (excluding current template)
            const duplicateCheck = await index_1.pool.query('SELECT id FROM templates WHERE user_id = $1 AND name = $2 AND id != $3', [userId, updateData.name, id]);
            if (duplicateCheck.rows.length > 0) {
                return res.status(409).json({
                    error: 'A template with this name already exists'
                });
            }
            paramCount++;
            updateFields.push(`name = $${paramCount}`);
            values.push(updateData.name);
        }
        if (updateData.category !== undefined) {
            paramCount++;
            updateFields.push(`category = $${paramCount}`);
            values.push(updateData.category);
        }
        if (updateData.language !== undefined) {
            paramCount++;
            updateFields.push(`language = $${paramCount}`);
            values.push(updateData.language);
        }
        if (updateData.components !== undefined) {
            // Validate components
            const hasBody = updateData.components.some(c => c.type === 'BODY');
            if (!hasBody) {
                return res.status(400).json({
                    error: 'Template must have at least one BODY component'
                });
            }
            // Marketing templates require footer
            const hasFooter = updateData.components.some(c => c.type === 'FOOTER');
            if (updateData.category === 'MARKETING' && !hasFooter) {
                return res.status(400).json({
                    error: 'MARKETING templates require a FOOTER component with opt-out text'
                });
            }
            paramCount++;
            updateFields.push(`components = $${paramCount}`);
            values.push(JSON.stringify(updateData.components));
            // Extract and update media information from components
            let header_media_id = null;
            let header_type = 'NONE';
            let header_handle = null;
            let media_id = null;
            for (const component of updateData.components) {
                if (component.type === 'HEADER') {
                    if (component.format === 'IMAGE' && component.example?.header_handle) {
                        header_type = 'STATIC_IMAGE';
                        if (Array.isArray(component.example.header_handle) && component.example.header_handle.length > 0) {
                            header_handle = component.example.header_handle[0];
                            if (typeof header_handle === 'string' && header_handle.includes(':')) {
                                const parts = header_handle.split(':');
                                if (parts.length >= 7) {
                                    media_id = parts[6];
                                    header_media_id = media_id;
                                }
                                else {
                                    header_media_id = header_handle;
                                    media_id = header_handle;
                                }
                            }
                        }
                    }
                    else if (component.format === 'TEXT') {
                        header_type = 'TEXT';
                    }
                    break;
                }
            }
            // Update media-related fields
            paramCount++;
            updateFields.push(`header_media_id = $${paramCount}`);
            values.push(header_media_id);
            paramCount++;
            updateFields.push(`header_type = $${paramCount}`);
            values.push(header_type);
            paramCount++;
            updateFields.push(`header_handle = $${paramCount}`);
            values.push(header_handle);
            paramCount++;
            updateFields.push(`media_id = $${paramCount}`);
            values.push(media_id);
        }
        if (updateData.message_send_ttl_seconds !== undefined) {
            paramCount++;
            updateFields.push(`message_send_ttl_seconds = $${paramCount}`);
            values.push(updateData.message_send_ttl_seconds);
        }
        if (updateData.allow_category_change !== undefined) {
            paramCount++;
            updateFields.push(`allow_category_change = $${paramCount}`);
            values.push(updateData.allow_category_change);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        // Reset status to DRAFT and clear WhatsApp-related fields when editing
        updateFields.push(`status = $${paramCount + 1}`);
        updateFields.push(`template_id = $${paramCount + 2}`);
        updateFields.push(`whatsapp_response = $${paramCount + 3}`);
        updateFields.push(`rejection_reason = $${paramCount + 4}`);
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push('DRAFT', null, null, null);
        values.push(id);
        const query = `
      UPDATE templates 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount + 5}
      RETURNING id, user_id, name, category, language, status, components, 
                template_id, message_send_ttl_seconds, allow_category_change, 
                quality_rating, rejection_reason, created_at, updated_at
    `;
        const result = await index_1.pool.query(query, values);
        const updatedTemplate = result.rows[0];
        res.json({
            message: 'Template updated successfully',
            template: {
                id: updatedTemplate.id,
                userId: updatedTemplate.user_id,
                name: updatedTemplate.name,
                category: updatedTemplate.category,
                language: updatedTemplate.language,
                status: updatedTemplate.status,
                components: updatedTemplate.components,
                templateId: updatedTemplate.template_id,
                messageSendTtlSeconds: updatedTemplate.message_send_ttl_seconds,
                allowCategoryChange: updatedTemplate.allow_category_change,
                qualityRating: updatedTemplate.quality_rating,
                rejectionReason: updatedTemplate.rejection_reason,
                createdAt: updatedTemplate.created_at,
                updatedAt: updatedTemplate.updated_at
            }
        });
    }
    catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Submit template to WhatsApp for approval
router.post('/:id/submit', async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { id } = req.params;
        // Get template
        const templateResult = await index_1.pool.query('SELECT * FROM templates WHERE id = $1 AND user_id = $2', [id, userId]);
        if (templateResult.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        const template = templateResult.rows[0];
        // Can only submit DRAFT or REJECTED templates
        if (!['DRAFT', 'REJECTED'].includes(template.status)) {
            return res.status(400).json({
                error: 'Can only submit draft or rejected templates'
            });
        }
        // Get user's business info
        const businessResult = await index_1.pool.query('SELECT waba_id, access_token FROM user_business_info WHERE user_id = $1 AND is_active = true', [userId]);
        if (businessResult.rows.length === 0) {
            return res.status(400).json({
                error: 'WhatsApp Business API credentials not configured. Please set up your business information first.'
            });
        }
        const businessInfo = {
            wabaId: businessResult.rows[0].waba_id,
            accessToken: businessResult.rows[0].access_token
        };
        try {
            const templateData = {
                name: template.name,
                category: template.category,
                language: template.language,
                components: template.components,
                message_send_ttl_seconds: template.message_send_ttl_seconds,
                allow_category_change: template.allow_category_change
            };
            const whatsappResult = await createWhatsAppTemplate(templateData, businessInfo);
            // Update template with WhatsApp response
            await index_1.pool.query(`UPDATE templates 
         SET status = 'IN_REVIEW', template_id = $1, whatsapp_response = $2, 
             rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`, [whatsappResult.id, JSON.stringify(whatsappResult), id]);
            res.json({
                message: 'Template submitted to WhatsApp successfully',
                templateId: whatsappResult.id,
                status: 'IN_REVIEW'
            });
        }
        catch (whatsappError) {
            console.error('WhatsApp submission error:', whatsappError);
            // Update template with rejection reason
            await index_1.pool.query(`UPDATE templates 
         SET status = 'REJECTED', rejection_reason = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`, [whatsappError.message, id]);
            res.status(400).json({
                error: 'Failed to submit template to WhatsApp',
                details: whatsappError.message
            });
        }
    }
    catch (error) {
        console.error('Submit template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete template
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { id } = req.params;
        const result = await index_1.pool.query('DELETE FROM templates WHERE id = $1 AND user_id = $2 RETURNING id, name', [id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        const deletedTemplate = result.rows[0];
        res.json({
            message: 'Template deleted successfully',
            deletedTemplate: {
                id: deletedTemplate.id,
                name: deletedTemplate.name
            }
        });
    }
    catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get template variables from text content
router.post('/variables', (req, res) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text content is required' });
        }
        // Extract variables in {{variable_name}} format
        const variableRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
        const variables = [];
        let match;
        while ((match = variableRegex.exec(text)) !== null) {
            const variableName = match[1];
            if (!variables.includes(variableName)) {
                variables.push(variableName);
            }
        }
        res.json({ variables });
    }
    catch (error) {
        console.error('Extract variables error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Upload media for template creation (using resumable upload)
router.post('/upload-template-media', upload.single('media'), async (req, res) => {
    try {
        const userId = req.session.user.id;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Get user's business info
        const businessResult = await index_1.pool.query('SELECT waba_id, access_token, whatsapp_number_id FROM user_business_info WHERE user_id = $1 AND is_active = true', [userId]);
        if (businessResult.rows.length === 0) {
            // Clean up uploaded file
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({
                error: 'WhatsApp Business API credentials not configured. Please set up your business information first.'
            });
        }
        const businessInfo = {
            wabaId: businessResult.rows[0].waba_id,
            accessToken: businessResult.rows[0].access_token,
            waba_id: businessResult.rows[0].waba_id,
            phoneNumberId: businessResult.rows[0].whatsapp_number_id
        };
        try {
            // Upload to WhatsApp using Cloud API media upload
            const mediaId = await uploadMedia(businessInfo.phoneNumberId, req.file.path, businessInfo.accessToken);
            // Clean up temporary file
            fs_1.default.unlinkSync(req.file.path);
            res.json({
                message: 'Template media uploaded successfully',
                mediaId: mediaId,
                templateHandle: mediaId, // Keep for backward compatibility
                fileName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size
            });
        }
        catch (uploadError) {
            console.error('WhatsApp template media upload error:', uploadError);
            // Clean up temporary file
            if (fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            res.status(400).json({
                error: 'Failed to upload template media to WhatsApp',
                details: uploadError.message
            });
        }
    }
    catch (error) {
        console.error('Upload template media error:', error);
        // Clean up temporary file if it exists
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Upload media for template header (legacy - for messaging)
router.post('/upload-media', upload.single('media'), async (req, res) => {
    try {
        const userId = req.session.user.id;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Get user's business info
        const businessResult = await index_1.pool.query('SELECT waba_id, access_token, whatsapp_number_id FROM user_business_info WHERE user_id = $1 AND is_active = true', [userId]);
        if (businessResult.rows.length === 0) {
            // Clean up uploaded file
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({
                error: 'WhatsApp Business API credentials not configured. Please set up your business information first.'
            });
        }
        const businessInfo = {
            wabaId: businessResult.rows[0].waba_id,
            accessToken: businessResult.rows[0].access_token,
            whatsapp_number_id: businessResult.rows[0].whatsapp_number_id
        };
        try {
            // Upload to WhatsApp and get media ID
            const mediaId = await uploadMediaToWhatsApp(req.file.path, req.file.originalname, req.file.mimetype, businessInfo);
            // Clean up temporary file
            fs_1.default.unlinkSync(req.file.path);
            res.json({
                message: 'Media uploaded successfully',
                headerHandle: mediaId, // Keep headerHandle for backward compatibility
                mediaId: mediaId,
                fileName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size
            });
        }
        catch (uploadError) {
            console.error('WhatsApp media upload error:', uploadError);
            // Clean up temporary file
            if (fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            res.status(400).json({
                error: 'Failed to upload media to WhatsApp',
                details: uploadError.message
            });
        }
    }
    catch (error) {
        console.error('Upload media error:', error);
        // Clean up temporary file if it exists
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=templates.js.map