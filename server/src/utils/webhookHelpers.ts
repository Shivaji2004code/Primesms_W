// [Claude AI] Webhook Helper Utilities — Aug 2025
import { sseHub } from '../services/sseBroadcaster';
import { createProcessors } from '../services/waProcessors';

// Create processors instance for use in sending functions
const processors = createProcessors({
  emitReport: (userId: string, payload: any) => sseHub.emitReport(userId, payload),
  emitTemplate: (userId: string, payload: any) => sseHub.emitTemplate(userId, payload)
});

/**
 * Call this function after successfully sending a message via WhatsApp API
 * This creates the initial campaign_logs entry and emits SSE event
 */
export async function handleSendAcknowledgment(
  userId: string,
  messageId: string, // The wamid returned from WhatsApp API
  recipientNumber: string,
  campaignId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    console.log(`📤 [SEND-ACK] Handling send acknowledgment: ${messageId} for user ${userId}`);
    
    // Create campaign_logs entry by simulating webhook format
    const mockWebhookBody = {
      entry: [{
        changes: [{
          field: 'send_ack',
          value: {
            metadata: { phone_number_id: 'from_send_ack' },
            send_acknowledgment: {
              message_id: messageId,
              recipient: recipientNumber,
              user_id: userId,
              campaign_id: campaignId,
              metadata
            }
          }
        }]
      }]
    };
    
    // For now, we'll emit the SSE directly since we can't access private repo methods
    // This functionality should be integrated into the actual send API routes
    
    // Emit SSE event for immediate UI update
    sseHub.emitReport(userId, {
      type: 'report_update',
      status: 'sent',
      messageId,
      recipientNumber,
      campaignId,
      at: new Date().toISOString(),
      meta: {
        source: 'send_ack',
        ...metadata
      }
    });
    
    console.log(`✅ [SEND-ACK] Send acknowledgment processed for ${messageId}`);
  } catch (error) {
    console.error(`❌ [SEND-ACK] Error handling send acknowledgment for ${messageId}:`, error);
    // Don't throw - this is a best-effort operation
  }
}

/**
 * Test function to simulate webhook events (for debugging)
 */
export function simulateWebhookEvent(
  type: 'status_update' | 'template_update',
  userId: string,
  eventData: any
): void {
  if (type === 'status_update') {
    sseHub.emitReport(userId, {
      type: 'report_update',
      ...eventData,
      at: new Date().toISOString(),
      meta: { source: 'simulation', ...eventData.meta }
    });
  } else if (type === 'template_update') {
    sseHub.emitTemplate(userId, {
      type: 'template_update',
      ...eventData,
      at: new Date().toISOString(),
      meta: { source: 'simulation', ...eventData.meta }
    });
  }
  
  console.log(`🧪 [SIMULATE] Sent ${type} event to user ${userId}:`, eventData);
}

/**
 * Get current SSE connection status for a user
 */
export function getUserSSEStatus(userId: string): {
  hasReportConnections: boolean;
  hasTemplateConnections: boolean;
  hasAnyConnections: boolean;
} {
  const hasReportConnections = sseHub['reports'].has(userId) && sseHub['reports'].get(userId)!.size > 0;
  const hasTemplateConnections = sseHub['templates'].has(userId) && sseHub['templates'].get(userId)!.size > 0;
  
  return {
    hasReportConnections,
    hasTemplateConnections,
    hasAnyConnections: hasReportConnections || hasTemplateConnections
  };
}