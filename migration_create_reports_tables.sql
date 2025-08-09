-- ============================================================================
-- CREATE REPORTS TABLES MIGRATION
-- Creates campaign_logs and message_logs tables for reports functionality
-- Run this on your Coolify/production database
-- ============================================================================

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 1: CREATE CAMPAIGN_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    template_used VARCHAR(255) NOT NULL,
    phone_number_id VARCHAR(255),
    language_code VARCHAR(10) DEFAULT 'en',
    total_recipients INTEGER DEFAULT 0,
    successful_sends INTEGER DEFAULT 0,
    failed_sends INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'paused')),
    campaign_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for campaign_logs
CREATE INDEX IF NOT EXISTS idx_campaign_logs_user_id ON campaign_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_status ON campaign_logs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_created_at ON campaign_logs(created_at DESC);

-- ============================================================================
-- STEP 2: CREATE MESSAGE_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaign_logs(id) ON DELETE CASCADE,
    recipient_number VARCHAR(20) NOT NULL,
    message_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'duplicate')),
    error_message TEXT,
    api_response JSONB,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    variables_used JSONB
);

-- Create indexes for message_logs
CREATE INDEX IF NOT EXISTS idx_message_logs_campaign_id ON message_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_recipient ON message_logs(recipient_number);

-- Create unique constraint to prevent duplicate messages
CREATE UNIQUE INDEX IF NOT EXISTS message_logs_campaign_recipient_unique 
ON message_logs(campaign_id, recipient_number);

-- ============================================================================
-- STEP 3: ADD UPDATE TRIGGERS (IF FUNCTION EXISTS)
-- ============================================================================

-- Check if update trigger function exists and add triggers
DO $$
BEGIN
    -- Check if the update trigger function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Add trigger for campaign_logs if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'update_campaign_logs_updated_at'
        ) THEN
            CREATE TRIGGER update_campaign_logs_updated_at 
            BEFORE UPDATE ON campaign_logs 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
            RAISE NOTICE '✅ Added update trigger for campaign_logs';
        ELSE
            RAISE NOTICE 'ℹ️ Update trigger for campaign_logs already exists';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ update_updated_at_column function not found, skipping triggers';
        RAISE NOTICE '💡 You can add this function later if needed';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Could not add triggers: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 4: UPDATE EXISTING FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Update credit_transactions foreign key if it exists
DO $$
BEGIN
    -- Check if credit_transactions table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_transactions') THEN
        -- Check if campaign_id column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'credit_transactions' AND column_name = 'campaign_id'
        ) THEN
            -- Add foreign key constraint if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'fk_credit_transactions_campaign_id'
            ) THEN
                ALTER TABLE credit_transactions 
                ADD CONSTRAINT fk_credit_transactions_campaign_id 
                FOREIGN KEY (campaign_id) REFERENCES campaign_logs(id) ON DELETE SET NULL;
                RAISE NOTICE '✅ Added foreign key constraint for credit_transactions.campaign_id';
            ELSE
                RAISE NOTICE 'ℹ️ Foreign key constraint for credit_transactions.campaign_id already exists';
            END IF;
        ELSE
            RAISE NOTICE '⚠️ campaign_id column does not exist in credit_transactions table';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ credit_transactions table does not exist, skipping foreign key';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Could not add foreign key constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 5: CREATE SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert a sample campaign for testing (only if no campaigns exist)
DO $$
DECLARE
    sample_user_id UUID;
    sample_campaign_id UUID;
BEGIN
    -- Get the first user ID for testing
    SELECT id INTO sample_user_id FROM users LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        -- Check if any campaigns exist
        IF NOT EXISTS (SELECT 1 FROM campaign_logs WHERE user_id = sample_user_id) THEN
            -- Insert sample campaign
            INSERT INTO campaign_logs (
                id, user_id, campaign_name, template_used, 
                total_recipients, successful_sends, status
            ) VALUES (
                gen_random_uuid(), sample_user_id, 'Sample Campaign', 'welcome_message',
                2, 2, 'completed'
            ) RETURNING id INTO sample_campaign_id;
            
            -- Insert sample message logs
            INSERT INTO message_logs (campaign_id, recipient_number, message_id, status, sent_at) VALUES
            (sample_campaign_id, '+1234567890', 'msg_123', 'delivered', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
            (sample_campaign_id, '+0987654321', 'msg_124', 'read', CURRENT_TIMESTAMP - INTERVAL '30 minutes');
            
            RAISE NOTICE '✅ Created sample campaign and message logs for testing';
        ELSE
            RAISE NOTICE 'ℹ️ Campaigns already exist, skipping sample data';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ No users found, cannot create sample data';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Could not create sample data: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 6: VERIFICATION
-- ============================================================================

-- Show created tables
DO $$
BEGIN
    RAISE NOTICE '🎉 REPORTS TABLES MIGRATION COMPLETED!';
    RAISE NOTICE '📋 Tables created:';
END $$;

-- Show campaign_logs structure
SELECT 'campaign_logs' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'campaign_logs' 
ORDER BY ordinal_position;

-- Show message_logs structure  
SELECT 'message_logs' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'message_logs' 
ORDER BY ordinal_position;

-- Show row counts
SELECT 
    'campaign_logs' as table_name, 
    COUNT(*) as row_count 
FROM campaign_logs
UNION ALL
SELECT 
    'message_logs' as table_name, 
    COUNT(*) as row_count 
FROM message_logs;

-- Test the reports query
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get a user ID for testing
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE '🧪 Testing reports query structure...';
        -- This won't return data, just test the query structure
        PERFORM 1 FROM campaign_logs cl
        LEFT JOIN message_logs ml ON cl.id = ml.campaign_id
        LEFT JOIN user_business_info ubi ON cl.phone_number_id = ubi.whatsapp_number_id 
        WHERE cl.user_id = test_user_id
        LIMIT 1;
        RAISE NOTICE '✅ Reports query structure is valid!';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Reports query test failed: %', SQLERRM;
END $$;

DO $$
BEGIN
    RAISE NOTICE '🚀 Your reports functionality should now work!';
    RAISE NOTICE '💡 Visit /manage-reports to test the functionality';
END $$;