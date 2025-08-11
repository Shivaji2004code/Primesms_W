-- Migration: Add indexes for template status updates and webhook processing
-- Performance optimizations for template status webhooks and Graph API fallback

-- Add index for phone number ID lookups (used in webhook processing)
CREATE INDEX IF NOT EXISTS idx_user_business_info_whatsapp_number_id 
ON user_business_info(whatsapp_number_id);

-- Add composite index for template lookups by user, name, language
CREATE INDEX IF NOT EXISTS idx_templates_user_name_language 
ON templates(user_id, name, language);

-- Add index for templates by user and status (for dashboard filtering)
CREATE INDEX IF NOT EXISTS idx_templates_user_status_updated 
ON templates(user_id, status, updated_at DESC);

-- Add index for rejection_reason queries (when filtering failed templates)
CREATE INDEX IF NOT EXISTS idx_templates_rejection_reason 
ON templates(rejection_reason) WHERE rejection_reason IS NOT NULL;

-- Comments for documentation
COMMENT ON INDEX idx_user_business_info_whatsapp_number_id IS 'Fast lookup of users by WhatsApp phone number ID for webhook processing';
COMMENT ON INDEX idx_templates_user_name_language IS 'Composite index for template upsert operations from webhooks';
COMMENT ON INDEX idx_templates_user_status_updated IS 'Dashboard queries for user templates ordered by status and update time';
COMMENT ON INDEX idx_templates_rejection_reason IS 'Partial index for templates with rejection reasons';

-- Verify indexes were created
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname IN (
        'idx_user_business_info_whatsapp_number_id',
        'idx_templates_user_name_language', 
        'idx_templates_user_status_updated',
        'idx_templates_rejection_reason'
    );
    
    IF index_count = 4 THEN
        RAISE NOTICE '✅ All 4 template status indexes created successfully';
    ELSE
        RAISE WARNING '⚠️ Expected 4 indexes, found %', index_count;
    END IF;
END $$;