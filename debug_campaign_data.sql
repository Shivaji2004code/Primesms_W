-- ============================================================================
-- DEBUG CAMPAIGN_LOGS DATA TO UNDERSTAND THE ISSUE
-- Check what data is actually stored in campaign_logs
-- ============================================================================

-- Check campaign_logs table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'campaign_logs'
ORDER BY ordinal_position;

-- Check sample data from campaign_logs
SELECT 
    id,
    campaign_name,
    template_used,
    phone_number_id,
    recipient_number,
    status,
    sent_at,
    delivered_at,
    created_at
FROM campaign_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check user_business_info to see phone numbers
SELECT 
    user_id,
    business_name,
    whatsapp_number,
    whatsapp_number_id,
    is_active
FROM user_business_info 
WHERE is_active = true
LIMIT 5;

-- Test the join to see what phone numbers we can get
SELECT 
    cl.campaign_name,
    cl.phone_number_id,
    ubi.whatsapp_number,
    ubi.business_name,
    cl.recipient_number,
    cl.sent_at,
    cl.status
FROM campaign_logs cl
LEFT JOIN user_business_info ubi ON cl.phone_number_id = ubi.whatsapp_number_id
ORDER BY cl.created_at DESC
LIMIT 10;

-- Count records by status to understand data state
SELECT 
    status,
    COUNT(*) as count,
    COUNT(recipient_number) as with_recipient,
    COUNT(sent_at) as with_sent_at,
    COUNT(phone_number_id) as with_phone_id
FROM campaign_logs 
GROUP BY status;