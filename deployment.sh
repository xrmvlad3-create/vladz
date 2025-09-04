#!/bin/bash

# IzaManagement Production Deployment Script
# Version: 2025.1.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="izamanagement"
BACKUP_DIR="/backups/izamanagement"
DEPLOY_USER="www-data"
DOMAIN="izamanagement.ro"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    error "Please run as root"
fi

log "Starting IzaManagement deployment..."

# 1. System Updates
log "Updating system packages..."
apt update && apt upgrade -y

# 2. Install Dependencies
log "Installing required packages..."
apt install -y \
    docker.io \
    docker-compose \
    git \
    curl \
    wget \
    unzip \
    nginx \
    certbot \
    python3-certbot-nginx \
    htop \
    iotop \
    postgresql-client-15

# 3. Start Docker
log "Starting Docker service..."
systemctl start docker
systemctl enable docker

# 4. Create project directory
log "Creating project structure..."
mkdir -p /var/www/$PROJECT_NAME
mkdir -p $BACKUP_DIR
mkdir -p /etc/nginx/ssl
mkdir -p /var/log/$PROJECT_NAME

# 5. Clone repository (assuming you have a Git repo)
log "Setting up project files..."
cd /var/www/$PROJECT_NAME

# Copy files from current directory if not using Git
if [ -d "/tmp/izamanagement-deploy" ]; then
    cp -r /tmp/izamanagement-deploy/* ./
    success "Project files copied"
else
    warning "Project files should be uploaded to /tmp/izamanagement-deploy/"
fi

# 6. Set permissions
log "Setting permissions..."
chown -R $DEPLOY_USER:$DEPLOY_USER /var/www/$PROJECT_NAME
chmod -R 755 /var/www/$PROJECT_NAME

# 7. Environment configuration
log "Configuring environment..."
if [ ! -f ".env" ]; then
    cp .env.production .env

    # Generate Laravel APP_KEY
    APP_KEY=$(openssl rand -base64 32)
    sed -i "s/your_app_key_here_generate_with_artisan/$APP_KEY/" .env

    # Generate secure passwords
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

    sed -i "s/secure_password_2025/$DB_PASSWORD/" .env
    sed -i "s/redis_password_here/$REDIS_PASSWORD/" .env

    success "Environment file created with secure passwords"
fi

# 8. SSL Certificate Setup
log "Setting up SSL certificates..."
if [ ! -f "/etc/nginx/ssl/fullchain.pem" ]; then
    # Stop nginx if running
    systemctl stop nginx || true

    # Get Let's Encrypt certificate
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@$DOMAIN \
        -d $DOMAIN \
        -d www.$DOMAIN \
        -d api.$DOMAIN

    # Copy certificates to nginx ssl directory
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/

    success "SSL certificates installed"
fi

# 9. Database Initialization
log "Preparing database..."
# Create database initialization script
cat > docker/postgres/init/01-init.sql << EOF
-- Create database if not exists
SELECT 'CREATE DATABASE izamanagement' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'izamanagement')\gexec

-- Create user if not exists
DO \$\$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'izauser') THEN
      CREATE ROLE izauser LOGIN PASSWORD '$DB_PASSWORD';
   END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE izamanagement TO izauser;

-- Enable extensions
\c izamanagement;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
EOF

# 10. Docker Services Setup
log "Starting Docker services..."
docker-compose down || true
docker-compose pull
docker-compose up -d

# Wait for services to start
sleep 30

# 11. Laravel Setup
log "Setting up Laravel application..."
docker-compose exec -T app composer install --no-dev --optimize-autoloader
docker-compose exec -T app php artisan key:generate
docker-compose exec -T app php artisan config:cache
docker-compose exec -T app php artisan route:cache
docker-compose exec -T app php artisan view:cache
docker-compose exec -T app php artisan migrate --force
docker-compose exec -T app php artisan db:seed --force
docker-compose exec -T app php artisan storage:link

# 12. Pull Ollama Models
log "Setting up Ollama AI models..."
docker-compose exec -d ollama ollama pull llama3.1:8b
docker-compose exec -d ollama ollama pull codellama:7b

# 13. Setup Monitoring
log "Configuring monitoring..."
# Install Grafana dashboards
if [ -d "docker/grafana/dashboards" ]; then
    docker-compose exec -T grafana grafana-cli plugins install grafana-clock-panel
    docker-compose restart grafana
fi

# 14. Setup Backup Cron Job
log "Setting up automated backups..."
cat > /etc/cron.d/izamanagement-backup << EOF
# IzaManagement automated backups
0 2 * * * root /var/www/$PROJECT_NAME/docker/backup/backup.sh
0 3 * * 0 root find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
EOF

# 15. Setup Log Rotation
log "Configuring log rotation..."
cat > /etc/logrotate.d/izamanagement << EOF
/var/www/$PROJECT_NAME/storage/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 $DEPLOY_USER $DEPLOY_USER
    postrotate
        docker-compose -f /var/www/$PROJECT_NAME/docker-compose.yml exec app php artisan queue:restart
    endscript
}
EOF

# 16. Firewall Configuration
log "Configuring firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# Allow internal Docker network
ufw allow from 172.20.0.0/16

# 17. System Monitoring Setup
log "Setting up system monitoring..."
# Install monitoring tools
apt install -y prometheus-node-exporter

# Configure Prometheus to scrape metrics
systemctl enable prometheus-node-exporter
systemctl start prometheus-node-exporter

# 18. Performance Optimizations
log "Applying performance optimizations..."

# PHP-FPM optimizations
cat > docker/php/local.ini << EOF
[PHP]
memory_limit = 512M
max_execution_time = 120
max_input_time = 60
upload_max_filesize = 100M
post_max_size = 100M
max_file_uploads = 20

[opcache]
opcache.enable = 1
opcache.memory_consumption = 256
opcache.interned_strings_buffer = 16
opcache.max_accelerated_files = 20000
opcache.validate_timestamps = 0
opcache.save_comments = 1
opcache.fast_shutdown = 1
EOF

# Redis optimizations
cat > docker/redis/redis.conf << EOF
maxmemory 256mb
maxmemory-policy allkeys-lru
save 60 1000
stop-writes-on-bgsave-error yes
rdbcompression yes
dbfilename dump.rdb
dir ./
EOF

# 19. Health Checks Setup
log "Setting up health checks..."
cat > /usr/local/bin/izamanagement-health.sh << 'EOF'
#!/bin/bash
# Health check script for IzaManagement

FAILED=0

# Check HTTP response
if ! curl -f -s -o /dev/null https://izamanagement.ro/health; then
    echo "ERROR: HTTP health check failed"
    FAILED=1
fi

# Check database connection
if ! docker-compose -f /var/www/izamanagement/docker-compose.yml exec -T app php artisan tinker --execute="DB::connection()->getPdo();" >/dev/null 2>&1; then
    echo "ERROR: Database connection failed"
    FAILED=1
fi

# Check AI services
if ! curl -f -s -o /dev/null http://localhost:11434/api/tags; then
    echo "WARNING: Ollama service not responding"
fi

# Check Redis
if ! docker-compose -f /var/www/izamanagement/docker-compose.yml exec -T redis redis-cli ping | grep -q PONG; then
    echo "ERROR: Redis connection failed"
    FAILED=1
fi

if [ $FAILED -eq 0 ]; then
    echo "OK: All services healthy"
    exit 0
else
    echo "CRITICAL: Some services failed"
    exit 1
fi
EOF

chmod +x /usr/local/bin/izamanagement-health.sh

# Add health check to cron
cat >> /etc/cron.d/izamanagement-backup << EOF
*/5 * * * * root /usr/local/bin/izamanagement-health.sh >> /var/log/izamanagement/health.log 2>&1
EOF

