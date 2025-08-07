# PrimeSMS API Documentation

Complete API reference for integrating with the PrimeSMS WhatsApp Business API platform.

## 🔐 Authentication

PrimeSMS uses username-based authentication for all API requests.

**Required Parameter:**
- `username`: Your PrimeSMS username (obtained from your account)

## 📨 Send Message API

### Primary Endpoint: `/api/send`

Send WhatsApp messages using approved templates to individual recipients.

**URL**: `http://your-server.com/api/send`  
**Methods**: GET, POST  
**Rate Limit**: 100 requests per 15 minutes per IP address  

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `username` | string | Your PrimeSMS username |
| `templatename` | string | Name of your approved template |
| `recipient_number` | string | WhatsApp number in international format (without + prefix) |

### Optional Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `header` | string | Header text for templates with TEXT-type headers |
| `var1`, `var2`, `var3`... | string | Sequential template body variables |
| `button_payload` | string | Payload for quick reply buttons |

### Example Requests

#### GET Request
```bash
curl -X GET "http://your-server.com/api/send?username=john_business&templatename=welcome_message&recipient_number=1234567890&var1=John%20Doe&var2=Premium"
```

#### POST Request (Recommended)
```bash
curl -X POST "http://your-server.com/api/send" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_business",
    "templatename": "welcome_message", 
    "recipient_number": "1234567890",
    "var1": "John Doe",
    "var2": "Premium"
  }'
```

#### POST Request with Header and Button
```bash
curl -X POST "http://your-server.com/api/send" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_business",
    "templatename": "promotion_offer",
    "recipient_number": "1234567890", 
    "header": "🎉 Special Offer!",
    "var1": "John",
    "var2": "30",
    "var3": "SAVE30",
    "button_payload": "learn_more_offer"
  }'
```

### Response Format

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Message sent successfully",
  "message_id": "wamid.HBgMM1234567890VReAg...",
  "recipient": "1234567890",
  "template": "welcome_message",
  "credits_deducted": 0.15,
  "remaining_credits": 1500
}
```

#### Error Responses

**Authentication Error (401)**
```json
{
  "success": false,
  "error": "Authentication failed",
  "message": "Invalid username or user not found"
}
```

**Template Error (400)**
```json
{
  "success": false,
  "error": "Template not found",
  "message": "Template 'invalid_template' not found for user"
}
```

**Insufficient Credits (402)**
```json
{
  "success": false,
  "error": "Insufficient credits",
  "message": "Not enough credits to send message",
  "required_credits": 0.15,
  "current_balance": 0.05
}
```

**Validation Error (400)**
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Invalid recipient number format"
}
```

**Rate Limit Error (429)**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please wait before trying again",
  "retry_after": 900
}
```

## 📋 Template System

### Template Categories & Pricing

| Category | Price per Message | Description |
|----------|-------------------|-------------|
| **UTILITY** | 0.15 credits | Transactional messages (confirmations, updates) |
| **AUTHENTICATION** | 0.15 credits | OTP, verification codes |
| **MARKETING** | 0.80 credits | Promotional content, newsletters |

### Template Variables

Templates support dynamic variables using the `{{variable}}` syntax:

**Template Body Example:**
```
Hello {{1}}, your order #{{2}} is confirmed! 
Total: ${{3}}. Delivery expected: {{4}}.
```

**API Usage:**
```json
{
  "var1": "John Doe",
  "var2": "12345", 
  "var3": "99.99",
  "var4": "December 25"
}
```

### Template Components

#### Header Types
- **TEXT**: Dynamic text header (`header` parameter)
- **IMAGE**: Static image header 
- **VIDEO**: Static video header
- **DOCUMENT**: Static document header

#### Body
- Main message content with variable placeholders
- Required for all templates

#### Footer  
- Optional static text at bottom of message

#### Buttons
- **Quick Reply**: Single payload buttons (`button_payload` parameter)
- **Call**: Phone number buttons
- **URL**: Website link buttons

## 🔗 Health Check API

### Endpoint: `/health`

Check API server status and uptime.

**URL**: `http://your-server.com/health`  
**Method**: GET  
**Authentication**: None required  

#### Response
```json
{
  "status": "ok",
  "uptime": 12345.67,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 📊 Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success - Message sent |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Authentication failed |
| 402 | Payment Required - Insufficient credits |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - System error |

### Error Response Structure
All error responses follow this format:
```json
{
  "success": false,
  "error": "error_type",
  "message": "Human readable error message"
}
```

## 🔧 Best Practices

### 1. Authentication
- Store your username securely
- Never expose credentials in client-side code
- Use environment variables for credentials

### 2. Rate Limiting
- Implement exponential backoff for rate limit errors
- Monitor your request volume
- Consider batching requests for high-volume usage

### 3. Error Handling
- Always check the `success` field in responses
- Implement proper error logging
- Handle network timeouts gracefully

### 4. Template Management
- Test templates thoroughly before production use
- Use appropriate template categories for pricing
- Keep variable mapping consistent

### 5. Phone Number Format
- Always use international format
- Remove the + prefix (e.g., use `1234567890` not `+1234567890`)
- Validate numbers before sending

## 🔍 Testing

### Test Credentials
Use these credentials for testing:

**Username**: `testuser`  
**Available Templates**: Ask your admin for test template names

### Sample Test Request
```bash
curl -X POST "http://your-server.com/api/send" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "templatename": "hello_world", 
    "recipient_number": "1234567890",
    "var1": "Test User"
  }'
```

## 📈 Monitoring Your Usage

### Credit Management
- Monitor your credit balance regularly
- Set up low-balance alerts
- Track usage patterns by template category

### Delivery Tracking
- Store message IDs for delivery tracking
- Implement webhook handling for delivery receipts
- Monitor template approval status

### Performance Optimization
- Use POST requests for complex parameters
- Implement request caching where appropriate
- Monitor API response times

## 🆘 Troubleshooting

### Common Issues

**"Template not found"**
- Verify template name spelling
- Ensure template is approved and active
- Check template belongs to your account

**"Invalid recipient number"**
- Use international format without + prefix
- Ensure number is a valid WhatsApp number
- Check for typos or invalid characters

**"Insufficient credits"**
- Check your credit balance
- Contact admin to add credits
- Verify template category pricing

**"Rate limit exceeded"**
- Implement request throttling
- Wait for the retry_after period
- Consider upgrading your rate limit

### Getting Help
- Check error messages carefully
- Verify all required parameters
- Test with known working values
- Contact support with request details

## 🔄 API Versioning

Current API version: **v1**

All endpoints use the current version. Future versions will be communicated with migration guides.

## 📞 Support

For technical support:
- Check this documentation first
- Verify your implementation against examples
- Contact your system administrator
- Include relevant error messages and request details

---

*Last updated: January 2024*