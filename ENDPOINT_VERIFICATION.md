# Endpoint Verification Guide

## 🔍 **API Endpoints Overview**

### Send API Endpoint
- **URL**: `/api/send`
- **Methods**: `GET`, `POST`
- **Purpose**: Send templated WhatsApp messages
- **Rate Limit**: 100 requests per 15 minutes per IP

## 🧪 **Quick Verification Tests**

### 1. Health Check
```bash
curl http://localhost:5050/api/health
```
**Expected**: `{"status": "Server is running", "timestamp": "..."}`

### 2. Missing Parameters (400 Error)
```bash
curl "http://localhost:5050/api/send"
```
**Expected**: 400 Bad Request with parameter validation errors

### 3. Invalid Username (401 Error)
```bash
curl "http://localhost:5050/api/send?username=invalid&templatename=test&recipient_number=%2B1234567890"
```
**Expected**: 401 Unauthorized

### 4. Invalid Template (404 Error)
```bash
curl "http://localhost:5050/api/send?username=harsha&templatename=nonexistent&recipient_number=%2B1234567890"
```
**Expected**: 404 Not Found

### 5. Invalid Phone Format (400 Error)
```bash
curl "http://localhost:5050/api/send?username=harsha&templatename=welcome_message&recipient_number=1234567890"
```
**Expected**: 400 Bad Request - Invalid phone format

### 6. Valid Request (Success/Test Mode)
```bash
curl "http://localhost:5050/api/send?username=harsha&templatename=welcome_message&recipient_number=%2B1234567890&var1=Test%20User"
```
**Expected**: 200 Success (test mode) or 502 (if real credentials fail)

### 7. POST Request Test
```bash
curl -X POST "http://localhost:5050/api/send" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "harsha",
    "templatename": "welcome_message",
    "recipient_number": "+1234567890",
    "var1": "Test User"
  }'
```
**Expected**: 200 Success (test mode) or 502 (if real credentials fail)

## 📊 **Test Data Setup**

### Required Database Records
1. **User**: `harsha` with business info configured
2. **Template**: `welcome_message` with ACTIVE status
3. **Business Info**: Test access token for development

### Verification Query
```sql
-- Check test setup
SELECT 
  u.username,
  t.name as template_name,
  t.status,
  ubi.whatsapp_number_id,
  CASE 
    WHEN ubi.access_token LIKE 'test_%' THEN 'TEST_TOKEN' 
    ELSE 'REAL_TOKEN' 
  END as token_type
FROM users u
INNER JOIN templates t ON u.id = t.user_id  
INNER JOIN user_business_info ubi ON u.id = ubi.user_id
WHERE u.username = 'harsha' AND t.name = 'welcome_message';
```

## 🚨 **Expected Behaviors**

### Development Mode
- Test tokens (`test_*`) trigger mock responses
- Messages are logged but not actually sent
- Returns success with mock message ID

### Production Mode  
- Real access tokens attempt actual API calls
- Success depends on valid Meta API credentials
- May return 502 if credentials are invalid

## ✅ **Success Indicators**

1. **Server Starts**: No compilation errors
2. **Health Check**: Returns 200 with status message
3. **Validation Works**: 400/401/404 errors for invalid inputs
4. **Test Mode**: 200 success with mock message ID for valid test requests
5. **Rate Limiting**: 429 error after 100+ requests in 15 minutes

## 🔧 **Troubleshooting**

### Server Won't Start
- Check database connection in `.env`
- Verify all dependencies installed: `npm install`
- Check for TypeScript errors: `npm run build`

### 500 Internal Server Error  
- Check server logs for detailed error messages
- Verify database connectivity
- Check that all required tables exist

### Authentication Failures
- Verify user exists and has business info
- Check that `is_active` is true in user_business_info
- Ensure access token is properly set

### Template Not Found
- Check template exists for the user
- Verify template status is 'ACTIVE'
- Case sensitivity matters for template names

---

**Test Command Summary**:
```bash
# Start server
npm run dev

# Run comprehensive tests
node test-send-api.js

# Manual verification
curl http://localhost:5050/api/health
```