# 🚀 Prime SMS - Production Deployment Guide

## 📋 Overview
This guide covers deploying Prime SMS to a production environment on Ubuntu-based VPS (like Hostinger).

---

## 🎯 What's Included in This Production Build

### ✅ Security Features
- **Helmet.js** - Security headers (HSTS, CSP, etc.)
- **CORS** - Configurable origin whitelist
- **Rate Limiting** - 100 requests/15 minutes per IP
- **HPP Protection** - HTTP Parameter Pollution prevention
- **Input Validation** - Zod schemas for all endpoints
- **Session Security** - Secure cookies, httpOnly, sameSite
- **Request Size Limits** - Configurable JSON payload limits

### ✅ Error Handling
- **Global Error Handler** - Structured error responses
- **Async Error Wrapping** - Safe promise handling
- **Process Error Handlers** - Graceful shutdown on exceptions
- **Custom Error Classes** - Typed error handling

### ✅ Logging & Monitoring
- **Winston Logger** - Structured logging with levels
- **HTTP Request Logging** - All requests logged with timing
- **Error Logging** - Full stack traces (not exposed to client)
- **Security Event Logging** - Rate limiting, CORS violations

### ✅ Health & Readiness
- **Health Check** - `/api/health` endpoint
- **Readiness Check** - `/api/ready` with dependency checks
- **System Info** - `/api/info` for monitoring

### ✅ Process Management
- **PM2 Configuration** - Cluster mode, auto-restart
- **Graceful Shutdown** - Clean resource cleanup
- **Memory Management** - Auto-restart on high memory

---

## 🖥️ Server Setup (Ubuntu)

### Step 1: Prepare Your VPS
Run the automated setup script on your Ubuntu server:

```bash
# Download and run server setup script
wget https://raw.githubusercontent.com/your-repo/prime-sms/main/server/scripts/setup-server.sh
chmod +x setup-server.sh
sudo ./setup-server.sh
```

This script installs:
- Node.js 20 LTS
- PostgreSQL 15
- Nginx with security configuration
- PM2 process manager
- UFW firewall with proper rules
- Fail2ban for intrusion prevention
- SSL certificate tools (certbot)

### Step 2: Configure Database
```bash
# Set a secure password for the database user
sudo -u postgres psql -c "ALTER USER prime_sms PASSWORD 'your_very_secure_password';"

# Verify database connection
sudo -u postgres psql -d PrimeSMS_W -c "SELECT version();"
```

### Step 3: Upload Application Code
```bash
# Clone your repository or upload files to /var/www/prime-sms
sudo -u prime-sms git clone https://github.com/your-repo/prime-sms.git /var/www/prime-sms
cd /var/www/prime-sms/server

# Set ownership
sudo chown -R prime-sms:prime-sms /var/www/prime-sms
```

---

## ⚙️ Environment Configuration

### Create Production Environment File
Copy and configure the environment template:

```bash
cp .env.production .env
nano .env
```

**Required Environment Variables:**
```env
NODE_ENV=production
PORT=5050

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=PrimeSMS_W
DB_USER=prime_sms
DB_PASSWORD=your_very_secure_password

# Security
SESSION_SECRET=generate_64_character_random_string_here
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

**Generate Secure Session Secret:**
```bash
openssl rand -hex 32
```

---

## 🚀 Application Deployment

### Deploy with Automated Script
```bash
cd /var/www/prime-sms/server
sudo -u prime-sms ./scripts/deploy.sh
```

### Manual Deployment Steps
If you prefer manual deployment:

```bash
# Switch to app user
sudo -u prime-sms -i
cd /var/www/prime-sms/server

# Install dependencies
npm ci --production=false

# Build application
npm run build

# Start with PM2
npm run start:prod

