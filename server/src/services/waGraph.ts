// WhatsApp Graph API service for template fallback
import axios from 'axios';

export interface TemplateData {
  name: string;
  language: string;
  status?: string;
  category?: string;
  reason?: string;
  reviewedAt?: Date;
}

/**
 * Fetch a specific template from Graph API
 * Used when webhook doesn't include category information
 */
export async function fetchTemplateFromGraph(
  wabaId: string,
  accessToken: string,
  name?: string,
  language?: string
): Promise<TemplateData | null> {
  try {
    const version = process.env.GRAPH_API_VERSION || 'v22.0';
    const baseUrl = `https://graph.facebook.com/${version}/${wabaId}/message_templates`;
    
    const params: any = {
      access_token: accessToken,
      limit: name ? 10 : 50 // If searching for specific template, limit results
    };
    
    if (name) {
      params.name = name;
    }

    console.log(`🔍 [GRAPH] Fetching template${name ? ` ${name}` : 's'} from Graph API`);
    
    const response = await axios.get(baseUrl, { 
      params,
      timeout: 10000 
    });
    
    const templates = response.data?.data || [];
    
    if (templates.length === 0) {
      console.log(`⚠️  [GRAPH] No templates found${name ? ` for name ${name}` : ''}`);
      return null;
    }

    // If we have name and language, try to find exact match
    let targetTemplate = templates[0];
    
    if (name && language) {
      const exactMatch = templates.find((t: any) => 
        t.name === name && 
        (t.language?.code || t.language || '').toLowerCase() === language.toLowerCase()
      );
      
      if (exactMatch) {
        targetTemplate = exactMatch;
      } else {
        // If no exact language match, find by name only
        const nameMatch = templates.find((t: any) => t.name === name);
        if (nameMatch) {
          targetTemplate = nameMatch;
        }
      }
    }

    const templateData: TemplateData = {
      name: targetTemplate.name,
      language: targetTemplate.language?.code || targetTemplate.language || 'en_US',
      status: targetTemplate.status,
      category: targetTemplate.category,
      reason: targetTemplate.rejected_reason || targetTemplate.rejection_reason,
      reviewedAt: targetTemplate.last_updated_time 
        ? new Date(Number(targetTemplate.last_updated_time) * 1000)
        : undefined
    };

    console.log(`✅ [GRAPH] Retrieved template data: ${templateData.name} (${templateData.language}) - ${templateData.category} - ${templateData.status}`);
    return templateData;

  } catch (error: any) {
    console.error('❌ [GRAPH] Error fetching template from Graph API:', {
      wabaId,
      name,
      language,
      error: error?.response?.data || error?.message || String(error)
    });
    return null;
  }
}

/**
 * Fetch all templates for a WABA ID
 * Used for manual sync operations
 */
export async function fetchAllTemplatesFromGraph(
  wabaId: string,
  accessToken: string
): Promise<TemplateData[]> {
  try {
    const version = process.env.GRAPH_API_VERSION || 'v22.0';
    const baseUrl = `https://graph.facebook.com/${version}/${wabaId}/message_templates`;
    
    console.log(`🔍 [GRAPH] Fetching all templates for WABA ${wabaId}`);
    
    const response = await axios.get(baseUrl, {
      params: {
        access_token: accessToken,
        limit: 200 // Get first 200 templates (pagination can be added later if needed)
      },
      timeout: 15000
    });
    
    const templates = response.data?.data || [];
    
    const templateData: TemplateData[] = templates.map((t: any) => ({
      name: t.name,
      language: t.language?.code || t.language || 'en_US',
      status: t.status,
      category: t.category,
      reason: t.rejected_reason || t.rejection_reason,
      reviewedAt: t.last_updated_time 
        ? new Date(Number(t.last_updated_time) * 1000)
        : undefined
    }));

    console.log(`✅ [GRAPH] Retrieved ${templateData.length} templates from Graph API`);
    return templateData;

  } catch (error: any) {
    console.error('❌ [GRAPH] Error fetching all templates from Graph API:', {
      wabaId,
      error: error?.response?.data || error?.message || String(error)
    });
    return [];
  }
}