#!/bin/bash

# Smart iLO4 - LXC Container Setup Script
# Run this script inside your LXC container after basic OS setup

set -e

echo "🚀 Smart iLO4 LXC Container Setup Script"
echo "========================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "⚠️  This script should not be run as root for security reasons."
   echo "Please run as a regular user with sudo privileges."
   exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_status "System updated"

echo "Step 2: Installing essential packages..."
sudo apt install -y curl wget git unzip htop nano ufw
print_status "Essential packages installed"

echo "Step 3: Installing Node.js 20.x LTS..."
if ! command_exists node; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_status "Node.js installed"
else
    NODE_VERSION=$(node --version)
    print_status "Node.js already installed: $NODE_VERSION"
fi

echo "Step 4: Verifying installations..."
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

echo "Step 5: Setting up application directory..."
APP_DIR="$HOME/Smart-ilo4"
if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
    print_status "Application directory created at $APP_DIR"
else
    print_warning "Application directory already exists"
fi

echo "Step 6: Configuring firewall..."
sudo ufw allow 8443/tcp
sudo ufw --force enable
print_status "Firewall configured to allow port 8443"

echo "Step 7: Creating SSL directory..."
mkdir -p "$APP_DIR/ssl"
print_status "SSL directory created"

# Check if we're in the Smart-ilo4 directory already
if [ -f "package.json" ] && grep -q "smart-ilo4" package.json; then
    print_status "Found Smart-ilo4 application in current directory"
    APP_DIR=$(pwd)
else
    print_warning "Smart-ilo4 application files not found in current directory"
    echo "Please copy your application files to: $APP_DIR"
    echo "Or clone from repository if available"
fi

cat << 'EOF'

📋 Next Steps:
==============

1. Copy your Smart-ilo4 application files to: ~/Smart-ilo4/
   
2. Configure environment:
   cd ~/Smart-ilo4
   cp .env.template .env
   nano .env
   
3. Install dependencies and build:
   npm install
   cd frontend && npm install && npm run build && cd ..
   npm run build
   
4. Create systemd service (run as root):
   sudo ./scripts/create-service.sh
   
5. Access your application:
   https://YOUR_CONTAINER_IP:8443

🔧 For complete setup instructions, see: PROXMOX_LXC_DEPLOYMENT.md

EOF

print_status "Base setup completed successfully!"