# Save PM2 configuration
pm2 save
pm2 startup
```

---

## 🌐 Nginx Configuration

### Configure SSL Certificate
```bash
# Install SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Apply Nginx Configuration
```bash
# Copy nginx configuration
sudo cp /var/www/prime-sms/server/nginx.conf /etc/nginx/sites-available/prime-sms

# Enable site
sudo ln -s /etc/nginx/sites-available/prime-sms /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 🔧 Database Setup

### Run Database Schema
```bash
# Apply database schema
sudo -u prime-sms psql -h localhost -p 5432 -d PrimeSMS_W -f /var/www/prime-sms/database_schema.sql

# Apply initial data
sudo -u prime-sms psql -h localhost -p 5432 -d PrimeSMS_W -f /var/www/prime-sms/production_data.sql
```

---

## 📊 Monitoring & Maintenance

### Health Checks
- **Application Health**: `https://yourdomain.com/api/health`
- **Readiness Check**: `https://yourdomain.com/api/ready`
- **System Info**: `https://yourdomain.com/api/info`

### PM2 Commands
```bash
# Check application status
pm2 status

# View logs
pm2 logs prime-sms

# Monitor resources
pm2 monit

# Restart application
pm2 restart prime-sms

# Stop application
pm2 stop prime-sms
```

### Server Monitoring
```bash
# Check overall server status
prime-sms-status

# Create backup
prime-sms-backup

# View system logs
sudo tail -f /var/log/nginx/prime-sms-access.log
sudo journalctl -u nginx -f
```

---

## 🔧 Troubleshooting

### Common Issues

**1. Application Won't Start**
```bash
# Check logs
pm2 logs prime-sms

# Check environment variables
pm2 show prime-sms

# Verify database connection
sudo -u prime-sms psql -h localhost -d PrimeSMS_W -c "SELECT 1;"
```

**2. Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Verify user permissions
sudo -u postgres psql -c "\du prime_sms"
```

**3. Nginx Issues**
```bash
# Check nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

**4. SSL Certificate Issues**
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## 🔄 Updates & Deployment

### Zero-Downtime Deployment
```bash
# Pull latest code
sudo -u prime-sms git pull origin main

# Switch to app directory
cd /var/www/prime-sms/server

# Install dependencies
sudo -u prime-sms npm ci --production=false

# Build application
sudo -u prime-sms npm run build

# Reload PM2 (zero-downtime)
pm2 reload prime-sms
```

### Database Migrations
```bash
# Backup database first
prime-sms-backup

# Run migration scripts
sudo -u prime-sms psql -h localhost -d PrimeSMS_W -f migration.sql
```

---

## 🛡️ Security Checklist

- [ ] SSL certificate installed and configured
- [ ] UFW firewall enabled with minimal ports
- [ ] Fail2ban configured and running
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] Database password is strong and unique
- [ ] Session secret is 64+ characters random string
- [ ] CORS origins configured for production domains only
- [ ] Rate limiting enabled
- [ ] Security headers configured via Helmet
- [ ] Application runs as non-root user
- [ ] File permissions properly set
- [ ] Automatic security updates enabled

---

## 📋 Performance Tuning

### PM2 Cluster Mode
The ecosystem.config.js is configured for cluster mode using all CPU cores.

### Database Optimization
```sql
-- Add indexes for better performance (already included in schema)
-- Monitor slow queries
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

### Nginx Optimization
- Gzip compression enabled
- Static file caching configured
- Proxy buffering optimized
- Connection keep-alive enabled

---

## 🎯 Success Criteria

✅ **Security**: All security middleware active, no stack traces exposed  
✅ **Monitoring**: Health endpoints responding, logs structured  
✅ **Performance**: Cluster mode active, requests < 100ms average  
✅ **Reliability**: Graceful shutdowns, auto-restart on failures  
✅ **Maintainability**: PM2 configured, deployment scripts working  

---

## 📞 Support

**Application Commands:**
- `prime-sms-status` - Check server status
- `prime-sms-backup` - Create backup
- `pm2 logs prime-sms` - View application logs
- `pm2 restart prime-sms` - Restart application

**Log Locations:**
- Application: PM2 logs (`pm2 logs prime-sms`)
- Nginx: `/var/log/nginx/prime-sms-*.log`
- System: `journalctl -u nginx -f`

Your Prime SMS API is now production-ready! 🎉