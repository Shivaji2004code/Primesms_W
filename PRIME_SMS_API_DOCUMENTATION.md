# Prime SMS WhatsApp API Documentation

## 📱 Complete Guide for Developers

Welcome to Prime SMS's comprehensive WhatsApp API documentation! This guide covers everything you need to integrate WhatsApp messaging into your applications using our simple REST API.

---

## 🚀 **Quick Start Guide**

### **What You Need**
1. **Your Username**: Your Prime SMS account username
2. **Active Templates**: Approved WhatsApp message templates
3. **Recipient Numbers**: Phone numbers in international format
4. **API Endpoint**: `https://primesms.app/api/send`

### **5-Minute Integration**
```bash
# Test with curl - replace YOUR_USERNAME and YOUR_TEMPLATE
curl -X POST "https://primesms.app/api/send" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "YOUR_USERNAME",
    "templatename": "YOUR_TEMPLATE",
    "recipient_number": "919398424270"
  }'
```

---

## 🎯 **API Endpoints**

### **📤 Send Message**
- **URL**: `https://primesms.app/api/send`
- **Methods**: `POST`, `GET`
- **Rate Limit**: 100 requests per 15 minutes per IP
- **Authentication**: Username-based (no API keys required)

### **📋 Template Analysis**
- **URL**: `https://primesms.app/api/send/template-info/{username}/{templatename}`
- **Method**: `GET`
- **Purpose**: Analyze template requirements before sending

---

## 📊 **Request & Response Examples**

### **✅ Success Response**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "message_id": "wamid.HBgLMTkzOTg0MjQyNzAVAgA...",
  "recipient": "919398424270",
  "template": "welcome_message"
}
```

### **❌ Error Response**
```json
{
  "error": "Bad Request",
  "message": "Missing required parameters",
  "details": ["templatename is required"]
}
```

### **🚨 Duplicate Detection Response**
```json
{
  "success": false,
  "duplicate": true,
  "message": "Duplicate message blocked - same template and variables sent to this number within 5 minutes",
  "template": "welcome_message",
  "phone": "919398424270",
  "hash": "abc123..."
}
```

---

## 🎨 **Template Types & Examples**

### **1. 📝 TEXT Templates (Simple Messages)**

**Template Structure:**
- Body: Plain text with optional variables
- No media or buttons

**Example Template:**
```
Hello {{1}}, welcome to our service! Your account ID is {{2}}.
```

**API Request (POST):**
```json
{
  "username": "your_username",
  "templatename": "welcome_simple",
  "recipient_number": "919398424270",
  "var1": "John Doe",
  "var2": "ACC12345"
}
```

**cURL:**
```bash
curl -X POST "https://primesms.app/api/send" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "templatename": "welcome_simple", 
    "recipient_number": "919398424270",
    "var1": "John Doe",
    "var2": "ACC12345"
  }'
```

**GET Request:**
```
https://primesms.app/api/send?username=your_username&templatename=welcome_simple&recipient_number=919398424270&var1=John%20Doe&var2=ACC12345
```

---

### **2. 🖼️ IMAGE Templates (With Pictures)**

**Template Structure:**
- Header: Static image (uploaded during template creation)
- Body: Text with variables
- Optional buttons

**Example Template:**
```
Header: [Product Image]
Body: Hi {{1}}! Check out our new {{2}} - only ${{3}} today!
```

**API Request:**
```json
{
  "username": "your_username",
  "templatename": "product_showcase",
  "recipient_number": "919398424270",
  "var1": "Sarah",
  "var2": "Smartphone",
  "var3": "299.99"
}
```

**JavaScript Example:**
```javascript
async function sendImageTemplate() {
  try {
    const response = await fetch('https://primesms.app/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'your_username',
        templatename: 'product_showcase',
        recipient_number: '919398424270',
        var1: 'Sarah',
        var2: 'Smartphone', 
        var3: '299.99'
      })
    });
    
    const result = await response.json();
    console.log('Success:', result.message_id);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

### **3. 🎬 VIDEO Templates (With Videos)**

**Template Structure:**
- Header: Static video (uploaded during template creation)
- Body: Text with variables
- Optional buttons

**Example Template:**
```
Header: [Tutorial Video]
Body: Hello {{1}}, watch this {{2}}-minute tutorial to get started!
```

