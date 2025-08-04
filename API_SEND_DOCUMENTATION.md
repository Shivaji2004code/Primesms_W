# WhatsApp Template Message Send API Documentation

## Overview

The Prime SMS platform provides a simple, secure API endpoint that allows clients to send templated WhatsApp messages programmatically. This API acts as a proxy to the Meta WhatsApp Cloud API, abstracting away complexity while providing security and rate limiting.

## Base URL
```
http://your-server-domain.com/api
```

## Authentication

The API uses **username-based authentication**. Each request must include a valid `username` parameter that corresponds to a user with:
- An active account in the Prime SMS system
- WhatsApp Business API credentials properly configured
- An active WhatsApp Business account

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit information is returned in response headers
- **Exceeded**: Returns HTTP 429 with retry information

## Endpoint

### Send WhatsApp Template Message

**Endpoint**: `/send`  
**Methods**: `GET`, `POST`  
**Authentication**: Username-based  

Sends a templated WhatsApp message to a specified recipient using a pre-configured template.

#### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `username` | string | Your Prime SMS username | `john_business` |
| `templatename` | string | Name of the active template to use | `welcome_message` |
| `recipient_number` | string | WhatsApp number in international format | `+1234567890` |

#### Optional Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `header` | string | Text content for TEXT-type headers | `Welcome John!` |
| `var1`, `var2`, `var3`... | string | Template body variables (in order) | `var1=John&var2=12345` |
| `button_payload` | string | Payload for quick reply buttons | `CONFIRM_ORDER` |

#### Request Examples

##### GET Request
```bash
curl -X GET "http://your-server.com/api/send?username=john_business&templatename=welcome_message&recipient_number=%2B1234567890&var1=John%20Doe"
```

##### GET Request with Multiple Variables
```bash
curl -X GET "http://your-server.com/api/send?username=john_business&templatename=order_confirmation&recipient_number=%2B1234567890&var1=12345&var2=99.99&var3=Dec%2025%202025"
```

##### GET Request with Header and Button
```bash
curl -X GET "http://your-server.com/api/send?username=john_business&templatename=promo_message&recipient_number=%2B1234567890&header=Special%20Offer&var1=John&button_payload=VIEW_OFFER"
```

##### POST Request (JSON)
```bash
curl -X POST "http://your-server.com/api/send" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_business",
    "templatename": "welcome_message",
    "recipient_number": "+1234567890",
    "var1": "John Doe"
  }'
```

##### POST Request with All Parameters
```bash
curl -X POST "http://your-server.com/api/send" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_business",
    "templatename": "order_confirmation",
    "recipient_number": "+1234567890",
    "header": "Order Update",
    "var1": "12345",
    "var2": "99.99",
    "var3": "Dec 25, 2025",
    "button_payload": "TRACK_ORDER"
  }'
```

## Response Format

### Success Response

**HTTP Status**: `200 OK`

```json
{
  "success": true,
  "message": "Message sent successfully",
  "message_id": "wamid.HBgMM1234567890ABEGjkl...",
  "recipient": "+1234567890",
  "template": "welcome_message"
}
```

### Error Responses

#### 400 Bad Request - Missing Parameters
```json
{
  "error": "Bad Request",
  "message": "Missing required parameters",
  "details": [
    "username is required",
    "templatename is required"
  ]
}
```

#### 400 Bad Request - Invalid Phone Number
```json
{
  "error": "Bad Request",
  "message": "Invalid recipient phone number format",
  "details": "Phone number must be in international format (e.g., +1234567890)"
}
```

#### 401 Unauthorized - Invalid Username
```json
{
  "error": "Unauthorized",
  "message": "Invalid username or inactive WhatsApp Business account"
}
```

#### 404 Not Found - Template Not Found
```json
{
  "error": "Not Found",
  "message": "Template 'welcome_message' not found or not active"
}
```

#### 429 Too Many Requests - Rate Limited
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

#### 502 Bad Gateway - WhatsApp API Error
```json
{
  "error": "Bad Gateway",
  "message": "Failed to send message via WhatsApp API"
}
```

## Template Requirements

### Supported Template Types

1. **Text Headers**: Only TEXT-type headers are supported via the API
2. **Body Variables**: Support for unlimited `{{variable}}` placeholders
3. **Quick Reply Buttons**: Support for quick reply button payloads
4. **Footer**: Static footer text (no variables)

### Unsupported Features

- Media headers (IMAGE, VIDEO, DOCUMENT)
- URL buttons
- Phone number buttons
- Multiple button types in one template

### Template Status

Templates must be in `ACTIVE` status to be used via the API. Templates in other states (`DRAFT`, `IN_REVIEW`, `REJECTED`, etc.) will return a 404 error.

## Variable Mapping

Variables are mapped in numerical order:
- `var1` → First `{{variable}}` in template
- `var2` → Second `{{variable}}` in template
- `var3` → Third `{{variable}}` in template
- And so on...

