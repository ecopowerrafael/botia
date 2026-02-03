#!/bin/bash
# Reset VPS para Prisma 5.19.0

echo "========================================"
echo "🔄 Reset VPS - Prisma 5.19.0"
echo "========================================"
echo ""

cd /app || mkdir -p /app && cd /app

echo "[1/8] Parar PM2..."
pm2 stop all 2>/dev/null || true
echo "✅"
echo ""

echo "[2/8] Status atual..."
echo "Prisma version:"
grep prisma package.json 2>/dev/null | head -3
echo "✅"
echo ""

echo "[3/8] Git fetch..."
git fetch origin main 2>/dev/null
echo "✅"
echo ""

echo "[4/8] Git reset..."
git reset --hard origin/main 2>&1 | tail -3
echo "✅"
echo ""

echo "[5/8] Limpar node_modules..."
rm -rf node_modules apps/*/node_modules package-lock.json apps/*/package-lock.json 2>/dev/null
echo "✅"
echo ""

echo "[6/8] npm install..."
npm install --legacy-peer-deps 2>&1 | tail -2
echo "✅"
echo ""

echo "[7/8] npm build..."
npm run build 2>&1 | tail -2
echo "✅"
echo ""

echo "[8/8] PM2 restart..."
pm2 restart all 2>/dev/null || pm2 start "npm start" --name backend
echo "✅"
echo ""

echo "========================================"
echo "Verificar Prisma:"
grep prisma package.json | head -3
echo "========================================"
