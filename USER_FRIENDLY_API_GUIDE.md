# 📱 WhatsApp API Integration Guide - Simple & Easy

## 🎯 What Can You Do?

Send **WhatsApp messages automatically** from your website, app, or system to your customers using our simple API. No technical complexity - just copy, paste, and customize!

## 🚀 Quick Start (Takes 2 Minutes!)

### Step 1: Find Your Information
- **Your Username**: Found in your Prime SMS dashboard (e.g., `john_business`)
- **Template Name**: Choose any active template from your dashboard (e.g., `welcome_message`)

### Step 2: Test It Now!
Try this example by replacing the values:

```bash
# Copy this command and replace the values
curl -X POST "https://api.primesms.com/api/send" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "YOUR_USERNAME_HERE",
    "templatename": "YOUR_TEMPLATE_NAME",
    "recipient_number": "919398424289",
    "var1": "Customer Name"
  }'
```

**Replace these:**
- `YOUR_USERNAME_HERE` → Your actual username
- `YOUR_TEMPLATE_NAME` → Your template name
- `919398424289` → Customer's WhatsApp number
- `Customer Name` → Any custom text for your template

## 🎨 Template Types Explained

### 📝 Simple Text Messages
Perfect for: Welcome messages, confirmations, reminders

**Example Template**: "Hello {{1}}, welcome to our store!"

**Send it like this**:
```json
{
  "username": "your_username",
  "templatename": "welcome_message",
  "recipient_number": "919398424289",
  "var1": "John Smith"
}
```

**Customer receives**: "Hello John Smith, welcome to our store!"

### 🏷️ Messages with Headers
Perfect for: Order updates, promotions, important notices

**Example Template**: 
- **Header**: "Order Update"
- **Body**: "Hi {{1}}, your order #{{2}} is ready!"

**Send it like this**:
```json
{
  "username": "your_username",
  "templatename": "order_update",
  "recipient_number": "919398424289",
  "header_text": "Great News!",
  "var1": "Sarah",
  "var2": "12345"
}
```

**Customer receives**:
- **Header**: "Great News!"
- **Body**: "Hi Sarah, your order #12345 is ready!"

### 🖼️ Messages with Images
Perfect for: Receipts, catalogs, visual updates

**Example Template**:
- **Image**: Your uploaded image
- **Body**: "Hi {{1}}, your order total is ${{2}}"

**Send it like this**:
```json
{
  "username": "your_username",
  "templatename": "receipt_message",
  "recipient_number": "919398424289",
  "var1": "Mike",
  "var2": "99.99"
}
```

**Customer receives**: Image + "Hi Mike, your order total is $99.99"

### 🔘 Messages with Buttons
Perfect for: Confirmations, quick actions, links

**Example Template**:
- **Body**: "Hi {{1}}, please confirm your appointment"
- **Button**: "Confirm" (Quick Reply)

**Send it like this**:
```json
{
  "username": "your_username",
  "templatename": "appointment_confirm",
  "recipient_number": "919398424289",
  "var1": "Lisa",
  "button_payload": "CONFIRM_APPOINTMENT"
}
```

**Customer receives**: Message + "Confirm" button that sends back "CONFIRM_APPOINTMENT"

## 🔧 Copy-Paste Code Examples

### 🌐 For Website Integration (JavaScript)

```html
<!-- Add this to your website -->
<script>
async function sendWelcomeMessage(customerName, phoneNumber) {
  try {
    const response = await fetch('https://api.primesms.com/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'YOUR_USERNAME_HERE',           // ← Change this
        templatename: 'welcome_message',          // ← Change this
        recipient_number: phoneNumber,
        var1: customerName
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Message sent! ID:', result.message_id);
      alert('Welcome message sent to customer!');
    } else {
      console.error('Failed:', result.message);
      alert('Oops! Message failed to send.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Connection error. Please try again.');
  }
}

// Use it like this:
sendWelcomeMessage('John Doe', '919398424289');
</script>
```

### 🐍 For Python Applications

```python
# Save this as send_message.py
import requests
import json

def send_whatsapp_message(template_name, phone_number, variables=None):
    """
    Send a WhatsApp message using Prime SMS API
    
    template_name: Name of your template (e.g., 'welcome_message')
    phone_number: Customer's WhatsApp number (e.g., '919398424289')
    variables: List of values for template variables (e.g., ['John', '12345'])
    """
    
    # Your settings - CHANGE THESE
    username = 'YOUR_USERNAME_HERE'                # ← Change this
    api_url = 'https://api.primesms.com/api/send'
    
    # Prepare the message data
    data = {
        'username': username,
        'templatename': template_name,
        'recipient_number': phone_number
    }
    
    # Add variables if provided
    if variables:
        for i, value in enumerate(variables, 1):
            data[f'var{i}'] = value
    
    try:
        # Send the message
        response = requests.post(api_url, json=data, timeout=30)
        result = response.json()
        
        if response.status_code == 200:
            print(f"✅ Message sent successfully!")
            print(f"Message ID: {result['message_id']}")
            print(f"Sent to: {result['recipient']}")
            return result
        else:
            print(f"❌ Failed to send message: {result['message']}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"🚨 Connection error: {e}")
        return None

# Examples of how to use it:

# Simple welcome message
send_whatsapp_message('welcome_message', '919398424289', ['John Doe'])

# Order confirmation with multiple variables
send_whatsapp_message('order_confirmation', '919398424289', ['Jane', '12345', '$99.99'])

# Appointment reminder
send_whatsapp_message('appointment_reminder', '919398424289', ['Dr. Smith', 'Tomorrow 2 PM'])
```

