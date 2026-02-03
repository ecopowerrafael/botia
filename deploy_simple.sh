#!/bin/bash

echo "=========================================="
echo "DEPLOY - Ultra Simplified Version"
echo "=========================================="

# Navigate to project
cd /var/www/botia || { echo "Project not found"; exit 1; }

echo -e "\n[Step 1] Stop everything..."
docker-compose down -v 2>&1 || true
docker rm -f botia-backend botia-postgres botia-redis 2>&1 || true

echo -e "\n[Step 2] Create simple docker-compose.yml..."
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
    restart: unless-stopped

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
    restart: unless-stopped

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
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - .:/app
    command: sh -c "
      cd /app &&
      npm ci --omit=dev &&
      npm run prisma:migrate 2>&1 || true &&
      node apps/backend/dist/main
    "
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
EOFCOMPOSE

echo -e "\n[Step 3] Start containers..."
docker-compose up -d

echo -e "\n[Step 4] Wait for services..."
sleep 10

echo -e "\n[Step 5] Container status..."
docker-compose ps

echo -e "\n[Step 6] Check backend startup..."
docker logs botia-backend 2>&1 | tail -30

echo -e "\n[Step 7] Test health endpoint..."
curl -s http://localhost:3000/health || echo "Not yet responding"

echo "Done!"
