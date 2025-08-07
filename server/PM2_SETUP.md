# Prime SMS - PM2 & PostgreSQL Session Store Setup

## Overview
This setup provides:
- **PM2 Ecosystem Configuration** with all environment variables
- **PostgreSQL Session Store** (replacing MemoryStore) 
- **Production-ready deployment** with proper session persistence
- **Automatic session table creation** in PostgreSQL

## Prerequisites

1. **PostgreSQL running on port 5432**
   ```bash
   # Check if PostgreSQL is running
   pg_isready -h localhost -p 5432
   ```

2. **PM2 installed globally**
   ```bash
   npm install -g pm2
   ```

3. **Database access** to `PrimeSMS_W` database

## File Structure

```
server/
├── ecosystem.config.js     # PM2 configuration with env variables
├── deploy.sh              # Production deployment script  
├── pm2-dev.sh             # Development deployment script
├── src/index.ts           # Updated with PG session store
└── logs/                  # PM2 logs directory
```

## Session Store Migration

### Before (MemoryStore - Not Production Ready)
```javascript
app.use(session({
  // No store specified = uses MemoryStore
  // Sessions lost on server restart
  // Not suitable for clustered/multi-instance apps
}));
```

### After (PostgreSQL Store - Production Ready)  
```javascript
const pgSession = connectPgSimple(session);
app.use(session({
  store: new pgSession({
    pool: pool,                    // Reuses existing PG connection pool
    tableName: 'session',          # Sessions stored in 'session' table
    createTableIfMissing: true     # Auto-creates table on first run
  }),
  // ... rest of session config
}));
```

## Environment Variables

All environment variables are configured in `ecosystem.config.js`:

### Development Environment
```javascript
env: {
  NODE_ENV: 'development',
  PORT: 5050,
  DB_HOST: 'localhost',
  DB_PORT: 5432,
  DB_NAME: 'PrimeSMS_W',
  DB_USER: 'postgres',
  DB_PASSWORD: '',
  SESSION_SECRET: 'super-secure-session-secret-key...',
  CORS_ORIGINS: 'https://primesms.app,https://www.primesms.app',
  // ... other config
}
```

### Production Environment  
```javascript
env_production: {
  NODE_ENV: 'production',
  // ... same variables with production values
}
```

## Session Configuration

### Cookie Settings (Environment Aware)
- **Development**: `secure: false`, `sameSite: 'lax'`
- **Production**: `secure: true`, `sameSite: 'none'`

This ensures:
- ✅ Local development works with HTTP
- ✅ Production works with HTTPS cross-site cookies
- ✅ Sessions persist across server restarts
- ✅ Multiple server instances share session data

## Deployment Commands

### Production Deployment
```bash
# Deploy to production
./deploy.sh
```

This script:
1. Builds TypeScript (`npm run build`)
2. Creates logs directory
3. Tests database connection
4. Stops/deletes existing PM2 processes  
5. Starts with production environment
6. Sets up PM2 auto-startup (first time)

### Development Mode
```bash  
# Start in development mode
./pm2-dev.sh
```

### Manual PM2 Commands
```bash
# Start production
pm2 start ecosystem.config.js --env production

# Start development  
pm2 start ecosystem.config.js --env development

# View status
pm2 status

# View logs
pm2 logs prime-sms

# Monitor resources
pm2 monit

# Restart
pm2 restart prime-sms

# Stop
pm2 stop prime-sms

# Delete  
pm2 delete prime-sms
```

## Database Session Table

The PostgreSQL session store automatically creates this table:

```sql
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
```

## Authentication Flow Fix

### Problem Solved
- ❌ **Before**: Sessions stored in memory, lost on restart
- ❌ **Before**: Cross-site cookie issues (`SameSite=Strict`)
- ❌ **Before**: 401 errors after page refresh

### Solution Implemented  
- ✅ **After**: Sessions stored in PostgreSQL, persist across restarts
- ✅ **After**: Production-ready cookie settings (`SameSite=none`)
- ✅ **After**: Proper CORS configuration per environment

## Verification

### 1. Check PM2 Status
```bash
pm2 status
```

### 2. Test Health Endpoint
```bash
curl http://localhost:5050/api/health
```

### 3. Test Authentication Flow
```bash
# Login (should set session cookie)
curl -c cookies.txt -X POST http://localhost:5050/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"primesms","password":"Primesms"}'

# Check auth (should return user data)  
curl -b cookies.txt http://localhost:5050/api/auth/me
```

### 4. Verify Session Table
```bash
# Connect to PostgreSQL and check session table
psql -h localhost -p 5432 -U postgres -d PrimeSMS_W -c "SELECT COUNT(*) FROM session;"
```

## Production Benefits

1. **Session Persistence**: Survives server restarts/crashes
2. **Horizontal Scaling**: Multiple app instances share session data  
3. **Memory Efficiency**: Sessions stored in database, not memory
4. **Automatic Cleanup**: Expired sessions automatically removed
5. **PM2 Integration**: Process monitoring, auto-restart, clustering
6. **Environment Management**: Separate dev/prod configurations

## Troubleshooting

### If sessions aren't persisting:
1. Check if `session` table exists in PostgreSQL
2. Verify database connection in PM2 logs: `pm2 logs`
3. Check PM2 environment variables: `pm2 show prime-sms`

### If authentication fails:
1. Clear browser cookies for the domain  
2. Check CORS settings match frontend domain
3. Verify `NODE_ENV` is set correctly for cookie security

### If PM2 won't start:
1. Check TypeScript compilation: `npm run build`
2. Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
3. Check PM2 logs: `pm2 logs prime-sms`