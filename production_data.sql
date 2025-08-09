-- ============================================================================
-- PRIME SMS - PRODUCTION DATA SETUP
-- Initial data and configuration for production deployment
-- Run this AFTER database_schema.sql
-- ============================================================================

-- ============================================================================
-- DEFAULT USER ACCOUNTS
-- ============================================================================

-- Insert admin user (default credentials)
INSERT INTO users (name, email, username, password, role, credit_balance) 
VALUES ('Admin User', 'admin@primesms.com', 'primesms', 'Primesms', 'admin', 10000.00)
ON CONFLICT (username) DO NOTHING;

-- Insert test user for development
INSERT INTO users (name, email, username, password, phone_number, credit_balance) 
VALUES ('Test User', 'test@example.com', 'testuser', 'test123', '+1234567890', 1000.00)
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- SAMPLE TEMPLATE DATA
-- ============================================================================

-- Welcome message template
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
            "text": "Hello {{1}}, welcome to our service! Your account has been created successfully.",
            "example": {
                "body_text": [["John Doe"]]
            }
        }
    ]'::jsonb,
    3600
FROM users u WHERE u.username = 'primesms'
ON CONFLICT (user_id, name) DO NOTHING;

-- Order confirmation template
INSERT INTO templates (user_id, name, category, language, status, components, message_send_ttl_seconds)
SELECT 
    u.id,
    'order_confirmation',
    'UTILITY', 
    'en_US',
    'DRAFT',
    '[
        {
            "type": "BODY",
            "text": "Your order #{{1}} has been confirmed! Total amount: ${{2}}. Expected delivery: {{3}}.",
            "example": {
                "body_text": [["12345", "99.99", "Dec 25, 2025"]]
            }
        },
        {
            "type": "FOOTER",
            "text": "Thank you for shopping with us!"
        }
    ]'::jsonb,
    7200
FROM users u WHERE u.username = 'primesms'
ON CONFLICT (user_id, name) DO NOTHING;

-- Authentication OTP template
INSERT INTO templates (user_id, name, category, language, status, components, header_type)
SELECT 
    u.id,
    'otp_verification',
    'AUTHENTICATION',
    'en_US',
    'DRAFT',
    '[]'::jsonb,
    'NONE'
FROM users u WHERE u.username = 'primesms'
ON CONFLICT (user_id, name) DO NOTHING;

-- Marketing promotional template
INSERT INTO templates (user_id, name, category, language, status, components, message_send_ttl_seconds)
SELECT 
    u.id,
    'promotional_offer',
    'MARKETING',
    'en_US',
    'DRAFT',
    '[
        {
            "type": "HEADER",
            "format": "TEXT",
            "text": "🎉 Special Offer!"
        },
        {
            "type": "BODY",
            "text": "Hi {{1}}! Get {{2}}% off on your next purchase. Use code: {{3}}",
            "example": {
                "body_text": [["John", "25", "SAVE25"]]
            }
        },
        {
            "type": "FOOTER",
            "text": "Valid till {{1}}"
        },
        {
            "type": "BUTTONS",
            "buttons": [
                {
                    "type": "URL",
                    "text": "Shop Now",
                    "url": "https://example.com/shop"
                },
                {
                    "type": "PHONE_NUMBER",
                    "text": "Call Us",
                    "phone_number": "+1234567890"
                }
            ]
        }
    ]'::jsonb,
    86400
FROM users u WHERE u.username = 'primesms'
ON CONFLICT (user_id, name) DO NOTHING;

-- ============================================================================
-- SAMPLE BUSINESS CONFIGURATION
-- ============================================================================

-- Sample business info for admin user
INSERT INTO user_business_info (
    user_id, 
    business_name, 
    whatsapp_number, 
    whatsapp_number_id, 
    waba_id, 
    access_token,
    is_active
)
SELECT 
    u.id,
    'Prime SMS Business',
    '+1234567890',
    'sample_phone_number_id',
    'sample_waba_id',
    'sample_access_token_replace_with_real',
    false -- Set to false until real credentials are provided
FROM users u WHERE u.username = 'primesms'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- INITIAL CREDIT TRANSACTIONS
-- ============================================================================

-- Initial credit allocation for admin
INSERT INTO credit_transactions (
    user_id, 
    amount, 
    transaction_type, 
    description
)
SELECT 
    u.id,
    10000.00,
    'INITIAL_ALLOCATION',
    'Initial admin credits'
FROM users u WHERE u.username = 'primesms'
ON CONFLICT DO NOTHING;

-- Welcome bonus for test user
INSERT INTO credit_transactions (
    user_id, 
    amount, 
    transaction_type, 
    description
)
SELECT 
    u.id,
    1000.00,
    'WELCOME_BONUS',
    'Welcome bonus for new user'
FROM users u WHERE u.username = 'testuser'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE CAMPAIGN FOR TESTING
-- ============================================================================

-- Insert sample campaign
INSERT INTO campaign_logs (
    user_id,
    campaign_name,
    template_used,
    phone_number_id,
    language_code,
    total_recipients,
    successful_sends,
    failed_sends,
    status,
    campaign_data
)
SELECT 
    u.id,
    'Welcome Campaign - Test',
    'welcome_message',
    'sample_phone_number_id',
    'en',
    5,
    5,
    0,
    'completed',
    '{"templateVariables": {"1": "User"}, "campaignType": "bulk"}'::jsonb
