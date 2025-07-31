-- Database Update Script - Add Business Info Table

-- Business Info table for WhatsApp API credentials
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
    UNIQUE(user_id)
);

-- Create update trigger for user_business_info updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_business_info_updated_at') THEN
        CREATE TRIGGER update_user_business_info_updated_at BEFORE UPDATE
        ON user_business_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;