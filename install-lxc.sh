#!/bin/bash

# Smart iLO4 - One-Command LXC Container Installer for Proxmox
# Usage: curl -sSL https://raw.githubusercontent.com/mandalorian92/Smart-ilo4/main/install-lxc.sh | bash

set -e

# C# Create LXC container
create_container() {
    print_step "Creating LXC container $CTID..."
    
    # Get the full template path
    local template_path=$(ensure_template)
    
    pct create $CTID \
        "$template_path" \
        --hostname $HOSTNAME \
        --memory $MEMORY \
        --cores $CORES \
        --rootfs $STORAGE_LOC:$STORAGE \
        --net0 name=eth0,bridge=$BRIDGE,firewall=1,$IP_CONFIG \
        --onboot 1 \
        --unprivileged 1 \
        --features nesting=1
    
    print_success "Container $CTID created"
}RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    Smart iLO4 LXC Installer                     ║"
    echo "║                        Proxmox Edition                          ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${CYAN}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running on Proxmox
check_proxmox() {
    if ! command -v pct >/dev/null 2>&1; then
        print_error "This script must be run on a Proxmox VE host"
        exit 1
    fi
}

# Get next available container ID
get_next_ctid() {
    local ctid=100
    while pct status $ctid >/dev/null 2>&1; do
        ((ctid++))
    done
    echo $ctid
}

# Get available container storage
get_container_storage() {
    # Find storage that supports container images/rootfs
    pvesm status -content images | tail -n +2 | awk '{print $1}' | head -1
}

# Get available template storage
get_template_storage() {
    # Find storage that supports templates
    local template_storage=$(pvesm status -content vztmpl | tail -n +2 | awk '{print $1}' | head -1)
    
    if [ -z "$template_storage" ]; then
        print_error "No storage found that supports templates!"
        echo "Available storage:"
        pvesm status
        echo
        echo "Please configure at least one storage to support 'VZDump backup file, VM templates' content types."
        exit 1
    fi
    
    echo "$template_storage"
}

# Download Debian template if not exists
ensure_template() {
    local template_storage=$(get_template_storage)
    local template="debian-12-standard_12.7-1_amd64.tar.zst"
    
    print_info "Using storage '$template_storage' for templates"
    
    if ! pveam list "$template_storage" | grep -q "$template"; then
        print_step "Downloading Debian 12 template to '$template_storage'..."
        pveam update
        if ! pveam download "$template_storage" "$template"; then
            print_error "Failed to download template to '$template_storage'"
            echo "Available template storage:"
            pvesm status -content vztmpl
            exit 1
        fi
        print_success "Template downloaded to '$template_storage'"
    else
        print_success "Debian 12 template already available in '$template_storage'"
    fi
    
    # Return the full template path for use in container creation
    echo "$template_storage:vztmpl/$template"
}

