# Primes SMS SaaS - Project Context

## Project Overview
WhatsApp Business API SaaS platform with modern landing page, authentication system, and role-based dashboards (admin/user).

## Technology Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (localhost:5431, database: PrimeSMS_W)
- **Authentication**: Session-based with hardcoded admin credentials

## Project Structure
```
primes-sms/
├── client/          # React frontend
├── server/          # Node.js backend
├── context.md       # This file - project context
└── instructions.md  # Complete implementation instructions
```

## Database Configuration
- **Host**: localhost
- **Port**: 5431
- **Database**: PrimeSMS_W
- **Admin User**: username=primesms, password=Primesms

## Key Features to Implement

### 1. Landing Page
- Modern hero section with WhatsApp Business API messaging
- Features section (Developer Friendly, Transparent Pricing, Powerful Management)
- Credit-based pricing display
- Professional header/footer

### 2. Authentication System
- Signup: name, email, username, password, phone validation
- Login: username/password with role-based redirect
- Session management with Express sessions

### 3. Admin Dashboard (/admin/dashboard)
- Users management table with CRUD operations
- View/Edit/Delete user functionality
- Manual user creation
- Statistics cards

### 4. User Dashboard (/user/dashboard)
- 6 feature cards grid layout:
  1. Quick Send Campaign 📨
  2. Customize Campaign 🎯
  3. Manage Templates 📝
  4. Manage Reports 📊
  5. Manage API 🔧
  6. Chatbot 🤖
- Credits display in header
- "Coming Soon" states for features

### 5. Enhanced Admin Features
- **User Details Management**: Separate page for editing user details with business information
- **Business Info Management**: WhatsApp API credentials management (phone number, number ID, WABA ID, access token)
- **Route Protection**: Comprehensive authentication guards for all routes
- **Navigation Enhancement**: Logo/brand clicks redirect to respective dashboards, not landing page
- **UI/UX Improvements**: Modern card layouts, better responsive design, loading states

### 6. WhatsApp Business Integration
- **Business Info Storage**: Database table for WhatsApp Business API credentials
- **Credential Management**: Secure storage and validation of API keys and tokens
- **Configuration Status**: Visual indicators showing which users have configured WhatsApp
- **Form Validation**: Comprehensive validation for WhatsApp API credentials

### 5. Security & Validation
- Input sanitization
- SQL injection prevention
- Session security
- Form validation with real-time feedback

## Environment Variables Required
- Database credentials (user to provide)
- Session secrets  
- WhatsApp Business API credentials (placeholders)
- Server/client configuration

## New Database Tables
- **user_business_info**: Stores WhatsApp Business API credentials and configuration for each user

## New Routes
- **/admin/users/:id/details** - User details editing page with business information management
- Enhanced route protection for all authenticated routes

## New Components
- **AdminLayout**: Enhanced layout with proper navigation and breadcrumbs
- **ProtectedRoute**: Route wrapper with comprehensive authentication checks
- **AdminRoute**: Admin-specific route protection
- **UserRoute**: User-specific route protection
- **AdminUserDetails**: Comprehensive user editing page with business info

## Implementation Status
- [x] Project structure setup
- [x] Database schema and seed data
- [x] Backend API implementation
- [x] Frontend React app setup
- [x] Landing page design
- [x] Authentication pages
- [x] Admin dashboard
- [x] User dashboard
- [x] Testing and validation

## Testing Checklist
1. Database connection and table creation
2. Signup functionality with validation
3. Login with role-based routing
4. Admin dashboard CRUD operations
5. User dashboard display and navigation
6. Session management and security
7. Responsive design across devices

## Notes
- Using hardcoded admin credentials for simplicity
- Credit-based pricing model
- Modern UI with shadcn/ui components
- Full TypeScript implementation
- Session-based authentication (not JWT as mentioned in auth routes)