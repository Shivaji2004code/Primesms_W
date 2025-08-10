-- Migration for Webhook Processors and SSE functionality
-- Run this ONCE before deploying webhook processors

-- Add efficient indexes for webhook processing
CREATE INDEX IF NOT EXISTS idx_campaign_logs_message_id 
ON campaign_logs(message_id) WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_logs_user_message 
ON campaign_logs(user_id, message_id) WHERE message_id IS NOT NULL;

-- Add index for templates lookup by name and language (for webhook updates)
CREATE INDEX IF NOT EXISTS idx_templates_user_name_lang 
ON templates(user_id, name, language);

-- Handle the unique constraint carefully (may fail if duplicates exist)
DO $$
BEGIN
  -- Try to create unique index, but catch error if duplicates exist
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS campaign_logs_user_message_unique 
    ON campaign_logs(user_id, message_id) WHERE message_id IS NOT NULL;
    
    RAISE NOTICE '✅ Unique index created successfully';
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE NOTICE '⚠️  Duplicate message_ids found. Cleaning up...';
      
      -- Remove duplicates, keeping the most recent entry
      WITH duplicates AS (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY user_id, message_id ORDER BY updated_at DESC, created_at DESC) as rn
        FROM campaign_logs 
        WHERE message_id IS NOT NULL
      )
      DELETE FROM campaign_logs 
      WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
      );
      
      -- Now create the unique index
      CREATE UNIQUE INDEX IF NOT EXISTS campaign_logs_user_message_unique 
      ON campaign_logs(user_id, message_id) WHERE message_id IS NOT NULL;
      
      RAISE NOTICE '✅ Duplicates cleaned up and unique index created';
  END;
END $$;

-- Add comments for documentation
COMMENT ON INDEX idx_campaign_logs_message_id 
IS 'Optimize webhook message status updates by message_id lookup';

COMMENT ON INDEX idx_campaign_logs_user_message 
IS 'Optimize user-specific message status updates';

COMMENT ON INDEX campaign_logs_user_message_unique 
IS 'Prevent duplicate message entries from multiple webhook calls';

COMMENT ON INDEX idx_templates_user_name_lang 
IS 'Optimize template status updates from webhook by name and language';

-- Verify the migration
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename IN ('campaign_logs', 'templates') 
  AND indexname LIKE '%message_id%' OR indexname LIKE '%user_name_lang%';
  
  IF index_count >= 3 THEN
    RAISE NOTICE '✅ Webhook processor indexes created successfully';
  ELSE
    RAISE WARNING '⚠️  Expected at least 3 indexes, found %', index_count;
  END IF;
END $$;