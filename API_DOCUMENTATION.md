# Prime SMS API Documentation

**Base URL:** `https://www.primesms.app`

## Overview

Prime SMS provides a simple REST API for sending WhatsApp messages using approved templates through the Meta WhatsApp Cloud API. Our API handles authentication, template validation, credit management, and message delivery.

## Authentication

All API calls require a valid username that corresponds to an active Prime SMS account with configured WhatsApp Business API credentials.

## Rate Limiting

- **API Endpoint:** 100 requests per 15 minutes per IP address
- **Template Analysis:** 100 requests per 15 minutes per IP address

## API Endpoints

### 1. Send WhatsApp Message

**Endpoint:** `/api/send`  
**Methods:** `GET` or `POST`  
**Description:** Send a WhatsApp message using an approved template

#### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `username` | string | Your Prime SMS username | `"harsha"` |
| `templatename` | string | Name of the approved template | `"final_call"` |
| `recipient_number` | string | WhatsApp number (country code + number, no + prefix) | `"919000900190"` |

#### Optional Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `header_text` | string | Text content for TEXT headers | `"Welcome Message"` |
| `var1`, `var2`, `var3`... | string | Template body variables (numbered sequentially) | `"shivaji"` |
| `button_payload` | string | Payload for quick reply buttons | `"CONFIRM_ACTION"` |
| `button_text` | string | Dynamic text for URL buttons | `"View Order"` |
| `button_url` | string | Dynamic URL for URL buttons | `"https://example.com/order/12345"` |

#### Example Requests

**GET Request:**
```
GET https://www.primesms.app/api/send?username=harsha&templatename=final_call&recipient_number=919000900190&var1=shivaji
```

**POST Request:**
```bash
curl -X POST https://www.primesms.app/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "username": "harsha",
    "templatename": "final_call",
    "recipient_number": "919000900190",
    "var1": "shivaji"
  }'
```

#### Success Response

```json
{
  "success": true,
  "message": "Message sent successfully",
  "message_id": "wamid.HBgNOTE5MDAxODEwNjkwFQIAEhgGM0E2QTlCRjY4RDQ4M0E5OUFAA==",
  "recipient": "919000900190",
  "template": "final_call"
}
```

#### Error Responses

**Missing Required Parameters (400):**
```json
{
  "error": "Bad Request",
  "message": "Missing required parameters",
  "details": ["username is required", "templatename is required"]
}
```

**Invalid Username (401):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid username or inactive WhatsApp Business account"
}
```

**Template Not Found (404):**
```json
{
  "error": "Not Found",
  "message": "Template 'final_call' not found or not active"
}
```

**Invalid Phone Number (400):**
```json
{
  "error": "Bad Request",
  "message": "Invalid recipient phone number format",
  "details": "Phone number must be in Meta WhatsApp API format (country code + number, no + prefix, e.g., 919398424270 for India, 14155552345 for US)"
}
```

**Duplicate Message Blocked (400):**
```json
{
  "success": false,
  "duplicate": true,
  "message": "Duplicate message blocked - same template and variables sent to this number within 5 minutes",
  "template": "final_call",
  "phone": "919000900190",
  "variables": {"var1": "shivaji"},
  "hash": "abc123def456"
}
```

**Rate Limited (429):**
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

### 2. Template Analysis

**Endpoint:** `/api/send/template-info/{username}/{templatename}`  
**Method:** `GET`  
**Description:** Analyze a template and get parameter requirements

#### Example Request
```
GET https://www.primesms.app/api/send/template-info/harsha/final_call
```

#### Success Response
```json
{
  "success": true,
  "template": {
    "name": "final_call",
    "language": "en_US",
    "status": "APPROVED"
  },
  "requirements": {
    "required_params": ["username", "templatename", "recipient_number"],
    "optional_params": [
      {
        "name": "var1",
        "description": "Variable 1 for template body",
        "required": true,
        "example": "Value 1"
      }
    ],
    "variable_count": 1,
    "has_header": false,
    "header_type": null,
    "has_buttons": false,
    "button_types": [],
    "example_request": {
      "method": "POST",
      "url": "/api/send",
      "body": {
        "username": "your_username",
        "templatename": "final_call",
        "recipient_number": "+1234567890",
        "var1": "Value 1"
      }
    }
  }
}
```

## Phone Number Format

**Important:** Phone numbers must be in Meta WhatsApp API format:
- Include country code
- No "+" prefix
- No spaces or dashes

**Examples:**
- India: `919000900190` (91 + 9000900190)
- US: `14155552345` (1 + 4155552345)
- UK: `447700900123` (44 + 7700900123)

## Template Variables

Templates can contain dynamic variables marked as `{{1}}`, `{{2}}`, etc. in the template body:
- Use `var1` for `{{1}}`
- Use `var2` for `{{2}}`
- And so on...

## Button Types

### Quick Reply Buttons
If your template has quick reply buttons, use the `button_payload` parameter to specify the action payload.

### URL Buttons
- **Static URLs:** No additional parameters needed
- **Dynamic URLs:** Use `button_url` parameter for templates with `{{1}}` placeholders in URLs

## Credit System

- Credits are automatically deducted upon successful message delivery
- Different template categories have different credit costs
- Duplicate messages are blocked but credits are still deducted
- Check your credit balance in the Prime SMS dashboard

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid username/credentials)
- `404` - Not Found (template not found)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `502` - Bad Gateway (WhatsApp API error)
- `504` - Gateway Timeout (WhatsApp API timeout)

## Support

For API support and questions:
- Email: admin@primesms.app
- Dashboard: https://www.primesms.app/user/support

## Changelog

**v1.0.0**
- Initial API release
- Template-based messaging
- Duplicate detection
- Credit management
- Rate limiting
- Comprehensive error handling