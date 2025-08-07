#!/bin/bash

# Prime SMS - Production Deployment Script
# This script builds and deploys the application using PM2

set -e # Exit on any error

echo "🚀 Prime SMS Production Deployment Starting..."
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
fi

# Check if TypeScript is compiled
if [ ! -d "dist" ]; then
    print_warning "dist directory not found. Building TypeScript..."
    npm run build
fi

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    print_status "Creating logs directory..."
    mkdir -p logs
fi

# Check database connection
print_status "Testing database connection..."
if ! pg_isready -h localhost -p 5432; then
    print_error "PostgreSQL is not running on port 5432!"
    exit 1
fi

# Stop existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 stop ecosystem.config.js 2>/dev/null || echo "No existing processes to stop"

# Delete existing PM2 processes
print_status "Deleting existing PM2 processes..."
pm2 delete ecosystem.config.js 2>/dev/null || echo "No existing processes to delete"

# Start with production environment
print_status "Starting application with PM2 (production mode)..."
pm2 start ecosystem.config.js --env production

# Save PM2 process list
print_status "Saving PM2 process list..."
pm2 save

# Setup PM2 startup script (run once)
if [ ! -f ~/.pm2_startup_configured ]; then
    print_status "Setting up PM2 startup script..."
    pm2 startup
    touch ~/.pm2_startup_configured
    print_warning "Please run the startup command shown above as root/sudo to enable auto-start on boot"
fi

# Show status
print_status "Deployment completed! Application status:"
echo "============================================="
pm2 status
pm2 logs --lines 10

echo ""
print_status "Application deployed successfully!"
echo "- API Health Check: curl http://localhost:5050/api/health"
echo "- PM2 Status: pm2 status"
echo "- PM2 Logs: pm2 logs prime-sms"
echo "- PM2 Monitor: pm2 monit"
echo ""
print_status "🎉 Prime SMS is now running in production!"