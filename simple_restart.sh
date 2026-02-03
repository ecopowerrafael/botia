#!/bin/bash

# Script MUITO simples - apenas restart dos containers
# Use: ssh root@46.202.147.151 < simple_restart.sh

cd /var/www/botia

# Kill old ones
docker kill botia-backend botia-postgres botia-redis 2>/dev/null || true
sleep 2

# Remove
docker rm botia-backend botia-postgres botia-redis 2>/dev/null || true
sleep 1

# Start postgres first
echo "Starting postgres..."
docker run -d \
  --name botia-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=botia_db \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine

sleep 5

# Start redis
echo "Starting redis..."
docker run -d \
  --name botia-redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine

sleep 3

# Start backend
echo "Starting backend..."
docker run -d \
  --name botia-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://postgres:postgres@postgres:5432/botia_db \
  -e REDIS_URL=redis://redis:6379 \
  -w /app \
  -v /var/www/botia:/app \
  --link botia-postgres:postgres \
  --link botia-redis:redis \
  node:22-alpine \
  sh -c "npm ci --omit=dev && node apps/backend/dist/main"

sleep 10

echo ""
echo "Status:"
docker ps -a

echo ""
echo "Logs (backend):"
docker logs botia-backend | tail -30

echo ""
echo "Test:"
curl http://localhost:3000/health || echo "Not yet..."
