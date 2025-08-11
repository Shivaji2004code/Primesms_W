// Manual Template Sync Endpoint
import { Router } from 'express';
import { templatesRepo, userBusinessRepo } from '../repos/templatesRepo';
import { fetchTemplateFromGraph, fetchAllTemplatesFromGraph } from '../services/waGraph';
import { sseHub } from '../services/sseBroadcaster';

const router = Router();

/**
 * POST /api/templates/sync
 * Manually sync template data from Graph API
 * Body: { userId, name?, language? }
 * - If name provided: sync specific template
 * - If only userId: sync all templates for user (first 200)
 */
router.post('/api/templates/sync', async (req, res) => {
  try {
    const { userId, name, language } = req.body || {};
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId required',
        message: 'Please provide userId in request body'
      });
    }

    console.log(`🔄 [TEMPLATES_SYNC] Starting manual sync for user ${userId}${name ? ` (template: ${name})` : ''}`);

    // Get user's WhatsApp Business API credentials
    const creds = await userBusinessRepo.getCredsByUserId(userId);
    if (!creds?.wabaId || !creds?.accessToken) {
      return res.status(400).json({ 
        error: 'Missing WABA credentials',
        message: 'WhatsApp Business API credentials not configured for this user'
      });
    }

    const changes: any[] = [];

    if (name) {
      // Sync specific template
      console.log(`🔍 [TEMPLATES_SYNC] Syncing specific template: ${name}${language ? ` (${language})` : ''}`);
      
      const templateData = await fetchTemplateFromGraph(
        creds.wabaId, 
        creds.accessToken, 
        name, 
        language
      );

      if (!templateData) {
        return res.status(404).json({
          error: 'Template not found',
          message: `Template '${name}' not found in WhatsApp Business API`
        });
      }

      // Update database
      await templatesRepo.upsertStatusAndCategory({
        userId,
        name: templateData.name,
        language: templateData.language,
        status: String(templateData.status || 'UNKNOWN').toUpperCase(),
        category: templateData.category ? String(templateData.category).toUpperCase() : undefined,
        reason: templateData.reason || null,
        reviewedAt: templateData.reviewedAt || new Date()
      });

      changes.push(templateData);

      // Emit SSE event
      sseHub.emitTemplate(userId, {
        type: 'template_update',
        name: templateData.name,
        language: templateData.language,
        status: String(templateData.status || 'UNKNOWN').toUpperCase(),
        category: templateData.category ? String(templateData.category).toUpperCase() : null,
        reason: templateData.reason || null,
        at: new Date().toISOString(),
        source: 'manual_sync'
      });

    } else {
      // Sync all templates for user
      console.log(`🔍 [TEMPLATES_SYNC] Syncing all templates for user ${userId}`);
      
      const allTemplates = await fetchAllTemplatesFromGraph(creds.wabaId, creds.accessToken);
      
      if (allTemplates.length === 0) {
        return res.json({
          success: true,
          message: 'No templates found for this user',
          updated: 0,
          items: []
        });
      }

      console.log(`📋 [TEMPLATES_SYNC] Processing ${allTemplates.length} templates`);

      // Process each template
      for (const templateData of allTemplates) {
        try {
          await templatesRepo.upsertStatusAndCategory({
            userId,
            name: templateData.name,
            language: templateData.language,
            status: String(templateData.status || 'UNKNOWN').toUpperCase(),
            category: templateData.category ? String(templateData.category).toUpperCase() : undefined,
            reason: templateData.reason || null,
            reviewedAt: templateData.reviewedAt || new Date()
          });

          changes.push(templateData);

          // Emit SSE event for each updated template
          sseHub.emitTemplate(userId, {
            type: 'template_update',
            name: templateData.name,
            language: templateData.language,
            status: String(templateData.status || 'UNKNOWN').toUpperCase(),
            category: templateData.category ? String(templateData.category).toUpperCase() : null,
            reason: templateData.reason || null,
            at: new Date().toISOString(),
            source: 'manual_sync'
          });

        } catch (error) {
          console.error(`❌ [TEMPLATES_SYNC] Error processing template ${templateData.name}:`, error);
          // Continue processing other templates
        }
      }
    }

    console.log(`✅ [TEMPLATES_SYNC] Completed sync for user ${userId}: ${changes.length} templates updated`);

    res.json({
      success: true,
      message: `Successfully synced ${changes.length} template${changes.length !== 1 ? 's' : ''}`,
      updated: changes.length,
      items: changes.map(t => ({
        name: t.name,
        language: t.language,
        status: t.status,
        category: t.category,
        reason: t.reason,
        reviewedAt: t.reviewedAt
      }))
    });

  } catch (error: any) {
    console.error('❌ [TEMPLATES_SYNC] Sync error:', error?.response?.data || error?.message || error);
    
    res.status(500).json({
      success: false,
      error: 'Sync failed',
      message: error?.response?.data?.error?.message || error?.message || 'Unknown error occurred',
      details: error?.response?.data || null
    });
  }
});

/**
 * GET /api/templates/sync/status/:userId
 * Check sync status and get current template count for a user
 */
router.get('/api/templates/sync/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // Check if user has WABA credentials
    const creds = await userBusinessRepo.getCredsByUserId(userId);
    const hasCredentials = Boolean(creds?.wabaId && creds?.accessToken);

    // Get current template count from database
    const templates = await templatesRepo.getAllByUserId(userId);
    
    res.json({
      userId,
      hasCredentials,
      templatesCount: templates.length,
      lastSync: templates.length > 0 
        ? Math.max(...templates.map(t => new Date(t.updated_at).getTime()))
        : null,
      canSync: hasCredentials
    });

  } catch (error: any) {
    console.error('❌ [TEMPLATES_SYNC] Status check error:', error);
    res.status(500).json({
      error: 'Status check failed',
      message: error?.message || 'Unknown error occurred'
    });
  }
});

export default router;