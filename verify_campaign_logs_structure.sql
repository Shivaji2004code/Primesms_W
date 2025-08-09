-- ============================================================================
-- VERIFY CAMPAIGN_LOGS TABLE STRUCTURE FOR SIMPLIFIED REPORTS
-- Run this to ensure campaign_logs has all required fields for reports
-- ============================================================================

-- Check if campaign_logs table exists and has all required columns
DO $$
DECLARE
    col_count INTEGER;
    missing_cols TEXT[] := '{}';
BEGIN
    RAISE NOTICE '🔍 Checking campaign_logs table structure...';
    
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_logs') THEN
        RAISE NOTICE '❌ campaign_logs table does not exist!';
        RAISE NOTICE '💡 Run migration_complete_production_fix.sql first';
        RETURN;
    END IF;
    
    -- Check required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'id') THEN
        missing_cols := array_append(missing_cols, 'id UUID PRIMARY KEY');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'user_id') THEN
        missing_cols := array_append(missing_cols, 'user_id UUID NOT NULL');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'campaign_name') THEN
        missing_cols := array_append(missing_cols, 'campaign_name VARCHAR(255)');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'template_used') THEN
        missing_cols := array_append(missing_cols, 'template_used VARCHAR(255)');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'phone_number_id') THEN
        missing_cols := array_append(missing_cols, 'phone_number_id VARCHAR(255)');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'total_recipients') THEN
        missing_cols := array_append(missing_cols, 'total_recipients INTEGER DEFAULT 0');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'successful_sends') THEN
        missing_cols := array_append(missing_cols, 'successful_sends INTEGER DEFAULT 0');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'failed_sends') THEN
        missing_cols := array_append(missing_cols, 'failed_sends INTEGER DEFAULT 0');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'status') THEN
        missing_cols := array_append(missing_cols, 'status VARCHAR(20) DEFAULT ''pending''');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'error_message') THEN
        missing_cols := array_append(missing_cols, 'error_message TEXT');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'created_at') THEN
        missing_cols := array_append(missing_cols, 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_logs' AND column_name = 'updated_at') THEN
        missing_cols := array_append(missing_cols, 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    END IF;
    
    -- Report results
    IF array_length(missing_cols, 1) > 0 THEN
        RAISE NOTICE '❌ Missing columns in campaign_logs:';
        FOR i IN 1..array_length(missing_cols, 1) LOOP
            RAISE NOTICE '  - %', missing_cols[i];
        END LOOP;
        RAISE NOTICE '💡 Run the migration script to add missing columns';
    ELSE
        RAISE NOTICE '✅ campaign_logs table has all required columns for reports';
    END IF;
    
    -- Show current structure
    RAISE NOTICE '📋 Current campaign_logs structure:';
END $$;

-- Show the actual table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'campaign_logs'
ORDER BY ordinal_position;

-- Show sample data if any exists
DO $$
DECLARE
    sample_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO sample_count FROM campaign_logs LIMIT 1;
    IF sample_count > 0 THEN
        RAISE NOTICE '📊 Sample campaign_logs data:';
    ELSE
        RAISE NOTICE '📊 No data in campaign_logs table yet';
    END IF;
END $$;

-- Show sample data
SELECT 
    campaign_name,
    template_used,
    total_recipients,
    successful_sends,
    failed_sends,
    status,
    created_at
FROM campaign_logs 
ORDER BY created_at DESC 
LIMIT 3;

-- Final verification
DO $$
DECLARE
    has_indexes BOOLEAN := FALSE;
BEGIN
    -- Check if performance indexes exist
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'campaign_logs' AND indexname = 'idx_campaign_logs_user_id') THEN
        has_indexes := TRUE;
    END IF;
    
    IF has_indexes THEN
        RAISE NOTICE '✅ Performance indexes are in place';
    ELSE
        RAISE NOTICE '⚠️ Consider adding performance indexes for better query speed';
    END IF;
    
    RAISE NOTICE '🎯 VERIFICATION COMPLETE';
    RAISE NOTICE '💡 If everything looks good, your simplified reports should work with campaign_logs only';
END $$;