### 🔥 For Node.js/Express Applications

```javascript
// Save this as whatsapp-service.js
const axios = require('axios');

class WhatsAppService {
  constructor(username) {
    this.username = username;           // ← Set your username here
    this.apiUrl = 'https://api.primesms.com/api/send';
  }

  async sendMessage(templateName, phoneNumber, variables = {}) {
    try {
      const payload = {
        username: this.username,
        templatename: templateName,
        recipient_number: phoneNumber,
        ...variables
      };

      console.log('📤 Sending WhatsApp message...');
      
      const response = await axios.post(this.apiUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      if (response.status === 200) {
        console.log('✅ Message sent successfully!');
        console.log('Message ID:', response.data.message_id);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Helper methods for common use cases
  async sendWelcome(customerName, phoneNumber) {
    return this.sendMessage('welcome_message', phoneNumber, {
      var1: customerName
    });
  }

  async sendOrderConfirmation(customerName, orderId, amount, phoneNumber) {
    return this.sendMessage('order_confirmation', phoneNumber, {
      var1: customerName,
      var2: orderId,
      var3: amount
    });
  }

  async sendAppointmentReminder(customerName, appointmentTime, phoneNumber) {
    return this.sendMessage('appointment_reminder', phoneNumber, {
      var1: customerName,
      var2: appointmentTime
    });
  }
}

// How to use it:
const whatsapp = new WhatsAppService('YOUR_USERNAME_HERE');  // ← Change this

// Send welcome message
whatsapp.sendWelcome('John Doe', '919398424289');

// Send order confirmation
whatsapp.sendOrderConfirmation('Jane Smith', '12345', '$99.99', '919398424289');

module.exports = WhatsAppService;
```

### 📱 For PHP Applications

```php
<?php
// Save this as WhatsAppSender.php

class WhatsAppSender {
    private $username;
    private $apiUrl;

    public function __construct($username) {
        $this->username = $username;                              // ← Set your username
        $this->apiUrl = 'https://api.primesms.com/api/send';
    }

    public function sendMessage($templateName, $phoneNumber, $variables = []) {
        $data = [
            'username' => $this->username,
            'templatename' => $templateName,
            'recipient_number' => $phoneNumber
        ];

        // Add variables
        foreach ($variables as $key => $value) {
            $data[$key] = $value;
        }

        $ch = curl_init($this->apiUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            $result = json_decode($response, true);
            echo "✅ Message sent! ID: " . $result['message_id'] . "\n";
            return $result;
        } else {
            echo "❌ Failed to send message: " . $response . "\n";
            return false;
        }
    }

    // Helper methods
    public function sendWelcome($customerName, $phoneNumber) {
        return $this->sendMessage('welcome_message', $phoneNumber, [
            'var1' => $customerName
        ]);
    }

    public function sendOrderUpdate($customerName, $orderId, $status, $phoneNumber) {
        return $this->sendMessage('order_update', $phoneNumber, [
            'var1' => $customerName,
            'var2' => $orderId,
            'var3' => $status
        ]);
    }
}

// How to use it:
$whatsapp = new WhatsAppSender('YOUR_USERNAME_HERE');        // ← Change this

// Send welcome message
$whatsapp->sendWelcome('John Doe', '919398424289');

// Send order update
$whatsapp->sendOrderUpdate('Jane Smith', '12345', 'shipped', '919398424289');
?>
```

## 📞 Phone Number Format

**✅ Correct Format (Meta WhatsApp API):**
- `919398424289` (India number - no spaces, no + prefix)
- `14155552345` (US number - no spaces, no + prefix)  
- `447123456789` (UK number - no spaces, no + prefix)

**❌ Wrong Format:**
- `+919398424289` (has + prefix - not accepted by Meta API)
- `91 9398 424289` (has spaces)
- `091-9398-424289` (has dashes and leading zero)

**🔧 Quick Fix:**
```javascript
// Clean phone number format for Meta WhatsApp API
function cleanPhoneNumber(phone) {
  // Remove all non-digits and + symbols
  phone = phone.replace(/[^\d]/g, '');
  
  // Remove leading zeros if present
  phone = phone.replace(/^0+/, '');
  
  // Ensure it starts with country code (not 0)
  if (phone.length > 0 && phone[0] === '0') {
    phone = phone.substring(1);
  }
  
  return phone;
}

// Examples:
cleanPhoneNumber('+91 9398 424289');     // Returns: 919398424289
cleanPhoneNumber('091-9398-424289');     // Returns: 919398424289
cleanPhoneNumber('+1 (415) 555-2345');   // Returns: 14155552345
```

