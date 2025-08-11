# Template Status Fix Guide 🔧

## 🚨 Issue Identified
Template "terty" shows as "Pending" in the UI but Meta shows it as "Approved". This indicates a webhook processing issue or database sync problem.

## 🔍 Root Cause Analysis

The issue can be caused by:

1. **Webhook Not Received** - Meta didn't send the status update webhook
2. **Webhook Processing Failed** - Our system received but couldn't process the webhook
3. **Template Name Mismatch** - Webhook template name doesn't match database entry
4. **User Mapping Issue** - phone_number_id not correctly mapped to user
5. **Database Update Failed** - Webhook processed but database wasn't updated

## 🛠️ Solutions Implemented

### 1. Enhanced Logging
Added comprehensive logging to `templateProcessor.ts`:
```
📋 [TEMPLATE_PROCESSOR] ===== WEBHOOK RECEIVED =====
📋 [TEMPLATE_PROCESSOR] ===== PROCESSING TEMPLATE =====
```

### 2. Debug Endpoints
Created `/api/debug/templates/:userId/:templateName`:
- Compares database vs Meta status
- Shows user mapping details
- Identifies sync issues

### 3. Force Sync Capability
Created `/api/debug/templates/:userId/:templateName/force-sync`:
- Forces update from Meta Graph API
- Bypasses webhook dependency
- Immediate status correction

### 4. Manual Sync UI Component
Created `TemplateSyncButton.tsx`:
- One-click template sync
- Visual feedback
- Integration with existing UI

### 5. Enhanced Repository Logic
Improved `templatesRepo.ts`:
- Better error handling
- Fallback category assignment
- Robust upsert logic

## 🚀 Immediate Fix Steps

### Step 1: Enable Debug Routes (Production)
Set environment variable:
```bash
ENABLE_DEBUG_ROUTES=true
```

### Step 2: Use Debug API to Check Status
```bash
# Replace USER_ID with actual user ID from database
curl "https://primesms.app/api/debug/templates/USER_ID/terty?language=en_US"
```

### Step 3: Force Sync If Needed
```bash
curl -X POST "https://primesms.app/api/debug/templates/USER_ID/terty/force-sync" \
  -H "Content-Type: application/json" \
  -d '{"language": "en_US"}'
```

### Step 4: Use Regular Sync Endpoint
```bash
curl -X POST "https://primesms.app/api/templates/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID", 
    "name": "terty",
    "language": "en_US"
  }'
```

## 🔧 Frontend Integration

### Add Sync Button to Template Row
```tsx
import { TemplateSyncButton } from '@/components/TemplateSyncButton';

// In your template row component:
<TemplateSyncButton
  userId={user.id}
  templateName="terty"
  language="en_US"
  onSyncComplete={() => {
    // Refresh templates list
    refetchTemplates();
  }}
/>
```

### Add to Templates Page Header
```tsx
// Sync all templates button
<TemplateSyncButton
  userId={user.id}
  onSyncComplete={() => refetchTemplates()}
/>
```

## 📊 Monitor Fix Success

### 1. Check Server Logs
Look for these patterns after deploying:
```
📋 [TEMPLATE_PROCESSOR] ===== WEBHOOK RECEIVED =====
✅ [TEMPLATES_REPO] Updated template: terty (en_US) -> APPROVED
📡 [SSE] Sent template event to user
```

### 2. Verify Database
Query to check template status:
```sql
SELECT name, language, status, category, updated_at 
FROM templates 
WHERE user_id = 'USER_ID' AND name = 'terty';
```

### 3. Test SSE Updates
Open browser console on Templates page and look for:
```
📋 [TEMPLATE_SSE] Received event: {type: "template_update", name: "terty", status: "APPROVED"}
```

## 🔄 Webhook Troubleshooting

### 1. Check Webhook Subscriptions
Ensure Meta webhook includes:
- `message_template_status_update` field
- Correct webhook URL
- Valid verify token

### 2. Test Webhook Reception
Use webhook debug log endpoint:
```bash
curl "https://primesms.app/webhooks/meta/debug/log" \
  -H "Authorization: Bearer YOUR_DEBUG_TOKEN"
```

### 3. Manual Webhook Test
Send test webhook:
```bash
curl -X POST "https://primesms.app/webhooks/meta" \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=CALCULATED_SIGNATURE" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WABA_ID",
      "changes": [{
        "field": "message_template_status_update",
        "value": {
          "metadata": {"phone_number_id": "PNI_123"},
          "message_template": {
            "name": "terty",
            "language": {"code": "en_US"},
            "category": "UTILITY"
          },
          "event": "APPROVED",
          "last_updated_time": "1702934400"
        }
      }]
    }]
  }'
```

## 🎯 Expected Outcome

After implementing these fixes:

1. **Real-time Updates** - Template status changes from Meta webhooks will immediately update the UI
2. **Manual Sync** - Users can force sync any template that appears out of sync
3. **Debug Capability** - Administrators can diagnose status sync issues quickly
4. **Enhanced Logging** - Server logs provide detailed webhook processing information

## 📋 Deployment Checklist

- ✅ Enhanced logging in templateProcessor.ts
- ✅ Debug endpoints created
- ✅ Manual sync endpoints created
- ✅ Frontend sync component created
- ✅ TypeScript compilation successful
- ✅ Server build successful
- ✅ Ready for production deployment

## 🚨 Emergency Fix

If the issue persists after deployment, use this quick database fix:

```sql
UPDATE templates 
SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP 
WHERE user_id = 'USER_ID' AND name = 'terty' AND status = 'PENDING';
```

Then trigger a frontend refresh or SSE event manually.

---

## 🎉 Status: READY FOR DEPLOYMENT

All fixes are implemented and ready for immediate deployment to resolve the template status sync issue.