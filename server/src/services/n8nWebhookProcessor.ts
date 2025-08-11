// [Claude AI] n8n Webhook Processor for Inbound Messages — Aug 2025
import { UserBusinessInfo } from '../types';
import { forwardInboundToN8N, validateForwardContext, ForwardContext, N8NInboundEvent } from './n8nForwarder';
import { mapInboundMessage, validateInboundMessage, logMappedMessage } from './waToN8nInboundMapper';

type AnyObj = Record<string, any>;

// ====== INTERFACES ======
export interface N8nWebhookProcessorConfig {
  enabled: boolean;
  logLevel: 'minimal' | 'detailed';
  skipValidation?: boolean;
}

export interface ProcessingStats {
  totalEntries: number;
  processedChanges: number;
  inboundMessages: number;
  forwardedToN8n: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}

// ====== MAIN PROCESSOR CLASS ======
export class N8nWebhookProcessor {
  private config: N8nWebhookProcessorConfig;
  private stats: ProcessingStats;

  constructor(config: Partial<N8nWebhookProcessorConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      logLevel: config.logLevel ?? 'minimal',
      skipValidation: config.skipValidation ?? false
    };
    
    this.stats = {
      totalEntries: 0,
      processedChanges: 0,
      inboundMessages: 0,
      forwardedToN8n: 0,
      errors: 0,
      startTime: new Date()
    };
  }

  // ====== MAIN PROCESSING METHOD ======
  async processWebhookForN8n(
    body: AnyObj, 
    userBusinessLookupFn: (phoneNumberId: string) => Promise<UserBusinessInfo | null>
  ): Promise<ProcessingStats> {
    try {
      if (!this.config.enabled) {
        console.log('🔇 [N8N_WEBHOOK_PROCESSOR] n8n forwarding is disabled, skipping');
        return this.getStats();
      }

      this.stats = {
        totalEntries: 0,
        processedChanges: 0,
        inboundMessages: 0,
        forwardedToN8n: 0,
        errors: 0,
        startTime: new Date()
      };

      const entries = body?.entry || [];
      this.stats.totalEntries = entries.length;

      if (this.config.logLevel === 'detailed') {
        console.log(`🔄 [N8N_WEBHOOK_PROCESSOR] Starting processing of ${entries.length} webhook entries`);
      }

      for (const entry of entries) {
        const changes = entry?.changes || [];
        
        for (const change of changes) {
          if (!change) continue;
          
          this.stats.processedChanges++;
          
          // We only care about 'messages' field for inbound messages
          if (change.field === 'messages') {
            await this.processMessagesChange(change, userBusinessLookupFn);
          } else {
            if (this.config.logLevel === 'detailed') {
              console.log(`⏭️  [N8N_WEBHOOK_PROCESSOR] Skipping field: ${change.field} (not messages)`);
            }
          }
        }
      }

      this.stats.endTime = new Date();
      
      if (this.config.logLevel === 'detailed' || this.stats.inboundMessages > 0) {
        const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();
        console.log(`✅ [N8N_WEBHOOK_PROCESSOR] Completed processing in ${duration}ms:`, {
          entries: this.stats.totalEntries,
          changes: this.stats.processedChanges,
          inboundMessages: this.stats.inboundMessages,
          forwardedToN8n: this.stats.forwardedToN8n,
          errors: this.stats.errors
        });
      }

      return this.getStats();
      
    } catch (error) {
      this.stats.errors++;
      this.stats.endTime = new Date();
      console.error('❌ [N8N_WEBHOOK_PROCESSOR] Critical error in processWebhookForN8n:', error);
      return this.getStats();
    }
  }

  // ====== PROCESS MESSAGES CHANGE ======
  private async processMessagesChange(
    change: AnyObj, 
    userBusinessLookupFn: (phoneNumberId: string) => Promise<UserBusinessInfo | null>
  ): Promise<void> {
    try {
      const value = change.value;
      if (!value) return;

      // Check if this contains inbound messages (not just status updates)
      const messages = value.messages;
      if (!Array.isArray(messages) || messages.length === 0) {
        if (this.config.logLevel === 'detailed') {
          console.log('⏭️  [N8N_WEBHOOK_PROCESSOR] No inbound messages found, only status updates');
        }
        return;
      }

      this.stats.inboundMessages += messages.length;
      
      if (this.config.logLevel === 'detailed') {
        console.log(`📥 [N8N_WEBHOOK_PROCESSOR] Found ${messages.length} inbound message(s)`);
      }

      // Resolve user business info from phone_number_id
      const phoneNumberId = value?.metadata?.phone_number_id;
      if (!phoneNumberId) {
        console.log('⚠️  [N8N_WEBHOOK_PROCESSOR] No phone_number_id in webhook payload, cannot resolve user');
        this.stats.errors++;
        return;
      }

      const userBusinessInfo = await userBusinessLookupFn(phoneNumberId);
      if (!userBusinessInfo) {
        console.log(`⚠️  [N8N_WEBHOOK_PROCESSOR] No user business info found for phone_number_id: ${phoneNumberId}`);
        this.stats.errors++;
        return;
      }

      if (!userBusinessInfo.webhookUrl) {
        console.log(`⚠️  [N8N_WEBHOOK_PROCESSOR] No webhook URL configured for user ${userBusinessInfo.userId}, skipping n8n forward`);
        return;
      }

      if (this.config.logLevel === 'detailed') {
        console.log(`📱 [N8N_WEBHOOK_PROCESSOR] Resolved phone_number_id ${phoneNumberId} to user ${userBusinessInfo.userId} with webhook URL`);
      }

      // Map the WhatsApp message to n8n format
      const mappedPayload = mapInboundMessage(value);
      
      // Optional validation
      if (!this.config.skipValidation) {
        const validation = validateInboundMessage(mappedPayload.message);
        if (!validation.isValid) {
          console.error(`❌ [N8N_WEBHOOK_PROCESSOR] Invalid mapped message for user ${userBusinessInfo.userId}:`, validation.errors);
          this.stats.errors++;
          return;
        }
      }

      // Log mapped message if detailed logging is enabled
      if (this.config.logLevel === 'detailed') {
        logMappedMessage(mappedPayload, `N8N_WEBHOOK_PROCESSOR:${userBusinessInfo.userId}`);
      }

      // Create forward context
      const forwardContext: ForwardContext = {
        userId: userBusinessInfo.userId,
        wabaId: userBusinessInfo.wabaId || null,
        phoneNumberId: phoneNumberId,
        webhookUrl: userBusinessInfo.webhookUrl,
        webhookVerifyToken: userBusinessInfo.webhookVerifyToken || undefined
      };

      // Validate forward context
      const contextValidation = validateForwardContext(forwardContext);
      if (!contextValidation.isValid) {
        console.error(`❌ [N8N_WEBHOOK_PROCESSOR] Invalid forward context for user ${userBusinessInfo.userId}:`, contextValidation.errors);
        this.stats.errors++;
        return;
      }

      // Create n8n event
      const n8nEvent: N8NInboundEvent = {
        kind: 'message_in',
        payload: mappedPayload
      };

      // Forward to n8n (non-blocking)
      await forwardInboundToN8N(forwardContext, n8nEvent);
      this.stats.forwardedToN8n++;
      
      console.log(`📤 [N8N_WEBHOOK_PROCESSOR] Successfully forwarded inbound message from ${mappedPayload.message.from} to n8n for user ${userBusinessInfo.userId}`);

    } catch (error) {
      this.stats.errors++;
      console.error('❌ [N8N_WEBHOOK_PROCESSOR] Error processing messages change:', error);
    }
  }

  // ====== UTILITY METHODS ======
  public getStats(): ProcessingStats {
    return { ...this.stats };
  }

  public updateConfig(newConfig: Partial<N8nWebhookProcessorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log(`🔧 [N8N_WEBHOOK_PROCESSOR] Config updated:`, this.config);
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public resetStats(): void {
    this.stats = {
      totalEntries: 0,
      processedChanges: 0,
      inboundMessages: 0,
      forwardedToN8n: 0,
      errors: 0,
      startTime: new Date()
    };
    console.log('🔄 [N8N_WEBHOOK_PROCESSOR] Stats reset');
  }
}