**Python Example:**
```python
import requests

def send_video_template():
    url = "https://primesms.app/api/send"
    
    payload = {
        "username": "your_username",
        "templatename": "tutorial_video",
        "recipient_number": "919398424270", 
        "var1": "Alex",
        "var2": "5"
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        print(f"Message sent: {result['message_id']}")
    else:
        print(f"Error: {response.text}")

send_video_template()
```

---

### **4. 📄 DOCUMENT Templates (With Files)**

**Template Structure:**
- Header: Static document/PDF (uploaded during template creation)
- Body: Text with variables
- Optional buttons

**Example Template:**
```
Header: [Invoice.pdf]
Body: Hi {{1}}, your invoice #{{2}} for ${{3}} is ready for download.
```

**PHP Example:**
```php
<?php
$data = [
    'username' => 'your_username',
    'templatename' => 'invoice_document',
    'recipient_number' => '919398424270',
    'var1' => 'Michael',
    'var2' => 'INV001',
    'var3' => '150.00'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://primesms.app/api/send');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$result = json_decode($response, true);

if ($result['success']) {
    echo "Document sent: " . $result['message_id'];
} else {
    echo "Error: " . $result['message'];
}
curl_close($ch);
?>
```

---

### **5. 🔒 AUTHENTICATION Templates (OTP/2FA)**

**Template Structure:**
- Body: Text with OTP code variable
- Button: URL with OTP parameter (auto-generated)
- **Special Note**: These use Meta's 2025 authentication format

**Example Template:**
```
Your verification code is {{1}}. Click here to verify: [Button with OTP]
```

**API Request (Critical - Use var1 for OTP):**
```json
{
  "username": "your_username",
  "templatename": "otp_verification",
  "recipient_number": "919398424270",
  "var1": "123456"
}
```

**Node.js Example:**
```javascript
const axios = require('axios');

async function sendOTP(phoneNumber, otpCode) {
  try {
    const response = await axios.post('https://primesms.app/api/send', {
      username: 'your_username',
      templatename: 'otp_verification',
      recipient_number: phoneNumber,
      var1: otpCode  // OTP always goes in var1
    });
    
    console.log(`OTP sent to ${phoneNumber}: ${otpCode}`);
    return response.data.message_id;
  } catch (error) {
    console.error('OTP send failed:', error.response?.data);
    throw error;
  }
}

// Usage
sendOTP('919398424270', '123456');
```

---

### **6. 🎯 MARKETING Templates (With Call-to-Action)**

**Template Structure:**
- Header: Text or media
- Body: Marketing message with variables
- Buttons: Call-to-action buttons (URL, Phone, Quick Reply)

**Example Template:**
```
Header: 🎉 Special Offer for {{1}}!
Body: Get {{2}}% off on all {{3}} items. Limited time offer ending {{4}}.
Buttons: [Shop Now] [Call Us] [More Info]
```

**API Request with Buttons:**
```json
{
  "username": "your_username", 
  "templatename": "marketing_offer",
  "recipient_number": "919398424270",
  "var1": "VIP Customer",
  "var2": "25",
  "var3": "electronics", 
  "var4": "Dec 31st",
  "button_url": "https://yourstore.com/sale?customer=12345"
}
```

**Advanced JavaScript with Error Handling:**
```javascript
class WhatsAppAPI {
  constructor(username) {
    this.username = username;
    this.baseURL = 'https://primesms.app/api/send';
  }
  
  async sendMarketingMessage(recipient, offer) {
    const payload = {
      username: this.username,
      templatename: 'marketing_offer',
      recipient_number: recipient,
      var1: offer.customerName,
      var2: offer.discountPercent,
      var3: offer.category,
      var4: offer.endDate,
      button_url: `https://yourstore.com/sale?id=${offer.campaignId}`
    };
    
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Marketing message sent: ${result.message_id}`);
        return { success: true, messageId: result.message_id };
      } else if (result.duplicate) {
        console.warn(`⚠️  Duplicate message blocked for ${recipient}`);
        return { success: false, reason: 'duplicate' };
      } else {
        console.error(`❌ Send failed: ${result.message}`);
        return { success: false, reason: result.message };
      }
    } catch (error) {
      console.error(`💥 API Error:`, error);
      return { success: false, reason: 'network_error' };
    }
  }
}

// Usage
const api = new WhatsAppAPI('your_username');

const offer = {
  customerName: 'Premium Member',
  discountPercent: '30',
  category: 'fashion',
  endDate: 'Jan 15th',
  campaignId: 'SALE2024'
};

api.sendMarketingMessage('919398424270', offer);
```

