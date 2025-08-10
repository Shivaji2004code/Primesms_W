# 🚀 Prime SMS - Webhook Processors & SSE Live Updates

## 📋 Overview

Enhanced webhook processing system that:
- ✅ Updates `templates` table from Meta template status webhooks
- ✅ Updates `campaign_logs` table from message status webhooks  
- ✅ Provides real-time SSE updates to frontend per user
- ✅ Routes events via `user_business_info` using `phone_number_id`

## 🔧 **REQUIRED: Database Updates**

Run these SQL commands **ONCE** before deploying:

```sql
-- Add indexes for efficient webhook processing
CREATE INDEX IF NOT EXISTS idx_campaign_logs_message_id 
ON campaign_logs(message_id) WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_logs_user_message 
ON campaign_logs(user_id, message_id) WHERE message_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS campaign_logs_user_message_unique 
ON campaign_logs(user_id, message_id) WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_templates_user_name_lang 
ON templates(user_id, name, language);
```

## 🔗 **New API Endpoints**

### SSE Real-time Endpoints (Authenticated)
- `GET /api/realtime/reports/:userId` - Live campaign/message status updates
- `GET /api/realtime/templates/:userId` - Live template status updates

### Debug/Monitoring Endpoints
- `GET /api/realtime/stats` - SSE connection statistics (admin only)
- `POST /api/realtime/test/:userId` - Send test SSE event
- `GET /api/realtime/health` - SSE service health check

## 📊 **What Gets Processed**

### Template Status Updates (`message_template_status_update`)
- **Webhook Field**: `message_template_status_update`
- **Updates**: `templates` table status by `(user_id, name, language)`
- **Statuses**: `APPROVED`, `REJECTED`, `PENDING`, `PAUSED`, `DISABLED`
- **SSE Event**: `template_update` with template name, status, reason

### Message Status Updates (`messages.statuses`)
- **Webhook Field**: `messages` → `statuses[]`
- **Updates**: `campaign_logs` table by `(user_id, message_id)`
- **Statuses**: `sent`, `delivered`, `read`, `failed`
- **SSE Event**: `report_update` with message ID, status, timestamps

## 🧪 **Testing the System**

### 1. Test SSE Connections

**Frontend JavaScript:**
```javascript
// Connect to reports stream
const reportsEventSource = new EventSource('/api/realtime/reports/YOUR_USER_ID');
reportsEventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Report update:', data);
};

// Connect to templates stream  
const templatesEventSource = new EventSource('/api/realtime/templates/YOUR_USER_ID');
templatesEventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Template update:', data);
};
```

### 2. Test Webhook Processing

**Simulate Message Status Update:**
```bash
curl -X POST "https://primesms.app/webhooks/meta" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=YOUR_SIGNATURE" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WABA_ID",
      "changes": [{
        "field": "messages",
        "value": {
          "metadata": {"phone_number_id": "YOUR_PHONE_NUMBER_ID"},
          "statuses": [{
            "id": "wamid.TEST_MESSAGE_ID",
            "recipient_id": "+919876543210",
            "status": "delivered",
            "timestamp": "1723291000",
            "conversation": {"id": "CONVERSATION_ID"},
            "pricing": {"billable": true, "category": "utility"}
          }]
        }
      }]
    }]
  }'
```

**Simulate Template Status Update:**
```bash
curl -X POST "https://primesms.app/webhooks/meta" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=YOUR_SIGNATURE" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WABA_ID", 
      "changes": [{
        "field": "message_template_status_update",
        "value": {
          "metadata": {"phone_number_id": "YOUR_PHONE_NUMBER_ID"},
          "message_template": {
            "name": "order_confirmation",
            "language": {"code": "en_US"}
          },
          "event": "APPROVED",
          "last_updated_time": "1723292000"
        }
      }]
    }]
  }'
```

### 3. Test SSE Events

**Send Test Event:**
```bash
curl -X POST "https://primesms.app/api/realtime/test/YOUR_USER_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"eventType": "reports"}'
```

**Check SSE Stats:**
```bash
curl "https://primesms.app/api/realtime/stats" \
  -H "Authorization: Bearer YOUR_WEBHOOK_DEBUG_TOKEN"
```

