#!/bin/bash
set -e

echo "=========================================="
echo "🚀 SETUP BOTIA - HOSTINGER VPS"
echo "=========================================="

# 1. Setup PostgreSQL
echo "1️⃣  Setup PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE botia_db;" 2>/dev/null || echo "✓ DB já existe"
sudo -u postgres psql -c "CREATE USER botia_user WITH PASSWORD 'BotIA2025@Secure';" 2>/dev/null || echo "✓ Usuário já existe"
sudo -u postgres psql -c "ALTER USER botia_user CREATEDB;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE botia_db TO botia_user;"
sudo -u postgres psql -d botia_db -c "GRANT ALL ON SCHEMA public TO botia_user;"
echo "✅ PostgreSQL OK"

# 2. Redis
echo "2️⃣  Redis..."
systemctl is-active redis-server > /dev/null && echo "✅ Redis rodando" || systemctl start redis-server
echo "✅ Redis OK"

# 3. App
echo "3️⃣  Iniciando aplicação..."
cd /app/apps/backend
export DATABASE_URL="postgresql://botia_user:BotIA2025@Secure@localhost:5432/botia_db"
export REDIS_HOST=localhost
export REDIS_PORT=6379
export NODE_ENV=production
export PORT=3000

npx prisma migrate deploy || echo "✓ Migrations já aplicadas"
npm run start:prod &
sleep 2
echo "✅ APP INICIADA!"
ps aux | grep "node dist/main" | grep -v grep