# Interactive configuration wizard
run_wizard() {
    print_header
    echo -e "${BLUE}Welcome to the Smart iLO4 LXC Container Setup Wizard!${NC}"
    echo -e "${BLUE}Using Debian 12 template for optimal performance and stability.${NC}"
    echo
    
    # Container ID
    local suggested_ctid=$(get_next_ctid)
    echo -e "${YELLOW}Container Configuration:${NC}"
    read -p "Enter Container ID [$suggested_ctid]: " CTID
    CTID=${CTID:-$suggested_ctid}
    
    # Hostname
    read -p "Enter hostname [smart-ilo4]: " HOSTNAME
    HOSTNAME=${HOSTNAME:-smart-ilo4}
    
    # Memory
    read -p "Enter memory in MB [1024]: " MEMORY
    MEMORY=${MEMORY:-1024}
    
    # CPU cores
    read -p "Enter CPU cores [1]: " CORES
    CORES=${CORES:-1}
    
    # Storage
    read -p "Enter root filesystem size in GB [4]: " STORAGE
    STORAGE=${STORAGE:-4}
    
    # Network bridge
    read -p "Enter network bridge [vmbr0]: " BRIDGE
    BRIDGE=${BRIDGE:-vmbr0}
    
    # IP configuration
    echo
    echo -e "${YELLOW}Network Configuration:${NC}"
    echo "1) DHCP (automatic)"
    echo "2) Static IP"
    read -p "Select network configuration [1]: " NET_CHOICE
    NET_CHOICE=${NET_CHOICE:-1}
    
    if [ "$NET_CHOICE" = "2" ]; then
        read -p "Enter static IP (e.g., 192.168.1.100/24): " STATIC_IP
        read -p "Enter gateway IP: " GATEWAY
        IP_CONFIG="ip=$STATIC_IP,gw=$GATEWAY"
    else
        IP_CONFIG="ip=dhcp"
    fi
    
    # Storage location
    echo
    echo -e "${YELLOW}Storage Configuration:${NC}"
    echo "Available container storage:"
    pvesm status -content images | tail -n +2 | awk '{printf "  - %s\n", $1}'
    echo
    local suggested_storage=$(get_container_storage)
    if [ -z "$suggested_storage" ]; then
        suggested_storage="local-lvm"
    fi
    read -p "Enter storage location [$suggested_storage]: " STORAGE_LOC
    STORAGE_LOC=${STORAGE_LOC:-$suggested_storage}
    
    # iLO4 Configuration
    echo
    echo -e "${YELLOW}iLO4 Configuration (will be set inside container):${NC}"
    read -p "Enter iLO4 IP address: " ILO_HOST
    read -p "Enter iLO4 username: " ILO_USERNAME
    read -s -p "Enter iLO4 password: " ILO_PASSWORD
    echo
    
    # Application port
    read -p "Enter application port [8443]: " APP_PORT
    APP_PORT=${APP_PORT:-8443}
    
    # Confirmation
    echo
    echo -e "${CYAN}Configuration Summary:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Container ID: $CTID"
    echo "Hostname: $HOSTNAME"
    echo "Memory: ${MEMORY}MB"
    echo "CPU Cores: $CORES"
    echo "Storage: ${STORAGE}GB on $STORAGE_LOC"
    echo "Network: $BRIDGE ($IP_CONFIG)"
    echo "iLO4 Host: $ILO_HOST"
    echo "iLO4 User: $ILO_USERNAME"
    echo "App Port: $APP_PORT"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    
    read -p "Proceed with installation? [y/N]: " CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        print_warning "Installation cancelled"
        exit 0
    fi
}

# Create LXC container
create_container() {
    print_step "Creating LXC container $CTID..."
    
    pct create $CTID \
        local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
        --hostname $HOSTNAME \
        --memory $MEMORY \
        --cores $CORES \
        --rootfs $STORAGE_LOC:$STORAGE \
        --net0 name=eth0,bridge=$BRIDGE,firewall=1,$IP_CONFIG \
        --onboot 1 \
        --unprivileged 1 \
        --features nesting=1
    
    print_success "Container $CTID created"
}

# Start container
start_container() {
    print_step "Starting container $CTID..."
    pct start $CTID
    
    # Wait for container to be ready
    print_step "Waiting for container to be ready..."
    sleep 10
    
    print_success "Container $CTID started"
}

# Setup container environment
setup_container() {
    print_step "Setting up container environment..."
    
    # Update system
    pct exec $CTID -- bash -c "apt update && apt upgrade -y"
    
    # Install essential packages
    pct exec $CTID -- bash -c "apt install -y curl wget git unzip htop nano ufw sudo ca-certificates gnupg"
    
    # Install Node.js 20.x (Debian-specific method)
    pct exec $CTID -- bash -c "curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg"
    pct exec $CTID -- bash -c "echo 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main' | tee /etc/apt/sources.list.d/nodesource.list"
    pct exec $CTID -- bash -c "apt update && apt install -y nodejs"
    
    # Create application user
    pct exec $CTID -- bash -c "useradd -m -s /bin/bash smartilo4"
    pct exec $CTID -- bash -c "usermod -aG sudo smartilo4"
    pct exec $CTID -- bash -c "echo 'smartilo4 ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers"
    
    print_success "Container environment setup complete"
}

