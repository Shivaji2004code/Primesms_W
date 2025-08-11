// Enhanced Template Status Processor with Category Updates and Graph Fallback
import { templatesRepo, userBusinessRepo } from '../repos/templatesRepo';
import { fetchTemplateFromGraph } from './waGraph';
import { sseHub } from './sseBroadcaster';

type AnyObj = Record<string, any>;

/**
 * Enhanced template status change handler with category support and Graph API fallback
 * This function processes Meta webhook events for template status updates
 */
export async function handleTemplateStatusChange(value: AnyObj): Promise<void> {
  try {
    console.log('📋 [TEMPLATE_PROCESSOR] ===== WEBHOOK RECEIVED =====');
    console.log('📋 [TEMPLATE_PROCESSOR] Processing template status update:', JSON.stringify(value, null, 2));
    
    // Resolve user from phone_number_id
    const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;
    if (!phoneNumberId) {
      console.log('⚠️  [TEMPLATE_PROCESSOR] No phone_number_id in webhook payload');
      return;
    }

    const userBusiness = await userBusinessRepo.getByPhoneNumberIdWithCreds(phoneNumberId);
    if (!userBusiness?.userId) {
      console.log(`⚠️  [TEMPLATE_PROCESSOR] No user found for phone_number_id: ${phoneNumberId}`);
      return;
    }

    // Extract template information from webhook payload
    const template = value?.message_template || value?.template || {};
    const name: string | undefined = template?.name || value?.name;
    const language: string = (template?.language?.code || template?.language || 'en_US') as string;
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
      phoneNumberId: phoneNumberId
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
    
    for (const change of changes) {
      if (change?.field === 'message_template_status_update') {
        await handleTemplateStatusChange(change.value);
      }
    }
  } catch (error) {
    console.error('❌ [TEMPLATE_PROCESSOR] Error processing webhook entry:', error);
  }
}