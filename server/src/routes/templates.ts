import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { pool } from '../index';
import { requireAuth } from '../middleware/auth';
import { 
  Template, 
  CreateTemplateRequest, 
  UpdateTemplateRequest,
  TemplateComponent,
  WhatsAppTemplateResponse,
  UserBusinessInfo
} from '../types';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images for now
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const router = express.Router();

// All template routes require authentication
router.use(requireAuth);

// WhatsApp Resumable Upload API helper function
const uploadMediaToWhatsApp = async (
  filePath: string,
  fileName: string,
  mimeType: string,
  businessInfo: UserBusinessInfo
): Promise<string> => {
  const { accessToken } = businessInfo;
  
  if (!accessToken) {
    throw new Error('WhatsApp Business API access token not configured');
  }

  // Read file as buffer
  const fileBuffer = fs.readFileSync(filePath);
  const fileSize = fileBuffer.length;

  // Step 1: Create upload session
  const sessionResponse = await fetch(
    'https://graph.facebook.com/v23.0/app/uploads',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_length: fileSize,
        file_type: mimeType,
        file_name: fileName
      })
    }
  );

  const sessionData = await sessionResponse.json() as any;
  
  if (!sessionResponse.ok) {
    throw new Error(`Upload session error: ${sessionData.error?.message || 'Unknown error'}`);
  }

  const { id: uploadSessionId } = sessionData;

  // Step 2: Upload file data
  const uploadResponse = await fetch(
    `https://graph.facebook.com/v23.0/${uploadSessionId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'file_offset': '0'
      },
      body: fileBuffer
    }
  );

  const uploadData = await uploadResponse.json() as any;
  
  if (!uploadResponse.ok) {
    throw new Error(`File upload error: ${uploadData.error?.message || 'Unknown error'}`);
  }

  // Return the handle for template creation
  return uploadData.h || uploadSessionId;
};

// WhatsApp Business API helper function
const createWhatsAppTemplate = async (
  templateData: CreateTemplateRequest, 
  businessInfo: UserBusinessInfo
): Promise<WhatsAppTemplateResponse> => {
  const { wabaId, accessToken } = businessInfo;
  
  if (!wabaId || !accessToken) {
    throw new Error('WhatsApp Business API credentials not configured');
  }

  const whatsappPayload = {
    name: templateData.name,
    language: templateData.language || 'en_US',
    category: templateData.category,
    components: templateData.components,
    ...(templateData.message_send_ttl_seconds && {
      message_send_ttl_seconds: templateData.message_send_ttl_seconds
    })
  };

  const response = await fetch(
    `https://graph.facebook.com/v23.0/${wabaId}/message_templates`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(whatsappPayload)
    }
  );

  const responseData = await response.json() as any;
  
  if (!response.ok) {
    throw new Error(`WhatsApp API Error: ${responseData.error?.message || 'Unknown error'}`);
  }

  return responseData as WhatsAppTemplateResponse;
};

