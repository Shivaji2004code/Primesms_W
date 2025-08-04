-- Admin Template Management Database Updates
-- This script adds support for admin template approval workflow

-- Create admin_actions table for audit logging
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'template', 'user', etc.
    target_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for admin_actions
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_user ON admin_actions (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions (action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions (created_at);

-- Update template status values to align with admin workflow
-- Map existing statuses to new admin-friendly statuses:
-- 'DRAFT' stays as 'DRAFT' (user still editing)
-- 'IN_REVIEW' becomes 'PENDING' (submitted for admin approval)
-- 'ACTIVE' stays as 'ACTIVE' (approved by admin and active in WhatsApp)
-- 'REJECTED' stays as 'REJECTED' (rejected by admin)

-- Update existing templates to use the simplified status workflow
UPDATE templates 
SET status = 'PENDING' 
WHERE status = 'IN_REVIEW';

-- Update the CHECK constraint to match the admin workflow
ALTER TABLE templates 
DROP CONSTRAINT IF EXISTS templates_status_check;

ALTER TABLE templates 
ADD CONSTRAINT templates_status_check 
CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAUSED', 'DISABLED'));

-- Update existing 'ACTIVE' templates to 'APPROVED' for consistency
-- (ACTIVE will be reserved for WhatsApp API confirmed active status)
UPDATE templates 
SET status = 'APPROVED' 
WHERE status = 'ACTIVE';

-- Add a comment to clarify the status workflow
COMMENT ON COLUMN templates.status IS 'Template status: DRAFT (user editing), PENDING (awaiting admin approval), APPROVED (admin approved, can be used), REJECTED (admin rejected), ACTIVE (confirmed active in WhatsApp API), PAUSED (temporarily disabled), DISABLED (permanently disabled)';

-- Create a view for admin template overview
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
    -- Count components
    jsonb_array_length(t.components) as component_count,
    -- Extract component types
    (
        SELECT string_agg(DISTINCT comp->>'type', ', ' ORDER BY comp->>'type')
        FROM jsonb_array_elements(t.components) AS comp
    ) as component_types
FROM templates t
JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC;

-- Grant permissions to admin users (assuming there's an admin role)
-- This would typically be done based on your role management system

-- Insert sample admin action for testing (optional)
-- This assumes there's an admin user with a known ID
INSERT INTO admin_actions (admin_user_id, action_type, target_type, target_id, details)
SELECT 
    u.id,
    'template_system_setup',
    'system',
    gen_random_uuid(),
    '{"message": "Admin template management system initialized", "timestamp": "' || CURRENT_TIMESTAMP || '"}'::jsonb
FROM users u 
WHERE u.role = 'admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Create a function to automatically update template updated_at when status changes
CREATE OR REPLACE FUNCTION log_template_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Update the updated_at timestamp
        NEW.updated_at = CURRENT_TIMESTAMP;
        
        -- Log the status change (this would be called by the application)
        -- We don't insert into admin_actions here as we need the admin_user_id from the application
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for template status changes
DROP TRIGGER IF EXISTS template_status_change_trigger ON templates;
CREATE TRIGGER template_status_change_trigger
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION log_template_status_change();

-- Add helpful indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_templates_user_status ON templates (user_id, status);
CREATE INDEX IF NOT EXISTS idx_templates_status_created ON templates (status, created_at);

-- View for pending templates that need admin review
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
    -- Age of the pending request
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at))/3600 as hours_pending
FROM templates t
JOIN users u ON t.user_id = u.id
WHERE t.status = 'PENDING'
ORDER BY t.created_at ASC;

-- Summary stats view for admin dashboard
CREATE OR REPLACE VIEW admin_template_stats AS
SELECT 
    COUNT(*) as total_templates,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_count,
    COUNT(DISTINCT user_id) as users_with_templates,
    -- Average time to approval (for approved templates)
    ROUND(AVG(
        CASE WHEN status = 'APPROVED' 
        THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 
        END
    )::numeric, 2) as avg_hours_to_approval
FROM templates
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'; -- Last 30 days stats