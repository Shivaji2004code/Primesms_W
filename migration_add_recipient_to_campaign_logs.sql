-- ============================================================================
-- ADD RECIPIENT DATA TO CAMPAIGN_LOGS FOR DETAILED REPORTS
-- This allows campaign_logs to store individual recipient information
-- Run this on your Coolify/production database
-- ============================================================================

-- Add recipient-specific columns to campaign_logs
DO $$
BEGIN
    RAISE NOTICE '🔄 Adding recipient fields to campaign_logs...';
    
    -- Add recipient_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'recipient_number') THEN
        ALTER TABLE campaign_logs ADD COLUMN recipient_number VARCHAR(20);
        RAISE NOTICE '✅ Added recipient_number column';
    ELSE
        RAISE NOTICE 'ℹ️ recipient_number column already exists';
    END IF;
    
    -- Add sent_at column for message timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'sent_at') THEN
        ALTER TABLE campaign_logs ADD COLUMN sent_at TIMESTAMP;
        RAISE NOTICE '✅ Added sent_at column';
    ELSE
        RAISE NOTICE 'ℹ️ sent_at column already exists';
    END IF;
    
    -- Add delivered_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'delivered_at') THEN
        ALTER TABLE campaign_logs ADD COLUMN delivered_at TIMESTAMP;
        RAISE NOTICE '✅ Added delivered_at column';
    ELSE
        RAISE NOTICE 'ℹ️ delivered_at column already exists';
    END IF;
    
    -- Add message_id for tracking individual messages
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'message_id') THEN
        ALTER TABLE campaign_logs ADD COLUMN message_id VARCHAR(255);
        RAISE NOTICE '✅ Added message_id column';
    ELSE
        RAISE NOTICE 'ℹ️ message_id column already exists';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error adding columns: %', SQLERRM;
END $$;

-- Update the campaign_logs structure to handle both campaign and individual message records
COMMENT ON COLUMN campaign_logs.recipient_number IS 'Individual recipient phone number for message-level tracking';
COMMENT ON COLUMN campaign_logs.sent_at IS 'When the individual message was sent';
COMMENT ON COLUMN campaign_logs.delivered_at IS 'When the individual message was delivered';
COMMENT ON COLUMN campaign_logs.message_id IS 'WhatsApp message ID for individual messages';

-- Add index for recipient number filtering
CREATE INDEX IF NOT EXISTS idx_campaign_logs_recipient_number ON campaign_logs(recipient_number);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_sent_at ON campaign_logs(sent_at DESC);

-- Update existing records to have proper structure
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    -- Count existing records
    SELECT COUNT(*) INTO record_count FROM campaign_logs;
    RAISE NOTICE '📊 Found % existing campaign_logs records', record_count;
    
    IF record_count > 0 THEN
        RAISE NOTICE '💡 Existing records will need recipient data populated when messages are sent';
    END IF;
END $$;

RAISE NOTICE '🎉 Migration complete! campaign_logs now supports recipient-level data';
RAISE NOTICE '💡 This allows reports to show both campaign and individual message information';