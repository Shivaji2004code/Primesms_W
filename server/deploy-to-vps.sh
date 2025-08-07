#!/bin/bash

# Prime SMS VPS Deployment Script
# Run this script ON YOUR VPS: ssh root@31.97.230.246
# Password: Krishnashivaji@2004

echo "🚀 Prime SMS VPS Deployment Starting..."
echo "======================================"

# Set variables
PROJECT_DIR="/var/www/prime-sms"
BACKUP_DIR="/var/backups/prime-sms-$(date +%Y%m%d-%H%M%S)"
DB_NAME="PrimeSMS_W"

# Stop services first
echo "⏹️  Stopping existing services..."
pm2 stop prime-sms-api 2>/dev/null || echo "No existing PM2 process found"
systemctl stop nginx 2>/dev/null || echo "Nginx not running"

# Create backup if project exists
if [ -d "$PROJECT_DIR" ]; then
    echo "📦 Creating backup..."
    mkdir -p "$(dirname $BACKUP_DIR)"
    cp -r "$PROJECT_DIR" "$BACKUP_DIR"
    echo "✅ Backup created at: $BACKUP_DIR"
fi

# Create project directory
echo "📁 Setting up project directory..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
apt install -y nodejs npm postgresql postgresql-contrib nginx certbot python3-certbot-nginx git curl

# Install PM2 globally
echo "🔧 Installing PM2..."
npm install -g pm2

# Setup PostgreSQL (if not already setup)
echo "💾 Setting up PostgreSQL..."
sudo -u postgres createdb $DB_NAME 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '';" 2>/dev/null || echo "Password already set"

# Clone or copy the code (you'll need to upload your code here)
echo "📋 Note: You need to upload your codebase to $PROJECT_DIR"
echo "📋 You can use: scp -r /path/to/your/server/* root@31.97.230.246:$PROJECT_DIR/"

# Wait for user to upload code
read -p "📋 Have you uploaded your server code to $PROJECT_DIR? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please upload your code first, then run this script again"
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Setup environment file
echo "⚙️  Setting up environment..."
cp .env.production .env

# Setup PM2 ecosystem file
echo "⚙️  Creating PM2 ecosystem file..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'prime-sms-api',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/pm2/prime-sms-error.log',
    out_file: '/var/log/pm2/prime-sms-out.log',
    log_file: '/var/log/pm2/prime-sms-combined.log',
    time: true
  }]
};
EOF

# Create PM2 log directory
mkdir -p /var/log/pm2

# Setup NGINX configuration
echo "🌐 Setting up NGINX..."
cat > /etc/nginx/sites-available/primesms.app << 'EOF'
server {
    listen 80;
    server_name primesms.app www.primesms.app;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name primesms.app www.primesms.app;
    
    # SSL configuration (will be handled by certbot)
    
    # API routes
    location /api {
        proxy_pass http://127.0.0.1:5050;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Session cookie handling
        proxy_cookie_flags * HttpOnly Secure SameSite=None;
        proxy_cookie_domain 127.0.0.1 .primesms.app;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Frontend (if you have one)
    location / {
        root /var/www/prime-sms-frontend;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/primesms.app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test NGINX configuration
echo "🧪 Testing NGINX configuration..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ NGINX configuration test failed!"
    exit 1
fi

# Setup SSL with Certbot
echo "🔒 Setting up SSL certificates..."
certbot --nginx -d primesms.app -d www.primesms.app --non-interactive --agree-tos --email admin@primesms.app

# Start services
echo "🚀 Starting services..."

# Start API with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Start NGINX
systemctl start nginx
systemctl enable nginx

# Setup firewall
echo "🔥 Setting up firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5432/tcp
ufw --force enable

# Test the deployment
echo "🧪 Testing deployment..."
sleep 5

# Test API health
curl -f http://localhost:5050/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ API is responding on localhost:5050"
else
    echo "❌ API not responding - check PM2 logs"
    pm2 logs prime-sms-api --lines 20
fi

# Test HTTPS
curl -f https://primesms.app/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ HTTPS API is working"
else
    echo "⚠️  HTTPS not working yet - may need DNS propagation"
fi

# Show status
echo ""
echo "📊 DEPLOYMENT STATUS"
echo "==================="
echo "🔧 PM2 Status:"
pm2 status
echo ""
echo "🌐 NGINX Status:"
systemctl status nginx --no-pager -l
echo ""
echo "💾 Database Status:"
systemctl status postgresql --no-pager -l

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================="
echo "✅ API running on: https://primesms.app/api"
echo "✅ Health check: https://primesms.app/api/health"
echo "✅ PM2 process: prime-sms-api"
echo "✅ Logs: pm2 logs prime-sms-api"
echo ""
echo "🔧 Management Commands:"
echo "  pm2 restart prime-sms-api  # Restart API"
echo "  pm2 logs prime-sms-api     # View logs" 
echo "  systemctl reload nginx     # Reload NGINX"
echo "  certbot renew             # Renew SSL certificates"
echo ""
echo "🌟 Your Prime SMS API is now live at https://primesms.app!"