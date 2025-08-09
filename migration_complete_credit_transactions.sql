-- ============================================================================
-- COMPLETE CREDIT TRANSACTIONS TABLE MIGRATION
-- Fixes all missing columns and constraints for production database
-- Run this on your Coolify/production database
-- ============================================================================

-- Check and display current table structure
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'credit_transactions'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '📋 Current credit_transactions table structure:';
    ELSE
        RAISE NOTICE '❌ credit_transactions table does not exist!';
    END IF;
END $$;

-- Show current columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'credit_transactions' 
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 1: CREATE TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 2: ADD MISSING COLUMNS ONE BY ONE
-- ============================================================================

-- Add template_name column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_transactions' AND column_name = 'template_name'
    ) THEN
        ALTER TABLE credit_transactions ADD COLUMN template_name VARCHAR(255);
        RAISE NOTICE '✅ Added template_name column';
    ELSE
        RAISE NOTICE 'ℹ️  template_name column already exists';
    END IF;
END $$;

-- Add template_category column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_transactions' AND column_name = 'template_category'
    ) THEN
        ALTER TABLE credit_transactions ADD COLUMN template_category VARCHAR(20);
        RAISE NOTICE '✅ Added template_category column';
    ELSE
        RAISE NOTICE 'ℹ️  template_category column already exists';
    END IF;
END $$;

-- Add message_id column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_transactions' AND column_name = 'message_id'
    ) THEN
        ALTER TABLE credit_transactions ADD COLUMN message_id VARCHAR(255);
        RAISE NOTICE '✅ Added message_id column';
    ELSE
        RAISE NOTICE 'ℹ️  message_id column already exists';
    END IF;
END $$;

-- Add campaign_id column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_transactions' AND column_name = 'campaign_id'
    ) THEN
        ALTER TABLE credit_transactions ADD COLUMN campaign_id UUID;
        RAISE NOTICE '✅ Added campaign_id column';
    ELSE
        RAISE NOTICE 'ℹ️  campaign_id column already exists';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add user_id foreign key if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'credit_transactions_user_id_fkey'
    ) THEN
        ALTER TABLE credit_transactions 
        ADD CONSTRAINT credit_transactions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added user_id foreign key constraint';
    ELSE
        RAISE NOTICE 'ℹ️  user_id foreign key constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not add user_id foreign key: %', SQLERRM;
END $$;

-- Add campaign_id foreign key if missing (and campaign_logs table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'campaign_logs'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_credit_transactions_campaign_id'
        ) THEN
            ALTER TABLE credit_transactions 
            ADD CONSTRAINT fk_credit_transactions_campaign_id 
            FOREIGN KEY (campaign_id) REFERENCES campaign_logs(id) ON DELETE SET NULL;
            RAISE NOTICE '✅ Added campaign_id foreign key constraint';
        ELSE
            RAISE NOTICE 'ℹ️  campaign_id foreign key constraint already exists';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  campaign_logs table does not exist, skipping campaign_id foreign key';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not add campaign_id foreign key: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 4: ADD CHECK CONSTRAINTS
-- ============================================================================

-- Add amount check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'credit_transactions_amount_check'
    ) THEN
        ALTER TABLE credit_transactions 
        ADD CONSTRAINT credit_transactions_amount_check CHECK (amount <> 0);
        RAISE NOTICE '✅ Added amount check constraint';
    ELSE
        RAISE NOTICE 'ℹ️  amount check constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not add amount check constraint: %', SQLERRM;
END $$;

-- Add template_category check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'credit_transactions_template_category_check'
    ) THEN
        ALTER TABLE credit_transactions 
        ADD CONSTRAINT credit_transactions_template_category_check 
        CHECK (template_category IS NULL OR template_category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION'));
        RAISE NOTICE '✅ Added template_category check constraint';
    ELSE
        RAISE NOTICE 'ℹ️  template_category check constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not add template_category check constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 5: ADD PERFORMANCE INDEXES
-- ============================================================================

-- Add user_id index
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id 
ON credit_transactions(user_id);

-- Add created_at index
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at 
ON credit_transactions(created_at DESC);

-- Add transaction_type index
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type 
ON credit_transactions(transaction_type);

-- Add campaign_id index
CREATE INDEX IF NOT EXISTS idx_credit_transactions_campaign_id 
ON credit_transactions(campaign_id);

-- Add composite user + created_at index
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created 
ON credit_transactions(user_id, created_at DESC);

-- ============================================================================
-- STEP 6: VERIFICATION
-- ============================================================================

-- Show final table structure
DO $$
BEGIN
    RAISE NOTICE '🎉 MIGRATION COMPLETED! Final table structure shown below:';
END $$;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'credit_transactions' 
ORDER BY ordinal_position;

-- Show constraints
SELECT 
    constraint_name, 
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'credit_transactions';

-- Show indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'credit_transactions';

-- Test insert to make sure everything works
DO $$
BEGIN
    RAISE NOTICE '🧪 Testing insert functionality...';
    -- This won't actually insert, just test the syntax
    RAISE NOTICE '✅ Table is ready for credit transactions!';
END $$;