#!/bin/bash

# Smart-iLO4 Docker Start Script
# This script sets up and starts the Smart-iLO4 application using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Smart-iLO4 Application${NC}"
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed. Please install docker-compose and try again.${NC}"
    exit 1
fi

# Create directories if they don't exist
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p data ssl config logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📋 Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env file to configure your iLO settings${NC}"
fi

# Check if SSL certificates exist
if [ ! -f ssl/certificate.crt ] || [ ! -f ssl/private.key ]; then
    echo -e "${YELLOW}🔐 SSL certificates not found. Generating self-signed certificates...${NC}"
    
    # Generate self-signed SSL certificate
    openssl req -x509 -newkey rsa:4096 -keyout ssl/private.key -out ssl/certificate.crt -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
        2>/dev/null || {
        echo -e "${RED}❌ Failed to generate SSL certificates. Please install openssl or provide your own certificates.${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Self-signed SSL certificates generated${NC}"
fi

# Set proper permissions
chmod 600 ssl/private.key
chmod 644 ssl/certificate.crt

# Start the application
echo -e "${BLUE}🐳 Starting Docker containers...${NC}"
docker-compose up -d --build

# Wait for the application to start
echo -e "${YELLOW}⏳ Waiting for application to start...${NC}"
sleep 10

# Check if the application is running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Smart-iLO4 is running successfully!${NC}"
    echo ""
    echo -e "${BLUE}📱 Access the application at:${NC}"
    echo -e "   🌐 HTTPS: ${GREEN}https://localhost:8443${NC}"
    echo -e "   🌐 HTTP:  ${GREEN}http://localhost:8080${NC} (if enabled)"
    echo ""
    echo -e "${BLUE}📊 Useful commands:${NC}"
    echo -e "   📋 View logs:    ${YELLOW}docker-compose logs -f smart-ilo4${NC}"
    echo -e "   🔄 Restart:      ${YELLOW}docker-compose restart smart-ilo4${NC}"
    echo -e "   🛑 Stop:         ${YELLOW}docker-compose down${NC}"
    echo -e "   📈 Status:       ${YELLOW}docker-compose ps${NC}"
    echo ""
    echo -e "${BLUE}💾 Data persistence:${NC}"
    echo -e "   📁 Database:     ${GREEN}./data/historical.db${NC}"
    echo -e "   🔐 SSL certs:    ${GREEN}./ssl/${NC}"
    echo -e "   ⚙️  Config:       ${GREEN}./config/${NC}"
    echo -e "   📝 Logs:         ${GREEN}./logs/${NC}"
else
    echo -e "${RED}❌ Failed to start Smart-iLO4. Check the logs:${NC}"
    echo -e "   ${YELLOW}docker-compose logs smart-ilo4${NC}"
    exit 1
fi
