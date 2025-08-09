-- ============================================================================
-- DEBUG REPORTS ISSUE
-- Test the exact query that the API uses and identify problems
-- ============================================================================

-- Test 1: Basic data check
DO $$
DECLARE
    campaign_count INTEGER;
    message_count INTEGER;
    user_business_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO campaign_count FROM campaign_logs;
    SELECT COUNT(*) INTO message_count FROM message_logs;
    SELECT COUNT(*) INTO user_business_count FROM user_business_info;
    
    RAISE NOTICE '📊 Data Status:';
    RAISE NOTICE '  - campaign_logs: % records', campaign_count;
    RAISE NOTICE '  - message_logs: % records', message_count;  
    RAISE NOTICE '  - user_business_info: % records', user_business_count;
END $$;

-- Test 2: Check the EXACT query the API uses with a test user
DO $$
DECLARE
    test_user_id UUID;
    result_count INTEGER;
BEGIN
    -- Get the first user ID
    SELECT id INTO test_user_id FROM users LIMIT 1;
    RAISE NOTICE '🧪 Testing with user_id: %', test_user_id;
    
    -- Test the exact API query structure
    SELECT COUNT(*) INTO result_count
    FROM campaign_logs cl
    JOIN message_logs ml ON cl.id = ml.campaign_id
    LEFT JOIN user_business_info ubi ON cl.phone_number_id = ubi.whatsapp_number_id AND cl.user_id = ubi.user_id
    WHERE cl.user_id = test_user_id;
    
    RAISE NOTICE '✅ API query returned % records', result_count;
    
    IF result_count = 0 THEN
        RAISE NOTICE '⚠️ No results found - checking individual parts...';
        
        -- Check campaign_logs for this user
        SELECT COUNT(*) INTO result_count FROM campaign_logs WHERE user_id = test_user_id;
        RAISE NOTICE '  - campaign_logs for user: % records', result_count;
        
        -- Check message_logs join
        SELECT COUNT(*) INTO result_count 
        FROM campaign_logs cl 
        JOIN message_logs ml ON cl.id = ml.campaign_id 
        WHERE cl.user_id = test_user_id;
        RAISE NOTICE '  - campaign_logs + message_logs: % records', result_count;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Query failed with error: %', SQLERRM;
END $$;

-- Test 3: Show sample data structure
RAISE NOTICE '📋 Sample Data:';
SELECT 
    cl.campaign_name,
    cl.template_used,
    cl.phone_number_id,
    ml.recipient_number,
    ml.status,
    ml.created_at
FROM campaign_logs cl
LEFT JOIN message_logs ml ON cl.id = ml.campaign_id
LIMIT 3;

-- Test 4: Check for potential issues in the user_business_info join
DO $$
DECLARE
    join_issues INTEGER;
BEGIN
    -- Count campaigns that don't match user_business_info
    SELECT COUNT(*) INTO join_issues
    FROM campaign_logs cl
    WHERE cl.phone_number_id IS NOT NULL 
    AND NOT EXISTS (
        SELECT 1 FROM user_business_info ubi 
        WHERE cl.phone_number_id = ubi.whatsapp_number_id 
        AND cl.user_id = ubi.user_id
    );
    
    RAISE NOTICE '⚠️ Campaigns with phone_number_id that don''t match user_business_info: %', join_issues;
    
    IF join_issues > 0 THEN
        RAISE NOTICE '💡 This could cause the LEFT JOIN to return unexpected results';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Join analysis failed: %', SQLERRM;
END $$;

-- Test 5: Simplified query without user_business_info join
DO $$
DECLARE
    test_user_id UUID;
    simple_count INTEGER;
BEGIN
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    -- Test simplified query
    SELECT COUNT(*) INTO simple_count
    FROM campaign_logs cl
    JOIN message_logs ml ON cl.id = ml.campaign_id
    WHERE cl.user_id = test_user_id;
    
    RAISE NOTICE '✅ Simplified query (without user_business_info): % records', simple_count;
END $$;

RAISE NOTICE '🔍 Debug complete - check the results above to identify the issue';