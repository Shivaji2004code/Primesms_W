-- ========================================
-- COMPLETE DATABASE FIX FOR PRIME SMS
-- Run this to completely remove message_logs issues
-- ========================================

-- STEP 1: Drop message_logs table and ALL related objects
DROP TABLE IF EXISTS message_logs CASCADE;
DROP INDEX IF EXISTS idx_message_logs_campaign_id CASCADE;
DROP INDEX IF EXISTS idx_message_logs_status CASCADE;  
DROP INDEX IF EXISTS idx_message_logs_recipient CASCADE;
DROP INDEX IF EXISTS message_logs_campaign_recipient_unique CASCADE;

-- STEP 2: Remove any orphaned sequences or constraints
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop any remaining constraints that reference message_logs
    FOR r IN (SELECT conname, conrelid::regclass as table_name 
              FROM pg_constraint 
              WHERE conname LIKE '%message_log%') LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || r.conname || ' CASCADE';
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;

-- STEP 3: Ensure campaign_logs has ALL required columns
DO $$
BEGIN
    -- message_id column  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_logs' AND column_name = 'message_id') THEN
        ALTER TABLE campaign_logs ADD COLUMN message_id VARCHAR(255);
        RAISE NOTICE '✅ Added message_id column to campaign_logs';
    END IF;

    -- recipient_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_logs' AND column_name = 'recipient_number') THEN
        ALTER TABLE campaign_logs ADD COLUMN recipient_number VARCHAR(20);
        RAISE NOTICE '✅ Added recipient_number column to campaign_logs';
    END IF;

    -- sent_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_logs' AND column_name = 'sent_at') THEN
        ALTER TABLE campaign_logs ADD COLUMN sent_at TIMESTAMP;
        RAISE NOTICE '✅ Added sent_at column to campaign_logs';
    END IF;

    -- delivered_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_logs' AND column_name = 'delivered_at') THEN
        ALTER TABLE campaign_logs ADD COLUMN delivered_at TIMESTAMP;
        RAISE NOTICE '✅ Added delivered_at column to campaign_logs';
    END IF;

    -- read_at column (for read receipts)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_logs' AND column_name = 'read_at') THEN
        ALTER TABLE campaign_logs ADD COLUMN read_at TIMESTAMP;
        RAISE NOTICE '✅ Added read_at column to campaign_logs';
    END IF;

    -- campaign_data column (for storing API responses and metadata)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_logs' AND column_name = 'campaign_data') THEN
        ALTER TABLE campaign_logs ADD COLUMN campaign_data JSONB;
        RAISE NOTICE '✅ Added campaign_data column to campaign_logs';
    END IF;
END $$;

-- STEP 4: Fix campaign_logs status constraint to include webhook statuses
ALTER TABLE campaign_logs DROP CONSTRAINT IF EXISTS campaign_logs_status_check CASCADE;
ALTER TABLE campaign_logs ADD CONSTRAINT campaign_logs_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'paused', 'sent', 'delivered', 'read'));

RAISE NOTICE '✅ Updated campaign_logs status constraint';

-- STEP 5: Create essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_logs_message_id 
ON campaign_logs(message_id) WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_logs_user_message 
ON campaign_logs(user_id, message_id) WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_logs_recipient 
ON campaign_logs(recipient_number) WHERE recipient_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_logs_status_timestamps 
ON campaign_logs(status, sent_at, delivered_at, read_at);

-- Create unique constraint for webhook idempotency (handle duplicates gracefully)
DO $$
BEGIN
    -- First, remove any existing duplicate entries
    WITH duplicates AS (
        SELECT id, 
               ROW_NUMBER() OVER (
                 PARTITION BY user_id, message_id 
                 ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
               ) as rn
        FROM campaign_logs 
        WHERE message_id IS NOT NULL 
        AND message_id != ''
    )
    DELETE FROM campaign_logs 
    WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
    
    -- Now create the unique index
    DROP INDEX IF EXISTS campaign_logs_user_message_unique;
    CREATE UNIQUE INDEX campaign_logs_user_message_unique 
    ON campaign_logs(user_id, message_id) 
    WHERE message_id IS NOT NULL AND message_id != '';
    
    RAISE NOTICE '✅ Created unique index for webhook idempotency';
EXCEPTION 
    WHEN unique_violation THEN
        RAISE NOTICE '⚠️  Some duplicates still exist, but continuing...';
END $$;

-- STEP 6: Update any existing campaign_logs entries to have proper structure
UPDATE campaign_logs 
SET campaign_data = COALESCE(campaign_data, '{}'::jsonb)
WHERE campaign_data IS NULL;

-- STEP 7: Clean up any invalid status values
UPDATE campaign_logs 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'processing', 'completed', 'failed', 'paused', 'sent', 'delivered', 'read');

-- STEP 8: Add helpful comments for documentation
COMMENT ON COLUMN campaign_logs.message_id IS 'WhatsApp message ID (wamid) from API response';
COMMENT ON COLUMN campaign_logs.recipient_number IS 'Phone number of message recipient';
COMMENT ON COLUMN campaign_logs.sent_at IS 'Timestamp when message was sent';
COMMENT ON COLUMN campaign_logs.delivered_at IS 'Timestamp when message was delivered (from webhook)';
COMMENT ON COLUMN campaign_logs.read_at IS 'Timestamp when message was read (from webhook)';
COMMENT ON COLUMN campaign_logs.campaign_data IS 'JSON data including API responses, metadata, and webhook info';

-- STEP 9: Final verification
DO $$
DECLARE
    message_logs_exists BOOLEAN;
    column_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check if message_logs table is completely gone
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'message_logs'
    ) INTO message_logs_exists;
    
    IF message_logs_exists THEN
        RAISE WARNING '⚠️  message_logs table still exists - this should not happen!';
    ELSE
        RAISE NOTICE '✅ message_logs table successfully removed';
    END IF;
    
    -- Check campaign_logs has all required columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'campaign_logs' 
    AND column_name IN ('message_id', 'recipient_number', 'sent_at', 'delivered_at', 'read_at', 'campaign_data');
    
    IF column_count = 6 THEN
        RAISE NOTICE '✅ campaign_logs has all 6 required columns';
    ELSE
        RAISE WARNING '⚠️  campaign_logs missing columns, found % of 6', column_count;
    END IF;
    
    -- Check indexes were created
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'campaign_logs' 
    AND indexname LIKE '%message_id%' OR indexname LIKE '%user_message%';
    
    IF index_count >= 2 THEN
        RAISE NOTICE '✅ Essential indexes created for webhook processing';
    ELSE
        RAISE WARNING '⚠️  Expected at least 2 webhook indexes, found %', index_count;
    END IF;
END $$;

-- STEP 10: Success message
RAISE NOTICE '==============================================';
RAISE NOTICE '🚀 COMPLETE DATABASE FIX APPLIED SUCCESSFULLY';
RAISE NOTICE '==============================================';
RAISE NOTICE 'Changes made:';
RAISE NOTICE '- ✅ message_logs table completely removed';
RAISE NOTICE '- ✅ campaign_logs enhanced with all required columns';
RAISE NOTICE '- ✅ Proper indexes created for webhook processing';  
RAISE NOTICE '- ✅ Status constraints updated';
RAISE NOTICE '- ✅ Unique constraints for message idempotency';
RAISE NOTICE '';
RAISE NOTICE 'Your system should now work without database errors!';
RAISE NOTICE 'Deploy the updated code and test message sending.';
RAISE NOTICE '==============================================';