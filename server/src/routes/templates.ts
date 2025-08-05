import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
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

// FIXED: WhatsApp Cloud API Media Upload for Template Creation
const uploadMediaForTemplate = async (
  phoneNumberId: string,
  filePath: string,
  accessToken: string,
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  console.log('\n🚀 UPLOADING MEDIA FOR TEMPLATE CREATION');
  console.log('==========================================');
  console.log(`📱 Phone Number ID: ${phoneNumberId}`);
  console.log(`📁 File Path: ${filePath}`);
  console.log(`🔑 Token: ${accessToken.substring(0, 20)}...`);
  console.log(`📎 MIME Type: ${mimeType}`);

  const FormData = require('form-data');
  const form = new FormData();
  
  // CRITICAL: Upload media with is_reusable=true for template creation
  form.append('file', fs.createReadStream(filePath));
  form.append('type', mimeType);
  form.append('messaging_product', 'whatsapp');
  form.append('is_reusable', 'true'); // Essential for template creation
  
  console.log('📤 Making template media upload request...');
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/media`,
      form,
      { 
        headers: { 
          Authorization: `Bearer ${accessToken}`, 
          ...form.getHeaders() 
        } 
      }
    );
    
    console.log('✅ Template media upload successful!');
    console.log('📋 Media Handle:', response.data.id);
    console.log('📥 Full response:', JSON.stringify(response.data, null, 2));
    
    if (!response.data.id || typeof response.data.id !== 'string') {
      throw new Error(`Invalid media handle received: ${JSON.stringify(response.data)}`);
    }
    
    return response.data.id;
  } catch (error: any) {
    console.error('❌ Template media upload failed!');
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
};

// WhatsApp Media Upload API helper function (for messaging)
const uploadMediaToWhatsApp = async (
  filePath: string,
  fileName: string,
  mimeType: string,
  businessInfo: { accessToken: string; whatsapp_number_id?: string; phoneNumberId?: string }
): Promise<string> => {
  const { accessToken } = businessInfo;
  
  if (!accessToken) {
    throw new Error('WhatsApp Business API access token not configured');
  }

  // Get phone number ID from business info
  const phoneNumberId = (businessInfo as any).phoneNumberId || (businessInfo as any).whatsapp_number_id;
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
  const fileStream = fs.createReadStream(filePath);
  
  // Append fields in the exact order from working example
  formData.append('file', fileStream);
  formData.append('type', mimeType);
  formData.append('messaging_product', 'whatsapp');

  console.log(`   - FormData prepared with file stream`);
  console.log(`   - Sending to: https://graph.facebook.com/v20.0/${phoneNumberId}/media`);

  try {
    // Upload to WhatsApp Media API using axios with exact pattern
    const uploadResponse = await axios.post(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/media`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    console.log(`📥 WhatsApp Media API response status: ${uploadResponse.status}`);
    console.log(`📥 WhatsApp Media API response:`, JSON.stringify(uploadResponse.data, null, 2));
    
    console.log(`✅ Media uploaded successfully, ID: ${uploadResponse.data.id}`);
    // Return the media ID for template creation
    return uploadResponse.data.id;
  } catch (error: any) {
    console.error(`❌ Media upload failed:`, error.response?.data || error.message);
    throw new Error(`Media upload error: ${error.response?.data?.error?.message || error.message}`);
  }
};

// Create WhatsApp Template - Main function
const createWhatsAppTemplate = async (
  templateData: CreateTemplateRequest,
  businessInfo: UserBusinessInfo,
  customExamples: Record<string, string> = {}
): Promise<any> => {
  console.log('\n🚀 CREATING WHATSAPP TEMPLATE');
  console.log('==============================');
  console.log(`📋 Template Name: ${templateData.name}`);
  console.log(`📂 Category: ${templateData.category}`);
  console.log(`🌐 Language: ${templateData.language || 'en_US'}`);

  // META WHATSAPP RULES: Process components according to category-specific rules
  let processedComponents: any[] = [];

  // AUTHENTICATION: Only BODY component allowed
  if (templateData.category === 'AUTHENTICATION') {
    const bodyComponent = templateData.components.find(c => c.type === 'BODY');
    if (!bodyComponent) {
      throw new Error('AUTHENTICATION templates must have a BODY component');
    }
    
    // Process BODY with variables
    const processedBody = processVariablesInComponent(bodyComponent, customExamples);
    processedComponents = [processedBody];
    
    console.log('🔐 AUTHENTICATION template: Only BODY component included');
  }
  
  // MARKETING: Allow all components like UTILITY
  else if (templateData.category === 'MARKETING') {
    processedComponents = templateData.components.map(component => {
      // FIXED: Handle IMAGE headers with header_media_handle
      if (component.type === 'HEADER' && component.format === 'IMAGE') {
        let mediaHandle = '';
        if (component.example?.header_media_handle) {
          if (Array.isArray(component.example.header_media_handle)) {
            mediaHandle = component.example.header_media_handle[0] || '';
          } else if (typeof component.example.header_media_handle === 'string') {
            mediaHandle = component.example.header_media_handle;
          }
        } else if (component.media?.id) {
          mediaHandle = component.media.id;
        }
        
        console.log(`🔍 IMAGE HEADER DEBUG: mediaHandle = "${mediaHandle}"`);
        console.log(`🔍 IMAGE HEADER type: ${typeof mediaHandle}`);
        console.log(`🔍 IMAGE HEADER length: ${mediaHandle.length}`);
        
        // Validate media handle before using it
        if (!mediaHandle || typeof mediaHandle !== 'string' || mediaHandle.trim().length === 0) {
          throw new Error(`Invalid media handle for IMAGE template: "${mediaHandle}"`);
        }
        
        return {
          type: 'HEADER',
          format: 'IMAGE',
          example: {
            header_media_handle: [mediaHandle] // FIXED: Use header_media_handle
          }
        };
      }
      
      // Handle TEXT headers with variables
      if (component.type === 'HEADER' && component.format === 'TEXT' && component.text) {
        return processVariablesInComponent(component, customExamples);
      }
      
      // Handle BODY components with variables
      if (component.type === 'BODY' && component.text) {
        return processVariablesInComponent(component, customExamples);
      }
      
      // Handle FOOTER components
      if (component.type === 'FOOTER') {
        return {
          type: 'FOOTER',
          text: component.text
        };
      }
      
      // Handle BUTTONS components
      if (component.type === 'BUTTONS') {
        return component;
      }
      
      return component;
    });
    
    console.log('📢 MARKETING template: All components allowed');
  }
  
  // UTILITY: All components allowed
  else if (templateData.category === 'UTILITY') {
    processedComponents = templateData.components.map(component => {
      // FIXED: Handle IMAGE headers with header_media_handle
      if (component.type === 'HEADER' && component.format === 'IMAGE') {
        let mediaHandle = '';
        if (component.example?.header_media_handle) {
          if (Array.isArray(component.example.header_media_handle)) {
            mediaHandle = component.example.header_media_handle[0] || '';
          } else if (typeof component.example.header_media_handle === 'string') {
            mediaHandle = component.example.header_media_handle;
          }
        } else if (component.media?.id) {
          // Fallback to media.id if header_media_handle not available
          mediaHandle = component.media.id;
        }
        
        console.log(`🔍 UTILITY IMAGE HEADER DEBUG: mediaHandle = "${mediaHandle}"`);
        console.log(`🔍 UTILITY IMAGE HEADER type: ${typeof mediaHandle}`);
        console.log(`🔍 UTILITY IMAGE HEADER length: ${mediaHandle.length}`);
        
        // Validate media handle before using it
        if (!mediaHandle || typeof mediaHandle !== 'string' || mediaHandle.trim().length === 0) {
          throw new Error(`Invalid media handle for IMAGE template: "${mediaHandle}"`);
        }
        
        return {
          type: 'HEADER',
          format: 'IMAGE',
          example: {
            header_media_handle: [mediaHandle] // FIXED: Use header_media_handle
          }
        };
      }
      
      // Handle TEXT headers with variables
      if (component.type === 'HEADER' && component.format === 'TEXT' && component.text) {
        return processVariablesInComponent(component, customExamples);
      }
      
      // Handle BODY components with variables
      if (component.type === 'BODY' && component.text) {
        return processVariablesInComponent(component, customExamples);
      }
      
      // Handle FOOTER components
      if (component.type === 'FOOTER') {
        return {
          type: 'FOOTER',
          text: component.text
        };
      }
      
      // Handle BUTTONS components
      if (component.type === 'BUTTONS') {
        return component;
      }
      
      return component;
    });
    
    console.log('📎 UTILITY template: All components allowed');
  }

  // FIXED: Build payload without namespace (not required for Cloud API)
  const payload = {
    name: templateData.name,
    language: templateData.language || 'en_US',
    category: templateData.category,
    components: processedComponents,
    allow_category_change: templateData.allow_category_change ?? true
  };

  if (templateData.message_send_ttl_seconds) {
    (payload as any).message_send_ttl_seconds = templateData.message_send_ttl_seconds;
  }

  console.log('📤 Template creation payload (FIXED):');
  console.log(JSON.stringify(payload, null, 2));
  
  // EXTRA DEBUG: Check header_handle in payload
  const headerComponent = payload.components.find((c: any) => c.type === 'HEADER' && c.format === 'IMAGE');
  if (headerComponent) {
    console.log('🔍 FINAL PAYLOAD DEBUG - Header component:', JSON.stringify(headerComponent, null, 2));
    console.log('🔍 FINAL PAYLOAD DEBUG - header_handle value:', headerComponent.example?.header_handle);
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${businessInfo.wabaId!}/message_templates`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${businessInfo.accessToken!}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Template created successfully!');
    console.log('📥 Template response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('❌ Template creation failed!');
    console.error('❌ Error:', error.response?.data || error.message);
    
    // Check for specific media handle error
    if (error.response?.data?.error?.error_subcode === 2494102) {
      console.error('🚨 SPECIFIC ERROR: Invalid header_media_handle detected!');
      console.error('💡 This means the media handle used in header_media_handle is invalid or expired');
      throw new Error('Invalid media handle: The uploaded media handle is not valid for template creation');
    }
    
    throw error;
  }
};

// FIXED: Process variables in components - now expects {{1}}, {{2}} format from frontend
const processVariablesInComponent = (component: any, customExamples: Record<string, string> = {}): any => {
  if (!component.text) return component;
  
  // Find numerical variables like {{1}}, {{2}}, etc.
  const variableMatches = component.text.match(/\{\{\d+\}\}/g) || [];
  
  if (variableMatches.length === 0) {
    // No variables, return with simple text format (this works for all component types)
    return {
      ...component,
      text: component.text
    };
  }
  
  console.log(`🔍 Processing ${component.type} component with ${variableMatches.length} variables`);
  console.log(`📝 Text with variables: ${component.text}`);
  console.log(`🏷️ Found variables: ${variableMatches.join(', ')}`);
  
  // Generate example values for each variable using custom examples or fallback
  const exampleValues: string[] = [];
  variableMatches.forEach((variable: string) => {
    const variableNumber = variable.replace(/[{}]/g, '');
    const exampleValue = customExamples[variableNumber] || `Sample${variableNumber}`;
    exampleValues.push(exampleValue);
    console.log(`📋 Variable ${variableNumber} -> Example: "${exampleValue}"`);
  });
  
  // Build the processed component - use simple text format for all (Meta API accepts both)
  const processedComponent = {
    ...component,
    text: component.text // Keep {{1}}, {{2}} format for all component types
  };
  
  // Add the mandatory example block per Meta API requirements - EXACT FORMAT
  if (component.type === 'BODY') {
    processedComponent.example = {
      body_text: [exampleValues] // Double array: [["value1", "value2"]]
    };
    console.log(`📋 Added body_text example: ${JSON.stringify([exampleValues])}`);
  } else if (component.type === 'HEADER' && component.format === 'TEXT') {
    processedComponent.example = {
      header_text: exampleValues // Single array: ["value1"]
    };
    console.log(`📋 Added header_text example: ${JSON.stringify(exampleValues)}`);
  }
  
  return processedComponent;
};

// Helper function to generate example values based on variable names
const generateExampleValue = (variableName: string): string => {
  const lowerName = variableName.toLowerCase();
  
  // Generate contextual examples based on variable name
  if (lowerName.includes('otp') || lowerName.includes('code')) return '123456';
  if (lowerName.includes('name') || lowerName.includes('user')) return 'John Doe';
  if (lowerName.includes('amount') || lowerName.includes('price')) return '99.99';
  if (lowerName.includes('order') || lowerName.includes('id')) return '12345';
  if (lowerName.includes('date')) return '2024-08-04';
  if (lowerName.includes('time')) return '10:30 AM';
  if (lowerName.includes('phone') || lowerName.includes('number')) return '+1234567890';
  if (lowerName.includes('email')) return 'user@example.com';
  if (lowerName.includes('company') || lowerName.includes('business')) return 'Company Name';
  if (lowerName.includes('product')) return 'Product Name';
  if (lowerName.includes('service')) return 'Service Name';
  if (lowerName.includes('discount') || lowerName.includes('percent')) return '25';
  
  // Default generic example
  return `Sample${variableName.charAt(0).toUpperCase() + variableName.slice(1)}`;
};

// Get namespace helper
const getNamespace = async (wabaId: string, accessToken: string): Promise<string> => {
  console.log(`🔍 Getting namespace for WABA: ${wabaId}`);
  
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v20.0/${wabaId}?fields=message_template_namespace`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const namespace = response.data.message_template_namespace;
    console.log(`✅ Got namespace: ${namespace}`);
    return namespace;
  } catch (error: any) {
    console.error('❌ Failed to get namespace:', error.response?.data || error.message);
    throw new Error(`Failed to get namespace: ${error.response?.data?.error?.message || error.message}`);
  }
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
    const language = req.query.language as string;

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

    if (language) {
      paramCount++;
      whereClause += ` AND language = $${paramCount}`;
      params.push(language);
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
      data: templates,
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

// Create new template - WITH IMAGE UPLOAD SUPPORT
router.post('/', upload.single('headerMedia'), async (req, res) => {
  try {
    const userId = req.session.user!.id;
        const templateData: CreateTemplateRequest = req.body;
    
    // Manually construct components from form data
    const components: TemplateComponent[] = [];
    if (req.body.headerText) {
      components.push({ type: 'HEADER', format: 'TEXT', text: req.body.headerText });
    } else if (req.file) {
      // The file upload logic will handle adding the header component later
      components.push({ type: 'HEADER', format: 'IMAGE' });
    }
    
    if (req.body.bodyText) {
      components.push({ type: 'BODY', text: req.body.bodyText });
    }

    if (req.body.footerText) {
      components.push({ type: 'FOOTER', text: req.body.footerText });
    }

    if (req.body.buttons) {
      try {
        const buttons = JSON.parse(req.body.buttons);
        if (Array.isArray(buttons) && buttons.length > 0) {
          components.push({ type: 'BUTTONS', buttons: buttons });
        }
      } catch (e) {
        console.error("Error parsing buttons JSON:", e);
        // Optionally, you could return a 400 error here
      }
    }
    templateData.components = components;

    // Parse variable examples if provided
    let variableExamples: Record<string, string> = {};
    if (req.body.variableExamples) {
      try {
        variableExamples = JSON.parse(req.body.variableExamples);
        console.log('📝 Variable examples received:', variableExamples);
      } catch (e) {
        console.error("Error parsing variableExamples JSON:", e);
      }
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

    // MARKETING templates no longer require footer (all components are optional except BODY)

    let template_id: string | null = null;
    let whatsapp_response: any = null;
    let status = 'DRAFT';
    let rejection_reason: string | null = null;

    // Handle image upload for header if present
    if (req.file) {
      console.log('📄 Processing uploaded header media...');
      
      // Get user's business info for upload
      const businessResult = await pool.query(
        'SELECT waba_id, access_token, whatsapp_number_id FROM user_business_info WHERE user_id = $1 AND is_active = true',
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
        accessToken: businessResult.rows[0].access_token,
        waba_id: businessResult.rows[0].waba_id,
        phoneNumberId: businessResult.rows[0].whatsapp_number_id
      };
      
      console.log('🏢 BUSINESS INFO DEBUG:');
      console.log(`  - WABA ID: ${businessInfo.waba_id}`);
      console.log(`  - Phone Number ID: ${businessInfo.phoneNumberId}`);
      console.log(`  - Access Token: ${businessInfo.accessToken.substring(0, 20)}...`);

      try {
        // FIXED: Upload media for template creation
        const mediaHandle = await uploadMediaForTemplate(
          businessInfo.phoneNumberId,
          req.file.path,
          businessInfo.accessToken,
          req.file.mimetype
        );

        console.log('✅ Template media uploaded successfully, Handle:', mediaHandle);
        console.log('🔍 MEDIA HANDLE DEBUG: type:', typeof mediaHandle);
        console.log('🔍 MEDIA HANDLE DEBUG: length:', mediaHandle.length);
        console.log('🔍 MEDIA HANDLE DEBUG: value:', JSON.stringify(mediaHandle));

        // FIXED: Update image header component with media handle in correct format
        templateData.components = templateData.components.map(component => {
          if (component.type === 'HEADER' && component.format === 'IMAGE') {
            return {
              ...component,
              media: undefined, // Remove media property
              example: {
                header_media_handle: [mediaHandle] // FIXED: Use header_media_handle
              }
            };
          }
          return component;
        });

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

      } catch (uploadError: any) {
        console.error('❌ Media upload failed:', uploadError);
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          error: 'Failed to upload media to WhatsApp',
          details: uploadError.message
        });
      }
    }

    // If submit_to_whatsapp flag is true, try to create template in WhatsApp
    if (req.body.submit_to_whatsapp || (req.body as any).submit_to_whatsapp) {
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

        const whatsappResult = await createWhatsAppTemplate(templateData, businessInfo, variableExamples);
        template_id = whatsappResult.id;
        whatsapp_response = whatsappResult;
        status = 'PENDING';

      } catch (whatsappError: any) {
        console.error('WhatsApp API error:', whatsappError);
        // Save as draft with rejection reason if WhatsApp submission fails
        rejection_reason = whatsappError.message;
        status = 'REJECTED';
      }
    }

    // Extract media information from components if present
    let header_media_id: string | null = null;
    let header_type: string = 'NONE';
    let header_handle: string | null = null;
    let media_id: string | null = null;
    
    for (const component of templateData.components) {
      if (component.type === 'HEADER') {
        if (component.format === 'IMAGE' && component.example?.header_media_handle) {
          header_type = 'STATIC_IMAGE';
          
          // FIXED: Store the raw header_media_handle for future reference
          if (Array.isArray(component.example.header_media_handle) && component.example.header_media_handle.length > 0) {
            header_handle = component.example.header_media_handle[0];
            // Media handle is used for both template creation and messaging
            header_media_id = header_handle;
            media_id = header_handle;
          } else if (typeof component.example.header_media_handle === 'string') {
            header_handle = component.example.header_media_handle;
            header_media_id = header_handle;
            media_id = header_handle;
          }
        } else if (component.format === 'TEXT') {
          header_type = 'TEXT';
        } else if (component.format === 'VIDEO') {
          header_type = 'STATIC_VIDEO';
        } else if (component.format === 'DOCUMENT') {
          header_type = 'STATIC_DOCUMENT';
        }
        break;
      }
    }

    // Save template to database
    const result = await pool.query(
      `INSERT INTO templates 
       (user_id, name, category, language, status, components, template_id, 
        message_send_ttl_seconds, allow_category_change, whatsapp_response, rejection_reason, 
        header_media_id, header_type, header_handle, media_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, user_id, name, category, language, status, components, 
                 template_id, message_send_ttl_seconds, allow_category_change, 
                 quality_rating, rejection_reason, header_media_id, header_type, media_id, created_at, updated_at`,
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
        rejection_reason,
        header_media_id,
        header_type,
        header_handle,
        media_id
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
      if (!/^[a-z0-9_]{1,512}$/.test(updateData.name)) {
        return res.status(400).json({ 
          error: 'Template name must be 1-512 lowercase characters (a-z), numbers, or underscores' 
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

      // MARKETING templates no longer require footer (all components are optional except BODY)

      paramCount++;
      updateFields.push(`components = $${paramCount}`);
      values.push(JSON.stringify(updateData.components));

      // Extract and update media information from components
      let header_media_id: string | null = null;
      let header_type: string = 'NONE';
      let header_handle: string | null = null;
      let media_id: string | null = null;
      
      for (const component of updateData.components) {
        if (component.type === 'HEADER') {
          if (component.format === 'IMAGE' && component.example?.header_media_handle) {
            header_type = 'STATIC_IMAGE';
            
            // FIXED: Use header_media_handle
            if (Array.isArray(component.example.header_media_handle) && component.example.header_media_handle.length > 0) {
              header_handle = component.example.header_media_handle[0];
              header_media_id = header_handle;
              media_id = header_handle;
            }
          } else if (component.format === 'TEXT') {
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

      const whatsappResult = await createWhatsAppTemplate(templateData, businessInfo, {});

      // Update template with WhatsApp response
      await pool.query(
        `UPDATE templates 
         SET status = 'PENDING', template_id = $1, whatsapp_response = $2, 
             rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [whatsappResult.id, JSON.stringify(whatsappResult), id]
      );

      res.json({
        message: 'Template submitted to WhatsApp successfully',
        templateId: whatsappResult.id,
        status: 'PENDING'
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

// Upload media for template creation (using resumable upload)
router.post('/upload-template-media', upload.single('media'), async (req, res) => {
  try {
    const userId = req.session.user!.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user's business info
    const businessResult = await pool.query(
      'SELECT waba_id, access_token, whatsapp_number_id FROM user_business_info WHERE user_id = $1 AND is_active = true',
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
      accessToken: businessResult.rows[0].access_token,
      waba_id: businessResult.rows[0].waba_id,
      phoneNumberId: businessResult.rows[0].whatsapp_number_id
    } as any;

    try {
      // FIXED: Upload to WhatsApp for template creation
      const mediaHandle = await uploadMediaForTemplate(
        businessInfo.phoneNumberId,
        req.file.path,
        businessInfo.accessToken,
        req.file.mimetype
      );

      // Clean up temporary file
      fs.unlinkSync(req.file.path);

      res.json({
        message: 'Template media uploaded successfully',
        mediaHandle: mediaHandle, // FIXED: Return media handle
        mediaId: mediaHandle, // Keep for backward compatibility
        templateHandle: mediaHandle, // Keep for backward compatibility
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      });

    } catch (uploadError: any) {
      console.error('WhatsApp template media upload error:', uploadError);
      // Clean up temporary file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({
        error: 'Failed to upload template media to WhatsApp',
        details: uploadError.message
      });
    }

  } catch (error) {
    console.error('Upload template media error:', error);
    // Clean up temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload media for template header (legacy - for messaging)
router.post('/upload-media', upload.single('media'), async (req, res) => {
  try {
    const userId = req.session.user!.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user's business info
    const businessResult = await pool.query(
      'SELECT waba_id, access_token, whatsapp_number_id FROM user_business_info WHERE user_id = $1 AND is_active = true',
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
      accessToken: businessResult.rows[0].access_token,
      whatsapp_number_id: businessResult.rows[0].whatsapp_number_id
    } as any;

    try {
      // Upload to WhatsApp and get media ID
      const mediaId = await uploadMediaToWhatsApp(
        req.file.path,
        req.file.originalname,
        req.file.mimetype,
        businessInfo
      );

      // Clean up temporary file
      fs.unlinkSync(req.file.path);

      res.json({
        message: 'Media uploaded successfully',
        headerHandle: mediaId, // Keep headerHandle for backward compatibility
        mediaId: mediaId,
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