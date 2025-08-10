-- Add index for WhatsApp phone number ID lookups (for webhook routing)
-- This optimizes the lookupByPhoneNumberId query used in webhooks

CREATE INDEX IF NOT EXISTS idx_user_business_info_whatsapp_number_id 
ON user_business_info(whatsapp_number_id) 
WHERE is_active = true;

COMMENT ON INDEX idx_user_business_info_whatsapp_number_id 
IS 'Optimize webhook routing by phone_number_id lookup';