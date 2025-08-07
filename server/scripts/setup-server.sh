#!/bin/bash

# Prime SMS - Ubuntu Server Setup Script for Hostinger VPS
# This script prepares an Ubuntu server for Prime SMS deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NODE_VERSION="20" # LTS version
POSTGRES_VERSION="15"
APP_USER="prime-sms"
APP_DIR="/var/www/prime-sms"

echo -e "${GREEN}🚀 Setting up Ubuntu server for Prime SMS${NC}"
echo "=============================================="
echo -e "Node.js Version: ${BLUE}$NODE_VERSION${NC}"
echo -e "PostgreSQL Version: ${BLUE}$POSTGRES_VERSION${NC}"
echo -e "Application User: ${BLUE}$APP_USER${NC}"
echo -e "Application Directory: ${BLUE}$APP_DIR${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run this script as root (use sudo)${NC}"
    exit 1
fi

# Update system
echo -e "${GREEN}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install essential packages
echo -e "${GREEN}🛠️  Installing essential packages...${NC}"
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    nano \
    certbot \
    python3-certbot-nginx

# Install Node.js
echo -e "${GREEN}🟢 Installing Node.js $NODE_VERSION...${NC}"
curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash -
apt install -y nodejs

# Verify Node.js installation
NODE_ACTUAL=$(node --version)
NPM_ACTUAL=$(npm --version)
echo -e "${GREEN}✅ Node.js installed: $NODE_ACTUAL${NC}"
echo -e "${GREEN}✅ npm installed: $NPM_ACTUAL${NC}"

# Install PM2 globally
echo -e "${GREEN}📊 Installing PM2 process manager...${NC}"
npm install -g pm2

# Install PostgreSQL
echo -e "${GREEN}🐘 Installing PostgreSQL $POSTGRES_VERSION...${NC}"
apt install -y postgresql-$POSTGRES_VERSION postgresql-contrib-$POSTGRES_VERSION

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Install Nginx
echo -e "${GREEN}🌐 Installing Nginx...${NC}"
apt install -y nginx

# Create application user
echo -e "${GREEN}👤 Creating application user: $APP_USER...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d $APP_DIR $APP_USER
    echo -e "${GREEN}✅ User $APP_USER created${NC}"
else
    echo -e "${YELLOW}⚠️  User $APP_USER already exists${NC}"
fi

# Create application directory
echo -e "${GREEN}📁 Creating application directory...${NC}"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
chown -R $APP_USER:$APP_USER $APP_DIR

# Configure PostgreSQL
echo -e "${GREEN}🔧 Configuring PostgreSQL...${NC}"
sudo -u postgres psql -c "CREATE USER prime_sms WITH PASSWORD 'change_this_password';" || echo "User might already exist"
sudo -u postgres psql -c "CREATE DATABASE \"PrimeSMS_W\" OWNER prime_sms;" || echo "Database might already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE \"PrimeSMS_W\" TO prime_sms;"

# Configure UFW (Uncomplicated Firewall)
echo -e "${GREEN}🔥 Configuring firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow ssh

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow PostgreSQL for local connections
ufw allow 5432/tcp

# Allow our application port (internal only, nginx will proxy)
ufw allow from 127.0.0.1 to any port 5050

# Enable firewall
ufw --force enable

# Configure fail2ban
echo -e "${GREEN}🛡️  Configuring fail2ban...${NC}"
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Configure Nginx basic setup
echo -e "${GREEN}⚙️  Configuring Nginx...${NC}"
# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create basic security configuration
cat > /etc/nginx/conf.d/security.conf << EOF
# Hide nginx version
server_tokens off;

# Security headers
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header X-XSS-Protection "1; mode=block" always;

# Rate limiting
limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone \$binary_remote_addr zone=api:10m rate=100r/m;
EOF

# Enable and start services
echo -e "${GREEN}🔄 Starting services...${NC}"
systemctl enable nginx
systemctl start nginx
systemctl reload nginx

# Install and configure logrotate
echo -e "${GREEN}📜 Configuring log rotation...${NC}"
cat > /etc/logrotate.d/prime-sms << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 $APP_USER $APP_USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Set up automatic security updates
echo -e "${GREEN}🔄 Configuring automatic security updates...${NC}"
apt install -y unattended-upgrades
echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades

# Create deployment script
echo -e "${GREEN}📜 Creating deployment helpers...${NC}"
cat > /usr/local/bin/prime-sms-status << 'EOF'
#!/bin/bash
echo "=== Prime SMS Server Status ==="
echo "System:"
uptime
echo ""
echo "Services:"
systemctl is-active postgresql nginx fail2ban
echo ""
echo "Application:"
pm2 status
echo ""
echo "Resources:"
free -h
df -h /
EOF

chmod +x /usr/local/bin/prime-sms-status

# Create backup script
cat > /usr/local/bin/prime-sms-backup << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/prime-sms"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump PrimeSMS_W > $BACKUP_DIR/database_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /var/www prime-sms

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/prime-sms-backup

# Add to crontab for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/prime-sms-backup") | crontab -

# Final security hardening
echo -e "${GREEN}🔒 Applying final security hardening...${NC}"

# SSH hardening
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
systemctl restart ssh

# Set proper permissions
chmod 750 $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# Print summary
echo ""
echo -e "${GREEN}✅ Server setup completed successfully!${NC}"
echo "=============================================="
echo -e "${BLUE}Server Information:${NC}"
echo -e "OS: $(lsb_release -d -s)"
echo -e "Node.js: $(node --version)"
echo -e "npm: $(npm --version)"
echo -e "PostgreSQL: $(sudo -u postgres psql -c 'SELECT version();' | head -3 | tail -1)"
echo -e "Nginx: $(nginx -v 2>&1)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update PostgreSQL password: sudo -u postgres psql -c \"ALTER USER prime_sms PASSWORD 'your_secure_password';\""
echo "2. Configure SSL certificates: sudo certbot --nginx -d yourdomain.com"
echo "3. Upload your application code to: $APP_DIR"
echo "4. Configure your .env file with production values"
echo "5. Run deployment script: ./scripts/deploy.sh"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "- Check server status: prime-sms-status"
echo "- Create backup: prime-sms-backup"
echo "- View PM2 processes: pm2 status"
echo "- View application logs: pm2 logs prime-sms"
echo "- Restart application: pm2 restart prime-sms"
echo ""
echo -e "${GREEN}🎉 Your server is ready for Prime SMS deployment!${NC}"