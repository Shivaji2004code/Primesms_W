// Debug endpoint for template status issues
import { Router } from 'express';
import { templatesRepo, userBusinessRepo } from '../repos/templatesRepo';
import { fetchTemplateFromGraph } from '../services/waGraph';
import pool from '../db';

const router = Router();

/**
 * GET /api/debug/templates/:userId/:templateName
 * Debug template status - compare database vs Meta status
 */
router.get('/api/debug/templates/:userId/:templateName', async (req, res) => {
  try {
    const { userId, templateName } = req.params;
    const { language = 'en_US' } = req.query;

    console.log(`🔍 [TEMPLATE_DEBUG] Debugging template: ${templateName} for user ${userId}`);

    // 1. Check database status
    const dbTemplate = await templatesRepo.getByUserNameLanguage(userId, templateName, language as string);
    
    // 2. Get user's credentials
    const creds = await userBusinessRepo.getCredsByUserId(userId);
    
    let metaTemplate = null;
    if (creds?.wabaId && creds?.accessToken) {
      // 3. Fetch from Meta Graph API
      metaTemplate = await fetchTemplateFromGraph(creds.wabaId, creds.accessToken, templateName, language as string);
    }

    // 4. Check webhook logs (last 24 hours)
    const client = await pool.connect();
    let recentWebhooks = [];
    try {
      // This would require webhook logging table - for now just check if user exists
      const userCheck = await client.query(
        'SELECT u.id, u.username, ubi.whatsapp_number_id, ubi.waba_id FROM users u LEFT JOIN user_business_info ubi ON u.id = ubi.user_id WHERE u.id = $1',
        [userId]
      );
      recentWebhooks = userCheck.rows;
    } finally {
      client.release();
    }

    const debugInfo = {
      templateName,
      userId,
      language,
      timestamp: new Date().toISOString(),
      database: {
        found: !!dbTemplate,
        data: dbTemplate ? {
          id: dbTemplate.id,
          name: dbTemplate.name,
          language: dbTemplate.language,
          status: dbTemplate.status,
          category: dbTemplate.category,
          rejection_reason: dbTemplate.rejection_reason,
          created_at: dbTemplate.created_at,
          updated_at: dbTemplate.updated_at
        } : null
      },
      meta: {
        credentialsConfigured: !!(creds?.wabaId && creds?.accessToken),
        found: !!metaTemplate,
        data: metaTemplate ? {
          name: metaTemplate.name,
          language: metaTemplate.language,
          status: metaTemplate.status,
          category: metaTemplate.category,
          reason: metaTemplate.reason,
          reviewedAt: metaTemplate.reviewedAt
        } : null
      },
      user: {
        found: recentWebhooks.length > 0,
        data: recentWebhooks[0] || null
      },
      comparison: {
        statusMatch: dbTemplate?.status === metaTemplate?.status,
        categoryMatch: dbTemplate?.category === metaTemplate?.category,
        needsUpdate: dbTemplate && metaTemplate && (
          dbTemplate.status !== metaTemplate.status || 
          dbTemplate.category !== metaTemplate.category
        )
      }
    };

    console.log(`📊 [TEMPLATE_DEBUG] Results:`, debugInfo);

    res.json(debugInfo);

  } catch (error: any) {
    console.error('❌ [TEMPLATE_DEBUG] Error:', error);
    res.status(500).json({
      error: 'Debug failed',
      message: error?.message || String(error)
    });
  }
});

/**
 * POST /api/debug/templates/:userId/:templateName/force-sync
 * Force sync a specific template from Meta
 */
router.post('/api/debug/templates/:userId/:templateName/force-sync', async (req, res) => {
  try {
    const { userId, templateName } = req.params;
    const { language = 'en_US' } = req.body;

    console.log(`🔄 [TEMPLATE_DEBUG] Force syncing: ${templateName} for user ${userId}`);

    // Get credentials
    const creds = await userBusinessRepo.getCredsByUserId(userId);
    if (!creds?.wabaId || !creds?.accessToken) {
      return res.status(400).json({ error: 'Missing WABA credentials' });
    }

    // Fetch from Meta
    const metaTemplate = await fetchTemplateFromGraph(
      creds.wabaId, 
      creds.accessToken, 
      templateName, 
      language
    );

    if (!metaTemplate) {
      return res.status(404).json({ error: 'Template not found in Meta' });
    }

    // Force update database
    await templatesRepo.upsertStatusAndCategory({
      userId,
      name: metaTemplate.name,
      language: metaTemplate.language,
      status: String(metaTemplate.status || 'UNKNOWN').toUpperCase(),
      category: metaTemplate.category ? String(metaTemplate.category).toUpperCase() : undefined,
      reason: metaTemplate.reason || null,
      reviewedAt: metaTemplate.reviewedAt || new Date()
    });

    // Get updated database state
    const updatedTemplate = await templatesRepo.getByUserNameLanguage(
      userId, 
      metaTemplate.name, 
      metaTemplate.language
    );

    console.log(`✅ [TEMPLATE_DEBUG] Force sync completed for ${templateName}`);

    res.json({
      success: true,
      message: 'Template force synced successfully',
      before: { status: 'unknown' },
      after: {
        name: updatedTemplate?.name,
        language: updatedTemplate?.language, 
        status: updatedTemplate?.status,
        category: updatedTemplate?.category,
        updated_at: updatedTemplate?.updated_at
      },
      metaData: metaTemplate
    });

  } catch (error: any) {
    console.error('❌ [TEMPLATE_DEBUG] Force sync error:', error);
    res.status(500).json({
      error: 'Force sync failed',
      message: error?.message || String(error)
    });
  }
});

/**
 * GET /api/debug/webhooks/recent/:userId
 * Check recent webhook activity for a user
 */
router.get('/api/debug/webhooks/recent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's phone number ID for webhook correlation
    const userBusiness = await userBusinessRepo.getCredsByUserId(userId);
    
    // For now, return user info - in production you might have webhook logs table
    res.json({
      userId,
      phoneNumberId: userBusiness ? 'configured' : 'not_configured',
      note: 'Webhook logging would require additional table. Check server logs for webhook processing.',
      suggestion: 'Use /api/debug/templates/:userId/:templateName to compare DB vs Meta status'
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to check webhook activity', 
      message: error?.message || String(error)
    });
  }
});

export default router;