# Primes SMS - WhatsApp Business API SaaS Platform

A complete WhatsApp Business API SaaS platform with modern landing page, authentication system, and role-based dashboards.

## 🚀 Features

### 🎯 Landing Page
- Modern hero section with compelling messaging
- Feature showcase (Developer Friendly, Transparent Pricing, Powerful Management)
- Credit-based pricing display

- Professional header and footer

### 🔐 Authentication System
- User signup with comprehensive validation
- Login with role-based routing (Admin/User)
- Session-based authentication
- Password strength indicators

### 👨‍💼 Admin Dashboard
- Complete user management (CRUD operations)
- Real-time statistics dashboard
- User roles and permissions management
- Pagination and search functionality

### 👤 User Dashboard
- 6 feature cards with modern UI:
  1. Quick Send Campaign 📨
  2. Customize Campaign 🎯
  3. Manage Templates 📝
  4. Manage Reports 📊
  5. Manage API 🔧
  6. Chatbot 🤖
- Credits display and account management
- Responsive design for all devices

## 🛠 Technology Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Authentication**: Session-based with Express sessions

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (running on port 5431)
- npm or yarn

## 🗄 Database Setup

1. **Create the database:**
   ```sql
   CREATE DATABASE "PrimeSMS_W";
   ```

2. **Run the database setup script:**
   ```bash
   psql -h localhost -p 5431 -d PrimeSMS_W -f database_setup.sql
   ```

   This will create:
   - Users table with proper schema
   - Admin user (username: `primesms`, password: `Primesms`)
   - Test user (username: `testuser`, password: `test123`)

## ⚙️ Environment Configuration

### Server Environment (.env)
Update `server/.env` with your actual database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5431
DB_NAME=PrimeSMS_W
DB_USER=your_actual_db_username
DB_PASSWORD=your_actual_db_password

# Server Configuration
PORT=5050
NODE_ENV=development

# Session Secret (generate a secure random string)
SESSION_SECRET=generate_a_secure_random_string_here

