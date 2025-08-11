# n8n Inbound Message Forwarding - Prime SMS

## 🎯 Overview
Prime SMS now automatically forwards **inbound WhatsApp messages** to configured n8n webhook URLs. When a customer sends a message to your WhatsApp Business number, it's forwarded to your n8n workflow in real-time.

## 🏗️ Architecture
```
WhatsApp Customer → Meta Webhook → Prime SMS → n8n Workflow
```

## 🚀 Features
- ✅ **Only inbound messages** forwarded (not status updates)
- ✅ **Per-tenant webhook URLs** from `user_business_info` table
- ✅ **HMAC signature verification** using per-tenant secrets
- ✅ **Automatic retry** with exponential backoff
- ✅ **Non-blocking processing** - doesn't affect WhatsApp webhook response
- ✅ **Comprehensive message type support** (text, interactive, media, location, etc.)
- ✅ **Production-ready** with error handling and logging

## 📋 Database Configuration

Each user needs the following configured in `user_business_info` table:

```sql
-- Required for n8n forwarding
UPDATE user_business_info 
SET 
  webhook_url = 'https://your-n8n.domain.com/webhook/primesms-inbound',
  webhook_verify_token = 'your-secret-key-here'
WHERE user_id = 'your-user-id';
```

### Fields:
- `webhook_url` (required): Your n8n webhook endpoint URL
- `webhook_verify_token` (optional): Secret for HMAC signature verification

## 🔧 Environment Variables

```bash
# n8n forwarding configuration (optional - has defaults)
N8N_TIMEOUT_MS=5000      # HTTP timeout for n8n calls (default: 5000ms)
N8N_MAX_RETRIES=3        # Maximum retry attempts (default: 3)
```

## 📤 n8n Webhook Payload

Your n8n workflow will receive a POST request with this structure:

### Headers:
```http
Content-Type: application/json
X-Prime-UserId: user_123
X-Prime-PhoneNumberId: 1234567890123
X-Prime-Event: message_in
X-PrimeSig: sha256=abc123... (if webhook_verify_token is set)
User-Agent: PrimeSMS-n8n-Forwarder/1.0
```

### Body:
```json
{
  "source": "whatsapp",
  "event": "message_in",
  "tenant": {
    "userId": "user_123",
    "wabaId": "waba_456", 
    "phoneNumberId": "1234567890123"
  },
  "message": {
    "wamid": "wamid.HBgNMTU1NTA...",
    "from": "15550001111",
    "to": "15551234567", 
    "type": "text",
    "text": "Hello from customer",
    "interactive": null,
    "media": null,
    "location": null,
    "contacts": null,
    "sticker": null
  },
  "raw": {
    "messaging_product": "whatsapp",
    "metadata": {
      "display_phone_number": "15551234567",
      "phone_number_id": "1234567890123"
    },
    "contacts": [...],
    "messages": [...]
  },
  "receivedAt": "2025-08-11T04:10:25.039Z"
}
```

## 📱 Message Types Supported

### Text Messages
```json
{
  "type": "text",
  "text": "Hello from customer"
}
```

### Interactive Messages (Button/List Replies)
```json
{
  "type": "interactive", 
  "text": "Yes, I agree",
  "interactive": {
    "type": "button",
    "title": "Yes, I agree"
  }
}
```

### Media Messages (Image/Video/Audio/Document)
```json
{
  "type": "image",
  "text": "Check this photo",
  "media": {
    "id": "media_123",
    "mime_type": "image/jpeg",
    "caption": "Check this photo"
  }
}
```

### Location Messages
```json
{
  "type": "location",
  "text": "My Location", 
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "name": "My Location",
    "address": "San Francisco, CA"
  }
}
```

## 🔐 HMAC Signature Verification

If `webhook_verify_token` is configured, verify the signature in n8n:

### Node.js Example:
```javascript
const crypto = require('crypto');

function verifyPrimeSMSSignature(body, signature, secret) {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your n8n workflow:
const signature = $request.headers['x-primesig'];
const isValid = verifyPrimeSMSSignature(
  JSON.stringify($request.body), 
  signature, 
  'your-webhook-verify-token'
);

if (!isValid) {
  throw new Error('Invalid signature');
}
```

### Python Example:
```python
import hmac
import hashlib

def verify_prime_sms_signature(body, signature, secret):
    expected = 'sha256=' + hmac.new(
        secret.encode('utf-8'),
        body.encode('utf-8'), 
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected)
```

## 🧪 Testing

Run the included test script:
```bash
cd server
node test-n8n-forwarding.js
```

### Manual Testing with cURL:
```bash
# Simulate an inbound WhatsApp message
curl -X POST http://localhost:3000/webhooks/meta \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=YOUR_SIGNATURE" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WABA_ID",
      "changes": [{
        "field": "messages",
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "15551234567",
            "phone_number_id": "YOUR_PHONE_NUMBER_ID"
          },
          "contacts": [{
            "profile": {"name": "Test Customer"},
            "wa_id": "15550001111"
          }],
          "messages": [{
            "from": "15550001111",
            "id": "wamid.test123",
            "timestamp": "1723290000",
            "type": "text",
            "text": {"body": "Hello from customer!"}
          }]
        }
      }]
    }]
  }'
```

## 🔍 Monitoring & Logs

### Server Logs:
```
📤 [N8N_FORWARDER] Preparing to forward inbound message to n8n for user user_123
🔐 [N8N_FORWARDER] Added HMAC signature for user user_123
🔄 [N8N_FORWARDER] Attempt 1/3 to forward to n8n for user user_123
✅ [N8N_FORWARDER] n8n responded with status 200 for user user_123
📤 [WEBHOOK] n8n forwarding stats: { inbound: 1, forwarded: 1, errors: 0 }
```

### Error Handling:
- Network errors → Automatic retry with backoff
- 5xx server errors → Automatic retry with backoff  
- 4xx client errors → No retry (logged as error)
- Timeout → Automatic retry with backoff

## 🚨 Troubleshooting

### Common Issues:

1. **Messages not forwarding**
   - Check `webhook_url` is set in `user_business_info`
   - Check n8n webhook is accessible and responding
   - Check server logs for error messages

2. **Signature verification failing**
   - Ensure `webhook_verify_token` matches in database and n8n
   - Verify HMAC calculation in n8n workflow
   - Check for encoding issues (UTF-8)

3. **n8n webhook timing out**
   - Increase `N8N_TIMEOUT_MS` if needed
   - Optimize n8n workflow performance
   - Check network connectivity

### Debug Mode:
Change `logLevel: 'minimal'` to `'detailed'` in `/server/src/routes/metaWebhook.ts` for verbose logging.

## 🔄 Deployment

1. **Update database** with webhook URLs for users
2. **Deploy server** changes to production  
3. **Configure n8n** workflows to handle inbound messages
4. **Test** with real WhatsApp messages

## 📚 Files Modified/Added

- `server/src/services/n8nForwarder.ts` - Core forwarding logic
- `server/src/services/waToN8nInboundMapper.ts` - Message mapping
- `server/src/services/n8nWebhookProcessor.ts` - Webhook processing 
- `server/src/routes/metaWebhook.ts` - Integration point
- `server/test-n8n-forwarding.js` - Test script

## ✅ Production Ready

This implementation is production-ready with:
- ✅ Non-blocking webhook processing
- ✅ Comprehensive error handling  
- ✅ Automatic retry logic
- ✅ Security (HMAC signatures)
- ✅ Extensive logging
- ✅ TypeScript type safety
- ✅ Test coverage