---

### **7. 💼 TRANSACTIONAL Templates (Order/Payment Updates)**

**Template Structure:**
- Header: Optional text or media
- Body: Transaction details with variables
- Optional buttons for actions

**Example Template:**
```
Your order #{{1}} has been {{2}}! 
Amount: ${{3}}
Expected delivery: {{4}}
Track your order: [Track Button]
```

**API Request:**
```json
{
  "username": "your_username",
  "templatename": "order_update", 
  "recipient_number": "919398424270",
  "var1": "ORD12345",
  "var2": "confirmed",
  "var3": "89.99",
  "var4": "Dec 25, 2024",
  "button_url": "https://yourstore.com/track/ORD12345"
}
```

**Bulk Transactional Messages (Python):**
```python
import requests
import time

class TransactionalMessenger:
    def __init__(self, username):
        self.username = username
        self.api_url = "https://primesms.app/api/send"
    
    def send_order_update(self, order):
        payload = {
            "username": self.username,
            "templatename": "order_update",
            "recipient_number": order["phone"],
            "var1": order["order_id"], 
            "var2": order["status"],
            "var3": str(order["amount"]),
            "var4": order["delivery_date"],
            "button_url": f"https://yourstore.com/track/{order['order_id']}"
        }
        
        try:
            response = requests.post(self.api_url, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Order update sent to {order['phone']}: {result['message_id']}")
                return True
            else:
                print(f"❌ Failed to send to {order['phone']}: {response.text}")
                return False
                
        except Exception as e:
            print(f"💥 Error sending to {order['phone']}: {str(e)}")
            return False
    
    def send_bulk_updates(self, orders):
        successful = 0
        failed = 0
        
        for order in orders:
            if self.send_order_update(order):
                successful += 1
            else:
                failed += 1
            
            # Rate limiting - wait 1 second between requests
            time.sleep(1)
        
        print(f"📊 Bulk send complete: {successful} sent, {failed} failed")
        return {"sent": successful, "failed": failed}

# Usage
messenger = TransactionalMessenger("your_username")

orders = [
    {
        "phone": "919398424270", 
        "order_id": "ORD001",
        "status": "shipped",
        "amount": 149.99,
        "delivery_date": "Dec 28, 2024"
    },
    {
        "phone": "919876543210",
        "order_id": "ORD002", 
        "status": "confirmed",
        "amount": 79.50,
        "delivery_date": "Dec 30, 2024"
    }
]

messenger.send_bulk_updates(orders)
```

---

### **8. 🎟️ UTILITY Templates (Receipts/Confirmations)**

**Template Structure:**
- Header: Optional company logo/text
- Body: Utility information with variables
- Optional buttons for support/actions

**Example Template:**
```
Receipt from {{1}}
Service: {{2}}
Amount: ${{3}}
Date: {{4}}
Reference: {{5}}
```

**Go Example:**
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type WhatsAppAPI struct {
    Username string
    BaseURL  string
}

type UtilityMessage struct {
    Company   string
    Service   string
    Amount    string
    Date      string
    Reference string
    Phone     string
}

func (api *WhatsAppAPI) SendUtilityMessage(msg UtilityMessage) error {
    payload := map[string]interface{}{
        "username":         api.Username,
        "templatename":     "utility_receipt",
        "recipient_number": msg.Phone,
        "var1":            msg.Company,
        "var2":            msg.Service,
        "var3":            msg.Amount,
        "var4":            msg.Date,
        "var5":            msg.Reference,
    }
    
    jsonData, err := json.Marshal(payload)
    if err != nil {
        return err
    }
    
    resp, err := http.Post(api.BaseURL, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == 200 {
        fmt.Printf("✅ Utility receipt sent to %s\n", msg.Phone)
        return nil
    } else {
        return fmt.Errorf("❌ Send failed with status: %d", resp.StatusCode)
    }
}

func main() {
    api := WhatsAppAPI{
        Username: "your_username",
        BaseURL:  "https://primesms.app/api/send",
    }
    
    receipt := UtilityMessage{
        Company:   "PowerCorp Inc",
        Service:   "Electricity Bill",
        Amount:    "125.50",
        Date:      "Dec 2024",
        Reference: "PWR123456",
        Phone:     "919398424270",
    }
    
    if err := api.SendUtilityMessage(receipt); err != nil {
        fmt.Printf("Error: %v\n", err)
    }
}
```

---

## 🔧 **Advanced Integration Patterns**

### **1. 🔄 Retry Logic with Exponential Backoff**

```javascript
class RobustWhatsAppAPI {
  constructor(username, maxRetries = 3) {
    this.username = username;
    this.maxRetries = maxRetries;
    this.baseURL = 'https://primesms.app/api/send';
  }
  
  async sendWithRetry(payload, retries = 0) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.username, ...payload }),
        timeout: 30000
      });
      
      const result = await response.json();
      
      if (result.success) {
        return { success: true, data: result };
      } else if (result.duplicate) {
        return { success: false, reason: 'duplicate', data: result };
      } else {
        throw new Error(result.message || 'Send failed');
      }
      
    } catch (error) {
      console.warn(`Attempt ${retries + 1} failed:`, error.message);
      
      if (retries < this.maxRetries) {
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(payload, retries + 1);
      } else {
        throw new Error(`Failed after ${this.maxRetries + 1} attempts: ${error.message}`);
      }
    }
  }
}

