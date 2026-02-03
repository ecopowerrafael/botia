#!/bin/bash

echo "🔧 Iniciando fix do VPS..."

# 1. Fix DATABASE_URL no .env
echo "1️⃣  Corrigindo DATABASE_URL no .env..."
sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bot_ia"|' /app/apps/backend/.env
echo "✓ .env atualizado:"
grep DATABASE /app/apps/backend/.env

# 2. Copy correct schema.prisma from GitHub clone
echo ""
echo "2️⃣  Copiando schema.prisma correto..."
if [ -f "/tmp/botia/prisma/schema.prisma" ]; then
  cp /tmp/botia/prisma/schema.prisma /app/prisma/schema.prisma
  echo "✓ schema.prisma copiado de /tmp/botia/"
else
  echo "⚠️  /tmp/botia/prisma/schema.prisma não encontrado!"
fi

# 3. Regenerate Prisma
echo ""
echo "3️⃣  Regenerando Prisma..."
cd /app/apps/backend
npx prisma generate 2>&1 | head -20
echo "✓ Prisma regenerado"

# 4. Restart backend
echo ""
echo "4️⃣  Reiniciando backend..."
pkill -9 -f 'node dist/main' || true
sleep 2
npm run start:prod > /var/log/backend.log 2>&1 &
echo "✓ Backend iniciado em background"

# 5. Wait and check status
echo ""
echo "5️⃣  Aguardando 5 segundos e verificando status..."
sleep 5

if ps aux | grep -q '[n]ode dist/main'; then
  echo "✅ Backend está rodando!"
else
  echo "⚠️  Backend pode não estar rodando, verificando logs..."
fi

echo ""
echo "📋 Logs da última execução:"
tail -20 /var/log/backend.log

echo ""
echo "🔍 Verificando porta 3000..."
netstat -tlnp | grep 3000 || echo "Aguardando inicialização..."

echo ""
echo "✨ Fix completo!"