# 20. Final Security Hardening
log "Applying security hardening..."

# Disable unnecessary services
systemctl disable apache2 || true
systemctl stop apache2 || true

# Set up fail2ban for additional security
apt install -y fail2ban

cat > /etc/fail2ban/jail.d/nginx.conf << EOF
[nginx-http-auth]
enabled = true
port = http,https
logpath = %(nginx_error_log)s
maxretry = 3
bantime = 3600

[nginx-req-limit]
enabled = true
port = http,https
logpath = %(nginx_error_log)s
failregex = limiting requests, excess:.* by zone.*client: <HOST>
maxretry = 10
bantime = 3600
EOF

systemctl enable fail2ban
systemctl start fail2ban

# 21. Restart Services
log "Restarting all services..."
docker-compose down
docker-compose up -d

# Wait for services
sleep 45

# 22. Final Verification
log "Running final verification..."
if /usr/local/bin/izamanagement-health.sh; then
    success "Deployment completed successfully!"
    echo
    echo "🎉 IzaManagement is now deployed and running!"
    echo
    echo "📊 Access Points:"
    echo "   • Main App: https://$DOMAIN"
    echo "   • API: https://api.$DOMAIN"
    echo "   • Monitoring: https://$DOMAIN:3000 (admin/admin2025)"
    echo "   • Metrics: https://$DOMAIN:9090"
    echo
    echo "🔧 Useful Commands:"
    echo "   • View logs: docker-compose logs -f"
    echo "   • Restart services: docker-compose restart"
    echo "   • Health check: /usr/local/bin/izamanagement-health.sh"
    echo "   • Database backup: docker/backup/backup.sh"
    echo
    echo "🚀 IzaManagement v2025.1.0 - Production Ready!"
else
    error "Deployment verification failed. Check logs for details."
fi

log "Deployment completed!"
