-- Create demo users for testing
-- This script adds admin/admin123 and user/user123 if they don't already exist

-- Insert demo admin user if not exists
INSERT INTO users (name, email, username, password, role, credit_balance) 
SELECT 'Demo Admin', 'demo-admin@primesms.com', 'admin', 'admin123', 'admin', 10000
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Insert demo regular user if not exists
INSERT INTO users (name, email, username, password, phone_number, credit_balance) 
SELECT 'Demo User', 'demo-user@primesms.com', 'user', 'user123', '+1234567890', 1000
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'user');

-- Show all users
SELECT id, name, email, username, role, credit_balance FROM users ORDER BY created_at;