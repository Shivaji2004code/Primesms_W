-- ============================================================================
-- PRIME SMS - COMPLETE DATABASE SCHEMA
-- Production-ready schema for WhatsApp Business API SaaS Platform
-- Database: PrimeSMS_W (Port: 5431)
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table - Main user accounts
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    credit_balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Business Info - WhatsApp Business API credentials
CREATE TABLE IF NOT EXISTS user_business_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    whatsapp_number VARCHAR(20),
    whatsapp_number_id VARCHAR(255),
    waba_id VARCHAR(255),
    access_token TEXT,
    webhook_url VARCHAR(500),
    webhook_verify_token VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    app_id VARCHAR(255),
    UNIQUE(user_id)
);

-- ============================================================================
-- TEMPLATE MANAGEMENT
-- ============================================================================

-- Templates - WhatsApp message templates
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('UTILITY', 'MARKETING', 'AUTHENTICATION')),
    language VARCHAR(10) NOT NULL DEFAULT 'en_US',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAUSED', 'DISABLED')),
    
    -- Template components as JSON
    components JSONB NOT NULL,
    
    -- WhatsApp API fields
    template_id VARCHAR(255),
    message_send_ttl_seconds INTEGER,
    allow_category_change BOOLEAN DEFAULT true,
    
    -- Media handling
    header_media_id VARCHAR(255),
    header_type VARCHAR(20) DEFAULT 'NONE',
    header_media_url TEXT,
    header_handle TEXT,
    media_id TEXT,
    
    -- Quality and status
    quality_rating VARCHAR(20) CHECK (quality_rating IN ('HIGH', 'MEDIUM', 'LOW', 'QUALITY_PENDING')),
    
    -- Header type constraint
    CONSTRAINT templates_header_type_check CHECK (header_type IN ('NONE', 'TEXT', 'STATIC_IMAGE', 'DYNAMIC_IMAGE')),
    whatsapp_response JSONB,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id, name)
);

-- ============================================================================
-- CAMPAIGN AND MESSAGE TRACKING
-- ============================================================================

-- Campaign Logs - Track bulk messaging campaigns
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

-- Message Logs - Track individual message delivery
CREATE TABLE IF NOT EXISTS message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaign_logs(id) ON DELETE CASCADE,
    recipient_number VARCHAR(20) NOT NULL,
    message_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'duplicate')),
    error_message TEXT,
    api_response JSONB,
    variables_used JSONB,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CREDIT SYSTEM
-- ============================================================================

-- Credit Transactions - Track all credit operations
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    template_name VARCHAR(255),
    template_category VARCHAR(20),
    message_id VARCHAR(255),
    campaign_id UUID REFERENCES campaign_logs(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT credit_transactions_amount_check CHECK (amount <> 0),
    CONSTRAINT credit_transactions_template_category_check CHECK (template_category IS NULL OR template_category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
    CONSTRAINT credit_transactions_transaction_type_check CHECK (transaction_type IN (
        'DEDUCTION_QUICKSEND',
        'DEDUCTION_CUSTOMISE_SMS',
        'DEDUCTION_API_DELIVERED',
        'DEDUCTION_DUPLICATE_BLOCKED',
        'ADMIN_ADD',
        'ADMIN_DEDUCT',
        'REFUND',
        'CREDIT_DEDUCTION',
        'CREDIT_ADD',
        'INITIAL_ALLOCATION',
        'WELCOME_BONUS'
    ))
);

-- ============================================================================
-- ADMIN AND AUDIT
-- ============================================================================

-- Admin Actions - Audit log for administrative actions
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_business_info_updated_at 
    BEFORE UPDATE ON user_business_info 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_logs_updated_at 
    BEFORE UPDATE ON campaign_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_status ON templates(status);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_template_id ON templates(template_id);
CREATE INDEX IF NOT EXISTS idx_templates_status_created ON templates(status, created_at);
CREATE INDEX IF NOT EXISTS idx_templates_user_status ON templates(user_id, status);

-- Campaign logs indexes
CREATE INDEX IF NOT EXISTS idx_campaign_logs_user_id ON campaign_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_status ON campaign_logs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_created_at ON campaign_logs(created_at DESC);

-- Message logs indexes
CREATE INDEX IF NOT EXISTS idx_message_logs_campaign_id ON message_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_recipient ON message_logs(recipient_number);
CREATE UNIQUE INDEX IF NOT EXISTS message_logs_campaign_recipient_unique 
    ON message_logs(campaign_id, recipient_number);

-- Credit transactions indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_campaign_id ON credit_transactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);

-- Admin actions indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_user ON admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);

-- User business info indexes
CREATE INDEX IF NOT EXISTS idx_user_business_info_user_id ON user_business_info(user_id);
CREATE INDEX IF NOT EXISTS idx_user_business_info_active ON user_business_info(is_active);

-- ============================================================================
-- CONSTRAINTS AND FOREIGN KEYS
-- ============================================================================

-- Add foreign key constraint for credit transactions campaign reference
ALTER TABLE credit_transactions 
ADD CONSTRAINT fk_credit_transactions_campaign_id 
FOREIGN KEY (campaign_id) REFERENCES campaign_logs(id) ON DELETE SET NULL;

-- ============================================================================
-- DATABASE VERIFICATION
-- ============================================================================

-- Function to verify table structure
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('users', 'user_business_info', 'templates', 'campaign_logs', 'message_logs', 'credit_transactions', 'admin_actions');
    
    IF table_count = 7 THEN
        RAISE NOTICE '✅ All 7 core tables created successfully';
    ELSE
        RAISE WARNING '⚠️ Expected 7 tables, found %', table_count;
    END IF;
END $$;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================

COMMENT ON DATABASE "PrimeSMS_W" IS 'Prime SMS - WhatsApp Business API SaaS Platform Database';
COMMENT ON TABLE users IS 'User accounts and authentication data';
COMMENT ON TABLE user_business_info IS 'WhatsApp Business API credentials per user';
COMMENT ON TABLE templates IS 'WhatsApp message templates';
COMMENT ON TABLE campaign_logs IS 'Bulk messaging campaign tracking';
COMMENT ON TABLE message_logs IS 'Individual message delivery tracking';
COMMENT ON TABLE credit_transactions IS 'Credit usage and billing history';
COMMENT ON TABLE admin_actions IS 'Administrative action audit log';