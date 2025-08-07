#!/bin/bash

# Prime SMS - Production Deployment Script
# Usage: ./scripts/deploy.sh

set -e # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="prime-sms"
PM2_CONFIG="ecosystem.config.js"
LOG_DIR="./logs"

echo -e "${GREEN}🚀 Starting Prime SMS Production Deployment${NC}"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found globally. Installing PM2...${NC}"
    npm install -g pm2
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Copying from .env.production template...${NC}"
    if [ -f .env.production ]; then
        cp .env.production .env
        echo -e "${RED}❗ Please edit .env file with your production values before continuing${NC}"
        exit 1
    else
        echo -e "${RED}❌ No environment template found. Please create .env file.${NC}"
        exit 1
    fi
fi

# Create logs directory
echo -e "${GREEN}📁 Creating logs directory...${NC}"
mkdir -p $LOG_DIR

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
npm ci --production=false

# Build the application
echo -e "${GREEN}🔨 Building TypeScript application...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed. No dist directory found.${NC}"
    exit 1
fi

# Stop existing PM2 processes
echo -e "${GREEN}🔄 Stopping existing processes...${NC}"
pm2 stop $APP_NAME 2>/dev/null || echo "No existing process to stop"
pm2 delete $APP_NAME 2>/dev/null || echo "No existing process to delete"

# Start the application with PM2
echo -e "${GREEN}🚀 Starting application with PM2...${NC}"
pm2 start $PM2_CONFIG --env production

# Save PM2 configuration
echo -e "${GREEN}💾 Saving PM2 configuration...${NC}"
pm2 save

# Generate startup script
echo -e "${GREEN}⚙️  Setting up PM2 startup script...${NC}"
pm2 startup

# Show status
echo -e "${GREEN}📊 Application status:${NC}"
pm2 status

# Show logs
echo -e "${GREEN}📋 Recent logs:${NC}"
pm2 logs $APP_NAME --lines 10

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "=============================================="
echo -e "Application: ${GREEN}$APP_NAME${NC}"
echo -e "Status: ${GREEN}Running${NC}"
echo -e "Logs: ${YELLOW}pm2 logs $APP_NAME${NC}"
echo -e "Monitor: ${YELLOW}pm2 monit${NC}"
echo -e "Stop: ${YELLOW}pm2 stop $APP_NAME${NC}"
echo -e "Restart: ${YELLOW}pm2 restart $APP_NAME${NC}"
echo ""
echo -e "${YELLOW}🔗 Your API should be available at: http://your-server-ip:5050${NC}"
echo -e "${YELLOW}🏥 Health check: http://your-server-ip:5050/api/health${NC}"