// ====== FACTORY FUNCTION ======
export function createN8nWebhookProcessor(config: Partial<N8nWebhookProcessorConfig> = {}): N8nWebhookProcessor {
  return new N8nWebhookProcessor(config);
}

// ====== CONVENIENCE FUNCTION FOR SINGLE-USE ======
export async function processWebhookForN8n(
  body: AnyObj,
  userBusinessLookupFn: (phoneNumberId: string) => Promise<UserBusinessInfo | null>,
  config: Partial<N8nWebhookProcessorConfig> = {}
): Promise<ProcessingStats> {
  const processor = createN8nWebhookProcessor(config);
  return await processor.processWebhookForN8n(body, userBusinessLookupFn);
}

// ====== TESTING HELPERS ======
export function createTestUserBusinessInfo(
  userId: string = 'test_user',
  webhookUrl: string = 'https://n8n.example.com/webhook/test',
  phoneNumberId: string = 'test_phone_123'
): UserBusinessInfo {
  return {
    id: 'test_business_info_123',
    userId,
    businessName: 'Test Business',
    whatsappNumber: '15551234567',
    whatsappNumberId: phoneNumberId,
    wabaId: 'test_waba_123',
    accessToken: 'test_access_token',
    webhookUrl,
    webhookVerifyToken: 'test_secret',
    isActive: true,
    appId: 'test_app_123',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export async function createTestLookupFunction(
  testUserBusinessInfo: UserBusinessInfo
): Promise<(phoneNumberId: string) => Promise<UserBusinessInfo | null>> {
  return async (phoneNumberId: string) => {
    if (phoneNumberId === testUserBusinessInfo.whatsappNumberId) {
      return testUserBusinessInfo;
    }
    return null;
  };
}