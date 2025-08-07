# Prime SMS - Session Cookie Fix Deployment

## Issue
Authentication works for login but fails for subsequent API calls (`/api/auth/me`, admin routes) due to incorrect session cookie configuration.

## Root Cause
- Current production: `SameSite=Strict` blocks cross-site cookies
- Cookie name mismatch between sessions

## Fixed Configuration

### 1. Session Configuration (src/index.ts lines 183-194)

```typescript
app.use(session({
  name: 'connect.sid',
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.isProduction, // Secure only in production
    httpOnly: true,
    sameSite: env.isProduction ? 'none' : 'lax', // Cross-site for production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));
```

### 2. CORS Configuration (src/index.ts lines 67-74)

```typescript
const corsOptions = {
  origin: env.isProduction ? 'https://primesms.app' : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};
```

## Deployment Steps

1. Deploy the updated `src/index.ts` to production server
2. Restart the Node.js/PM2 process
3. Test authentication flow:
   ```bash
   # Login should work and set proper cookies
   curl -c cookies.txt -X POST https://primesms.app/api/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"username":"primesms","password":"Primesms"}'
   
   # This should now return user data instead of 401
   curl -b cookies.txt https://primesms.app/api/auth/me
   ```

## Expected Results After Deployment

✅ Login works and sets session cookie with `SameSite=None`  
✅ `/api/auth/me` returns user data  
✅ Admin dashboard loads without "Failed to fetch data"  
✅ All protected routes work properly  
✅ No more 401 errors in browser console  

## Browser Testing

After deployment, clear browser cookies for primesms.app and test:
1. Login with admin credentials
2. Should redirect to `/admin/dashboard` 
3. Dashboard should load data without errors
4. Page refresh should maintain authentication