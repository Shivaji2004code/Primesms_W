#!/bin/bash

# Prime SMS - Development Mode with PM2
# This script starts the application in development mode

set -e

echo "🔧 Starting Prime SMS in Development Mode..."
echo "============================================"

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Create logs directory
mkdir -p logs

# Stop and delete existing processes
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start in development mode
echo "Starting with PM2 (development mode)..."
pm2 start ecosystem.config.js --env development

# Show status
pm2 status
pm2 logs --lines 10

echo ""
echo "🔧 Development server started!"
echo "- API: http://localhost:5050"
echo "- Health: http://localhost:5050/api/health"
echo "- Logs: pm2 logs prime-sms"