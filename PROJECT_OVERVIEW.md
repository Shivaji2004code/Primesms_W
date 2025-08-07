# PrimeSMS - WhatsApp Business API Platform

**PrimeSMS** is a comprehensive SaaS platform that provides a developer-friendly and transparent WhatsApp Business API messaging solution for SMBs, startups, and enterprises.

## 🚀 Features

### Core Platform Features
- **Modern Landing Page** with hero section and pricing display
- **Role-Based Authentication** (Admin/User) with session management
- **Credit-Based Pricing System** with transparent pay-per-use model
- **WhatsApp Business API Integration** with Meta Cloud API
- **Template Management System** with approval workflow
- **Campaign Management** for bulk messaging
- **Real-time Analytics** and reporting dashboard

### Admin Features
- **User Management**: Complete CRUD operations for user accounts
- **Business Configuration**: WhatsApp API credential management  
- **System Monitoring**: Platform-wide analytics and statistics
- **Credit Management**: Add/deduct credits with audit trails
- **Template Approval**: Review and approve user templates

### User Features
- **Quick Send Campaign**: Single template to multiple recipients
- **Customize Campaign**: Excel/CSV upload with dynamic variable mapping
- **Manage Templates**: Create, edit, and manage WhatsApp templates
- **Manage Reports**: View campaign performance and delivery statistics
- **API Management**: Access to programmatic messaging API
- **Credit Monitoring**: Real-time credit balance tracking

## 🏗️ Technical Architecture

### Frontend
- **React 18** with Vite and TypeScript
- **Tailwind CSS** with shadcn/ui components
- **Responsive Design** optimized for mobile and desktop
- **Protected Routes** with role-based access control
- **Session Management** with automatic timeout

### Backend
- **Node.js** with Express.js and TypeScript
- **RESTful API** design with comprehensive error handling
- **PostgreSQL** database with UUID primary keys
- **Session-Based Authentication** with secure cookie handling
- **Rate Limiting** and security middleware
- **Duplicate Detection** system for messaging

### Database
- **PostgreSQL** (Port 5432) with 7 core tables:
  - `users` - User accounts and authentication
  - `user_business_info` - WhatsApp Business API configuration
  - `templates` - Message templates with JSONB components
  - `campaign_logs` - Bulk messaging campaigns
  - `message_logs` - Individual message tracking
  - `admin_actions` - Admin activity audit trail
  - `credit_transactions` - Credit usage and transactions

## 🔧 Installation & Setup

### Prerequisites
- Node.js v18+
- PostgreSQL 13+
- Meta Business API Account
- WhatsApp Business Account

### Environment Configuration

**Server Environment (.env):**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=PrimeSMS_W
DB_USER=your_db_username
DB_PASSWORD=your_db_password

# Server Configuration
PORT=5050
NODE_ENV=production
SESSION_SECRET=your_secure_random_string

# WhatsApp API Configuration
META_API_URL=https://graph.facebook.com/v18.0
```

**Client Environment (.env):**
```env
VITE_API_URL=http://localhost:5050
VITE_APP_NAME=Primes SMS
```

### Database Setup
```bash
# Create database
psql -h localhost -p 5432 -c 'CREATE DATABASE "PrimeSMS_W";'

# Run schema
psql -h localhost -p 5432 -d PrimeSMS_W -f database-schema.sql
```

### Installation
```bash
# Backend setup
cd server
npm install
npm run build
npm start

# Frontend setup  
cd client
npm install
npm run build
```

### Production Deployment (Coolify)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`  
- **Health Check**: `GET /health`
- **Port**: Uses `process.env.PORT`
- **Database**: Ensure PostgreSQL connection via environment variables

## 📊 Database Schema Overview

### Core Tables Structure

#### users
- **Purpose**: User accounts and authentication
- **Key Fields**: id (UUID), username, email, password, role, credit_balance
- **Features**: Role-based access (admin/user), credit balance tracking

#### user_business_info  
- **Purpose**: WhatsApp Business API configuration
- **Key Fields**: user_id, whatsapp_number_id, waba_id, access_token
- **Features**: One-to-one with users, webhook configuration

#### templates
- **Purpose**: WhatsApp message templates
- **Key Fields**: id, user_id, name, category, status, components (JSONB)
- **Features**: Template lifecycle management, approval workflow

#### campaign_logs
- **Purpose**: Bulk messaging campaigns
- **Key Fields**: id, user_id, campaign_name, total_recipients, status
- **Features**: Campaign metrics, success/failure tracking

#### message_logs
- **Purpose**: Individual message tracking
- **Key Fields**: campaign_id, recipient_number, message_id, status
- **Features**: Delivery confirmations, read receipts

#### admin_actions
- **Purpose**: Admin activity audit trail
- **Key Fields**: admin_user_id, action_type, target_type, details (JSONB)
- **Features**: Complete admin action logging

#### credit_transactions
- **Purpose**: Credit system transactions
- **Key Fields**: user_id, amount, transaction_type, template_category
- **Features**: Detailed credit usage tracking, pricing by template category

## 🔒 Security Features

- **Input Sanitization**: All user inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries throughout
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Session Security**: Secure cookie handling with httpOnly flags
- **Access Token Encryption**: WhatsApp API tokens securely stored
- **Role-Based Access Control**: Admin/user permissions enforced
- **Error Handling**: No sensitive information in error responses

## 💳 Credit System

### Pricing Model
- **MARKETING Templates**: 0.80 credits per message
- **UTILITY Templates**: 0.15 credits per message  
- **AUTHENTICATION Templates**: 0.15 credits per message

### Transaction Types
- `DEDUCTION_QUICKSEND`: Quick send campaign deductions
- `DEDUCTION_CUSTOMISE_SMS`: Customized campaign deductions
- `DEDUCTION_API_DELIVERED`: API message delivery deductions
- `ADMIN_ADD`: Admin credit additions
- `ADMIN_DEDUCT`: Admin credit deductions
- `REFUND`: Credit refunds for failed messages

## 🚦 Demo Credentials

**Admin Account:**
- Username: `primesms`
- Password: `Primesms`
- Credit Balance: 10,000

**Test User:**
- Username: `testuser`  
- Password: `test123`
- Credit Balance: 1,000

## 📈 Monitoring & Analytics

- **Health Check**: `/health` endpoint for uptime monitoring
- **Campaign Analytics**: Success rates, delivery metrics
- **Credit Usage**: Detailed transaction history
- **Template Performance**: Usage statistics by template
- **Admin Dashboard**: System-wide metrics and user activity

## 🛠️ Development

### Local Development
```bash
# Start backend in development mode
cd server && npm run dev

# Start frontend in development mode  
cd client && npm run dev
```

### Production Build
```bash
# Backend
cd server && npm run build && npm start

# Frontend
cd client && npm run build
```

## 📞 Support

For technical support or feature requests, please contact the development team or refer to the API documentation for integration details.