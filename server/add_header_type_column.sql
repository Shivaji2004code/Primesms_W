-- Add header_type column to templates table
-- This will help differentiate between static and dynamic image templates

ALTER TABLE templates
ADD COLUMN header_type VARCHAR(20) DEFAULT 'NONE' 
CHECK (header_type IN ('NONE', 'TEXT', 'STATIC_IMAGE', 'DYNAMIC_IMAGE', 'STATIC_VIDEO', 'DYNAMIC_VIDEO'));

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'templates' AND column_name = 'header_type';