// Usage
const api = new RobustWhatsAppAPI('your_username');

api.sendWithRetry({
  templatename: 'welcome_simple',
  recipient_number: '919398424270',
  var1: 'John'
}).then(result => {
  console.log('Success:', result);
}).catch(error => {
  console.error('Final failure:', error);
});
```

### **2. 📊 Rate Limiting Handler**

```python
import requests
import time
from datetime import datetime, timedelta
import threading

class RateLimitedAPI:
    def __init__(self, username, requests_per_window=95, window_minutes=15):
        self.username = username
        self.api_url = "https://primesms.app/api/send"
        self.max_requests = requests_per_window
        self.window_minutes = window_minutes
        self.requests = []
        self.lock = threading.Lock()
    
    def _clean_old_requests(self):
        cutoff = datetime.now() - timedelta(minutes=self.window_minutes)
        self.requests = [req_time for req_time in self.requests if req_time > cutoff]
    
    def _wait_if_needed(self):
        with self.lock:
            self._clean_old_requests()
            
            if len(self.requests) >= self.max_requests:
                oldest_request = min(self.requests)
                wait_until = oldest_request + timedelta(minutes=self.window_minutes)
                wait_seconds = (wait_until - datetime.now()).total_seconds()
                
                if wait_seconds > 0:
                    print(f"⏳ Rate limit reached. Waiting {wait_seconds:.1f} seconds...")
                    time.sleep(wait_seconds + 1)  # Add 1 second buffer
    
    def send_message(self, template_name, recipient, variables=None):
        self._wait_if_needed()
        
        payload = {
            "username": self.username,
            "templatename": template_name,
            "recipient_number": recipient
        }
        
        if variables:
            payload.update(variables)
        
        try:
            with self.lock:
                response = requests.post(self.api_url, json=payload, timeout=30)
                self.requests.append(datetime.now())
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Message sent to {recipient}: {result['message_id']}")
                return result
            else:
                print(f"❌ Failed to send to {recipient}: {response.text}")
                return None
                
        except Exception as e:
            print(f"💥 Error: {str(e)}")
            return None

# Usage
api = RateLimitedAPI("your_username")

# Send 100 messages - will automatically respect rate limits
for i in range(100):
    api.send_message(
        "welcome_simple",
        f"9139842427{i:02d}",  # Different numbers
        {"var1": f"Customer {i}"}
    )
```

### **3. 🎯 Template-Specific Helper Classes**

```javascript
class TemplateHelpers {
  constructor(username) {
    this.username = username;
    this.baseURL = 'https://primesms.app/api/send';
  }
  
  // OTP/Authentication helper
  async sendOTP(phone, otpCode, templateName = 'otp_verification') {
    return this._send({
      templatename: templateName,
      recipient_number: phone,
      var1: otpCode.toString()
    });
  }
  
  // Order notification helper
  async sendOrderUpdate(phone, orderId, status, amount, deliveryDate) {
    return this._send({
      templatename: 'order_update',
      recipient_number: phone,
      var1: orderId,
      var2: status,
      var3: amount.toString(),
      var4: deliveryDate,
      button_url: `https://yourstore.com/track/${orderId}`
    });
  }
  
  // Marketing campaign helper
  async sendMarketingOffer(phone, customerName, discount, category, endDate, campaignId) {
    return this._send({
      templatename: 'marketing_offer',
      recipient_number: phone,
      var1: customerName,
      var2: discount.toString(),
      var3: category,
      var4: endDate,
      button_url: `https://yourstore.com/sale?campaign=${campaignId}`
    });
  }
  