### Example Template
```
Template: "Hello {{1}}, your order #{{2}} for ${{3}} is confirmed!"
API Call: var1=John&var2=12345&var3=99.99
Result: "Hello John, your order #12345 for $99.99 is confirmed!"
```

## Phone Number Format

Phone numbers must be in international format:
- ✅ `+1234567890`
- ✅ `+44123456789`
- ❌ `1234567890` (missing +)
- ❌ `+1 (234) 567-8900` (contains spaces/special chars)

## Security Features

1. **Input Sanitization**: All inputs are sanitized to prevent injection attacks
2. **Rate Limiting**: Per-IP rate limiting prevents abuse
3. **Parameterized Queries**: All database queries use parameterized statements
4. **Token Security**: Access tokens are never exposed in logs or responses
5. **Validation**: Strict validation of all input parameters

## Error Handling

The API provides detailed error messages while avoiding exposure of sensitive internal information:

- **Client Errors (4xx)**: Provide specific guidance for fixing the request
- **Server Errors (5xx)**: Generic messages to avoid information disclosure  
- **Logging**: Detailed error information is logged server-side for debugging

## Best Practices

### 1. Error Handling
```javascript
// Example error handling in JavaScript
fetch('/api/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'your_username',
    templatename: 'welcome_message',
    recipient_number: '+1234567890',
    var1: 'John Doe'
  })
})
.then(response => {
  if (!response.ok) {
    return response.json().then(err => Promise.reject(err));
  }
  return response.json();
})
.then(data => {
  console.log('Message sent:', data.message_id);
})
.catch(error => {
  console.error('Send failed:', error.message);
});
```

### 2. Rate Limit Handling
```javascript
// Check rate limit headers
const remaining = response.headers.get('X-RateLimit-Remaining');
const resetTime = response.headers.get('X-RateLimit-Reset');

if (remaining && parseInt(remaining) < 10) {
  console.warn('Approaching rate limit');
}
```

### 3. Retry Logic
```javascript
async function sendWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      if (response.status === 429) {
        // Rate limited - wait before retry
        await new Promise(resolve => setTimeout(resolve, 15000));
        continue;
      }
      
      // Other errors - don't retry
      throw new Error(`HTTP ${response.status}`);
      
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## Integration Examples

### 1. Node.js / Express Integration
```javascript
const axios = require('axios');

async function sendWelcomeMessage(customerName, phoneNumber) {
  try {
    const response = await axios.post('http://your-server.com/api/send', {
      username: process.env.PRIMESMS_USERNAME,
      templatename: 'welcome_message',
      recipient_number: phoneNumber,
      var1: customerName
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to send welcome message:', error.response?.data);
    throw error;
  }
}
```

### 2. PHP Integration
```php
<?php
function sendOrderConfirmation($orderId, $amount, $phoneNumber) {
    $data = [
        'username' => $_ENV['PRIMESMS_USERNAME'],
        'templatename' => 'order_confirmation',
        'recipient_number' => $phoneNumber,
        'var1' => $orderId,
        'var2' => $amount
    ];
    
    $ch = curl_init('http://your-server.com/api/send');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    } else {
        throw new Exception('Failed to send message: ' . $response);
    }
}
?>
```

### 3. Python Integration
```python
import requests
import os

def send_template_message(template_name, phone_number, variables=None):
    data = {
        'username': os.getenv('PRIMESMS_USERNAME'),
        'templatename': template_name,
        'recipient_number': phone_number
    }
    
    # Add variables
    if variables:
        for i, value in enumerate(variables, 1):
            data[f'var{i}'] = value
    
    response = requests.post(
        'http://your-server.com/api/send',
        json=data,
        timeout=30
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        response.raise_for_status()

# Usage
result = send_template_message(
    'welcome_message', 
    '+1234567890', 
    ['John Doe']
)
print(f"Message sent: {result['message_id']}")
```

## FAQ

### Q: Can I send media files through this API?
A: No, this API only supports text-based templates. Media templates must be sent through the main Prime SMS dashboard.

### Q: How do I create new templates?
A: Templates must be created and approved through the Prime SMS dashboard. Once approved and active, they can be used via this API.

### Q: What happens if I exceed the rate limit?
A: You'll receive a 429 status code. Wait for the reset time indicated in the response headers before making new requests.

### Q: Can I use this API for marketing messages?
A: Only if your templates are approved for MARKETING category by Meta. UTILITY templates can be sent to customers who have opted in.

### Q: How do I handle delivery confirmations?
A: Delivery status is handled through webhooks configured in your Prime SMS dashboard. This API only handles sending.

### Q: What if my WhatsApp Business API is not configured?
A: You'll receive a 401 Unauthorized error. Ensure your WhatsApp Business API credentials are properly configured in your Prime SMS account.

## Support

For technical support, API issues, or questions about integration:
- Email: support@primesms.com
- Documentation: https://docs.primesms.com
- Status Page: https://status.primesms.com

---

**Last Updated**: December 2024  
**API Version**: 1.0