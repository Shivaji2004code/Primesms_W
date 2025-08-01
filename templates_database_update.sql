-- Templates table for storing WhatsApp Business API message templates
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('UTILITY', 'MARKETING', 'AUTHENTICATION')),
    language VARCHAR(10) NOT NULL DEFAULT 'en_US',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_REVIEW', 'PENDING', 'ACTIVE', 'REJECTED', 'PAUSED', 'DISABLED', 'APPEAL_REQUESTED')),
    
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

-- Create update trigger for templates updated_at
DO $$
BEGIN
    -- Check if the update function exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS '
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        ' LANGUAGE plpgsql;
    END IF;
    
    -- Create the trigger if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_templates_updated_at') THEN
        CREATE TRIGGER update_templates_updated_at 
        BEFORE UPDATE ON templates 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates (user_id);
CREATE INDEX IF NOT EXISTS idx_templates_status ON templates (status);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates (category);
CREATE INDEX IF NOT EXISTS idx_templates_template_id ON templates (template_id);

-- Add some sample template data for testing
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
            "text": "Hello {{customer_name}}, welcome to our service! Your account has been created successfully.",
            "example": {
                "body_text": [["John Doe"]]
            }
        }
    ]'::jsonb,
    3600
FROM users u WHERE u.username = 'primesms'
ON CONFLICT (user_id, name) DO NOTHING;

-- Add footer component sample
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
            "text": "Your order #{{order_id}} has been confirmed! Total amount: ${{amount}}. Expected delivery: {{delivery_date}}.",
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