  // Generic send helper
  async _send(payload) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.username, ...payload })
      });
      
      const result = await response.json();
      
      if (result.success) {
        return { success: true, messageId: result.message_id, recipient: result.recipient };
      } else {
        return { success: false, error: result.message, duplicate: result.duplicate || false };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Usage
const templates = new TemplateHelpers('your_username');

// Send OTP
templates.sendOTP('919398424270', '123456');

// Send order update
templates.sendOrderUpdate('919398424270', 'ORD001', 'shipped', 99.99, 'Dec 25');

// Send marketing offer
templates.sendMarketingOffer('919398424270', 'VIP Customer', 25, 'electronics', 'Dec 31', 'HOLIDAY2024');
```

---

## 📈 **Monitoring & Analytics**

### **Message Status Tracking**
All API messages are automatically logged and can be tracked in real-time:

1. **Dashboard**: View sent messages in Manage Reports
2. **Real-time Updates**: Receive webhook notifications for delivery status
3. **Status Types**: `sent`, `delivered`, `read`, `failed`

### **Webhook Integration**
Your API messages will receive real-time status updates via our webhook system, ensuring you always know the delivery status.

---

## 🛡️ **Error Handling Best Practices**

### **Common Error Codes**
- `400` - Bad Request (missing parameters, invalid format)
- `401` - Unauthorized (invalid username)
- `404` - Not Found (template doesn't exist)  
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### **Robust Error Handling Example**
```javascript
async function sendMessageSafely(payload) {
  try {
    const response = await fetch('https://primesms.app/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    switch (response.status) {
      case 200:
        if (result.success) {
          console.log(`✅ Success: ${result.message_id}`);
          return { success: true, messageId: result.message_id };
        } else if (result.duplicate) {
          console.warn(`⚠️  Duplicate blocked`);
          return { success: false, reason: 'duplicate' };
        }
        break;
        
      case 400:
        console.error(`❌ Bad Request: ${result.message}`);
        return { success: false, reason: 'invalid_parameters', details: result.details };
        
      case 401:
        console.error(`🔒 Unauthorized: Check your username`);
        return { success: false, reason: 'unauthorized' };
        
      case 404:
        console.error(`📭 Template not found: ${payload.templatename}`);
        return { success: false, reason: 'template_not_found' };
        
      case 429:
        console.error(`⏰ Rate limit exceeded - try again later`);
        return { success: false, reason: 'rate_limited', retryAfter: 900 }; // 15 minutes
        
      default:
        console.error(`💥 Unexpected error: ${response.status}`);
        return { success: false, reason: 'unknown_error', status: response.status };
    }
  } catch (error) {
    console.error(`🌐 Network error: ${error.message}`);
    return { success: false, reason: 'network_error', error: error.message };
  }
}
```

---

## 🔍 **Testing & Debugging**

### **Template Analysis**
Before sending messages, analyze your template requirements:

```bash
curl "https://primesms.app/api/send/template-info/your_username/your_template"
```

**Response Example:**
```json
{
  "success": true,
  "template": {
    "name": "welcome_simple",
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
        "example": "John Doe"
      }
    ],
    "variable_count": 1,
    "has_header": false,
    "has_buttons": false
  }
}
```

### **Testing Workflow**
1. **Analyze Template**: Use template-info endpoint
2. **Test with Single Message**: Send to test number
3. **Check Dashboard**: Verify in Manage Reports
4. **Implement Error Handling**: Handle all response types
5. **Scale Gradually**: Start small, then increase volume

---

## 💡 **Pro Tips**

### **📱 Phone Number Formats**
```javascript
// ✅ Correct formats
"919398424270"    // India
"14155552345"     // USA  
"447911123456"    // UK
"971501234567"    // UAE

// ❌ Incorrect formats
"+919398424270"   // Don't include +
"9398424270"      // Missing country code  
"91-9398424270"   // No hyphens
"91 9398424270"   // No spaces
```

### **🔄 Variable Naming**
Always use `var1`, `var2`, `var3`, etc. in sequential order:
```javascript
// ✅ Correct
{
  "var1": "John",
  "var2": "Order123", 
  "var3": "99.99"
}

