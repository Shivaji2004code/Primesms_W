# Prime SMS Production Deployment Instructions

## Fixed Issues ✅

1. **Session Configuration**: Fixed `sameSite: 'none'` for HTTPS cross-site cookies
2. **Cookie Domain**: Set to `.primesms.app` for subdomain sharing
3. **Session Name**: Changed to `prime.sid` (matching logout route)
4. **CORS Origins**: Configured for production domain
5. **Database Connection**: Verified working
6. **Trust Proxy**: Configured for NGINX reverse proxy

## Deployment Steps for VPS (31.97.230.246)

### 1. Connect to VPS
```bash
ssh root@31.97.230.246
# Password: Krishnashivaji@2004
```

### 2. Navigate to Project Directory
```bash
cd /path/to/prime-sms/server
```

### 3. Update Environment Variables
Create/update `.env` file:
```bash
cat > .env << 'EOF'
NODE_ENV=production
PORT=5050
DB_HOST=localhost
DB_PORT=5432
DB_NAME=PrimeSMS_W
DB_USER=postgres
DB_PASSWORD=your_actual_db_password
SESSION_SECRET=super-secure-session-secret-key-for-prime-sms-authentication-system-2024
CORS_ORIGINS=https://primesms.app,https://www.primesms.app
EOF
```

### 4. Install Dependencies & Build
```bash
npm install
npm run build
```

### 5. Update NGINX Configuration
Ensure your NGINX config includes:
```nginx
server {
    listen 443 ssl http2;
    server_name primesms.app www.primesms.app;
    
    # SSL configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location /api {
        proxy_pass http://127.0.0.1:5050;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # IMPORTANT: Cookie forwarding for sessions
        proxy_cookie_flags * HttpOnly Secure SameSite=None;
        proxy_cookie_domain localhost .primesms.app;
    }
    
    location / {
        # Frontend static files
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### 6. Restart Services
```bash
# Test NGINX configuration
nginx -t

# Reload NGINX
systemctl reload nginx

# Stop existing PM2 processes
pm2 stop all
pm2 delete all

# Start the backend
pm2 start dist/index.js --name "prime-sms-api"
pm2 save
pm2 startup
```

### 7. Verify Deployment

1. **Check Server Status**:
```bash
pm2 status
curl -k https://primesms.app/api/health
```

2. **Test Authentication**:
```bash
# Login test
curl -c cookies.txt -X POST \
  https://primesms.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"harsha","password":"harsha"}'

# Check session
curl -b cookies.txt https://primesms.app/api/auth/me
```

## Key Changes Made

### 1. Session Configuration (`src/index.ts`)
```typescript
app.use(session({
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: env.isProduction, // HTTPS only in production
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: env.isProduction ? 'none' : 'lax', // 'none' for cross-site HTTPS
    domain: env.isProduction ? '.primesms.app' : undefined
  },
  name: 'prime.sid'
}));
```

### 2. CORS Configuration
```typescript
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!env.isProduction && origin.includes('localhost')) {
      return callback(null, true);
    }
    if (env.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request from origin', { origin, allowedOrigins: env.corsOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-Proto', 'X-Forwarded-Host'],
};
```

### 3. Fixed Logout Route (`src/routes/auth.ts`)
```typescript
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    
    res.clearCookie('prime.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.primesms.app' : undefined
    });
    res.json({ message: 'Logged out successfully' });
  });
});
```

## Troubleshooting

### If 401 Errors Persist:

1. **Check Browser Developer Tools**:
   - Network tab: Verify cookies are being sent with requests
   - Application tab: Check if session cookie exists

2. **Server Logs**:
```bash
pm2 logs prime-sms-api
```

3. **Database Connection**:
```bash
PGPASSWORD=your_password psql -h localhost -U postgres -d PrimeSMS_W -c "SELECT 1;"
```

4. **NGINX Logs**:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Success Criteria ✅

- [ ] Login sets `prime.sid` cookie in browser
- [ ] `/api/auth/me` returns user info after refresh
- [ ] All admin routes work without 401 errors
- [ ] NGINX properly forwards session cookies
- [ ] No CORS errors in browser console

The main issue was session cookies not being configured properly for HTTPS cross-site usage. The fixes ensure:

1. **`sameSite: 'none'`** allows cross-site cookies over HTTPS
2. **`domain: '.primesms.app'`** enables cookie sharing across subdomains
3. **`secure: true`** enforces HTTPS-only cookies in production
4. **Proper CORS headers** allow credential-included requests

Deploy these changes and the authentication should work correctly!