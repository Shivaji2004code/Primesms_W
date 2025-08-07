-- PrimeSMS_W Database Schema - Production Ready
-- Database: PrimeSMS_W (Port: 5432)
-- This is the complete consolidated schema for deployment on Coolify
--
-- Required Tables: 7 core tables for PrimeSMS functionality
-- 1. users - User accounts and authentication
-- 2. user_business_info - Business configuration for WhatsApp API
-- 3. templates - WhatsApp message templates
-- 4. campaign_logs - Bulk messaging campaigns
-- 5. message_logs - Individual message tracking  
-- 6. admin_actions - Admin activity tracking
-- 7. credit_transactions - Credit system transactions

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create update trigger function (used by multiple tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TABLE 1: users - User accounts and authentication
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    credit_balance INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE
ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO users (name, email, username, password, role, credit_balance) VALUES 
('Admin User', 'admin@primesms.com', 'primesms', 'Primesms', 'admin', 10000);

-- =====================================================
-- TABLE 2: user_business_info - WhatsApp Business API configuration
-- =====================================================
CREATE TABLE user_business_info (
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
    UNIQUE(user_id)
);

CREATE TRIGGER update_user_business_info_updated_at BEFORE UPDATE
ON user_business_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE 3: templates - WhatsApp message templates
-- =====================================================
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('UTILITY', 'MARKETING', 'AUTHENTICATION')),
    language VARCHAR(10) NOT NULL DEFAULT 'en_US',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAUSED', 'DISABLED')),
    
    -- Template components stored as JSON
    components JSONB NOT NULL,
    
    -- WhatsApp API specific fields  
    template_id VARCHAR(255), -- WhatsApp template ID after successful creation
    message_send_ttl_seconds INTEGER,
    allow_category_change BOOLEAN DEFAULT true,
    
    -- Quality rating from WhatsApp
    quality_rating VARCHAR(20) CHECK (quality_rating IN ('HIGH', 'MEDIUM', 'LOW', 'QUALITY_PENDING')),
    
    -- Meta's response data
    whatsapp_response JSONB,
    rejection_reason TEXT,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id, name) -- Each user can have unique template names
);

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE
ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for templates
CREATE INDEX idx_templates_user_id ON templates (user_id);
CREATE INDEX idx_templates_status ON templates (status);
CREATE INDEX idx_templates_category ON templates (category);
CREATE INDEX idx_templates_template_id ON templates (template_id);

