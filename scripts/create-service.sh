#!/bin/bash

# Smart iLO4 - Systemd Service Creator
# Run this script as root to create the systemd service

set -e

if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

# Get the user who should own the service
if [ -n "$SUDO_USER" ]; then
    APP_USER="$SUDO_USER"
else
    read -p "Enter the username for the application: " APP_USER
fi

# Get the application directory
APP_DIR="/home/$APP_USER/Smart-ilo4"
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Application directory not found: $APP_DIR"
    exit 1
fi

echo "🔧 Creating systemd service for Smart iLO4..."

# Create systemd service file
cat > /etc/systemd/system/smart-ilo4.service << EOF
[Unit]
Description=Smart iLO4 Fan Controller
After=network.target
Wants=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=8443

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$APP_DIR

[Install]
WantedBy=multi-user.target
EOF

# Set proper permissions
chmod 644 /etc/systemd/system/smart-ilo4.service

# Reload systemd
systemctl daemon-reload

# Enable service
systemctl enable smart-ilo4

echo "✅ Systemd service created and enabled"
echo ""
echo "📋 Service Management Commands:"
echo "   Start:   sudo systemctl start smart-ilo4"
echo "   Stop:    sudo systemctl stop smart-ilo4"
echo "   Status:  sudo systemctl status smart-ilo4"
echo "   Logs:    sudo journalctl -u smart-ilo4 -f"
echo ""
echo "🚀 To start the service now, run:"
echo "   sudo systemctl start smart-ilo4"
