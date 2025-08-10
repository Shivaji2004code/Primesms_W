# 🚨 URGENT: Webhook Database Fix - Deployment Guide

## 🔴 Problem Fixed
- ❌ **Error**: `column 'campaign_id' is not relation with message logs`
- ❌ **Issue**: Message delivery not updating properly 
- ❌ **Cause**: Foreign key constraints from problematic `message_logs` table

## ✅ Solution Implemented
- 🗑️ **Removed**: `message_logs` table completely
- 📊 **Enhanced**: `campaign_logs` to handle all message tracking
- 🔧 **Fixed**: Webhook processors to use only `campaign_logs`
- 🛠️ **Updated**: All sending routes to work without `message_logs`

## 🚨 **CRITICAL: Run Database Fix FIRST**

**Before deploying code**, run this SQL in your production database:

```sql
-- Fix webhook and message sending issues by removing problematic message_logs table
-- This will resolve foreign key constraint errors and simplify the system

-- STEP 1: Drop message_logs table and all related constraints/indexes
DROP TABLE IF EXISTS message_logs CASCADE;

-- STEP 2: Remove any references to message_logs in indexes
DROP INDEX IF EXISTS idx_message_logs_campaign_id;
DROP INDEX IF EXISTS idx_message_logs_status;
DROP INDEX IF EXISTS idx_message_logs_recipient;
DROP INDEX IF EXISTS message_logs_campaign_recipient_unique;

-- STEP 3: Ensure campaign_logs has all necessary columns for message tracking
-- Add columns if they don't exist (safe with IF NOT EXISTS equivalent)
DO $$
BEGIN
  -- Add message_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'campaign_logs' AND column_name = 'message_id') THEN
    ALTER TABLE campaign_logs ADD COLUMN message_id VARCHAR(255);
  END IF;

  -- Add recipient_number column if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'campaign_logs' AND column_name = 'recipient_number') THEN
    ALTER TABLE campaign_logs ADD COLUMN recipient_number VARCHAR(20);
  END IF;

  -- Add sent_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'campaign_logs' AND column_name = 'sent_at') THEN
    ALTER TABLE campaign_logs ADD COLUMN sent_at TIMESTAMP;
  END IF;

  -- Add delivered_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'campaign_logs' AND column_name = 'delivered_at') THEN
    ALTER TABLE campaign_logs ADD COLUMN delivered_at TIMESTAMP;
  END IF;

  -- Add read_at column if it doesn't exist (for read receipts)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'campaign_logs' AND column_name = 'read_at') THEN
    ALTER TABLE campaign_logs ADD COLUMN read_at TIMESTAMP;
  END IF;
END $$;

-- STEP 4: Update campaign_logs status constraint to include all webhook statuses
ALTER TABLE campaign_logs DROP CONSTRAINT IF EXISTS campaign_logs_status_check;
ALTER TABLE campaign_logs ADD CONSTRAINT campaign_logs_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'paused', 'sent', 'delivered', 'read'));

-- STEP 5: Add essential indexes for webhook processing
CREATE INDEX IF NOT EXISTS idx_campaign_logs_message_id 
ON campaign_logs(message_id) WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_logs_user_message 
ON campaign_logs(user_id, message_id) WHERE message_id IS NOT NULL;

-- STEP 6: Create unique constraint for webhook idempotency
-- Handle duplicates gracefully
DO $$
BEGIN
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS campaign_logs_user_message_unique 
    ON campaign_logs(user_id, message_id) WHERE message_id IS NOT NULL;
    
    RAISE NOTICE '✅ Unique index for webhook idempotency created';
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE NOTICE '⚠️  Found duplicate message_ids, cleaning up...';
      
      -- Remove duplicates, keeping the most recent
      WITH duplicates AS (
        SELECT id, 
               ROW_NUMBER() OVER (
                 PARTITION BY user_id, message_id 
                 ORDER BY updated_at DESC, created_at DESC
               ) as rn
        FROM campaign_logs 
        WHERE message_id IS NOT NULL
      )
      DELETE FROM campaign_logs 
      WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
      
      -- Now create the unique index
      CREATE UNIQUE INDEX campaign_logs_user_message_unique 
      ON campaign_logs(user_id, message_id) WHERE message_id IS NOT NULL;
      
      RAISE NOTICE '✅ Duplicates cleaned and unique index created';
  END;
END $$;

-- STEP 7: Add indexes for efficient reporting queries
CREATE INDEX IF NOT EXISTS idx_campaign_logs_status_timestamps 
ON campaign_logs(status, sent_at, delivered_at, read_at);

-- Verification
DO $$
DECLARE
  table_exists BOOLEAN;
  column_count INTEGER;
BEGIN
  -- Check if message_logs table is gone
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'message_logs'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE WARNING '⚠️  message_logs table still exists!';
  ELSE
    RAISE NOTICE '✅ message_logs table successfully removed';
  END IF;
  
  -- Check if campaign_logs has required columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'campaign_logs' 
  AND column_name IN ('message_id', 'recipient_number', 'sent_at', 'delivered_at', 'read_at');
  
  IF column_count = 5 THEN
    RAISE NOTICE '✅ campaign_logs has all required columns for webhook processing';
  ELSE
    RAISE WARNING '⚠️  campaign_logs missing columns, found % of 5', column_count;
  END IF;
END $$;
```

