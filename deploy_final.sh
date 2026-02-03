#!/bin/bash

################################################################################
# DEPLOY FINAL - BOTIA VPS                                                    #
# Este script vai fazer deploy do backend no VPS                              #
# Use: ssh root@46.202.147.151 < deploy_final.sh                             #
################################################################################

set -e  # Exit on error

echo "=================================================="
echo "BOTIA DEPLOY - CONTAINER FIX"
echo "=================================================="

# Verify location
if [ ! -d "/var/www/botia" ]; then
    echo "ERROR: /var/www/botia not found!"
    echo "Please ensure the repository is cloned to /var/www/botia"
    exit 1
fi

cd /var/www/botia
echo "✓ Working directory: $(pwd)"

# ============================================================================
# Step 1: Clean up old containers
# ============================================================================
echo ""
echo "[1/6] Cleaning up old containers..."
docker-compose down 2>&1 || true
sleep 1
docker rm -f botia-backend botia-postgres botia-redis 2>&1 || true
docker volume prune -f 2>&1 || true

# ============================================================================
# Step 2: Create docker-compose.yml
# ============================================================================
echo "[2/6] Creating docker-compose.yml..."
cat > docker-compose.yml << 'DOCKER_COMPOSE_EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: botia-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: botia_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: botia-redis
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - redis_data:/data

  backend:
    image: node:22-alpine
    container_name: botia-backend
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/botia_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: change-me-in-production
    volumes:
      - .:/app
    command: sh -c "npm ci --omit=dev && npm run prisma:migrate 2>&1 || true && node apps/backend/dist/main"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  postgres_data:
  redis_data:
DOCKER_COMPOSE_EOF

echo "✓ docker-compose.yml created"

# ============================================================================
# Step 3: Start containers
# ============================================================================
echo "[3/6] Starting containers..."
docker-compose up -d 2>&1 | head -20

# ============================================================================
# Step 4: Wait for services
# ============================================================================
echo "[4/6] Waiting for services to initialize..."
sleep 15

# ============================================================================
# Step 5: Check status
# ============================================================================
echo "[5/6] Checking container status..."
echo ""
docker-compose ps
echo ""

# ============================================================================
# Step 6: Verify backend
# ============================================================================
echo "[6/6] Testing backend health..."
echo ""

# Try to curl backend
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ Backend is responding!"
    curl -s http://localhost:3000/health
    echo ""
else
    echo "⚠ Backend not responding yet (might still be starting)"
    echo ""
    echo "Showing backend logs (last 50 lines):"
    docker logs botia-backend 2>&1 | tail -50
fi

echo ""
echo "=================================================="
echo "DEPLOY COMPLETED"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Check if backend responds: curl http://localhost:3000/health"
echo "2. View logs: docker logs botia-backend"
echo "3. Test in browser: https://apipgsoft.shop/"
echo ""
echo "If backend is not responding:"
echo "1. Check logs: docker logs botia-backend"
echo "2. Check postgres: docker logs botia-postgres"
echo "3. Check redis: docker logs botia-redis"
echo ""
