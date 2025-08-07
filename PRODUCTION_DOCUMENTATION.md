# 🚀 Prime SMS - Production Documentation

## 📋 **Overview**
Prime SMS is a complete WhatsApp Business API SaaS platform that enables users to send bulk WhatsApp messages using templates, manage campaigns, and track message delivery.

---

## 🛠 **Technology Stack**
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript  
- **Database**: PostgreSQL (Port 5431)
- **Authentication**: Session-based with Express sessions
- **WhatsApp Integration**: Meta WhatsApp Business Cloud API

---

## 🚀 **Quick Setup**

### **Prerequisites**
- Node.js v18+
- PostgreSQL running on port 5431
- Meta WhatsApp Business API access

### **Installation**
```bash
# Backend
cd server && npm install

# Frontend  
cd client && npm install
```

### **Database Setup**
```sql
-- Create database
CREATE DATABASE "PrimeSMS_W";

-- Run schema
psql -h localhost -p 5431 -d PrimeSMS_W -f database_schema.sql
psql -h localhost -p 5431 -d PrimeSMS_W -f production_tables.sql
```

### **Environment Configuration**
**Server (.env):**
```env
DB_HOST=localhost
DB_PORT=5431
DB_NAME=PrimeSMS_W
DB_USER=your_db_user
DB_PASSWORD=your_db_password
PORT=5050
SESSION_SECRET=your_secure_session_secret
META_API_URL=https://graph.facebook.com/v21.0
```

**Client (.env):**
```env
VITE_API_URL=http://localhost:5050
VITE_APP_NAME=Prime SMS
```

### **Start Application**
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend  
cd client && npm run dev
```

---

## 🔐 **Authentication System**

### **Default Accounts**
- **Admin**: `primesms` / `Primesms`
- **Test User**: `testuser` / `test123`

### **User Roles**
- **Admin**: Full system access, user management
- **User**: Send campaigns, manage templates, view reports

---

## 📊 **Core Features**

### **✅ Currently Implemented**
1. **User Authentication** - Login/Signup with role-based access
2. **Template Management** - Create, edit, delete WhatsApp templates
3. **Bulk Messaging** - Send messages to multiple recipients
4. **Campaign Tracking** - Track message delivery status
5. **Credit System** - Credit-based billing for messages
6. **Admin Panel** - User management, system stats
7. **Report Generation** - Campaign analytics and message logs

### **📝 Template Categories**
- **UTILITY** - Transactional messages (receipts, confirmments)
- **MARKETING** - Promotional campaigns (offers, announcements)
- **AUTHENTICATION** - OTP and verification codes

### **📈 Campaign Features**
- **Quick Send** - Immediate message sending
- **Bulk Import** - Excel/CSV file upload
- **Variable Mapping** - Dynamic content insertion
- **Duplicate Detection** - Prevent duplicate messages
- **Real-time Status** - Live delivery tracking

---

## 🗄 **Database Schema**

### **Core Tables**
- `users` - User accounts and authentication
- `user_business_info` - WhatsApp Business API credentials
- `templates` - WhatsApp message templates
- `campaign_logs` - Bulk campaign tracking
- `message_logs` - Individual message delivery
- `credit_transactions` - Credit usage history
- `admin_actions` - Admin activity audit

### **Key Relationships**
```
users (1) → (1) user_business_info
users (1) → (*) templates
users (1) → (*) campaign_logs  
campaign_logs (1) → (*) message_logs
users (1) → (*) credit_transactions
```

---

## 🔧 **API Endpoints**

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### **Templates**
- `GET /api/templates` - List user templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/submit` - Submit to WhatsApp

### **Campaigns & Messaging**
- `POST /api/whatsapp/send` - Send bulk messages
- `POST /api/whatsapp/quick-send` - Quick single/bulk send
- `GET /api/whatsapp/reports` - Campaign reports
- `GET /api/whatsapp/reports/detailed/:campaignId` - Detailed report

### **Credits**
- `GET /api/credits/history` - Credit transaction history
- `POST /api/credits/add` - Add credits (admin)
- `POST /api/credits/deduct` - Deduct credits (admin)

---

## 💳 **Credit System**

### **Pricing Structure**
- **AUTHENTICATION** templates: $0.15 per message
- **UTILITY** templates: $0.15 per message  
- **MARKETING** templates: $0.25 per message
- **Template creation**: $1.00 per template

### **Credit Management**
- New users receive 1000 free credits
- Credits are deducted before sending messages
- Insufficient credits prevent message sending
- Full transaction history available

---

## 📱 **WhatsApp Integration**

### **Template Management**
- Create templates via Meta Business API
- Support for TEXT, IMAGE, VIDEO headers
- Variable substitution with examples
- Automatic status updates (PENDING → APPROVED)

### **Message Delivery**
- Real-time API integration with Meta
- Delivery status tracking
- Error handling and retry logic
- Duplicate prevention

### **Media Support**
- Image uploads for template headers
- Dynamic media handling
- File size and type validation

---

## 🔒 **Security Features**

- Session-based authentication
- CORS protection
- Input validation and sanitization  
- SQL injection prevention
- Rate limiting on API endpoints
- Secure file upload handling

---

## 📈 **Monitoring & Logging**

### **System Logs**
- Campaign execution logs
- Message delivery tracking
- Error and exception logging
- Admin action auditing

### **Analytics**
- Campaign success rates
- Message delivery statistics
- Credit usage patterns
- User activity metrics

---

## 🚀 **Production Deployment**

### **Server Requirements**
- Node.js v18+ runtime
- PostgreSQL 12+ database
- SSL certificates for HTTPS
- Minimum 2GB RAM

### **Environment Setup**
1. Set production environment variables
2. Configure database with proper credentials
3. Set up WhatsApp Business API webhook
4. Configure session secrets and security

### **Performance Optimization**
- Database indexing for queries
- Connection pooling
- Caching for template data
- Log rotation and cleanup

---

## 🐛 **Troubleshooting**

### **Common Issues**
1. **Database Connection**: Check PostgreSQL status and credentials
2. **WhatsApp API Errors**: Verify access tokens and webhook setup
3. **Template Approval**: Check template status via Meta Business Manager
4. **Credit Issues**: Ensure sufficient credits before campaigns

### **Debug Tools**
- Server logs in `server/server.log`
- Browser developer console for frontend issues
- Database query logs for performance issues
- WhatsApp webhook logs for API debugging

---

## 📞 **Support**

For production issues:
1. Check server logs for errors
2. Verify database connectivity
3. Confirm WhatsApp API credentials
4. Monitor system resources

---

## ✅ **Production Checklist**

- [ ] Database properly configured with indexes
- [ ] Environment variables set securely
- [ ] WhatsApp Business API verified and working
- [ ] SSL certificates installed
- [ ] Backup strategy implemented
- [ ] Monitoring and alerts configured
- [ ] Log rotation setup
- [ ] Security scanning completed

---

**Last Updated**: January 2025  
**Version**: Production Ready v1.0