FROM users u WHERE u.username = 'primesms';

-- ============================================================================
-- PRODUCTION CONFIGURATION
-- ============================================================================

-- Create a view for active templates
CREATE OR REPLACE VIEW active_templates AS
SELECT 
    t.*,
    u.username as owner_username,
    u.name as owner_name
FROM templates t
JOIN users u ON t.user_id = u.id
WHERE t.status IN ('APPROVED', 'ACTIVE');

-- Create a view for campaign statistics
CREATE OR REPLACE VIEW campaign_statistics AS
SELECT 
    cl.user_id,
    u.username,
    COUNT(cl.id) as total_campaigns,
    SUM(cl.total_recipients) as total_messages_sent,
    SUM(cl.successful_sends) as total_successful,
    SUM(cl.failed_sends) as total_failed,
    ROUND(
        CASE 
            WHEN SUM(cl.total_recipients) > 0 
            THEN (SUM(cl.successful_sends)::decimal / SUM(cl.total_recipients)) * 100 
            ELSE 0 
        END, 2
    ) as success_rate_percentage
FROM campaign_logs cl
JOIN users u ON cl.user_id = u.id
GROUP BY cl.user_id, u.username;

-- Create a view for credit usage summary
CREATE OR REPLACE VIEW credit_usage_summary AS
SELECT 
    ct.user_id,
    u.username,
    u.credit_balance as current_balance,
    COUNT(ct.id) as total_transactions,
    SUM(CASE WHEN ct.amount > 0 THEN ct.amount ELSE 0 END) as total_credits_added,
    SUM(CASE WHEN ct.amount < 0 THEN ABS(ct.amount) ELSE 0 END) as total_credits_used,
    AVG(CASE WHEN ct.amount < 0 THEN ABS(ct.amount) ELSE NULL END) as avg_cost_per_transaction
FROM credit_transactions ct
JOIN users u ON ct.user_id = u.id
GROUP BY ct.user_id, u.username, u.credit_balance;

-- ============================================================================
-- PRODUCTION FUNCTIONS
-- ============================================================================

-- Function to calculate message cost based on template category
CREATE OR REPLACE FUNCTION calculate_message_cost(template_category VARCHAR(20))
RETURNS DECIMAL(10,2) AS $$
BEGIN
    CASE template_category
        WHEN 'AUTHENTICATION' THEN RETURN 0.15;
        WHEN 'UTILITY' THEN RETURN 0.15;
        WHEN 'MARKETING' THEN RETURN 0.25;
        ELSE RETURN 0.20; -- Default cost
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's available credits
CREATE OR REPLACE FUNCTION get_user_credits(user_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    current_credits DECIMAL(10,2);
BEGIN
    SELECT credit_balance INTO current_credits 
    FROM users 
    WHERE id = user_uuid;
    
    RETURN COALESCE(current_credits, 0.00);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can send messages
CREATE OR REPLACE FUNCTION can_user_send_messages(
    user_uuid UUID, 
    template_category VARCHAR(20), 
    message_count INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    user_credits DECIMAL(10,2);
    message_cost DECIMAL(10,2);
    total_cost DECIMAL(10,2);
BEGIN
    user_credits := get_user_credits(user_uuid);
    message_cost := calculate_message_cost(template_category);
    total_cost := message_cost * message_count;
    
    RETURN user_credits >= total_cost;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to cleanup old logs (90+ days)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete old message logs first (due to foreign key)
    DELETE FROM message_logs 
    WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old campaign logs
    DELETE FROM campaign_logs 
    WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify user accounts
SELECT 'Users Created' as verification, COUNT(*) as count FROM users;

-- Verify templates
SELECT 'Templates Created' as verification, COUNT(*) as count FROM templates;

-- Verify business info
SELECT 'Business Info Created' as verification, COUNT(*) as count FROM user_business_info;

-- Verify credit transactions
SELECT 'Credit Transactions Created' as verification, COUNT(*) as count FROM credit_transactions;

-- Show template categories distribution
SELECT 
    category,
    COUNT(*) as template_count,
    ARRAY_AGG(name) as template_names
FROM templates 
GROUP BY category;

-- Show credit balance summary
SELECT 
    u.username,
    u.credit_balance,
    COUNT(ct.id) as transaction_count
FROM users u
LEFT JOIN credit_transactions ct ON u.id = ct.user_id
GROUP BY u.id, u.username, u.credit_balance
ORDER BY u.credit_balance DESC;

-- ============================================================================
-- PRODUCTION READINESS CHECK
-- ============================================================================

DO $$
DECLARE
    user_count INTEGER;
    template_count INTEGER;
    business_info_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO template_count FROM templates;
    SELECT COUNT(*) INTO business_info_count FROM user_business_info;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '🚀 PRIME SMS PRODUCTION DATA SETUP COMPLETE';
    RAISE NOTICE '============================================';
    RAISE NOTICE '👤 Users: %', user_count;
    RAISE NOTICE '📝 Templates: %', template_count;
    RAISE NOTICE '🏢 Business Configs: %', business_info_count;
    RAISE NOTICE '============================================';
    RAISE NOTICE '⚠️  IMPORTANT: Update WhatsApp credentials in user_business_info';
    RAISE NOTICE '⚠️  IMPORTANT: Change default passwords before production';
    RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- DATA SETUP COMPLETE
-- ============================================================================