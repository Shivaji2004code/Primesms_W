-- WhatsApp Bulk Messaging Database Schema
-- Run this to add the new tables for bulk messaging feature

-- Campaign logs table to track all campaigns
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
    campaign_data JSONB, -- Store template variables, buttons, etc.
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message logs table to track individual messages
CREATE TABLE IF NOT EXISTS message_logs (
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

-- WhatsApp numbers table (if not exists) to store user's WhatsApp Business numbers
CREATE TABLE IF NOT EXISTS whatsapp_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    display_name VARCHAR(255),
    verified_name VARCHAR(255),
    access_token TEXT NOT NULL,
    webhook_url VARCHAR(500),
    webhook_verify_token VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, phone_number_id)
);

-- WhatsApp templates table to cache approved templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number_id VARCHAR(255) NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'APPROVED',
    template_data JSONB NOT NULL, -- Store complete template structure
    components JSONB, -- Store template components (header, body, footer, buttons)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(phone_number_id, template_name, language)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_logs_user_id ON campaign_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_status ON campaign_logs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_created_at ON campaign_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_logs_campaign_id ON message_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_recipient ON message_logs(recipient_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_user_id ON whatsapp_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_active ON whatsapp_numbers(is_active);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_phone_number ON whatsapp_templates(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);

-- Create update triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaign_logs_updated_at BEFORE UPDATE
ON campaign_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_numbers_updated_at BEFORE UPDATE
ON whatsapp_numbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE
ON whatsapp_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample WhatsApp number for testing (for user harsha)
INSERT INTO whatsapp_numbers (user_id, phone_number_id, phone_number, display_name, access_token)
SELECT 
    users.id,
    '123456789012345',
    '+1234567890',
    'Prime SMS Business',
    'sample_access_token_for_testing'
FROM users 
WHERE users.username = 'harsha'
ON CONFLICT (user_id, phone_number_id) DO NOTHING;

-- Insert sample templates for testing
INSERT INTO whatsapp_templates (phone_number_id, template_name, language, category, template_data, components)
VALUES 
(
    '123456789012345',
    'hello_world',
    'en',
    'UTILITY',
    '{"name": "hello_world", "language": "en", "status": "APPROVED", "category": "UTILITY"}',
    '[
        {
            "type": "BODY",
            "text": "Hello {{1}}, Welcome to Prime SMS! Your verification code is {{2}}."
        }
    ]'
),
(
    '123456789012345',
    'promotional_offer',
    'en',
    'MARKETING',
    '{"name": "promotional_offer", "language": "en", "status": "APPROVED", "category": "MARKETING"}',
    '[
        {
            "type": "HEADER",
            "format": "TEXT",
            "text": "🎉 Special Offer!"
        },
        {
            "type": "BODY",
            "text": "Hi {{1}}! Get {{2}}% off on your next purchase. Use code: {{3}}"
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
    ]'
)
ON CONFLICT (phone_number_id, template_name, language) DO NOTHING;

-- Verify the tables were created
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('campaign_logs', 'message_logs', 'whatsapp_numbers', 'whatsapp_templates')
ORDER BY table_name, ordinal_position;