# Deploy application
deploy_application() {
    print_step "Deploying Smart iLO4 application..."
    
    # Clone repository
    pct exec $CTID -- su - smartilo4 -c "git clone https://github.com/mandalorian92/Smart-ilo4.git"
    
    # Create environment file
    pct exec $CTID -- su - smartilo4 -c "cat > Smart-ilo4/.env << EOF
ILO_HOST=$ILO_HOST
ILO_USERNAME=$ILO_USERNAME
ILO_PASSWORD=$ILO_PASSWORD
PORT=$APP_PORT
NODE_ENV=production
EOF"
    
    # Install backend dependencies
    pct exec $CTID -- su - smartilo4 -c "cd Smart-ilo4 && npm install"
    
    # Install frontend dependencies and build
    pct exec $CTID -- su - smartilo4 -c "cd Smart-ilo4/frontend && npm install && npm run build"
    
    # Build backend
    pct exec $CTID -- su - smartilo4 -c "cd Smart-ilo4 && npm run build"
    
    print_success "Application deployed and built"
}

# Create systemd service
create_service() {
    print_step "Creating systemd service..."
    
    pct exec $CTID -- bash -c "cat > /etc/systemd/system/smart-ilo4.service << 'EOF'
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
Environment=PORT=$APP_PORT

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/home/smartilo4/Smart-ilo4

[Install]
WantedBy=multi-user.target
EOF"
    
    # Enable and start service
    pct exec $CTID -- systemctl daemon-reload
    pct exec $CTID -- systemctl enable smart-ilo4
    pct exec $CTID -- systemctl start smart-ilo4
    
    print_success "Systemd service created and started"
}

# Configure firewall
configure_firewall() {
    print_step "Configuring firewall..."
    
    pct exec $CTID -- ufw allow $APP_PORT/tcp
    pct exec $CTID -- ufw --force enable
    
    print_success "Firewall configured"
}

# Get container IP
get_container_ip() {
    local ip=$(pct exec $CTID -- ip route get 1 | grep -oP 'src \K\S+')
    echo $ip
}

# Final status and instructions
show_completion() {
    local container_ip=$(get_container_ip)
    
    echo
    print_success "🎉 Smart iLO4 LXC Container Installation Complete!"
    echo
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Container Details:${NC}"
    echo "  Container ID: $CTID"
    echo "  Hostname: $HOSTNAME"
    echo "  IP Address: $container_ip"
    echo "  Application Port: $APP_PORT"
    echo
    echo -e "${GREEN}Access Your Application:${NC}"
    echo "  🌐 Web Interface: https://$container_ip:$APP_PORT"
    echo
    echo -e "${GREEN}Container Management:${NC}"
    echo "  📊 Status: pct status $CTID"
    echo "  🔍 Logs: pct exec $CTID -- journalctl -u smart-ilo4 -f"
    echo "  🖥️  Console: pct enter $CTID"
    echo "  ⏸️  Stop: pct stop $CTID"
    echo "  ▶️  Start: pct start $CTID"
    echo
    echo -e "${GREEN}Service Management (inside container):${NC}"
    echo "  📊 Status: sudo systemctl status smart-ilo4"
    echo "  🔄 Restart: sudo systemctl restart smart-ilo4"
    echo "  📋 Logs: sudo journalctl -u smart-ilo4 -f"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
    print_info "The application should be accessible in a few moments"
    print_info "If you need to troubleshoot, use: pct enter $CTID"
}

# Main installation process
main() {
    # Check prerequisites
    check_proxmox
    
    # Run configuration wizard
    run_wizard
    
    # Ensure template is available (this will also return the template path)
    ensure_template > /dev/null
    
    # Installation steps
    create_container
    start_container
    setup_container
    deploy_application
    create_service
    configure_firewall
    
    # Show completion info
    show_completion
}

# Error handling
trap 'print_error "Installation failed! Check the output above for details."' ERR

# Run main function
main "$@"
