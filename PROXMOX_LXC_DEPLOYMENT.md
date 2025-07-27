# Smart iLO4 Application - Proxmox LXC Container Deployment Guide

## Overview
This guide will help you deploy the Smart iLO4 Fan Controller application in a Proxmox LXC container for optimal performance and resource efficiency.

## Prerequisites
- Proxmox VE 7.x or 8.x
- Access to Proxmox web interface or SSH
- Internet connectivity on the Proxmox host
- iLO4 server accessible from the LXC container network

## Step 1: Create LXC Container

### 1.1 Download Container Template
```bash
# SSH into your Proxmox host
ssh root@your-proxmox-host

# Download Debian 12 template (recommended)
pveam update
pveam download local debian-12-standard_12.7-1_amd64.tar.zst
```

### 1.2 Create Container
```bash
# Create LXC container (adjust values as needed)
pct create 101 \
  local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname smart-ilo4 \
  --memory 1024 \
  --cores 1 \
  --rootfs local-lvm:4 \
  --net0 name=eth0,bridge=vmbr0,firewall=1,ip=dhcp \
  --onboot 1 \
  --unprivileged 1 \
  --features nesting=1
```

### 1.3 Start Container
```bash
pct start 101
```

## Step 2: Configure Container Environment

### 2.1 Enter Container
```bash
pct enter 101
```

### 2.2 Update System and Install Dependencies
```bash
# Update package lists
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git unzip htop nano ufw ca-certificates gnupg

# Install Node.js 20.x LTS (Debian method)
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
apt update && apt install -y nodejs

# Verify installations
node --version  # Should show v20.x.x
npm --version   # Should show compatible version
```

### 2.3 Create Application User
```bash
# Create dedicated user for the application
useradd -m -s /bin/bash smartilo4
usermod -aG sudo smartilo4

# Switch to application user
su - smartilo4
```

## Step 3: Deploy Application

### 3.1 Clone or Transfer Application
```bash
# Option A: Clone from repository (if available)
git clone https://github.com/your-username/Smart-ilo4.git
cd Smart-ilo4

# Option B: Upload files manually
# Create directory and upload your application files
mkdir -p /home/smartilo4/Smart-ilo4
cd /home/smartilo4/Smart-ilo4
# Upload your files here via SCP/SFTP
```

### 3.2 Configure Environment
```bash
# Copy environment template
cp .env.template .env

# Edit configuration
nano .env
```

### 3.3 Configure Environment Variables
```bash
# /home/smartilo4/Smart-ilo4/.env
ILO_HOST=192.168.1.100          # Your iLO4 IP address
ILO_USERNAME=admin              # Your iLO4 username
ILO_PASSWORD=yourpassword       # Your iLO4 password
PORT=8443                       # Application port (use 8443 for HTTPS)
NODE_ENV=production
```

### 3.4 Install Dependencies and Build
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Build frontend
npm run build

# Go back to root and build backend
cd ..
npm run build
```

## Step 4: Create Systemd Service

### 4.1 Create Service File (as root)
```bash
exit  # Exit back to root user

cat > /etc/systemd/system/smart-ilo4.service << 'EOF'
[Unit]
Description=Smart iLO4 Fan Controller
After=network.target
Wants=network.target

[Service]
Type=simple
User=smartilo4
Group=smartilo4
WorkingDirectory=/home/smartilo4/Smart-ilo4
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
ReadWritePaths=/home/smartilo4/Smart-ilo4

[Install]
WantedBy=multi-user.target
EOF
```

### 4.2 Enable and Start Service
```bash
# Reload systemd
systemctl daemon-reload

# Enable service to start on boot
systemctl enable smart-ilo4

# Start service
systemctl start smart-ilo4

# Check status
systemctl status smart-ilo4
```

## Step 5: Configure Firewall and Networking

### 5.1 Configure Container Firewall
```bash
# Allow access to application port
ufw allow 8443/tcp
ufw enable
```

### 5.2 Configure Proxmox Firewall (Optional)
```bash
# On Proxmox host, edit container firewall rules
# Via Web UI: Datacenter → Node → Container → Firewall → Add Rule
# Or via CLI:
pct set 101 -firewall 1
```

### 5.3 Port Forwarding (if needed)
If you want to access the application from outside your network:
```bash
# On your router/firewall, forward port 8443 to your container IP
# Container IP can be found with:
pct exec 101 -- ip addr show eth0
```

## Step 6: SSL Configuration (Recommended)

### 6.1 Generate Self-Signed Certificate
```bash
# Switch back to smartilo4 user
su - smartilo4
cd /home/smartilo4/Smart-ilo4

# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=smart-ilo4"
```

### 6.2 Update Application for HTTPS (if not already configured)
The application should already be configured for HTTPS on port 8443.

## Step 7: Access and Verify

### 7.1 Check Service Status
```bash
# Check if service is running
systemctl status smart-ilo4

# View logs
journalctl -u smart-ilo4 -f
```

### 7.2 Access Application
```bash
# Get container IP
pct exec 101 -- ip addr show eth0

# Access via web browser
https://CONTAINER_IP:8443
```

## Step 8: Backup and Maintenance

### 8.1 Create Container Backup
```bash
# Create backup (on Proxmox host)
vzdump 101 --compress gzip --storage local

# Or via Web UI: Datacenter → Node → Container → Backup → Backup now
```

### 8.2 Update Application
```bash
# Stop service
systemctl stop smart-ilo4

# Switch to app user and update
su - smartilo4
cd /home/smartilo4/Smart-ilo4

# Pull updates (if using git)
git pull

# Rebuild if needed
npm run build
cd frontend && npm run build && cd ..
npm run build

# Start service
exit
systemctl start smart-ilo4
```

## Troubleshooting

### Common Issues

1. **Service won't start**
   ```bash
   journalctl -u smart-ilo4 -n 50
   ```

2. **Can't access from browser**
   - Check firewall rules
   - Verify container IP and port
   - Check if service is listening: `netstat -tlnp | grep 8443`

3. **iLO connection issues**
   - Verify network connectivity: `ping ILO_IP`
   - Check credentials in `.env` file
   - Ensure iLO4 SSH is enabled

4. **Permission issues**
   ```bash
   chown -R smartilo4:smartilo4 /home/smartilo4/Smart-ilo4
   ```

### Performance Monitoring
```bash
# Check resource usage
pct exec 101 -- htop

# Check container resource limits
pct config 101
```

### Logs Location
- Application logs: `journalctl -u smart-ilo4`
- Container logs: `pct exec 101 -- tail -f /var/log/syslog`

## Security Recommendations

1. **Change default ports** if exposed to internet
2. **Use strong passwords** for iLO4 accounts
3. **Keep container updated** regularly
4. **Use proper SSL certificates** for production
5. **Restrict network access** using Proxmox firewall rules
6. **Regular backups** of container and configuration

## Container Resource Recommendations

- **Memory**: 1GB minimum, 2GB for heavy usage
- **CPU**: 1 core minimum
- **Storage**: 4GB minimum for OS + application
- **Network**: Bridge mode with firewall enabled

This deployment provides a lightweight, efficient way to run your Smart iLO4 application with proper isolation and resource management in Proxmox using Debian 12 for optimal stability.
