-- Primes SMS Database Setup
-- Database: PrimeSMS_W (Port: 5431)

-- Create the database (run this first as superuser)
-- CREATE DATABASE "PrimeSMS_W";

-- Connect to PrimeSMS_W database and run the following:

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
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

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE
ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert hardcoded admin user (password stored as plain text for simplicity)
INSERT INTO users (name, email, username, password, role, credit_balance) VALUES 
('Admin User', 'admin@primesms.com', 'primesms', 'Primesms', 'admin', 10000);

-- Insert sample regular user for testing
INSERT INTO users (name, email, username, password, phone_number, credit_balance) VALUES 
('Test User', 'test@example.com', 'testuser', 'test123', '+1234567890', 1000);

-- Business Info table for WhatsApp API credentials
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

-- Create update trigger for user_business_info updated_at
CREATE TRIGGER update_user_business_info_updated_at BEFORE UPDATE
ON user_business_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify data
SELECT id, name, email, username, role, credit_balance, created_at FROM users;