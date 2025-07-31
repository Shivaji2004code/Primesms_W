# Primes SMS Enhancement Setup Guide

## Database Updates Required

To apply the new business information features, you need to update your existing database.

### Option 1: Run the Database Update Script

```bash
# Connect to your PostgreSQL database and run:
psql -h localhost -p 5431 -d PrimeSMS_W -f database_update.sql
```

### Option 2: Run SQL Commands Manually

Connect to your database and execute:

```sql
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
```

## Restart the Application

After updating the database:

1. **Restart Backend Server** (if running):
   ```bash
   cd server
   npm run dev
   ```

2. **Restart Frontend Server** (if running):
   ```bash
   cd client  
   npm run dev
   ```

## New Features Available

### 🎯 **Enhanced Admin Dashboard**
- Modern statistics cards with color-coded indicators
- Business info status column showing configuration status
- Direct navigation to user details page

### 📝 **User Details Management** 
- Navigate to: `/admin/users/{user-id}/details`
- Two-column layout: Basic Info | Business Info
- Real-time form validation
- WhatsApp API credentials management

### 🔐 **Enhanced Route Protection**
- Comprehensive authentication guards
- Role-based access control
- Automatic redirects based on user role
- Protected routes for all admin functions

### 🧭 **Improved Navigation**
- AdminLayout component with breadcrumbs
- Logo clicks redirect to respective dashboards
- Consistent header across admin pages

## New API Endpoints

The following new endpoints are now available:

```
GET    /api/admin/users/:id/details      # Get user with business info
GET    /api/admin/users/:id/business-info # Get user's business info
PUT    /api/admin/users/:id/business-info # Update/create business info
```

## Form Validation

The system now includes comprehensive validation for:

- ✅ WhatsApp number format validation
- ✅ Webhook URL format validation  
- ✅ Required field validation
- ✅ Real-time form feedback
- ✅ Server-side validation with proper error responses

## Testing the New Features

1. **Login as Admin**: primesms / Primesms
2. **Navigate to Admin Dashboard**: Should show enhanced UI with business status
3. **Click Settings Icon**: Should navigate to user details page
4. **Edit User Business Info**: Test the business information form
5. **Save Changes**: Verify data persistence
6. **Check Business Status**: Should show "Configured" for users with business info

## Security Notes

- All business API credentials are stored securely in the database
- Access tokens are masked in the UI with show/hide functionality
- All routes are protected with proper authentication checks
- Form validation prevents malicious input

## Troubleshooting

If you encounter issues:

1. **Database Connection**: Ensure PostgreSQL is running on port 5431
2. **Table Creation**: Verify the `user_business_info` table was created successfully
3. **Route Access**: Check browser console for authentication errors
4. **API Errors**: Check server logs for detailed error messages

The enhanced Primes SMS platform is now ready with comprehensive WhatsApp Business API management capabilities!