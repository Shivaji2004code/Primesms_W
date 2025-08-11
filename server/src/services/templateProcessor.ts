// Enhanced Template Status Processor with Category Updates and Graph Fallback
import { templatesRepo, userBusinessRepo } from '../repos/templatesRepo';
import { fetchTemplateFromGraph } from './waGraph';
import { sseHub } from './sseBroadcaster';

type AnyObj = Record<string, any>;

/**
 * Enhanced template status change handler with category support and Graph API fallback
 * This function processes Meta webhook events for template status updates
 */
export async function handleTemplateStatusChange(value: AnyObj, wabaId?: string): Promise<void> {
  try {
    console.log('📋 [TEMPLATE_PROCESSOR] ===== WEBHOOK RECEIVED =====');
    console.log('📋 [TEMPLATE_PROCESSOR] Processing template status update:', JSON.stringify(value, null, 2));
    console.log('📋 [TEMPLATE_PROCESSOR] WABA ID:', wabaId);
    
    // Resolve user from WABA ID (template status updates don't have phone_number_id)
    let userBusiness: any = null;
    
    if (wabaId) {
      // Template status updates: use WABA ID from entry level
      userBusiness = await userBusinessRepo.getByWabaIdWithCreds(wabaId);
      if (!userBusiness?.userId) {
        console.log(`⚠️  [TEMPLATE_PROCESSOR] No user found for WABA ID: ${wabaId}`);
        return;
      }
      console.log(`✅ [TEMPLATE_PROCESSOR] Resolved WABA ID ${wabaId} -> user ${userBusiness.userId}`);
    } else {
      // Fallback: try phone_number_id for backward compatibility
      const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;
      if (!phoneNumberId) {
        console.log('⚠️  [TEMPLATE_PROCESSOR] No WABA ID or phone_number_id in webhook payload');
        return;
      }

      userBusiness = await userBusinessRepo.getByPhoneNumberIdWithCreds(phoneNumberId);
      if (!userBusiness?.userId) {
        console.log(`⚠️  [TEMPLATE_PROCESSOR] No user found for phone_number_id: ${phoneNumberId}`);
        return;
      }
      console.log(`✅ [TEMPLATE_PROCESSOR] Resolved phone_number_id ${phoneNumberId} -> user ${userBusiness.userId}`);
    }

    // Extract template information from webhook payload
    // Meta sends different payload structures, handle both:
    // New format: message_template_name, message_template_language directly in value
    // Old format: message_template.name, message_template.language.code
    
    const template = value?.message_template || value?.template || {};
    
    // Try new format first (message_template_name), fallback to old format
    const name: string | undefined = 
      value?.message_template_name || 
      template?.name || 
      value?.name;
      
    // Try new format first (message_template_language), fallback to old format
    const language: string = 
      value?.message_template_language || 
      template?.language?.code || 
      template?.language || 
      'en_US';
    
    const status: string = String(value?.event || value?.status || 'UNKNOWN').toUpperCase();
    const reason: string | null = (value?.reason || value?.rejected_reason || null) as any;
    const reviewedAt: Date = value?.last_updated_time 
      ? new Date(Number(value.last_updated_time) * 1000) 
      : new Date();

    if (!name) {
      console.log('⚠️  [TEMPLATE_PROCESSOR] No template name found in webhook payload');
      console.log('📋 [TEMPLATE_PROCESSOR] Available webhook data:', {
        template_keys: Object.keys(template),
        value_keys: Object.keys(value),
        raw_name: value?.name,
        template_name: template?.name
      });
      return;
    }

    console.log('📋 [TEMPLATE_PROCESSOR] ===== PROCESSING TEMPLATE =====');
    console.log('📋 [TEMPLATE_PROCESSOR] Template details:', {
      name,
      language,
      status,
      userId: userBusiness.userId,
      wabaId: wabaId,
      resolvedVia: wabaId ? 'WABA_ID' : 'phone_number_id'
    });

    // Try to get category from webhook first
    let category: string | null = (template?.category || null) as any;

    // If category is missing, try Graph API fallback
    if (!category && userBusiness?.wabaId && userBusiness?.accessToken) {
      try {
        console.log(`🔄 [TEMPLATE_PROCESSOR] Category missing from webhook, fetching from Graph API for ${name}`);
        
        const graphTemplate = await fetchTemplateFromGraph(
          userBusiness.wabaId, 
          userBusiness.accessToken, 
          name, 
          language
        );

        if (graphTemplate?.category) {
          category = String(graphTemplate.category).toUpperCase();
          console.log(`✅ [TEMPLATE_PROCESSOR] Retrieved category from Graph API: ${category}`);
        } else {
          console.log(`⚠️  [TEMPLATE_PROCESSOR] Could not retrieve category from Graph API for ${name}`);
        }
      } catch (error) {
        console.error('❌ [TEMPLATE_PROCESSOR] Graph API fallback failed:', {
          userId: userBusiness.userId,
          name,
          language,
          error: String(error)
        });
      }
    }

    // Normalize category if provided
    if (category) {
      category = String(category).toUpperCase();
      // Validate category against known WhatsApp categories
      if (!['UTILITY', 'MARKETING', 'AUTHENTICATION'].includes(category)) {
        console.log(`⚠️  [TEMPLATE_PROCESSOR] Unknown category: ${category}, keeping as-is`);
      }
    }

    console.log(`📋 [TEMPLATE_PROCESSOR] Updating template: ${name} (${language}) -> ${status}${category ? ` [${category}]` : ''} for user ${userBusiness.userId}`);

    // Update database with status, category, and other fields
    await templatesRepo.upsertStatusAndCategory({
      userId: userBusiness.userId,
      name,
      language,
      status,
      category: category || undefined,
      reason,
      reviewedAt
    });

    // Emit SSE event to notify frontend
    const ssePayload = {
      type: 'template_update',
      name,
      language,
      status,
      category: category || null,
      reason,
      at: new Date().toISOString(),
      reviewedAt: reviewedAt.toISOString()
    };

    sseHub.emitTemplate(userBusiness.userId, ssePayload);

    console.log(`✅ [TEMPLATE_PROCESSOR] Template update completed: ${name} (${language}) for user ${userBusiness.userId}`);

  } catch (error) {
    console.error('❌ [TEMPLATE_PROCESSOR] Error processing template status change:', error);
  }
}

/**
 * Process template status update from webhook entry
 * This is the main entry point called from the webhook handler
 */
export async function processTemplateWebhookEntry(entry: AnyObj): Promise<void> {
  try {
    const changes = entry?.changes || [];
    const wabaId = entry?.id; // WABA ID is at entry level
    
    for (const change of changes) {
      if (change?.field === 'message_template_status_update') {
        await handleTemplateStatusChange(change.value, wabaId);
      }
    }
  } catch (error) {
    console.error('❌ [TEMPLATE_PROCESSOR] Error processing webhook entry:', error);
  }
}