## 🔄 **Integration in Send Operations**

When sending messages via WhatsApp API, use the helper to create immediate feedback:

```typescript
import { handleSendAcknowledgment } from '../utils/webhookHelpers';

// After successful WhatsApp API send
const response = await axios.post(whatsappApiUrl, messagePayload);
const messageId = response.data?.messages?.[0]?.id; // wamid

if (messageId) {
  // Create campaign_logs entry and emit SSE event
  await handleSendAcknowledgment(
    userId,
    messageId, 
    recipientNumber,
    campaignId, // optional
    { 
      templateName: 'order_confirmation',
      campaignName: 'Black Friday 2025'
    }
  );
}
```

## 📡 **SSE Event Formats**

### Report Update Event
```json
{
  "type": "report_update",
  "status": "delivered",
  "messageId": "wamid.HBgNOTE6...",
  "recipientNumber": "+919876543210",
  "campaignId": "uuid-here",
  "at": "2025-08-10T14:30:45.123Z",
  "meta": {
    "conversation": {"id": "conv_id"},
    "pricing": {"billable": true, "category": "utility"},
    "source": "webhook"
  }
}
```

### Template Update Event
```json
{
  "type": "template_update", 
  "name": "order_confirmation",
  "language": "en_US",
  "status": "APPROVED",
  "reason": null,
  "at": "2025-08-10T14:30:45.123Z",
  "meta": {
    "reviewedAt": "2025-08-10T14:30:00.000Z",
    "source": "webhook"
  }
}
```

## 🔐 **Security & Authentication**

- **SSE Routes**: Session-based authentication required
- **User Isolation**: Users can only access their own streams (except admins)
- **Webhook Signature**: HMAC-SHA256 validation continues to work
- **Rate Limiting**: No rate limits on SSE connections (persistent)

## 🚨 **Production Deployment**

### Environment Variables (Already configured)
```bash
META_VERIFY_TOKEN=your-webhook-verify-token
META_APP_SECRET=your-meta-app-secret  
WEBHOOK_DEBUG_TOKEN=your-debug-token
GRAPH_API_VERSION=v22.0
```

### Coolify Deployment Steps
1. **Database**: Run the SQL commands above once
2. **Deploy**: Push code to GitHub → Coolify auto-deploys
3. **Test**: Verify SSE connections work
4. **Monitor**: Watch server logs for processor events

## 📊 **Monitoring**

### Log Messages to Watch
- `✅ [PROCESSORS] Updated template status: template_name -> APPROVED`
- `✅ [PROCESSORS] Updated message status: wamid.123 -> delivered`
- `📡 [SSE] New reports connection for user uuid`
- `📡 [SSE] Sent report event to user uuid: 1 success, 0 failed`

### Health Checks
```bash
# Check SSE service health
curl https://primesms.app/api/realtime/health

# Check webhook processing
curl https://primesms.app/webhooks/meta/debug/log \
  -H "Authorization: Bearer YOUR_DEBUG_TOKEN"
```

## ✅ **Success Criteria**

- [ ] Template status changes appear in database AND SSE stream
- [ ] Message status changes appear in campaign_logs AND SSE stream  
- [ ] SSE connections authenticate properly
- [ ] Users only see their own data
- [ ] Webhook signature validation still works
- [ ] Fast webhook responses (<1s)
- [ ] No memory leaks from SSE connections

## 🎯 **Frontend Integration Example**

```typescript
class RealtimeUpdates {
  private reportsSource?: EventSource;
  private templatesSource?: EventSource;

  connect(userId: string) {
    // Reports stream
    this.reportsSource = new EventSource(`/api/realtime/reports/${userId}`);
    this.reportsSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'report_update') {
        this.updateCampaignStatus(data);
      }
    };

    // Templates stream  
    this.templatesSource = new EventSource(`/api/realtime/templates/${userId}`);
    this.templatesSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'template_update') {
        this.updateTemplateStatus(data);
      }
    };
  }

  disconnect() {
    this.reportsSource?.close();
    this.templatesSource?.close();
  }
}
```

Ready for real-time WhatsApp Business API updates! 🚀