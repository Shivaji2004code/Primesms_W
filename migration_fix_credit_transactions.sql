-- ============================================================================
-- MIGRATION: Fix Credit Transactions Table
-- Adds missing template_category column to production database
-- Run this on your Coolify/production database
-- ============================================================================

-- Check if template_category column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_transactions' 
        AND column_name = 'template_category'
    ) THEN
        -- Add template_category column
        ALTER TABLE credit_transactions 
        ADD COLUMN template_category VARCHAR(20);
        
        -- Add constraint for template_category
        ALTER TABLE credit_transactions 
        ADD CONSTRAINT credit_transactions_template_category_check 
        CHECK (template_category IS NULL OR template_category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION'));
        
        RAISE NOTICE '✅ Added template_category column to credit_transactions table';
    ELSE
        RAISE NOTICE 'ℹ️ template_category column already exists in credit_transactions table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'credit_transactions' 
AND column_name = 'template_category';

-- Show table structure to confirm
\d+ credit_transactions

RAISE NOTICE '🚀 Migration completed successfully!';
RAISE NOTICE '💡 You can now test credit deduction functionality';