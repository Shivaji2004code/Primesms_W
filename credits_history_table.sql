-- Credits History Table for Prime SMS
-- This table tracks all credit transactions for users

CREATE TABLE IF NOT EXISTS credits_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('added', 'deducted')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_credits_history_user_id ON credits_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_history_created_at ON credits_history(created_at DESC);

-- Create update trigger
CREATE TRIGGER update_credits_history_updated_at BEFORE UPDATE
ON credits_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for existing users
-- For admin user (primesms)
INSERT INTO credits_history (user_id, type, amount, description, balance_after) 
SELECT id, 'added', 10000, 'Initial admin credits', 10000 
FROM users WHERE username = 'primesms'
ON CONFLICT DO NOTHING;

-- For test user
INSERT INTO credits_history (user_id, type, amount, description, balance_after) 
SELECT id, 'added', 1000, 'Welcome bonus', 1000 
FROM users WHERE username = 'testuser'
ON CONFLICT DO NOTHING;

-- Sample additional entries for testing
INSERT INTO credits_history (user_id, type, amount, description, balance_after) 
SELECT id, 'deducted', 50, 'Sent 50 WhatsApp messages', 950 
FROM users WHERE username = 'testuser'
ON CONFLICT DO NOTHING;

INSERT INTO credits_history (user_id, type, amount, description, balance_after) 
SELECT id, 'added', 200, 'Admin bonus for testing', 1150 
FROM users WHERE username = 'testuser'
ON CONFLICT DO NOTHING;

-- Verify the table
SELECT ch.*, u.username, u.name 
FROM credits_history ch 
JOIN users u ON ch.user_id = u.id 
ORDER BY ch.created_at DESC;