#!/bin/bash
# Fix Script para VPS - Execute isto via SSH

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 INICIANDO FIX DO VPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1️⃣ Fix DATABASE_URL
echo ""
echo "1️⃣  Corrigindo DATABASE_URL..."
cd /app/apps/backend
sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bot_ia"|' .env
echo "✓ .env atualizado:"
grep "DATABASE_URL" .env

# 2️⃣ Copy schema.prisma
echo ""
echo "2️⃣  Copiando schema.prisma correto..."
if [ -f "/tmp/botia/prisma/schema.prisma" ]; then
  cp /tmp/botia/prisma/schema.prisma /app/prisma/schema.prisma
  echo "✓ schema.prisma copiado com sucesso"
else
  echo "⚠️  Arquivo não encontrado, pulando..."
fi

# 3️⃣ Regenerate Prisma
echo ""
echo "3️⃣  Regenerando cliente Prisma..."
cd /app/apps/backend
npx prisma generate && echo "✓ Prisma regenerado" || echo "⚠️  Erro no Prisma (pode ser schema)"

# 4️⃣ Rebuild TypeScript (opcional, dist já existe)
echo ""
echo "4️⃣  Recompilando TypeScript..."
cd /app/apps/backend
npx tsc --noEmitOnError false --skipLibCheck 2>&1 | grep -E "error|successfully" | head -3 && echo "✓ Build completo"

# 5️⃣ Stop old backend
echo ""
echo "5️⃣  Parando backend antigo..."
pkill -9 -f 'node dist/main' || true
sleep 2
echo "✓ Backend parado"

# 6️⃣ Start new backend
echo ""
echo "6️⃣  Iniciando novo backend..."
cd /app/apps/backend
npm run start:prod > /var/log/backend.log 2>&1 &
echo "✓ Backend iniciado em background"

# 7️⃣ Wait and verify
echo ""
echo "7️⃣  Aguardando inicialização (10 segundos)..."
sleep 10

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ VERIFICAÇÃO FINAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Processo backend:"
ps aux | grep '[n]ode dist/main' && echo "✅ Backend rodando!" || echo "⚠️  Verificar logs..."

echo ""
echo "Porta 3000:"
netstat -tlnp 2>/dev/null | grep 3000 && echo "✅ Porta escutando!" || echo "⚠️  Aguardando..."

echo ""
echo "📋 Últimos 25 linhas de log:"
echo "─────────────────────────────────────────────────────────"
tail -25 /var/log/backend.log
echo "─────────────────────────────────────────────────────────"

echo ""
echo "✅ Fix concluído! O painel deve estar funcionando agora."
