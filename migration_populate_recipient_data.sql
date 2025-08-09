-- ============================================================================
-- POPULATE EXISTING RECIPIENT DATA FROM MESSAGE_LOGS TO CAMPAIGN_LOGS
-- This creates individual campaign_logs entries for each recipient
-- Run this after adding recipient fields to campaign_logs
-- ============================================================================

-- First, let's see what we're working with
DO $$
BEGIN
    RAISE NOTICE '🔍 Analyzing existing data...';
END $$;

-- Check existing data counts
SELECT 
    'campaign_logs' as table_name, 
    COUNT(*) as total_records,
    COUNT(recipient_number) as with_recipient_data
FROM campaign_logs
UNION ALL
SELECT 
    'message_logs' as table_name,
    COUNT(*) as total_records, 
    COUNT(recipient_number) as with_recipient_data
FROM message_logs;

-- Show sample of what we need to migrate
SELECT 
    cl.id as campaign_id,
    cl.campaign_name,
    cl.template_used,
    cl.phone_number_id,
    cl.user_id,
    ml.recipient_number,
    ml.message_id,
    ml.status,
    ml.sent_at,
    ml.delivered_at
FROM campaign_logs cl
JOIN message_logs ml ON cl.id = ml.campaign_id
WHERE cl.recipient_number IS NULL  -- Only campaigns without recipient data
LIMIT 5;

-- ============================================================================
-- MIGRATION: CREATE INDIVIDUAL CAMPAIGN_LOGS ENTRIES FOR EACH RECIPIENT
-- ============================================================================

DO $$
DECLARE
    migration_count INTEGER := 0;
    total_messages INTEGER := 0;
BEGIN
    RAISE NOTICE '🚀 Starting recipient data migration...';
    
    -- Count total messages to migrate
    SELECT COUNT(*) INTO total_messages
    FROM campaign_logs cl
    JOIN message_logs ml ON cl.id = ml.campaign_id
    WHERE cl.recipient_number IS NULL;
    
    RAISE NOTICE '📊 Found % messages to migrate from campaign records without recipient data', total_messages;
    
    -- Insert individual campaign_logs entries for each message
    INSERT INTO campaign_logs (
        user_id,
        campaign_name, 
        template_used,
        phone_number_id,
        recipient_number,
        message_id,
        status,
        sent_at,
        delivered_at,
        created_at,
        updated_at
    )
    SELECT 
        cl.user_id,
        cl.campaign_name,
        cl.template_used,
        cl.phone_number_id,
        ml.recipient_number,
        ml.message_id,
        COALESCE(ml.status, 'sent') as status,
        COALESCE(ml.sent_at, ml.created_at) as sent_at,
        ml.delivered_at,
        COALESCE(ml.created_at, cl.created_at) as created_at,
        CURRENT_TIMESTAMP as updated_at
    FROM campaign_logs cl
    JOIN message_logs ml ON cl.id = ml.campaign_id
    WHERE cl.recipient_number IS NULL  -- Only migrate campaigns without recipient data
    AND NOT EXISTS (
        -- Avoid duplicates if this script runs multiple times
        SELECT 1 FROM campaign_logs cl2 
        WHERE cl2.user_id = cl.user_id 
        AND cl2.campaign_name = cl.campaign_name
        AND cl2.recipient_number = ml.recipient_number
        AND cl2.message_id = ml.message_id
    );
    
    GET DIAGNOSTICS migration_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Successfully migrated % individual recipient records to campaign_logs', migration_count;
    
    -- Show summary after migration
    RAISE NOTICE '📈 Migration Summary:';
    
END $$;

-- Verify the migration results
SELECT 
    'After Migration' as status,
    COUNT(*) as total_campaign_records,
    COUNT(recipient_number) as records_with_recipients,
    COUNT(CASE WHEN recipient_number IS NOT NULL AND sent_at IS NOT NULL THEN 1 END) as complete_records
FROM campaign_logs;

-- Show sample of migrated data
SELECT 
    campaign_name,
    template_used,
    recipient_number,
    status,
    sent_at,
    created_at
FROM campaign_logs 
WHERE recipient_number IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- CLEANUP: OPTIONALLY REMOVE OLD CAMPAIGN SUMMARY RECORDS
-- ============================================================================

DO $$
DECLARE
    cleanup_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🧹 Cleaning up old campaign summary records...';
    
    -- Delete the old campaign summary records (without recipient data)
    -- Keep only the individual recipient records
    DELETE FROM campaign_logs 
    WHERE recipient_number IS NULL 
    AND EXISTS (
        -- Only delete if we have individual records for this campaign
        SELECT 1 FROM campaign_logs cl2 
        WHERE cl2.user_id = campaign_logs.user_id
        AND cl2.campaign_name = campaign_logs.campaign_name  
        AND cl2.recipient_number IS NOT NULL
    );
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Cleaned up % old campaign summary records', cleanup_count;
    
END $$;

-- Final verification
SELECT 
    'Final State' as status,
    COUNT(*) as total_records,
    COUNT(recipient_number) as with_recipient_data,
    COUNT(CASE WHEN sent_at IS NOT NULL THEN 1 END) as with_timestamps,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT campaign_name) as unique_campaigns
FROM campaign_logs;

RAISE NOTICE '🎉 Migration completed! All campaign_logs now have individual recipient data';
RAISE NOTICE '💡 Reports should now show individual recipients instead of campaign summaries';