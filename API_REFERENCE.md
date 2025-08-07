# 📡 Prime SMS - Complete API Reference

## 🔐 **Authentication Required**
All API endpoints require authentication via session cookies except where noted.

---

## 🔑 **Authentication Endpoints**

### **POST /api/auth/login**
User login with username/password.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string", 
    "username": "string",
    "role": "user|admin",
    "credit_balance": 1000
  }
}
```

### **POST /api/auth/signup**
Register new user account.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "username": "string",
  "password": "string",
  "phoneNumber": "string"
}
```

### **GET /api/auth/me**
Get current authenticated user info.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "string",
    "username": "string",
    "role": "user|admin",
    "credit_balance": 1000
  }
}
```

### **POST /api/auth/logout**
Logout current user and destroy session.

---

## 📝 **Template Management**

### **GET /api/templates**
Get user's WhatsApp templates with pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by status
- `category` (string): Filter by category

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "template_name",
      "category": "UTILITY|MARKETING|AUTHENTICATION",
      "language": "en_US",
      "status": "DRAFT|PENDING|APPROVED|REJECTED",
      "components": [...],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalTemplates": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **POST /api/templates**
Create new WhatsApp template.

**Request Body (multipart/form-data):**
```json
{
  "name": "template_name",
  "category": "UTILITY|MARKETING|AUTHENTICATION", 
  "language": "en_US",
  "headerText": "Header text (optional)",
  "bodyText": "Body text with {{1}} variables",
  "footerText": "Footer text (optional)",
  "buttons": "[{\"type\": \"URL\", \"text\": \"Click\", \"url\": \"https://...\"}]",
  "variableExamples": "{\"1\": \"Sample Value\"}",
  "submit_to_whatsapp": true,
  "headerMedia": "file upload (optional)"
}
```

### **POST /api/templates/authentication**
Create authentication (OTP) template with 2025 format.

**Request Body:**
```json
{
  "name": "template_name",
  "language": "en_US",
  "otp_type": "COPY_CODE|ONE_TAP",
  "otp_button_text": "Copy Code",
  "code_expiration_minutes": 5,
  "add_security_recommendation": true
}
```

### **PUT /api/templates/:id**
Update existing template.

### **DELETE /api/templates/:id**
Delete template.

### **POST /api/templates/:id/submit**
Submit draft template to WhatsApp for approval.

---

## 📱 **WhatsApp Messaging**

### **POST /api/whatsapp/send**
Send bulk WhatsApp messages using templates.

**Request Body:**
```json
{
  "templateName": "string",
  "language": "en_US",
  "phoneNumberId": "string",
  "recipients": [
    {
      "number": "+1234567890",
      "variables": {
        "1": "John Doe",
        "2": "12345"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "campaignId": "uuid",
  "results": {
    "successful": 5,
    "failed": 0,
    "total": 5
  },
  "details": [
    {
      "recipient": "+1234567890",
      "status": "sent",
      "messageId": "wamid.xxx"
    }
  ]
}
```

### **POST /api/whatsapp/quick-send**
Quick send with Excel file upload.

**Request Body (multipart/form-data):**
```json
{
  "templateName": "string",
  "language": "en_US", 
  "phoneNumberId": "string",
  "file": "excel file upload",
  "variableMapping": "{\"column1\": \"1\", \"column2\": \"2\"}"
}
```

### **POST /api/whatsapp/customize-send**
Advanced send with custom message composition.

---

## 📊 **Reports & Analytics**

### **GET /api/whatsapp/reports**
Get campaign reports with pagination.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page  
- `startDate` (string): Filter from date
- `endDate` (string): Filter to date
- `status` (string): Campaign status filter
- `templateUsed` (string): Template name filter

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "campaignName": "string",
      "templateUsed": "string",
      "totalRecipients": 100,
      "successfulSends": 95,
      "failedSends": 5,
      "status": "completed",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### **GET /api/whatsapp/reports/detailed/:campaignId**
Get detailed report for specific campaign.

**Response:**
```json
{
  "campaign": {
    "id": "uuid",
    "name": "Campaign Name",
    "template": "template_name",
    "status": "completed",
    "stats": {
      "total": 100,
      "sent": 95,
      "delivered": 90,
      "read": 75,
      "failed": 5
    }
  },
  "messages": [
    {
      "recipient": "+1234567890",
      "status": "delivered",
      "messageId": "wamid.xxx",
      "sentAt": "2025-01-01T00:00:00Z",
      "deliveredAt": "2025-01-01T00:01:00Z",
      "errorMessage": null
    }
  ]
}
```

---

## 💳 **Credit Management**

### **GET /api/credits/history**
Get user's credit transaction history.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "amount": -0.15,
      "transaction_type": "DEDUCTION_QUICKSEND",
      "description": "Quick send campaign",
      "templateName": "template_name",
      "templateCategory": "AUTHENTICATION", 
      "campaignId": "uuid",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "total": 100
  }
}
```

### **POST /api/credits/add** (Admin Only)
Add credits to user account.

**Request Body:**
```json
{
  "userId": "uuid",
  "amount": 1000,
  "description": "Credit purchase"
}
```

### **POST /api/credits/deduct** (Admin Only)
Deduct credits from user account.

---

## 👨‍💼 **Admin Endpoints**

### **GET /api/admin/users**
Get all users with pagination (admin only).

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "username": "string", 
      "role": "user|admin",
      "credit_balance": 1000,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### **POST /api/admin/users**
Create new user (admin only).

### **PUT /api/admin/users/:id**
Update user details (admin only).

### **DELETE /api/admin/users/:id**
Delete user account (admin only).

---

## 🛠 **Utility Endpoints**

### **GET /api/health**
Health check endpoint (no auth required).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "database": "connected"
}
```

### **POST /api/templates/upload-media**
Upload media for template headers.

**Request Body (multipart/form-data):**
```json
{
  "media": "file upload"
}
```

**Response:**
```json
{
  "mediaId": "media_id_from_whatsapp",
  "message": "Media uploaded successfully"
}
```

---

## ⚠️ **Error Responses**

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional details (optional)",
  "code": "ERROR_CODE (optional)"
}
```

### **Common HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)  
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🔒 **Rate Limits**

- **Authentication**: 5 requests per minute
- **Template Creation**: 10 requests per hour  
- **Message Sending**: 100 messages per minute
- **General API**: 1000 requests per hour

---

## 📝 **Request/Response Examples**

### **Send Quick Message**
```bash
curl -X POST http://localhost:5050/api/whatsapp/quick-send \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "hello_world",
    "language": "en_US",
    "phoneNumberId": "123456789012345", 
    "recipients": [
      {
        "number": "+1234567890",
        "variables": {"1": "John"}
      }
    ]
  }'
```

### **Create Template**
```bash
curl -X POST http://localhost:5050/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "welcome_message",
    "category": "UTILITY",
    "bodyText": "Welcome {{1}} to our platform!",
    "variableExamples": {"1": "John Doe"},
    "submit_to_whatsapp": true
  }'
```

---

**Last Updated**: January 2025  
**API Version**: v1.0