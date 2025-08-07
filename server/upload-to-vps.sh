#!/bin/bash

# Upload script to deploy Prime SMS to VPS
# Run this script on your LOCAL machine

VPS_IP="31.97.230.246"
VPS_USER="root"
VPS_PATH="/var/www/prime-sms"

echo "📤 Uploading Prime SMS to VPS..."
echo "================================"

# Create the directory on VPS
echo "📁 Creating directory on VPS..."
ssh $VPS_USER@$VPS_IP "mkdir -p $VPS_PATH"

# Upload all files except node_modules and logs
echo "📂 Uploading server files..."
rsync -avz --progress \
    --exclude 'node_modules/' \
    --exclude 'dist/' \
    --exclude '*.log' \
    --exclude '.git/' \
    --exclude 'server.log' \
    --exclude '/tmp/' \
    ./ $VPS_USER@$VPS_IP:$VPS_PATH/

echo "✅ Upload complete!"
echo ""
echo "🚀 Now run this on your VPS:"
echo "  ssh $VPS_USER@$VPS_IP"
echo "  cd $VPS_PATH"
echo "  chmod +x deploy-to-vps.sh"
echo "  ./deploy-to-vps.sh"
echo ""
echo "🌟 Your deployment will be live at https://primesms.app!"