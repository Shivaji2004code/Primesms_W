# 🚀 Prime SMS - Meta WhatsApp Webhook Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Database Setup
Run this SQL to optimize webhook routing (run once):
```sql
-- Add index for WhatsApp phone number ID lookups (for webhook routing)
CREATE INDEX IF NOT EXISTS idx_user_business_info_whatsapp_number_id 
ON user_business_info(whatsapp_number_id) 
WHERE is_active = true;
```

### 2. Coolify Environment Variables
Add these environment variables in your Coolify application settings:

**Required (Production)**:
```bash
META_VERIFY_TOKEN=your-secure-verify-token-here
META_APP_SECRET=your-meta-app-secret-from-facebook
WEBHOOK_DEBUG_TOKEN=your-secure-debug-token-here
GRAPH_API_VERSION=v22.0
```

**Optional (Development Only)**:
```bash
# Only for local testing - NEVER set in production!
META_SKIP_SIGNATURE_VERIFY=true
```

### 3. Meta App Configuration
In your Facebook Developer Console:

1. **App Settings** → Basic
   - Copy your `App Secret` → Use as `META_APP_SECRET`

2. **WhatsApp** → Configuration
   - **Webhook URL**: `https://primesms.app/webhooks/meta`
   - **Verify Token**: Same value as `META_VERIFY_TOKEN`
   - **Webhook Fields**: Check ✅ `messages` and ✅ `message_template_status_update`

3. **Test webhook** using "Test" button in Meta console

## 🔗 Webhook Endpoints

Once deployed, these endpoints will be available:

### Production Endpoints
- `GET https://primesms.app/webhooks/meta` - Meta verification handshake
- `POST https://primesms.app/webhooks/meta` - Receive webhook events

### Debug Endpoints (Authenticated)
- `GET https://primesms.app/webhooks/meta/debug/log` - View recent events
- `GET https://primesms.app/webhooks/meta/health/subscribed-apps` - Check webhook health
- `POST https://primesms.app/webhooks/meta/self-test/send` - Send test message

## 🧪 Testing Commands

### 1. Test Verification (After deployment)
```bash
curl -i "https://primesms.app/webhooks/meta?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=12345"
```
Expected: `200 OK` with response body `12345`

### 2. Test Debug Log Access
```bash
curl -H "Authorization: Bearer YOUR_DEBUG_TOKEN" \
  "https://primesms.app/webhooks/meta/debug/log?limit=10"
```

### 3. Test Health Check (requires user with business info)
```bash
curl -H "Authorization: Bearer YOUR_DEBUG_TOKEN" \
  "https://primesms.app/webhooks/meta/health/subscribed-apps?userId=USER_UUID"
```

### 4. Test Self-Test Send (requires user with business info)
```bash
curl -X POST "https://primesms.app/webhooks/meta/self-test/send" \
  -H "Authorization: Bearer YOUR_DEBUG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_UUID","to":"+919876543210"}'
```

## 🔐 Security Features

✅ **HMAC-SHA256 signature verification** - Validates all webhook requests  
✅ **Bearer token authentication** - Secures debug endpoints  
✅ **Rate limiting** - Prevents debug endpoint abuse  
✅ **Input validation** - Sanitizes all webhook data  
✅ **Database connection pooling** - Prevents connection exhaustion  
✅ **Async processing** - Fast webhook responses (<1s)  

## 📊 What the Webhook Does

### Message Status Updates
- Updates `message_logs.status` (sent → delivered → read)
- Updates delivery timestamps (`sent_at`, `delivered_at`, `read_at`)
- Updates `campaign_logs.delivered_at` for campaign tracking
- Handles failed message statuses with error messages

### Incoming Messages (Customer Replies)
- Logs structured message data for future processing
- Ready for customer support integration
- Ready for auto-reply triggers
- Maps messages to correct business user via `phone_number_id`

### Multi-Tenant Support
- Automatically routes events to correct user via `whatsapp_number_id` lookup
- Isolates business data per user account
- Supports multiple WhatsApp Business Accounts per application

## 🚨 Troubleshooting

### Common Issues

**1. Webhook verification fails**
- Check `META_VERIFY_TOKEN` matches Meta console setting
- Ensure webhook URL is exactly `https://primesms.app/webhooks/meta`

**2. Signature verification fails**
- Check `META_APP_SECRET` is correct App Secret from Meta
- Ensure requests are coming from Meta servers
- Check webhook endpoint is receiving raw body

**3. User not found for phone_number_id**
- Ensure `user_business_info.whatsapp_number_id` matches Meta's phone number ID
- Check `user_business_info.is_active = true`
- Run the database index creation SQL above

**4. Debug endpoints return 401**
- Check `Authorization: Bearer YOUR_DEBUG_TOKEN` header
- Verify `WEBHOOK_DEBUG_TOKEN` environment variable

### Log Monitoring

Watch server logs for these webhook events:
- `🔍 [WEBHOOK] GET /meta - Verification handshake` 
- `📩 [WEBHOOK] POST /meta - Received webhook event`
- `✅ [WEBHOOK] Signature verification passed`
- `📝 [WEBHOOK] Logged event: field=messages`
- `📊 [WEBHOOK] Processing status updates`
- `✅ [WEBHOOK] Updated message status`

## 🎯 Next Steps After Deployment

1. **Configure Meta App** with production webhook URL
2. **Test verification** using curl command above
3. **Send test message** from WhatsApp Business API
4. **Check debug logs** to confirm events are being received
5. **Monitor** status updates in `message_logs` table

The webhook system is now ready for production WhatsApp Business API events! 🚀