-- =====================================================
-- TABLE 4: campaign_logs - Bulk messaging campaigns
-- =====================================================
CREATE TABLE campaign_logs (
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
    campaign_data JSONB, -- Store template variables, buttons, etc.
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_campaign_logs_updated_at BEFORE UPDATE
ON campaign_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for campaign_logs
CREATE INDEX idx_campaign_logs_user_id ON campaign_logs(user_id);
CREATE INDEX idx_campaign_logs_status ON campaign_logs(status);
CREATE INDEX idx_campaign_logs_created_at ON campaign_logs(created_at DESC);

-- =====================================================
-- TABLE 5: message_logs - Individual message tracking
-- =====================================================
CREATE TABLE message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaign_logs(id) ON DELETE CASCADE,
    recipient_number VARCHAR(20) NOT NULL,
    message_id VARCHAR(255), -- From Meta API response
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    error_message TEXT,
    api_response JSONB, -- Store full Meta API response
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for message_logs
CREATE INDEX idx_message_logs_campaign_id ON message_logs(campaign_id);
CREATE INDEX idx_message_logs_status ON message_logs(status);
CREATE INDEX idx_message_logs_recipient ON message_logs(recipient_number);

-- =====================================================
-- TABLE 6: admin_actions - Admin activity tracking
-- =====================================================
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'template', 'user', etc.
    target_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for admin_actions
CREATE INDEX idx_admin_actions_admin_user ON admin_actions (admin_user_id);
CREATE INDEX idx_admin_actions_type ON admin_actions (action_type);
CREATE INDEX idx_admin_actions_target ON admin_actions (target_type, target_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions (created_at);

-- =====================================================
-- TABLE 7: credit_transactions - Credit system transactions
-- =====================================================
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL, -- Can be positive (additions) or negative (deductions)
    transaction_type VARCHAR(50) NOT NULL,
    template_category VARCHAR(20), -- MARKETING, UTILITY, AUTHENTICATION
    template_name VARCHAR(255),
    message_id VARCHAR(255),
    campaign_id UUID REFERENCES campaign_logs(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for credit_transactions
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_campaign ON credit_transactions(campaign_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- =====================================================
-- VIEWS - Useful admin and reporting views
-- =====================================================

-- Admin template overview
CREATE OR REPLACE VIEW admin_template_overview AS
SELECT 
    t.id,
    t.name,
    t.category,
    t.language,
    t.status,
    t.created_at,
    t.updated_at,
    u.id as user_id,
    u.name as user_name,
    u.username,
    u.email as user_email,
    jsonb_array_length(t.components) as component_count,
    (
        SELECT string_agg(DISTINCT comp->>'type', ', ' ORDER BY comp->>'type')
        FROM jsonb_array_elements(t.components) AS comp
    ) as component_types
FROM templates t
JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC;

-- Pending templates for review
CREATE OR REPLACE VIEW pending_templates_for_review AS
SELECT 
    t.id,
    t.name,
    t.category,
    t.language,
    t.created_at,
    t.components,
    u.id as user_id,
    u.name as user_name,
    u.username,
    u.email as user_email,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at))/3600 as hours_pending
FROM templates t
JOIN users u ON t.user_id = u.id
WHERE t.status = 'PENDING'
ORDER BY t.created_at ASC;

-- Admin template statistics
CREATE OR REPLACE VIEW admin_template_stats AS
SELECT 
    COUNT(*) as total_templates,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_count,
    COUNT(DISTINCT user_id) as users_with_templates,
    ROUND(AVG(
        CASE WHEN status = 'APPROVED' 
        THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 
        END
    )::numeric, 2) as avg_hours_to_approval
FROM templates
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- =====================================================
-- SAMPLE DATA for testing (optional - remove in production)
-- =====================================================

-- Insert sample user for testing
INSERT INTO users (name, email, username, password, phone_number, credit_balance) VALUES 
('Test User', 'test@example.com', 'testuser', 'test123', '+1234567890', 1000)
ON CONFLICT (email) DO NOTHING;

-- Insert sample template
INSERT INTO templates (user_id, name, category, language, status, components, message_send_ttl_seconds)
SELECT 
    u.id,
    'welcome_message',
    'UTILITY',
    'en_US',
    'DRAFT',
    '[
        {
            "type": "BODY",
            "text": "Hello {{customer_name}}, welcome to our service!",
            "example": {
                "body_text": [["John Doe"]]
            }
        }
    ]'::jsonb,
    3600
FROM users u WHERE u.username = 'primesms'
ON CONFLICT (user_id, name) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'user_business_info', 'templates', 'campaign_logs', 'message_logs', 'admin_actions', 'credit_transactions')
ORDER BY table_name;

-- Verify all indexes exist  
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE tablename IN ('users', 'user_business_info', 'templates', 'campaign_logs', 'message_logs', 'admin_actions', 'credit_transactions')
ORDER BY tablename, indexname;

-- Show table row counts
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'user_business_info', COUNT(*) FROM user_business_info  
UNION ALL
SELECT 'templates', COUNT(*) FROM templates
UNION ALL
SELECT 'campaign_logs', COUNT(*) FROM campaign_logs
UNION ALL
SELECT 'message_logs', COUNT(*) FROM message_logs
UNION ALL
SELECT 'admin_actions', COUNT(*) FROM admin_actions
UNION ALL
SELECT 'credit_transactions', COUNT(*) FROM credit_transactions;