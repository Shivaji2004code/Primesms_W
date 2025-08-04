-- Fix for PostgreSQL "no unique or exclusion constraint matching the ON CONFLICT specification" error
-- This adds the missing UNIQUE constraint to message_logs table

-- Add unique constraint on campaign_id and recipient_number
-- This allows the ON CONFLICT clause to work properly in the WhatsApp message sending code
ALTER TABLE message_logs 
ADD CONSTRAINT message_logs_campaign_recipient_unique 
UNIQUE (campaign_id, recipient_number);

-- Verify the constraint was added
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    a.attname as column_name
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum = ANY(con.conkey)
WHERE rel.relname = 'message_logs' 
AND con.contype = 'u'  -- unique constraints
ORDER BY conname, a.attnum;