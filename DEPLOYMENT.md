# 🚀 Deployment Guide for Coolify

This guide will help you deploy Prime SMS to Coolify with zero configuration issues.

## 📋 Prerequisites

- Coolify instance running
- GitHub repository access
- Environment variables configured

## 🛠 Deployment Steps

### 1. Environment Variables Setup

Configure these environment variables in your Coolify dashboard:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@postgres:5432/primesms
POSTGRES_DB=primesms
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# N8N Integration (optional)
N8N_WEBHOOK_URL=your_n8n_webhook_url

# Client API URL (update with your domain)
VITE_API_URL=https://your-api-domain.com

# Server Configuration
PORT=5000
NODE_ENV=production
```

### 2. Domain Configuration

1. **Frontend Domain**: Point to port 3000
2. **Backend Domain**: Point to port 5000
3. **Database**: Internal service (port 5432)

### 3. Health Checks

The application includes built-in health checks:
- **Frontend**: Nginx health check on port 3000
- **Backend**: Health endpoint at `/api/health`
- **Database**: PostgreSQL connection check

### 4. Build Process

The Docker containers will:
1. **Client**: Build React app with Vite → Serve with Nginx
2. **Server**: Build TypeScript → Run with Node.js
3. **Database**: Initialize PostgreSQL with persistent storage

## 🔧 Coolify Configuration

### Service Configuration

```yaml
# This is automatically configured via docker-compose.production.yml
services:
  - client (Port: 3000)
  - server (Port: 5000)  
  - postgres (Port: 5432)
```

### Resource Requirements

- **CPU**: Minimum 1 vCPU per service
- **RAM**: 512MB client, 1GB server, 512MB database
- **Storage**: 5GB for database volume

### SSL Configuration

Coolify automatically handles SSL certificates. Ensure:
- Domain is properly pointed to your Coolify instance
- SSL certificate is generated and active

## 🗄 Database Setup

The application will automatically:
1. Create necessary tables on first run
2. Set up admin user (primesms/Primesms)
3. Initialize database schema

### Manual Database Setup (if needed)

If automatic setup fails, run these SQL commands:

```sql
-- Connect to your database
\c primesms;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user',
    credits INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert admin user (password: Primesms)
INSERT INTO users (name, email, username, password, role, credits) VALUES 
('Admin User', 'admin@primesms.com', 'primesms', '$2b$10$rH8.5t5zJ5L5z5H8.5t5zO8V5z5H8.5t5zJ5L5z5H8.5t5zJ5L5z5', 'admin', 1000);
```

## 🚦 Monitoring & Logs

### Health Check Endpoints

- **Client**: `GET /` (Returns React app)
- **Server**: `GET /api/health` (Returns JSON status)
- **Database**: Internal connection check

### Common Issues & Solutions

1. **Build Failures**
   ```bash
   # Check build logs in Coolify dashboard
   # Common fix: Increase build timeout to 600 seconds
   ```

2. **Database Connection Issues**
   ```bash
   # Verify DATABASE_URL format
   # Check if postgres service is running
   ```

3. **Environment Variable Issues**
   ```bash
   # Ensure all required variables are set
   # Check for typos in variable names
   ```

## 🔐 Security Checklist

- [ ] Strong JWT_SECRET (minimum 32 characters)
- [ ] Secure database password
- [ ] HTTPS enabled for all domains
- [ ] Environment variables properly secured in Coolify
- [ ] Admin password changed from default
- [ ] CORS configured for your domain

## 📊 Performance Optimization

### Production Settings

1. **Nginx Configuration**: Enabled gzip compression
2. **Database**: Connection pooling enabled
3. **Caching**: Static assets cached for 1 year
4. **Security**: Headers configured for production

### Scaling Options

- **Horizontal**: Add more instances via Coolify
- **Vertical**: Increase CPU/RAM per service
- **Database**: Use external managed PostgreSQL for high load

## 🎯 Post-Deployment Checklist

- [ ] All services are running (green status)
- [ ] Health checks are passing
- [ ] Frontend loads correctly on your domain
- [ ] API endpoints respond correctly
- [ ] Database connection is working
- [ ] Admin login works (primesms/Primesms)
- [ ] User registration works
- [ ] SSL certificates are active
- [ ] Logs are accessible in Coolify dashboard

## 🆘 Troubleshooting

### Common Deployment Issues

1. **Build Timeout**
   - Increase build timeout in Coolify settings
   - Check for large dependencies

2. **Port Conflicts**
   - Ensure ports 3000, 5000, 5432 are available
   - Check service mappings in Coolify

3. **Database Connection**
   - Verify DATABASE_URL format
   - Check postgres service logs

4. **Environment Variables**
   - Double-check all required variables are set
   - Ensure no trailing spaces in values

### Getting Help

1. Check Coolify dashboard logs
2. Review service-specific logs
3. Verify all environment variables
4. Check domain DNS settings

## 🎉 Success!

Once deployed successfully, you'll have:
- Modern WhatsApp Business API SaaS platform
- Responsive landing page with mobile chat interface
- Complete authentication system
- Admin and user dashboards
- Production-ready infrastructure
- Automatic SSL and health monitoring

Your Prime SMS application is now live and ready for users! 🚀