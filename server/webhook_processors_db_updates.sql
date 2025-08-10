-- Database updates required for webhook processors and SSE functionality

-- Add indexes for efficient webhook processing
CREATE INDEX IF NOT EXISTS idx_campaign_logs_message_id 
ON campaign_logs(message_id) WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_logs_user_message 
ON campaign_logs(user_id, message_id) WHERE message_id IS NOT NULL;

-- Add unique constraint to prevent duplicate message entries
-- This will help with upsert operations in webhook processing
CREATE UNIQUE INDEX IF NOT EXISTS campaign_logs_user_message_unique 
ON campaign_logs(user_id, message_id) WHERE message_id IS NOT NULL;

-- Add index for templates lookup by name and language (for webhook updates)
CREATE INDEX IF NOT EXISTS idx_templates_user_name_lang 
ON templates(user_id, name, language);

-- Comments for documentation
COMMENT ON INDEX idx_campaign_logs_message_id 
IS 'Optimize webhook message status updates by message_id lookup';

COMMENT ON INDEX idx_campaign_logs_user_message 
IS 'Optimize user-specific message status updates';

COMMENT ON INDEX campaign_logs_user_message_unique 
IS 'Prevent duplicate message entries from multiple webhook calls';

COMMENT ON INDEX idx_templates_user_name_lang 
IS 'Optimize template status updates from webhook by name and language';