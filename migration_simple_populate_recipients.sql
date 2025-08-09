-- ============================================================================
-- SIMPLE MIGRATION: POPULATE CAMPAIGN_LOGS WITH INDIVIDUAL RECIPIENTS
-- Creates one campaign_logs entry per recipient from existing message_logs
-- ============================================================================

-- Check current state
SELECT 'Before Migration' as status,
  COUNT(*) as total_campaign_records,
  COUNT(recipient_number) as with_recipient_data
FROM campaign_logs;

-- Insert individual recipient records
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
  created_at
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
  COALESCE(ml.created_at, cl.created_at) as created_at
FROM campaign_logs cl
JOIN message_logs ml ON cl.id = ml.campaign_id
WHERE NOT EXISTS (
  -- Avoid duplicates
  SELECT 1 FROM campaign_logs cl2 
  WHERE cl2.user_id = cl.user_id 
  AND cl2.campaign_name = cl.campaign_name
  AND cl2.recipient_number = ml.recipient_number
  AND cl2.message_id = ml.message_id
);

-- Check results
SELECT 'After Migration' as status,
  COUNT(*) as total_campaign_records,
  COUNT(recipient_number) as with_recipient_data,
  COUNT(DISTINCT user_id) as users,
  COUNT(DISTINCT campaign_name) as campaigns
FROM campaign_logs;

-- Show sample of new data
SELECT 
  campaign_name,
  recipient_number,
  status,
  sent_at
FROM campaign_logs 
WHERE recipient_number IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;