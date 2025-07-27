# Quick Start: Smart iLO4 in Proxmox LXC

## ⚡ One-Command Installation (2 minutes)

### 🎯 Super Fast Deployment
```bash
# On Proxmox host - Just run this ONE command:
curl -sSL https://raw.githubusercontent.com/mandalorian92/Smart-ilo4/main/install-lxc.sh | bash
```

**That's it!** The installer will:
- 🔧 Download Debian 12 template (if needed)
- 🎮 Launch interactive setup wizard
- 📦 Create optimized LXC container (1GB RAM, 1 CPU, 4GB storage)
- 🚀 Clone and build the application automatically
- ⚙️ Configure systemd service with auto-start
- 🔥 Set up firewall and networking
- 🌐 Show you the access URL when complete

### 📋 What the Wizard Asks:
- Container ID (auto-suggested)
- Hostname (default: smart-ilo4)
- Memory (default: 1024MB)
- CPU cores (default: 1)
- Storage size (default: 4GB)
- Network settings (DHCP or static)
- **Your iLO4 credentials**
- Application port (default: 8443)

## 🔧 Manual Installation (Advanced Users)

<details>
<summary>Click to expand manual steps</summary>

### 1. Create LXC Container
```bash
# On Proxmox host
pct create 101 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname smart-ilo4 --memory 1024 --cores 1 --rootfs local-lvm:4 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp --onboot 1

pct start 101
```

### 2. Setup Container
```bash
# Enter container
pct enter 101

# Create user
useradd -m -s /bin/bash smartilo4
usermod -aG sudo smartilo4
su - smartilo4

# Run setup script
curl -sSL https://raw.githubusercontent.com/mandalorian92/Smart-ilo4/main/scripts/setup-lxc.sh | bash
```

### 3. Deploy Application
```bash
# Clone repository
git clone https://github.com/mandalorian92/Smart-ilo4.git ~/Smart-ilo4
cd ~/Smart-ilo4

# Configure
cp .env.template .env
nano .env  # Set your iLO4 credentials

# Build
npm install
cd frontend && npm install && npm run build && cd ..
npm run build

# Create service (as root)
exit
sudo /home/smartilo4/Smart-ilo4/scripts/create-service.sh

# Start
sudo systemctl start smart-ilo4
```

### 4. Access
```bash
# Get container IP
ip addr show eth0

# Visit: https://CONTAINER_IP:8443
```

</details>

## ✅ Verification Checklist

- [ ] Container created and started
- [ ] Node.js 20.x installed  
- [ ] Application cloned from GitHub
- [ ] Environment configured (.env file)
- [ ] Dependencies installed
- [ ] Application built successfully
- [ ] Systemd service created and running
- [ ] Firewall allows port 8443
- [ ] Application accessible via browser

## 🔧 Container Management

```bash
# Check container status
pct status 101

# View application logs
pct exec 101 -- journalctl -u smart-ilo4 -f

# Enter container console
pct enter 101

# Stop/Start container
pct stop 101
pct start 101

# Check if application port is listening
pct exec 101 -- netstat -tlnp | grep 8443

# Test iLO connectivity from container
pct exec 101 -- ping YOUR_ILO_IP
```

## 📁 File Structure
```
Container: /home/smartilo4/Smart-ilo4/
├── .env                    # Environment configuration
├── package.json           # Backend dependencies  
├── dist/                  # Built backend
├── frontend/
│   ├── build/            # Built frontend
│   └── package.json      # Frontend dependencies
└── ssl/                  # SSL certificates (auto-generated)
```

## 🚀 Resource Usage
- **Memory**: 1GB (optimal for this application)
- **CPU**: 1 core (sufficient for iLO4 monitoring)
- **Storage**: 4GB (includes OS + application + logs)
- **Network**: Minimal bandwidth required

---
**For detailed instructions, see:** `PROXMOX_LXC_DEPLOYMENT.md`