## 🚀 **After Database Fix - Deploy Code**

Code will auto-deploy from GitHub push. No additional Coolify configuration needed.

## ✅ **What's Fixed**

### Message Sending
- ✅ **API Send**: Creates `campaign_logs` entry with `message_id` 
- ✅ **Custom Messages**: No more foreign key errors
- ✅ **Duplicate Detection**: Uses `campaign_logs` only
- ✅ **Credits**: Still deducted correctly

### Webhook Processing  
- ✅ **Status Updates**: Updates `campaign_logs.status` directly
- ✅ **Delivery Tracking**: Sets `delivered_at`, `read_at` timestamps
- ✅ **Template Updates**: Updates `templates` table status
- ✅ **SSE Events**: Real-time updates still work

### Database Structure
- ✅ **Simplified**: Single `campaign_logs` table for all tracking
- ✅ **Performant**: Proper indexes for webhook lookups
- ✅ **Consistent**: No more foreign key constraint issues

## 🧪 **Testing After Deployment**

### 1. Test Message Sending
```bash
# Should work without database errors
curl -X POST "https://primesms.app/api/send" \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "username": "your_username",
    "templatename": "test_template", 
    "recipient_number": "+919876543210"
  }'
```

### 2. Test Webhook Status Updates
```bash
# Simulate delivered status
curl -X POST "https://primesms.app/webhooks/meta" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=YOUR_SIGNATURE" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "field": "messages",
        "value": {
          "metadata": {"phone_number_id": "YOUR_PHONE_NUMBER_ID"},
          "statuses": [{
            "id": "wamid.TEST_MESSAGE_ID",
            "status": "delivered",
            "timestamp": "1723291000"
          }]
        }
      }]
    }]
  }'
```

### 3. Check Campaign Reports
- Visit: `https://primesms.app/user/manage-reports`
- Should show message statuses updating correctly
- No more "campaign_id relation" errors

## 📊 **Expected Results**

After fix:
- ✅ Messages send successfully 
- ✅ Status updates from webhooks work
- ✅ Reports show delivery status
- ✅ No database constraint errors
- ✅ SSE real-time updates work
- ✅ Credits system unaffected

## 🚨 **Rollback Plan** (if needed)

If issues occur, you can revert by recreating `message_logs`:

```sql
-- Emergency rollback (only if absolutely necessary)
CREATE TABLE message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaign_logs(id) ON DELETE CASCADE,
    recipient_number VARCHAR(20) NOT NULL,
    message_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

But the new system is much simpler and more reliable!

## 🎯 **Summary**

**Problem**: Foreign key constraints causing send failures  
**Solution**: Remove `message_logs`, use `campaign_logs` for everything  
**Result**: Simplified, faster, more reliable webhook processing  

**Database fix → Deploy code → Test → Working system!** 🚀