// ❌ Incorrect
{
  "name": "John",        // Use var1
  "order": "Order123",   // Use var2
  "amount": "99.99"      // Use var3
}
```

### **⚡ Performance Optimization**
- **Batch Processing**: Send multiple messages with delays
- **Connection Pooling**: Reuse HTTP connections
- **Async Processing**: Don't block your main thread
- **Error Recovery**: Implement retry logic with exponential backoff

---

## 🌟 **Complete Integration Examples**

### **E-commerce Platform Integration**
```javascript
class EcommerceWhatsApp {
  constructor(username) {
    this.api = new WhatsAppAPI(username);
  }
  
  // Welcome new customers
  async welcomeCustomer(customer) {
    return this.api.send({
      templatename: 'welcome_customer',
      recipient_number: customer.phone,
      var1: customer.name,
      var2: customer.storeCredit || '0'
    });
  }
  
  // Order confirmations
  async confirmOrder(order) {
    return this.api.send({
      templatename: 'order_confirmation',
      recipient_number: order.customer.phone,
      var1: order.customer.name,
      var2: order.id,
      var3: order.total,
      var4: order.estimatedDelivery,
      button_url: `https://yourstore.com/orders/${order.id}`
    });
  }
  
  // Shipping notifications
  async notifyShipping(shipment) {
    return this.api.send({
      templatename: 'shipping_update',
      recipient_number: shipment.customer.phone,
      var1: shipment.customer.name,
      var2: shipment.trackingNumber,
      var3: shipment.carrier,
      var4: shipment.estimatedDelivery,
      button_url: `https://track.${shipment.carrier}.com/${shipment.trackingNumber}`
    });
  }
  
  // Abandoned cart recovery
  async recoverAbandonedCart(cart) {
    return this.api.send({
      templatename: 'cart_recovery',
      recipient_number: cart.customer.phone,
      var1: cart.customer.name,
      var2: cart.items.length,
      var3: cart.total,
      var4: '24 hours', // Time-limited offer
      button_url: `https://yourstore.com/cart/recover/${cart.id}`
    });
  }
}
```

### **Banking/Finance Integration**
```python
class BankingNotifications:
    def __init__(self, username):
        self.username = username
        self.api_url = "https://primesms.app/api/send"
    
    def send_transaction_alert(self, account_number, amount, transaction_type, balance, location="Online"):
        payload = {
            "username": self.username,
            "templatename": "transaction_alert",
            "recipient_number": self._get_phone_for_account(account_number),
            "var1": transaction_type.title(),  # "Debit" or "Credit"
            "var2": f"${abs(amount):.2f}",
            "var3": f"${balance:.2f}",
            "var4": location,
            "var5": self._format_datetime()
        }
        
        return self._send_message(payload)
    
    def send_otp_for_transaction(self, account_number, otp_code, amount, merchant=""):
        payload = {
            "username": self.username, 
            "templatename": "transaction_otp",
            "recipient_number": self._get_phone_for_account(account_number),
            "var1": otp_code,
            "var2": f"${amount:.2f}",
            "var3": merchant or "Unknown Merchant"
        }
        
        return self._send_message(payload)
    
    def send_low_balance_alert(self, account_number, current_balance, minimum_balance=100):
        if current_balance <= minimum_balance:
            payload = {
                "username": self.username,
                "templatename": "low_balance_alert", 
                "recipient_number": self._get_phone_for_account(account_number),
                "var1": f"${current_balance:.2f}",
                "var2": f"${minimum_balance:.2f}"
            }
            
            return self._send_message(payload)
    
    def _send_message(self, payload):
        response = requests.post(self.api_url, json=payload)
        return response.json() if response.status_code == 200 else None
    
    def _get_phone_for_account(self, account_number):
        # Implement your database lookup here
        pass
    
    def _format_datetime(self):
        return datetime.now().strftime("%m/%d/%Y %I:%M %p")
```

---

## 🚀 **Ready to Get Started?**

1. **Sign up** at [primesms.app](https://primesms.app)
2. **Create your templates** in the dashboard
3. **Get them approved** by Meta
4. **Start sending** with our API!

### **Support & Resources**
- 📧 **Email**: support@primesms.app
- 📱 **Dashboard**: [primesms.app](https://primesms.app)
- 📚 **Templates**: Create and manage in your dashboard
- 📊 **Reports**: Track all messages in Manage Reports

---

**Happy Messaging! 🎉**

*This documentation covers all WhatsApp Business API template types supported by Prime SMS. For specific questions or custom integration support, contact our team.*