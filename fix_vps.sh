#!/bin/bash

echo "=========================================="
echo "FIXING DOCKER CONTAINERS ON VPS"
echo "=========================================="

cd /var/www/botia || exit 1

echo -e "\n[1] Stopping old containers..."
docker-compose down 2>&1 || true

echo -e "\n[2] Removing dangling containers..."
docker rm -f botia-backend botia-postgres botia-redis 2>&1 || true

echo -e "\n[3] Pruning unused Docker resources..."
docker system prune -f 2>&1 || true

echo -e "\n[4] Creating new docker-compose.yml..."
cat > docker-compose.yml << 'EOFCOMPOSE'
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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - botia-network

  redis:
    image: redis:7-alpine
    container_name: botia-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - botia-network

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile.prod
    container_name: botia-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/botia_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key-change-in-production
      API_URL: https://apipgsoft.shop/api
      FRONTEND_URL: https://apipgsoft.shop
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: sh -c "npm run prisma:migrate 2>&1 || true; node apps/backend/dist/main"
    networks:
      - botia-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data:
  redis_data:

networks:
  botia-network:
    driver: bridge
EOFCOMPOSE

echo -e "\n[5] Building Docker images..."
docker-compose build 2>&1 | head -50

echo -e "\n[6] Starting containers..."
docker-compose up -d 2>&1

echo -e "\n[7] Waiting for services to be ready..."
sleep 5

echo -e "\n[8] Checking container status..."
docker-compose ps -a

echo -e "\n[9] Checking backend logs (last 20 lines)..."
docker logs botia-backend 2>&1 | tail -20

echo -e "\n[10] Testing backend health..."
curl -s http://localhost:3000/health && echo || echo "Backend not responding yet"

echo -e "\n[11] Checking if postgres is accessible..."
docker exec botia-postgres pg_isready -U postgres || echo "Postgres not ready"

echo -e "\n[12] Checking if redis is accessible..."
docker exec botia-redis redis-cli ping || echo "Redis not ready"

echo -e "\n=========================================="
echo "Deploy completed!"
echo "=========================================="
echo ""
echo "Container status:"
docker ps -a