## 🚨 Common Issues & Solutions

### ❌ "Invalid username" Error
**Problem**: Your username is wrong or your WhatsApp Business isn't set up.
**Solution**: 
1. Check your username in Prime SMS dashboard
2. Make sure your WhatsApp Business API is active
3. Contact support if still having issues

### ❌ "Template not found" Error  
**Problem**: Template name is wrong or template isn't active.
**Solution**:
1. Check template name exactly as shown in dashboard
2. Make sure template status is "ACTIVE"
3. Template names are case-sensitive!

### ❌ "Invalid phone number" Error
**Problem**: Phone number format is wrong.
**Solution**: Always use Meta WhatsApp API format without + prefix (e.g., `919398424289`)

### ❌ "Rate limit exceeded" Error
**Problem**: You sent too many messages too quickly.
**Solution**: Wait 15 minutes, then try again. Limit is 100 messages per 15 minutes.

### ❌ "Failed to send message via WhatsApp API" Error
**Problem**: WhatsApp rejected the message or template has issues.
**Solution**:
1. Check if you provided all required variables
2. Make sure template is approved by WhatsApp
3. Verify recipient has WhatsApp

## 🎯 Use Case Examples

### 🛒 E-commerce Store
```javascript
// When customer places order
async function notifyOrderPlaced(customerName, orderId, total, phone) {
  await sendMessage('order_confirmation', phone, {
    var1: customerName,
    var2: orderId,
    var3: total
  });
}

// When order ships
async function notifyOrderShipped(customerName, orderId, trackingNumber, phone) {
  await sendMessage('shipping_notification', phone, {
    var1: customerName,
    var2: orderId,
    var3: trackingNumber
  });
}
```

### 🏥 Medical Clinic
```javascript
// Appointment confirmation
async function confirmAppointment(patientName, doctorName, dateTime, phone) {
  await sendMessage('appointment_confirmation', phone, {
    var1: patientName,
    var2: doctorName,
    var3: dateTime
  });
}

// Appointment reminder (send 24 hours before)
async function remindAppointment(patientName, dateTime, phone) {
  await sendMessage('appointment_reminder', phone, {
    var1: patientName,
    var2: dateTime
  });
}
```

### 🍕 Restaurant
```javascript
// Order ready for pickup
async function notifyOrderReady(customerName, orderNumber, phone) {
  await sendMessage('order_ready', phone, {
    var1: customerName,
    var2: orderNumber
  });
}

// Delivery confirmation
async function confirmDelivery(customerName, estimatedTime, phone) {
  await sendMessage('delivery_confirmation', phone, {
    var1: customerName,
    var2: estimatedTime
  });
}
```

## 🔒 Security Best Practices

### ✅ Do This:
- Keep your username secure (don't share publicly)
- Always validate phone numbers before sending
- Log message sending for your records
- Handle errors gracefully in your code

### ❌ Don't Do This:
- Don't put your username in public code repositories
- Don't send messages to numbers without permission
- Don't send spam or marketing messages to unwilling recipients
- Don't ignore error responses

## 📈 Testing Your Integration

### 1. Test with Your Own Number
```json
{
  "username": "your_username",
  "templatename": "welcome_message",
  "recipient_number": "YOUR_WHATSAPP_NUMBER",
  "var1": "Test User"
}
```

### 2. Check Different Scenarios
- ✅ Valid message → Should receive WhatsApp message
- ❌ Wrong template name → Should get "Template not found" error
- ❌ Invalid phone → Should get "Invalid phone number" error
- ❌ Wrong username → Should get "Unauthorized" error

### 3. Monitor Response Codes
- `200` = Success! Message sent
- `400` = Bad request (check your parameters)
- `401` = Unauthorized (check your username)
- `404` = Template not found (check template name)
- `429` = Too many requests (wait 15 minutes)

## 🆘 Need Help?

### 📧 Contact Support
- Email: support@primesms.com
- Include: Your username, template name, and error message
- We typically respond within 2 hours!

### 📚 Additional Resources
- Prime SMS Dashboard: Check your templates and settings
- Template Manager: Create and edit your message templates  
- Message Logs: See all messages you've sent

### 💡 Pro Tips
1. **Start Simple**: Begin with a basic text template before trying complex ones
2. **Test First**: Always test with your own number before sending to customers
3. **Keep Templates Short**: WhatsApp works best with concise messages
4. **Use Clear Variables**: Make variable names obvious (like `customer_name` instead of `var1`)
5. **Handle Errors**: Always check the response and handle failures gracefully

---

**🎉 You're Ready to Go!**

Copy the code examples, replace `YOUR_USERNAME_HERE` with your actual username, and start sending WhatsApp messages automatically. It's that simple!

**Questions?** Contact our support team - we're here to help make your integration successful! 📞✨