// Get all templates for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = req.session.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const category = req.query.category as string;

    // Build the WHERE clause
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
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

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM templates ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
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
    
    const result = await pool.query(templatesQuery, [...params, limit, offset]);

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
      templates,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTemplates / limit),
        totalTemplates,
        hasNext: page < Math.ceil(totalTemplates / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific template by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.session.user!.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, user_id, name, category, language, status, components, 
              template_id, message_send_ttl_seconds, allow_category_change, 
              quality_rating, whatsapp_response, rejection_reason, created_at, updated_at
       FROM templates 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

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

  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new template
router.post('/', async (req, res) => {
  try {
    const userId = req.session.user!.id;
    const templateData: CreateTemplateRequest = req.body;

    // Validation
    if (!templateData.name || !templateData.category || !templateData.components) {
      return res.status(400).json({ 
        error: 'Name, category, and components are required' 
      });
    }

    // Validate template name (lowercase alphanumeric and underscores only)
    if (!/^[a-z0-9_]+$/.test(templateData.name)) {
      return res.status(400).json({ 
        error: 'Template name can only contain lowercase letters, numbers, and underscores' 
      });
    }

    // Check for duplicate template name for this user
    const existingTemplate = await pool.query(
      'SELECT id FROM templates WHERE user_id = $1 AND name = $2',
      [userId, templateData.name]
    );

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

    let template_id: string | null = null;
    let whatsapp_response: any = null;
    let status = 'DRAFT';
    let rejection_reason: string | null = null;

    // If submit_to_whatsapp flag is true, try to create template in WhatsApp
    if (req.body.submit_to_whatsapp) {
      try {
        // Get user's business info
        const businessResult = await pool.query(
          'SELECT waba_id, access_token FROM user_business_info WHERE user_id = $1 AND is_active = true',
          [userId]
        );

        if (businessResult.rows.length === 0) {
          return res.status(400).json({ 
            error: 'WhatsApp Business API credentials not configured. Please set up your business information first.' 
          });
        }

        const businessInfo = {
          wabaId: businessResult.rows[0].waba_id,
          accessToken: businessResult.rows[0].access_token
        } as UserBusinessInfo;

        const whatsappResult = await createWhatsAppTemplate(templateData, businessInfo);
        template_id = whatsappResult.id;
        whatsapp_response = whatsappResult;
        status = 'IN_REVIEW';

      } catch (whatsappError: any) {
        console.error('WhatsApp API error:', whatsappError);
        // Save as draft with rejection reason if WhatsApp submission fails
        rejection_reason = whatsappError.message;
        status = 'REJECTED';
      }
    }

    // Save template to database
    const result = await pool.query(
      `INSERT INTO templates 
       (user_id, name, category, language, status, components, template_id, 
        message_send_ttl_seconds, allow_category_change, whatsapp_response, rejection_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, user_id, name, category, language, status, components, 
                 template_id, message_send_ttl_seconds, allow_category_change, 
                 quality_rating, rejection_reason, created_at, updated_at`,
      [
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
        rejection_reason
      ]
    );

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

  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const userId = req.session.user!.id;
    const { id } = req.params;
    const updateData: UpdateTemplateRequest = req.body;

    // Check if template exists and belongs to user
    const existingTemplate = await pool.query(
      'SELECT * FROM templates WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

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
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (updateData.name !== undefined) {
      // Validate template name
      if (!/^[a-z0-9_]+$/.test(updateData.name)) {
        return res.status(400).json({ 
          error: 'Template name can only contain lowercase letters, numbers, and underscores' 
        });
      }

      // Check for duplicate name (excluding current template)
      const duplicateCheck = await pool.query(
        'SELECT id FROM templates WHERE user_id = $1 AND name = $2 AND id != $3',
        [userId, updateData.name, id]
      );

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

      paramCount++;
      updateFields.push(`components = $${paramCount}`);
      values.push(JSON.stringify(updateData.components));
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

    const result = await pool.query(query, values);
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

  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit template to WhatsApp for approval
router.post('/:id/submit', async (req, res) => {
  try {
    const userId = req.session.user!.id;
    const { id } = req.params;

    // Get template
    const templateResult = await pool.query(
      'SELECT * FROM templates WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

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
    const businessResult = await pool.query(
      'SELECT waba_id, access_token FROM user_business_info WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (businessResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'WhatsApp Business API credentials not configured. Please set up your business information first.' 
      });
    }

    const businessInfo = {
      wabaId: businessResult.rows[0].waba_id,
      accessToken: businessResult.rows[0].access_token
    } as UserBusinessInfo;

    try {
      const templateData: CreateTemplateRequest = {
        name: template.name,
        category: template.category,
        language: template.language,
        components: template.components,
        message_send_ttl_seconds: template.message_send_ttl_seconds,
        allow_category_change: template.allow_category_change
      };

      const whatsappResult = await createWhatsAppTemplate(templateData, businessInfo);

      // Update template with WhatsApp response
      await pool.query(
        `UPDATE templates 
         SET status = 'IN_REVIEW', template_id = $1, whatsapp_response = $2, 
             rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [whatsappResult.id, JSON.stringify(whatsappResult), id]
      );

      res.json({
        message: 'Template submitted to WhatsApp successfully',
        templateId: whatsappResult.id,
        status: 'IN_REVIEW'
      });

    } catch (whatsappError: any) {
      console.error('WhatsApp submission error:', whatsappError);
      
      // Update template with rejection reason
      await pool.query(
        `UPDATE templates 
         SET status = 'REJECTED', rejection_reason = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [whatsappError.message, id]
      );

      res.status(400).json({
        error: 'Failed to submit template to WhatsApp',
        details: whatsappError.message
      });
    }

  } catch (error) {
    console.error('Submit template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.session.user!.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM templates WHERE id = $1 AND user_id = $2 RETURNING id, name',
      [id, userId]
    );

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

  } catch (error) {
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
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(text)) !== null) {
      const variableName = match[1];
      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }
    }

    res.json({ variables });

  } catch (error) {
    console.error('Extract variables error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload media for template header
router.post('/upload-media', upload.single('media'), async (req, res) => {
  try {
    const userId = req.session.user!.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user's business info
    const businessResult = await pool.query(
      'SELECT waba_id, access_token FROM user_business_info WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (businessResult.rows.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'WhatsApp Business API credentials not configured. Please set up your business information first.' 
      });
    }

    const businessInfo = {
      wabaId: businessResult.rows[0].waba_id,
      accessToken: businessResult.rows[0].access_token
    } as UserBusinessInfo;

    try {
      // Upload to WhatsApp and get header handle
      const headerHandle = await uploadMediaToWhatsApp(
        req.file.path,
        req.file.originalname,
        req.file.mimetype,
        businessInfo
      );

      // Clean up temporary file
      fs.unlinkSync(req.file.path);

      res.json({
        message: 'Media uploaded successfully',
        headerHandle,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      });

    } catch (uploadError: any) {
      console.error('WhatsApp media upload error:', uploadError);
      // Clean up temporary file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({
        error: 'Failed to upload media to WhatsApp',
        details: uploadError.message
      });
    }

  } catch (error) {
    console.error('Upload media error:', error);
    // Clean up temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;