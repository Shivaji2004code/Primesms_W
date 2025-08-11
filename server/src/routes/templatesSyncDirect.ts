// Direct Template Sync for Immediate Status Fix
import { Router } from 'express';
import { templatesRepo, userBusinessRepo } from '../repos/templatesRepo';
import { fetchAllTemplatesFromGraph } from '../services/waGraph';
import { sseHub } from '../services/sseBroadcaster';
import pool from '../db';

const router = Router();

/**
 * POST /api/templates/sync-direct/:userId
 * Immediate template sync - bypass webhooks entirely
 * This fetches ALL templates from Meta and force updates the database
 */
router.post('/api/templates/sync-direct/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔄 [DIRECT_SYNC] Starting direct sync for user ${userId}`);

    // Get user's WABA credentials
    const creds = await userBusinessRepo.getCredsByUserId(userId);
    if (!creds?.wabaId || !creds?.accessToken) {
      return res.status(400).json({ 
        error: 'Missing WABA credentials',
        message: 'WhatsApp Business API credentials not configured for this user',
        userId
      });
    }

    console.log(`🔍 [DIRECT_SYNC] Found credentials for user ${userId}: WABA ${creds.wabaId}`);

    // Fetch all templates from Meta Graph API
    const metaTemplates = await fetchAllTemplatesFromGraph(creds.wabaId, creds.accessToken);
    
    if (metaTemplates.length === 0) {
      return res.json({
        success: true,
        message: 'No templates found in Meta for this user',
        userId,
        wabaId: creds.wabaId,
        updated: 0,
        items: []
      });
    }

    console.log(`📋 [DIRECT_SYNC] Found ${metaTemplates.length} templates in Meta`);

    const updates = [];
    let updateCount = 0;

    // Process each template from Meta
    for (const metaTemplate of metaTemplates) {
      try {
        const templateData = {
          userId,
          name: metaTemplate.name,
          language: metaTemplate.language,
          status: String(metaTemplate.status || 'UNKNOWN').toUpperCase(),
          category: metaTemplate.category ? String(metaTemplate.category).toUpperCase() : 'UTILITY',
          reason: metaTemplate.reason || null,
          reviewedAt: metaTemplate.reviewedAt || new Date()
        };

        console.log(`🔄 [DIRECT_SYNC] Processing: ${templateData.name} -> ${templateData.status}`);

        // Update database directly
        await templatesRepo.upsertStatusAndCategory(templateData);
        updateCount++;

        // Emit SSE event
        sseHub.emitTemplate(userId, {
          type: 'template_update',
          name: templateData.name,
          language: templateData.language,
          status: templateData.status,
          category: templateData.category,
          reason: templateData.reason,
          at: new Date().toISOString(),
          source: 'direct_sync'
        });

        updates.push({
          name: templateData.name,
          language: templateData.language,
          status: templateData.status,
          category: templateData.category,
          metaStatus: metaTemplate.status
        });

      } catch (error) {
        console.error(`❌ [DIRECT_SYNC] Error updating ${metaTemplate.name}:`, error);
      }
    }

    console.log(`✅ [DIRECT_SYNC] Completed: ${updateCount} templates updated for user ${userId}`);

    res.json({
      success: true,
      message: `Direct sync completed: ${updateCount} templates updated`,
      userId,
      wabaId: creds.wabaId,
      updated: updateCount,
      items: updates,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [DIRECT_SYNC] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Direct sync failed',
      message: error?.message || String(error),
      userId: req.params.userId
    });
  }
});

/**
 * GET /api/templates/compare/:userId
 * Compare database vs Meta status for all templates
 */
router.get('/api/templates/compare/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🔍 [COMPARE] Comparing templates for user ${userId}`);

    // Get user credentials
    const creds = await userBusinessRepo.getCredsByUserId(userId);
    if (!creds?.wabaId || !creds?.accessToken) {
      return res.status(400).json({ error: 'Missing WABA credentials' });
    }

    // Get templates from database
    const dbTemplates = await templatesRepo.getAllByUserId(userId);
    
    // Get templates from Meta
    const metaTemplates = await fetchAllTemplatesFromGraph(creds.wabaId, creds.accessToken);

    // Compare statuses
    const comparisons = [];
    
    for (const dbTemplate of dbTemplates) {
      const metaTemplate = metaTemplates.find(m => 
        m.name === dbTemplate.name && 
        m.language === dbTemplate.language
      );

      const comparison = {
        name: dbTemplate.name,
        language: dbTemplate.language,
        database: {
          status: dbTemplate.status,
          category: dbTemplate.category,
          updated_at: dbTemplate.updated_at
        },
        meta: metaTemplate ? {
          status: metaTemplate.status,
          category: metaTemplate.category,
          reviewedAt: metaTemplate.reviewedAt
        } : null,
        statusMatch: metaTemplate ? dbTemplate.status === metaTemplate.status?.toUpperCase() : false,
        needsUpdate: metaTemplate ? dbTemplate.status !== metaTemplate.status?.toUpperCase() : false,
        missingInDatabase: false
      };

      comparisons.push(comparison);
    }

    // Find templates in Meta but not in database
    for (const metaTemplate of metaTemplates) {
      const exists = dbTemplates.some(db => 
        db.name === metaTemplate.name && 
        db.language === metaTemplate.language
      );
      
      if (!exists) {
        comparisons.push({
          name: metaTemplate.name,
          language: metaTemplate.language,
          database: null,
          meta: {
            status: metaTemplate.status,
            category: metaTemplate.category,
            reviewedAt: metaTemplate.reviewedAt
          },
          statusMatch: false,
          needsUpdate: true,
          missingInDatabase: true
        });
      }
    }

    const summary = {
      total: comparisons.length,
      matching: comparisons.filter(c => c.statusMatch).length,
      needingUpdate: comparisons.filter(c => c.needsUpdate).length,
      missingInDb: comparisons.filter((c: any) => c.missingInDatabase).length
    };

    res.json({
      success: true,
      userId,
      wabaId: creds.wabaId,
      summary,
      comparisons,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [COMPARE] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Comparison failed',
      message: error?.message || String(error)
    });
  }
});

/**
 * GET /api/templates/webhook-test/:userId
 * Test webhook reception and processing
 */
router.get('/api/templates/webhook-test/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user info
    const creds = await userBusinessRepo.getCredsByUserId(userId);
    if (!creds?.wabaId) {
      return res.status(400).json({ error: 'No WABA ID found for user' });
    }

    // Check if WABA ID exists in user_business_info
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT user_id, waba_id, whatsapp_number_id, is_active FROM user_business_info WHERE user_id = $1',
        [userId]
      );

      const webhookInfo = {
        userId,
        userBusinessInfo: result.rows[0] || null,
        webhookEndpoint: '/webhooks/meta',
        expectedWebhookField: 'message_template_status_update',
        wabaLookupWorks: !!result.rows[0]?.waba_id,
        instructions: {
          step1: 'Verify Meta webhook subscription includes message_template_status_update',
          step2: 'Check webhook endpoint is accessible',
          step3: 'Verify WABA ID matches in webhook payload',
          step4: 'Use /api/templates/sync-direct/' + userId + ' to force sync'
        }
      };

      res.json(webhookInfo);
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('❌ [WEBHOOK_TEST] Error:', error);
    res.status(500).json({
      error: 'Webhook test failed',
      message: error?.message || String(error)
    });
  }
});

export default router;