# WhatsApp Business API (add your actual credentials later)
META_API_URL=https://graph.facebook.com/v18.0
DEFAULT_ACCESS_TOKEN=your_meta_access_token_here
DEFAULT_PHONE_NUMBER_ID=your_phone_number_id_here
DEFAULT_WABA_ID=your_waba_id_here
```

### Client Environment (.env)
The client `.env` is already configured:
```env
VITE_API_URL=http://localhost:5050
VITE_APP_NAME=Primes SMS
```

## 🚀 Installation & Running

### 1. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 2. Start the Application

**Start Backend (Terminal 1):**
```bash
cd server
npm run dev
```
Server will run on http://localhost:5050

**Start Frontend (Terminal 2):**
```bash
cd client
npm run dev
```
Client will run on http://localhost:5173

## 🧪 Testing Checklist

### ✅ Database Connection
- [ ] Verify PostgreSQL is running on port 5431
- [ ] Database "PrimeSMS_W" exists
- [ ] Users table created successfully
- [ ] Admin user exists (primesms/Primesms)
- [ ] Test user exists (testuser/test123)

### ✅ Backend API Testing
- [ ] Server starts without errors on port 5050
- [ ] Health check: GET http://localhost:5050/api/health
- [ ] Signup API: POST http://localhost:5050/api/auth/signup
- [ ] Login API: POST http://localhost:5050/api/auth/login
- [ ] Admin stats API: GET http://localhost:5050/api/admin/stats
- [ ] Admin users API: GET http://localhost:5050/api/admin/users

### ✅ Frontend Testing
- [ ] React app starts without errors on port 5173
- [ ] Landing page loads with all sections
- [ ] Navigation between pages works
- [ ] Responsive design on mobile/tablet/desktop

### ✅ Authentication Flow
- [ ] **Signup Process:**
  - [ ] All form validations work
  - [ ] Real-time validation feedback
  - [ ] Password strength indicator
  - [ ] Successful signup creates user in database
  - [ ] Redirects to login after signup

- [ ] **Login Process:**
  - [ ] Admin login (primesms/Primesms) → redirects to /admin/dashboard
  - [ ] User login (testuser/test123) → redirects to /user/dashboard
  - [ ] Invalid credentials show error message
  - [ ] Session persistence works

### ✅ Admin Dashboard
- [ ] **Dashboard Access:**
  - [ ] Only admin users can access
  - [ ] Regular users redirected to user dashboard
  - [ ] Statistics cards display correctly

- [ ] **User Management:**
  - [ ] Users table loads with pagination
  - [ ] View user details modal works
  - [ ] Edit user functionality works
  - [ ] Delete user works (with confirmation)
  - [ ] Create new user manually works
  - [ ] Cannot delete own admin account

### ✅ User Dashboard
- [ ] **Dashboard Display:**
  - [ ] All 6 feature cards display correctly
  - [ ] Credits shown in header
  - [ ] Profile information displayed
  - [ ] Responsive grid layout works

- [ ] **Feature Cards:**
  - [ ] Quick Send Campaign card
  - [ ] Customize Campaign card
  - [ ] Manage Templates card
  - [ ] Manage Reports card
  - [ ] Manage API card
  - [ ] Chatbot card
  - [ ] "Coming Soon" status for all features

### ✅ Session Management
- [ ] **Session Persistence:**
  - [ ] Session survives browser refresh
  - [ ] Automatic logout after session expires
  - [ ] Logout button works correctly
  - [ ] Session data cleared on logout

### ✅ Error Handling
- [ ] **Network Errors:**
  - [ ] Server down scenarios handled gracefully
  - [ ] Database connection errors handled
  - [ ] API timeout scenarios handled

- [ ] **Validation Errors:**
  - [ ] Form validation messages clear
  - [ ] Server validation errors displayed
  - [ ] User-friendly error messages

### ✅ UI/UX Testing
- [ ] **Responsive Design:**
  - [ ] Mobile (320px+) layout works
  - [ ] Tablet (768px+) layout works  
  - [ ] Desktop (1024px+) layout works
  - [ ] All interactive elements accessible

- [ ] **Loading States:**
  - [ ] Loading spinners during API calls
  - [ ] Disabled buttons during submission
  - [ ] Skeleton loading where appropriate

## 🔧 Demo Credentials

### Admin Access
- **Username:** `primesms`
- **Password:** `Primesms`
- **Access:** Full admin dashboard with user management

### Regular User Access
- **Username:** `testuser`
- **Password:** `test123`  
- **Access:** User dashboard with feature cards

## 📁 Project Structure

```
primes-sms/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/ui/  # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utility functions
│   │   └── types/          # TypeScript type definitions
│   ├── public/
│   └── package.json
├── server/                 # Node.js backend  
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   └── types/          # TypeScript types
│   └── package.json
├── database_setup.sql      # Database schema
├── context.md             # Project context
├── instructions.md        # Original requirements
└── README.md              # This file
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify PostgreSQL is running: `pg_ctl status`
   - Check connection settings in server/.env
   - Ensure database "PrimeSMS_W" exists

2. **Port Already in Use**
   - Backend: Change PORT in server/.env
   - Frontend: Vite will automatically use next available port

3. **Session Not Persisting**  
   - Check SESSION_SECRET is set in server/.env
   - Verify cookies are enabled in browser
   - Check CORS configuration for credentials

4. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run build`

## 🔄 Next Steps

After successful testing, you can:

1. **Deploy to Production:**
   - Set up production database
   - Configure production environment variables
   - Deploy backend to cloud service (Heroku, AWS, etc.)
   - Deploy frontend to static hosting (Vercel, Netlify, etc.)

2. **Implement WhatsApp Integration:**
   - Set up Meta Business API account
   - Configure webhook endpoints
   - Implement actual message sending functionality

3. **Add Features:**
   - Implement the 6 dashboard features
   - Add payment integration for credits
   - Implement real analytics and reporting
   - Add email notifications

## 📞 Support

If you encounter any issues:

1. Check this README for troubleshooting steps
2. Verify all environment variables are correctly set
3. Ensure database is properly set up and accessible
4. Check browser console and server logs for error details

## 🎉 Success!

If all tests pass, you have successfully implemented a complete WhatsApp Business API SaaS platform with:

- ✅ Modern, responsive landing page
- ✅ Complete authentication system
- ✅ Role-based dashboards (Admin/User)
- ✅ User management with CRUD operations
- ✅ Session-based security
- ✅ Professional UI with shadcn/ui components
- ✅ TypeScript throughout for type safety

The application is ready for further feature development and production deployment!# Primesms_W
