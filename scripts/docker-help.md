# Docker Deployment Scripts

## Quick Start
```bash
# Copy environment file and customize
cp .env.example .env

# Build and start the application
./scripts/docker-start.sh

# Or manually:
docker-compose up -d --build
```

## Management Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f smart-ilo4

# Restart application
docker-compose restart smart-ilo4

# Update application
docker-compose down
docker-compose up -d --build

# Access container shell
docker-compose exec smart-ilo4 sh
```

## Data Backup
```bash
# Backup all persistent data
./scripts/backup-data.sh

# Restore data
./scripts/restore-data.sh backup-file.tar.gz
```

## SSL Certificate Setup
```bash
# Generate self-signed certificates
./scripts/generate-ssl.sh

# Or provide your own certificates in the ssl/ directory
```
